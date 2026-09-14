from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.utils import secure_filename
from app.models.user import User
from app import db
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import timedelta
import os
import uuid
import re
import jwt as pyjwt

auth_bp = Blueprint('auth', __name__)

VALID_ROLES = {'farmer', 'buyer', 'processor', 'fpo', 'admin'}


def _error(code, message, status):
    return jsonify({'success': False, 'error': {'code': code, 'message': message}}), status


def _google_audiences():
    client_ids = [current_app.config.get('GOOGLE_CLIENT_ID') or '']
    client_ids.extend(current_app.config.get('GOOGLE_CLIENT_IDS') or [])
    return {c for c in client_ids if c}


@auth_bp.route('/config', methods=['GET'])
def public_config():
    """Public client configuration (no secrets — only a public OAuth client ID)."""
    return jsonify({'success': True, 'data': {
        'clientId': current_app.config.get('GOOGLE_CLIENT_ID') or '',
    }}), 200


@auth_bp.route('/google', methods=['POST'])
def google_login():
    """Sign in (or register) with a Google ID token from Google Identity Services.

    The frontend obtains the credential via Google's own JS SDK and posts it here;
    the backend verifies signature/audience/expiry against Google's public keys
    (cached ~1h) and then links or creates the account.

    Response payloads:
      200 {token, user}                          — existing or fully provisioned user
      200 {needs_role: true, token, profile}     — new Google user; role still required
      400 { role, phone? }                       — role/phone completion request
    """
    data = request.get_json(silent=True) or {}
    credential = (data.get('credential') or data.get('id_token') or '').strip()

    # -------------------------------------------------------------
    # Step 2 (optional): complete a needs-role account after the
    # user picked a role (and phone, if required) on the frontend.
    # -------------------------------------------------------------
    if not credential and data.get('complete'):
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if not identity:
            return _error('401', 'Sign in with Google first', 401)
        user = User.query.get(identity)
        if not user:
            return _error('404', 'User not found', 404)
        if user.role not in (None, ''):
            return _error('400', 'Account already has a role', 400)
        role = (data.get('role') or '').strip()
        if role not in VALID_ROLES:
            return _error('400', 'Valid role is required (farmer/buyer/processor/fpo/admin)', 400)
        user.role = role
        phone = (data.get('phone') or '').strip()
        if phone:
            if User.query.filter(User.phone == phone, User.id != user.id).first():
                return _error('409', 'Phone already registered', 409)
            user.phone = phone
        db.session.commit()
        access_token = create_access_token(identity=str(user.id))
        return jsonify({'success': True, 'data': {'token': access_token, 'user': user.to_dict()}}), 200

    # -------------------------------------------------------------
    # Step 1: verify the Google credential.
    # -------------------------------------------------------------
    if not credential:
        return _error('400', 'Google credential is required', 400)

    audiences = _google_audiences()
    try:
        header = pyjwt.get_unverified_header(credential)
        jwks_client = pyjwt.PyJWKClient('https://www.googleapis.com/oauth2/v3/certs', cache_keys=True)
        signing_key = jwks_client.get_signing_key_from_jwt(credential)
        claims = pyjwt.decode(
            credential,
            signing_key.key,
            algorithms=['RS256'],
            audience=audiences or None,
            options={'require': ['exp', 'iss', 'aud', 'sub']},
            issuer=('https://accounts.google.com', 'accounts.google.com'),
        )
    except pyjwt.PyJWKClientError:
        current_app.logger.warning('Google token: no matching signing key')
        return _error('401', 'Invalid Google credential', 401)
    except pyjwt.InvalidTokenError as exc:
        current_app.logger.warning('Google token rejected: %s', exc)
        return _error('401', 'Invalid or expired Google credential', 401)

    if audiences and claims.get('aud') not in audiences:
        return _error('401', 'Google credential was issued for a different app', 401)
    if claims.get('email_verified') is False:
        return _error('401', 'Google account email is not verified', 401)

    google_sub = claims['sub']
    g_email = (claims.get('email') or '').strip() or None
    g_name = (claims.get('name') or '').strip()
    g_picture = (claims.get('picture') or '').strip() or None

    # -------------------------------------------------------------
    # Link or create the local account.
    # -------------------------------------------------------------
    user = User.query.filter_by(google_sub=google_sub).first()
    if not user and g_email:
        user = User.query.filter_by(email=g_email).first()
        if user:
            if user.google_sub:
                return _error('409', 'This Google account is linked to a different user', 409)
            user.google_sub = google_sub  # link existing account by verified email

    if not user:
        # New Google user: no password and no phone yet. They choose a role
        # next (phone optional); the frontend posts back `complete: true`.
        suffix = uuid.uuid4().hex[:8]
        import secrets
        otp = f'{secrets.randbelow(10000):04d}'
        user = User(
            name=g_name or (g_email.split('@')[0] if g_email else f'Google User {suffix}'),
            email=g_email,
            phone=f'google-{suffix}',
            role='',
        )
        # Google-only account: no password (empty hash). The login guard
        # recognizes this and points the user at the Google button.
        user.password_hash = ''
        user.google_sub = google_sub
        user.verification_status = 'verified' if g_email else 'unverified'
        db.session.add(user)
        db.session.commit()

    if not user.is_active:
        return _error('403', 'Account is suspended. Contact support.', 403)

    if g_picture and not user.avatar_path:
        user.avatar_path = g_picture
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    if user.role in (None, ''):
        return jsonify({'success': True, 'data': {
            'needs_role': True,
            'token': access_token,
            'profile': user.to_dict(),
        }}), 200

    return jsonify({'success': True, 'data': {'token': access_token, 'user': user.to_dict()}}), 200


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}

    name = (data.get('name') or '').strip()
    phone = (data.get('phone') or '').strip()
    password = data.get('password') or ''
    role = (data.get('role') or '').strip()
    email = (data.get('email') or '').strip().lower()

    if not name:
        return _error('400', 'Name is required', 400)
    if not phone:
        return _error('400', 'Phone is required', 400)
    if not re.fullmatch(r'\+?[0-9]{10,15}', phone):
        return _error('400', 'Enter a valid phone number', 400)
    if not password or len(password) < 6:
        return _error('400', 'Password must be at least 6 characters', 400)
    if role not in VALID_ROLES:
        return _error('400', 'Valid role is required (farmer/buyer/processor/fpo/admin)', 400)

    if User.query.filter_by(phone=phone).first():
        return _error('409', 'Phone already registered', 409)

    if not re.fullmatch(r'[^@\s]+@[^@\s]+\.[^@\s]+', email):
        return _error('400', 'A valid email is required', 400)
    if User.query.filter_by(email=email).first():
        return _error('409', 'Email already registered', 409)

    user = User(
        name=name,
        email=email,
        phone=phone,
        role=role
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    access_token = create_access_token(identity=str(user.id))
    return jsonify({'success': True, 'data': {'token': access_token, 'user': user.to_dict()}}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}

    identifier = (data.get('email') or data.get('phone') or data.get('identifier') or '').strip()
    password = data.get('password') or ''

    if not identifier or not password:
        return _error('400', 'Email/phone and password are required', 400)

    # Allow login with either email or phone
    user = User.query.filter(
        (User.email == identifier) | (User.phone == identifier)
    ).first()

    # Google-only accounts carry an empty password hash: point them at
    # Google sign-in before check_password, so an empty hash never
    # reaches werkzeug and the user gets an actionable message.
    if user and not user.password_hash:
        return _error('403', 'This account signs in with Google. Use the Google button, then set a phone in your profile.', 403)

    if not user or not user.check_password(password):
        return _error('401', 'Invalid credentials', 401)

    if not user.is_active:
        return _error('403', 'Account is suspended. Contact support.', 403)

    access_token = create_access_token(identity=str(user.id))
    return jsonify({'success': True, 'data': {'token': access_token, 'user': user.to_dict()}}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'error': {'code': '404', 'message': 'User not found'}}), 404
    return jsonify({'success': True, 'data': user.to_dict()}), 200

@auth_bp.route('/profile', methods=['PUT', 'POST'])
@jwt_required()
def update_profile():
    user = User.query.get(get_jwt_identity())
    if not user:
        return _error('404', 'User not found', 404)
    data = request.form if request.form else (request.get_json(silent=True) or {})
    for field in ('name', 'email', 'phone', 'business_name', 'location', 'state', 'district', 'village'):
        if field in data and str(data[field]).strip():
            setattr(user, field, str(data[field]).strip())
    if 'avatar' in request.files:
        avatar = request.files['avatar']
        allowed = {'png', 'jpg', 'jpeg', 'webp'}
        if not avatar.filename or '.' not in avatar.filename or avatar.filename.rsplit('.', 1)[1].lower() not in allowed:
            return _error('INVALID_FILE_TYPE', 'Please upload a JPG, PNG, or WEBP image', 400)
        folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        os.makedirs(folder, exist_ok=True)
        ext = avatar.filename.rsplit('.', 1)[1].lower()
        filename = secure_filename(f'avatar_{user.id}_{uuid.uuid4().hex[:8]}.{ext}')
        path = os.path.join(folder, filename)
        avatar.save(path)
        user.avatar_path = path
    db.session.commit()
    return jsonify({'success': True, 'data': user.to_dict()}), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200
    
@auth_bp.route('/demo-login', methods=['POST'])
def demo_login():
    data = request.get_json(silent=True) or {}
    role = (data.get('role') or '').strip()

    if role not in VALID_ROLES:
        return _error('400', 'Valid role is required', 400)

    demo_accounts = {
        'farmer': ('Demo Farmer', 'farmer@m2m.demo', '9999999991'),
        'buyer': ('Demo Buyer', 'buyer@m2m.demo', '9999999988'),
        'admin': ('Demo Admin', 'admin@m2m.demo', '9999999999'),
    }
    account = demo_accounts.get(role)
    user = User.query.filter_by(email=account[1]).first() if account else None
    if not user and account:
        phone = account[2]
        while User.query.filter_by(phone=phone).first():
            phone = str(int(phone) + 1)
        user = User(name=account[0], email=account[1], phone=phone, role=role, verification_status='verified')
        user.set_password('Buyer@123')
        db.session.add(user)
        db.session.commit()
    if not user:
        return _error('404', 'Demo user not found', 404)

    if not user.is_active:
        return _error('403', 'Demo account is suspended', 403)

    access_token = create_access_token(identity=str(user.id))
    return jsonify({'success': True, 'data': {'token': access_token, 'user': user.to_dict()}}), 200

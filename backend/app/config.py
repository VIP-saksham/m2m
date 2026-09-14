import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///m2m.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16777216))
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173').split(',')
    DEMO_MODE = os.environ.get('DEMO_MODE', 'true').lower() == 'true'
    # Google Sign-In: the OAuth Web client ID issued by Google Cloud Console.
    # Optional — when unset, the /api/auth/google route replies 503.
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
    # Comma-separated additional allowed client IDs (e.g. an Android client).
    GOOGLE_CLIENT_IDS = [c.strip() for c in os.environ.get('GOOGLE_CLIENT_IDS', '').split(',') if c.strip()]
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
    LLM_API_KEY = os.environ.get('LLM_API_KEY', '')
    LLM_API_URL = os.environ.get('LLM_API_URL', '')
    LLM_MODEL = os.environ.get('LLM_MODEL', '')

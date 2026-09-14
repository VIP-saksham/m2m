import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRoleRedirect } from '../../hooks/useRoleRedirect';
import { useBilingual } from '../../hooks/useBilingual';
import { authApi } from '../../services/api';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';

const ROLES = [
  { value: 'farmer', labelKey: 'auth.roleFarmer' },
  { value: 'buyer', labelKey: 'auth.roleBuyerProcessor' },
  { value: 'fpo', labelKey: 'auth.roleFpo' },
];

const initialForm = {
  name: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'farmer',
};

const Register = () => {
  const bi = useBilingual();
  const { login } = useAuth();
  const redirectByRole = useRoleRedirect();

  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const validate = () => {
    if (!form.name.trim()) return bi('auth.nameRequired');
    if (!form.phone.trim()) return bi('auth.phoneRequired');
    if (!form.email.trim()) return 'Email is required';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return 'Enter a valid email address';
    if (form.password.length < 6) return bi('auth.passwordTooShort');
    if (form.password !== form.confirmPassword) return bi('auth.passwordsDontMatch');
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await authApi.register({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        role: form.role,
        password: form.password,
      });
      login(res.user, res.token);
      redirectByRole(res.user?.role);
    } catch (err) {
      if (!err.response) {
        // No HTTP response: backend unreachable/restarting or CORS-rejected.
        setFormError(bi('auth.networkError'));
      } else {
        setFormError(err.payload?.message || err.message || bi('common.error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4 py-8">
      <div className="bg-white p-8 rounded-2xl shadow-card max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-2">{bi('auth.registerTitle')}</h2>
        <p className="text-sm text-center text-charcoal-light mb-6">{bi('auth.registerSubtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="reg-name">
              {bi('auth.fullName')} <span className="text-red-500">*</span>
            </label>
            <input
              id="reg-name"
              className="w-full p-3 border rounded-xl"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={setField('name')}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="reg-phone">
              {bi('common.phone')} <span className="text-red-500">*</span>
            </label>
            <input
              id="reg-phone"
              className="w-full p-3 border rounded-xl"
              type="tel"
              autoComplete="tel"
              placeholder={bi('auth.phonePlaceholder')}
              value={form.phone}
              onChange={setField('phone')}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="reg-email">
              {bi('common.email')} <span className="text-red-500">*</span>
            </label>
            <input
              id="reg-email"
              className="w-full p-3 border rounded-xl"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={setField('email')}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <span className="block text-sm font-medium mb-1">
              {bi('auth.selectRole')} <span className="text-red-500">*</span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                  disabled={isSubmitting}
                  className={`py-2 text-sm rounded-xl border transition-colors ${
                    form.role === r.value
                      ? 'bg-forest text-white border-forest'
                      : 'bg-white text-charcoal border-gray-300 hover:border-forest'
                  }`}
                >
                  {bi(r.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="reg-password">
              {bi('auth.passwordPlaceholder')} <span className="text-red-500">*</span>
            </label>
            <input
              id="reg-password"
              className="w-full p-3 border rounded-xl"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={setField('password')}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="reg-confirm">
              {bi('auth.confirmPassword')} <span className="text-red-500">*</span>
            </label>
            <input
              id="reg-confirm"
              className="w-full p-3 border rounded-xl"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={setField('confirmPassword')}
              disabled={isSubmitting}
            />
          </div>

          {formError && (
            <div
              className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl"
              role="alert"
            >
              {formError}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-forest text-white rounded-xl font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? bi('auth.registering') : bi('auth.registerNow')}
          </button>
        </form>

        <div className="my-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px flex-1 bg-cream-darker" />
            <span className="text-xs text-charcoal/50">{bi('common.or', 'or')}</span>
            <span className="h-px flex-1 bg-cream-darker" />
          </div>
          <GoogleSignInButton />
        </div>

        <p className="text-sm text-center mt-6">
          <Link to="/login" className="text-forest hover:underline">
            {bi('auth.alreadyHaveAccount')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

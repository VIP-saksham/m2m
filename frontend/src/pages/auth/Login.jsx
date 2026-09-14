import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useRoleRedirect } from '../../hooks/useRoleRedirect';
import { authApi } from '../../services/api';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';

const Login = () => {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const redirectByRole = useRoleRedirect();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError('');

    if (!identifier.trim()) {
      setFormError(t('auth.emailRequired'));
      return;
    }
    if (!password) {
      setFormError(t('auth.passwordRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.login({ email: identifier.trim(), password });
      login(res.user, res.token);
      redirectByRole(res.user?.role);
    } catch (err) {
      if (!err.response) {
        // No HTTP response: backend unreachable/restarting or CORS-rejected.
        setFormError(t('auth.networkError'));
      } else {
        setFormError(
          err.payload?.message ||
            err.message ||
            t('common.error')
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (role) => {
    if (isSubmitting) return;
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await authApi.demoLogin(role);
      login(res.user, res.token);
      redirectByRole(role);
    } catch (err) {
      setFormError(
        err.payload?.message ||
          err.message ||
          t('common.error')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="bg-white p-8 rounded-2xl shadow-card max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6">{t('auth.welcomeBack')}</h2>

        <form onSubmit={handleLogin} className="space-y-4 mb-8" noValidate>
          <div>
            <input
              className="w-full p-3 border rounded-xl"
              type="text"
              autoComplete="username"
              placeholder={t('auth.emailPlaceholder')}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <div className="relative">
              <input
                className="w-full p-3 border rounded-xl pr-12"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-charcoal-light"
                onClick={() => setShowPassword((s) => !s)}
                tabIndex={-1}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {formError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl" role="alert">
              {formError}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-forest text-white rounded-xl font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>

        <div className="flex items-center justify-between text-sm mb-6">
          <Link to="/forgot-password" className="text-forest hover:underline">
            {t('auth.forgotPassword')}
          </Link>
          <Link to="/register" className="text-forest hover:underline">
            {t('auth.createAccount')}
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px flex-1 bg-cream-darker" />
            <span className="text-xs text-charcoal/50">{t('common.or', 'or')}</span>
            <span className="h-px flex-1 bg-cream-darker" />
          </div>
          <GoogleSignInButton />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-center mb-4 text-charcoal-light">{t('auth.demoAccess')}</h3>
          <div className="space-y-3">
            <button
              onClick={() => handleDemoLogin('farmer')}
              disabled={isSubmitting}
              className="w-full py-2 bg-leaf/10 text-leaf border border-leaf rounded-xl hover:bg-leaf/20 disabled:opacity-60"
            >
              {t('auth.demoFarmer')}
            </button>
            <button
              onClick={() => handleDemoLogin('buyer')}
              disabled={isSubmitting}
              className="w-full py-2 bg-leaf/10 text-leaf border border-leaf rounded-xl hover:bg-leaf/20 disabled:opacity-60"
            >
              {t('auth.demoBuyer')}
            </button>
            <button
              onClick={() => handleDemoLogin('admin')}
              disabled={isSubmitting}
              className="w-full py-2 bg-leaf/10 text-leaf border border-leaf rounded-xl hover:bg-leaf/20 disabled:opacity-60"
            >
              {t('auth.demoAdmin')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

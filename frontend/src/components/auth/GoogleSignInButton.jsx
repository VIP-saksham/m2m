import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRoleRedirect } from '../../hooks/useRoleRedirect';
import { useBilingual } from '../../hooks/useBilingual';
import { authApi } from '../../services/api';

/**
 * Google Sign-In button backed by Google Identity Services (GIS).
 *
 * How it works:
 *  1. Loads Google's GIS script and initializes it with the app's client ID
 *     (VITE_GOOGLE_CLIENT_ID, served by the backend's /api/auth/config).
 *  2. Renders the official Google button inside a div GIS controls.
 *  3. On credential selection, posts the ID token to /api/auth/google.
 *       - needs_role accounts go to a role picker before entering the app
 *       - everyone else is signed straight in
 *
 * When no client ID is configured the button renders a plain (non-Google)
 * fallback that explains setup in one line — the rest of the app is unaffected.
 */

const ROLE_OPTIONS = [
  { value: 'farmer', labelKey: 'auth.roleFarmer' },
  { value: 'buyer', labelKey: 'auth.roleBuyerProcessor' },
  { value: 'fpo', labelKey: 'auth.roleFpo' },
];

let gisPromise = null;

function loadGisScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('gsi-load-failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('gsi-load-failed'));
    document.head.appendChild(script);
  });
  return gisPromise;
}

const GoogleSignInButton = ({ onError }) => {
  const bi = useBilingual();
  const { login } = useAuth();
  const redirectByRole = useRoleRedirect();
  const buttonDiv = useRef(null);
  const [config, setConfig] = useState(null); // { clientId }
  const [needsRole, setNeedsRole] = useState(null); // { token, profile }
  const [role, setRole] = useState('farmer');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    let cancelled = false;
    authApi
      .config()
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch(() => {
        if (!cancelled) setConfig({ clientId: '' }); // backend unreachable: show fallback
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCredential = useCallback(
    async (response) => {
      const credential = response?.credential;
      if (!credential) return;
      setBusy(true);
      setLocalError('');
      try {
        const res = await authApi.google({ credential });
        if (res.needs_role) {
          // New Google user without a role: remember the token and ask.
          setNeedsRole({ token: res.token, profile: res.profile });
        } else {
          login(res.user, res.token);
          redirectByRole(res.user?.role);
        }
      } catch (err) {
        const message =
          err?.payload?.message ||
          (!err.response ? bi('auth.networkError') : err.message) ||
          bi('common.error');
        setLocalError(message);
        onError?.(message);
      } finally {
        setBusy(false);
      }
    },
    [bi, login, onError, redirectByRole]
  );

  // Initialize the GIS button once we know the client ID.
  useEffect(() => {
    const clientId = config?.clientId;
    if (!clientId || !buttonDiv.current) return undefined;
    let cancelled = false;
    loadGisScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !buttonDiv.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
          auto_select: false,
          use_fedcm_for_prompt: true,
        });
        window.google.accounts.id.renderButton(buttonDiv.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'left',
          width: 320,
        });
      })
      .catch(() => setLocalError(bi('auth.googleUnavailable')));
    return () => {
      cancelled = true;
    };
  }, [config, handleCredential, bi]);

  const completeRole = async (e) => {
    e.preventDefault();
    if (busy) return;
    setLocalError('');
    if (!phone.trim()) {
      setLocalError(bi('auth.phoneRequired'));
      return;
    }
    setBusy(true);
    try {
      const res = await authApi.google({
        complete: true,
        role,
        phone: phone.trim(),
      });
      login(res.user, res.token);
      redirectByRole(res.user?.role);
    } catch (err) {
      setLocalError(err?.payload?.message || err.message || bi('common.error'));
    } finally {
      setBusy(false);
    }
  };

  // ---------------------------------------------------------------
  // Role picker for brand-new Google users
  // ---------------------------------------------------------------
  if (needsRole) {
    return (
      <form
        onSubmit={completeRole}
        className="rounded-2xl border border-cream-darker bg-cream p-4 text-left"
      >
        <p className="text-sm font-semibold">{bi('auth.chooseRoleTitle')}</p>
        <p className="mt-0.5 text-xs text-charcoal/60">
          {needsRole.profile?.email}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {ROLE_OPTIONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`rounded-xl border px-2 py-2 text-sm transition-colors ${
                role === r.value
                  ? 'border-forest bg-forest text-white'
                  : 'border-gray-300 bg-white text-charcoal hover:border-forest'
              }`}
            >
              {bi(r.labelKey)}
            </button>
          ))}
        </div>
        <label className="mt-3 block text-xs font-medium text-charcoal/70" htmlFor="google-phone">
          {bi('common.phone')}
        </label>
        <input
          id="google-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={bi('auth.phonePlaceholder')}
          className="mt-1 w-full rounded-xl border border-cream-darker bg-white px-3 py-2 text-sm"
          inputMode="numeric"
        />
        {localError && <p className="mt-2 text-sm text-red-600" role="alert">{localError}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-3 w-full rounded-xl bg-forest py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? bi('common.loading') : bi('auth.continue')}
        </button>
      </form>
    );
  }

  // ---------------------------------------------------------------
  // No client ID configured: honest fallback, no fake button
  // ---------------------------------------------------------------
  if (config && !config.clientId) {
    return (
      <div className="rounded-xl border border-dashed border-cream-darker bg-cream/60 px-4 py-3 text-center text-xs text-charcoal/55">
        {bi('auth.googleSetupHint')}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={buttonDiv} className="min-h-[44px]" />
      {busy && <p className="text-xs text-charcoal/60">{bi('auth.signingIn')}</p>}
      {localError && (
        <p className="text-sm text-red-600" role="alert">
          {localError}
        </p>
      )}
    </div>
  );
};

export default GoogleSignInButton;

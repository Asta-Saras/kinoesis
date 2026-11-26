import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { PageLoader } from '../../components/ui/PageLoader';

/** Landing page after a successful OAuth redirect: load the session, then go home. */
export function AuthCallbackPage() {
  const refresh = useAuthStore((s) => s.refresh);
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode double-invoke guard
    ran.current = true;
    refresh()
      .then((user) => navigate(user ? '/home' : '/auth?oauthError=OAUTH_FAILED', { replace: true }))
      .catch((err: Error) =>
        navigate(`/auth?oauthError=OAUTH_FAILED&message=${encodeURIComponent(err.message)}`, { replace: true }),
      );
  }, [refresh, navigate]);

  return <PageLoader />;
}

'use client';

/* Root of the web app: waits for saved data, then shows the pre-login flows
   (splash → onboarding → paywall → auth → permissions) or the main shell. */
import { useEffect, type ReactNode } from 'react';
import Flows from '../flows/Flows';
import { hydrateApp, useApp } from '../store';
import { signOutLocal, startPolling, syncAll } from '../sync';
import { wc } from '../api';
import Overlays from './Overlays';
import Shell from './Shell';
import { Spinner } from './ui';

export default function WebApp({ children }: { children: ReactNode }) {
  const hydrated = useApp((s) => s.hydrated);
  const stage = useApp((s) => s.data.stage);

  useEffect(() => { hydrateApp(); }, []);

  // Count launches once per page load (drives the rating-screen interval).
  useEffect(() => {
    if (hydrated) useApp.getState().mutate((d) => { d.launches = (d.launches || 0) + 1; });
  }, [hydrated]);

  // Signed in from an earlier visit: confirm the session is still valid, then refresh everything.
  // The cached copy shows meanwhile; a revoked session goes back to sign-in.
  useEffect(() => {
    if (!hydrated || useApp.getState().data.stage !== 'main') return;
    wc('session', undefined, undefined, 'GET').then((r) => {
      if (r.code === 401) return signOutLocal();
      syncAll();
      startPolling();
    });
  }, [hydrated]);

  return (
    <div className="wa-root">
      {!hydrated ? <div className="shell-boot"><Spinner /></div> : stage === 'main' ? <Shell>{children}</Shell> : <div className="flow-scroll"><Flows /></div>}
      {hydrated && <Overlays />}
    </div>
  );
}

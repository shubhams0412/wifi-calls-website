'use client';

/* Root of the web app: waits for saved data, then shows the pre-login flows
   (splash → onboarding → paywall → auth → permissions) or the main shell. */
import { useEffect, type ReactNode } from 'react';
import Flows from '../flows/Flows';
import { hydrateApp, useApp } from '../store';
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

  return (
    <div className="wa-root">
      {!hydrated ? <div className="shell-boot"><Spinner /></div> : stage === 'main' ? <Shell>{children}</Shell> : <div className="flow-scroll"><Flows /></div>}
      {hydrated && <Overlays />}
    </div>
  );
}

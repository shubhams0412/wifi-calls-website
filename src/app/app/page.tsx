import { redirect } from 'next/navigation';

/** Dial is the default tab, as in the iOS app. */
export default function AppIndex() {
  redirect('/app/dial');
}

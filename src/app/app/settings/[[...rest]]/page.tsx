'use client';
import { useParams } from 'next/navigation';
import SettingsTab from '@/webapp/settings/SettingsTab';

export default function Page() {
  const { rest } = useParams<{ rest?: string[] }>();
  return <SettingsTab rest={(rest ?? []).map(decodeURIComponent)} />;
}

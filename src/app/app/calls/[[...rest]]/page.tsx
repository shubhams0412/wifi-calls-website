'use client';
import { useParams } from 'next/navigation';
import CallsTab from '@/webapp/calls/CallsTab';

export default function Page() {
  const { rest } = useParams<{ rest?: string[] }>();
  return <CallsTab rest={(rest ?? []).map(decodeURIComponent)} />;
}

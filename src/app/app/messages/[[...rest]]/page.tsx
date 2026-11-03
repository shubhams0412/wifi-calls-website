'use client';
import { useParams } from 'next/navigation';
import MessagesTab from '@/webapp/messages/MessagesTab';

export default function Page() {
  const { rest } = useParams<{ rest?: string[] }>();
  return <MessagesTab rest={(rest ?? []).map(decodeURIComponent)} />;
}

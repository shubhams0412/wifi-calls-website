'use client';
import { useParams } from 'next/navigation';
import ContactsTab from '@/webapp/contacts/ContactsTab';

export default function Page() {
  const { rest } = useParams<{ rest?: string[] }>();
  return <ContactsTab rest={(rest ?? []).map(decodeURIComponent)} />;
}

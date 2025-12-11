'use client';

import Link from 'next/link';
import { useAppStore } from '@/state/app-store';
import { Card } from '@mailroom/ui';

type Mailbox = {
  id: string;
  address: string;
};

export function MailboxList({ mailboxes }: { mailboxes: Mailbox[] }) {
  const selected = useAppStore((state) => state.selectedMailboxId);
  const setSelected = useAppStore((state) => state.setSelectedMailbox);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {mailboxes.map((mailbox) => {
        const isSelected = selected === mailbox.id;
        return (
          <Link key={mailbox.id} href={`/app/policies/${mailbox.id}`} onClick={() => setSelected(mailbox.id)}>
            <Card
              className={`p-4 transition ${isSelected ? 'border-brand text-brand-light' : 'hover:border-brand hover:text-brand-light'}`}
            >
              <p className="text-sm font-semibold">{mailbox.address}</p>
              <p className="text-xs text-slate-500">{isSelected ? 'Selected' : 'Configure policy'}</p>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

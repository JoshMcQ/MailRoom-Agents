'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '../app/providers';

type ThreadRow = {
  id: string;
  subject: string;
  intent: string | null;
  confidence: number | null;
  status: string;
  assignee_user_id: string | null;
  last_message_at: string | null;
  mailbox_id: string;
};

export function QueueSummary() {
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const supabase = useSupabase();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('threads')
        .select('id, subject, intent, confidence, status, assignee_user_id, last_message_at, mailbox_id')
        .order('last_message_at', { ascending: false })
        .limit(6);
      if (data) setThreads(data);
    };

    load();

    const channel = supabase
      .channel('threads:queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threads' }, load)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  if (!threads.length) {
    return <p className="text-sm text-slate-500">No active threads — inboxes are quiet.</p>;
  }

  return (
    <ul className="divide-y divide-slate-900/80 border border-slate-900/80">
      {threads.map((thread) => (
        <li key={thread.id} className="flex items-center justify-between bg-slate-950/40 px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-100">{thread.subject || 'No subject'}</span>
            <span className="text-xs text-slate-500">{thread.intent ?? 'unclassified'}</span>
          </div>
          <span className="rounded-full border border-brand-light px-3 py-1 text-xs text-brand-light">
            {(thread.confidence ?? 0).toFixed(2)}
          </span>
        </li>
      ))}
    </ul>
  );
}

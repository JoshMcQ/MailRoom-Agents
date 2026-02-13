'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';

export function PolicyEditor({ defaultValue, onSave }: { defaultValue: string; onSave: (value: string) => Promise<void> }) {
  const [value, setValue] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <textarea
        className="h-80 w-full rounded-md border border-slate-800 bg-slate-950/60 p-3 font-mono text-sm text-slate-200 focus:border-brand focus:outline-none"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button
        type="button"
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-800"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await onSave(value);
              toast.success('Policy saved');
            } catch (error) {
              toast.error((error as Error).message);
            }
          })
        }
      >
        {isPending ? 'Saving…' : 'Save Policy'}
      </button>
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';

const QUICK_COMMANDS = ['Add Hotstar', 'Add Netflix', 'Cancel Netflix', 'Add Spotify Premium', 'Remove Spotify Premium', 'Analyze history'];

interface CommandBarProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

export default function CommandBar({ disabled, onSend }: CommandBarProps) {
  const [draft, setDraft] = useState('');

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || disabled) return;
    onSend(value);
    setDraft('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(draft);
  };

  return (
    <div className="border-t border-white/10 bg-navy-900/90 px-5 py-4">
      <div className="mb-3 flex flex-wrap gap-2">
        {QUICK_COMMANDS.map((command) => (
          <button
            key={command}
            type="button"
            disabled={disabled}
            onClick={() => submit(command)}
            className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-400/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {command}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={disabled}
          placeholder="Ask subguard to add, cancel, keep, or analyze..."
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-navy-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 transition focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-50"
        />
        <button
          type="submit"
          aria-label="Send command"
          disabled={disabled || draft.trim() === ''}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-navy-950 transition hover:bg-emerald-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

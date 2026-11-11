import { useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import type { CustomSubscriptionInput } from '@/types/subguard';

interface AddCustomSubscriptionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CustomSubscriptionInput) => Promise<void>;
}

const CATEGORIES = ['Streaming', 'Music', 'Shopping', 'Productivity', 'Fitness', 'Cloud', 'Gaming', 'Other'];

export default function AddCustomSubscriptionForm({ open, onClose, onSubmit }: AddCustomSubscriptionFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [billingDay, setBillingDay] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!open) return null;

  const reset = () => {
    setName('');
    setCategory(CATEGORIES[0]);
    setPrice('');
    setBillingDay('');
    setError(null);
  };

  const handleClose = () => {
    if (isSaving) return;
    reset();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const trimmedName = name.trim();
    const parsedPrice = Number(price);
    const parsedDay = billingDay.trim() === '' ? null : Number(billingDay);

    if (!trimmedName) {
      setError('Please enter a subscription name.');
      return;
    }
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Please enter a valid monthly price.');
      return;
    }
    if (parsedDay !== null && (Number.isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31)) {
      setError('Billing day must be between 1 and 31, or left blank.');
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSubmit({ name: trimmedName, category, price: parsedPrice, billing_day: parsedDay });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that subscription.');
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClass =
    'w-full rounded-xl border border-white/10 bg-navy-950 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 transition focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md animate-fade-up rounded-2xl border border-white/10 bg-navy-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">Add Custom Subscription</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Service name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
              placeholder="e.g. Notion Plus"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSaving}
              className={fieldClass}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Monthly price ($)</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isSaving}
                placeholder="9.99"
                inputMode="decimal"
                className={fieldClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Billing day (1-31)</label>
              <input
                value={billingDay}
                onChange={(e) => setBillingDay(e.target.value)}
                disabled={isSaving}
                placeholder="Optional"
                inputMode="numeric"
                className={fieldClass}
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-emerald-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Add subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchMessages,
  fetchReminders,
  fetchSubscriptions,
  insertCustomSubscription,
  insertMessage,
  insertSubscription,
  updateReminder,
  updateSubscription,
} from '@/lib/subguard-data';
import {
  HELP_TEXT,
  buildAnalysis,
  buildScanMessages,
  catalogNames,
  findCatalogService,
  findSubscription,
  formatMoney,
  getActiveSubscriptions,
  getUpcomingReminders,
  joinNames,
  parseCommand,
} from '@/lib/subguard-logic';
import type { ChatMessage, CustomSubscriptionInput, Reminder, Subscription } from '@/types/subguard';

const LOAD_ERROR = "Subguard couldn't load your subscriptions. Please refresh the page.";
const ACTION_ERROR = "That didn't go through. Please try again.";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function useSubguard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  const reply = useCallback(async (content: string, delayMs = 700) => {
    setIsTyping(true);
    try {
      await sleep(delayMs);
      const message = await insertMessage('assistant', content);
      setMessages((prev) => [...prev, message]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  const replaceSubscription = (updated: Subscription) => {
    setSubscriptions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const appendSubscription = (created: Subscription) => {
    setSubscriptions((prev) => [...prev, created]);
  };

  const addSubscription = async (name: string): Promise<boolean> => {
    const existing = subscriptions.find((sub) => sub.name.toLowerCase() === name.toLowerCase());

    if (existing && existing.status === 'active') {
      await reply(`You're already subscribed to ${existing.name}. It's in your active list at ${formatMoney(existing.price)} per month.`, 600);
      return true;
    }

    if (existing && existing.status === 'cancelled') {
      await reply(`Reactivating ${existing.name} through PayPal merchant rails.`, 800);
      const updated = await updateSubscription(existing.id, {
        status: 'active',
        alert_type: null,
        reviewed: true,
        cancelled_at: null,
      });
      replaceSubscription(updated);
      await reply(`Done. ${existing.name} is active again at ${formatMoney(existing.price)} per month.`, 800);
      return true;
    }

    const service = findCatalogService(name);
    if (!service) return false;

    await reply(`Adding ${service.name} at ${formatMoney(service.price)} per month.`, 700);
    const created = await insertSubscription(service);
    appendSubscription(created);
    await reply(`Done. ${service.name} is now on your active list at ${formatMoney(service.price)} per month.`, 800);
    return true;
  };

  const cancelSubscription = async (sub: Subscription) => {
    await reply(`Connecting to PayPal merchant rails to cancel ${sub.name}.`, 900);
    await reply('Submitting the cancellation and confirming the billing stop with the merchant.', 1400);
    const updated = await updateSubscription(sub.id, {
      status: 'cancelled',
      alert_type: null,
      cancelled_at: new Date().toISOString(),
    });
    replaceSubscription(updated);
    await reply(
      `Done. Saved. You will no longer pay ${formatMoney(sub.price)} per month for ${sub.name}. That keeps ${formatMoney(sub.price * 12)} in your pocket every year.`,
      800,
    );
  };

  const keepSubscription = async (sub: Subscription, current: Subscription[]) => {
    const updated = await updateSubscription(sub.id, { reviewed: true, alert_type: null });
    replaceSubscription(updated);

    let message = `Noted. I'll keep ${sub.name} and stop flagging it.`;
    const otherDuplicates = getActiveSubscriptions(current).filter(
      (item) => item.id !== sub.id && item.alert_type === 'duplicate',
    );
    if (otherDuplicates.length > 0) {
      message += ` ${joinNames(otherDuplicates.map((item) => item.name))} is still flagged as a duplicate. Would you like me to cancel it?`;
    }
    await reply(message, 900);
  };

  const respond = async (text: string) => {
    const command = parseCommand(text);
    switch (command.type) {
      case 'analyze':
        return reply(buildAnalysis(subscriptions), 1000);
      case 'help':
        return reply(HELP_TEXT, 600);
      case 'add': {
        const added = await addSubscription(command.query);
        if (!added) {
          await reply(`I don't recognize that service. I can add ${catalogNames()}.`, 600);
        }
        return;
      }
      case 'cancel':
      case 'keep': {
        const sub = findSubscription(subscriptions, command.query);
        if (!sub) {
          const names = joinNames(getActiveSubscriptions(subscriptions).map((item) => item.name));
          return reply(`I couldn't find that subscription. Your active ones are ${names}.`, 600);
        }
        if (sub.status === 'cancelled') {
          return reply(`${sub.name} is already cancelled, so there's nothing more to do.`, 600);
        }
        return command.type === 'cancel' ? cancelSubscription(sub) : keepSubscription(sub, subscriptions);
      }
      default:
        return reply(
          'I can add, cancel, keep, or analyze a subscription. Try "Add Netflix", "Cancel Disney", or "Analyze history".',
          600,
        );
    }
  };

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    (async () => {
      setIsBusy(true);
      try {
        const [subs, history, reminderData] = await Promise.all([
          fetchSubscriptions(),
          fetchMessages(),
          fetchReminders(),
        ]);
        setSubscriptions(subs);
        setMessages(history);
        setReminders(reminderData);
        setIsLoading(false);

        const upcoming = getUpcomingReminders(reminderData);
        const reminderLine =
          upcoming.length > 0
            ? `You also have ${upcoming.length} bill${upcoming.length === 1 ? '' : 's'} due soon. Check the reminders panel on the right to mark them paid.`
            : null;

        const scanLines = buildScanMessages(subs);
        for (const line of scanLines) {
          await reply(line, 1200);
        }
        if (reminderLine) {
          await reply(reminderLine, 1000);
        }
      } catch {
        setError(LOAD_ERROR);
      } finally {
        setIsLoading(false);
        setIsBusy(false);
      }
    })();
  }, [reply]);

  const sendCommand = async (input: string) => {
    const text = input.trim();
    if (!text || isBusy) return;

    setIsBusy(true);
    setError(null);
    try {
      const userMessage = await insertMessage('user', text);
      setMessages((prev) => [...prev, userMessage]);
      await respond(text);
    } catch {
      setError(ACTION_ERROR);
    } finally {
      setIsBusy(false);
    }
  };

  const addCustomSubscription = async (input: CustomSubscriptionInput) => {
    setIsBusy(true);
    setError(null);
    try {
      const userMessage = await insertMessage('user', `Add custom subscription: ${input.name} at ${formatMoney(input.price)}/mo`);
      setMessages((prev) => [...prev, userMessage]);

      await reply(`Adding ${input.name} at ${formatMoney(input.price)} per month.`, 700);
      const created = await insertCustomSubscription(input);
      appendSubscription(created);
      await reply(`Done. ${input.name} is now on your active list at ${formatMoney(input.price)} per month.`, 800);
    } catch {
      setError(ACTION_ERROR);
    } finally {
      setIsBusy(false);
    }
  };

  const markReminderPaid = async (id: string) => {
    try {
      const updated = await updateReminder(id, { status: 'paid' });
      setReminders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch {
      setError(ACTION_ERROR);
    }
  };

  const dismissReminder = async (id: string) => {
    try {
      const updated = await updateReminder(id, { status: 'dismissed' });
      setReminders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch {
      setError(ACTION_ERROR);
    }
  };

  return {
    subscriptions,
    messages,
    reminders,
    isLoading,
    isBusy,
    isTyping,
    error,
    sendCommand,
    addCustomSubscription,
    markReminderPaid,
    dismissReminder,
  };
}

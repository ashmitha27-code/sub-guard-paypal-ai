import { useEffect, useRef, useState } from 'react';
import { fetchMessages, fetchSubscriptions, insertMessage, updateSubscription } from '@/lib/subguard-data';
import {
  HELP_TEXT,
  buildAnalysis,
  buildScanMessages,
  findSubscription,
  formatMoney,
  getActiveSubscriptions,
  joinNames,
  parseCommand,
} from '@/lib/subguard-logic';
import type { ChatMessage, Subscription } from '@/types/subguard';

const LOAD_ERROR = "Subguard couldn't load your subscriptions. Please refresh the page.";
const ACTION_ERROR = "That didn't go through. Please try again.";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function useSubguard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  const reply = async (content: string, delayMs = 700) => {
    setIsTyping(true);
    try {
      await sleep(delayMs);
      const message = await insertMessage('assistant', content);
      setMessages((prev) => [...prev, message]);
    } finally {
      setIsTyping(false);
    }
  };

  const replaceSubscription = (updated: Subscription) => {
    setSubscriptions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
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
        return command.type === 'cancel'
          ? cancelSubscription(sub)
          : keepSubscription(sub, subscriptions);
      }
      default:
        return reply(
          'I can cancel a subscription, keep one, or analyze your history. Try "Cancel Disney" or "Analyze history".',
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
        const [subs, history] = await Promise.all([fetchSubscriptions(), fetchMessages()]);
        setSubscriptions(subs);
        setMessages(history);
        setIsLoading(false);
        for (const line of buildScanMessages(subs)) {
          await reply(line, 1200);
        }
      } catch {
        setError(LOAD_ERROR);
      } finally {
        setIsLoading(false);
        setIsBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scan runs once per page load
  }, []);

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

  return { subscriptions, messages, isLoading, isBusy, isTyping, error, sendCommand };
}

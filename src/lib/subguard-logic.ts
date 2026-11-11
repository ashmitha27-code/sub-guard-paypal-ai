import type { Reminder, Subscription } from '@/types/subguard';

const COUNT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five'];

export const HELP_TEXT =
  'I can add a subscription (try "Add Netflix"), cancel or remove one (try "Cancel Disney" or "Remove Spotify"), keep one (try "Keep Spotify"), or analyze your history. Your active subscriptions are listed on the right.';

export interface CatalogService {
  name: string;
  category: string;
  price: number;
  aliases: string[];
}

export const SERVICE_CATALOG: CatalogService[] = [
  { name: 'Disney+ Hotstar', category: 'Streaming', price: 13.99, aliases: ['hotstar', 'disney'] },
  { name: 'Netflix Standard', category: 'Streaming', price: 15.49, aliases: ['netflix'] },
  { name: 'Spotify Premium', category: 'Music', price: 11.99, aliases: ['spotify'] },
  { name: 'Apple Music', category: 'Music', price: 10.99, aliases: ['apple music', 'apple'] },
  { name: 'Amazon Prime', category: 'Shopping', price: 14.99, aliases: ['amazon', 'prime'] },
  { name: 'YouTube Premium', category: 'Streaming', price: 13.99, aliases: ['youtube'] },
  { name: 'Crunchyroll', category: 'Streaming', price: 7.99, aliases: ['crunchyroll'] },
];

export type ParsedCommand =
  | { type: 'cancel'; query: string }
  | { type: 'keep'; query: string }
  | { type: 'add'; query: string }
  | { type: 'analyze' }
  | { type: 'help' }
  | { type: 'unknown' };

export function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function getActiveSubscriptions(subscriptions: Subscription[]): Subscription[] {
  return subscriptions.filter((sub) => sub.status === 'active');
}

export function getMonthlySpend(subscriptions: Subscription[]): number {
  return getActiveSubscriptions(subscriptions).reduce((total, sub) => total + sub.price, 0);
}

export function getMonthlySavings(subscriptions: Subscription[]): number {
  return subscriptions
    .filter((sub) => sub.status === 'cancelled')
    .reduce((total, sub) => total + sub.price, 0);
}

export function getUpcomingReminders(reminders: Reminder[]): Reminder[] {
  return reminders.filter((r) => r.status === 'upcoming');
}

export function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDueLabel(dueDate: string): string {
  const days = daysUntil(dueDate);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

export function parseCommand(input: string): ParsedCommand {
  const text = input.trim().toLowerCase();
  if (/\b(analy[sz]e|history|summary)\b/.test(text)) return { type: 'analyze' };
  if (/\bhelp\b/.test(text)) return { type: 'help' };
  if (/\b(cancel|stop|end|unsubscribe|remove)\b/.test(text)) return { type: 'cancel', query: text };
  if (/\b(add|resume|reactivate|subscribe|start)\b/.test(text)) return { type: 'add', query: text };
  if (/\b(keep|retain)\b/.test(text)) return { type: 'keep', query: text };
  return { type: 'unknown' };
}

export function findCatalogService(query: string): CatalogService | undefined {
  const text = query.toLowerCase();
  return SERVICE_CATALOG.find((service) => service.aliases.some((alias) => text.includes(alias)));
}

export function catalogNames(): string {
  return joinNames(SERVICE_CATALOG.map((service) => service.name));
}

export function findSubscription(subscriptions: Subscription[], query: string): Subscription | undefined {
  const text = query.toLowerCase();
  return subscriptions.find((sub) => {
    const keyword = sub.name.toLowerCase().split(/[\s+]+/)[0];
    return text.includes(keyword);
  });
}

export function buildScanMessages(subscriptions: Subscription[]): string[] {
  const active = getActiveSubscriptions(subscriptions);
  const hikes = active.filter((sub) => sub.alert_type === 'price_hike');
  const duplicates = active.filter((sub) => sub.alert_type === 'duplicate');
  const alertCount = hikes.length + (duplicates.length > 0 ? 1 : 0);

  if (alertCount === 0) {
    return [
      'Hey, I just ran a routine scan on your linked accounts. Everything looks clean, with no price hikes or duplicate memberships.',
    ];
  }

  const intro = `Hey, I just ran a routine scan on your linked accounts. I found ${COUNT_WORDS[alertCount]} ${
    alertCount === 1 ? 'alert' : 'alerts'
  } you must review.`;

  const alertLines = hikes.map(
    (sub) =>
      `Price hike. Your ${sub.name} increased from ${formatMoney(sub.previous_price ?? sub.price)} to ${formatMoney(sub.price)} per month without clear notice.`,
  );
  if (duplicates.length > 0) {
    alertLines.push(
      `Duplicate membership. You're paying for both ${joinNames(duplicates.map((sub) => sub.name))}. Would you like me to fix this?`,
    );
  }

  return [intro, ...alertLines.map((line, index) => `Alert ${index + 1}: ${line}`)];
}

export function buildAnalysis(subscriptions: Subscription[]): string {
  const active = getActiveSubscriptions(subscriptions);
  if (active.length === 0) return 'You have no active subscriptions to analyze right now.';

  const total = getMonthlySpend(subscriptions);
  const lines = [
    `I reviewed ${active.length} active subscriptions. You are paying ${formatMoney(total)} per month, or ${formatMoney(total * 12)} per year.`,
  ];

  active
    .filter((sub) => sub.alert_type === 'price_hike' && sub.previous_price !== null)
    .forEach((sub) => {
      const previous = sub.previous_price ?? sub.price;
      lines.push(
        `${sub.name} went up ${formatMoney(sub.price - previous)} per month, from ${formatMoney(previous)} to ${formatMoney(sub.price)}.`,
      );
    });

  const duplicates = active.filter((sub) => sub.alert_type === 'duplicate');
  if (duplicates.length > 1) {
    const cheapest = duplicates.reduce((min, sub) => (sub.price < min.price ? sub : min));
    lines.push(
      `You have overlapping plans: ${joinNames(duplicates.map((sub) => sub.name))}. Cancelling ${cheapest.name} would save ${formatMoney(cheapest.price)} per month.`,
    );
  }

  if (lines.length === 1) {
    lines.push('No price hikes or duplicate memberships found. Your subscriptions look clean.');
  }

  return lines.join('\n');
}

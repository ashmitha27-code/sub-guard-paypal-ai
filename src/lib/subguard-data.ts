import { supabase } from '@/lib/supabase';
import type { CatalogService } from '@/lib/subguard-logic';
import type {
  ChatMessage,
  CustomSubscriptionInput,
  MessageRole,
  Reminder,
  ReminderStatus,
  Subscription,
  SubscriptionStatus,
  AlertType,
} from '@/types/subguard';

const SUBSCRIPTION_COLUMNS =
  'id, name, category, price, previous_price, billing_day, status, alert_type, reviewed, cancelled_at, created_at';
const MESSAGE_COLUMNS = 'id, role, content, created_at';
const REMINDER_COLUMNS = 'id, subscription_name, amount, due_date, status, created_at';
const HISTORY_LIMIT = 200;

interface SubscriptionRow extends Omit<Subscription, 'price' | 'previous_price'> {
  price: number | string;
  previous_price: number | string | null;
}

interface ReminderRow extends Omit<Reminder, 'amount'> {
  amount: number | string;
}

export interface SubscriptionChanges {
  status?: SubscriptionStatus;
  alert_type?: AlertType | null;
  reviewed?: boolean;
  cancelled_at?: string | null;
  billing_day?: number | null;
}

export interface ReminderChanges {
  status?: ReminderStatus;
}

function toSubscription(row: SubscriptionRow): Subscription {
  return {
    ...row,
    price: Number(row.price),
    previous_price: row.previous_price === null ? null : Number(row.previous_price),
  };
}

function toReminder(row: ReminderRow): Reminder {
  return { ...row, amount: Number(row.amount) };
}

export async function fetchSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(SUBSCRIPTION_COLUMNS)
    .order('created_at', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as SubscriptionRow[]).map(toSubscription);
}

export async function fetchMessages(): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(MESSAGE_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) throw new Error(error.message);
  return ((data ?? []) as ChatMessage[]).reverse();
}

export async function fetchReminders(): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from('reminders')
    .select(REMINDER_COLUMNS)
    .order('due_date', { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as ReminderRow[]).map(toReminder);
}

export async function insertMessage(role: MessageRole, content: string): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ role, content })
    .select(MESSAGE_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data as ChatMessage;
}

export async function insertSubscription(service: CatalogService): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({ name: service.name, category: service.category, price: service.price, status: 'active' })
    .select(SUBSCRIPTION_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return toSubscription(data as SubscriptionRow);
}

export async function insertCustomSubscription(input: CustomSubscriptionInput): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      name: input.name,
      category: input.category,
      price: input.price,
      billing_day: input.billing_day,
      status: 'active',
    })
    .select(SUBSCRIPTION_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return toSubscription(data as SubscriptionRow);
}

export async function updateSubscription(id: string, changes: SubscriptionChanges): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(changes)
    .eq('id', id)
    .select(SUBSCRIPTION_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('That subscription could not be updated.');
  return toSubscription(data as SubscriptionRow);
}

export async function updateReminder(id: string, changes: ReminderChanges): Promise<Reminder> {
  const { data, error } = await supabase
    .from('reminders')
    .update(changes)
    .eq('id', id)
    .select(REMINDER_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('That reminder could not be updated.');
  return toReminder(data as ReminderRow);
}

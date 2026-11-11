import { supabase } from '@/lib/supabase';
import type { CatalogService } from '@/lib/subguard-logic';
import type { ChatMessage, MessageRole, Subscription, SubscriptionStatus, AlertType } from '@/types/subguard';

const SUBSCRIPTION_COLUMNS = 'id, name, category, price, previous_price, status, alert_type, reviewed, cancelled_at, created_at';
const MESSAGE_COLUMNS = 'id, role, content, created_at';
const HISTORY_LIMIT = 200;

interface SubscriptionRow extends Omit<Subscription, 'price' | 'previous_price'> {
  price: number | string;
  previous_price: number | string | null;
}

export interface SubscriptionChanges {
  status?: SubscriptionStatus;
  alert_type?: AlertType | null;
  reviewed?: boolean;
  cancelled_at?: string | null;
}

function toSubscription(row: SubscriptionRow): Subscription {
  return {
    ...row,
    price: Number(row.price),
    previous_price: row.previous_price === null ? null : Number(row.previous_price),
  };
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

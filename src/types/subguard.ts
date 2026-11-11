export type SubscriptionStatus = 'active' | 'cancelled';

export type AlertType = 'price_hike' | 'duplicate';

export interface Subscription {
  id: string;
  name: string;
  category: string;
  price: number;
  previous_price: number | null;
  billing_day: number | null;
  status: SubscriptionStatus;
  alert_type: AlertType | null;
  reviewed: boolean;
  cancelled_at: string | null;
  created_at: string;
}

export type MessageRole = 'assistant' | 'user';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export type ReminderStatus = 'upcoming' | 'paid' | 'dismissed';

export interface Reminder {
  id: string;
  subscription_name: string;
  amount: number;
  due_date: string;
  status: ReminderStatus;
  created_at: string;
}

export interface CustomSubscriptionInput {
  name: string;
  category: string;
  price: number;
  billing_day: number | null;
}

import { useState } from 'react';
import AddCustomSubscriptionForm from '@/components/AddCustomSubscriptionForm';
import BillReminders from '@/components/BillReminders';
import ChatWindow from '@/components/ChatWindow';
import DashboardHeader from '@/components/DashboardHeader';
import SavingsChart from '@/components/SavingsChart';
import SubscriptionList from '@/components/SubscriptionList';
import { useSubguard } from '@/hooks/useSubguard';
import { getMonthlySavings, getMonthlySpend } from '@/lib/subguard-logic';

export default function App() {
  const {
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
  } = useSubguard();
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="min-h-screen bg-navy-950 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.10),_transparent_55%)] font-sans text-slate-100">
      <DashboardHeader
        monthlySpend={getMonthlySpend(subscriptions)}
        monthlySavings={getMonthlySavings(subscriptions)}
      />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="h-[70vh] min-h-[480px] xl:h-[calc(100vh-5rem)]">
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            isBusy={isBusy}
            isTyping={isTyping}
            error={error}
            onSend={sendCommand}
          />
        </div>

        <div className="flex h-full min-h-0 flex-col gap-6 xl:h-[calc(100vh-5rem)]">
          <div className="h-[600px] xl:h-[minmax(0,1fr)]">
            <SubscriptionList
              subscriptions={subscriptions}
              isLoading={isLoading}
              onAddCustom={() => setShowAddForm(true)}
            />
          </div>
        </div>

        <div className="flex h-full min-h-0 flex-col gap-6 xl:h-[calc(100vh-5rem)]">
          <SavingsChart subscriptions={subscriptions} />
          <BillReminders reminders={reminders} onMarkPaid={markReminderPaid} onDismiss={dismissReminder} />
        </div>
      </main>

      <AddCustomSubscriptionForm
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={addCustomSubscription}
      />
    </div>
  );
}

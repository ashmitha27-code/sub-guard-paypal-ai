import ChatWindow from '@/components/ChatWindow';
import DashboardHeader from '@/components/DashboardHeader';
import SubscriptionList from '@/components/SubscriptionList';
import { useSubguard } from '@/hooks/useSubguard';
import { getMonthlySavings, getMonthlySpend } from '@/lib/subguard-logic';

export default function App() {
  const { subscriptions, messages, isLoading, isBusy, isTyping, error, sendCommand } = useSubguard();

  return (
    <div className="min-h-screen bg-navy-950 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.10),_transparent_55%)] font-sans text-slate-100">
      <DashboardHeader
        monthlySpend={getMonthlySpend(subscriptions)}
        monthlySavings={getMonthlySavings(subscriptions)}
      />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:h-[calc(100vh-5rem)] lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
        <div className="h-[70vh] min-h-[480px] lg:h-full">
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            isBusy={isBusy}
            isTyping={isTyping}
            error={error}
            onSend={sendCommand}
          />
        </div>
        <div className="h-[600px] lg:h-full">
          <SubscriptionList subscriptions={subscriptions} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}

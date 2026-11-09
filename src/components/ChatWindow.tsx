import { useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';
import CommandBar from '@/components/CommandBar';
import MessageBubble, { TypingBubble } from '@/components/MessageBubble';
import type { ChatMessage } from '@/types/subguard';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isBusy: boolean;
  isTyping: boolean;
  error: string | null;
  onSend: (text: string) => void;
}

export default function ChatWindow({ messages, isLoading, isBusy, isTyping, error, onSend }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages.length, isTyping, error]);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-navy-900/70 shadow-2xl shadow-black/40">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-emerald-600">
          <Bot className="h-5 w-5 text-navy-950" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-navy-900" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">subguard</p>
          <p className="text-xs text-emerald-300/80">{isBusy ? 'Working on your request...' : 'Online and monitoring'}</p>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {(isLoading || isTyping) && <TypingBubble />}
        {error && (
          <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        )}
      </div>

      <CommandBar disabled={isBusy || isLoading} onSend={onSend} />
    </section>
  );
}

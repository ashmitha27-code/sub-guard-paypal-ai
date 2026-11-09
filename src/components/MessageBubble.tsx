import type { ChatMessage } from '@/types/subguard';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex animate-fade-up ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[75%] ${
          isUser
            ? 'rounded-br-md bg-emerald-400 font-medium text-navy-950'
            : 'rounded-bl-md border border-white/10 bg-navy-800 text-slate-100'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="flex animate-fade-up justify-start">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/10 bg-navy-800 px-4 py-3">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-2 w-2 animate-bounce rounded-full bg-emerald-300"
            style={{ animationDelay: `${dot * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

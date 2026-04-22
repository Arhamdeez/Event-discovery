import { useState } from 'react';
import GlassSurface from './GlassSurface';
import './AIChatWidget.css';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hi! I'm your events assistant. Ask me to suggest events, explain an event, or help you plan something.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleOpen = () => setIsOpen((v) => !v);

  const buildHardcodedReply = (text) => {
    const lowered = text.toLowerCase();

    if (['hi', 'hey', 'hello', 'yo'].some((greet) => lowered === greet || lowered.startsWith(`${greet} `))) {
      return "Hello! I’m your events copilot.\n\nYou can ask me things like:\n• “What is this site about?”\n• “Help me plan a small meetup in Lahore this weekend.”\n• “Give me venue ideas for a study group.”";
    }

    if (
      lowered.includes('what is this') ||
      lowered.includes('what’s this') ||
      lowered.includes('whats this') ||
      lowered.includes('what is this website') ||
      lowered.includes('what is this site') ||
      lowered.includes('what is raunaq') ||
      lowered.includes('about this website') ||
      lowered.includes('about this site')
    ) {
      return 'Raunaq is built for Pakistan — discover and plan local events in cities like Lahore, Karachi, and Islamabad. Browse mehfils, tech meetups, food walks, and more; filter by city and category; create your own events; and track what you’ve joined in your dashboard.';
    }

    if (lowered.includes('plan') || lowered.includes('idea')) {
      return "Let’s plan something. Tell me:\n• The city\n• Rough date/time\n• Whether it’s a study circle, meetup, or something else.\n\nI’ll suggest a simple structure and next steps.";
    }

    if (lowered.includes('suggest') || lowered.includes('what to do')) {
      return 'For quick ideas, try: a small study jam, a casual coffee meetup, or a weekend workshop. Tell me your city and I can adapt these.';
    }

    if (lowered.includes('venue') || lowered.includes('where')) {
      return 'Pick a venue that is easy to reach by public transport, has reliable Wi‑Fi if you need it, and feels safe after dark. University spaces, cafés, and libraries are great starting points.';
    }

    if (lowered.includes('tickets') || lowered.includes('price') || lowered.includes('free')) {
      return 'For student events, keeping things free or very low‑cost usually works best. You can start free, then test small ticket prices once you know there is consistent interest.';
    }

    return "Got it. I’m running in a demo mode right now, so I’ll answer with best‑practice tips instead of live AI. Tell me the city, date, and type of event you have in mind and I’ll help you shape it.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setError('');
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const nextMessages = [...messages, userMessage].map(({ role, content }) => ({ role, content }));
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.error || 'AI server error');
      }

      const data = await resp.json().catch(() => null);
      const replyText = data?.reply || buildHardcodedReply(trimmed);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-assistant',
          role: 'assistant',
          content: replyText,
        },
      ]);
    } catch (err) {
      setError(err?.message || 'AI is unavailable right now. Using demo mode.');
      const replyText = buildHardcodedReply(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-assistant',
          role: 'assistant',
          content: replyText,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-chat">
      <GlassSurface
        className="ai-chat-toggle-wrap"
        borderRadius={999}
        width={52}
        height={52}
        backgroundOpacity={0.12}
        saturation={1.4}
        displace={0.4}
      >
        <button
          className="ai-chat-toggle"
          type="button"
          onClick={toggleOpen}
          aria-expanded={isOpen}
        >
          <span className="ai-chat-toggle-icon">◎</span>
          <span className="ai-chat-toggle-label">Ask AI</span>
        </button>
      </GlassSurface>

      {isOpen && (
        <GlassSurface
          className="ai-chat-panel"
          borderRadius={24}
          width="min(360px, 90vw)"
          backgroundOpacity={0.08}
          saturation={1.4}
          displace={0.4}
          style={{
            position: 'fixed',
            right: '1.25rem',
            bottom: '5.25rem',
            height: '400px',
            maxHeight: '70vh',
          }}
        >
          <div className="ai-chat-panel-inner">
          <div className="ai-chat-header">
            <div>
              <div className="ai-chat-title">Events Copilot</div>
              <div className="ai-chat-subtitle">Ask about events, ideas, and planning</div>
            </div>
            <button className="ai-chat-close" type="button" onClick={toggleOpen}>
              ×
            </button>
          </div>

          <div className="ai-chat-messages">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`ai-chat-message ai-chat-message--${m.role === 'user' ? 'user' : 'assistant'}`}
              >
                {m.content}
              </div>
            ))}
            {error ? (
              <div className="ai-chat-message ai-chat-message--assistant ai-chat-message--typing">
                {error}
              </div>
            ) : null}
            {isLoading && (
              <div className="ai-chat-message ai-chat-message--assistant ai-chat-message--typing">
                Thinking…
              </div>
            )}
          </div>

          <form className="ai-chat-input-row" onSubmit={handleSubmit}>
            <input
              className="ai-chat-input input"
              placeholder="Ask about events, venues, or plans…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="ai-chat-send btn btn-primary" type="submit" disabled={isLoading}>
              Send
            </button>
          </form>
          </div>
        </GlassSurface>
      )}
    </div>
  );
}


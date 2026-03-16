import { useState } from 'react';
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

  const toggleOpen = () => setIsOpen((v) => !v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:4000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('Chat request failed');
      }

      const data = await res.json();
      const assistantReply =
        data?.reply ||
        data?.message ||
        "I'm here to help with events, but I couldn't understand that.";

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + '-assistant', role: 'assistant', content: assistantReply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-error',
          role: 'assistant',
          content:
            'Sorry, something went wrong talking to the AI service. Please try again in a moment.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-chat">
      <button
        className="ai-chat-toggle glass-card"
        type="button"
        onClick={toggleOpen}
        aria-expanded={isOpen}
      >
        <span className="ai-chat-toggle-icon">◎</span>
        <span className="ai-chat-toggle-label">Ask AI</span>
      </button>

      {isOpen && (
        <div className="ai-chat-panel glass-card">
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
      )}
    </div>
  );
}


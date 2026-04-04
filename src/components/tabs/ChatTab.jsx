import React, { useState, useRef, useEffect, useMemo } from 'react';

const RECIPIENT_ALL = 'Alle';

export default function ChatTab({ messages, onSend, units }) {
  const [inputText, setInputText]   = useState('');
  const [recipients, setRecipients] = useState([RECIPIENT_ALL]);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);
  const recipientRef   = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (recipientRef.current && !recipientRef.current.contains(e.target)) {
        setRecipientOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Build list of teams and individual units from props
  const recipientOptions = useMemo(() => {
    const teams = new Set();
    (units || []).forEach(u => { if (u.team) teams.add(u.team); });
    const opts = [
      { id: RECIPIENT_ALL, label: 'Alle (kringkast)', isTeam: true },
      ...Array.from(teams).map(t => ({ id: t, label: `Team: ${t}`, isTeam: true })),
      ...(units || []).map(u => ({ id: u.id, label: `${u.id} — ${u.name}`, isTeam: false })),
    ];
    return opts;
  }, [units]);

  const toggleRecipient = (id) => {
    if (id === RECIPIENT_ALL) {
      setRecipients([RECIPIENT_ALL]);
      return;
    }
    setRecipients(prev => {
      const without = prev.filter(r => r !== RECIPIENT_ALL);
      if (without.includes(id)) {
        const next = without.filter(r => r !== id);
        return next.length === 0 ? [RECIPIENT_ALL] : next;
      }
      return [...without, id];
    });
  };

  const recipientLabel = recipients.includes(RECIPIENT_ALL)
    ? RECIPIENT_ALL
    : recipients.join(', ');

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    const toAll = recipients.includes(RECIPIENT_ALL) || recipients.length === 0;
    onSend(text, toAll ? null : recipients);
    setInputText('');
    setRecipients([RECIPIENT_ALL]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  };

  return (
    <>
      <div className="section-header">
        <span className="section-title">Oppdragschat</span>
        <div className="section-actions">
          <button className="icon-btn" title="Tøm chat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="chat-messages">
        <div className="chat-date-divider">I dag</div>
        {messages.map((msg, i) => (
          <ChatMessage key={msg.id ?? i} msg={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        {/* Recipient picker */}
        <div className="chat-recipient-row" ref={recipientRef} style={{ position: 'relative', marginBottom: '4px' }}>
          <button
            className="chat-recipient-btn"
            onClick={() => setRecipientOpen(v => !v)}
            title="Velg mottakere"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Til: {recipientLabel}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {recipientOpen && (
            <div className="chat-recipient-dropdown">
              {recipientOptions.map(opt => (
                <label key={opt.id} className="chat-recipient-option">
                  <input
                    type="checkbox"
                    checked={recipients.includes(opt.id) || (opt.id === RECIPIENT_ALL && recipients.includes(RECIPIENT_ALL))}
                    onChange={() => toggleRecipient(opt.id)}
                  />
                  <span className={opt.isTeam ? 'chat-recipient-team' : ''}>{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="chat-input-row">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder="Skriv en melding… (Enter for å sende)"
            rows={1}
            value={inputText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
          />
          <button className="chat-send-btn" onClick={handleSend} title="Send">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

function ChatMessage({ msg }) {
  if (msg.system) {
    return (
      <div className="chat-msg">
        <div className="chat-msg-bubble system" style={{ width: '100%', textAlign: 'center' }}>
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-msg${msg.self ? ' self' : ''}`}>
      <div className="chat-msg-avatar" style={{ background: msg.color }}>
        {msg.initials}
      </div>
      <div className="chat-msg-body">
        <div className="chat-msg-header">
          <span className="chat-msg-name">{msg.sender}</span>
          <span className="chat-msg-time">{msg.time}</span>
        </div>
        {msg.recipients && msg.recipients.length > 0 && (
          <div className="chat-msg-recipients">
            Til: {msg.recipients.join(', ')}
          </div>
        )}
        <div className="chat-msg-bubble">{msg.text}</div>
      </div>
    </div>
  );
}

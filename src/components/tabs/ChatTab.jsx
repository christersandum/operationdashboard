import React, { useState, useRef, useEffect } from 'react';

export default function ChatTab({ messages, onSend }) {
  const [inputText, setInputText]   = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    onSend(text);
    setInputText('');
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
        <div className="chat-msg-bubble">{msg.text}</div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown'; 
import type { Message } from './ChatView';
import AudioPlayer from './AudioPlayer';
import MessageToggle from './MessageToggle';
import { Bot, Trash2 } from 'lucide-react';

interface MessagesContainerProps {
  messages: Message[];
  isTyping: boolean;
  onDeleteMessage: (messageId: string) => void;
}

const MessagesContainer: React.FC<MessagesContainerProps> = ({ messages, isTyping, onDeleteMessage }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAudioStates, setShowAudioStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const newStates: Record<string, boolean> = {};
    messages.forEach(message => {
      if (message.content && message.audioUrl) {
        if (!(message.id in showAudioStates)) {
          newStates[message.id] = false;
        }
      }
    });
    
    if (Object.keys(newStates).length > 0) {
      setShowAudioStates(prev => ({ ...prev, ...newStates }));
    }
  }, [messages, showAudioStates]);

  const toggleMessageView = (messageId: string) => {
    setShowAudioStates(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const MessageBody: React.FC<{ message: Message }> = ({ message }) => {
    const showAudio = showAudioStates[message.id] || false;
    
    // Show audio toggle for messages that have both text and audio
    // The isTyping state is not used here because it only indicates new response generation,
    // not whether existing messages should show their toggles
    const shouldShowAudioToggle = message.content && message.audioUrl;
    
    return (
      <div className="message-content">
        {shouldShowAudioToggle && (
          <MessageToggle
            showAudio={showAudio}
            onToggle={() => toggleMessageView(message.id)}
            hasText={!!message.content}
            hasAudio={!!message.audioUrl}
          />
        )}

        {message.content && !(message.audioUrl && showAudio) && (
          // Use ReactMarkdown to render the text content
          <div className="text-content">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        
        {message.audioUrl && (!message.content || showAudio) && (
            <div className="audio-content">
              <AudioPlayer audioUrl={message.audioUrl} />
            </div>
        )}
      </div>
    );
  };

  return (
      <div className="messages-container" ref={containerRef}>
        <div className="messages-list">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.type === 'human' ? 'user' : 'ai'}`}>
              {message.type === 'human' ? (
                  <div>

                <div className="message-bubble message-with-delete">
                  <MessageBody message={message} />
                </div>
                    <button
                        className="delete-message-btn"
                        onClick={() => onDeleteMessage(message.id)}
                        title="Delete message"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
              ) : (
                <>
                  <div className="ai-message-header">
                    <Bot size={16} />
                    <span>I-DY</span>

                  </div>
                  <div className="message-bubble">
                    <MessageBody message={message} />

                  </div>
                  <button
                      className="delete-message-btn"
                      onClick={() => onDeleteMessage(message.id)}
                      title="Delete message"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="typing-indicator">
              <Bot size={16} />
              <div className="dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
              <span>AI is processing...</span>
            </div>
          )}
        </div>
      </div>
  );
};

export default MessagesContainer;

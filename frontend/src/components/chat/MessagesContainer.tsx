import React, { useEffect, useRef, useState, createRef } from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "./ChatView";
import AudioPlayer from "../ui/AudioPlayer";
import { Bot, Trash2, Copy, Volume2 } from "lucide-react";

interface AudioPlayerHandle {
  play: () => void;
}

interface MessagesContainerProps {
  messages: Message[];
  isTyping: boolean;
  onDeleteMessage: (messageId: string) => void;
}

const MessagesContainer: React.FC<MessagesContainerProps> = ({
  messages,
  isTyping,
  onDeleteMessage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<Record<string, React.RefObject<AudioPlayerHandle>>>(
    {}
  );
  const [copiedMessages, setCopiedMessages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    messages.forEach((message) => {
      if (message.audioUrl && !audioRefs.current[message.id]) {
        audioRefs.current[message.id] = createRef<AudioPlayerHandle>();
      }
    });
  }, [messages]);

  const handleCopy = (messageId: string, content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopiedMessages((prev) => new Set([...prev, messageId]));
        setTimeout(() => {
          setCopiedMessages((prev) => {
            const newSet = new Set(prev);
            newSet.delete(messageId);
            return newSet;
          });
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const MessageBody: React.FC<{ message: Message }> = ({ message }) => {
    return (
      <div className="message-content">
        {message.content && (
          // Use ReactMarkdown to render the text content
          <div className="text-content">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {message.audioUrl && (
          <div className="audio-content hidden">
            <AudioPlayer
              ref={audioRefs.current[message.id]}
              audioUrl={message.audioUrl}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="messages-container" ref={containerRef}>
      <div className="messages-list">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.type === "human" ? "user" : "ai"}`}
          >
            {message.type === "human" ? (
              <div>
                <div className="message-bubble">
                  <MessageBody message={message} />
                </div>
                <div className="message-actions">
                  {message.content && (
                    <button
                      className="copy-message-btn"
                      onClick={() =>
                        handleCopy(message.id, message.content || "")
                      }
                      title="Copy message"
                    >
                      <Copy size={14} />
                      {copiedMessages.has(message.id) && (
                        <span className="copied-feedback">Copied!</span>
                      )}
                    </button>
                  )}
                  {message.audioUrl && (
                    <button
                      className="copy-message-btn"
                      onClick={() => {
                        const ref = audioRefs.current[message.id];
                        if (ref && ref.current) {
                          ref.current.play();
                        }
                      }}
                      title="Play audio"
                    >
                      <Volume2 size={14} />
                    </button>
                  )}
                  <button
                    className="delete-message-btn"
                    onClick={() => onDeleteMessage(message.id)}
                    title="Delete message"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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
                <div className="message-actions">
                  {message.content && (
                    <button
                      className="copy-message-btn"
                      onClick={() =>
                        handleCopy(message.id, message.content || "")
                      }
                      title="Copy message"
                    >
                      <Copy size={14} />
                      {copiedMessages.has(message.id) && (
                        <span className="copied-feedback">Copied!</span>
                      )}
                    </button>
                  )}
                  {message.audioUrl && (
                    <button
                      className="copy-message-btn"
                      onClick={() => {
                        const ref = audioRefs.current[message.id];
                        if (ref && ref.current) {
                          ref.current.play();
                        }
                      }}
                      title="Play audio"
                    >
                      <Volume2 size={14} />
                    </button>
                  )}
                  <button
                    className="delete-message-btn"
                    onClick={() => onDeleteMessage(message.id)}
                    title="Delete message"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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

import React, { useEffect, useRef, useState, createRef } from "react";
import ReactMarkdown from "react-markdown";
import type { Options } from "react-markdown";
import type { Message } from "../../types/chat";
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

const markdownComponents: Options["components"] = {
  h1: ({ ...props }) => <h1 className="text-2xl font-semibold border-b-2 border-primary pb-1 mt-6 mb-3" {...props} />,
  h2: ({ ...props }) => <h2 className="text-xl font-semibold mt-6 mb-3" {...props} />,
  h3: ({ ...props }) => <h3 className="text-lg font-semibold mt-6 mb-3" {...props} />,
  p: ({ ...props }) => <p className="leading-relaxed" {...props} />,
  ul: ({ ...props }) => <ul className="list-disc pl-6 my-3" {...props} />,
  ol: ({ ...props }) => <ol className="list-decimal pl-6 my-3" {...props} />,
  li: ({ ...props }) => <li className="mb-1" {...props} />,
  a: ({ ...props }) => <a className="text-primary hover:underline" {...props} />,
  blockquote: ({ ...props }) => <blockquote className="border-l-4 border-primary/30 bg-muted/20 p-3 my-4 italic rounded-r-md" {...props} />,
  table: ({ ...props }) => <table className="w-full border-collapse border border-border my-4" {...props} />,
  th: ({ ...props }) => <th className="bg-muted p-3 text-left font-semibold border-b border-border" {...props} />,
  td: ({ ...props }) => <td className="p-3 border-b border-border" {...props} />,
  pre: ({ ...props }) => <pre className="bg-muted/20 border border-border p-4 rounded-md my-4 overflow-x-auto text-sm shadow-sm" {...props} />,
  code: ({ inline, ...props }) => (
      inline ? (
          <code className="bg-muted/50 text-foreground px-1.5 py-0.5 rounded-md text-sm border border-border/50" {...props} />
      ) : (
          <code className="font-mono" {...props} />
      )
  ),
  hr: ({ ...props }) => <hr className="border-t border-border my-6" {...props} />,
  img: ({ ...props }) => <img className="max-w-full h-auto rounded-md my-3 shadow-md" {...props} />,
};

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

  const MessageActionButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { isUserMessage?: boolean }> = ({ children, className, isUserMessage, ...props }) => (
      <button
          className={`relative flex items-center justify-center gap-1 rounded-md border bg-transparent p-1 px-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted hover:border-muted-foreground hover:text-foreground 
            ${isUserMessage ? 'border-black/30 text-black hover:bg-black/10 hover:border-black/50' : 'border-border'} ${className}`}
          {...props}
      >
        {children}
      </button>
  );

  const MessageBody: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.type === 'human';
    return (
        <div className={`break-words text-left leading-relaxed ${isUser ? '' : 'prose prose-sm max-w-none'}`}>
          {message.content && (
              <div className="text-content">
                <ReactMarkdown components={markdownComponents}>
                  {message.content}
                </ReactMarkdown>
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
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:mb-0 mb-[76px]" ref={containerRef}>
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((message) => {
            const isUser = message.type === 'human';
            return (
                <div
                    key={message.id}
                    className={`group flex max-w-[90%] flex-col ${
                        isUser ? "self-end items-end" : "self-start items-start max-w-full"
                    }`}
                >
                  <div
                      className={` px-5 py-3 ${
                          isUser
                              ? "rounded-xl border-transparent bg-white text-black"
                              : "rounded-bl-lg border-border px-2 py-3"
                      }`}
                  >
                    <MessageBody message={message} />
                  </div>
                  <div
                      className={`mt-2 flex items-center justify-start px-1 py-1 opacity-0 transition-opacity duration-200 ease-in-out group-hover:opacity-70 ${
                          isUser && "justify-end"
                      }`}
                  >
                    {message.content && (
                        <MessageActionButton
                            onClick={() => handleCopy(message.id, message.content || "")}
                            title="Copy message"
                            isUserMessage={isUser}
                        >
                          <Copy size={14} />
                          {copiedMessages.has(message.id) && (
                              <span className="absolute -top-6 rounded-md bg-black px-2 py-1 text-xs text-white">Copied!</span>
                          )}
                        </MessageActionButton>
                    )}
                    {message.audioUrl && (
                        <MessageActionButton
                            onClick={() => audioRefs.current[message.id]?.current?.play()}
                            title="Play audio"
                            isUserMessage={isUser}
                            className="ml-1"
                        >
                          <Volume2 size={14} />
                        </MessageActionButton>
                    )}
                    <MessageActionButton
                        onClick={() => onDeleteMessage(message.id)}
                        title="Delete message"
                        isUserMessage={isUser}
                        className="ml-1"
                    >
                      <Trash2 size={14} />
                    </MessageActionButton>
                  </div>
                </div>
            );
          })}

          {isTyping && (
              <div className="flex items-center gap-2 self-start font-style: italic text-muted-foreground">
                <Bot size={16} />
                <div className="dots flex gap-1">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground"></div>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground [animation-delay:0.2s]"></div>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground [animation-delay:0.4s]"></div>
                </div>
                <span>AI is processing...</span>
              </div>
          )}
        </div>
      </div>
  );
};

export default MessagesContainer;
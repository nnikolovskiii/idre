import React, { useEffect, useRef, useState, createRef } from "react";
import ReactMarkdown from "react-markdown";
import type { Options } from "react-markdown";
import remarkGfm from "remark-gfm"; // 1. Import remark-gfm
import type { Message } from "../../types/chat";
import AudioPlayer from "../ui/AudioPlayer";
import { Copy, Trash2, Volume2, Check } from "lucide-react";

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface AudioPlayerHandle {
    play: () => void;
}

interface MessagesContainerProps {
    messages: Message[];
    isTyping: boolean;
    loadingMessages: boolean;
    onDeleteMessage: (messageId: string) => void;
}

// --- CodeBlock Component ---
const CodeBlock: React.FC<React.HTMLAttributes<HTMLPreElement>> = ({ children, ...props }) => {
    const [isCopied, setIsCopied] = useState(false);
    const preRef = useRef<HTMLPreElement>(null);

    const handleCopy = async () => {
        if (!preRef.current) return;
        const codeText = preRef.current.textContent || "";

        try {
            await navigator.clipboard.writeText(codeText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy code:", error);
        }
    };

    return (
        <div className="relative group my-4 rounded-md overflow-hidden border border-border">
            <pre
                ref={preRef}
                className="bg-[#1e1e1e] p-4 overflow-x-auto text-sm"
                {...props}
            >
                {children}
            </pre>
            <div className="absolute right-2 inset-y-0 pointer-events-none">
                <button
                    onClick={handleCopy}
                    className="sticky top-2 mt-2 p-1.5 rounded-md bg-zinc-700/50 backdrop-blur-sm border border-zinc-600 text-zinc-200 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-zinc-600 hover:text-white pointer-events-auto shadow-sm"
                    title="Copy code"
                    aria-label="Copy code"
                >
                    {isCopied ? (
                        <Check size={14} className="text-green-400" />
                    ) : (
                        <Copy size={14} />
                    )}
                </button>
            </div>
        </div>
    );
};

// --- Markdown Components ---
const markdownComponents: Options["components"] = {
    h1: ({ ...props }) => <p className="text-lg font-bold mt-6 mb-3 border-b-2 border-border" {...props} />,
    h2: ({ ...props }) => <p className="mt-5 mb-2 font-semibold text-lg" {...props} />,
    h3: ({ ...props }) => <p className="mt-4 mb-2 font-semibold" {...props} />,
    p: ({ ...props }) => <p className="leading-7 my-2" {...props} />,
    ul: ({ ...props }) => <ul className="list-disc pl-6 my-3" {...props} />,
    ol: ({ ...props }) => <ol className="list-decimal pl-6 my-3" {...props} />,
    li: ({ ...props }) => <li className="mb-1" {...props} />,
    a: ({ ...props }) => <a className="text-primary hover:underline font-medium" {...props} />,
    blockquote: ({ ...props }) => <blockquote className="border-l-4 border-border bg-muted/50 p-3 my-4 italic rounded-r-md" {...props} />,

    // Updated Table styling to handle overflow and borders better
    table: ({ ...props }) => (
        <div className="my-4 w-full overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-sm" {...props} />
        </div>
    ),
    th: ({ ...props }) => <th className="bg-muted p-3 text-left font-semibold border-b border-border last:border-0" {...props} />,
    td: ({ ...props }) => <td className="p-3 border-b border-border last:border-0" {...props} />,

    hr: ({ ...props }) => <hr className="border-t border-border my-6" {...props} />,
    img: ({ ...props }) => <img className="max-w-full h-auto rounded-md my-3 shadow-md border border-border" {...props} />,

    pre: CodeBlock,
    code: ({ inline, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : null;

        return !inline && language ? (
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={language}
                PreTag="div"
                customStyle={{
                    margin: 0,
                    padding: 0,
                    background: 'transparent',
                    fontSize: '0.875rem',
                }}
                {...props}
            >
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        ) : (
            <code
                className={inline
                    ? "bg-muted text-foreground px-1.5 py-0.5 rounded-md text-[0.9rem] border border-border font-mono"
                    : "font-mono"
                }
                {...props}
            >
                {children}
            </code>
        );
    }
};

const MessagesContainer: React.FC<MessagesContainerProps> = ({
                                                                 messages,
                                                                 isTyping,
                                                                 loadingMessages,
                                                                 onDeleteMessage,
                                                             }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const audioRefs = useRef<Record<string, React.RefObject<AudioPlayerHandle>>>(
        {}
    );
    const [copiedMessages, setCopiedMessages] = useState<Set<string>>(new Set());
    const [chatCopied, setChatCopied] = useState(false);

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

    const handleCopyChat = async () => {
        if (!messages || messages.length === 0) {
            return;
        }

        const formattedMessages = messages.map((message) => {
            const prefix = message.type === 'human' ? '# User:' : '#AI assistant:';
            const content = message.audioUrl ? '[Audio message]' : (message.content || '');
            return `${prefix}\n${content}`;
        }).join('\n\n');

        try {
            await navigator.clipboard.writeText(formattedMessages);
            setChatCopied(true);
            setTimeout(() => setChatCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy chat:', error);
        }
    };

    const MessageActionButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, ...props }) => (
        <button
            className={`relative flex items-center justify-center gap-1.5 rounded-md border border-transparent bg-transparent p-1 px-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted hover:border-border hover:text-foreground ${className}`}
            {...props}
        >
            {children}
        </button>
    );

    const MessageBody: React.FC<{ message: Message }> = ({ message }) => {
        const isUser = message.type === 'human';
        const messageClass = isUser
            ? 'text-primary-foreground'
            : 'prose dark:prose-invert max-w-none text-foreground';

        return (
            <div className={`break-words text-left leading-relaxed ${messageClass}`}>
                {message.content && (
                    <div className="text-content">
                        <ReactMarkdown
                            components={markdownComponents}
                            remarkPlugins={[remarkGfm]} // 2. Add the plugin here
                        >
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
        <div className="flex-1 overflow-y-auto p-4 md:mb-0" ref={containerRef}>
            <div className="mx-auto flex max-w-3xl flex-col gap-6">
                {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground">
                        <div className="h-8 w-8 border-4 border-border border-t-primary rounded-full animate-spin"></div>
                        <span className="text-sm">Loading messages...</span>
                    </div>
                ) : (
                    messages.map((message) => {
                        const isUser = message.type === 'human';
                        return (
                            <div
                                key={message.id}
                                className={`group flex max-w-[95%] flex-col md:max-w-[100%] ${
                                    isUser ? "self-end items-end" : "self-start items-start"
                                }`}
                            >
                                <div
                                    className={`w-full rounded-xl px-4 py-1 ${
                                        isUser
                                            ? "bg-muted text-primary-foreground rounded-br-none"
                                            : "bg-background text-card-foreground rounded-bl-none"
                                    }`}
                                >
                                    <MessageBody message={message} />
                                </div>

                                <div
                                    className={`mt-1.5 flex items-center justify-start px-1 opacity-0 transition-opacity duration-200 ease-in-out group-hover:opacity-100 ${
                                        isUser && "justify-end"
                                    }`}
                                >
                                    {message.content && (
                                        <MessageActionButton
                                            onClick={() => handleCopy(message.id, message.content || "")}
                                            title="Copy message"
                                        >
                                            <Copy size={14} />
                                            {copiedMessages.has(message.id) && (
                                                <span className="absolute -top-7 rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-lg">
                                                Copied!
                                            </span>
                                            )}
                                        </MessageActionButton>
                                    )}
                                    {message.audioUrl && (
                                        <MessageActionButton
                                            onClick={() => audioRefs.current[message.id]?.current?.play()}
                                            title="Play audio"
                                            className="ml-1"
                                        >
                                            <Volume2 size={14} />
                                        </MessageActionButton>
                                    )}
                                    <MessageActionButton
                                        onClick={() => onDeleteMessage(message.id)}
                                        title="Delete message"
                                        className="ml-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                                    >
                                        <Trash2 size={14} />
                                    </MessageActionButton>
                                </div>
                            </div>
                        );
                    })
                )}

                {isTyping && (
                    <div className="flex items-center gap-3 self-start text-muted-foreground p-2">
                        <div className="dots flex gap-1.5">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground [animation-delay:-0.3s]"></div>
                            <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground [animation-delay:-0.15s]"></div>
                            <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground"></div>
                        </div>
                        <span className="text-sm italic">AI is processing...</span>
                    </div>
                )}

                {messages && messages.length > 0 && (
                    <div className="flex justify-center mt-4">
                        <button
                            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-border bg-transparent text-muted-foreground transition-all duration-200 hover:bg-muted hover:border-border hover:text-foreground"
                            onClick={handleCopyChat}
                            title={chatCopied ? "Copied!" : "Copy entire chat"}
                        >
                            <Copy size={14} />
                            <span>{chatCopied ? "Copied!" : "Copy chat"}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesContainer;
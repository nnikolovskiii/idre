// /home/nnikolovskii/dev/general-chat/frontend/src/components/chat/BrainstormSuggestions.tsx:
import React, { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, Brain, Target, Zap, MessageSquare } from 'lucide-react';

interface Suggestion {
    id: string;
    text: string;
    icon: React.ReactNode;
    color: string;
}

interface BrainstormSuggestionsProps {
    visible: boolean;
    onSuggestionClick: (suggestion: string) => void;
}

const BrainstormSuggestions: React.FC<BrainstormSuggestionsProps> = ({
                                                                         visible,
                                                                         onSuggestionClick
                                                                     }) => {
    const [animatedBubbles, setAnimatedBubbles] = useState<number[]>([]);

    const suggestions: Suggestion[] = [
        {
            id: '1',
            text: 'App for healthcare ideas.',
            icon: <Lightbulb size={16} />,
            color: 'from-green-400 to-emerald-400'
        },
        {
            id: '2',
            text: 'Project keywords: design, tables, business.',
            icon: <Brain size={16} />,
            color: 'from-blue-400 to-cyan-400'
        },
        {
            id: '3',
            text: 'What are different approaches to achieve my goals?',
            icon: <Target size={16} />,
            color: 'from-green-400 to-emerald-400'
        },
        {
            id: '4',
            text: 'Give me some innovative thinking prompts',
            icon: <Sparkles size={16} />,
            color: 'from-blue-400 to-cyan-400'
        },
        {
            id: '5',
            text: 'How can I think outside the box?',
            icon: <Zap size={16} />,
            color: 'from-green-400 to-emerald-400'
        },
        {
            id: '6',
            text: 'Build a brand for photographer.',
            icon: <MessageSquare size={16} />,
            color: 'from-blue-400 to-cyan-400'
        }
    ];

    useEffect(() => {
        if (visible) {
            // Animate bubbles appearing one by one
            const timeouts = suggestions.map((_, index) =>
                setTimeout(() => {
                    setAnimatedBubbles(prev => [...prev, index]);
                }, index * 100)
            );

            return () => {
                timeouts.forEach(clearTimeout);
                setAnimatedBubbles([]);
            };
        } else {
            setAnimatedBubbles([]);
        }
    }, [visible]);

    if (!visible) return null;

    const handleSuggestionClick = (suggestion: string) => {
        onSuggestionClick(suggestion);
    };

    return (
        <div className="relative md:absolute md:bottom-full md:left-0 md:right-0 mb-6 md:mb-[120px] px-4">
            <div className="relative mx-auto max-w-3xl">
                <div className="flex flex-wrap gap-2 justify-center">
                    {suggestions.map((suggestion, index) => {
                        const isAnimated = animatedBubbles.includes(index);
                        return (
                            <button
                                key={suggestion.id}
                                onClick={() => handleSuggestionClick(suggestion.text)}
                                className={`
                  relative flex items-center gap-2 px-3 py-2 rounded-full
                  bg-gradient-to-r ${suggestion.color}
                  text-white text-sm font-medium
                  shadow-lg hover:shadow-xl
                  transform transition-all duration-300 ease-out
                  hover:scale-105 active:scale-95
                  ${isAnimated
                                    ? 'opacity-100 translate-y-0'
                                    : 'opacity-0 translate-y-4'
                                }
                `}
                                style={{
                                    animation: isAnimated ? `float 3s ease-in-out infinite` : 'none',
                                    animationDelay: `${index * 0.5}s`
                                }}
                            >
                <span className="flex-shrink-0">
                  {suggestion.icon}
                </span>
                                <span className="truncate max-w-[200px]">
                  {suggestion.text}
                </span>
                                <div className="absolute inset-0 rounded-full bg-white opacity-0 hover:opacity-20 transition-opacity duration-200" />
                            </button>
                        );
                    })}
                </div>

            </div>

            <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
        </div>
    );
};

export default BrainstormSuggestions;
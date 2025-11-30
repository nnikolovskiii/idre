import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Heading, Bold, Italic, Code, Table as TableIcon, List, CheckSquare } from "lucide-react";

// Helper: Get Caret Coordinates
const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
    const div = document.createElement('div');
    const style = window.getComputedStyle(element);
    Array.from(style).forEach(prop => div.style.setProperty(prop, style.getPropertyValue(prop)));
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.textContent = element.value.substring(0, position);
    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);
    document.body.appendChild(div);
    const { offsetLeft: left, offsetTop: top } = span;
    document.body.removeChild(div);
    return { top: top - element.scrollTop, left: left - element.scrollLeft };
};

// Local definition of commands to include Icons properly
const COMMANDS = [
    { id: 'h1', label: 'Heading 1', icon: <Heading size={14} />, value: '# ', offset: 0 },
    { id: 'h2', label: 'Heading 2', icon: <Heading size={12} />, value: '## ', offset: 0 },
    { id: 'bold', label: 'Bold', icon: <Bold size={14} />, value: '**text**', offset: -2 },
    { id: 'italic', label: 'Italic', icon: <Italic size={14} />, value: '*text*', offset: -1 },
    { id: 'code', label: 'Code Block', icon: <Code size={14} />, value: '```javascript\nconsole.log("Hello");\n```', offset: -4 },
    { id: 'table', label: 'Table', icon: <TableIcon size={14} />, value: '| Header | Header |\n|---|---|\n| Cell | Cell |', offset: 0 },
    { id: 'list', label: 'Bullet List', icon: <List size={14} />, value: '- ', offset: 0 },
    { id: 'check', label: 'Checklist', icon: <CheckSquare size={14} />, value: '- [ ] ', offset: 0 },
];

interface MarkdownEditorProps {
    content: string;
    onChange: (val: string) => void;
    onSave: () => void;
    viewMode: 'edit' | 'preview' | 'split';
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ content, onChange, onSave, viewMode }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [slashQuery, setSlashQuery] = useState("");
    const [slashIndex, setSlashIndex] = useState(0);

    const filteredCommands = COMMANDS.filter(c =>
        c.label.toLowerCase().includes(slashQuery.toLowerCase())
    );

    const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        onChange(val);

        if (!showSlashMenu) return;

        const cursorPos = e.target.selectionStart;
        const textBeforeCursor = val.slice(0, cursorPos);
        const slashIdx = textBeforeCursor.lastIndexOf('/');

        if (slashIdx === -1 || (cursorPos - slashIdx > 15)) {
            setShowSlashMenu(false);
            return;
        }

        const query = textBeforeCursor.slice(slashIdx + 1);
        setSlashQuery(query);
        setSlashIndex(0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Handle Ctrl+S for Save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            onSave();
            return;
        }

        if (!textareaRef.current) return;

        if (showSlashMenu) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSlashIndex(prev => Math.max(0, prev - 1));
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSlashIndex(prev => Math.min(filteredCommands.length - 1, prev + 1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                insertCommand(filteredCommands[slashIndex]);
            } else if (e.key === 'Escape') {
                setShowSlashMenu(false);
            }
            return;
        }

        if (e.key === '/') {
            setTimeout(() => {
                if (textareaRef.current) {
                    const { selectionStart } = textareaRef.current;
                    const coords = getCaretCoordinates(textareaRef.current, selectionStart);
                    setMenuPosition({
                        top: coords.top + 24,
                        left: coords.left
                    });
                    setShowSlashMenu(true);
                    setSlashQuery("");
                    setSlashIndex(0);
                }
            }, 10);
        }
    };

    const insertCommand = (cmd: typeof COMMANDS[0]) => {
        if (!textareaRef.current || !cmd) return;

        const textarea = textareaRef.current;
        const cursorPos = textarea.selectionStart;
        const textBefore = content.slice(0, cursorPos);
        const slashIdx = textBefore.lastIndexOf('/');
        const textAfter = content.slice(cursorPos);
        const newTextBefore = content.slice(0, slashIdx);
        const newContent = newTextBefore + cmd.value + textAfter;

        onChange(newContent);
        setShowSlashMenu(false);

        setTimeout(() => {
            textarea.focus();
            const newCursorPos = slashIdx + cmd.value.length + (cmd.offset || 0);
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 50);
    };

    return (
        <div className="flex h-full w-full relative group/editor">
            {/* EDIT PANE */}
            <div className={`
                flex-1 h-full relative transition-all
                ${viewMode === 'preview' ? 'hidden' : 'block'}
                ${viewMode === 'split' ? 'w-1/2 border-r border-border' : 'w-full'}
            `}>
                <textarea
                    ref={textareaRef}
                    className="w-full h-full p-6 bg-background text-foreground font-mono text-sm resize-none focus:outline-none leading-relaxed"
                    value={content}
                    onChange={handleEditorChange}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                    placeholder="Start typing... Use '/' for commands"
                />

                {/* SLASH MENU */}
                {showSlashMenu && (
                    <div
                        className="absolute z-50 w-64 bg-popover border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                        style={{ top: menuPosition.top, left: menuPosition.left }}
                    >
                        <div className="bg-muted/50 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                            Basic blocks
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1">
                            {filteredCommands.length > 0 ? (
                                filteredCommands.map((cmd, idx) => (
                                    <button
                                        key={cmd.id}
                                        className={`
                                            w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left
                                            ${idx === slashIndex ? 'bg-accent text-accent-foreground' : 'text-popover-foreground hover:bg-muted'}
                                        `}
                                        onClick={() => insertCommand(cmd)}
                                        onMouseEnter={() => setSlashIndex(idx)}
                                    >
                                        <div className="p-1 rounded bg-background border border-border shadow-sm">
                                            {cmd.icon}
                                        </div>
                                        <span className="font-medium">{cmd.label}</span>
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-2 text-sm text-muted-foreground italic">No commands found</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* PREVIEW PANE */}
            <div className={`
                h-full bg-background overflow-y-auto p-8 
                prose dark:prose-invert prose-sm max-w-none
                prose-pre:bg-transparent prose-pre:p-0 text-left
                ${viewMode === 'edit' ? 'hidden' : 'block'}
                ${viewMode === 'split' ? 'w-1/2 bg-muted/5' : 'w-full max-w-5xl'}
            `}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code({inline, className, children, ...props}: any) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                                <div className="rounded-md overflow-hidden my-4 border border-border shadow-sm">
                                    <div className="bg-muted/50 px-3 py-1 text-xs text-muted-foreground border-b border-border font-mono">
                                        {match[1]}
                                    </div>
                                    <SyntaxHighlighter
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                        customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.875rem' }}
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                </div>
                            ) : (
                                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary" {...props}>
                                    {children}
                                </code>
                            )
                        },
                        table({children}) {
                            return <div className="overflow-x-auto my-4 border rounded-md"><table className="w-full text-sm text-left">{children}</table></div>
                        },
                        thead({children}) {
                            return <thead className="bg-muted/50 border-b border-border uppercase text-xs font-semibold text-muted-foreground">{children}</thead>
                        },
                        th({children}) {
                            return <th className="px-4 py-3 whitespace-nowrap">{children}</th>
                        },
                        td({children}) {
                            return <td className="px-4 py-3 border-b border-border last:border-0">{children}</td>
                        }
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </div>
    );
};

export default MarkdownEditor;
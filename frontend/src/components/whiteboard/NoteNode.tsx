import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileText, Plus, Sparkles } from 'lucide-react';

interface NoteNodeData {
    text?: string;
    onDataChange?: (id: string, data: object) => void;
    onCreateChild?: (parentId: string, nodeType: 'ideaNode' | 'topicNode' | 'noteNode') => void;
    onGenerate?: (parentId: string) => void;
    isGenerating?: boolean;
}

const handleStyle = { opacity: 0, width: 10, height: 10, background: 'transparent' };

const NoteNode: React.FC<NodeProps> = ({ id, data }) => {
    const nodeData = data as NoteNodeData;
    const isGenerating = nodeData.isGenerating;

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        nodeData.onDataChange?.(id, { text: event.target.value });
    };

    return (
        <div className={`group bg-yellow-50 dark:bg-yellow-900/10 rounded-lg shadow-sm p-3 w-64 border transition-all duration-300
             ${isGenerating
            ? 'border-yellow-400 ring-2 ring-yellow-200 dark:ring-yellow-900/30'
            : 'border-yellow-200 dark:border-yellow-700'
        }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <FileText className="text-yellow-600 dark:text-yellow-400" size={16} />
                    <span className="font-semibold text-foreground">Note</span>
                </div>

                {isGenerating ? (
                    <Sparkles size={14} className="text-yellow-500 animate-spin" />
                ) : (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => nodeData.onGenerate?.(id)} className="bg-yellow-100 dark:bg-yellow-800/50 hover:bg-yellow-200 dark:hover:bg-yellow-700 p-1.5 rounded-md text-yellow-700 dark:text-yellow-300" title="Generate with AI">
                            <Sparkles size={12} />
                        </button>
                        <button onClick={() => nodeData.onCreateChild?.(id, 'noteNode')} className="bg-yellow-200 dark:bg-yellow-700 hover:bg-yellow-300 dark:hover:bg-yellow-600 p-1.5 rounded-md text-yellow-800 dark:text-yellow-200" title="Create Child Note">
                            <Plus size={12} />
                        </button>
                    </div>
                )}
            </div>

            {/* Content Area */}
            {isGenerating ? (
                /* Skeleton Loader for Text Block */
                <div className="w-full min-h-[80px] p-2 space-y-2 animate-pulse bg-white/50 dark:bg-black/20 rounded">
                    <div className="h-3 bg-yellow-200 dark:bg-yellow-700/50 rounded w-full"></div>
                    <div className="h-3 bg-yellow-200 dark:bg-yellow-700/50 rounded w-5/6"></div>
                    <div className="h-3 bg-yellow-200 dark:bg-yellow-700/50 rounded w-11/12"></div>
                    <div className="h-3 bg-yellow-200 dark:bg-yellow-700/50 rounded w-4/6"></div>
                </div>
            ) : (
                <textarea
                    value={nodeData.text || ''}
                    onChange={handleChange}
                    className="w-full bg-transparent resize-none text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded p-2 min-h-[80px]"
                    placeholder="Add your note here..."
                />
            )}

            <Handle type="source" position={Position.Top} id="t" style={handleStyle} />
            <Handle type="source" position={Position.Right} id="r" style={handleStyle} />
            <Handle type="source" position={Position.Bottom} id="b" style={handleStyle} />
            <Handle type="source" position={Position.Left} id="l" style={handleStyle} />
            <Handle type="target" position={Position.Top} id="tt" style={handleStyle} />
            <Handle type="target" position={Position.Right} id="tr" style={handleStyle} />
            <Handle type="target" position={Position.Bottom} id="tb" style={handleStyle} />
            <Handle type="target" position={Position.Left} id="tl" style={handleStyle} />
        </div>
    );
};

export default NoteNode;
import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { BrainCircuit, Pencil, Plus, Sparkles } from 'lucide-react';

interface IdeaNodeData {
    idea?: string;
    onEdit?: (id: string) => void;
    onDataChange?: (id: string, data: any) => void;
    onCreateChild?: (parentId: string, nodeType: 'ideaNode' | 'topicNode' | 'noteNode') => void;
    onGenerate?: (parentId: string) => void;
    isGenerating?: boolean;
}

// Invisible handle styles
const handleStyle = { opacity: 0, width: 10, height: 10, background: 'transparent' };

const IdeaNode: React.FC<NodeProps> = ({ id, data }) => {
    const nodeData = data as IdeaNodeData;
    const isGenerating = nodeData.isGenerating;

    return (
        <div className={`group relative bg-white dark:bg-card rounded-2xl shadow-sm p-4 w-64 border transition-all duration-300
            ${isGenerating
            ? 'border-pink-400 ring-2 ring-pink-100 dark:ring-pink-900/30 shadow-pink-100'
            : 'border-border hover:border-pink-300'
        }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <BrainCircuit className={`text-pink-500 ${isGenerating ? 'animate-pulse' : ''}`} size={18} />
                    <span className="font-semibold text-foreground text-sm">Idea</span>
                </div>

                {/* Actions or Loading Indicator */}
                {isGenerating ? (
                    <div className="flex items-center gap-1.5 text-pink-500 px-2 py-0.5 bg-pink-50 dark:bg-pink-900/20 rounded-full text-xs font-medium">
                        <Sparkles size={12} className="animate-spin" />
                        <span>Generating...</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => nodeData.onGenerate?.(id)} className="bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/30 dark:hover:bg-pink-900/50 p-1.5 rounded-md text-pink-600 dark:text-pink-400" title="Generate with AI">
                            <Sparkles size={12} />
                        </button>
                        <button onClick={() => nodeData.onCreateChild?.(id, 'ideaNode')} className="bg-accent hover:bg-accent/80 p-1.5 rounded-md text-foreground" title="Create Child Idea">
                            <Plus size={12} />
                        </button>
                        <button onClick={() => nodeData.onEdit?.(id)} className="bg-accent hover:bg-accent/80 p-1.5 rounded-md text-foreground" title="Edit Idea">
                            <Pencil size={12} />
                        </button>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="min-h-[2rem] text-sm text-foreground break-words font-medium">
                {isGenerating ? (
                    /* Skeleton Loader for Idea */
                    <div className="space-y-2 animate-pulse">
                        <div className="h-4 bg-pink-100 dark:bg-pink-900/40 rounded w-11/12"></div>
                        <div className="h-4 bg-pink-100 dark:bg-pink-900/40 rounded w-2/3"></div>
                    </div>
                ) : (
                    nodeData.idea || <span className="text-muted-foreground italic">Empty idea...</span>
                )}
            </div>

            {/* Handles */}
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

export default IdeaNode;
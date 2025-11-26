import React from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import { BrainCircuit, Pencil, Plus, Sparkles } from 'lucide-react';

interface IdeaNodeData {
    idea?: string;
    color?: string;
    onEdit?: (id: string) => void;
    onDataChange?: (id: string, data: any) => void;
    onCreateChild?: (parentId: string, nodeType: 'ideaNode' | 'topicNode' | 'noteNode') => void;
    onGenerate?: (parentId: string) => void;
    isGenerating?: boolean;
}

const handleStyle = { opacity: 0, width: 12, height: 12, background: 'transparent' };

const IdeaNode: React.FC<NodeProps> = ({ id, data, selected }) => {
    const nodeData = data as IdeaNodeData;
    const isGenerating = nodeData.isGenerating;
    const customColor = nodeData.color;

    const containerStyle = customColor
        ? { borderColor: customColor, borderWidth: '2px' }
        : {};

    const iconStyle = { color: customColor || '#ec4899' };

    return (
        <>
            <NodeResizer
                color={customColor || '#ec4899'}
                isVisible={selected}
                minWidth={200}
                maxWidth={600}
                minHeight={100}
                maxHeight={600}
            />
            <div
                className={`group relative bg-white dark:bg-card rounded-2xl shadow-sm p-4 w-full h-full min-w-[200px] border transition-all duration-300 flex flex-col
                ${!customColor && (isGenerating
                        ? 'border-pink-400 ring-2 ring-pink-100 dark:ring-pink-900/30 shadow-pink-100'
                        : 'border-border hover:border-pink-300'
                )}`}
                style={containerStyle}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <BrainCircuit
                            style={iconStyle}
                            className={isGenerating ? 'animate-pulse' : ''}
                            size={18}
                        />
                        <span className="font-semibold text-foreground text-sm">Idea</span>
                    </div>

                    {isGenerating ? (
                        <div className="flex items-center gap-1.5 text-pink-500 px-2 py-0.5 bg-pink-50 dark:bg-pink-900/20 rounded-full text-xs font-medium">
                            <Sparkles size={12} className="animate-spin" />
                            <span>Generating...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => nodeData.onGenerate?.(id)} className="bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/30 dark:hover:bg-pink-900/50 p-1.5 rounded-md text-pink-600 dark:text-pink-400 transition-colors" title="Generate with AI">
                                <Sparkles size={12} />
                            </button>
                            <button onClick={() => nodeData.onCreateChild?.(id, 'ideaNode')} className="bg-accent hover:bg-accent/80 p-1.5 rounded-md text-foreground transition-colors" title="Create Child Idea">
                                <Plus size={12} />
                            </button>
                            <button onClick={() => nodeData.onEdit?.(id)} className="bg-accent hover:bg-accent/80 p-1.5 rounded-md text-foreground transition-colors" title="Edit Idea">
                                <Pencil size={12} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 text-sm text-foreground break-words font-medium overflow-y-auto text-left flex items-start">
                    {isGenerating ? (
                        <div className="space-y-2 animate-pulse w-full">
                            <div className="h-4 bg-pink-100 dark:bg-pink-900/40 rounded w-11/12"></div>
                            <div className="h-4 bg-pink-100 dark:bg-pink-900/40 rounded w-2/3"></div>
                        </div>
                    ) : (
                        nodeData.idea || <span className="text-muted-foreground italic">Empty idea...</span>
                    )}
                </div>

                <Handle type="source" position={Position.Top} id="t" style={handleStyle} />
                <Handle type="source" position={Position.Right} id="r" style={handleStyle} />
                <Handle type="source" position={Position.Bottom} id="b" style={handleStyle} />
                <Handle type="source" position={Position.Left} id="l" style={handleStyle} />
                <Handle type="target" position={Position.Top} id="tt" style={handleStyle} />
                <Handle type="target" position={Position.Right} id="tr" style={handleStyle} />
                <Handle type="target" position={Position.Bottom} id="tb" style={handleStyle} />
                <Handle type="target" position={Position.Left} id="tl" style={handleStyle} />
            </div>
        </>
    );
};

export default IdeaNode;
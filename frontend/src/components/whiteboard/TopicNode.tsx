import React from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import { Lightbulb, Pencil, Plus, Sparkles } from 'lucide-react';

interface TopicNodeData {
    topics?: string[];
    color?: string;
    onEdit?: (id: string) => void;
    onDataChange?: (id: string, data: any) => void;
    onCreateChild?: (parentId: string, nodeType: 'ideaNode' | 'topicNode' | 'noteNode') => void;
    onGenerate?: (parentId: string) => void;
    isGenerating?: boolean;
}

const handleStyle = { opacity: 0, width: 12, height: 12, background: 'transparent' };

const TopicNode: React.FC<NodeProps> = ({ id, data, selected }) => {
    const nodeData = data as TopicNodeData;
    const isGenerating = nodeData.isGenerating;
    const topics = nodeData.topics || [];
    const visibleTopics = topics.slice(0, 3);
    const hiddenCount = Math.max(0, topics.length - 3);
    const customColor = nodeData.color;

    const containerStyle = customColor ? { borderColor: customColor, borderWidth: '2px' } : {};
    const iconStyle = { color: customColor || '#3b82f6' };

    return (
        <>
            <NodeResizer
                color={customColor || '#3b82f6'}
                isVisible={selected}
                minWidth={220}
                maxWidth={600}
                minHeight={100}
                maxHeight={600}
            />
            <div
                className={`group relative bg-muted/50 rounded-2xl shadow-sm p-4 w-full h-full min-w-[220px] border transition-all duration-300 flex flex-col
                ${!customColor && (isGenerating
                        ? 'border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/30'
                        : 'border-border hover:border-primary'
                )}`}
                style={containerStyle}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <Lightbulb
                            style={iconStyle}
                            className={isGenerating ? 'animate-pulse' : ''}
                            size={18}
                        />
                        <span className="font-semibold text-foreground text-sm">Topics</span>
                    </div>

                    {isGenerating ? (
                        <div className="flex items-center gap-1.5 text-blue-500 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-full text-xs font-medium">
                            <Sparkles size={12} className="animate-spin" />
                            <span>Generating...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => nodeData.onGenerate?.(id)} className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 p-1.5 rounded-md text-blue-600 dark:text-blue-400 transition-colors" title="Generate with AI">
                                <Sparkles size={12} />
                            </button>
                            <button onClick={() => nodeData.onCreateChild?.(id, 'topicNode')} className="bg-background hover:bg-accent border border-border p-1.5 rounded-md text-foreground transition-colors" title="Create Child Topic">
                                <Plus size={12} />
                            </button>
                            <button onClick={() => nodeData.onEdit?.(id)} className="bg-background hover:bg-accent border border-border p-1.5 rounded-md text-foreground transition-colors" title="Edit Topics">
                                <Pencil size={12} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="space-y-2 flex-1 overflow-y-auto text-left">
                    {isGenerating ? (
                        <div className="space-y-2 animate-pulse">
                            <div className="bg-card/50 dark:bg-card/20 rounded h-9 w-full flex items-center px-3">
                                <div className="h-3 bg-blue-200 dark:bg-blue-900/40 rounded w-3/4"></div>
                            </div>
                            <div className="bg-card/50 dark:bg-card/20 rounded h-9 w-full flex items-center px-3">
                                <div className="h-3 bg-blue-200 dark:bg-blue-900/40 rounded w-1/2"></div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {visibleTopics.map((topic, index) => (
                                <div key={index} className="bg-card rounded px-3 py-2 text-sm shadow-sm truncate border border-transparent hover:border-border transition-colors text-left">
                                    {topic}
                                </div>
                            ))}
                            {hiddenCount > 0 && <div className="text-xs text-center text-muted-foreground italic py-1">+ {hiddenCount} more topics...</div>}
                            {topics.length === 0 && <div className="text-sm text-muted-foreground italic text-center py-4 border-2 border-dashed border-border rounded-lg">No topics yet</div>}
                        </>
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

export default TopicNode;
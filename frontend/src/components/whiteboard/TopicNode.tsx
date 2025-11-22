import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Lightbulb, Pencil, Plus } from 'lucide-react';

interface TopicNodeData {
    topics?: string[];
    onEdit?: (id: string) => void;
    onDataChange?: (id: string, data: any) => void;
    onCreateChild?: (parentId: string, nodeType: 'ideaNode' | 'topicNode' | 'noteNode') => void;
}

const handleStyle = { opacity: 0, width: 10, height: 10, background: 'transparent' };

const TopicNode: React.FC<NodeProps> = ({ id, data }) => {
    const nodeData = data as TopicNodeData;
    const topics = nodeData.topics || [];
    const visibleTopics = topics.slice(0, 3);
    const hiddenCount = Math.max(0, topics.length - 3);

    return (
        <div className="group relative bg-muted/50 rounded-2xl shadow-sm p-4 w-80 border border-border hover:border-primary transition-colors">
            {/* ... Header and Content ... */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Lightbulb className="text-blue-500" size={18} />
                    <span className="font-semibold text-foreground text-sm">Topics</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => nodeData.onCreateChild?.(id, 'topicNode')} className="bg-background hover:bg-accent border border-border p-1.5 rounded-md text-foreground" title="Create Child Topic">
                        <Plus size={12} />
                    </button>
                    <button onClick={() => nodeData.onEdit?.(id)} className="bg-background hover:bg-accent border border-border p-1.5 rounded-md text-foreground" title="Edit Topics">
                        <Pencil size={12} />
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                {visibleTopics.map((topic, index) => (
                    <div key={index} className="bg-card rounded px-3 py-2 text-sm shadow-sm truncate border border-transparent hover:border-border transition-colors">
                        {topic}
                    </div>
                ))}
                {hiddenCount > 0 && <div className="text-xs text-center text-muted-foreground italic py-1">+ {hiddenCount} more topics...</div>}
                {topics.length === 0 && <div className="text-sm text-muted-foreground italic text-center py-4 border-2 border-dashed border-border rounded-lg">No topics yet</div>}
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
    );
};

export default TopicNode;
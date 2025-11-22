import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { BrainCircuit, Pencil, Plus } from 'lucide-react';

interface IdeaNodeData {
    idea?: string;
    onEdit?: (id: string) => void;
    onDataChange?: (id: string, data: any) => void;
    onCreateChild?: (parentId: string, nodeType: 'ideaNode' | 'topicNode' | 'noteNode') => void;
    parentId?: string | null;
    childrenOrder?: string[];
    depth?: number;
}

// Invisible handle styles to allow connecting from any side
const handleStyle = { opacity: 0, width: 10, height: 10, background: 'transparent' };

const IdeaNode: React.FC<NodeProps> = ({ id, data }) => {
    const nodeData = data as IdeaNodeData;

    return (
        <div className="group relative bg-white dark:bg-card rounded-2xl shadow-sm p-4 w-64 border border-border hover:border-pink-300 transition-colors">
            {/* ... Header and Content remain exactly the same ... */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <BrainCircuit className="text-pink-500" size={18} />
                    <span className="font-semibold text-foreground text-sm">Idea</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => nodeData.onCreateChild?.(id, 'ideaNode')} className="bg-accent hover:bg-accent/80 p-1.5 rounded-md text-foreground" title="Create Child Idea">
                        <Plus size={12} />
                    </button>
                    <button onClick={() => nodeData.onEdit?.(id)} className="bg-accent hover:bg-accent/80 p-1.5 rounded-md text-foreground" title="Edit Idea">
                        <Pencil size={12} />
                    </button>
                </div>
            </div>

            <div className="min-h-[2rem] text-sm text-foreground break-words font-medium">
                {nodeData.idea || <span className="text-muted-foreground italic">Empty idea...</span>}
            </div>

            {/* Handles on all 4 sides to allow "Connect Anywhere" interaction */}
            {/* They are invisible (opacity-0) but interactive */}
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
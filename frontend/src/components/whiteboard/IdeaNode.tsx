import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { BrainCircuit } from 'lucide-react';

interface IdeaNodeData {
    idea?: string;
    onDataChange?: (id: string, data: object) => void;
}

const IdeaNode: React.FC<NodeProps> = ({ id, data }) => {
    const nodeData = data as IdeaNodeData;
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        nodeData.onDataChange?.(id, { idea: event.target.value });
    };

    return (
        <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-4 w-64 border border-border">
            <div className="flex items-center gap-2 mb-3">
                <BrainCircuit className="text-pink-500" size={18} />
                <span className="font-semibold text-foreground">Idea</span>
            </div>
            <div className="relative">
                <input
                    type="text"
                    value={nodeData.idea || ''}
                    onChange={handleChange}
                    className="w-full bg-muted rounded-lg p-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Enter your idea..."
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-muted-foreground bg-muted"></div>
            </div>
            <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-accent" />
        </div>
    );
};

export default IdeaNode;

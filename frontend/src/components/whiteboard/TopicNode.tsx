import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Lightbulb, Zap, FileText } from 'lucide-react';

interface TopicNodeData {
    topics?: string[];
    onDataChange?: (id: string, data: object) => void;
}

const TopicNode: React.FC<NodeProps> = ({ id, data }) => {
    const nodeData = data as TopicNodeData;
    const topics = nodeData.topics || [];

    const handleGenerateMore = () => {
        const newTopics = [...topics, `Generated Topic #${topics.length + 1}`];
        nodeData.onDataChange?.(id, { topics: newTopics });
    };

    return (
        <div className="bg-muted/50 rounded-2xl shadow-sm p-4 w-96 border border-border">
            <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="text-yellow-500" size={18} />
                <span className="font-semibold text-foreground">Topic</span>
            </div>
            <div className="space-y-2">
                {topics.map((topic: string, index: number) => (
                    <div key={index} className="bg-card rounded-lg p-3 flex justify-between items-center text-sm hover:bg-muted transition-colors">
                        <span className="text-foreground pr-2">{topic}</span>
                        <div className="flex gap-2 text-muted-foreground">
                            <button className="hover:text-accent" title="Expand"><Zap size={14} /></button>
                            <button className="hover:text-accent" title="To Note"><FileText size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>
            <button
                onClick={handleGenerateMore}
                className="mt-4 w-full text-center text-sm font-medium text-accent hover:bg-accent/10 py-2 rounded-lg transition-colors"
            >
                Generate more
            </button>
            <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-accent" />
        </div>
    );
};

export default TopicNode;

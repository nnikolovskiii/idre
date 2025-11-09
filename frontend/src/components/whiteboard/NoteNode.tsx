import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileText } from 'lucide-react';

interface NoteNodeData {
    text?: string;
    onDataChange?: (id: string, data: object) => void;
}

const NoteNode: React.FC<NodeProps> = ({ id, data }) => {
    const nodeData = data as NoteNodeData;
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        nodeData.onDataChange?.(id, { text: event.target.value });
    };

    return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow-sm p-3 w-64 border border-yellow-200 dark:border-yellow-700">
            <div className="flex items-center gap-2 mb-2">
                <FileText className="text-yellow-600 dark:text-yellow-400" size={16} />
                <span className="font-semibold text-foreground">Note</span>
            </div>
            <textarea
                value={nodeData.text || ''}
                onChange={handleChange}
                className="w-full bg-transparent resize-none text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded p-2 min-h-[80px]"
                placeholder="Add your note here..."
            />
            <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-yellow-400" />
            <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-yellow-400" />
        </div>
    );
};

export default NoteNode;

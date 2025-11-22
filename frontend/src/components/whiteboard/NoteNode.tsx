import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileText, Plus } from 'lucide-react';

interface NoteNodeData {
    text?: string;
    onDataChange?: (id: string, data: object) => void;
    onCreateChild?: (parentId: string, nodeType: 'ideaNode' | 'topicNode' | 'noteNode') => void;
}

const handleStyle = { opacity: 0, width: 10, height: 10, background: 'transparent' };

const NoteNode: React.FC<NodeProps> = ({ id, data }) => {
    const nodeData = data as NoteNodeData;
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        nodeData.onDataChange?.(id, { text: event.target.value });
    };

    return (
        <div className="group bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow-sm p-3 w-64 border border-yellow-200 dark:border-yellow-700">
            {/* ... Header and Content ... */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <FileText className="text-yellow-600 dark:text-yellow-400" size={16} />
                    <span className="font-semibold text-foreground">Note</span>
                </div>
                <button onClick={() => nodeData.onCreateChild?.(id, 'noteNode')} className="opacity-0 group-hover:opacity-100 transition-opacity bg-yellow-200 dark:bg-yellow-700 hover:bg-yellow-300 dark:hover:bg-yellow-600 p-1.5 rounded-md text-yellow-800 dark:text-yellow-200" title="Create Child Note">
                    <Plus size={12} />
                </button>
            </div>
            <textarea
                value={nodeData.text || ''}
                onChange={handleChange}
                className="w-full bg-transparent resize-none text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded p-2 min-h-[80px]"
                placeholder="Add your note here..."
            />

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
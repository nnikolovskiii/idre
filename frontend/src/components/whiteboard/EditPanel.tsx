import React, { useEffect, useState } from 'react';
import { X, BrainCircuit, FileText, Lightbulb, Zap } from 'lucide-react';
import { type Node } from '@xyflow/react';

interface EditPanelProps {
    node: Node | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (id: string, data: any) => void;
}

const EditPanel: React.FC<EditPanelProps> = ({ node, isOpen, onClose, onUpdate }) => {
    const [localData, setLocalData] = useState<any>({});

    // Sync local state when node changes
    useEffect(() => {
        if (node) {
            setLocalData(node.data);
        }
    }, [node]);

    if (!isOpen || !node) return null;

    const handleChange = (field: string, value: any) => {
        const newData = { ...localData, [field]: value };
        setLocalData(newData);
        onUpdate(node.id, newData);
    };

    const handleTopicAdd = () => {
        const currentTopics = localData.topics || [];
        const newTopics = [...currentTopics, `New Topic #${currentTopics.length + 1}`];
        handleChange('topics', newTopics);
    };

    const handleTopicEdit = (index: number, val: string) => {
        const newTopics = [...(localData.topics || [])];
        newTopics[index] = val;
        handleChange('topics', newTopics);
    };

    const handleTopicDelete = (index: number) => {
        const newTopics = [...(localData.topics || [])];
        newTopics.splice(index, 1);
        handleChange('topics', newTopics);
    };

    const renderContent = () => {
        switch (node.type) {
            case 'ideaNode':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-pink-500 mb-2">
                            <BrainCircuit size={20} />
                            <h3 className="font-semibold text-foreground">Edit Idea</h3>
                        </div>
                        <label className="block text-sm font-medium text-muted-foreground">Core Concept</label>
                        <input
                            type="text"
                            value={localData.idea || ''}
                            onChange={(e) => handleChange('idea', e.target.value)}
                            className="w-full bg-muted border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Enter your idea..."
                            autoFocus
                        />
                    </div>
                );
            case 'noteNode':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-yellow-500 mb-2">
                            <FileText size={20} />
                            <h3 className="font-semibold text-foreground">Edit Note</h3>
                        </div>
                        <label className="block text-sm font-medium text-muted-foreground">Content</label>
                        <textarea
                            value={localData.text || ''}
                            onChange={(e) => handleChange('text', e.target.value)}
                            className="w-full h-64 bg-muted border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            placeholder="Type your notes here..."
                            autoFocus
                        />
                    </div>
                );
            case 'topicNode':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-500 mb-2">
                            <Lightbulb size={20} />
                            <h3 className="font-semibold text-foreground">Edit Topics</h3>
                        </div>

                        <div className="space-y-3">
                            {(localData.topics || []).map((topic: string, idx: number) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        value={topic}
                                        onChange={(e) => handleTopicEdit(idx, e.target.value)}
                                        className="flex-1 bg-muted border border-border rounded p-2 text-sm"
                                    />
                                    <button
                                        onClick={() => handleTopicDelete(idx)}
                                        className="text-muted-foreground hover:text-destructive p-2"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleTopicAdd}
                            className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-lg transition-colors"
                        >
                            <Zap size={16} /> Add Topic manually
                        </button>
                    </div>
                );
            default:
                return <div>Unknown node type</div>;
        }
    };

    return (
        /* CHANGED: Layout classes to make it a full-height right sidebar */
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Properties</span>
                <button onClick={onClose} className="hover:bg-accent rounded-full p-1 text-muted-foreground hover:text-foreground">
                    <X size={18} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                {renderContent()}
            </div>
            <div className="p-4 border-t border-border bg-muted/10 text-xs text-center text-muted-foreground">
                Changes are auto-saved
            </div>
        </div>
    );
};

export default EditPanel;
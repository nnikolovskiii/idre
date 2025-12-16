import React, { useState, useEffect } from 'react';
import { X, Save, Search, Check, Layers } from 'lucide-react';
import { type ModelGroup, type CreateModelGroupRequest, type UpdateModelGroupRequest } from '../../services/modelGroupService';
import { generativeModelService, type EnhancedModel } from '../../services/generativeModelService';

interface ModelGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateModelGroupRequest | UpdateModelGroupRequest) => Promise<void>;
    initialData?: ModelGroup | null;
}

const ModelGroupModal: React.FC<ModelGroupModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
    const [availableModels, setAvailableModels] = useState<EnhancedModel[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load available models from backend
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            const fetchData = async () => {
                try {
                    // Only fetch heavy models as requested
                    const heavy = await generativeModelService.getHeavyModels();
                    
                    // Handle potential response variations (array vs object with data property)
                    const heavyModels = Array.isArray(heavy) ? heavy : (heavy?.models  || []);
                    
                    setAvailableModels(heavyModels);
                } catch (e) {
                    console.error("Failed to load models", e);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen]);

    // Initialize form with data
    useEffect(() => {
        if (!isOpen) return;

        if (initialData) {
            setName(initialData.name);
            setDescription(initialData.description || '');
            // For editing, we need the IDs of currently associated models
            // Ensure IDs are strings for Set compatibility
            const ids = new Set(initialData.models.map(m => String(m.id)));
            setSelectedModels(ids);
        } else {
            setName('');
            setDescription('');
            setSelectedModels(new Set());
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setSaving(true);
        try {
            await onSave({
                name,
                description,
                model_ids: Array.from(selectedModels)
            });
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const toggleModel = (id: string | undefined) => {
       if (!id) return;
       
       setSelectedModels(prev => {
           const next = new Set(prev);
           if (next.has(id)) {
               next.delete(id);
           } else {
               next.add(id);
           }
           return next;
       });
    };

    // Filter models
    const filteredModels = availableModels.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Layers className="text-primary" size={24} />
                        {initialData ? 'Edit Model Group' : 'Create Model Group'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Group Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="e.g., Coding Assistants"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all h-20 resize-none"
                                placeholder="What is this group for?"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium">Select Models</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search models..."
                                className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-muted/30 text-sm focus:outline-none focus:border-primary"
                            />
                        </div>
                        
                        <div className="border border-border rounded-lg overflow-hidden h-60 overflow-y-auto bg-muted/10">
                            {loading ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground">Loading models...</div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {filteredModels.map((model: EnhancedModel) => {
                                        const modelId = String(model.id);
                                        const isSelected = selectedModels.has(modelId);

                                        return (
                                            <div 
                                                key={modelId} 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleModel(modelId);
                                                }}
                                                className={`flex items-center justify-between p-3 cursor-pointer hover:bg-accent transition-colors 
                                                    ${isSelected ? 'bg-primary/5' : ''}`
                                                }
                                            >
                                                <div className="flex flex-col min-w-0 pr-2">
                                                    <span className="text-sm font-medium truncate" title={model.name}>
                                                        {model.name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground capitalize">
                                                        {model.type || 'AI'} model
                                                    </span>
                                                </div>
                                                <div className={`w-5 h-5 flex-shrink-0 rounded border flex items-center justify-center transition-colors 
                                                    ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'}`
                                                }>
                                                    {isSelected && <Check size={12} />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {filteredModels.length === 0 && (
                                        <div className="p-4 text-center text-sm text-muted-foreground">No models found</div>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground text-right">
                            {selectedModels.size} models selected
                        </p>
                    </div>
                </div>

                <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={!name.trim() || saving}
                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save Group'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModelGroupModal;

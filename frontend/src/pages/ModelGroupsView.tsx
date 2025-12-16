import React, { useState, useEffect } from 'react';
import { Plus, Layers, MoreVertical, Edit, Trash2, Box } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { modelGroupService, type ModelGroup } from '../services/modelGroupService';
import ModelGroupModal from '../components/modals/ModelGroupModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const ModelGroupsView: React.FC = () => {
    const [groups, setGroups] = useState<ModelGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<ModelGroup | null>(null);
    const [groupToDelete, setGroupToDelete] = useState<ModelGroup | null>(null);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await modelGroupService.getAllGroups();
            setGroups(res.data);
            setError(null);
        } catch (err) {
            setError("Failed to load model groups");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleCreate = () => {
        setEditingGroup(null);
        setIsModalOpen(true);
    };

    const handleEdit = (group: ModelGroup) => {
        setEditingGroup(group);
        setIsModalOpen(true);
    };

    const handleSave = async (data: any) => {
        if (editingGroup) {
            await modelGroupService.updateGroup(editingGroup.id, data);
        } else {
            await modelGroupService.createGroup(data);
        }
        await fetchGroups();
    };

    const handleDeleteConfirm = async () => {
        if (groupToDelete) {
            await modelGroupService.deleteGroup(groupToDelete.id);
            setGroupToDelete(null);
            await fetchGroups();
        }
    };

    return (
        <DashboardLayout title="Model Groups">
            <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-left text-2xl font-bold text-foreground mb-1">Model Groups</h1>
                        <p className="text-muted-foreground">Curate collections of AI models for specific tasks.</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm font-medium"
                    >
                        <Plus size={18} /> Create Group
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                ) : error ? (
                    <div className="text-center text-destructive p-8 bg-destructive/10 rounded-xl">{error}</div>
                ) : groups.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-60">
                        <Layers size={64} strokeWidth={1} className="mb-4" />
                        <p className="text-lg font-medium">No groups yet</p>
                        <p className="text-sm">Create a group to organize your models.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map(group => (
                            <GroupCard 
                                key={group.id} 
                                group={group} 
                                onEdit={() => handleEdit(group)}
                                onDelete={() => setGroupToDelete(group)}
                            />
                        ))}
                    </div>
                )}

                <ModelGroupModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    initialData={editingGroup}
                />

                <DeleteConfirmationModal
                    isOpen={!!groupToDelete}
                    itemName={groupToDelete?.name || ''}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setGroupToDelete(null)}
                />
            </div>
        </DashboardLayout>
    );
};

const GroupCard: React.FC<{ 
    group: ModelGroup; 
    onEdit: () => void; 
    onDelete: () => void; 
}> = ({ group, onEdit, onDelete }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all group relative flex flex-col h-full">
            <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Layers size={20} />
                </div>
                <div className="relative">
                    <button 
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreVertical size={18} />
                    </button>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                            <div className="absolute right-0 mt-1 w-32 bg-popover border border-border rounded-md shadow-lg z-20 py-1">
                                <button onClick={() => { onEdit(); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2">
                                    <Edit size={14} /> Edit
                                </button>
                                <button onClick={() => { onDelete(); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2">
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <h3 className="font-semibold text-lg mb-1">{group.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                {group.description || "No description provided."}
            </p>

            <div className="border-t border-border pt-4 mt-auto">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Included Models ({group.models.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {group.models.slice(0, 3).map((m, i) => (
                        <span key={i} className="px-2 py-1 bg-secondary rounded text-xs font-medium text-secondary-foreground border border-border/50 flex items-center gap-1">
                            <Box size={10} className="opacity-50" />
                            <span className="truncate max-w-[100px]">{m.name}</span>
                        </span>
                    ))}
                    {group.models.length > 3 && (
                        <span className="px-2 py-1 bg-secondary/50 rounded text-xs text-muted-foreground">
                            +{group.models.length - 3} more
                        </span>
                    )}
                    {group.models.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">No models added</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModelGroupsView;
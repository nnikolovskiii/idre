import React, { useState, useEffect } from "react";
import { X, Book, Loader2, AlertTriangle } from "lucide-react";
import {TaskPriority, type TaskUpdateRequest} from "../../../services/tasksService";
import { PriorityIndicator } from "./TaskCard";
import {COLUMN_CONFIG, type NewTaskState, type Task} from "./types.ts";

// --- CREATE MODAL ---
interface TaskCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    taskData: NewTaskState;
    onTaskDataChange: (data: NewTaskState) => void;
    columnTitle?: string;
}

export const TaskCreationModal: React.FC<TaskCreationModalProps> = ({ isOpen, onClose, onSubmit, taskData, onTaskDataChange, columnTitle }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto sm:max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">
                        Create Task {columnTitle && <span className="text-muted-foreground font-normal ml-1">in {columnTitle}</span>}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-secondary rounded-md transition-colors"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Title <span className="text-destructive">*</span></label>
                        <input
                            type="text"
                            value={taskData.title}
                            onChange={(e) => onTaskDataChange({ ...taskData, title: e.target.value })}
                            placeholder="Enter task title..."
                            className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                        <textarea
                            value={taskData.description}
                            onChange={(e) => onTaskDataChange({ ...taskData, description: e.target.value })}
                            placeholder="Add details..."
                            className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[100px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
                            <select
                                value={taskData.priority}
                                onChange={(e) => onTaskDataChange({ ...taskData, priority: e.target.value as any })}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Due Date</label>
                            <input
                                type="date"
                                value={taskData.dueDate}
                                onChange={(e) => onTaskDataChange({ ...taskData, dueDate: e.target.value })}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Tags (comma separated)</label>
                        <input
                            type="text"
                            value={taskData.tags}
                            onChange={(e) => onTaskDataChange({ ...taskData, tags: e.target.value })}
                            placeholder="dev, design, bug..."
                            className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-secondary/20">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-md transition-colors">Cancel</button>
                    <button onClick={onSubmit} disabled={!taskData.title.trim()} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm">Create Task</button>
                </div>
            </div>
        </div>
    );
};

// --- DETAIL MODAL ---
interface TaskDetailModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose }) => {
    if (!isOpen || !task) return null;
    const column = COLUMN_CONFIG.find(c => c.id === task.status);
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3 min-w-0">
                        <PriorityIndicator priority={task.priority} />
                        <h2 className="text-lg font-semibold text-foreground truncate">{task.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-secondary rounded-md ml-4 transition-colors"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-6 text-left">
                    {task.notebook && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg border border-border/50">
                            <Book size={16} />
                            <span className="font-medium">{task.notebook.emoji} {task.notebook.title}</span>
                        </div>
                    )}

                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                        <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
                            {task.description || "No description provided."}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-2">
                        <div>
                            <p className="text-muted-foreground text-xs uppercase font-semibold mb-1">Status</p>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${column?.accentColor.replace('bg-', 'bg-') || 'bg-gray-500'}`} />
                                <span className="text-sm">{column?.title}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs uppercase font-semibold mb-1">Priority</p>
                            <p className="capitalize text-sm">{task.priority}</p>
                        </div>
                    </div>

                    {(task.dueDate || (task.tags && task.tags.length > 0)) && (
                        <div className="grid grid-cols-2 gap-6 pt-2">
                            {task.dueDate && (
                                <div>
                                    <p className="text-muted-foreground text-xs uppercase font-semibold mb-1">Due Date</p>
                                    <p className={`text-sm ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                                        {new Date(task.dueDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                            )}
                            {task.tags && task.tags.length > 0 && (
                                <div>
                                    <p className="text-muted-foreground text-xs uppercase font-semibold mb-1">Tags</p>
                                    <div className="flex flex-wrap gap-1">
                                        {task.tags.map(tag => (
                                            <span key={tag} className="text-xs bg-secondary px-2 py-0.5 rounded-md text-secondary-foreground">#{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- EDIT MODAL ---
interface TaskEditModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (taskId: string, updateData: TaskUpdateRequest) => void;
    isUpdating?: boolean;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, isOpen, onClose, onUpdate, isUpdating = false }) => {
    const [formData, setFormData] = useState<NewTaskState>({
        title: "", description: "", priority: "medium", tags: "", dueDate: ""
    });

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                description: task.description || "",
                priority: task.priority,
                tags: task.tags?.join(", ") || "",
                dueDate: task.dueDate || ""
            });
        }
    }, [task]);

    if (!isOpen || !task) return null;

    const handleSubmit = () => {
        if (!formData.title.trim()) return;
        onUpdate(task.id, {
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            priority: formData.priority as TaskPriority,
            tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
            due_date: formData.dueDate || undefined,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-lg font-semibold">Edit Task</h2>
                    <button onClick={onClose} disabled={isUpdating} className="p-1 hover:bg-secondary rounded-md transition-colors"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                        <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" disabled={isUpdating} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]" disabled={isUpdating} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                                disabled={isUpdating}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Due Date</label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                                disabled={isUpdating}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData({...formData, tags: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            disabled={isUpdating}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 p-4 border-t border-border bg-secondary/20">
                    <button onClick={onClose} disabled={isUpdating} className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-md transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={isUpdating} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
                        {isUpdating && <Loader2 size={16} className="animate-spin" />} Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- CONFIRMATION MODAL ---
interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
                                                                        isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", isDestructive = false
                                                                    }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-full ${isDestructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                            <AlertTriangle size={24} />
                        </div>
                        <h2 className="text-lg font-semibold">{title}</h2>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                        {message}
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors shadow-sm ${
                                isDestructive
                                    ? 'bg-destructive hover:bg-destructive/90'
                                    : 'bg-primary hover:bg-primary/90'
                            }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
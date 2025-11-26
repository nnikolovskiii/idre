    import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, GripVertical, AlertCircle, Edit, Archive, RotateCcw } from "lucide-react";
import type { Task } from "./types.ts";

// Helper Component
export const PriorityIndicator: React.FC<{ priority: Task["priority"] }> = ({ priority }) => {
    const colors = { high: "bg-red-500", medium: "bg-yellow-500", low: "bg-green-500" };
    return <div className={`w-2 h-2 rounded-full ${colors[priority]}`} aria-label={`${priority} priority`} />;
};

interface SortableTaskProps {
    task: Task;
    isMobile?: boolean;
    onView: (task: Task) => void;
    onEdit: (task: Task) => void;
    onArchive: (task: Task) => void;
    onUnarchive: (task: Task) => void;
}

export const SortableTask: React.FC<SortableTaskProps> = ({ task, isMobile = false, onView, onEdit, onArchive, onUnarchive }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

    return (
        <div ref={setNodeRef} style={style} className="group kanban-task" {...attributes}>
            <div
                className={`bg-background border rounded-lg shadow-sm hover:shadow-md transition-all ${
                    isDragging ? 'dragging' : ''
                } ${
                    isOverdue ? 'border-orange-200 dark:border-orange-800' : 'border-border'
                } ${
                    task.archived ? 'opacity-60 border-dashed' : ''
                } ${
                    isMobile ? 'p-4 mb-3 active:scale-95' : 'p-3 mb-2'
                }`}
            >
                <div className="flex items-start gap-2">
                    <div
                        className={`flex items-center transition-opacity touch-none drag-handle cursor-grab active:cursor-grabbing ${
                            task.archived ? 'cursor-not-allowed opacity-40' : ''
                        } ${
                            isMobile
                                ? 'opacity-100 p-2 bg-muted/30 rounded-md active:bg-muted/50'
                                : 'opacity-60 group-hover:opacity-100'
                        }`}
                        {...(!task.archived ? listeners : {})}
                        data-testid="drag-handle"
                        role="button"
                    >
                        <GripVertical size={isMobile ? 18 : 14} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onView(task)}>
                        {task.notebook && (
                            <div className="flex items-center gap-1 mb-1.5 text-xs text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded w-fit">
                                <span>{task.notebook.emoji}</span>
                                <span className="truncate max-w-[150px]">{task.notebook.title}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2 mb-2">
                            <PriorityIndicator priority={task.priority} />
                            <h4 className={`font-medium text-foreground truncate ${isMobile ? 'text-base' : 'text-sm'}`}>{task.title}</h4>
                            {isOverdue && <AlertCircle size={12} className="text-orange-500" />}
                            {task.archived && <Archive size={isMobile ? 14 : 12} className="text-muted-foreground" />}
                        </div>

                        {task.description && (
                            <p className={`text-left text-muted-foreground mb-2 line-clamp-2 ${isMobile ? 'text-sm' : 'text-xs'}`}>{task.description}</p>
                        )}

                        <div className="flex flex-wrap gap-1 mb-2">
                            {task.tags?.map((tag) => (
                                <span key={tag} className="inline-block px-2 py-0.5 bg-secondary text-secondary-foreground rounded-md text-xs">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className={`flex items-center justify-between text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                            <div className="flex items-center gap-2">
                                {task.dueDate && (
                                    <div className="flex items-center gap-1">
                                        <Clock size={isMobile ? 12 : 10} />
                                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded-md"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (task.archived) {
                                            onUnarchive(task);
                                        } else {
                                            onArchive(task);
                                        }
                                    }}
                                >
                                    {task.archived ? <RotateCcw size={isMobile ? 14 : 12} /> : <Archive size={isMobile ? 14 : 12} />}
                                </button>
                                <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded-md"
                                    onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                                >
                                    <Edit size={isMobile ? 14 : 12} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const TaskDragOverlay: React.FC<{ task: Task }> = ({ task }) => {
    return (
        <div className="bg-background border-2 border-primary rounded-lg p-3 shadow-2xl rotate-2 scale-105 opacity-90 cursor-grabbing">
            <div className="flex items-start gap-2">
                <div className="flex items-center"><GripVertical size={14} className="text-primary" /></div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <PriorityIndicator priority={task.priority} />
                        <h4 className="font-medium text-sm text-foreground truncate">{task.title}</h4>
                    </div>
                </div>
            </div>
        </div>
    );
};
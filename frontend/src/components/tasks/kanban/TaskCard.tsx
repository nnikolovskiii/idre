import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertCircle, Calendar, Edit2, Archive, RotateCcw } from "lucide-react";
import type { Task } from "./types.ts";

export const PriorityIndicator: React.FC<{ priority: Task["priority"] }> = ({ priority }) => {
    const styles = {
        high: "bg-red-500/10 text-red-500 border-red-500/20",
        medium: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        low: "bg-green-500/10 text-green-500 border-green-500/20",
    };

    return (
        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${styles[priority]}`}>
            {priority}
        </span>
    );
};

interface SortableTaskProps {
    task: Task;
    isMobile?: boolean;
    onView: (task: Task) => void;
    onEdit: (task: Task) => void;
    onArchive: (task: Task) => void;
    onUnarchive: (task: Task) => void;
    showPriorities?: boolean;
    isAllTasksView?: boolean;
}

export const SortableTask: React.FC<SortableTaskProps> = ({
                                                              task,
                                                              onView,
                                                              onEdit,
                                                              onArchive,
                                                              onUnarchive,
                                                              showPriorities = true,
                                                              isAllTasksView = false
                                                          }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1
    };

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
    const notebookColor = task.notebook?.bg_color || '#4d4dff';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group relative"
            {...attributes}
            {...listeners}
        >
            <div
                onClick={() => onView(task)}
                className={`
                    bg-card hover:bg-accent/40
                    border border-border/60 hover:border-primary/40
                    rounded-lg shadow-sm transition-all duration-200
                    cursor-default text-left overflow-hidden relative
                    ${task.archived ? 'opacity-60 grayscale border-dashed' : ''}
                    p-3
                `}
            >
                {/*
                   REMOVED: The absolute colored strip div
                   REMOVED: The conditional padding (pl-1)
                */}

                {/* Header: Options & Priority */}
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 flex-wrap max-w-[80%]">

                        {/*
                            MODIFIED: Show Notebook info for All Tasks View
                            Added the colored dot here instead of the sidebar
                        */}
                        {isAllTasksView && task.notebook && (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium max-w-full mr-1 bg-secondary/50 px-1.5 py-0.5 rounded-md border border-border/30">
                                {/* The Dot */}
                                <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ backgroundColor: notebookColor }}
                                />
                                <span className="truncate max-w-[80px]">{task.notebook.title}</span>
                            </div>
                        )}

                        {/* Normal Notebook info (Single view) - usually hidden or just emoji */}
                        {!isAllTasksView && task.notebook && (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                                <span className="text-xs">{task.notebook.emoji}</span>
                            </div>
                        )}

                        {showPriorities !== false && <PriorityIndicator priority={task.priority} />}
                    </div>

                    {/* Hover Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-background/95 shadow-sm border border-border rounded-md p-1 flex gap-1 z-10 backdrop-blur-sm">
                        {task.archived ? (
                            <button
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); onUnarchive(task); }}
                                className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-primary transition-colors"
                                title="Unarchive"
                            >
                                <RotateCcw size={14} />
                            </button>
                        ) : (
                            <button
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); onArchive(task); }}
                                className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-destructive transition-colors"
                                title="Archive"
                            >
                                <Archive size={14} />
                            </button>
                        )}
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                            className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit"
                        >
                            <Edit2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Title */}
                <h4 className="font-medium text-sm text-foreground mb-1.5 leading-snug break-words text-left">
                    {task.title}
                </h4>

                {/* Description Preview */}
                {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 font-normal text-left">
                        {task.description}
                    </p>
                )}

                {/* Footer: Tags & Date */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                    <div className="flex gap-1 overflow-hidden">
                        {task.tags?.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded">
                                #{tag}
                            </span>
                        ))}
                    </div>

                    {task.dueDate && (
                        <div className={`flex items-center gap-1 text-[10px] font-medium ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {isOverdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
                            <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Update DragOverlay to match
export const TaskDragOverlay: React.FC<{ task: Task; showPriorities?: boolean; isAllTasksView?: boolean }> = ({
                                                                                                                  task,
                                                                                                                  showPriorities = true,
                                                                                                                  isAllTasksView = false
                                                                                                              }) => {
    const notebookColor = task.notebook?.bg_color || '#4d4dff';

    return (
        <div className="bg-card border border-primary/50 rounded-lg p-3 shadow-2xl cursor-grabbing w-[300px] rotate-2 opacity-90 ring-2 ring-primary/20 text-left relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
                {isAllTasksView && task.notebook && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium bg-secondary/50 px-1.5 py-0.5 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: notebookColor }} />
                        <span className="truncate max-w-[80px]">{task.notebook.title}</span>
                    </div>
                )}
                {showPriorities !== false && <PriorityIndicator priority={task.priority} />}
            </div>
            <h4 className="font-medium text-sm text-foreground text-left">{task.title}</h4>
        </div>
    );
};
// Enhanced Tasks Kanban Board Component with @dnd-kit
import React, { useState } from "react";
import {
    DndContext,
    DragOverlay,
    closestCenter,
    pointerWithin,
    useDroppable, // Import useDroppable
} from "@dnd-kit/core";
import type {
    DragEndEvent,
    DragStartEvent,
    DragOverEvent, // Import DragOverEvent
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove, // Import arrayMove for reordering
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import { Clock, Plus, GripVertical, X } from "lucide-react";

// Types
interface Task {
    id: string;
    title: string;
    description?: string;
    priority: "low" | "medium" | "high";
    tags?: string[];
    dueDate?: string;
}

interface Column {
    id: string;
    title: string;
    tasks: Task[];
    color: string;
}

interface TasksKanbanProps {
    notebookId?: string;
}

// Mock data (assignee removed)
const mockColumns: Column[] = [
    {
        id: "todo",
        title: "To Do",
        color: "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
        tasks: [
            {
                id: "1",
                title: "Design new landing page",
                description: "Create mockups and wireframes for the updated landing page design",
                priority: "high",
                tags: ["design", "ui/ux"],
                dueDate: "2024-12-01",
            },
            {
                id: "2",
                title: "Implement user authentication",
                description: "Add login and signup functionality with JWT tokens",
                priority: "high",
                tags: ["backend", "security"],
            },
            {
                id: "3",
                title: "Write API documentation",
                description: "Document all REST API endpoints",
                priority: "medium",
                tags: ["documentation"],
            },
        ],
    },
    {
        id: "in-progress",
        title: "In Progress",
        color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
        tasks: [
            {
                id: "4",
                title: "Optimize database queries",
                description: "Improve performance of slow running queries",
                priority: "medium",
                tags: ["database", "performance"],
                dueDate: "2024-11-28",
            },
            {
                id: "5",
                title: "Create mobile responsive design",
                description: "Ensure the app works well on mobile devices",
                priority: "high",
                tags: ["frontend", "mobile"],
            },
        ],
    },
    {
        id: "review",
        title: "Review",
        color: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
        tasks: [
            {
                id: "6",
                title: "Setup CI/CD pipeline",
                description: "Configure GitHub Actions for automated testing and deployment",
                priority: "medium",
                tags: ["devops", "automation"],
            },
        ],
    },
    {
        id: "done",
        title: "Done",
        color: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
        tasks: [
            {
                id: "7",
                title: "Setup project repository",
                description: "Initialize git repository and create initial project structure",
                priority: "low",
                tags: ["setup"],
                dueDate: "2024-11-15",
            },
            {
                id: "8",
                title: "Install dependencies",
                description: "Install and configure all required packages",
                priority: "low",
                tags: ["setup"],
            },
        ],
    },
];

// Priority indicator component (no changes)
const PriorityIndicator: React.FC<{ priority: Task["priority"] }> = ({ priority }) => {
    const colors = { high: "bg-red-500", medium: "bg-yellow-500", low: "bg-green-500" };
    return <div className={`w-2 h-2 rounded-full ${colors[priority]}`} title={`${priority} priority`} />;
};

// Sortable Task Component (no changes)
const SortableTask: React.FC<{ task: Task }> = ({ task }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    return (
        <div ref={setNodeRef} style={style} className="group kanban-task" {...attributes}>
            <div className={`bg-background border border-border rounded-lg p-3 mb-2 shadow-sm hover:shadow-md transition-all ${isDragging ? 'dragging' : ''}`}>
                <div className="flex items-start gap-2">
                    <div className="flex items-center opacity-60 group-hover:opacity-100 transition-opacity touch-none" {...listeners}>
                        <GripVertical size={14} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <PriorityIndicator priority={task.priority} />
                            <h4 className="font-medium text-sm text-foreground truncate">{task.title}</h4>
                        </div>
                        {task.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>}
                        <div className="flex flex-wrap gap-1 mb-2">
                            {task.tags?.map((tag) => <span key={tag} className="inline-block px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded-md">{tag}</span>)}
                        </div>
                        <div className="flex items-center justify-end text-xs text-muted-foreground">
                            {task.dueDate && <div className="flex items-center gap-1"><Clock size={10} /><span>{task.dueDate}</span></div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Task Drag Overlay Component (no changes)
const TaskDragOverlay: React.FC<{ task: Task }> = ({ task }) => {
    return (
        <div className="bg-background border-2 border-primary rounded-lg p-3 shadow-2xl rotate-2 scale-105 opacity-90">
            <div className="flex items-start gap-2">
                <div className="flex items-center"><GripVertical size={14} className="text-primary" /></div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2"><PriorityIndicator priority={task.priority} /><h4 className="font-medium text-sm text-foreground truncate">{task.title}</h4></div>
                    {task.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>}
                    <div className="flex flex-wrap gap-1 mb-2">
                        {task.tags?.map((tag) => <span key={tag} className="inline-block px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded-md">{tag}</span>)}
                    </div>
                    <div className="flex items-center justify-end text-xs text-muted-foreground">
                        {task.dueDate && <div className="flex items-center gap-1"><Clock size={10} /><span>{task.dueDate}</span></div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Kanban Column Component
const KanbanColumn: React.FC<{
    column: Column;
    onAddTask: (columnId: string) => void;
}> = ({ column, onAddTask }) => {
    // Make the entire column a droppable area
    const { setNodeRef } = useDroppable({ id: column.id });

    return (
        <div ref={setNodeRef} className={`${column.color} border rounded-lg p-4 min-h-[500px] flex flex-col transition-all kanban-column`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    {column.title}
                    <span className="text-xs bg-background px-2 py-0.5 rounded-full text-muted-foreground">
            {column.tasks.length}
          </span>
                </h3>
                <button className="p-1 hover:bg-background/50 rounded transition-colors" onClick={() => onAddTask(column.id)} title="Add new task">
                    <Plus size={14} />
                </button>
            </div>

            <SortableContext items={column.tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 flex-1">
                    {column.tasks.map((task) => <SortableTask key={task.id} task={task} />)}
                    {column.tasks.length === 0 && <div className="text-center py-8 text-sm text-muted-foreground h-full flex items-center justify-center">Drop tasks here</div>}
                </div>
            </SortableContext>
        </div>
    );
};

// Main Component
const TasksKanbanEnhanced: React.FC<TasksKanbanProps> = ({ notebookId }) => {
    console.log('TasksKanbanEnhanced loaded for notebook:', notebookId); // For debugging
    const [columns, setColumns] = useState<Column[]>(mockColumns);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

    // Form state for new task
    const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium" as Task["priority"], tags: "", dueDate: "" });

    const collisionDetectionAlgorithm = (args: any) => {
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) return pointerCollisions;
        return closestCenter(args);
    };

    // Task creation handlers (no changes)
    const openTaskModal = (columnId: string) => { setSelectedColumnId(columnId); setShowTaskModal(true); resetForm(); };
    const closeTaskModal = () => { setShowTaskModal(false); setSelectedColumnId(null); resetForm(); };
    const resetForm = () => { setNewTask({ title: "", description: "", priority: "medium", tags: "", dueDate: "" }); };
    const handleCreateTask = () => {
        if (!newTask.title.trim() || !selectedColumnId) return;
        const task: Task = {
            id: Date.now().toString(),
            title: newTask.title.trim(),
            description: newTask.description.trim() || undefined,
            priority: newTask.priority,
            tags: newTask.tags ? newTask.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
            dueDate: newTask.dueDate || undefined,
        };
        setColumns(prevColumns => prevColumns.map(column => {
            if (column.id === selectedColumnId) return { ...column, tasks: [...column.tasks, task] };
            return column;
        }));
        closeTaskModal();
    };

    // Helper function to find the column a task belongs to
    const findColumn = (id: string) => {
        return columns.find((col) => col.tasks.some((task) => task.id === id));
    };

    // Drag and drop handlers
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const activeId = active.id as string;
        const foundTask = columns.flatMap(col => col.tasks).find(task => task.id === activeId);
        setActiveTask(foundTask || null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeColumn = findColumn(activeId);
        // `over` can be a column ID or a task ID. We find its column either way.
        const overColumn = columns.find(col => col.id === overId) || findColumn(overId);

        if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) {
            return; // No need to move if it's in the same column or invalid
        }

        // Move the task in the state to trigger a re-render and show the placeholder
        setColumns((prev) => {
            const activeTasks = [...activeColumn.tasks];
            const overTasks = [...overColumn.tasks];
            const activeIndex = activeTasks.findIndex((t) => t.id === activeId);
            const [movedTask] = activeTasks.splice(activeIndex, 1);

            const overIndex = overTasks.findIndex((t) => t.id === overId);

            if (overIndex !== -1) {
                // Drop over a specific task
                overTasks.splice(overIndex, 0, movedTask);
            } else {
                // Drop over the column itself
                overTasks.push(movedTask);
            }

            return prev.map((col) => {
                if (col.id === activeColumn.id) {
                    return { ...col, tasks: activeTasks };
                } else if (col.id === overColumn.id) {
                    return { ...col, tasks: overTasks };
                } else {
                    return col;
                }
            });
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveTask(null);
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeColumn = findColumn(activeId);
        const overColumn = findColumn(overId);

        // This handles reordering within the same column
        if (activeColumn && overColumn && activeColumn.id === overColumn.id) {
            if (activeId !== overId) {
                setColumns((prev) => {
                    return prev.map(col => {
                        if (col.id === activeColumn.id) {
                            const oldIndex = col.tasks.findIndex((t) => t.id === activeId);
                            const newIndex = col.tasks.findIndex((t) => t.id === overId);
                            return { ...col, tasks: arrayMove(col.tasks, oldIndex, newIndex) };
                        }
                        return col;
                    });
                });
            }
        }
        // Note: Moving between columns is visually handled by `handleDragOver`.
        // The state is already correct when `handleDragEnd` fires, so no extra logic is needed here for that case.
    };

    // Task Creation Modal Component (no changes)
    const TaskCreationModal: React.FC = () => {
        if (!showTaskModal) return null;
        const selectedColumn = columns.find(col => col.id === selectedColumnId);
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-background border border-border rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <h2 className="text-lg font-semibold text-foreground">
                            Create New Task {selectedColumn && <span className="text-sm text-muted-foreground ml-2">in {selectedColumn.title}</span>}
                        </h2>
                        <button onClick={closeTaskModal} className="p-1 hover:bg-secondary rounded-md transition-colors"><X size={20} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div><label className="block text-sm font-medium text-foreground mb-2">Title <span className="text-destructive">*</span></label><input type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Enter task title..." className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" autoFocus /></div>
                        <div><label className="block text-sm font-medium text-foreground mb-2">Description</label><textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} placeholder="Enter task description..." rows={3} className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none" /></div>
                        <div><label className="block text-sm font-medium text-foreground mb-2">Priority</label><div className="flex gap-2">{ (["low", "medium", "high"] as const).map((priority) => (<button key={priority} onClick={() => setNewTask({ ...newTask, priority })} className={`flex-1 px-3 py-2 rounded-md border border-border text-sm font-medium transition-colors ${newTask.priority === priority ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-secondary text-foreground"}`}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</button>))}</div></div>
                        <div><label className="block text-sm font-medium text-foreground mb-2">Tags</label><input type="text" value={newTask.tags} onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })} placeholder="Enter tags separated by commas..." className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" /><p className="text-xs text-muted-foreground mt-1">Separate multiple tags with commas</p></div>
                        <div><label className="block text-sm font-medium text-foreground mb-2">Due Date</label><input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" /></div>
                    </div>
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                        <button onClick={closeTaskModal} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded-md transition-colors">Cancel</button>
                        <button onClick={handleCreateTask} disabled={!newTask.title.trim()} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Create Task</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col">
            <div className="border-b border-border bg-background flex-shrink-0">
                <div className="flex items-center justify-between p-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
                        <p className="text-sm text-muted-foreground">Manage your project tasks and workflow</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="text" placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                        <button onClick={() => openTaskModal("todo")} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"><Plus size={16} />Add Task</button>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
                <DndContext collisionDetection={collisionDetectionAlgorithm} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[800px]">
                        {columns.map((column) => <KanbanColumn key={column.id} column={column} onAddTask={openTaskModal} />)}
                    </div>
                    {createPortal(<DragOverlay>{activeTask ? <TaskDragOverlay task={activeTask} /> : null}</DragOverlay>, document.body)}
                </DndContext>
            </div>
            <TaskCreationModal />
        </div>
    );
};

export default TasksKanbanEnhanced;
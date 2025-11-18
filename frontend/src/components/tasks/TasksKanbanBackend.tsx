// Enhanced Tasks Kanban Board Component with Backend Integration
import React, { useState, useEffect, useCallback } from "react";
import {
    DndContext,
    DragOverlay,
    closestCenter,
    pointerWithin,
    useDroppable,
} from "@dnd-kit/core";
import type {
    DragEndEvent,
    DragStartEvent,
    DragOverEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import { Clock, Plus, GripVertical, X, AlertCircle, Loader2 } from "lucide-react";

// Import task service and types
import {
    TasksService,
    TaskStatus,
    TaskPriority,
    convertTaskResponse
} from "../../services/tasksService";
import type {
    TaskCreateRequest,
    TaskMoveRequest,
    TaskReorderRequest
} from "../../services/tasksService";

// Types
interface Task {
    id: string;
    title: string;
    description?: string;
    priority: "low" | "medium" | "high";
    tags?: string[];
    dueDate?: string;
    position?: number;
    status: TaskStatus;
}

interface Column {
    id: TaskStatus;
    title: string;
    tasks: Task[];
    color: string;
}

interface TasksKanbanProps {
    notebookId: string;
}

type NewTaskState = {
    title: string;
    description: string;
    priority: Task["priority"];
    tags: string;
    dueDate: string;
};

// Column configuration
const COLUMN_CONFIG: { id: TaskStatus; title: string; color: string }[] = [
    {
        id: TaskStatus.TODO,
        title: "To Do",
        color: "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    },
    {
        id: TaskStatus.IN_PROGRESS,
        title: "In Progress",
        color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
    },
    {
        id: TaskStatus.REVIEW,
        title: "Review",
        color: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
    },
    {
        id: TaskStatus.DONE,
        title: "Done",
        color: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
    }
];

// Priority indicator component
const PriorityIndicator: React.FC<{ priority: Task["priority"] }> = ({ priority }) => {
    const colors = { high: "bg-red-500", medium: "bg-yellow-500", low: "bg-green-500" };
    return <div className={`w-2 h-2 rounded-full ${colors[priority]}`} aria-label={`${priority} priority`} />;
};

// Sortable Task Component
// Sortable Task Component
const SortableTask: React.FC<{ task: Task; isMobile?: boolean; onView: (task: Task) => void; }> = ({ task, isMobile = false, onView }) => {
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
                    isMobile
                        ? 'p-4 mb-3 active:scale-95'
                        : 'p-3 mb-2'
                }`}
            >
                <div className="flex items-start gap-2">
                    <div
                        className={`flex items-center transition-opacity touch-none drag-handle cursor-grab active:cursor-grabbing ${
                            isMobile
                                ? 'opacity-100 p-2 bg-muted/30 rounded-md active:bg-muted/50'
                                : 'opacity-60 group-hover:opacity-100'
                        }`}
                        {...listeners}
                        data-testid="drag-handle"
                        role="button"
                        aria-label="Drag task"
                        tabIndex={0}
                    >
                        <GripVertical size={isMobile ? 18 : 14} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onView(task)}>
                        <div className="flex items-center gap-2 mb-2">
                            <PriorityIndicator priority={task.priority} />
                            <h4 className={`font-medium text-foreground truncate ${
                                isMobile ? 'text-base' : 'text-sm'
                            }`}>{task.title}</h4>
                            {isOverdue && <AlertCircle size={12} className="text-orange-500" />}
                        </div>
                        {task.description && (
                            <p className={`text-left text-muted-foreground mb-2 line-clamp-2 ${ // <-- ADDED text-left
                                isMobile ? 'text-sm' : 'text-xs'
                            }`}>{task.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mb-2">
                            {task.tags?.map((tag) => (
                                <span
                                    key={tag}
                                    className={`inline-block px-2 py-0.5 bg-secondary text-secondary-foreground rounded-md ${
                                        isMobile ? 'text-xs' : 'text-xs'
                                    }`}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <div className={`flex items-center justify-end text-muted-foreground ${
                            isMobile ? 'text-xs' : 'text-xs'
                        }`}>
                            {task.dueDate && (
                                <div className="flex items-center gap-1">
                                    <Clock size={isMobile ? 12 : 10} />
                                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Task Drag Overlay Component
const TaskDragOverlay: React.FC<{ task: Task }> = ({ task }) => {
    return (
        <div className="bg-background border-2 border-primary rounded-lg p-3 shadow-2xl rotate-2 scale-105 opacity-90">
            <div className="flex items-start gap-2">
                <div className="flex items-center"><GripVertical size={14} className="text-primary" /></div>
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
                        {task.dueDate && <div className="flex items-center gap-1"><Clock size={10} /><span>{new Date(task.dueDate).toLocaleDateString()}</span></div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Kanban Column Component
const KanbanColumn: React.FC<{
    column: Column;
    onAddTask: (columnId: TaskStatus) => void;
    onViewTask: (task: Task) => void;
    isMobile?: boolean;
}> = ({ column, onAddTask, onViewTask, isMobile = false }) => {
    const { setNodeRef, isOver } = useDroppable({ id: column.id });

    return (
        <div
            ref={setNodeRef}
            className={`${column.color} border rounded-lg p-4 flex flex-col transition-all kanban-column ${
                isOver ? 'ring-2 ring-primary ring-opacity-50 scale-[1.02]' : ''
            } ${
                isMobile
                    ? 'min-h-[200px] w-full'
                    : 'min-h-[500px] min-w-[280px]'
            }`}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    {column.title}
                    <span className="text-xs bg-background px-2 py-0.5 rounded-full text-muted-foreground">
                        {column.tasks.length}
                    </span>
                </h3>
                <button
                    className="p-1 hover:bg-background/50 rounded transition-colors"
                    onClick={() => onAddTask(column.id)}
                    title="Add new task"
                >
                    <Plus size={14} />
                </button>
            </div>

            <SortableContext items={column.tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 flex-1">
                    {column.tasks.map((task) => <SortableTask key={task.id} task={task} isMobile={isMobile} onView={onViewTask} />)}
                    {column.tasks.length === 0 && (
                        <div className="text-center py-8 text-sm text-muted-foreground h-full flex items-center justify-center">
                            {isOver ? 'Drop task here' : 'No tasks yet'}
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
};

// --- Task Creation Modal (Moved outside the main component) ---
interface TaskCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    taskData: NewTaskState;
    onTaskDataChange: (data: NewTaskState) => void;
    columnTitle?: string;
}

const TaskCreationModal: React.FC<TaskCreationModalProps> = ({
                                                                 isOpen,
                                                                 onClose,
                                                                 onSubmit,
                                                                 taskData,
                                                                 onTaskDataChange,
                                                                 columnTitle,
                                                             }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background border border-border rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto sm:max-h-[85vh]">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">
                        Create New Task {columnTitle && ( <span className="text-sm text-muted-foreground ml-2">in {columnTitle}</span> )}
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
                            className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base mobile-input"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                        <textarea
                            value={taskData.description}
                            onChange={(e) => onTaskDataChange({ ...taskData, description: e.target.value })}
                            placeholder="Enter task description..."
                            rows={3}
                            className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-base mobile-input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
                        <div className="flex gap-2">
                            {(["low", "medium", "high"] as const).map((priority) => (
                                <button
                                    key={priority}
                                    onClick={() => onTaskDataChange({ ...taskData, priority })}
                                    className={`flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-md border border-border text-sm font-medium transition-colors mobile-button ${
                                        taskData.priority === priority
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background hover:bg-secondary text-foreground"
                                    }`}
                                >
                                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
                        <input
                            type="text"
                            value={taskData.tags}
                            onChange={(e) => onTaskDataChange({ ...taskData, tags: e.target.value })}
                            placeholder="Enter tags separated by commas..."
                            className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base mobile-input"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Separate multiple tags with commas</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Due Date</label>
                        <input
                            type="date"
                            value={taskData.dueDate}
                            onChange={(e) => onTaskDataChange({ ...taskData, dueDate: e.target.value })}
                            className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base mobile-input"
                        />
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-border">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 sm:px-6 sm:py-3 text-sm font-medium text-foreground hover:bg-secondary rounded-md transition-colors mobile-button"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={!taskData.title.trim()}
                        className="px-4 py-2 sm:px-6 sm:py-3 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mobile-button"
                    >
                        Create Task
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Task Detail Modal (NEW COMPONENT) ---
interface TaskDetailModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose }) => {
    if (!isOpen || !task) return null;

    const column = COLUMN_CONFIG.find(c => c.id === task.status);
    const columnTitle = column ? column.title : 'Unknown';
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto sm:max-h-[85vh]">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3 min-w-0">
                        <PriorityIndicator priority={task.priority} />
                        <h2 className="text-lg font-semibold text-foreground truncate">{task.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-secondary rounded-md transition-colors flex-shrink-0 ml-4">
                        <X size={20} />
                    </button>
                </div>
                {/* CHANGE: Added 'text-left' to ensure all text inside is aligned to the start */}
                <div className="p-6 space-y-6 text-left">
                    {task.description && (
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                            <p className="text-foreground whitespace-pre-wrap text-base">{task.description}</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-6">
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                            <p className="text-foreground font-medium">{columnTitle}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Priority</h3>
                            <p className="text-foreground font-medium capitalize">{task.priority}</p>
                        </div>
                        {task.dueDate && (
                            <div className="col-span-1 sm:col-span-2">
                                <h3 className="text-sm font-medium text-muted-foreground mb-1">Due Date</h3>
                                <div className="flex items-center gap-2">
                                    <p className={`font-medium ${isOverdue ? 'text-orange-500' : 'text-foreground'}`}>
                                        {new Date(task.dueDate).toLocaleDateString()}
                                    </p>
                                    {isOverdue && <span className="text-xs text-orange-500">(Overdue)</span>}
                                </div>
                            </div>
                        )}
                    </div>
                    {task.tags && task.tags.length > 0 && (
                        <div className="border-t border-border pt-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {task.tags.map(tag => (
                                    <span key={tag} className="inline-block px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-full">{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-end p-4 border-t border-border bg-muted/50 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-secondary transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Component
const TasksKanbanBackend: React.FC<TasksKanbanProps> = ({ notebookId }) => {
    const [columns, setColumns] = useState<Column[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [activeTaskOriginalColumn, setActiveTaskOriginalColumn] = useState<TaskStatus | null>(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedColumnId, setSelectedColumnId] = useState<TaskStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);

    // Form state for new task
    const [newTask, setNewTask] = useState<NewTaskState>({
        title: "",
        description: "",
        priority: "medium",
        tags: "",
        dueDate: ""
    });

    // Fetch tasks from backend
    const fetchTasks = useCallback(async () => {
        try {
            setError(null);
            const response = await TasksService.getTasksByNotebookId(notebookId);
            const taskList: Task[] = response.tasks.map(convertTaskResponse);

            const newColumns: Column[] = COLUMN_CONFIG.map(config => ({
                ...config,
                tasks: taskList
                    .filter(task => task.status === config.id)
                    .sort((a, b) => (a.position || 0) - (b.position || 0))
            }));
            setColumns(newColumns);
        } catch (err) {
            console.error("Error fetching tasks:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch tasks");
        } finally {
            setIsLoading(false);
        }
    }, [notebookId]);

    // Set up real-time updates
    useEffect(() => {
        const source = TasksService.connectToTaskUpdates(
            notebookId,
            (data) => {
                // Check if this is a connection message or task update
                if ('type' in data && data.type === 'connected') {
                    // Connection established, don't refresh
                    return;
                }
                // For any other message (task updates), refresh the tasks
                fetchTasks();
            },
            (error) => console.error("SSE error:", error)
        );
        return () => source.close();
    }, [notebookId, fetchTasks]);

    // Initial load
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const collisionDetectionAlgorithm = (args: any) => {
        const pointerCollisions = pointerWithin(args);
        return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
    };

    const findColumn = (id: string): Column | undefined => {
        return columns.find((col) => col.tasks.some((task) => task.id === id));
    };

    // Task creation handlers
    const openTaskModal = (columnId: TaskStatus) => { setSelectedColumnId(columnId); setShowTaskModal(true); resetForm(); };
    const closeTaskModal = () => { setShowTaskModal(false); setSelectedColumnId(null); resetForm(); };
    const resetForm = () => { setNewTask({ title: "", description: "", priority: "medium", tags: "", dueDate: "" }); };

    // Task view handlers
    const handleViewTask = (task: Task) => setViewingTask(task);
    const handleCloseTaskView = () => setViewingTask(null);

    const handleCreateTask = async () => {
        if (!newTask.title.trim() || !selectedColumnId) return;
        try {
            const taskData: TaskCreateRequest = {
                title: newTask.title.trim(),
                description: newTask.description.trim() || undefined,
                priority: newTask.priority as TaskPriority,
                tags: newTask.tags ? newTask.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
                due_date: newTask.dueDate || undefined,
                status: selectedColumnId,
            };
            await TasksService.createTask(notebookId, taskData);
            closeTaskModal();
            await fetchTasks(); // Re-fetch tasks to show the new one
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create task");
        }
    };

    // Drag and drop handlers
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const activeId = active.id as string;
        const foundTask = columns.flatMap(col => col.tasks).find(task => task.id === activeId);
        setActiveTask(foundTask || null);

        const originalColumn = findColumn(activeId);
        setActiveTaskOriginalColumn(originalColumn?.id || null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeColumn = findColumn(activeId);
        const overColumn = columns.find(col => col.id === overId) || findColumn(overId);

        if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return;

        setColumns((prev) => {
            const activeTasks = [...activeColumn.tasks];
            const overTasks = [...overColumn.tasks];
            const activeIndex = activeTasks.findIndex((t) => t.id === activeId);
            const [movedTask] = activeTasks.splice(activeIndex, 1);
            movedTask.status = overColumn.id;

            const overTaskIndex = overTasks.findIndex((t) => t.id === overId);
            if (overTaskIndex !== -1) {
                overTasks.splice(overTaskIndex, 0, movedTask);
            } else {
                overTasks.push(movedTask);
            }

            return prev.map((col) => {
                if (col.id === activeColumn.id) return { ...col, tasks: activeTasks };
                if (col.id === overColumn.id) return { ...col, tasks: overTasks };
                return col;
            });
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const originalColumnId = activeTaskOriginalColumn;

        setActiveTask(null);
        setActiveTaskOriginalColumn(null);

        const { active, over } = event;
        if (!over || !originalColumnId) {
            return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;

        const targetColumn = columns.find(col => col.id === overId) || findColumn(overId);

        if (!targetColumn) {
            fetchTasks();
            return;
        }

        try {
            if (originalColumnId !== targetColumn.id) {
                const newPosition = targetColumn.tasks.findIndex(t => t.id === activeId);
                const moveData: TaskMoveRequest = {
                    status: targetColumn.id,
                    position: newPosition > -1 ? newPosition : 0,
                };
                await TasksService.moveTask(activeId, moveData);
            }
            else {
                const column = columns.find(c => c.id === originalColumnId);
                if (!column) return;

                const oldIndex = column.tasks.findIndex(t => t.id === activeId);
                const newIndex = column.tasks.findIndex(t => t.id === overId);

                if (oldIndex !== newIndex && newIndex !== -1) {
                    setColumns(prev => prev.map(c => {
                        if (c.id === originalColumnId) {
                            return { ...c, tasks: arrayMove(c.tasks, oldIndex, newIndex) };
                        }
                        return c;
                    }));

                    const reorderData: TaskReorderRequest = { position: newIndex };
                    await TasksService.reorderTask(activeId, reorderData);
                }
            }
        } catch (err) {
            console.error("Error updating task:", err);
            setError(err instanceof Error ? err.message : "Failed to update task");
            fetchTasks();
        }
    };

    if (isLoading) {
        return <div className="h-full flex items-center justify-center"><div className="flex items-center gap-2"><Loader2 className="animate-spin" size={20} /><span>Loading tasks...</span></div></div>;
    }

    if (error) {
        return <div className="h-full flex items-center justify-center"><div className="text-center"><AlertCircle size={48} className="mx-auto mb-4 text-destructive" /><p className="text-destructive mb-2">Error loading tasks</p><p className="text-sm text-muted-foreground mb-4">{error}</p><button onClick={fetchTasks} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">Retry</button></div></div>;
    }

    const selectedColumn = columns.find(col => col.id === selectedColumnId);

    return (
        <div className="h-full flex flex-col">
            <div className="border-b border-border bg-background flex-shrink-0">
                {/* Mobile Header */}
                <div className="md:hidden p-4">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl font-bold text-foreground">Tasks</h1>
                            <button
                                onClick={() => openTaskModal(TaskStatus.TODO)}
                                className="px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                <Plus size={16} />
                                <span className="hidden sm:inline">Add</span>
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground text-left">Manage your project tasks</p>
                    </div>
                </div>

                {/* Desktop Header */}
                <div className="hidden md:block p-4">
                    <div className="flex items-center justify-between">
                        <div className="text-left">
                            <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
                            <p className="text-sm text-muted-foreground">Manage your project tasks and workflow</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-64"
                            />
                            <button
                                onClick={() => openTaskModal(TaskStatus.TODO)}
                                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Add Task
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-4 mobile-scroll">
                <DndContext collisionDetection={collisionDetectionAlgorithm} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                    {/* Mobile View: Single column scrollable */}
                    <div className="block md:hidden">
                        <div className="space-y-4 pb-20">
                            {columns.map((column) => (
                                <KanbanColumn key={column.id} column={column} onAddTask={openTaskModal} onViewTask={handleViewTask} isMobile={true} />
                            ))}
                        </div>
                    </div>

                    {/* Desktop View: Grid layout */}
                    <div className="hidden md:block">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[800px]">
                            {columns.map((column) => (
                                <KanbanColumn key={column.id} column={column} onAddTask={openTaskModal} onViewTask={handleViewTask} isMobile={false} />
                            ))}
                        </div>
                    </div>

                    {createPortal(<DragOverlay>{activeTask ? <TaskDragOverlay task={activeTask} /> : null}</DragOverlay>, document.body)}
                </DndContext>
            </div>
            <TaskCreationModal
                isOpen={showTaskModal}
                onClose={closeTaskModal}
                onSubmit={handleCreateTask}
                taskData={newTask}
                onTaskDataChange={setNewTask}
                columnTitle={selectedColumn?.title}
            />
            <TaskDetailModal
                isOpen={!!viewingTask}
                task={viewingTask}
                onClose={handleCloseTaskView}
            />
        </div>
    );
};

export default TasksKanbanBackend;
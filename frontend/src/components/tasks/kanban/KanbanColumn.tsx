import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { TaskStatus } from "../../../services/tasksService";
import type {Task, Column} from "./types.ts";
import { SortableTask } from "./TaskCard";

interface KanbanColumnProps {
    column: Column;
    onAddTask: (columnId: TaskStatus) => void;
    onViewTask: (task: Task) => void;
    onEditTask: (task: Task) => void;
    onArchiveTask: (task: Task) => void;
    onUnarchiveTask: (task: Task) => void;
    onDeleteTask: (task: Task) => void;
    isMobile?: boolean;
    canCreate?: boolean;
    showPriorities?: boolean;
    isAllTasksView?: boolean; // New prop
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
                                                       column, onAddTask, onViewTask, onEditTask, onArchiveTask, onUnarchiveTask, onDeleteTask,
                                                       isMobile = false, canCreate = true, showPriorities = true, isAllTasksView = false
                                                   }) => {
    const { setNodeRef, isOver } = useDroppable({ id: column.id });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col h-full rounded-xl transition-colors ${
                isMobile ? 'min-h-[200px] w-full' : 'min-h-[500px] min-w-[300px]'
            } ${isOver ? 'bg-secondary/30' : ''}`}
        >
            {/* Clean Header */}
            <div className="flex items-center justify-between px-2 py-3 mb-1 shrink-0">
                <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-offset-2 ring-offset-background ${column.accentColor}`} />
                    <h3 className="font-semibold text-sm text-foreground">
                        {column.title}
                    </h3>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-medium">
                        {column.tasks.length}
                    </span>
                </div>

                {canCreate && (
                    <button
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-all"
                        onClick={() => onAddTask(column.id)}
                        title="Add new task"
                    >
                        <Plus size={16} />
                    </button>
                )}
            </div>

            {/* Task Area */}
            <SortableContext items={column.tasks.filter(task => !task.archived).map(task => task.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 px-2 pb-4 space-y-3 overflow-y-auto custom-scrollbar">
                    {column.tasks.map((task) => (
                        <SortableTask
                            key={task.id}
                            task={task}
                            isMobile={isMobile}
                            onView={onViewTask}
                            onEdit={onEditTask}
                            onArchive={onArchiveTask}
                            onUnarchive={onUnarchiveTask}
                            onDelete={onDeleteTask}
                            showPriorities={showPriorities}
                            isAllTasksView={isAllTasksView} // Pass down
                        />
                    ))}

                    {column.tasks.length === 0 && (
                        <div className="h-32 border border-dashed border-border/50 rounded-lg flex items-center justify-center text-muted-foreground text-xs opacity-50 hover:opacity-100 transition-opacity">
                            {isOver ? 'Drop task here' : 'No tasks'}
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
};

export default KanbanColumn;
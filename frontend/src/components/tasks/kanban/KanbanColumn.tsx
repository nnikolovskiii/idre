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
    isMobile?: boolean;
    canCreate?: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
                                                       column, onAddTask, onViewTask, onEditTask, onArchiveTask, onUnarchiveTask,
                                                       isMobile = false, canCreate = true
                                                   }) => {
    const { setNodeRef, isOver } = useDroppable({ id: column.id });

    return (
        <div
            ref={setNodeRef}
            className={`${column.color} border rounded-lg p-4 flex flex-col transition-all kanban-column ${
                isOver ? 'ring-2 ring-primary ring-opacity-50 scale-[1.02]' : ''
            } ${
                isMobile ? 'min-h-[200px] w-full' : 'min-h-[500px] min-w-[280px]'
            }`}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    {column.title}
                    <span className="text-xs bg-background px-2 py-0.5 rounded-full text-muted-foreground">
                        {column.tasks.length}
                    </span>
                </h3>
                {canCreate && (
                    <button
                        className="p-1 hover:bg-background/50 rounded transition-colors"
                        onClick={() => onAddTask(column.id)}
                        title="Add new task"
                    >
                        <Plus size={14} />
                    </button>
                )}
            </div>

            <SortableContext items={column.tasks.filter(task => !task.archived).map(task => task.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 flex-1">
                    {column.tasks.map((task) => (
                        <SortableTask
                            key={task.id}
                            task={task}
                            isMobile={isMobile}
                            onView={onViewTask}
                            onEdit={onEditTask}
                            onArchive={onArchiveTask}
                            onUnarchive={onUnarchiveTask}
                        />
                    ))}
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

export default KanbanColumn;
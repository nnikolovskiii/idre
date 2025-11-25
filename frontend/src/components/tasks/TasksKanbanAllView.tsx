import React from "react";
import TasksKanban from "./TasksKanbanBackend";

const TasksKanbanAllView: React.FC = () => {
    return (
        <div className="h-dvh w-screen bg-background text-foreground overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden relative">
                <TasksKanban
                    notebookId=""
                    viewMode="all"
                />
            </div>
        </div>
    );
};

export default TasksKanbanAllView;
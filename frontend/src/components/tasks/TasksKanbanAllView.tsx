import React from "react";
import TasksKanban from "./TasksKanbanBackend";
import DashboardLayout from "../layout/DashboardLayout";

const TasksKanbanAllView: React.FC = () => {
    return (
        <DashboardLayout title="All Tasks">
            <div className="h-full w-full overflow-hidden relative">
                <TasksKanban
                    notebookId=""
                    viewMode="all"
                />
            </div>
        </DashboardLayout>
    );
};

export default TasksKanbanAllView;
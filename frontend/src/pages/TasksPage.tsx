// Tasks Kanban Board Page
import React from "react";
import { useParams, Navigate } from "react-router-dom";
import TasksView from "../components/tasks/TasksView";

const TasksPage: React.FC = () => {
  const { notebookId } = useParams<{ notebookId?: string }>();

  if (!notebookId) {
    return <Navigate to="/notebooks" replace />;
  }

  return <TasksView notebookId={notebookId} />;
};

export default TasksPage;
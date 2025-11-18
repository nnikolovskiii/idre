// File: frontend/src/components/tasks/TasksView.tsx

// Tasks Kanban Board View Component
import React from "react";
import { useParams } from "react-router-dom";
import Layout from "../layout/Layout";
import TasksKanban from "./TasksKanbanBackend";
import { useChats } from "../../hooks/useChats";
import { useSse } from "../../context/SseContext";

type TasksViewProps = {
    notebookId?: string;
};

const TasksView: React.FC<TasksViewProps> = ({ notebookId: propNotebookId }) => {
    const { notebookId: paramNotebookId } = useParams<{ notebookId: string }>();
    const currentNotebookId = propNotebookId || paramNotebookId;
    const { isThreadTyping } = useSse();

    const {
        chatSessions,
        currentChatId,
        loadingChats,
        creatingChat,
        isTyping,
        isAuthenticated,
        user,
        isTemporaryChat,
        createTemporaryChat,
        switchToChat,
        handleDeleteChat,
    } = useChats(currentNotebookId);

    if (!currentNotebookId) {
        return <div>Notebook ID is required</div>;
    }

    return (
        <Layout
            title="Tasks"
            notebookId={currentNotebookId}
            chatSessions={chatSessions}
            currentChatId={currentChatId}
            loadingChats={loadingChats}
            creatingChat={creatingChat}
            isTyping={isTyping}
            isAuthenticated={isAuthenticated}
            user={user}
            isTemporaryChat={isTemporaryChat}
            createNewChat={createTemporaryChat}
            createTemporaryChat={createTemporaryChat}
            switchToChat={switchToChat}
            handleDeleteChat={handleDeleteChat}
            isThreadTyping={isThreadTyping}
            forceRegularLayout={true} // <-- ADDED PROP
        >
            <TasksKanban notebookId={currentNotebookId} />
        </Layout>
    );
};

export default TasksView;
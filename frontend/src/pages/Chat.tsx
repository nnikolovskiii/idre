import React from "react";
import { useParams, Navigate } from "react-router-dom";
import ChatView from "../components/chat/ChatView";

const Chat: React.FC = () => {
  const { notebookId } = useParams<{ notebookId?: string }>();
  if (!notebookId) {
    return <Navigate to="/notebooks" replace />;
  }
  return <ChatView notebookId={notebookId} />;
};

export default Chat;

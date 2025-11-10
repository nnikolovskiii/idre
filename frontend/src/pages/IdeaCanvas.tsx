import React from "react";
import { useParams, Navigate } from "react-router-dom";
import IdeaCanvasView from "../components/idea/IdeaCanvasView";

const IdeaCanvas: React.FC = () => {
  const { notebookId } = useParams<{ notebookId?: string }>();
  if (!notebookId) {
    return <Navigate to="/notebooks" replace />;
  }
  return <IdeaCanvasView notebookId={notebookId} />;
};

export default IdeaCanvas;

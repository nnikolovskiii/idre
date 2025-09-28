import React, { useState, useEffect } from "react";
import {
  Plus,
  Grid,
  Rows3,
  ChevronDown,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import type { Notebook } from "../lib/notebooksService";
import { notebooksService } from "../lib/notebooksService";
import { useNavigate } from "react-router-dom";

// Reusable component for displaying a single notebook card
const NotebookCard: React.FC<{ notebook: Notebook }> = ({ notebook }) => {
  return (
    <div
      className={`p-4 rounded-xl flex flex-col h-48 shadow-sm transition-shadow hover:shadow-md ${notebook.bgColor}`}
    >
      <div className="flex justify-between items-start">
        <span className="text-3xl">{notebook.emoji}</span>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical size={20} />
        </button>
      </div>
      <div className="mt-auto">
        <h3
          className={`text-lg font-semibold ${notebook.textColor} leading-tight`}
        >
          {notebook.title}
        </h3>
        <p className="text-xs text-gray-500 mt-2">
          {notebook.date} &middot; {notebook.sourceCount} source
          {notebook.sourceCount !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};

// Component for the "Create new notebook" card
const CreateNewCard: React.FC = () => {
  return (
    <div className="p-4 rounded-xl flex flex-col items-center justify-center h-48 bg-white border-2 border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400 cursor-pointer transition-colors">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <Plus size={24} />
      </div>
      <span className="font-medium">Create new notebook</span>
    </div>
  );
};

// The main dashboard component that brings everything together
const NotebooksDashboard: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotebooks();
  }, []);

  const loadNotebooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const notebooksData = await notebooksService.getAllNotebooks();
      setNotebooks(notebooksData || []);
    } catch (err) {
      console.error("Error loading notebooks:", err);
      setError(err instanceof Error ? err.message : "Failed to load notebooks");
      setNotebooks([]); // Ensure notebooks is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate("/notebooks/create");
  };

  const handleCreateCardClick = () => {
    handleCreateNew();
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-8 font-sans flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading notebooks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen p-8 font-sans flex items-center justify-center">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  // Show error state if there's an error and no notebooks loaded
  if (error && notebooks.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen p-8 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">Error: {error}</div>
          <button
            onClick={loadNotebooks}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-8 font-sans">
      <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
        {/* Left side: Tabs */}
        <nav className="flex items-center gap-2">
          <button className="py-2 px-4 rounded-full text-sm font-medium bg-gray-900 text-white">
            All
          </button>
          <button className="py-2 px-4 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
            My notebooks
          </button>
          <button className="py-2 px-4 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
            Featured notebooks
          </button>
        </nav>

        {/* Right side: Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-gray-300 rounded-md p-0.5">
            <button
              className="p-1.5 bg-gray-200 rounded-sm"
              aria-label="Grid view"
            >
              <Grid size={18} className="text-gray-800" />
            </button>
            <button
              className="p-1.5 rounded-sm hover:bg-gray-100"
              aria-label="List view"
            >
              <Rows3 size={18} className="text-gray-600" />
            </button>
          </div>
          <button className="flex items-center gap-2 rounded-md py-2 px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
            Most recent
            <ChevronDown size={16} />
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-white text-gray-800 border border-gray-300 rounded-md py-2 px-4 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Plus size={16} />
            Create new
          </button>
        </div>
      </header>

      <main>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Recent notebooks
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <div onClick={handleCreateCardClick}>
            <CreateNewCard />
          </div>
          {notebooks &&
            notebooks.map((notebook) => (
              <NotebookCard key={notebook.id} notebook={notebook} />
            ))}
        </div>
        {notebooks.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No notebooks found. Create your first notebook!
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default NotebooksDashboard;

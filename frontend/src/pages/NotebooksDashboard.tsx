import React, { useState, useEffect } from "react";
import {
  Plus,
  MoreVertical,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import {NotebookService, type NotebookResponse } from "../lib/notebooksService";
import { useTheme } from "../context/ThemeContext";

const convertColorForTheme = (colorClass: string, theme: 'light' | 'dark'): string => {
  if (theme === 'light') {
    return colorClass;
  }
  
  if (colorClass.includes('-50')) {
    return colorClass.replace('-50', '-900/20');
  }
  if (colorClass.includes('-800')) {
    return colorClass.replace('-800', '-300');
  }
  
  return colorClass;
};

const NotebookCard: React.FC<{ notebook: NotebookResponse; theme: 'light' | 'dark' }> = ({
                                                                  notebook, theme,
                                                                }) => {
  const displayBgColor = convertColorForTheme(notebook.bg_color, theme);
  const displayTextColor = convertColorForTheme(notebook.text_color, theme);
  
  return (
      <div
          className={`p-4 rounded-xl flex flex-col h-48 shadow-sm transition-shadow hover:shadow-md ${displayBgColor}`}
      >
        <div className="flex justify-between items-start">
          <span className="text-3xl">{notebook.emoji}</span>
          <button className={`${
            theme === 'dark'
              ? 'text-gray-500 hover:text-gray-300'
              : 'text-gray-400 hover:text-gray-600'
          }`}>
            <MoreVertical size={20} />
          </button>
        </div>
        <div className="mt-auto">
          <h3
              className={`text-lg font-semibold ${displayTextColor} leading-tight`}
          >
            {notebook.title}
          </h3>
          <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{notebook.date}</p>
        </div>
      </div>
  );
};

const CreateNewCard: React.FC<{ theme: 'light' | 'dark' }> = ({ theme }) => {
  return (
      <div className={`p-4 rounded-xl flex flex-col items-center justify-center h-48 border-2 border-dashed cursor-pointer transition-colors ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500'
          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400'
      }`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <Plus size={24} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} />
        </div>
        <span className="font-medium">Create new notebook</span>
      </div>
  );
};

const NotebooksDashboard: React.FC = () => {
  const [notebooks, setNotebooks] = useState<NotebookResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    loadNotebooks();
  }, []);

  const loadNotebooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await NotebookService.getAllNotebooks();
      setNotebooks(response.data || []);
    } catch (err) {
      console.error("Error loading notebooks:", err);
      setError(err instanceof Error ? err.message : "Failed to load notebooks");
      setNotebooks([]);
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
        <div className="bg-background min-h-screen p-8 font-sans flex items-center justify-center">
          <div className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading notebooks...</div>
        </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
        <div className="bg-background min-h-screen p-8 font-sans flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-red-600 mb-4">Error: {error}</div>
            <button
                onClick={loadNotebooks}
                className={`px-4 py-2 rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
              Try Again
            </button>
          </div>
        </div>
    );
  }

  return (
      <div className="bg-background min-h-screen p-8 font-sans">
        <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
          {/* Left side: Tabs */}
          <nav className="flex items-center gap-2">
            {/* <button className="py-2 px-4 rounded-full text-sm font-medium bg-gray-900 text-white">
              All
            </button>
            <b  utton className="py-2 px-4 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
              My notebooks
            </button>
            <button className="py-2 px-4 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
              Featured notebooks
            </button> */}
          </nav>

          {/* Right side: Controls */}
          <div className="flex items-center gap-3">
            {/* <div className="flex items-center border border-gray-300 rounded-md p-0.5">
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
            </div> */}
            {/* <button className="flex items-center gap-2 rounded-md py-2 px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
              Most recent
              <ChevronDown size={16} />
            </button> */}
            <button
                onClick={handleCreateNew}
                className={`flex items-center gap-2 rounded-md py-2 px-4 text-sm font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-800 text-gray-200 border border-gray-600 hover:bg-gray-700'
                    : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              <Plus size={16} />
              Create new
            </button>
          </div>
        </header>

        <main>
          <h1 className="text-2xl font-bold mb-6">
            My notebooks
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <div onClick={handleCreateCardClick}>
              <CreateNewCard theme={theme} />
            </div>
            {notebooks.map((notebook) => (
                <div key={notebook.id} onClick={() => navigate(`/chat/${notebook.id}`)} className="cursor-pointer">
                  <NotebookCard notebook={notebook} theme={theme} />
                </div>
            ))}
          </div>
          {notebooks.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  No notebooks found. Create your first notebook!
                </p>
              </div>
          )}
        </main>
      </div>
  );
};

export default NotebooksDashboard;

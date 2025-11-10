import React, { useState } from "react";
import { Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {NotebookService, type NotebookCreate} from "../services/notebooksService.ts";
import { useTheme } from "../context/ThemeContext.tsx";
import { Icon, type IconName } from "./Icon.tsx";

interface CreateNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateNotebookModal: React.FC<CreateNotebookModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<NotebookCreate, 'bg_color' | 'text_color'> & { bg_color?: string; text_color?: string }>({
    emoji: "book",
    title: "",
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  });

  const iconOptions: IconName[] = [
    "soccer-ball", 
    "book", 
    "rocket", 
    "star", 
    "fingerprint", 
    "palette", 
    "pet", 
    "shop"
  ];

  const handleInputChange = (
      field: keyof NotebookCreate,
      value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const notebookData = {
        ...formData,
        bg_color: "bg-blue-50",
        text_color: "text-blue-800",
      } as NotebookCreate;

      const createdNotebook = await NotebookService.createNotebook(notebookData);
      
      // Reset form
      setFormData({
        emoji: "book",
        title: "",
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      });

      onSuccess();
      onClose();
      
      // Navigate to welcome page with the new notebook ID
      navigate(`/welcome/${createdNotebook.id}`);
    } catch (err) {
      setError(
          err instanceof Error ? err.message : "Failed to create notebook"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setFormData({
        emoji: "book",
        title: "",
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-2xl rounded-lg shadow-xl ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Create New Notebook</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className={`p-2 rounded-md transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-500'
            } disabled:opacity-50`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{error}</p>
              </div>
          )}

          {/* Title */}
          <div className="mb-6">
            <label
                htmlFor="title"
                className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
            >
              Title *
            </label>
            <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Enter notebook title..."
                required
                disabled={loading}
            />
          </div>

          {/* Icon Selection */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Icon
            </label>
            <div className="grid grid-cols-4 gap-3">
              {iconOptions.map((iconName) => (
                  <button
                      key={iconName}
                      type="button"
                      onClick={() => handleInputChange("emoji", iconName)}
                      disabled={loading}
                      className={`w-full h-16 rounded-md border-2 flex items-center justify-center transition-colors ${
                          formData.emoji === iconName
                              ? theme === 'dark'
                                  ? "border-blue-400 bg-blue-900/30"
                                  : "border-blue-500 bg-blue-50"
                              : theme === 'dark'
                                  ? "border-gray-600 hover:bg-gray-700"
                                  : "border-gray-200 hover:bg-gray-50"
                      } disabled:opacity-50`}
                  >
                    <Icon 
                      name={iconName} 
                      className="w-8 h-8"
                    />
                  </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                } disabled:opacity-50`}
            >
              <X size={16} />
              Cancel
            </button>
            <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={16} />
              {loading ? "Creating..." : "Create Notebook"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNotebookModal;

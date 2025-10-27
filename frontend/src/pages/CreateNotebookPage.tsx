import React, { useState } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {NotebookService, type NotebookCreate} from "../lib/notebooksService.ts";
import { useTheme } from "../context/ThemeContext.tsx";
import { Icon, type IconName } from "../components/Icon.tsx";
// Import the new service and types


const CreateNotebookPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use the new NotebookCreate type with icon instead of emoji
  const [formData, setFormData] = useState<Omit<NotebookCreate, 'bg_color' | 'text_color'> & { bg_color?: string; text_color?: string }>({
    emoji: "book", // Use icon key instead of emoji
    title: "",
    // A more user-friendly default date format
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  });

  // Icon options from the iconMap
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

      // Create the notebook data with default color values
      const notebookData = {
        ...formData,
        bg_color: "bg-blue-50",
        text_color: "text-blue-800",
      } as NotebookCreate;

      // Use the new service to create the notebook
      await NotebookService.createNotebook(notebookData);

      // Navigate back to dashboard on success
      navigate("/notebooks");
    } catch (err) {
      setError(
          err instanceof Error ? err.message : "Failed to create notebook"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/notebooks");
  };

  return (
      <div className="bg-background min-h-screen p-8 font-sans">
        {/* Header */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
                onClick={handleCancel}
                className="flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Notebooks
            </button>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Create New Notebook
          </h1>
          <p className="">
            Create a new notebook to organize your thoughts and sources.
          </p>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto">
          <form
              onSubmit={handleSubmit}
              className="bg-primary rounded-lg shadow-sm border  p-6"
          >
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Title */}
            <div className="mb-6">
              <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
              >
                Title *
              </label>
              <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter notebook title..."
                  required
              />
            </div>

            {/* Icon Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <div className="grid grid-cols-3 gap-3">
                {iconOptions.map((iconName) => (
                    <button
                        key={iconName}
                        type="button"
                        onClick={() => handleInputChange("emoji", iconName)}
                        className={`w-full h-16 rounded-md border-2 flex items-center justify-center transition-colors ${
                            formData.emoji === iconName
                                ? theme === 'dark'
                                    ? "border-blue-400 bg-blue-900/30"
                                    : "border-blue-500 bg-blue-50"
                                : theme === 'dark'
                                    ? "border-gray-600 hover:bg-gray-800"
                                    : "border-gray-200 hover:bg-gray-50"
                        }`}
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
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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

export default CreateNotebookPage;

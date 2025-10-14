import React, { useState } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {NotebookService, type NotebookCreate} from "../lib/notebooksService.ts";
import { useTheme } from "../context/ThemeContext.tsx";
// Import the new service and types


const CreateNotebookPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use the new NotebookCreate type and remove source_count
  const [formData, setFormData] = useState<NotebookCreate>({
    emoji: "📝",
    title: "",
    // A more user-friendly default date format
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    bg_color: "bg-blue-50",
    text_color: "text-blue-800",
  });

  // Color options with names - the actual classes will be determined by theme
  const colorOptions = [
    { name: "Blue", color: "blue" },
    { name: "Green", color: "green" },
    { name: "Yellow", color: "yellow" },
    { name: "Red", color: "red" },
    { name: "Purple", color: "purple" },
    { name: "Pink", color: "pink" },
    { name: "Indigo", color: "indigo" },
    { name: "Gray", color: "gray" },
    { name: "Orange", color: "orange" },
    { name: "Teal", color: "teal" },
  ];

  // Function to get theme-appropriate classes for a color
  const getColorClasses = (colorName: string) => {
    if (theme === 'dark') {
      return {
        bg: `bg-${colorName}-900/20`,
        text: `text-${colorName}-300`
      };
    } else {
      return {
        bg: `bg-${colorName}-50`,
        text: `text-${colorName}-800`
      };
    }
  };

  const emojiOptions = [
    "📝", "📚", "📖", "📓", "📔", "📒", "📕", "📗", "📘", "📙", "🔖", "📄",
    "📃", "📋", "📊", "📈", "📉", "🗂️", "📁", "📂", "✏️", "💡", "🧠", "🚀",
    "🎯", "✨", "🎉", "💼", "📈", "🌍"
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

      // Use the new service to create the notebook
      await NotebookService.createNotebook(formData);

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

            {/* Emoji Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <div className="grid grid-cols-10 gap-2">
                {emojiOptions.map((emoji, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => handleInputChange("emoji", emoji)}
                        className={`w-10 h-10 rounded-md border-2 flex items-center justify-center text-lg transition-colors ${
                            formData.emoji === emoji
                                ? theme === 'dark'
                                    ? "border-blue-400 bg-blue-900/30"
                                    : "border-blue-500 bg-blue-50"
                                : theme === 'dark'
                                    ? "border-gray-600 hover:bg-gray-800"
                                    : "border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      {emoji}
                    </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Theme
              </label>
              <div className="grid grid-cols-5 gap-3">
                {colorOptions.map((colorOption, index) => {
                  const colorClasses = getColorClasses(colorOption.color);
                  return (
                    <button
                        key={index}
                        type="button"
                        onClick={() => {
                          handleInputChange("bg_color", colorClasses.bg);
                          handleInputChange("text_color", colorClasses.text);
                        }}
                        className={`w-full h-12 rounded-md border-2 flex items-center justify-center text-sm font-medium transition-all ${
                            formData.bg_color === colorClasses.bg
                                ? theme === 'dark'
                                    ? "border-blue-400 ring-2 ring-blue-800/30"
                                    : "border-blue-500 ring-2 ring-blue-200"
                                : theme === 'dark'
                                    ? "border-gray-600 hover:border-gray-500"
                                    : "border-gray-200 hover:border-gray-300"
                        } ${colorClasses.bg} ${colorClasses.text}`}
                    >
                      {colorOption.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div
                  className={`p-4 rounded-xl flex flex-col h-32 shadow-sm ${formData.bg_color}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-2xl">{formData.emoji}</span>
                </div>
                <div className="mt-auto">
                  <h3
                      className={`text-lg font-semibold ${formData.text_color} leading-tight`}
                  >
                    {formData.title || "Notebook Title"}
                  </h3>
                  {/* Removed source_count display */}
                  <p className="text-xs text-gray-500 mt-1">{formData.date}</p>
                </div>
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

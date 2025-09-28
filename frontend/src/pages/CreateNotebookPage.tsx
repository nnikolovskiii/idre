import React, { useState } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  notebooksService,
  type CreateNotebookRequest,
} from "../lib/notebooksService";

const CreateNotebookPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateNotebookRequest>({
    emoji: "📝",
    title: "",
    date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
    bg_color: "bg-blue-50",
    text_color: "text-blue-800",
    source_count: 0,
  });

  const colorOptions = [
    { bg: "bg-blue-50", text: "text-blue-800", name: "Blue" },
    { bg: "bg-green-50", text: "text-green-800", name: "Green" },
    { bg: "bg-yellow-50", text: "text-yellow-800", name: "Yellow" },
    { bg: "bg-red-50", text: "text-red-800", name: "Red" },
    { bg: "bg-purple-50", text: "text-purple-800", name: "Purple" },
    { bg: "bg-pink-50", text: "text-pink-800", name: "Pink" },
    { bg: "bg-indigo-50", text: "text-indigo-800", name: "Indigo" },
    { bg: "bg-gray-50", text: "text-gray-800", name: "Gray" },
    { bg: "bg-orange-50", text: "text-orange-800", name: "Orange" },
    { bg: "bg-teal-50", text: "text-teal-800", name: "Teal" },
  ];

  const emojiOptions = [
    "📝",
    "📚",
    "📖",
    "📓",
    "📔",
    "📒",
    "📕",
    "📗",
    "📘",
    "📙",
    "📚",
    "📖",
    "🔖",
    "📄",
    "📃",
    "📋",
    "📊",
    "📈",
    "📉",
    "🗂️",
    "📁",
    "📂",
    "🗂️",
    "📋",
    "📝",
    "✏️",
    "📝",
    "📝",
    "📝",
    "📝",
  ];

  const handleInputChange = (
    field: keyof CreateNotebookRequest,
    value: string | number
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

      await notebooksService.createNotebook(formData);

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
    <div className="bg-gray-50 min-h-screen p-8 font-sans">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Notebooks
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Create New Notebook
        </h1>
        <p className="text-gray-600">
          Create a new notebook to organize your thoughts and sources.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
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
                  className={`w-10 h-10 rounded-md border-2 flex items-center justify-center text-lg hover:bg-gray-50 transition-colors ${
                    formData.emoji === emoji
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
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
              {colorOptions.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    handleInputChange("bg_color", color.bg);
                    handleInputChange("text_color", color.text);
                  }}
                  className={`w-full h-12 rounded-md border-2 flex items-center justify-center text-sm font-medium transition-all ${
                    formData.bg_color === color.bg
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-gray-300"
                  } ${color.bg} ${color.text}`}
                >
                  {color.name}
                </button>
              ))}
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
                <p className="text-xs text-gray-500 mt-1">
                  {formData.date} &middot; {formData.source_count} source
                  {formData.source_count !== 1 ? "s" : ""}
                </p>
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

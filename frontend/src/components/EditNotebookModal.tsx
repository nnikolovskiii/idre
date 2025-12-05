import React, { useState, useEffect } from "react";
import { Save, X } from "lucide-react";
import { NotebookService, type NotebookUpdate, type NotebookResponse } from "../services/notebooksService.ts";
import { useTheme } from "../context/ThemeContext.tsx";
import { Icon, type IconName } from "./Icon.tsx";
import { NotebookColorPicker } from "./ColorPicker/NotebookColorPicker.tsx";
import {
  assignColorToNotebook
} from "../utils/notebookColors.ts";

interface EditNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  notebook: NotebookResponse | null;
}

const EditNotebookModal: React.FC<EditNotebookModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  notebook,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<NotebookUpdate, 'bg_color' | 'text_color'> & { bg_color?: string; text_color?: string }>({
    emoji: "",
    title: "",
    date: "",
    bg_color: "#4d4dff",
    text_color: "#ffffff",
  });

  const [selectedColorName, setSelectedColorName] = useState<string>("blue");

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

  // Initialize form data when notebook changes
  useEffect(() => {
    if (notebook) {
      setFormData({
        emoji: notebook.emoji || "book",
        title: notebook.title || "",
        date: notebook.date || new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        bg_color: notebook.bg_color || "#4d4dff",
        text_color: notebook.text_color || "#ffffff",
      });

      // Map the background color to a color name for the color picker
      const assignedColor = assignColorToNotebook(notebook.bg_color);
      setSelectedColorName(assignedColor.name);
    }
  }, [notebook]);

  const handleInputChange = (
      field: keyof NotebookUpdate,
      value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleColorChange = (color: { bg_color: string; text_color: string }) => {
    setFormData((prev) => ({
      ...prev,
      bg_color: color.bg_color,
      text_color: color.text_color,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!notebook) {
      setError("No notebook selected");
      return;
    }

    if (!formData.title?.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const notebookData = {
        ...formData,
        emoji: formData.emoji || "book",
        title: formData.title?.trim() || "",
        date: formData.date || new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      } as NotebookUpdate;

      await NotebookService.updateNotebook(notebook.id, notebookData);
      window.dispatchEvent(new Event("notebook-updated"));

      onSuccess();
      onClose();
    } catch (err) {
      setError(
          err instanceof Error ? err.message : "Failed to update notebook"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen || !notebook) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-2xl rounded-lg shadow-xl ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Edit Notebook</h2>
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
                value={formData.title || ""}
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

          {/* Date */}
          <div className="mb-6">
            <label
                htmlFor="date"
                className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
            >
              Date
            </label>
            <input
                type="text"
                id="date"
                value={formData.date || ""}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Enter date..."
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

          {/* Color Picker */}
          <div className="mb-6">
            <NotebookColorPicker
              selectedColor={selectedColorName}
              onColorChange={handleColorChange}
              disabled={loading}
              size="medium"
              showLabel={true}
            />
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
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditNotebookModal;
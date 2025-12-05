import React, { useState } from 'react';
import {
  getAvailableColors,
  getColorByName,
  getBackgroundColor
} from '../../utils/notebookColors';

interface NotebookColorPickerProps {
  selectedColor?: string;
  onColorChange: (color: { bg_color: string; text_color: string }) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

/**
 * NotebookColorPicker Component
 *
 * A color picker component that allows users to select colors for their notebooks.
 * The colors automatically adapt to light/dark themes through CSS variables.
 */
export const NotebookColorPicker: React.FC<NotebookColorPickerProps> = ({
  selectedColor = 'blue',
  onColorChange,
  disabled = false,
  size = 'medium',
  showLabel = true
}) => {
  const [currentColor, setCurrentColor] = useState<string>(selectedColor);
  const availableColors = getAvailableColors();

  // Size configurations
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-10 h-10'
  };

  const buttonSizeClasses = {
    small: 'p-1',
    medium: 'p-2',
    large: 'p-3'
  };

  const handleColorSelect = (colorName: string) => {
    const color = getColorByName(colorName);
    if (color && !disabled) {
      setCurrentColor(colorName);

      // Get the current theme to determine which background color to use
      const isDarkMode = document.documentElement.classList.contains('dark');
      const bgColor = getBackgroundColor(colorName, isDarkMode);

      onColorChange({
        bg_color: bgColor,
        text_color: color.text
      });
    }
  };

  const isSelected = (colorName: string) => {
    return currentColor === colorName;
  };

  return (
    <div className="notebook-color-picker">
      {showLabel && (
        <label className="block text-sm font-medium text-sidebar-foreground mb-2">
          Notebook Color
        </label>
      )}

      <div
        className={`flex flex-wrap gap-2 ${buttonSizeClasses[size]}`}
        role="radiogroup"
        aria-label="Select notebook color"
      >
        {availableColors.map((color) => (
          <button
            key={color.name}
            type="button"
            onClick={() => handleColorSelect(color.name)}
            disabled={disabled}
            className={`
              notebook-color-button
              ${sizeClasses[size]}
              rounded-full
              border-2
              transition-all
              duration-200
              ease-in-out
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-sidebar-ring
              ${isSelected(color.name)
                ? 'ring-2 ring-sidebar-ring ring-offset-2 ring-offset-background'
                : 'border-transparent'
              }
              ${disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:scale-110'
              }
            `}
            style={{
              backgroundColor: color.bgLight,
              borderColor: isSelected(color.name) ? color.borderLight : 'transparent'
            }}
            title={`${color.name.charAt(0).toUpperCase() + color.name.slice(1)} notebook`}
            aria-label={`Select ${color.name} color`}
            aria-pressed={isSelected(color.name)}
          >
            <span className="sr-only">{color.name}</span>
            {isSelected(color.name) && (
              <svg
                className="w-3 h-3 mx-auto text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        ))}
      </div>

      {showLabel && (
        <div className="mt-2 text-xs text-sidebar-muted-foreground">
          Selected: {currentColor.charAt(0).toUpperCase() + currentColor.slice(1)}
        </div>
      )}
    </div>
  );
};

export default NotebookColorPicker;
// Notebook color utility functions
// This provides a centralized system for managing notebook colors with theme support

export interface NotebookColor {
  name: string;
  bgLight: string;
  bgDark: string;
  text: string;
  borderLight: string;
  borderDark: string;
  className: string;
}

export const NOTEBOOK_COLORS: NotebookColor[] = [
  {
    name: 'blue',
    bgLight: '#4d4dff',
    bgDark: '#6366f1',
    text: '#ffffff',
    borderLight: '#3a3aeb',
    borderDark: '#5558dd',
    className: 'notebook-blue'
  },
  {
    name: 'green',
    bgLight: '#00b32c',
    bgDark: '#10b981',
    text: '#ffffff',
    borderLight: '#008a23',
    borderDark: '#0ea56d',
    className: 'notebook-green'
  },
  {
    name: 'purple',
    bgLight: '#8066ff',
    bgDark: '#8b5cf6',
    text: '#ffffff',
    borderLight: '#6652e6',
    borderDark: '#7c4ce3',
    className: 'notebook-purple'
  },
  {
    name: 'orange',
    bgLight: '#ffb300',
    bgDark: '#f59e0b',
    text: '#ffffff',
    borderLight: '#e6a100',
    borderDark: '#d97706',
    className: 'notebook-orange'
  },
  {
    name: 'red',
    bgLight: '#f04c4c',
    bgDark: '#ef4444',
    text: '#ffffff',
    borderLight: '#d63939',
    borderDark: '#dc2626',
    className: 'notebook-red'
  },
  {
    name: 'gray',
    bgLight: '#6b6b78',
    bgDark: '#a1a1aa',
    text: '#ffffff',
    borderLight: '#5a5a68',
    borderDark: '#8b8b93',
    className: 'notebook-gray'
  },
  {
    name: 'pink',
    bgLight: '#ff6b9d',
    bgDark: '#ec4899',
    text: '#ffffff',
    borderLight: '#ff4d8a',
    borderDark: '#db2777',
    className: 'notebook-pink'
  },
  {
    name: 'teal',
    bgLight: '#00b8a9',
    bgDark: '#14b8a6',
    text: '#ffffff',
    borderLight: '#00a69a',
    borderDark: '#0d9488',
    className: 'notebook-teal'
  },
  {
    name: 'indigo',
    bgLight: '#6366f1',
    bgDark: '#4f46e5',
    text: '#ffffff',
    borderLight: '#5558dd',
    borderDark: '#4338ca',
    className: 'notebook-indigo'
  },
  {
    name: 'yellow',
    bgLight: '#fbbf24',
    bgDark: '#f59e0b',
    text: '#ffffff',
    borderLight: '#f59e0b',
    borderDark: '#d97706',
    className: 'notebook-yellow'
  },
  {
    name: 'cyan',
    bgLight: '#06b6d4',
    bgDark: '#0891b2',
    text: '#ffffff',
    borderLight: '#0891b2',
    borderDark: '#0e7490',
    className: 'notebook-cyan'
  },
  {
    name: 'lime',
    bgLight: '#84cc16',
    bgDark: '#65a30d',
    text: '#ffffff',
    borderLight: '#65a30d',
    borderDark: '#4d7c0f',
    className: 'notebook-lime'
  },
  {
    name: 'amber',
    bgLight: '#f59e0b',
    bgDark: '#d97706',
    text: '#ffffff',
    borderLight: '#d97706',
    borderDark: '#b45309',
    className: 'notebook-amber'
  },
  {
    name: 'rose',
    bgLight: '#f43f5e',
    bgDark: '#e11d48',
    text: '#ffffff',
    borderLight: '#e11d48',
    borderDark: '#be123c',
    className: 'notebook-rose'
  },
  {
    name: 'slate',
    bgLight: '#64748b',
    bgDark: '#475569',
    text: '#ffffff',
    borderLight: '#475569',
    borderDark: '#334155',
    className: 'notebook-slate'
  },
  {
    name: 'emerald',
    bgLight: '#10b981',
    bgDark: '#059669',
    text: '#ffffff',
    borderLight: '#059669',
    borderDark: '#047857',
    className: 'notebook-emerald'
  }
];

/**
 * Get a color by its name
 * @param name - The name of the color (e.g., 'blue', 'green')
 * @returns The color object or undefined if not found
 */
export function getColorByName(name: string): NotebookColor | undefined {
  return NOTEBOOK_COLORS.find(color => color.name === name);
}

/**
 * Get the current theme-appropriate background color for a given color name
 * @param colorName - The name of the color
 * @param isDarkMode - Whether dark mode is active
 * @returns The background color hex code
 */
export function getBackgroundColor(colorName: string, isDarkMode: boolean = false): string {
  const color = getColorByName(colorName);
  if (!color) {
    // Default to blue if color not found
    return isDarkMode ? '#6366f1' : '#4d4dff';
  }
  return isDarkMode ? color.bgDark : color.bgLight;
}

/**
 * Get the text color for a given color name
 * @param colorName - The name of the color
 * @returns The text color hex code
 */
export function getTextColor(colorName: string): string {
  const color = getColorByName(colorName);
  return color?.text || '#ffffff';
}

/**
 * Get a random color from the available palette
 * @returns A random color object
 */
export function getRandomColor(): NotebookColor {
  const randomIndex = Math.floor(Math.random() * NOTEBOOK_COLORS.length);
  return NOTEBOOK_COLORS[randomIndex];
}

/**
 * Get the default color (blue)
 * @returns The default blue color object
 */
export function getDefaultColor(): NotebookColor {
  return NOTEBOOK_COLORS[0]; // Blue is the first color and our default
}

/**
 * Assign a random color to existing notebooks without colors
 * @param existingColor - The current color of the notebook
 * @returns A color object (either the existing color mapped to a color object, or a random new one)
 */
export function assignColorToNotebook(existingColor?: string): NotebookColor {
  if (existingColor) {
    // Try to find a matching color by checking against any of the hex values
    const matchedColor = NOTEBOOK_COLORS.find(
      color =>
        color.bgLight === existingColor ||
        color.bgDark === existingColor ||
        color.borderLight === existingColor ||
        color.borderDark === existingColor
    );

    if (matchedColor) {
      return matchedColor;
    }
  }

  // If no match or no existing color, return a random color
  return getRandomColor();
}

/**
 * Check if a given hex color is dark
 * @param hexColor - The hex color code
 * @returns True if the color is considered dark
 */
export function isDarkColor(hexColor: string): boolean {
  // Remove the # if present
  const color = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return true if luminance is less than 0.5 (considered dark)
  return luminance < 0.5;
}

/**
 * Get the appropriate text color for a given background color
 * @param backgroundColor - The background color hex code
 * @returns Either '#ffffff' (white) or '#212126' (dark) based on contrast
 */
export function getContrastingTextColor(backgroundColor: string): string {
  return isDarkColor(backgroundColor) ? '#ffffff' : '#212126';
}

/**
 * Convert a color name to CSS class name
 * @param colorName - The name of the color
 * @returns The CSS class name for styling
 */
export function getColorClassName(colorName: string): string {
  const color = getColorByName(colorName);
  return color?.className || 'notebook-blue';
}

/**
 * Get all available colors for a color picker UI
 * @returns Array of all available colors
 */
export function getAvailableColors(): NotebookColor[] {
  return [...NOTEBOOK_COLORS];
}

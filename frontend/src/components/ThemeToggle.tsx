import { useTheme } from '../context/ThemeContext';
import { SunIcon, MoonIcon } from './Icons';

export const ThemeToggle = () => {
    // `theme` is correctly inferred as 'light' | 'dark'
    // `toggleTheme` is correctly inferred as () => void
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:bg-muted"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                <MoonIcon className="w-6 h-6" />
            ) : (
                <SunIcon className="w-6 h-6" />
            )}
        </button>
    );
};
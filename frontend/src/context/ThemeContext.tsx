// src/context/ThemeContext.tsx

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Define the shape of the theme
type Theme = 'light' | 'dark';

// Define the shape of our context's value
interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

// Create the context with an initial value of `undefined`
// We will check for this in the custom hook to ensure it's used within a provider
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Define the props for our provider component
interface ThemeProviderProps {
    children: ReactNode;
}

// Create the provider component
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const [theme, setTheme] = useState<Theme>(() => {
        // 1. Check for a saved theme in localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
            return savedTheme;
        }
        // 2. If no saved theme, check for the user's OS preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Create a custom hook for easy consumption of the context
export const useTheme = () => {
    const context = useContext(ThemeContext);
    // This check ensures the hook is used within a ThemeProvider
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
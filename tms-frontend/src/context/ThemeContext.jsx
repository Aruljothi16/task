import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const { user } = useAuth();

    // Default theme settings
    const defaultTheme = {
        mode: 'light', // light, dark
        color: 'blue'  // blue, purple, green, orange
    };

    const [currentTheme, setCurrentTheme] = useState(defaultTheme);

    // Determine the scope based on user role (admin, manager, member)
    // This ensures settings are isolated per panel as requested
    const scope = user?.role || 'guest';

    // Load theme from local storage when scope changes
    useEffect(() => {
        if (scope === 'guest') return;

        const savedTheme = localStorage.getItem(`theme_${scope}`);
        if (savedTheme) {
            setCurrentTheme(JSON.parse(savedTheme));
        } else {
            // Set defaults based on role if no preference saved
            if (scope === 'admin') setCurrentTheme({ mode: 'light', color: 'purple' });
            else if (scope === 'manager') setCurrentTheme({ mode: 'light', color: 'blue' });
            else setCurrentTheme({ mode: 'light', color: 'green' });
        }
    }, [scope]);

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;

        // Reset classes
        root.classList.remove('theme-light', 'theme-dark');
        root.classList.remove('color-blue', 'color-purple', 'color-green', 'color-orange');

        // Apply new classes
        root.classList.add(`theme-${currentTheme.mode}`);
        root.classList.add(`color-${currentTheme.color}`);

        // Save to storage
        if (scope !== 'guest') {
            localStorage.setItem(`theme_${scope}`, JSON.stringify(currentTheme));
        }

    }, [currentTheme, scope]);

    const toggleMode = () => {
        setCurrentTheme(prev => ({
            ...prev,
            mode: prev.mode === 'light' ? 'dark' : 'light'
        }));
    };

    const changeColor = (color) => {
        setCurrentTheme(prev => ({
            ...prev,
            color
        }));
    };

    const value = {
        theme: currentTheme,
        toggleMode,
        changeColor
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

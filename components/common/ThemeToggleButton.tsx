"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

const ThemeToggleButton = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
      aria-label="Toggle Dark Mode"
    >
      {isDark ? 'Light' : 'Dark'} Mode
    </button>
  );
};

export default ThemeToggleButton;

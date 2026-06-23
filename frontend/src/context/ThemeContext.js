import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_THEME, DARK_THEME } from '../constants/colors';

const ThemeContext = createContext({
  theme: LIGHT_THEME,
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@pune_metro_theme');
        if (savedTheme) {
          setThemeMode(savedTheme);
        } else {
          setThemeMode(systemScheme || 'light');
        }
      } catch (e) {
        console.error('Error loading theme', e);
        setThemeMode(systemScheme || 'light');
      }
    };
    loadTheme();
  }, [systemScheme]);

  const toggleTheme = async () => {
    try {
      const nextTheme = themeMode === 'light' ? 'dark' : 'light';
      setThemeMode(nextTheme);
      await AsyncStorage.setItem('@pune_metro_theme', nextTheme);
    } catch (e) {
      console.error('Error saving theme', e);
    }
  };

  const theme = themeMode === 'light' ? LIGHT_THEME : DARK_THEME;
  const isDark = themeMode === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;

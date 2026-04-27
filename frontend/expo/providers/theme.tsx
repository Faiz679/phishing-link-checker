import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useColorScheme } from "react-native";

type Theme = "light" | "dark";

interface ThemeContext {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = "@linkguard_theme";

export const [ThemeProvider, useTheme] = createContextHook<ThemeContext>(() => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>("light");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === "dark" || stored === "light") {
        setThemeState(stored);
      } else if (systemColorScheme) {
        setThemeState(systemColorScheme);
      }
      setIsLoaded(true);
    });
  }, [systemColorScheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return {
    theme,
    isDark: theme === "dark",
    setTheme,
    toggleTheme,
  };
});

import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    loadTheme();
  }, []);

  async function loadTheme() {
    const saved = await SecureStore.getItemAsync("theme");
    if (saved === "dark") setTheme("dark");
  }

  async function toggleTheme() {
    const newTheme = theme === "light" ? "dark" : "light";
    console.log("toggleTheme called, switching to:", newTheme);
    setTheme(newTheme);
    await SecureStore.setItemAsync("theme", newTheme);
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

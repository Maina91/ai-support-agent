import { Moon, Sun } from "lucide-react";
import { Button } from "../ui/button";

export function ThemeToggle() {
  const isDark = document.documentElement.classList.contains("dark");

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem(
      "theme",
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );
  };

  return (
    <Button
      onClick={toggleTheme}
      size="icon"
      variant="ghost"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}

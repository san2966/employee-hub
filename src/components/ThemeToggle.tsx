import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

const ThemeToggle = ({ showLabel = false }: { showLabel?: boolean }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size={showLabel ? "sm" : "icon"}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light Mode" : "Dark Mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {showLabel && <span className="ml-2">{isDark ? "Light Mode" : "Dark Mode"}</span>}
    </Button>
  );
};

export default ThemeToggle;

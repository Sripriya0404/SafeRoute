import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ theme, onToggle }: { theme: "light" | "dark"; onToggle: () => void }) {
  return <Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} data-testid="theme-toggle-button">
    {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
  </Button>;
}
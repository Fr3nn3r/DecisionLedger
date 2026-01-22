import { useState, useRef, useEffect } from 'react';
import { useSpacemanTheme } from '@space-man/react-theme-animation';
import { Palette, Sun, Moon, Monitor, Check } from 'lucide-react';

const colorThemes = [
  { id: 'northern-lights', label: 'Northern Lights' },
  { id: 'default', label: 'Default' },
  { id: 'pink', label: 'Pink' },
];

const modes = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

export function ThemePopover() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { theme, colorTheme, switchThemeFromElement, setColorTheme } = useSpacemanTheme();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModeChange = (mode: string, e: React.MouseEvent) => {
    switchThemeFromElement(mode, e.currentTarget);
    setIsOpen(false);
  };

  const handleColorChange = (themeId: string) => {
    setColorTheme(themeId);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-md p-2 transition-colors ${
          isOpen
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        aria-label="Toggle theme"
      >
        <Palette className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border border-border bg-popover p-2 shadow-lg">
          {/* Color Themes */}
          <div className="mb-2">
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Color Theme
            </div>
            {colorThemes.map((ct) => (
              <button
                key={ct.id}
                onClick={() => handleColorChange(ct.id)}
                className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                {ct.label}
                {colorTheme === ct.id && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>

          <div className="my-2 h-px bg-border" />

          {/* Mode */}
          <div>
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Mode
            </div>
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={(e) => handleModeChange(m.id, e)}
                className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <span className="flex items-center gap-2">
                  <m.icon className="h-4 w-4" />
                  {m.label}
                </span>
                {theme === m.id && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

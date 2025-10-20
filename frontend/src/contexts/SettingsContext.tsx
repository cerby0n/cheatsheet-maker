import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
}

export interface ShortcutMap {
  newCheatsheet: KeyboardShortcut;
  newBlock: KeyboardShortcut;
  save: KeyboardShortcut;
  search: KeyboardShortcut;
  help: KeyboardShortcut;
  closeModal: KeyboardShortcut;
}

export interface ThemeSettings {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface FontSettings {
  family: string;
  baseSize: number;
  headingSize: number;
  codeSize: number;
}

export interface GridSettings {
  columns: number;
  rowHeight: number;
  gap: number;
  compactMode: boolean;  // Tighter spacing
  minBlockWidth: number;  // Minimum width in columns
  minBlockHeight: number;  // Minimum height in rows
}

export interface Settings {
  theme: ThemeSettings;
  fonts: FontSettings;
  grid: GridSettings;
  shortcuts: ShortcutMap;
  customCSS: string;
}

const defaultSettings: Settings = {
  theme: {
    mode: 'light',
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
  },
  fonts: {
    family: 'Inter, system-ui, sans-serif',
    baseSize: 14,
    headingSize: 24,
    codeSize: 13,
  },
  grid: {
    columns: 12,
    rowHeight: 100,
    gap: 16,
    compactMode: false,
    minBlockWidth: 2,
    minBlockHeight: 2,
  },
  shortcuts: {
    newCheatsheet: { key: 'n', alt: true, description: 'Create new cheatsheet' },
    newBlock: { key: 'b', ctrl: true, description: 'Add new section' },
    save: { key: 's', ctrl: true, description: 'Save block (when editing)' },
    search: { key: 'k', ctrl: true, description: 'Search cheatsheets' },
    help: { key: '/', ctrl: true, description: 'Show keyboard shortcuts' },
    closeModal: { key: 'Escape', description: 'Close modal/dialog' },
  },
  customCSS: '',
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
  updateShortcut: (action: keyof ShortcutMap, shortcut: KeyboardShortcut) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = localStorage.getItem('cheatsheet-settings');
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Apply theme changes
  useEffect(() => {
    const root = document.documentElement;

    if (settings.theme.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    root.style.setProperty('--primary-color', settings.theme.primaryColor);
    root.style.setProperty('--secondary-color', settings.theme.secondaryColor);
    root.style.setProperty('--background-color', settings.theme.backgroundColor);
    root.style.setProperty('--text-color', settings.theme.textColor);

    root.style.setProperty('--font-family', settings.fonts.family);
    root.style.setProperty('--font-base-size', `${settings.fonts.baseSize}px`);
    root.style.setProperty('--font-heading-size', `${settings.fonts.headingSize}px`);
    root.style.setProperty('--font-code-size', `${settings.fonts.codeSize}px`);
  }, [settings]);

  // Apply custom CSS
  useEffect(() => {
    let styleElement = document.getElementById('custom-css');

    if (settings.customCSS) {
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'custom-css';
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = settings.customCSS;
    } else if (styleElement) {
      styleElement.remove();
    }
  }, [settings.customCSS]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('cheatsheet-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      theme: { ...prev.theme, ...(newSettings.theme || {}) },
      fonts: { ...prev.fonts, ...(newSettings.fonts || {}) },
      grid: { ...prev.grid, ...(newSettings.grid || {}) },
      shortcuts: { ...prev.shortcuts, ...(newSettings.shortcuts || {}) },
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const updateShortcut = (action: keyof ShortcutMap, shortcut: KeyboardShortcut) => {
    setSettings(prev => ({
      ...prev,
      shortcuts: {
        ...prev.shortcuts,
        [action]: shortcut,
      },
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, updateShortcut }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

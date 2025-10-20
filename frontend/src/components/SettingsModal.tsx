import { useState } from 'react';
import { X, Palette, Type, Grid, Keyboard, Code } from 'lucide-react';
import { useSettings, KeyboardShortcut, ShortcutMap } from '../contexts/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetSettings, updateShortcut } = useSettings();
  const [activeTab, setActiveTab] = useState<'theme' | 'fonts' | 'grid' | 'shortcuts' | 'advanced'>('theme');
  const [editingShortcut, setEditingShortcut] = useState<keyof ShortcutMap | null>(null);

  if (!isOpen) return null;

  const tabs = [
    { id: 'theme' as const, label: 'Theme', icon: Palette },
    { id: 'fonts' as const, label: 'Fonts', icon: Type },
    { id: 'grid' as const, label: 'Grid', icon: Grid },
    { id: 'shortcuts' as const, label: 'Shortcuts', icon: Keyboard },
    { id: 'advanced' as const, label: 'Advanced', icon: Code },
  ];

  const handleShortcutCapture = (action: keyof ShortcutMap, e: React.KeyboardEvent) => {
    e.preventDefault();

    if (e.key === 'Escape') {
      setEditingShortcut(null);
      return;
    }

    // Don't capture if only modifier keys are pressed
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      return;
    }

    const shortcut: KeyboardShortcut = {
      key: e.key,
      ctrl: e.ctrlKey || e.metaKey,
      shift: e.shiftKey,
      alt: e.altKey,
      description: settings.shortcuts[action].description,
    };

    updateShortcut(action, shortcut);
    setEditingShortcut(null);
  };

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const parts = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    parts.push(shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r dark:border-gray-700 p-4 space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'theme' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Theme Settings</h3>

                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dark Mode
                  </label>
                  <button
                    onClick={() => updateSettings({
                      theme: { ...settings.theme, mode: settings.theme.mode === 'light' ? 'dark' : 'light' }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.theme.mode === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.theme.mode === 'dark' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Color Pickers */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Primary Color
                    </label>
                    <input
                      type="color"
                      value={settings.theme.primaryColor}
                      onChange={(e) => updateSettings({
                        theme: { ...settings.theme, primaryColor: e.target.value }
                      })}
                      className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Secondary Color
                    </label>
                    <input
                      type="color"
                      value={settings.theme.secondaryColor}
                      onChange={(e) => updateSettings({
                        theme: { ...settings.theme, secondaryColor: e.target.value }
                      })}
                      className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'fonts' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Font Settings</h3>

                {/* Font Family */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Font Family
                  </label>
                  <select
                    value={settings.fonts.family}
                    onChange={(e) => updateSettings({
                      fonts: { ...settings.fonts, family: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Inter, system-ui, sans-serif">Inter (Default)</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="'Segoe UI', sans-serif">Segoe UI</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="'Open Sans', sans-serif">Open Sans</option>
                    <option value="'Fira Code', monospace">Fira Code (Mono)</option>
                    <option value="Georgia, serif">Georgia (Serif)</option>
                  </select>
                </div>

                {/* Font Sizes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Base Font Size: {settings.fonts.baseSize}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="20"
                    value={settings.fonts.baseSize}
                    onChange={(e) => updateSettings({
                      fonts: { ...settings.fonts, baseSize: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Heading Font Size: {settings.fonts.headingSize}px
                  </label>
                  <input
                    type="range"
                    min="18"
                    max="36"
                    value={settings.fonts.headingSize}
                    onChange={(e) => updateSettings({
                      fonts: { ...settings.fonts, headingSize: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Code Font Size: {settings.fonts.codeSize}px
                  </label>
                  <input
                    type="range"
                    min="11"
                    max="18"
                    value={settings.fonts.codeSize}
                    onChange={(e) => updateSettings({
                      fonts: { ...settings.fonts, codeSize: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {activeTab === 'grid' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Grid Settings</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Columns: {settings.grid.columns}
                  </label>
                  <input
                    type="range"
                    min="6"
                    max="24"
                    value={settings.grid.columns}
                    onChange={(e) => updateSettings({
                      grid: { ...settings.grid, columns: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Row Height: {settings.grid.rowHeight}px
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={settings.grid.rowHeight}
                    onChange={(e) => updateSettings({
                      grid: { ...settings.grid, rowHeight: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gap: {settings.grid.gap}px
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="32"
                    step="2"
                    value={settings.grid.gap}
                    onChange={(e) => updateSettings({
                      grid: { ...settings.grid, gap: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Advanced Grid Controls</h4>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Compact Mode
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reduce spacing for tighter layouts</p>
                      </div>
                      <button
                        onClick={() => updateSettings({
                          grid: { ...settings.grid, compactMode: !settings.grid.compactMode }
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.grid.compactMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.grid.compactMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Min Block Width: {settings.grid.minBlockWidth} columns
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="6"
                        value={settings.grid.minBlockWidth}
                        onChange={(e) => updateSettings({
                          grid: { ...settings.grid, minBlockWidth: Number(e.target.value) }
                        })}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum width blocks can be resized to</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Min Block Height: {settings.grid.minBlockHeight} rows
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="6"
                        value={settings.grid.minBlockHeight}
                        onChange={(e) => updateSettings({
                          grid: { ...settings.grid, minBlockHeight: Number(e.target.value) }
                        })}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum height blocks can be resized to</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click on a shortcut to change it. Press the new key combination you want to use.
                </p>

                <div className="space-y-2">
                  {(Object.keys(settings.shortcuts) as Array<keyof ShortcutMap>).map(action => (
                    <div key={action} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {settings.shortcuts[action].description}
                      </span>
                      {editingShortcut === action ? (
                        <input
                          autoFocus
                          type="text"
                          placeholder="Press key combination..."
                          onKeyDown={(e) => handleShortcutCapture(action, e)}
                          onBlur={() => setEditingShortcut(null)}
                          className="px-3 py-1 text-sm border border-blue-500 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingShortcut(action)}
                          className="px-3 py-1 text-sm font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:border-blue-500 transition-colors"
                        >
                          {formatShortcut(settings.shortcuts[action])}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Settings</h3>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Custom CSS
                    </label>
                    <button
                      onClick={() => {
                        const nordTheme = `/* Nord Theme - https://www.nordtheme.com/ */
:root {
  --nord0: #2e3440;
  --nord1: #3b4252;
  --nord2: #434c5e;
  --nord3: #4c566a;
  --nord4: #d8dee9;
  --nord5: #e5e9f0;
  --nord6: #eceff4;
  --nord7: #8fbcbb;
  --nord8: #88c0d0;
  --nord9: #81a1c1;
  --nord10: #5e81ac;
  --nord11: #bf616a;
  --nord12: #d08770;
  --nord13: #ebcb8b;
  --nord14: #a3be8c;
  --nord15: #b48ead;
}

/* Nord background and text colors */
body {
  background-color: var(--nord0) !important;
  color: var(--nord4) !important;
}

/* Headers and Sidebar */
header {
  background-color: var(--nord1) !important;
  border-color: var(--nord3) !important;
  color: var(--nord4) !important;
}

.bg-gray-900 {
  background-color: var(--nord0) !important;
}

/* Buttons */
button {
  color: var(--nord4) !important;
}

button:hover {
  background-color: var(--nord2) !important;
}

.bg-blue-600 {
  background-color: var(--nord10) !important;
}

.bg-blue-600:hover {
  background-color: var(--nord9) !important;
}

/* Blocks and Cards */
.bg-white {
  background-color: var(--nord1) !important;
  color: var(--nord4) !important;
}

.border-gray-200, .border-gray-300 {
  border-color: var(--nord3) !important;
}

/* Code blocks */
.bg-gray-900 code {
  background-color: var(--nord0) !important;
}

/* Inputs */
input, textarea, select {
  background-color: var(--nord2) !important;
  border-color: var(--nord3) !important;
  color: var(--nord4) !important;
}

input:focus, textarea:focus, select:focus {
  border-color: var(--nord9) !important;
  ring-color: var(--nord9) !important;
}

/* Links and accents */
a {
  color: var(--nord8) !important;
}

.text-blue-600 {
  color: var(--nord9) !important;
}

.text-green-600 {
  color: var(--nord14) !important;
}

.text-red-600 {
  color: var(--nord11) !important;
}

.text-orange-700 {
  color: var(--nord12) !important;
}`;
                        updateSettings({ customCSS: nordTheme });
                      }}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Load Nord Theme
                    </button>
                  </div>
                  <textarea
                    value={settings.customCSS}
                    onChange={(e) => updateSettings({ customCSS: e.target.value })}
                    placeholder="/* Add your custom CSS here */&#10;/* Click 'Load Nord Theme' above for an example */"
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Advanced users can add custom CSS here to override default styles.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t dark:border-gray-700">
          <button
            onClick={resetSettings}
            className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

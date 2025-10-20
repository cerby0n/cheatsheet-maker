import { useState, useEffect } from 'react';
import { Cheatsheet } from './types';
import { cheatsheetApi } from './api';
import CheatsheetSelector from './components/CheatsheetSelector';
import Editor from './components/Editor';
import SearchModal from './components/SearchModal';
import SettingsModal from './components/SettingsModal';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import { useSettings } from './contexts/SettingsContext';
import { Plus, Edit3, Eye, Search, Download, Upload, Settings as SettingsIcon, Keyboard } from 'lucide-react';

function App() {
  const { settings } = useSettings();
  const [cheatsheets, setCheatsheets] = useState<Cheatsheet[]>([]);
  const [selectedCheatsheet, setSelectedCheatsheet] = useState<Cheatsheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  // Edit mode state with localStorage persistence
  const [isEditMode, setIsEditMode] = useState(() => {
    const saved = localStorage.getItem('cheatsheet-edit-mode');
    return saved !== null ? saved === 'true' : true;
  });

  // Save edit mode to localStorage
  useEffect(() => {
    localStorage.setItem('cheatsheet-edit-mode', String(isEditMode));
  }, [isEditMode]);

  // Save selected cheatsheet ID to localStorage
  useEffect(() => {
    if (selectedCheatsheet) {
      localStorage.setItem('selected-cheatsheet-id', selectedCheatsheet.id);
    }
  }, [selectedCheatsheet]);

  // Load cheatsheets on mount
  useEffect(() => {
    loadCheatsheets();
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea (unless it's Escape)
      const target = e.target as HTMLElement;
      if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && e.key !== 'Escape') {
        return;
      }

      const matchesShortcut = (shortcut: typeof settings.shortcuts[keyof typeof settings.shortcuts]) => {
        return (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!e.ctrlKey === !!shortcut.ctrl &&
          !!e.shiftKey === !!shortcut.shift &&
          !!e.altKey === !!shortcut.alt
        );
      };

      // New Cheatsheet
      if (matchesShortcut(settings.shortcuts.newCheatsheet)) {
        e.preventDefault();
        handleCreateCheatsheet();
      }

      // New Block
      if (matchesShortcut(settings.shortcuts.newBlock)) {
        e.preventDefault();
        if (selectedCheatsheet && isEditMode) {
          handleAddSection();
        }
      }

      // Save - handled by individual block components
      // Ctrl+S will trigger save within block editors

      // Search
      if (matchesShortcut(settings.shortcuts.search)) {
        e.preventDefault();
        setSearchOpen(true);
      }

      // Help
      if (matchesShortcut(settings.shortcuts.help)) {
        e.preventDefault();
        setShortcutsHelpOpen(true);
      }

      // Close Modal
      if (matchesShortcut(settings.shortcuts.closeModal)) {
        e.preventDefault();
        if (searchOpen) setSearchOpen(false);
        if (settingsOpen) setSettingsOpen(false);
        if (shortcutsHelpOpen) setShortcutsHelpOpen(false);
        if (importMenuOpen) setImportMenuOpen(false);
        if (exportMenuOpen) setExportMenuOpen(false);
      }

      // Ctrl+E or Cmd+E - Enter Edit Mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (selectedCheatsheet) {
          setIsEditMode(true);
        }
      }

      // Ctrl+R or Cmd+R - Enter Reader Mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (selectedCheatsheet) {
          setIsEditMode(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCheatsheet, isEditMode, settings.shortcuts, searchOpen, settingsOpen, shortcutsHelpOpen, importMenuOpen, exportMenuOpen]);

  const loadCheatsheets = async () => {
    try {
      setLoading(true);
      const data = await cheatsheetApi.getAll();

      // Apply saved order from localStorage
      const savedOrder = localStorage.getItem('cheatsheets-order');
      if (savedOrder) {
        try {
          const orderIds = JSON.parse(savedOrder) as string[];
          const orderedData = [...data].sort((a, b) => {
            const indexA = orderIds.indexOf(a.id);
            const indexB = orderIds.indexOf(b.id);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
          setCheatsheets(orderedData);
        } catch {
          setCheatsheets(data);
        }
      } else {
        setCheatsheets(data);
      }

      // Try to restore previously selected cheatsheet
      const savedId = localStorage.getItem('selected-cheatsheet-id');
      if (savedId && data.length > 0) {
        const saved = data.find(cs => cs.id === savedId);
        setSelectedCheatsheet(saved || data[0]);
      } else if (data.length > 0 && !selectedCheatsheet) {
        setSelectedCheatsheet(data[0]);
      }
    } catch (err) {
      setError('Failed to load cheatsheets. Make sure the backend is running.');
      console.error('Error loading cheatsheets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCheatsheet = async () => {
    try {
      const newName = `Cheatsheet ${cheatsheets.length + 1}`;
      const newCheatsheet = await cheatsheetApi.create({ name: newName });
      setCheatsheets([...cheatsheets, newCheatsheet]);
      setSelectedCheatsheet(newCheatsheet);
    } catch (err) {
      console.error('Error creating cheatsheet:', err);
      setError('Failed to create cheatsheet');
    }
  };

  const handleDeleteCheatsheet = async (id: string) => {
    try {
      await cheatsheetApi.delete(id);
      const updatedCheatsheets = cheatsheets.filter(cs => cs.id !== id);
      setCheatsheets(updatedCheatsheets);

      if (selectedCheatsheet?.id === id) {
        const newSelected = updatedCheatsheets[0] || null;
        setSelectedCheatsheet(newSelected);
        // Update localStorage
        if (newSelected) {
          localStorage.setItem('selected-cheatsheet-id', newSelected.id);
        } else {
          localStorage.removeItem('selected-cheatsheet-id');
        }
      }
    } catch (err) {
      console.error('Error deleting cheatsheet:', err);
      setError('Failed to delete cheatsheet');
    }
  };

  const handleRenameCheatsheet = async (id: string, newName: string) => {
    try {
      const updated = await cheatsheetApi.update(id, { name: newName });
      setCheatsheets(cheatsheets.map(cs => cs.id === id ? updated : cs));
      if (selectedCheatsheet?.id === id) {
        setSelectedCheatsheet(updated);
      }
    } catch (err) {
      console.error('Error renaming cheatsheet:', err);
      setError('Failed to rename cheatsheet');
    }
  };

  const handleUpdateCheatsheet = async (updated: Cheatsheet) => {
    try {
      const result = await cheatsheetApi.update(updated.id, {
        sections: updated.sections
      });
      setCheatsheets(cheatsheets.map(cs => cs.id === updated.id ? result : cs));
      setSelectedCheatsheet(result);
    } catch (err) {
      console.error('Error updating cheatsheet:', err);
      setError('Failed to update cheatsheet');
    }
  };

  const handleAddSection = () => {
    if (!selectedCheatsheet) return;

    const newSection = {
      id: `section_${Date.now()}`,
      title: `Section ${selectedCheatsheet.sections.length + 1}`,
      blocks: [],
    };

    const updated = {
      ...selectedCheatsheet,
      sections: [...selectedCheatsheet.sections, newSection],
    };

    handleUpdateCheatsheet(updated);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await cheatsheetApi.search(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    }
  };

  const handleExportMarkdown = () => {
    if (!selectedCheatsheet) return;
    cheatsheetApi.exportMarkdown(selectedCheatsheet.id);
    setExportMenuOpen(false);
  };

  const handleExportJson = () => {
    if (!selectedCheatsheet) return;
    cheatsheetApi.exportJson(selectedCheatsheet.id);
    setExportMenuOpen(false);
  };

  const handleExportAllJson = () => {
    cheatsheetApi.exportAllJson();
    setExportMenuOpen(false);
  };

  const handleImportJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const file = files[0];
      const text = await file.text();
      const jsonData = JSON.parse(text);

      const imported = await cheatsheetApi.importJson(jsonData);
      await loadCheatsheets();
      setSelectedCheatsheet(imported);
      setImportMenuOpen(false);
      setError(null);
    } catch (err) {
      console.error('Import error:', err);
      setError('Failed to import JSON file. Please check the file format.');
    }

    // Reset input
    event.target.value = '';
  };

  const handleImportMarkdown = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const file = files[0];
      const content = await file.text();
      const name = file.name.replace(/\.md$/, '');

      const imported = await cheatsheetApi.importMarkdown(content, name);
      await loadCheatsheets();
      setSelectedCheatsheet(imported);
      setImportMenuOpen(false);
      setError(null);
    } catch (err) {
      console.error('Import error:', err);
      setError('Failed to import Markdown file.');
    }

    // Reset input
    event.target.value = '';
  };

  const handleImportBulk = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const filePromises = Array.from(files).map(file => file.text().then(text => JSON.parse(text)));
      const jsonDataArray = await Promise.all(filePromises);

      const results = await cheatsheetApi.importBulk(jsonDataArray);
      await loadCheatsheets();
      setImportMenuOpen(false);

      if (results.failed.length > 0) {
        setError(`Imported ${results.success.length} files. ${results.failed.length} failed.`);
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Bulk import error:', err);
      setError('Failed to import files.');
    }

    // Reset input
    event.target.value = '';
  };

  const handleSearchResultClick = (cheatsheetId: string) => {
    const cs = cheatsheets.find(c => c.id === cheatsheetId);
    if (cs) {
      setSelectedCheatsheet(cs);
      setSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden w-full">
      {/* Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchQueryChange={handleSearch}
        searchResults={searchResults}
        onResultClick={handleSearchResultClick}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsModal
        isOpen={shortcutsHelpOpen}
        onClose={() => setShortcutsHelpOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Cheatsheet Selector */}
            <CheatsheetSelector
              cheatsheets={cheatsheets}
              selectedCheatsheet={selectedCheatsheet}
              onSelectCheatsheet={setSelectedCheatsheet}
              onCreateCheatsheet={handleCreateCheatsheet}
              onDeleteCheatsheet={handleDeleteCheatsheet}
              onRenameCheatsheet={handleRenameCheatsheet}
            />
          </div>

          {/* Controls - always visible */}
          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-800 dark:text-gray-200"
              title="Search"
            >
              <Search size={20} />
            </button>

            {/* Import button with dropdown */}
            <div className="relative">
              <button
                onClick={() => setImportMenuOpen(!importMenuOpen)}
                className="flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-800 dark:text-gray-200"
                title="Import"
              >
                <Download size={20} />
              </button>

              {importMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setImportMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20 min-w-[200px]">
                    <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors text-gray-800 dark:text-gray-200">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportJson}
                        className="hidden"
                      />
                      <span className="text-sm">Import JSON</span>
                    </label>
                    <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors text-gray-800 dark:text-gray-200">
                      <input
                        type="file"
                        accept=".md,.markdown"
                        onChange={handleImportMarkdown}
                        className="hidden"
                      />
                      <span className="text-sm">Import Markdown</span>
                    </label>
                    <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors text-gray-800 dark:text-gray-200">
                      <input
                        type="file"
                        accept=".json"
                        multiple
                        onChange={handleImportBulk}
                        className="hidden"
                      />
                      <span className="text-sm">Bulk Import (JSON)</span>
                    </label>
                  </div>
                </>
              )}
            </div>

            {selectedCheatsheet && (
              <>
                {/* Export button with dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setExportMenuOpen(!exportMenuOpen)}
                    className="flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-800 dark:text-gray-200"
                    title="Export"
                  >
                    <Upload size={20} />
                  </button>

                  {exportMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setExportMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20 min-w-[200px]">
                        <button
                          onClick={handleExportMarkdown}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-800 dark:text-gray-200"
                        >
                          Export as Markdown
                        </button>
                        <button
                          onClick={handleExportJson}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-800 dark:text-gray-200"
                        >
                          Export as JSON
                        </button>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                        <button
                          onClick={handleExportAllJson}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-800 dark:text-gray-200"
                        >
                          Export All as JSON
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Add Section button */}
                {isEditMode && (
                  <button
                    onClick={handleAddSection}
                    className="flex items-center justify-center p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    title="Add Section"
                  >
                    <Plus size={20} />
                  </button>
                )}

                {/* Edit/Reader toggle */}
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`flex items-center justify-center p-2 rounded-lg transition-colors shadow-sm ${
                    isEditMode
                      ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800'
                      : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                  }`}
                  title={isEditMode ? 'Switch to Reader Mode' : 'Switch to Edit Mode'}
                >
                  {isEditMode ? <Eye size={20} /> : <Edit3 size={20} />}
                </button>
              </>
            )}

            {/* Help button */}
            <button
              onClick={() => setShortcutsHelpOpen(true)}
              className="flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-800 dark:text-gray-200"
              title="Keyboard Shortcuts"
            >
              <Keyboard size={20} />
            </button>

            {/* Settings button */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-800 dark:text-gray-200"
              title="Settings"
            >
              <SettingsIcon size={20} />
            </button>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mx-4 mt-4">
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-sm text-red-600 dark:text-red-400 underline mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Editor */}
        <main className="flex-1 overflow-hidden">
          {selectedCheatsheet ? (
            <Editor
              cheatsheet={selectedCheatsheet}
              onUpdate={handleUpdateCheatsheet}
              isEditMode={isEditMode}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                  No cheatsheet selected
                </p>
                <button
                  onClick={handleCreateCheatsheet}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Create Your First Cheatsheet
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

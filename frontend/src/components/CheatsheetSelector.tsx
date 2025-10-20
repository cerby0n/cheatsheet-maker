import { useState, useRef, useEffect } from 'react';
import { Cheatsheet } from '../types';
import { ChevronDown, Plus, Edit2, Trash2, Check, X, FileText } from 'lucide-react';

interface CheatsheetSelectorProps {
  cheatsheets: Cheatsheet[];
  selectedCheatsheet: Cheatsheet | null;
  onSelectCheatsheet: (cheatsheet: Cheatsheet) => void;
  onCreateCheatsheet: () => void;
  onDeleteCheatsheet: (id: string) => void;
  onRenameCheatsheet: (id: string, newName: string) => void;
}

export default function CheatsheetSelector({
  cheatsheets,
  selectedCheatsheet,
  onSelectCheatsheet,
  onCreateCheatsheet,
  onDeleteCheatsheet,
  onRenameCheatsheet,
}: CheatsheetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setEditingId(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleStartEdit = (cheatsheet: Cheatsheet, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(cheatsheet.id);
    setEditName(cheatsheet.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      onRenameCheatsheet(editingId, editName.trim());
      setEditingId(null);
      setEditName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this cheatsheet?')) {
      onDeleteCheatsheet(id);
    }
  };

  const handleSelect = (cheatsheet: Cheatsheet) => {
    if (editingId !== cheatsheet.id) {
      onSelectCheatsheet(cheatsheet);
      setIsOpen(false);
    }
  };

  const handleCreateNew = () => {
    onCreateCheatsheet();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-800 dark:text-gray-200 min-w-[200px] max-w-[300px]"
      >
        <FileText size={18} />
        <span className="flex-1 text-left truncate">
          {selectedCheatsheet?.name || 'Select Cheatsheet'}
        </span>
        <ChevronDown
          size={18}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-[500px] overflow-y-auto">
          {/* Create New Button */}
          <button
            onClick={handleCreateNew}
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 border-b border-gray-200 dark:border-gray-700 transition-colors text-blue-600 dark:text-blue-400 font-medium"
          >
            <Plus size={18} />
            <span>Create New Cheatsheet</span>
          </button>

          {/* Cheatsheets List */}
          <div className="py-2">
            {cheatsheets.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                No cheatsheets yet. Create your first one!
              </div>
            ) : (
              cheatsheets.map((cheatsheet) => (
                <div
                  key={cheatsheet.id}
                  onClick={() => handleSelect(cheatsheet)}
                  className={`group px-4 py-3 flex items-center gap-2 cursor-pointer transition-colors ${
                    selectedCheatsheet?.id === cheatsheet.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent'
                  }`}
                >
                  {editingId === cheatsheet.id ? (
                    // Edit Mode
                    <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                        title="Save"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Cancel"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <FileText
                        size={18}
                        className={
                          selectedCheatsheet?.id === cheatsheet.id
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }
                      />
                      <span
                        className={`flex-1 truncate ${
                          selectedCheatsheet?.id === cheatsheet.id
                            ? 'font-medium text-blue-600 dark:text-blue-400'
                            : 'text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {cheatsheet.name}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleStartEdit(cheatsheet, e)}
                          className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Rename"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(cheatsheet.id, e)}
                          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Info */}
          {cheatsheets.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              {cheatsheets.length} cheatsheet{cheatsheets.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

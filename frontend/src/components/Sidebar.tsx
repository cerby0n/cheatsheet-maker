import { useState } from 'react';
import { Cheatsheet } from '../types';
import { Plus, Edit2, Trash2, Check, X, GripVertical } from 'lucide-react';

interface SidebarProps {
  cheatsheets: Cheatsheet[];
  selectedCheatsheet: Cheatsheet | null;
  onSelectCheatsheet: (cheatsheet: Cheatsheet) => void;
  onCreateCheatsheet: () => void;
  onDeleteCheatsheet: (id: string) => void;
  onRenameCheatsheet: (id: string, newName: string) => void;
  onReorderCheatsheets: (reorderedCheatsheets: Cheatsheet[]) => void;
}

export default function Sidebar({
  cheatsheets,
  selectedCheatsheet,
  onSelectCheatsheet,
  onCreateCheatsheet,
  onDeleteCheatsheet,
  onRenameCheatsheet,
  onReorderCheatsheets,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleStartEdit = (cheatsheet: Cheatsheet) => {
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...cheatsheets];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, draggedItem);

    onReorderCheatsheets(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="h-full bg-gray-800 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gray-900 flex items-center justify-between">
        <h2 className="text-lg font-bold">Cheatsheets</h2>
        <button
          onClick={onCreateCheatsheet}
          className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
          title="Create new cheatsheet"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Cheatsheet List */}
      <div className="flex-1 overflow-y-auto">
        {cheatsheets.length === 0 ? (
          <div className="p-4 text-gray-400 text-sm text-center">
            No cheatsheets yet. Click + to create one.
          </div>
        ) : (
          <div className="p-2">
            {cheatsheets.map((cheatsheet, index) => (
              <div
                key={cheatsheet.id}
                draggable={editingId !== cheatsheet.id}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`mb-2 rounded-lg transition-all ${
                  selectedCheatsheet?.id === cheatsheet.id
                    ? 'bg-gray-700'
                    : 'bg-gray-800 hover:bg-gray-750'
                } ${draggedIndex === index ? 'opacity-50' : ''} ${
                  dragOverIndex === index && draggedIndex !== index
                    ? 'border-2 border-blue-500'
                    : ''
                }`}
              >
                {editingId === cheatsheet.id ? (
                  <div className="p-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 px-2 py-1 bg-gray-900 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 hover:bg-gray-600 rounded transition-colors"
                      title="Save"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 hover:bg-gray-600 rounded transition-colors"
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div
                      className="p-2 cursor-move text-gray-500 hover:text-gray-300"
                      title="Drag to reorder"
                    >
                      <GripVertical size={16} />
                    </div>
                    <div
                      className="flex-1 p-3 flex items-center justify-between cursor-pointer"
                      onClick={() => onSelectCheatsheet(cheatsheet)}
                    >
                      <span className="flex-1 truncate">{cheatsheet.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(cheatsheet);
                          }}
                          className="p-1 hover:bg-gray-600 rounded transition-colors"
                          title="Rename"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                `Delete "${cheatsheet.name}"? This cannot be undone.`
                              )
                            ) {
                              onDeleteCheatsheet(cheatsheet.id);
                            }
                          }}
                          className="p-1 hover:bg-red-600 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

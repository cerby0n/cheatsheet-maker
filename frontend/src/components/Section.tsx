import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Section, Block, BlockType } from '../types';
import GridLayout from 'react-grid-layout';
import BlockComponent from './Block';
import { Plus, ChevronUp, ChevronDown, Trash2, Edit2, Check, X } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface SectionProps {
  section: Section;
  isFirst: boolean;
  isLast: boolean;
  isEditMode: boolean;
  onUpdate: (section: Section) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export default function SectionComponent({
  section,
  isFirst,
  isLast,
  isEditMode,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SectionProps) {
  const { settings } = useSettings();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [showBlockTypeMenu, setShowBlockTypeMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [isEditingStyle, setIsEditingStyle] = useState(false);
  const [tempColor, setTempColor] = useState(section.titleColor || '#1f2937');
  const [tempSize, setTempSize] = useState<'sm' | 'md' | 'lg' | 'xl'>(section.titleSize || 'md');

  const getTitleSizeClass = () => {
    switch (section.titleSize || 'md') {
      case 'sm': return 'text-xl';
      case 'md': return 'text-2xl';
      case 'lg': return 'text-3xl';
      case 'xl': return 'text-4xl';
      default: return 'text-2xl';
    }
  };

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showBlockTypeMenu && addButtonRef.current && !addButtonRef.current.contains(e.target as Node)) {
        const dropdown = document.querySelector('.block-type-dropdown');
        if (dropdown && !dropdown.contains(e.target as Node)) {
          setShowBlockTypeMenu(false);
        }
      }
    };

    if (showBlockTypeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBlockTypeMenu]);

  const toggleBlockTypeMenu = () => {
    if (!showBlockTypeMenu && addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      const menuHeight = 180; // Approximate dropdown height (7 items × ~26px each)
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Position above if not enough space below
      const shouldPositionAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow;

      setMenuPosition({
        top: shouldPositionAbove ? rect.top - menuHeight - 4 : rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setShowBlockTypeMenu(!showBlockTypeMenu);
  };

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      onUpdate({ ...section, title: editTitle.trim() });
      setIsEditingTitle(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(section.title);
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleAddBlock = (type: BlockType) => {
    // Find the next available position
    const maxY = section.blocks.length > 0
      ? Math.max(...section.blocks.map((b) => b.y + b.h))
      : 0;

    // Default content based on type
    let defaultContent = 'Enter content here...';
    if (type === 'code') {
      defaultContent = '// Your code here';
    } else if (type === 'checkbox') {
      defaultContent = '[ ] New item';
    }

    const newBlock: Block = {
      id: `block_${Date.now()}`,
      type,
      title: '',
      content: defaultContent,
      x: 0,
      y: maxY,
      w: 6, // Half width by default
      h: type === 'code' || type === 'table' ? 4 : 2,
      language: type === 'code' ? 'javascript' : undefined,
    };

    onUpdate({
      ...section,
      blocks: [...section.blocks, newBlock],
    });

    setShowBlockTypeMenu(false);
  };

  const handleUpdateBlock = (blockId: string, updatedBlock: Block) => {
    onUpdate({
      ...section,
      blocks: section.blocks.map((b) => (b.id === blockId ? updatedBlock : b)),
    });
  };

  const handleDeleteBlock = (blockId: string) => {
    onUpdate({
      ...section,
      blocks: section.blocks.filter((b) => b.id !== blockId),
    });
  };

  const handleLayoutChange = (layout: any[]) => {
    const updatedBlocks = section.blocks.map((block) => {
      const layoutItem = layout.find((l) => l.i === block.id);
      if (layoutItem) {
        return {
          ...block,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h,
        };
      }
      return block;
    });

    onUpdate({
      ...section,
      blocks: updatedBlocks,
    });
  };

  const blockTypes: { type: BlockType; label: string }[] = [
    { type: 'text', label: 'Text' },
    { type: 'code', label: 'Code' },
    { type: 'image', label: 'Image' },
    { type: 'table', label: 'Table' },
    { type: 'list', label: 'List' },
    { type: 'checkbox', label: 'Checklist' },
    { type: 'reference', label: 'Reference Card' },
    { type: 'calculation', label: 'Calculation' },
  ];

  return (
    <div className="mb-12 group">
      {/* Section Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          {/* Title Section */}
          {isEditMode && isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 px-4 py-2 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                title="Save"
              >
                <Check size={20} />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-2 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors"
                title="Cancel"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <h2
                className={`${getTitleSizeClass()} font-bold tracking-tight truncate`}
                style={{ color: section.titleColor || '#1f2937' }}
              >
                {section.title}
              </h2>
              {isEditMode && (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  title="Edit title"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>
          )}

          {/* Control Buttons */}
          {isEditMode && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isFirst && (
                <button
                  onClick={onMoveUp}
                  className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
                  title="Move section up"
                >
                  <ChevronUp size={20} />
                </button>
              )}
              {!isLast && (
                <button
                  onClick={onMoveDown}
                  className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
                  title="Move section down"
                >
                  <ChevronDown size={20} />
                </button>
              )}
              <button
                onClick={() => setIsEditingStyle(!isEditingStyle)}
                className={`p-1.5 rounded-lg transition-colors ${isEditingStyle ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                title="Customize title style"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
                  <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
                  <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
                  <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                </svg>
              </button>
              <div className="relative">
                <button
                  ref={addButtonRef}
                  onClick={toggleBlockTypeMenu}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Plus size={18} />
                  Add Block
                </button>

                {showBlockTypeMenu && menuPosition && createPortal(
                  <div
                    className="block-type-dropdown fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-[9999] w-32 overflow-hidden py-0.5"
                    style={{
                      top: `${menuPosition.top}px`,
                      right: `${menuPosition.right}px`
                    }}
                  >
                    {blockTypes.map(({ type, label }) => (
                      <button
                        key={type}
                        onClick={() => handleAddBlock(type)}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-xs text-gray-700 dark:text-gray-200 whitespace-nowrap"
                      >
                        {label}
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
              </div>
              <button
                onClick={onDelete}
                className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors"
                title="Delete section"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Style Customization Panel */}
        {isEditMode && isEditingStyle && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4 mb-4 shadow-sm">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700">Title Color:</label>
                <input
                  type="color"
                  value={tempColor}
                  onChange={(e) => setTempColor(e.target.value)}
                  className="w-14 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={tempColor}
                  onChange={(e) => setTempColor(e.target.value)}
                  className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-mono w-32 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="#000000"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700">Title Size:</label>
                <select
                  value={tempSize}
                  onChange={(e) => setTempSize(e.target.value as 'sm' | 'md' | 'lg' | 'xl')}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                  <option value="xl">Extra Large</option>
                </select>
              </div>
              <button
                onClick={() => {
                  onUpdate({ ...section, titleColor: tempColor, titleSize: tempSize });
                  setIsEditingStyle(false);
                }}
                className="px-5 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
              >
                Apply Style
              </button>
              <button
                onClick={() => setIsEditingStyle(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section Content */}
      <div ref={containerRef} className="group">
        {section.blocks.length === 0 ? (
          <div className="text-center py-16 text-gray-400 italic">
            No blocks yet. Click "Add Block" to create content.
          </div>
        ) : (
          <GridLayout
            className="layout"
            layout={section.blocks.map((b) => ({
              i: b.id,
              x: b.x,
              y: b.y,
              w: Math.max(b.w, settings.grid.minBlockWidth),
              h: Math.max(b.h, settings.grid.minBlockHeight),
              minW: settings.grid.minBlockWidth,
              minH: settings.grid.minBlockHeight,
              static: !isEditMode,
            }))}
            cols={settings.grid.columns}
            rowHeight={settings.grid.compactMode ? settings.grid.rowHeight * 0.8 : settings.grid.rowHeight}
            width={containerWidth}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".drag-handle"
            isDraggable={isEditMode}
            isResizable={isEditMode}
            compactType="vertical"
            margin={[settings.grid.gap, settings.grid.gap]}
            containerPadding={[0, 0]}
            preventCollision={false}
            autoSize={true}
          >
            {section.blocks.map((block) => (
              <div key={block.id}>
                <BlockComponent
                  block={block}
                  isEditMode={isEditMode}
                  onUpdate={(updated) => handleUpdateBlock(block.id, updated)}
                  onDelete={() => handleDeleteBlock(block.id)}
                />
              </div>
            ))}
          </GridLayout>
        )}
      </div>
    </div>
  );
}

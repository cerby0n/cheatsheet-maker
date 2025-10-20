import { createPortal } from 'react-dom';
import { X, FileText, Hash, Code } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface SearchResult {
  cheatsheet_id: string;
  cheatsheet_name: string;
  section_title?: string;
  block_type?: string;
  block_title?: string;
  type: 'cheatsheet' | 'section' | 'block';
  match: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchResults: SearchResult[];
  onResultClick: (cheatsheetId: string) => void;
}

export default function SearchModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  onResultClick,
}: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getTypeIcon = (type: string, blockType?: string) => {
    if (type === 'cheatsheet') return <FileText size={16} className="text-blue-500" />;
    if (type === 'section') return <Hash size={16} className="text-green-500" />;
    if (type === 'block' && blockType === 'code') return <Code size={16} className="text-purple-500" />;
    return <FileText size={16} className="text-gray-500" />;
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 flex flex-col z-10 max-h-[70vh]">
        {/* Header with Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search across all cheatsheets..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto p-4">
          {searchQuery.length < 2 ? (
            <div className="text-center text-gray-500 py-8">
              Type at least 2 characters to search
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No results found for "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => onResultClick(result.cheatsheet_id)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-1">
                      {getTypeIcon(result.type, result.block_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">
                          {result.cheatsheet_name}
                        </span>
                        {result.section_title && (
                          <>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">{result.section_title}</span>
                          </>
                        )}
                        {result.block_title && (
                          <>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-500 text-sm">{result.block_title}</span>
                          </>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 mr-2">
                          {result.type}
                          {result.block_type && ` (${result.block_type})`}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
                        {result.match}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {searchResults.length > 0 && (
          <div className="p-3 border-t border-gray-200 text-sm text-gray-500 text-center">
            Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

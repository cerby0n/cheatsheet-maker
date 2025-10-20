import { useState, useEffect } from 'react';
import { Block } from '../types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { GripVertical, Trash2, Edit2, Eye, Code, Copy, Check, Plus } from 'lucide-react';
import EditModal from './EditModal';

interface BlockProps {
  block: Block;
  isEditMode: boolean;
  onUpdate: (block: Block) => void;
  onDelete: () => void;
}

// Reference Card Row Component
function ReferenceCardRow({
  description,
  code,
  example,
  language,
  hasExample
}: {
  description: string;
  code: string;
  example?: string;
  language?: string;
  hasExample: boolean;
}) {
  const [rowCopied, setRowCopied] = useState(false);
  const [exampleCopied, setExampleCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setRowCopied(true);
      setTimeout(() => setRowCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyExample = async () => {
    if (!example) return;
    try {
      await navigator.clipboard.writeText(example);
      setExampleCopied(true);
      setTimeout(() => setExampleCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-700 align-top">{description}</td>
      <td className="px-4 py-3 align-top">
        <div
          className="flex items-start gap-2 group cursor-pointer"
          onClick={handleCopyCode}
          title="Click to copy"
        >
          <div className="flex-1 text-sm bg-gray-900 px-3 py-2 rounded font-mono overflow-x-auto">
            <SyntaxHighlighter
              language={language || 'javascript'}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: 0,
                background: 'transparent',
                fontSize: '0.875rem',
              }}
              wrapLongLines={false}
            >
              {code}
            </SyntaxHighlighter>
          </div>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 mt-1">
            {rowCopied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
          </span>
        </div>
      </td>
      {hasExample && (
        <td className="px-4 py-3 align-top">
          {example ? (
            <div
              className="flex items-start gap-2 group cursor-pointer"
              onClick={handleCopyExample}
              title="Click to copy"
            >
              <div className="flex-1 text-sm bg-gray-900 px-3 py-2 rounded font-mono overflow-x-auto">
                <SyntaxHighlighter
                  language={language || 'javascript'}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: 0,
                    background: 'transparent',
                    fontSize: '0.875rem',
                  }}
                  wrapLongLines={false}
                >
                  {example}
                </SyntaxHighlighter>
              </div>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 mt-1">
                {exampleCopied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </span>
            </div>
          ) : (
            <span className="text-gray-400 text-sm italic">-</span>
          )}
        </td>
      )}
    </tr>
  );
}

export default function BlockComponent({ block, isEditMode, onUpdate, onDelete }: BlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(block.content);
  const [editTitle, setEditTitle] = useState(block.title || '');
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);
  const [calcVariables, setCalcVariables] = useState<Record<string, number>>({});
  const [editReferenceRows, setEditReferenceRows] = useState(block.referenceData || []);

  // Sync editReferenceRows when block changes
  useEffect(() => {
    if (block.type === 'reference') {
      setEditReferenceRows(block.referenceData || []);
    }
  }, [block.referenceData, block.type]);

  // Parse variables from calculation block and initialize state
  useEffect(() => {
    if (block.type === 'calculation') {
      const vars: Record<string, number> = {};
      const lines = block.content.split('\n');

      for (const line of lines) {
        // Match variable definition: $varname = value
        const varMatch = line.match(/\$(\w+)\s*=\s*([\d.]+)/);
        if (varMatch) {
          const varName = varMatch[1];
          const value = parseFloat(varMatch[2]);
          if (!isNaN(value)) {
            vars[varName] = value;
          }
        }

        // Also find inline inputs [varname] and initialize them if not already set
        const inlineMatches = Array.from(line.matchAll(/\[(\w+)\]/g));
        for (const match of inlineMatches) {
          const varName = match[1];
          if (!(varName in vars)) {
            vars[varName] = 0; // Default value for inline inputs
          }
        }
      }

      setCalcVariables(vars);
    }
  }, [block.content, block.type]);

  // Safe math evaluation function (limited to basic arithmetic)
  const safeEval = (expr: string, variables: Record<string, number> = {}): number | null => {
    try {
      // Replace variables with their values ($varname)
      let processedExpr = expr;
      for (const [varName, value] of Object.entries(variables)) {
        const dollarRegex = new RegExp(`\\$${varName}\\b`, 'g');
        processedExpr = processedExpr.replace(dollarRegex, String(value));
      }

      // Replace inline inputs with their values ([varname])
      for (const [varName, value] of Object.entries(variables)) {
        const bracketRegex = new RegExp(`\\[${varName}\\]`, 'g');
        processedExpr = processedExpr.replace(bracketRegex, String(value));
      }

      // Remove all whitespace
      const cleaned = processedExpr.replace(/\s/g, '');

      // Only allow numbers, basic operators, parentheses, and decimal points
      if (!/^[0-9+\-*/().]+$/.test(cleaned)) {
        return null;
      }

      // Use Function constructor instead of eval (still evaluates but more controlled)
      // In a production app, consider using a library like math.js
      const result = Function(`'use strict'; return (${cleaned})`)();

      return typeof result === 'number' && !isNaN(result) ? result : null;
    } catch {
      return null;
    }
  };

  const handleSave = () => {
    onUpdate({
      ...block,
      content: editContent,
      title: editTitle,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(block.content);
    setEditTitle(block.title || '');
    setIsEditing(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(block.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditing) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isEditing]);

  const renderContent = () => {
    switch (block.type) {
      case 'text':
        return (
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {block.content}
            </ReactMarkdown>
          </div>
        );

      case 'code':
        return (
          <SyntaxHighlighter
            language={block.language || 'javascript'}
            style={vscDarkPlus}
            customStyle={{ margin: 0, borderRadius: '0.375rem' }}
          >
            {block.content}
          </SyntaxHighlighter>
        );

      case 'table':
        // Parse table content and render as HTML table
        const parseTable = (content: string) => {
          const lines = content.split('\n').filter(l => l.trim());
          if (lines.length === 0) return null;

          // Check if it's markdown table format or CSV-like
          const isMarkdownTable = lines[0].includes('|');

          if (isMarkdownTable) {
            // Parse markdown table
            const rows = lines
              .filter(line => !line.match(/^\|?[\s:-]+\|/)) // Skip separator line
              .map(line =>
                line.split('|')
                  .map(cell => cell.trim())
                  .filter(cell => cell !== '')
              );

            if (rows.length === 0) return null;

            const headers = rows[0];
            const dataRows = rows.slice(1);

            return (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      {headers.map((header, i) => (
                        <th key={i} className="border border-gray-300 px-4 py-2 text-left font-semibold text-sm">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {row.map((cell, j) => (
                          <td key={j} className="border border-gray-300 px-4 py-2 text-sm">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          } else {
            // Try CSV format (comma or tab separated)
            const delimiter = content.includes('\t') ? '\t' : ',';
            const rows = lines.map(line => line.split(delimiter).map(cell => cell.trim()));

            if (rows.length === 0) return null;

            const headers = rows[0];
            const dataRows = rows.slice(1);

            return (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      {headers.map((header, i) => (
                        <th key={i} className="border border-gray-300 px-4 py-2 text-left font-semibold text-sm">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {row.map((cell, j) => (
                          <td key={j} className="border border-gray-300 px-4 py-2 text-sm">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        };

        return parseTable(block.content) || (
          <div className="text-gray-400 text-sm p-4 border-2 border-dashed border-gray-300 rounded">
            No valid table data. Use markdown table format:<br/>
            | Header 1 | Header 2 |<br/>
            | -------- | -------- |<br/>
            | Cell 1   | Cell 2   |
          </div>
        );

      case 'list':
        return (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {block.content}
            </ReactMarkdown>
          </div>
        );

      case 'checkbox':
        const lines = block.content.split('\n').filter(l => l.trim());
        return (
          <div className="space-y-2">
            {lines.map((line, index) => {
              const match = line.match(/^\[([x ])\]\s*(.*)$/);
              if (match) {
                const isChecked = match[1] === 'x';
                const text = match[2];
                return (
                  <label key={index} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const newLines = [...lines];
                        newLines[index] = `[${e.target.checked ? 'x' : ' '}] ${text}`;
                        onUpdate({ ...block, content: newLines.join('\n') });
                      }}
                      className="rounded"
                    />
                    <span className={isChecked ? 'line-through text-gray-500' : ''}>
                      {text}
                    </span>
                  </label>
                );
              }
              return null;
            })}
            {isEditMode && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
              >
                <Plus size={14} />
                Add item
              </button>
            )}
          </div>
        );

      case 'calculation':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 font-mono text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Expression</th>
                  <th className="border border-gray-300 px-4 py-2 text-right font-semibold">Result</th>
                </tr>
              </thead>
              <tbody>
                {block.content.split('\n').map((line, index) => {
                  const trimmedLine = line.trim();

                  // Skip empty lines
                  if (!trimmedLine) return null;

                  // Check if it's a variable definition: $varname = value
                  const varMatch = trimmedLine.match(/^\$(\w+)\s*=\s*([\d.]+)$/);
                  if (varMatch) {
                    const varName = varMatch[1];
                    const currentValue = calcVariables[varName] || parseFloat(varMatch[2]) || 0;

                    return (
                      <tr key={index} className="bg-blue-50">
                        <td className="border border-gray-300 px-4 py-2 text-gray-700 font-semibold">
                          ${varName}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          <input
                            type="number"
                            value={currentValue}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              setCalcVariables(prev => ({
                                ...prev,
                                [varName]: newValue
                              }));
                            }}
                            className="w-full text-right px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600"
                            step="any"
                          />
                        </td>
                      </tr>
                    );
                  }

                  // Check if line contains '='
                  if (trimmedLine.includes('=')) {
                    const parts = trimmedLine.split('=');
                    let fullExpression = parts[0].trim();

                    // Check if there's a label (text followed by colon)
                    let label = '';
                    let expression = fullExpression;
                    const colonIndex = fullExpression.indexOf(':');

                    if (colonIndex !== -1) {
                      // Split on the first colon only
                      label = fullExpression.substring(0, colonIndex).trim();
                      expression = fullExpression.substring(colonIndex + 1).trim();
                    }

                    const result = safeEval(expression, calcVariables);

                    // Function to render expression with inline inputs
                    const renderExpressionWithInputs = (expr: string, labelText: string = '') => {
                      const elements: (JSX.Element | string)[] = [];

                      // Add label if it exists
                      if (labelText) {
                        elements.push(
                          <span key="label" className="font-semibold text-gray-800">
                            {labelText}:{' '}
                          </span>
                        );
                      }

                      let lastIndex = 0;
                      const inlineInputRegex = /\[(\w+)\]/g;
                      const matches = Array.from(expr.matchAll(inlineInputRegex));

                      if (matches.length === 0) {
                        // No inline inputs found, just add the expression text
                        elements.push(expr);
                        return <>{elements}</>;
                      }

                      matches.forEach((match, idx) => {
                        const varName = match[1];
                        const matchIndex = match.index!;

                        // Add text before the match
                        if (matchIndex > lastIndex) {
                          elements.push(expr.substring(lastIndex, matchIndex));
                        }

                        // Add inline input
                        elements.push(
                          <input
                            key={`input-${varName}-${idx}`}
                            type="number"
                            value={calcVariables[varName] || 0}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              setCalcVariables(prev => ({
                                ...prev,
                                [varName]: newValue
                              }));
                            }}
                            className="inline-block w-20 text-center px-2 py-1 mx-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600 bg-blue-50"
                            step="any"
                            onClick={(e) => e.stopPropagation()}
                          />
                        );

                        lastIndex = matchIndex + match[0].length;
                      });

                      // Add remaining text
                      if (lastIndex < expr.length) {
                        elements.push(expr.substring(lastIndex));
                      }

                      return <>{elements}</>;
                    };

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 text-gray-700">
                          {renderExpressionWithInputs(expression, label)}
                        </td>
                        <td className={`border border-gray-300 px-4 py-2 text-right font-bold ${
                          result !== null ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {result !== null ? (
                            // Format number with commas and up to 6 decimal places
                            typeof result === 'number'
                              ? result.toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 6
                                })
                              : result
                          ) : (
                            'ERROR'
                          )}
                        </td>
                      </tr>
                    );
                  } else {
                    // Comment or label line
                    return (
                      <tr key={index} className="bg-gray-50">
                        <td colSpan={2} className="border border-gray-300 px-4 py-2 text-gray-600 italic">
                          {trimmedLine}
                        </td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          </div>
        );

      case 'reference':
        // Check if any row has example data
        const hasExamples = block.referenceData?.some(row => row.example) || false;
        const referenceData = block.referenceData || [];

        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Code</th>
                  {hasExamples && (
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Example</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {referenceData.map((row, index) => (
                  <ReferenceCardRow
                    key={index}
                    description={row.description}
                    code={row.code}
                    example={row.example}
                    language={block.language}
                    hasExample={hasExamples}
                  />
                ))}
              </tbody>
            </table>
            {(!block.referenceData || block.referenceData.length === 0) && (
              <div className="text-center py-8 text-gray-400">
                No reference data yet. Click edit to add rows.
              </div>
            )}
          </div>
        );

      default:
        return <div>{block.content}</div>;
    }
  };

  const renderCheckboxEditor = () => {
    const checkboxLines = editContent.split('\n').filter(l => l.trim());

    const handleCheckboxChange = (index: number, text: string) => {
      const lines = [...checkboxLines];
      lines[index] = `[ ] ${text}`;
      setEditContent(lines.join('\n'));
    };

    const handleAddCheckbox = () => {
      const lines = editContent ? editContent.split('\n') : [];
      lines.push('[ ] New item');
      setEditContent(lines.join('\n'));
    };

    const handleRemoveCheckbox = (index: number) => {
      const lines = checkboxLines.filter((_, i) => i !== index);
      setEditContent(lines.join('\n'));
    };

    return (
      <div className="space-y-4">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Block title (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Checklist Items</label>
          {checkboxLines.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
              No items yet. Click "Add Item" below.
            </div>
          ) : (
            checkboxLines.map((line, index) => {
              const match = line.match(/^\[([x ])\]\s*(.*)$/);
              const text = match ? match[2] : line;
              return (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => handleCheckboxChange(index, e.target.value)}
                    placeholder="Item text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleRemoveCheckbox(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={handleAddCheckbox}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Item
        </button>

        <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    );
  };

  const renderReferenceEditor = () => {
    // Use local state to avoid re-render delays while typing
    const handleUpdateRow = (index: number, field: 'description' | 'code' | 'example', value: string) => {
      const newRows = [...editReferenceRows];
      newRows[index] = { ...newRows[index], [field]: value };
      setEditReferenceRows(newRows);
    };

    const handleAddRow = () => {
      const newRows = [...editReferenceRows, { description: '', code: '', example: '' }];
      setEditReferenceRows(newRows);
    };

    const handleRemoveRow = (index: number) => {
      const newRows = editReferenceRows.filter((_, i) => i !== index);
      setEditReferenceRows(newRows);
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        // Parse CSV (simple comma-separated values)
        const newRows = lines.map(line => {
          const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
          return {
            description: parts[0] || '',
            code: parts[1] || '',
            example: parts[2] || ''
          };
        });

        // Remove header row if it looks like a header
        if (newRows.length > 0 &&
            (newRows[0].description.toLowerCase() === 'description' ||
             newRows[0].description.toLowerCase() === 'desc')) {
          newRows.shift();
        }

        setEditReferenceRows([...editReferenceRows, ...newRows]);
      };

      reader.readAsText(file);
      e.target.value = ''; // Reset file input
    };

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdate({ ...block, language: e.target.value });
    };

    const handleSaveReference = () => {
      onUpdate({
        ...block,
        title: editTitle,
        referenceData: editReferenceRows
      });
      setIsEditing(false);
    };

    return (
      <div className="space-y-4">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Block title (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />

        {/* Language Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Syntax Highlighting Language</label>
          <select
            value={block.language || 'javascript'}
            onChange={handleLanguageChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="csharp">C#</option>
            <option value="php">PHP</option>
            <option value="ruby">Ruby</option>
            <option value="bash">Bash</option>
            <option value="sql">SQL</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="json">JSON</option>
            <option value="yaml">YAML</option>
            <option value="markdown">Markdown</option>
          </select>
        </div>

        {/* CSV Import */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Import from CSV
            <span className="text-xs text-gray-500 ml-2">(Format: description,code,example)</span>
          </label>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleImportCSV}
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Reference Rows</label>
          {editReferenceRows.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
              No rows yet. Click "Add Row" below or import from CSV.
            </div>
          ) : (
            <div className="space-y-3">
              {editReferenceRows.map((row, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => handleUpdateRow(index, 'description', e.target.value)}
                        placeholder="Description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      <textarea
                        value={row.code}
                        onChange={(e) => handleUpdateRow(index, 'code', e.target.value)}
                        placeholder="Code (multi-line supported)"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm resize-y"
                      />
                      <textarea
                        value={row.example || ''}
                        onChange={(e) => handleUpdateRow(index, 'example', e.target.value)}
                        placeholder="Example (optional)"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm resize-y"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveRow(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleAddRow}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Row
        </button>

        <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveReference}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    );
  };

  const renderEditor = () => {
    if (block.type === 'checkbox') {
      return renderCheckboxEditor();
    }

    if (block.type === 'reference') {
      return renderReferenceEditor();
    }

    return (
      <div className="space-y-4">
        {/* Title Input */}
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Block title (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />

        {/* Content Textarea - Large */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Content</label>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
            rows={20}
            placeholder={`Enter ${block.type} content...`}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-200">
          {block.type === 'code' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Language:</label>
              <select
                value={block.language || 'javascript'}
                onChange={(e) => onUpdate({ ...block, language: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
                <option value="cpp">C++</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="sql">SQL</option>
                <option value="bash">Bash</option>
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
              </select>
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  const showHeader = isEditMode || block.title;

  return (
    <>
      <div className="h-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col group relative">
        {/* Block Header */}
        {showHeader && (
          <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isEditMode && (
                <div className="drag-handle cursor-move p-1 hover:bg-gray-200 rounded" title="Drag to move">
                  <GripVertical size={16} className="text-gray-400" />
                </div>
              )}
              {block.title && (
                <span className="text-sm font-medium text-gray-600">
                  {block.title}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {!isEditing && block.type === 'code' && (
                <button
                  onClick={handleCopy}
                  className="p-1 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100"
                  title={copied ? 'Copied!' : 'Copy code'}
                >
                  {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
              )}
              {isEditMode && !isEditing && block.type !== 'checkbox' && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title={showPreview ? 'Show raw' : 'Show preview'}
                >
                  {showPreview ? <Code size={14} /> : <Eye size={14} />}
                </button>
              )}
              {isEditMode && (
                <>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={onDelete}
                    className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Floating Copy Button for Code Blocks in Reader Mode */}
        {!isEditMode && !block.title && block.type === 'code' && (
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={handleCopy}
              className="p-2 bg-gray-900/80 hover:bg-gray-900 text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm shadow-lg"
              title={copied ? 'Copied!' : 'Copy code'}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        )}

        {/* Block Content */}
        <div className="flex-1 overflow-auto p-3">
          {showPreview ? (
            renderContent()
          ) : (
            <pre className="text-sm text-gray-600 whitespace-pre-wrap font-mono">
              {block.content}
            </pre>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditModal isOpen={isEditing} onClose={handleCancel} onSave={handleSave}>
        {renderEditor()}
      </EditModal>
    </>
  );
}

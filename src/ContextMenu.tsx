import { useState, useEffect, useRef } from 'react';

type ContextMenuProps = {
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onAddNode: (type: string) => void;
};

const AVAILABLE_NODES = [
  { type: 'declareVar', label: 'Declare Variable', category: 'Variables' },
  { type: 'getVar', label: 'Get Variable', category: 'Variables' },
  { type: 'literal', label: 'Literal Value', category: 'Values' },
  { type: 'arrayLiteral', label: 'Array Literal', category: 'Values' },
  { type: 'arrayAppend', label: 'Array Append', category: 'Arrays' },
  { type: 'arrayGet', label: 'Array Get Element', category: 'Arrays' },
  { type: 'arraySet', label: 'Array Set Element', category: 'Arrays' },
  { type: 'arrayLength', label: 'Array Length', category: 'Arrays' },
  { type: 'math', label: 'Math Operation', category: 'Math' },
  { type: 'compare', label: 'Compare', category: 'Logic' },
  { type: 'if', label: 'If Branch', category: 'Control Flow' },
  { type: 'for', label: 'For Loop', category: 'Control Flow' },
  { type: 'forEach', label: 'For Each Loop', category: 'Control Flow' },
  { type: 'print', label: 'Print', category: 'Output' },
];

export function ContextMenu({ isOpen, x, y, onClose, onAddNode }: ContextMenuProps) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredNodes = AVAILABLE_NODES.filter((n) =>
    n.label.toLowerCase().includes(search.toLowerCase()) ||
    n.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="absolute bg-white border border-gray-300 shadow-xl rounded-md w-64 z-50 overflow-hidden flex flex-col"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2 border-b border-gray-200 bg-gray-50">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search nodes..."
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && filteredNodes.length > 0) {
              onAddNode(filteredNodes[0].type);
              onClose();
            }
          }}
        />
      </div>
      <div className="max-h-60 overflow-y-auto py-1">
        {filteredNodes.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500 text-center">No nodes found</div>
        ) : (
          filteredNodes.map((node) => (
            <button
              key={node.type}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
              onClick={() => {
                onAddNode(node.type);
                onClose();
              }}
            >
              <div className="font-medium text-gray-800">{node.label}</div>
              <div className="text-xs text-gray-400">{node.category}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

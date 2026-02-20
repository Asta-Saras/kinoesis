import { Position, useUpdateNodeInternals } from '@xyflow/react';
import { useStore } from '../store';
import { NodeDeleteButton } from './NodeDeleteButton';
import { DataPin } from './Pins';
import { useEffect } from 'react';

export function GetVarNode({ id, data }: { id: string, data: any }) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const updateNodeInternals = useUpdateNodeInternals();
  const nodes = useStore((state) => state.nodes);

  const declareNodes = nodes.filter((n) => n.type === 'declareVar');

  // Auto-update type and target id if the source declare node changes its type or name
  useEffect(() => {
    if (data.varId) {
      const sourceNode = declareNodes.find((n) => n.id === data.varId);
      if (sourceNode) {
        if (sourceNode.data.varType !== data.varType || sourceNode.data.varName !== data.varName) {
          updateNodeData(id, { varType: sourceNode.data.varType, varName: sourceNode.data.varName });
        }
      } else {
        // Source node was deleted, clear our selection
        updateNodeData(id, { varId: '', varName: '', varType: 'int' });
      }
    }
  }, [declareNodes, data.varId, data.varName, data.varType, id, updateNodeData]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [data.varType, id, updateNodeInternals]);

  return (
    <div className="bg-indigo-600 text-white p-4 rounded-md shadow-lg border-2 border-indigo-800 w-[160px] relative group">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <NodeDeleteButton id={id} />
      </div>
      <div className="font-bold text-center border-b border-indigo-500 pb-2 mb-2 px-2">Get Variable</div>
      
      <div className="flex flex-col gap-2 mt-2 text-sm text-black">
        {declareNodes.length > 0 ? (
          <select 
            value={data.varId || ''} 
            onChange={(e) => {
              const selectedId = e.target.value;
              const sourceNode = declareNodes.find((n) => n.id === selectedId);
              updateNodeData(id, { 
                varId: selectedId,
                varName: sourceNode ? sourceNode.data.varName : '', 
                varType: sourceNode ? sourceNode.data.varType : 'int' 
              });
            }}
            className="px-2 py-1 rounded w-full"
          >
            <option value="" disabled>Select Variable</option>
            {declareNodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.data.varName || `var_${n.id}`} ({n.data.varType || 'int'})
              </option>
            ))}
          </select>
        ) : (
          <div className="px-2 py-1 rounded w-full bg-gray-200 text-gray-500 text-xs text-center">
            No vars declared
          </div>
        )}
        
        <div className="flex justify-between items-center text-white relative h-6 mt-1 border-t border-indigo-500 pt-2">
          <span className="text-blue-200">Value</span>
          <DataPin id="data-out-value" type="source" position={Position.Right} dataType={data.varType || 'int'} />
        </div>
      </div>
    </div>
  );
}

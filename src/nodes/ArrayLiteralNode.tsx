import { Position, useUpdateNodeInternals } from '@xyflow/react';
import { useStore } from '../store';
import { NodeDeleteButton } from './NodeDeleteButton';
import { DataPin } from './Pins';
import { useEffect } from 'react';

export function ArrayLiteralNode({ id, data }: { id: string, data: any }) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [data.type, id, updateNodeInternals]);

  const valueType = data.type || '[]int';

  return (
    <div className="bg-gray-700 text-white p-4 rounded-md shadow-lg border-2 border-gray-900 w-[160px] relative group">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <NodeDeleteButton id={id} />
      </div>
      <div className="font-bold text-center border-b border-gray-600 pb-2 mb-2 px-2">Array Literal</div>
      
      <div className="flex flex-col gap-2 mt-2 text-sm text-black">
        <select 
          value={valueType} 
          onChange={(e) => updateNodeData(id, { type: e.target.value })}
          className="px-2 py-1 rounded w-full"
        >
          <option value="[]int">[]int</option>
          <option value="[]string">[]string</option>
          <option value="[]bool">[]bool</option>
          <option value="[]float">[]float</option>
        </select>
        
        <div className="text-white text-center text-xs py-1 text-gray-400">
          (Empty Array)
        </div>
        
        <div className="flex justify-between items-center text-white relative h-6 mt-1 border-t border-gray-600 pt-2">
          <span className="text-blue-200">Array</span>
          <DataPin id="data-out-value" type="source" position={Position.Right} dataType={valueType} />
        </div>
      </div>
    </div>
  );
}

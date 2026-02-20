import { Position, useUpdateNodeInternals } from '@xyflow/react';
import { useStore } from '../store';
import { NodeDeleteButton } from './NodeDeleteButton';
import { DataPin } from './Pins';
import { useEffect } from 'react';

export function LiteralNode({ id, data }: { id: string, data: any }) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [data.type, id, updateNodeInternals]);

  return (
    <div className="bg-gray-600 text-white p-4 rounded-md shadow-lg border-2 border-gray-800 w-[160px] relative group">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <NodeDeleteButton id={id} />
      </div>
      <div className="font-bold text-center border-b border-gray-500 pb-2 mb-2 px-2">Literal</div>
      
      <div className="flex flex-col gap-2 mt-2 text-sm text-black">
        <select 
          value={data.type || 'int'} 
          onChange={(e) => {
            const newType = e.target.value;
            // Provide sensible defaults when switching types
            let newValue = data.value;
            if (newType === 'bool' && newValue !== 'true' && newValue !== 'false') newValue = 'true';
            if (newType === 'int') newValue = parseInt(newValue) || 0;
            if (newType === 'float') newValue = parseFloat(newValue) || 0.0;
            
            updateNodeData(id, { type: newType, value: newValue });
          }}
          className="px-2 py-1 rounded w-full"
        >
          <option value="int">int</option>
          <option value="float">float</option>
          <option value="string">string</option>
          <option value="bool">bool</option>
        </select>
        
        {data.type === 'bool' ? (
          <select
            value={data.value || 'true'}
            onChange={(e) => updateNodeData(id, { value: e.target.value })}
            className="px-2 py-1 rounded w-full"
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        ) : (
          <input 
            type={data.type === 'int' || data.type === 'float' ? 'number' : 'text'} 
            step={data.type === 'float' ? 'any' : '1'}
            value={data.value !== undefined ? data.value : ''} 
            onChange={(e) => updateNodeData(id, { value: e.target.value })}
            placeholder="Value"
            className="px-2 py-1 rounded w-full"
          />
        )}
        
        <div className="flex justify-between items-center text-white relative h-6 mt-1 border-t border-gray-500 pt-2">
          <span className="text-blue-200">Value</span>
          <DataPin id="data-out-value" type="source" position={Position.Right} dataType={data.type || 'int'} />
        </div>
      </div>
    </div>
  );
}

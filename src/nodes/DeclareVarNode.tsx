import { Position, useUpdateNodeInternals } from '@xyflow/react';
import { useStore } from '../store';
import { NodeDeleteButton } from './NodeDeleteButton';
import { ExecPin, DataPin } from './Pins';
import { useEffect } from 'react';

export function DeclareVarNode({ id, data }: { id: string, data: any }) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [data.varType, id, updateNodeInternals]);

  return (
    <div className="bg-blue-600 text-white p-4 rounded-md shadow-lg border-2 border-blue-800 w-[200px] relative group">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <NodeDeleteButton id={id} />
      </div>
      <div className="font-bold text-center border-b border-blue-500 pb-2 mb-2 px-2">Declare Variable</div>
      
      {/* Execution In - Top Left */}
      <ExecPin id="exec-in" type="target" position={Position.Left} borderHex="#1e40af" />
      
      {/* Execution Out - Top Right */}
      <ExecPin id="exec-out" type="source" position={Position.Right} borderHex="#1e40af" />

      <div className="flex flex-col gap-2 mt-2 text-sm text-black">
        <input 
          type="text" 
          value={data.varName || ''} 
          onChange={(e) => updateNodeData(id, { varName: e.target.value })}
          placeholder="Variable Name"
          className="px-2 py-1 rounded w-full"
        />
        <select 
          value={data.varType || 'int'} 
          onChange={(e) => updateNodeData(id, { varType: e.target.value })}
          className="px-2 py-1 rounded w-full"
        >
          <option value="int">int</option>
          <option value="string">string</option>
          <option value="bool">bool</option>
          <option value="float">float</option>
          <option value="[]int">[]int</option>
          <option value="[]string">[]string</option>
          <option value="[]bool">[]bool</option>
          <option value="[]float">[]float</option>
        </select>
        
        <div className="flex justify-between items-center text-white relative h-6 mt-1">
          <span>Value In</span>
          <DataPin id="data-in-value" type="target" position={Position.Left} dataType={data.varType || 'int'} />
        </div>

        <div className="flex justify-between items-center text-white relative h-6 mt-1 border-t border-blue-500 pt-2">
          <span className="text-blue-200">Var Out</span>
          <DataPin id="data-out-value" type="source" position={Position.Right} dataType={data.varType || 'int'} />
        </div>
      </div>
    </div>
  );
}

import { Position } from '@xyflow/react';
import { useStore } from '../store';
import { NodeDeleteButton } from './NodeDeleteButton';
import { DataPin } from './Pins';

export function MathNode({ id, data }: { id: string, data: any }) {
  const updateNodeData = useStore((state) => state.updateNodeData);

  return (
    <div className="bg-purple-600 text-white p-4 rounded-md shadow-lg border-2 border-purple-800 w-[180px] relative group">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <NodeDeleteButton id={id} />
      </div>
      <div className="font-bold text-center border-b border-purple-500 pb-2 mb-2 px-2">Math Op</div>
      
      <div className="flex flex-col gap-2 mt-2 text-sm text-black relative">
        <select 
          value={data.operator || '+'} 
          onChange={(e) => updateNodeData(id, { operator: e.target.value })}
          className="px-2 py-1 rounded w-full"
        >
          <option value="+">+</option>
          <option value="-">-</option>
          <option value="*">*</option>
          <option value="/">/</option>
          <option value="%">%</option>
        </select>
        
        {/* Input A */}
        <div className="flex justify-between items-center text-white relative h-6">
          <span>A</span>
          <DataPin id="data-in-A" type="target" position={Position.Left} dataType="int" />
        </div>
        
        {/* Input B */}
        <div className="flex justify-between items-center text-white relative h-6">
          <span>B</span>
          <DataPin id="data-in-B" type="target" position={Position.Left} dataType="int" />
        </div>

        {/* Output */}
        <div className="flex justify-between items-center text-white relative h-6 mt-1 border-t border-purple-500 pt-2">
          <span className="text-blue-200">Result</span>
          <DataPin id="data-out-result" type="source" position={Position.Right} dataType="int" />
        </div>
      </div>
    </div>
  );
}

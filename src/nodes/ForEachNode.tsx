import { Position } from '@xyflow/react';
import { useStore } from '../store';
import { NodeDeleteButton } from './NodeDeleteButton';
import { ExecPin, InlineExecPin, DataPin } from './Pins';

export function ForEachNode({ id, data }: { id: string; data: any }) {
  const updateNodeData = useStore((state) => state.updateNodeData);

  return (
    <div className="bg-fuchsia-600 text-white p-4 rounded-md shadow-lg border-2 border-fuchsia-800 w-[240px] relative group">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <NodeDeleteButton id={id} />
      </div>
      <div className="font-bold text-center border-b border-fuchsia-500 pb-2 mb-2 px-2">For Each Loop</div>
      
      {/* Execution In - Top Left */}
      <ExecPin id="exec-in" type="target" position={Position.Left} borderHex="#86198f" />

      <div className="flex flex-col gap-3 mt-4 text-sm">
        {/* Loop Body Exec Out */}
        <div className="flex justify-between items-center relative h-6">
          <span className="text-white">Loop Body</span>
          <InlineExecPin id="exec-out-loop" type="source" position={Position.Right} borderHex="#86198f" />
        </div>

        {/* Array In */}
        <div className="flex justify-between items-center relative h-6 mt-1">
          <span className="text-white">Array</span>
          <DataPin id="data-in-array" type="target" position={Position.Left} dataType="[]any" />
        </div>

        {/* Index Name Input */}
        <div className="mt-2 text-black flex flex-col gap-1">
          <label className="text-xs text-fuchsia-200">Index Var Name:</label>
          <input 
            type="text" 
            value={data.indexName || 'index'} 
            onChange={(e) => updateNodeData(id, { indexName: e.target.value })}
            placeholder="index"
            className="px-2 py-1 rounded w-full text-sm font-mono border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Item Name Input */}
        <div className="mt-1 text-black flex flex-col gap-1">
          <label className="text-xs text-fuchsia-200">Item Var Name:</label>
          <input 
            type="text" 
            value={data.itemName || 'item'} 
            onChange={(e) => updateNodeData(id, { itemName: e.target.value })}
            placeholder="item"
            className="px-2 py-1 rounded w-full text-sm font-mono border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="border-t border-fuchsia-500 mt-2 pt-2 flex flex-col gap-2">
          {/* Index Out */}
          <div className="flex justify-between items-center relative h-6">
            <span className="text-blue-200">Index Value</span>
            <DataPin id="data-out-index" type="source" position={Position.Right} dataType="int" />
          </div>

          {/* Item Out */}
          <div className="flex justify-between items-center relative h-6">
            <span className="text-blue-200">Item Value</span>
            <DataPin id="data-out-item" type="source" position={Position.Right} dataType="any" />
          </div>
        </div>

        {/* Completed Exec Out */}
        <div className="flex justify-between items-center relative h-6 mt-2 border-t border-fuchsia-500 pt-3">
          <span className="text-gray-300">Completed</span>
          <InlineExecPin id="exec-out-completed" type="source" position={Position.Right} colorHex="#d1d5db" borderHex="#86198f" />
        </div>
      </div>
    </div>
  );
}

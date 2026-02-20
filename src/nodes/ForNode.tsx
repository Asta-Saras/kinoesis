import { Position } from '@xyflow/react';
import { useStore } from '../store';
import { NodeDeleteButton } from './NodeDeleteButton';
import { ExecPin, InlineExecPin, DataPin } from './Pins';
import { DataInputPin } from './DataInputPin';

export function ForNode({ id, data }: { id: string; data: any }) {
  const updateNodeData = useStore((state) => state.updateNodeData);

  return (
    <div className="bg-fuchsia-600 text-white p-4 rounded-md shadow-lg border-2 border-fuchsia-800 w-[220px] relative group">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <NodeDeleteButton id={id} />
      </div>
      <div className="font-bold text-center border-b border-fuchsia-500 pb-2 mb-2 px-2">For Loop</div>
      
      {/* Execution In - Top Left */}
      <ExecPin id="exec-in" type="target" position={Position.Left} borderHex="#86198f" />

      <div className="flex flex-col gap-2 mt-4 text-sm">
        {/* Loop Body Exec Out */}
        <div className="flex justify-between items-center relative h-6">
          <span className="text-white">Loop Body</span>
          <InlineExecPin id="exec-out-loop" type="source" position={Position.Right} borderHex="#86198f" />
        </div>

        {/* Index Name Input */}
        <div className="mt-2 text-black">
          <input 
            type="text" 
            value={data.indexName || 'i'} 
            onChange={(e) => updateNodeData(id, { indexName: e.target.value })}
            placeholder="Index Name (e.g., i)"
            className="px-2 py-1 rounded w-full text-sm font-mono border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Start Value In */}
        <DataInputPin nodeId={id} pinId="data-in-start" label="Start Idx" dataType="int" expectedType="int" />

        {/* End Value In */}
        <DataInputPin nodeId={id} pinId="data-in-end" label="End Idx" dataType="int" expectedType="int" />

        {/* Index Out */}
        <div className="flex justify-between items-center relative h-6 mt-2 border-t border-fuchsia-500 pt-2">
          <span className="text-blue-200">Index Value</span>
          <DataPin id="data-out-index" type="source" position={Position.Right} dataType="int" />
        </div>

        {/* Completed Exec Out */}
        <div className="flex justify-between items-center relative h-6 mt-2">
          <span className="text-gray-300">Completed</span>
          <InlineExecPin id="exec-out-completed" type="source" position={Position.Right} colorHex="#d1d5db" borderHex="#86198f" />
        </div>
      </div>
    </div>
  );
}

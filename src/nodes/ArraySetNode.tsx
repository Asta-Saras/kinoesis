import { Position } from '@xyflow/react';
import { NodeDeleteButton } from './NodeDeleteButton';
import { ExecPin, DataPin } from './Pins';
import { DataInputPin } from './DataInputPin';

export function ArraySetNode({ id }: { id: string }) {
  return (
    <div className="bg-teal-700 text-white p-4 rounded-md shadow-lg border-2 border-teal-900 w-[200px] relative group">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <NodeDeleteButton id={id} />
      </div>
      <div className="font-bold text-center border-b border-teal-600 pb-2 mb-2 px-2">Array Set</div>
      
      <ExecPin id="exec-in" type="target" position={Position.Left} borderHex="#0f766e" />
      <ExecPin id="exec-out" type="source" position={Position.Right} borderHex="#0f766e" />

      <div className="flex flex-col gap-3 mt-4 text-sm">
        <div className="flex justify-between items-center relative h-6">
          <span>Array</span>
          <DataPin id="data-in-array" type="target" position={Position.Left} dataType="[]any" />
        </div>

        <div className="mt-1">
          <DataInputPin
             nodeId={id}
             pinId="data-in-index"
             expectedType="int"
             dataType="int"
             label="Index"
          />
        </div>

        <div className="flex justify-between items-center relative h-6">
          <span>Value</span>
          <DataPin id="data-in-value" type="target" position={Position.Left} dataType="any" />
        </div>
      </div>
    </div>
  );
}

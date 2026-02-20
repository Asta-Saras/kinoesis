import { Position } from '@xyflow/react';
import { NodeDeleteButton } from './NodeDeleteButton';
import { ExecPin, DataPin } from './Pins';

export function ArrayAppendNode({ id }: { id: string }) {
  return (
    <div className="bg-purple-600 text-white p-4 rounded-md shadow-lg border-2 border-purple-800 w-[200px] relative group">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <NodeDeleteButton id={id} />
      </div>
      <div className="font-bold text-center border-b border-purple-500 pb-2 mb-2 px-2">Array Append</div>
      
      <ExecPin id="exec-in" type="target" position={Position.Left} borderHex="#7e22ce" />
      <ExecPin id="exec-out" type="source" position={Position.Right} borderHex="#7e22ce" />

      <div className="flex flex-col gap-3 mt-4 text-sm">
        <div className="flex justify-between items-center relative h-6">
          <span>Array</span>
          <DataPin id="data-in-array" type="target" position={Position.Left} dataType="[]any" />
        </div>

        <div className="flex justify-between items-center relative h-6">
          <span>Element</span>
          {/* Using basic DataPin since we cannot easily provide a fallback for 'any' element */}
          <DataPin id="data-in-element" type="target" position={Position.Left} dataType="any" />
        </div>

        <div className="flex justify-between items-center relative h-6 mt-2 border-t border-purple-500 pt-2 text-purple-200">
          <span>New Array</span>
          <DataPin id="data-out-array" type="source" position={Position.Right} dataType="[]any" />
        </div>
      </div>
    </div>
  );
}

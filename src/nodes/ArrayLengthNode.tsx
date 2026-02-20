import { Position } from '@xyflow/react';
import { NodeDeleteButton } from './NodeDeleteButton';
import { DataPin } from './Pins';

export function ArrayLengthNode({ id }: { id: string }) {
  return (
    <div className="bg-teal-600 text-white p-4 rounded-md shadow-lg border-2 border-teal-800 w-[180px] relative group">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <NodeDeleteButton id={id} />
      </div>
      <div className="font-bold text-center border-b border-teal-500 pb-2 mb-2 px-2">Array Length</div>
      
      <div className="flex flex-col gap-3 mt-2 text-sm">
        <div className="flex justify-between items-center relative h-6">
          <span>Array</span>
          <DataPin id="data-in-array" type="target" position={Position.Left} dataType="[]any" />
        </div>

        <div className="flex justify-between items-center relative h-6 mt-2 border-t border-teal-500 pt-2 text-teal-200">
          <span>Length</span>
          <DataPin id="data-out-length" type="source" position={Position.Right} dataType="int" />
        </div>
      </div>
    </div>
  );
}

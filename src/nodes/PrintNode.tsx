import { Position } from '@xyflow/react';
import { NodeDeleteButton } from './NodeDeleteButton';
import { ExecPin } from './Pins';
import { DataInputPin } from './DataInputPin';

export function PrintNode({ id }: { id: string }) {
  return (
    <div className="bg-teal-600 text-white p-4 rounded-md shadow-lg border-2 border-teal-800 w-[180px] relative group">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <NodeDeleteButton id={id} />
      </div>
      <div className="font-bold text-center border-b border-teal-500 pb-2 mb-2 px-2">Print</div>
      
      {/* Execution In - Top Left */}
      <ExecPin id="exec-in" type="target" position={Position.Left} borderHex="#115e59" />
      
      {/* Execution Out - Top Right */}
      <ExecPin id="exec-out" type="source" position={Position.Right} borderHex="#115e59" />

      <div className="mt-4">
        <DataInputPin nodeId={id} pinId="data-in-value" label="Value" dataType="any" expectedType="any" />
      </div>
    </div>
  );
}

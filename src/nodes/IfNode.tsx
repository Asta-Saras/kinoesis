import { Position } from '@xyflow/react';
import { NodeDeleteButton } from './NodeDeleteButton';
import { ExecPin, InlineExecPin } from './Pins';
import { DataInputPin } from './DataInputPin';

export function IfNode({ id }: { id: string }) {
  return (
    <div className="bg-yellow-600 text-white p-4 rounded-md shadow-lg border-2 border-yellow-800 w-[200px] relative group">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <NodeDeleteButton id={id} />
      </div>
      <div className="font-bold text-center border-b border-yellow-500 pb-2 mb-2 px-2">If Condition</div>
      
      {/* Execution In - Top Left */}
      <ExecPin id="exec-in" type="target" position={Position.Left} borderHex="#854d0e" />
      
      {/* Execution Out - Top Right (Continues after If block) */}
      <ExecPin id="exec-out" type="source" position={Position.Right} borderHex="#854d0e" />

      <div className="mt-4">
        <DataInputPin nodeId={id} pinId="data-in-condition" label="Condition" dataType="bool" expectedType="bool" />
      </div>

      <div className="flex justify-between items-center text-sm mt-6 mb-2 relative h-6">
        <span className="text-yellow-100">True</span>
        <InlineExecPin id="exec-out-true" type="source" position={Position.Right} borderHex="#854d0e" />
      </div>

      <div className="flex justify-between items-center text-sm mt-2 relative h-6">
        <span className="text-yellow-100">False</span>
        <InlineExecPin id="exec-out-false" type="source" position={Position.Right} borderHex="#854d0e" />
      </div>
    </div>
  );
}


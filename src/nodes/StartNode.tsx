import { Position } from '@xyflow/react';
import { ExecPin } from './Pins';

export function StartNode() {
  return (
    <div className="bg-green-600 text-white px-5 py-3 rounded-full shadow-lg border-2 border-green-800 flex items-center gap-2 relative">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-green-200">
        <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
      </svg>
      <div className="font-bold text-lg">Start</div>
      
      {/* Execution Out - Right */}
      <ExecPin id="exec-out" type="source" position={Position.Right} borderHex="#166534" />
    </div>
  );
}


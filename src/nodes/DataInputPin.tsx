import { Position } from '@xyflow/react';
import { useStore } from '../store';
import { DataPin } from './Pins';
import { useMemo } from 'react';

export function DataInputPin({
  nodeId,
  pinId,
  dataType = 'any',
  label,
  expectedType = 'string',
}: {
  nodeId: string;
  pinId: string;
  dataType?: string;
  label: string;
  expectedType?: 'string' | 'int' | 'float' | 'bool' | 'any';
}) {
  const edges = useStore((state) => state.edges);
  const updateNodeData = useStore((state) => state.updateNodeData);
  const node = useStore((state) => state.nodes.find((n) => n.id === nodeId));

  const isConnected = useMemo(() => {
    return edges.some(
      (e) => e.target === nodeId && e.targetHandle?.startsWith(`${pinId}:`)
    );
  }, [edges, nodeId, pinId]);

  const val = node?.data?.[pinId] ?? '';

  return (
    <div className="flex justify-between items-center text-white relative h-8 mt-1 border-t border-white/20 pt-1">
      <span className="text-sm mr-2">{label}</span>
      
      {expectedType === 'bool' ? (
        <select
          value={String(val)}
          onChange={(e) => updateNodeData(nodeId, { [pinId]: e.target.value === 'true' })}
          disabled={isConnected}
          className={`nodrag w-20 px-1 py-0.5 text-xs rounded border border-gray-600 focus:outline-none ${
            isConnected
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed border-gray-500'
              : 'bg-white text-black'
          }`}
        >
          <option value="false">false</option>
          <option value="true">true</option>
        </select>
      ) : (
        <input
          type={expectedType === 'int' || expectedType === 'float' ? 'number' : 'text'}
          value={val}
          onChange={(e) => updateNodeData(nodeId, { [pinId]: e.target.value })}
          disabled={isConnected}
          placeholder="Fallback"
          className={`nodrag w-20 px-1 py-0.5 text-xs rounded border border-gray-600 focus:outline-none ${
            isConnected
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed border-gray-500'
              : 'bg-white text-black'
          }`}
        />
      )}

      <DataPin id={pinId} type="target" position={Position.Left} dataType={dataType} />
    </div>
  );
}

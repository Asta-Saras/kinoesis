import { Handle, Position } from '@xyflow/react';

// Standard execution pin placed at the top corners
export function ExecPin({
  id,
  type,
  position,
  colorHex = '#ffffff', // bg-white
  borderHex = '#1f2937' // border-gray-800
}: {
  id: string;
  type: 'source' | 'target';
  position: Position;
  colorHex?: string;
  borderHex?: string;
}) {
  const isLeft = position === Position.Left;
  
  return (
    <Handle 
      type={type} 
      position={position} 
      id={id} 
      className={`w-6 h-6 z-10`} 
      style={{ 
        backgroundColor: colorHex,
        borderColor: borderHex,
        borderWidth: '2px',
        borderStyle: 'solid',
        top: '20px', 
        [isLeft ? 'left' : 'right']: '-14px',
        borderRadius: '3px',
        clipPath: 'polygon(0 0, 100% 50%, 0 100%)' 
      }} 
    />
  );
}

// Inline execution pin placed beside labels
export function InlineExecPin({
  id,
  type,
  position,
  colorHex = '#ffffff',
  borderHex = '#1f2937'
}: {
  id: string;
  type: 'source' | 'target';
  position: Position;
  colorHex?: string;
  borderHex?: string;
}) {
  const isLeft = position === Position.Left;
  return (
    <Handle 
      type={type} 
      position={position} 
      id={id} 
      className={`w-6 h-6 z-10`} 
      style={{ 
        backgroundColor: colorHex,
        borderColor: borderHex,
        borderWidth: '2px',
        borderStyle: 'solid',
        top: '12px', 
        [isLeft ? 'left' : 'right']: '-28px',
        borderRadius: '3px',
        clipPath: 'polygon(0 0, 100% 50%, 0 100%)' 
      }} 
    />
  );
}

// Data pin placed beside labels
export function DataPin({
  id,
  type,
  position,
  dataType = 'any'
}: {
  id: string;
  type: 'source' | 'target';
  position: Position;
  dataType?: string;
}) {
  const isLeft = position === Position.Left;
  
  let colorHex = '#9ca3af'; // bg-gray-400
  let isArray = dataType.startsWith('[]');
  let baseType = isArray ? dataType.substring(2) : dataType;

  switch (baseType) {
    case 'int': colorHex = '#34d399'; break; // emerald-400
    case 'string': colorHex = '#e879f9'; break; // fuchsia-400
    case 'bool': colorHex = '#f87171'; break; // red-400
    case 'float': colorHex = '#22d3ee'; break; // cyan-400
    case 'any': colorHex = '#9ca3af'; break; // gray-400
  }

  const shapeClass = isArray ? 'rounded-md' : 'rounded-full';

  return (
    <Handle 
      type={type} 
      position={position} 
      id={`${id}:${dataType}`} 
      className={`w-5 h-5 ${shapeClass} z-10 ${isArray ? 'shadow-[inset_0_0_0_2px_rgba(0,0,0,0.3)]' : ''}`} 
      style={{ 
        backgroundColor: colorHex,
        borderColor: '#155a49',
        borderWidth: '3px',
        borderStyle: 'solid',
        top: '12px', 
        [isLeft ? 'left' : 'right']: '-28px'
      }} 
      title={dataType}
    />
  );
}

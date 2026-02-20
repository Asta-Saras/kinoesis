import { X } from 'lucide-react';
import { useStore } from '../store';

export function NodeDeleteButton({ id }: { id: string }) {
  const deleteNode = useStore((state) => state.deleteNode);

  return (
    <button
      onClick={() => deleteNode(id)}
      className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-black/20 text-white/50 hover:text-white transition-colors cursor-pointer"
      title="Delete Node"
    >
      <X size={12} />
    </button>
  );
}

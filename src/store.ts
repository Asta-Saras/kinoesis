import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  reconnectEdge,
} from '@xyflow/react';
import type {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from '@xyflow/react';

export type NodeData = {
  [key: string]: any;
};

export type AppNode = Node<NodeData, string>;

export function canConnect({ source, target, sourceHandle, targetHandle }: Edge | Connection) {
  if (source === target || !sourceHandle || !targetHandle) return false;
  if (sourceHandle.startsWith('exec') || targetHandle.startsWith('exec')) {
    return sourceHandle.startsWith('exec-out') && targetHandle === 'exec-in';
  }

  const sourceType = sourceHandle.split(':')[1];
  const targetType = targetHandle.split(':')[1];
  if (!sourceHandle.startsWith('data-out-') || !targetHandle.startsWith('data-in-') || !sourceType || !targetType) {
    return false;
  }
  return sourceType === targetType || sourceType === 'any' || targetType === 'any'
    || (targetType === '[]any' && sourceType.startsWith('[]'))
    || (sourceType === '[]any' && targetType.startsWith('[]'));
}

function removeConflictingEdges(edges: Edge[], connection: Connection, reconnectingId?: string) {
  return edges.filter((edge) =>
    edge.id === reconnectingId || (
      (edge.target !== connection.target || edge.targetHandle !== connection.targetHandle)
      && (!connection.sourceHandle?.startsWith('exec') || edge.source !== connection.source || edge.sourceHandle !== connection.sourceHandle)
    ),
  );
}

export type AppState = {
  nodes: AppNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateNodeData: (id: string, data: Partial<NodeData>) => void;
  deleteNode: (id: string) => void;
  reconnectEdge: (oldEdge: Edge, newConnection: Connection) => void;
  deleteEdge: (id: string) => void;
  resetGraph: () => void;
};

const starterNodes: AppNode[] = [
  { id: 'start-1', type: 'start', position: { x: 50, y: 50 }, data: {} },
  { id: 'literal-1', type: 'literal', position: { x: 235, y: 145 }, data: { type: 'string', value: 'Hello Kinoesis!' } },
  { id: 'print-1', type: 'print', position: { x: 435, y: 50 }, data: {} },
];
const starterEdges: Edge[] = [
  { id: 'e1', source: 'start-1', target: 'print-1', sourceHandle: 'exec-out', targetHandle: 'exec-in' },
  { id: 'e2', source: 'literal-1', target: 'print-1', sourceHandle: 'data-out-value:string', targetHandle: 'data-in-value:any' },
];

export const useStore = create<AppState>((set, get) => ({
  nodes: starterNodes,
  edges: starterEdges,
  resetGraph: () => set({ nodes: starterNodes, edges: starterEdges }),
  onNodesChange: (changes: NodeChange<AppNode>[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: Connection) => {
    if (!canConnect(connection)) return;
    set({ edges: addEdge(connection, removeConflictingEdges(get().edges, connection)) });
  },
  setNodes: (nodes: AppNode[]) => {
    set({ nodes });
  },
  setEdges: (edges: Edge[]) => {
    set({ edges });
  },
  updateNodeData: (id: string, data: Partial<NodeData>) => {
    const oldNode = get().nodes.find(n => n.id === id);
    const oldType = oldNode?.data.varType || oldNode?.data.type || (oldNode?.type === 'arrayLiteral' ? '[]int' : 'int');
    const newType = data.varType || data.type;
    
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      }),
    });

    // If a type property changed, remove any edges connected to the old type handles
    if (newType && oldType !== newType) {
      set({
        edges: get().edges.filter(edge => {
          if (edge.source === id && edge.sourceHandle?.endsWith(`:${oldType}`)) return false;
          if (edge.target === id && edge.targetHandle?.endsWith(`:${oldType}`)) return false;
          return true;
        })
      });
    }
  },
  deleteNode: (id: string) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
    });
  },
  reconnectEdge: (oldEdge: Edge, newConnection: Connection) => {
    if (!canConnect(newConnection)) return;
    set({
      edges: reconnectEdge(oldEdge, newConnection, removeConflictingEdges(get().edges, newConnection, oldEdge.id)),
    });
  },
  deleteEdge: (id: string) => {
    set({
      edges: get().edges.filter((edge) => edge.id !== id),
    });
  },
}));

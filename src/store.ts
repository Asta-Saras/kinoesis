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
};

export const useStore = create<AppState>((set, get) => ({
  nodes: [
    {
      id: 'start-1',
      type: 'start',
      position: { x: 50, y: 50 },
      data: { label: 'Start Program' },
    },
    {
      id: 'declare-1',
      type: 'declareVar',
      position: { x: 250, y: 50 },
      data: { varName: 'message', varType: 'string', initialValue: 'Hello flow2code!' },
    },
    {
      id: 'print-1',
      type: 'print',
      position: { x: 500, y: 50 },
      data: {},
    }
  ],
  edges: [
    { id: 'e1', source: 'start-1', target: 'declare-1', sourceHandle: 'exec-out', targetHandle: 'exec-in' },
    { id: 'e2', source: 'declare-1', target: 'print-1', sourceHandle: 'exec-out', targetHandle: 'exec-in' },
    { id: 'e3', source: 'declare-1', target: 'print-1', sourceHandle: 'data-out-value:string', targetHandle: 'data-in-value:any' }
  ],
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
    // Only allow specific handle types to connect:
    // execution pin -> execution pin
    // data pin -> data pin
    if (connection.sourceHandle?.startsWith('exec') !== connection.targetHandle?.startsWith('exec')) {
      return; // Do not connect different pin types
    }
    
    // Check data type constraints
    if (connection.sourceHandle?.startsWith('data') && connection.targetHandle?.startsWith('data')) {
      const sourceType = connection.sourceHandle.split(':')[1];
      const targetType = connection.targetHandle.split(':')[1];
      
      if (sourceType && targetType && sourceType !== targetType) {
        if (sourceType === 'any' || targetType === 'any') {
          // Allow connection to generic 'any'
        } else if (targetType === '[]any' && sourceType.startsWith('[]')) {
          // Allow any array type to connect to a generic array input
        } else if (sourceType === '[]any' && targetType.startsWith('[]')) {
          // Allow generic array output to connect to any array input
        } else {
          console.warn(`Type mismatch: Cannot connect ${sourceType} to ${targetType}`);
          return; // Block connection
        }
      }
    }
    
    let currentEdges = get().edges;

    // If it's an execution pin connection, remove any existing connections from the same source pin
    // and any existing connections to the same target pin to enforce 1-to-1 execution flow
    if (connection.sourceHandle?.startsWith('exec')) {
      currentEdges = currentEdges.filter(
        (edge) =>
          !(edge.source === connection.source && edge.sourceHandle === connection.sourceHandle) &&
          !(edge.target === connection.target && edge.targetHandle === connection.targetHandle)
      );
    } else if (connection.sourceHandle?.startsWith('data') && connection.targetHandle?.startsWith('data')) {
      // Data target pins can only have ONE incoming connection (e.g. you can only plug one thing into an "A" slot)
      currentEdges = currentEdges.filter(
        (edge) => !(edge.target === connection.target && edge.targetHandle === connection.targetHandle)
      );
    }
    
    set({
      edges: addEdge(connection, currentEdges),
    });
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
    set({
      edges: reconnectEdge(oldEdge, newConnection, get().edges),
    });
  },
  deleteEdge: (id: string) => {
    set({
      edges: get().edges.filter((edge) => edge.id !== id),
    });
  },
}));

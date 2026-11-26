import { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import type { Connection, OnConnectEnd, OnConnectStart, OnConnectStartParams, ReactFlowProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { canConnect, useStore } from './store';
import { StartNode } from './nodes/StartNode';
import { DeclareVarNode } from './nodes/DeclareVarNode';
import { GetVarNode } from './nodes/GetVarNode';
import { MathNode } from './nodes/MathNode';
import { CompareNode } from './nodes/CompareNode';
import { IfNode } from './nodes/IfNode';
import { ForNode } from './nodes/ForNode';
import { PrintNode } from './nodes/PrintNode';
import { LiteralNode } from './nodes/LiteralNode';
import { ArrayLiteralNode } from './nodes/ArrayLiteralNode';
import { ArrayAppendNode } from './nodes/ArrayAppendNode';
import { ArrayGetNode } from './nodes/ArrayGetNode';
import { ArraySetNode } from './nodes/ArraySetNode';
import { ArrayLengthNode } from './nodes/ArrayLengthNode';
import { ForEachNode } from './nodes/ForEachNode';
import { ContextMenu } from './ContextMenu';

const nodeTypes = {
  start: StartNode,
  declareVar: DeclareVarNode,
  getVar: GetVarNode,
  math: MathNode,
  compare: CompareNode,
  if: IfNode,
  for: ForNode,
  forEach: ForEachNode,
  print: PrintNode,
  literal: LiteralNode,
  arrayLiteral: ArrayLiteralNode,
  arrayAppend: ArrayAppendNode,
  arrayGet: ArrayGetNode,
  arraySet: ArraySetNode,
  arrayLength: ArrayLengthNode,
};

// Pins on newly created nodes, before React Flow has measured their handles.
const newNodePins: Record<string, { source?: string[]; target?: string[] }> = {
  declareVar: { source: ['exec-out', 'data-out-value:int'], target: ['exec-in', 'data-in-value:int'] },
  getVar: { source: ['data-out-value:int'] },
  literal: { source: ['data-out-value:int'] },
  math: { source: ['data-out-result:int'], target: ['data-in-A:int', 'data-in-B:int'] },
  compare: { source: ['data-out-result:bool'], target: ['data-in-A:int', 'data-in-B:int'] },
  if: { source: ['exec-out'], target: ['exec-in', 'data-in-condition:bool'] },
  for: { source: ['exec-out-loop', 'data-out-index:int'], target: ['exec-in', 'data-in-start:int', 'data-in-end:int'] },
  forEach: { source: ['exec-out-loop', 'data-out-index:int', 'data-out-item:any'], target: ['exec-in', 'data-in-array:[]any'] },
  print: { source: ['exec-out'], target: ['exec-in', 'data-in-value:any'] },
  arrayLiteral: { source: ['data-out-value:[]int'] },
  arrayAppend: { source: ['exec-out', 'data-out-array:[]any'], target: ['exec-in', 'data-in-array:[]any', 'data-in-element:any'] },
  arrayGet: { source: ['data-out-element:any'], target: ['data-in-array:[]any', 'data-in-index:int'] },
  arraySet: { source: ['exec-out'], target: ['exec-in', 'data-in-array:[]any', 'data-in-index:int', 'data-in-value:any'] },
  arrayLength: { source: ['data-out-length:int'], target: ['data-in-array:[]any'] },
};

export function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, reconnectEdge, deleteEdge } = useStore();
  const [menuState, setMenuState] = useState<{ isOpen: boolean; x: number; y: number }>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  const connectingParams = useRef<OnConnectStartParams | null>(null);
  const reconnecting = useRef(false);
  const justOpenedMenuFromEdgeDrop = useRef(false);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const addNode = useCallback((type: string, position = { x: 100, y: 100 }) => {
    const newNodeId = `${type}-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type,
      position,
      data: {},
    };

    setNodes([...useStore.getState().nodes, newNode]);
    return newNodeId;
  }, [setNodes]);

  const openMenuAt = useCallback((event: MouseEvent | TouchEvent, fromEdgeDrop = false) => {
    if (!reactFlowWrapper.current) return;
    const bounds = reactFlowWrapper.current.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('clientX' in event) {
      clientX = (event as MouseEvent).clientX;
      clientY = (event as MouseEvent).clientY;
    } else if ((event as TouchEvent).changedTouches?.length > 0) {
      clientX = (event as TouchEvent).changedTouches[0].clientX;
      clientY = (event as TouchEvent).changedTouches[0].clientY;
    }

    justOpenedMenuFromEdgeDrop.current = fromEdgeDrop;
    setMenuState({
      isOpen: true,
      x: clientX - bounds.left,
      y: clientY - bounds.top,
    });
  }, []);

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      connectingParams.current = null;
      openMenuAt(event as MouseEvent);
    },
    [openMenuAt]
  );

  const onPaneClick = useCallback(() => {
    // If the menu was just opened by an edge drop on this same click, don't immediately close it.
    if (justOpenedMenuFromEdgeDrop.current) {
      justOpenedMenuFromEdgeDrop.current = false;
      return;
    }
    if (menuState.isOpen) {
      setMenuState((prev) => ({ ...prev, isOpen: false }));
      connectingParams.current = null;
    }
  }, [menuState.isOpen]);

  const handleAddNodeFromMenu = useCallback(
    (type: string) => {
      if (!reactFlowWrapper.current) return;
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = screenToFlowPosition({
        x: menuState.x + bounds.left,
        y: menuState.y + bounds.top,
      });
      const newNodeId = addNode(type, position);

      const pending = connectingParams.current;
      if (!pending?.nodeId || !pending.handleId) return;

      const { nodeId, handleId, handleType } = pending;
      const fromSource = handleType === 'source';
      const candidates = newNodePins[type]?.[fromSource ? 'target' : 'source'] ?? [];
      const connection = candidates.map((handle): Connection => fromSource
        ? { source: nodeId, sourceHandle: handleId, target: newNodeId, targetHandle: handle }
        : { source: newNodeId, sourceHandle: handle, target: nodeId, targetHandle: handleId }
      ).find(canConnect);

      if (connection) onConnect(connection);
    },
    [menuState.x, menuState.y, screenToFlowPosition, addNode, onConnect]
  );

  const onConnectStart = useCallback<OnConnectStart>((_, params) => {
    connectingParams.current = params;
  }, []);

  const onConnectEnd = useCallback<OnConnectEnd>((event, connectionState) => {
    if (reconnecting.current) return;
    if (connectionState.isValid !== null) {
      connectingParams.current = null;
      return;
    }
    openMenuAt(event, true);
  }, [openMenuAt]);

  const onReconnectStart = useCallback(() => {
    reconnecting.current = true;
  }, []);

  const onReconnectEnd = useCallback<NonNullable<ReactFlowProps['onReconnectEnd']>>((event, edge, _, connectionState) => {
    reconnecting.current = false;
    if (connectionState.isValid !== null) {
      connectingParams.current = null;
      return;
    }

    deleteEdge(edge.id);
    openMenuAt(event, true);
  }, [deleteEdge, openMenuAt]);

  return (
    <div className="w-full h-full relative [color-scheme:light]" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={canConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onReconnectStart={onReconnectStart}
        onReconnect={reconnectEdge}
        onReconnectEnd={onReconnectEnd}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <Panel position="top-left" className="flex items-center gap-2 rounded-md bg-white/90 p-1 text-sm shadow">
          <button
            type="button"
            className="cursor-pointer rounded bg-gray-800 px-2.5 py-1 font-medium text-white hover:bg-gray-700"
            onClick={() => {
              connectingParams.current = null;
              justOpenedMenuFromEdgeDrop.current = false;
              setMenuState({ isOpen: true, x: 16, y: 56 });
            }}
          >
            Add node
          </button>
          <span className="hidden px-1 text-xs text-gray-600 lg:inline">Drag between pins to connect</span>
        </Panel>
      </ReactFlow>

      {menuState.isOpen && <ContextMenu
        x={menuState.x}
        y={menuState.y}
        onClose={() => {
          setMenuState((prev) => ({ ...prev, isOpen: false }));
          connectingParams.current = null;
          justOpenedMenuFromEdgeDrop.current = false;
        }}
        onAddNode={handleAddNodeFromMenu}
      />}
    </div>
  );
}

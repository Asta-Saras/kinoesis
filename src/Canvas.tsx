import { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import type { Connection, Edge, FinalConnectionState, OnConnectStartParams } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStore } from './store';
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

export function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, reconnectEdge, deleteEdge } = useStore();
  const [menuState, setMenuState] = useState<{ isOpen: boolean; x: number; y: number }>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  const connectingParams = useRef<OnConnectStartParams | null>(null);
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

    setNodes([...nodes, newNode]);
    return newNodeId;
  }, [nodes, setNodes]);

  const openMenuAt = useCallback((event: MouseEvent | TouchEvent) => {
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

    justOpenedMenuFromEdgeDrop.current = true;
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

      if (connectingParams.current) {
        const { nodeId, handleId, handleType } = connectingParams.current;

        if (handleType === 'source') {
          const targetHandle = handleId?.startsWith('exec') ? 'exec-in' : 'data-in-value';
          onConnect({
            source: nodeId!,
            sourceHandle: handleId,
            target: newNodeId,
            targetHandle: targetHandle,
          });
        } else {
          const sourceHandle = handleId?.startsWith('exec') ? 'exec-out' : 'data-out-value';
          onConnect({
            source: newNodeId,
            sourceHandle: sourceHandle,
            target: nodeId!,
            targetHandle: handleId,
          });
        }
        connectingParams.current = null;
      }
    },
    [menuState.x, menuState.y, screenToFlowPosition, addNode, onConnect]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onConnectStart = useCallback((_: any, params: OnConnectStartParams) => {
    connectingParams.current = params;
  }, []);

  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
    // isValid === null means the pointer was released in empty space (no handle nearby).
    // isValid === true means it landed on a valid handle and onConnect already fired.
    // isValid === false means it landed near an invalid handle.
    if (connectionState.isValid !== null) {
      connectingParams.current = null;
      return;
    }
    openMenuAt(event);
  }, [openMenuAt]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onReconnectStart = useCallback((_: any, edge: Edge, handleType: 'source' | 'target') => {
    connectingParams.current = {
      nodeId: handleType === 'source' ? edge.source : edge.target,
      handleId: (handleType === 'source' ? edge.sourceHandle : edge.targetHandle) || null,
      handleType: handleType === 'source' ? 'source' : 'target',
    };
  }, []);

  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    reconnectEdge(oldEdge, newConnection);
  }, [reconnectEdge]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onReconnectEnd = useCallback((event: MouseEvent | TouchEvent, edge: Edge, _handleType: any, connectionState: FinalConnectionState) => {
    deleteEdge(edge.id);

    if (connectionState.isValid !== null) {
      // Landed on a handle — onReconnect already applied the new connection, just clean up.
      connectingParams.current = null;
      return;
    }

    // Dropped in empty space — open the node search menu.
    openMenuAt(event);
  }, [deleteEdge, openMenuAt]);

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onReconnectStart={onReconnectStart}
        onReconnect={onReconnect}
        onReconnectEnd={onReconnectEnd}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <Panel position="top-left" className="bg-white/80 backdrop-blur-sm p-2 rounded shadow flex gap-2 text-sm z-10">
          <span className="text-gray-500 font-medium px-2 py-1">Right-click canvas to add nodes</span>
        </Panel>
      </ReactFlow>

      <ContextMenu
        isOpen={menuState.isOpen}
        x={menuState.x}
        y={menuState.y}
        onClose={() => {
          setMenuState((prev) => ({ ...prev, isOpen: false }));
          connectingParams.current = null;
        }}
        onAddNode={handleAddNodeFromMenu}
      />
    </div>
  );
}

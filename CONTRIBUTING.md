# Contributing to Kinoesis

This document is the hands-on guide for working on Kinoesis — whether you are a human developer or an AI agent continuing a session. It covers the dev environment, file-by-file orientation, naming conventions, known gotchas, and a step-by-step checklist for the most common change types.

---

## Dev Environment

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+

### Commands

```bash
npm install        # install dependencies
npm run dev        # start Vite dev server at http://localhost:5173
npm run build      # TypeScript type-check + production build
npm run lint       # ESLint
npm run preview    # serve the production build locally
```

The project is entirely client-side. There is no backend, no database, and no build-time code generation step. Everything runs in the browser.

---

## Repository Layout

```
src/
├── App.tsx              Root layout + compiler trigger + JS runner
├── Canvas.tsx           ReactFlow canvas; all drag/connect/menu logic
├── ContextMenu.tsx      Node search popup (right-click or edge drop)
├── store.ts             Zustand store; nodes, edges, connection validation
├── compiler/
│   ├── ast.ts           All AST node type definitions (discriminated union)
│   ├── compiler.ts      Graph → AST (execution traversal + data resolution)
│   ├── generator.ts     CodeGenerator interface
│   ├── golang.ts        AST → Go source string
│   └── javascript.ts    AST → JavaScript source string
└── nodes/
    ├── Pins.tsx             ExecPin, InlineExecPin, DataPin handle components
    ├── DataInputPin.tsx     Pin + inline fallback input field combo
    ├── NodeDeleteButton.tsx Hover-visible delete button for every node
    ├── StartNode.tsx
    ├── DeclareVarNode.tsx
    ├── GetVarNode.tsx
    ├── LiteralNode.tsx
    ├── MathNode.tsx
    ├── CompareNode.tsx
    ├── IfNode.tsx
    ├── ForNode.tsx
    ├── ForEachNode.tsx
    ├── PrintNode.tsx
    ├── ArrayLiteralNode.tsx
    ├── ArrayAppendNode.tsx
    ├── ArrayGetNode.tsx
    ├── ArraySetNode.tsx
    └── ArrayLengthNode.tsx
```

---

## Naming Conventions

### Node type strings

Node type strings are camelCase and match the keys in the `nodeTypes` object in `Canvas.tsx` exactly:

```ts
// Canvas.tsx
const nodeTypes = {
  start: StartNode,
  declareVar: DeclareVarNode,
  math: MathNode,
  // ...
};
```

The same strings are used as `node.type` in the Zustand store, as switch-case keys in `compiler.ts`, and as `type` entries in `AVAILABLE_NODES` in `ContextMenu.tsx`. They must be kept in sync across all four locations.

### Handle IDs

Every ReactFlow `Handle` has an `id` prop. Handle IDs follow one of two schemes:

**Execution handles** — literal strings, no type suffix:
- `exec-in` — execution input (left/top)
- `exec-out` — execution output (right/bottom)
- Branching nodes use descriptive names: `exec-true`, `exec-false`, `exec-completed`, `exec-body`, `exec-after`

**Data handles** — always formatted as `pinId:type`:
- `data-in-value:int`
- `data-out-value:string`
- `data-in-array:[]int`

The `DataPin` component in `Pins.tsx` appends the type suffix automatically:
```ts
// Pins.tsx — DataPin renders Handle with id `${id}:${dataType}`
<Handle id={`${id}:${dataType}`} ... />
```

So when you write `<DataPin id="data-in-value" dataType="int" />`, the actual handle id on the DOM and in edges is `data-in-value:int`.

The store's `onConnect` validates connections by splitting on `:` to compare the type suffix. The compiler's `resolveDataInput` searches for edges by prefix (`startsWith(handlePrefix)`), not the full id with suffix. When a node's type dropdown changes, `updateNodeData` prunes edges ending in the old `:type` suffix.

### Node data bag

Each node has a `data: { [key: string]: any }` bag. Field names are arbitrary but by convention match the pin ID prefix:

| Node | Common data fields |
|---|---|
| `declareVar` | `varName`, `varType`, `initialValue` |
| `getVar` | `varName` |
| `literal` | `value`, `type` |
| `math` | `operator` (`+`, `-`, `*`, `/`, `%`) |
| `compare` | `operator` (`==`, `!=`, `>`, `<`, `>=`, `<=`) |
| `arrayLiteral` | `elementType` |

Data input pins with no wire fall back to `node.data[pinId]` in the compiler (see `resolveDataInput` in `compiler.ts`).

---

## Key Invariants

1. **Every exec edge is 1-to-1.** One outgoing exec edge per source exec handle; one incoming exec edge per target exec handle. `onConnect` enforces this by filtering before calling `addEdge`.

2. **Every data input accepts exactly one wire.** The store filters out existing edges to the same `targetHandle` before adding a new one.

3. **Type pruning on change.** When a node's `varType` (or `type`) changes via `updateNodeData`, all edges on that node whose handle id ends in `:${oldType}` are removed. Downstream nodes may end up disconnected — that is intentional.

4. **The compiler only follows exec edges.** Pure-data nodes (literal, math, compare, getVar, etc.) are only visited when reachable as data inputs of an exec-carrying node. They must not appear as unreachable dead nodes to cause compile errors — they are silently ignored.

5. **`connectingParams` must be cleared after use.** The ref stores the originating pin of the most recent drag. It is read by `handleAddNodeFromMenu` and must be set to `null` after the wire is created, otherwise a subsequent right-click menu would also try to auto-wire a node.

---

## Known Gotchas

### React Flow event ordering: `onConnectEnd` vs `onPaneClick`

React Flow fires `onPaneClick` on every `mouseup` that lands on the pane background — including the same event that ends an edge drag over empty space. This means `onPaneClick` fires _after_ `onConnectEnd` on the same tick.

If `onConnectEnd` opens the context menu (`setMenuState({ isOpen: true })`) and `onPaneClick` closes it (`setMenuState({ isOpen: false })`), both state updates batch and the menu never appears.

**The fix** is `justOpenedMenuFromEdgeDrop` (a `useRef<boolean>`):
- Set to `true` synchronously inside `openMenuAt()`.
- Checked and cleared synchronously at the top of `onPaneClick`.
- Because ref mutations are synchronous and React state batching does not affect refs, the guard is reliable even when both handlers fire in the same React render cycle.

Do not remove or change this ref without understanding this interaction.

### `connectionState.isValid` is the canonical drop outcome

`onConnectEnd(event, connectionState: FinalConnectionState)` — the second argument is the source of truth:

| `isValid` | Meaning |
|---|---|
| `null` | Dropped in empty space → open node menu |
| `true` | Dropped on a valid handle → `onConnect` already fired; do nothing |
| `false` | Dropped near an incompatible handle → do nothing |

**Do not** use `event.target.classList` to detect whether a handle was hit. React Flow's internal pointer-up handler runs before `onConnectEnd` and the DOM target is unreliable at that point. `connectionState.isValid` is the correct and tested signal.

This applies equally to `onReconnectEnd`, which has the signature:
```ts
(event, edge, handleType, connectionState: FinalConnectionState) => void
// note: 4 arguments, not 2
```

### `onReconnectEnd` always runs, even on a successful reconnect

`onReconnect` fires first (updates the edge), then `onReconnectEnd` fires. The current implementation in `Canvas.tsx` calls `deleteEdge(edge.id)` unconditionally in `onReconnectEnd` — this is correct because `onReconnect` calls `reconnectEdge` which already replaced the old edge with the new connection. Deleting the id of the old edge after it has been replaced is a no-op if the id changed, and removes any leftover ghost edge if it did not.

### `updateNodeInternals` after dynamic handle changes

If a node renders different handles based on its data (e.g., `DeclareVarNode` changes its pin types when `varType` changes), you must call `useUpdateNodeInternals()(id)` in a `useEffect` that depends on the changing data. Without this, React Flow's internal handle registry desynchronises from the DOM and connection hit-testing breaks.

```ts
// DeclareVarNode.tsx
const updateNodeInternals = useUpdateNodeInternals();
useEffect(() => {
  updateNodeInternals(id);
}, [data.varType, id, updateNodeInternals]);
```

### Auto-wire on node spawn only connects to `data-in-value` / `data-out-value`

In `handleAddNodeFromMenu` (`Canvas.tsx`), when a new node is spawned from an edge drop, the code tries to wire the new node to the originating pin. For data pins it guesses:
- source → `data-in-value` on the new node
- target → `data-out-value` on the new node

This works for most nodes but will silently fail validation if the new node's default pin type does not match the originating pin's type. The `onConnect` call in the store will just return early without an error. This is a known limitation — no UX feedback is shown.

---

## Adding a New Node Type (checklist)

1. **`src/nodes/MyNode.tsx`** — React component. Use `ExecPin` / `InlineExecPin` for execution handles, `DataPin` for typed data handles, `DataInputPin` for input pins with inline fallback fields. Call `NodeDeleteButton` for the delete affordance. Read `data.*` and call `updateNodeData` via `useStore`. If dynamic handles, call `updateNodeInternals` in a `useEffect`.

2. **`src/Canvas.tsx`** — add `myNode: MyNode` to the `nodeTypes` object and add the import.

3. **`src/ContextMenu.tsx`** — add an entry to `AVAILABLE_NODES`:
   ```ts
   { type: 'myNode', label: 'My Node', category: 'Category' }
   ```

4. **`src/compiler/ast.ts`** — add any new statement or expression types to the discriminated unions if needed.

5. **`src/compiler/compiler.ts`** — add a `case 'myNode':` in `traverseExecution` (if it has exec pins) and/or `evaluateDataNode` (if it is a pure-data node that produces a value). Use `resolveDataInput` to read incoming data wires.

6. **`src/compiler/golang.ts`** and **`src/compiler/javascript.ts`** — handle any new AST node types from step 4.

7. **`README.md`** — add a row to the Node Reference table.

---

## Adding a New Language (checklist)

1. Create `src/compiler/mylang.ts` implementing `CodeGenerator` from `generator.ts`.
2. Add a `case 'mylang':` to the `useEffect` compiler dispatch in `App.tsx`.
3. Add `<option value="mylang">MyLang</option>` to the language `<select>` in `App.tsx`.
4. Update the Monaco `language` prop and the file label in the code panel.

The AST is the only contract between the compiler and generators. No other files need changes.

---

## Working as an AI Agent

If you are an AI agent resuming this codebase, the most important context to load first:

1. **`src/Canvas.tsx`** — all canvas interaction logic lives here. Read it in full before touching any edge or menu behavior.
2. **`src/store.ts`** — all state mutations live here. `onConnect` and `updateNodeData` have non-obvious side effects described above.
3. **`ARCHITECTURE.md`** — sequence diagrams for the connect/reconnect flows, and the full compiler pipeline walkthrough.

### Before changing `Canvas.tsx`

- Understand the `justOpenedMenuFromEdgeDrop` ref and why it exists (see above and `ARCHITECTURE.md`).
- Understand that `onReconnectEnd` always fires, even after a successful reconnect.
- Do not add new `useRef` workarounds for React Flow event ordering — use `connectionState.isValid`.

### Before changing the compiler

- The compiler is deterministic and synchronous. It does not mutate the store.
- `traverseExecution` only follows exec edges. Nodes not reachable via exec are invisible to it.
- `resolveDataInput` uses `startsWith(handlePrefix)` — this is intentional so it matches `data-in-value:int`, `data-in-value:string`, etc., with the same prefix `data-in-value`.

### Testing approach

There are currently no automated tests. Manual testing steps after any change:

1. `npm run build` — catches TypeScript errors.
2. `npm run dev` — open the browser.
3. Drag an edge from a pin into empty space → node menu should open at drop point, spawned node auto-wires.
4. Grab an edge endpoint and drag to a new pin → edge reconnects.
5. Grab an edge endpoint and drag to empty space → edge deletes and node menu opens.
6. Right-click pane → node menu opens, pane click closes it.
7. Change a DeclareVariable node's type → connected edges to the old type are removed.
8. Switch language to JavaScript, click Run Code → output appears in the console panel.

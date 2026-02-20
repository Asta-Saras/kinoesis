# Architecture

This document covers the internal design of flow2code: how the visual graph maps to code, how the canvas interaction model works, and the data flow through the system.

---

## High-Level Data Flow

```
User interaction (canvas)
        │
        ▼
  Zustand store
  (nodes[], edges[])
        │
        ▼
  Compiler (graph → AST)
        │
        ▼
  CodeGenerator (AST → source string)
        │
        ▼
  Monaco Editor (read-only display)
        │ (JS only)
        ▼
  new Function(code)() → console panel
```

Every change to `nodes` or `edges` triggers a re-compile via a `useEffect` in `App.tsx`. The entire pipeline is synchronous and runs in the browser — there is no backend.

---

## Store (`src/store.ts`)

Built with **Zustand v5**. Single flat store exported as `useStore`.

### State shape

```ts
nodes: AppNode[]   // ReactFlow nodes with typed data bags
edges: Edge[]      // ReactFlow edges with sourceHandle / targetHandle
```

### Key behaviors in `onConnect`

Connection validation runs before any edge is added:

1. **Exec/data cross-block** — a handle whose id starts with `exec` cannot connect to one that starts with `data`, and vice versa.
2. **Data type matching** — handle ids are formatted as `pinId:type` (e.g., `data-out-value:int`). The store compares the `:type` suffixes and blocks mismatches unless one side is `any`, or both sides are arrays with compatible element types (`[]any` is the wildcard array type).
3. **Exec 1-to-1** — before adding an exec edge, any existing edge from the same source exec handle or to the same target exec handle is removed.
4. **Data input 1-to-1** — before adding a data edge, any existing edge to the same target data handle is removed (each input slot accepts only one wire).

### `updateNodeData`

When node data changes (e.g., the user changes the type dropdown on a Declare Variable node), `updateNodeData` compares `oldType` to `newType`. If they differ, all edges connected to handles ending in `:${oldType}` are removed — stale connections from the previous type are pruned automatically.

---

## Compiler Pipeline (`src/compiler/`)

### AST (`ast.ts`)

A TypeScript discriminated union of statement and expression node types:

**Statements** (appear in the execution sequence):
- `VariableDeclaration` — `var name type = expr`
- `AssignmentExpression` — `name = expr`
- `IfStatement` — condition + consequent[] + alternate[]
- `ForStatement` — start/end/indexVar + body[] + after[]
- `ForEachStatement` — array/indexVar/itemVar + body[] + after[]
- `ArrayElementAssignment` — `arr[idx] = val`
- `ArrayAppend` — `arr = append(arr, elem)`
- `FunctionCall` — `name(args[])`

**Expressions** (values resolved from data pins):
- `Literal` — a typed scalar or array literal value
- `Identifier` — a variable reference by name
- `BinaryExpression` — left op right (math or comparison)
- `ArrayLiteral` — an empty typed array
- `ArrayAccess` — `arr[idx]`
- `ArrayLength` — `len(arr)`

**Root:**
- `Program` — `{ body: Statement[] }`

### Compiler (`compiler.ts`)

The `Compiler` class takes the flat `nodes[]` and `edges[]` arrays at construction time and builds internal lookup maps.

**`compile() → Program`**

Finds the single `start` node and calls `traverseExecution('start-id', 'exec-out')`.

**`traverseExecution(nodeId, fromHandle) → Statement[]`**

Follows the execution chain:
1. Finds the edge leaving from `fromHandle` on `nodeId`.
2. Looks up the target node and switches on `node.type` to produce an AST statement.
3. For branching nodes (`if`, `for`, `forEach`): recursively traverses branch/body/completed handles to build nested statement arrays.
4. For linear nodes: appends the result and continues via the node's own `exec-out`.
5. Returns when no outgoing exec edge exists.

**`resolveDataInput(targetNodeId, handlePrefix, expectedType) → Expression`**

Resolves a data input pin value:
1. Searches for an edge whose `target === targetNodeId` and `targetHandle` starts with `handlePrefix`.
2. If found: calls `evaluateDataNode` on the source node.
3. If not found: reads `node.data[handlePrefix]` as a literal fallback (the inline input field value).
4. If empty: returns a zero-value literal for the expected type.

**`evaluateDataNode(nodeId, sourceHandle?) → Expression`**

Maps pure-data nodes to AST expressions (no execution side effects):
- `literal` → `Literal`
- `getVar` → `Identifier` (variable name)
- `math` / `compare` → `BinaryExpression` (recursively resolves A and B)
- `for` → `Identifier` (loop index variable)
- `declareVar` → `Identifier` (the variable itself)
- `arrayLiteral` → `ArrayLiteral`
- `arrayGet` → `ArrayAccess`
- `arrayAppend` → `Identifier` (the mutated array name)
- `arrayLength` → `ArrayLength`
- `forEach` → `Identifier` (item or index depending on `sourceHandle`)

### Code Generators (`golang.ts`, `javascript.ts`)

Both implement the `CodeGenerator` interface:

```ts
interface CodeGenerator {
  generate(ast: Program): string;
}
```

They walk the AST recursively with an `indentLevel` counter. Each statement type maps to a language-specific string. Notable differences:

| Concept | Go | JavaScript |
|---|---|---|
| Variable declaration | `var name type = expr` | `let name = expr` |
| For loop | `for i := start; i <= end; i++` | `for (let i = start; i <= end; i++)` |
| For each | `for idx, item := range arr` | `for (const [idx, item] of arr.entries())` |
| Array append | `arr = append(arr, elem)` | `arr.push(elem)` |
| Array length | `len(arr)` | `arr.length` |
| Print | `fmt.Println(...)` | `console.log(...)` |
| Wrapping | `package main` + `func main() {}` | bare block (runs via `new Function`) |
| Import tracking | auto-adds `"fmt"` when needed | none |
| Float type | `float64` | `number` (implicit) |

---

## Canvas Interaction Model (`src/Canvas.tsx`)

### State

```ts
menuState: { isOpen: boolean; x: number; y: number }
connectingParams: React.MutableRefObject<OnConnectStartParams | null>
justOpenedMenuFromEdgeDrop: React.MutableRefObject<boolean>
```

`connectingParams` stores the originating node/handle/type from the most recent drag start. It is used by `handleAddNodeFromMenu` to auto-wire the spawned node.

`justOpenedMenuFromEdgeDrop` is a guard ref that prevents `onPaneClick` from immediately closing a menu that was just opened by `onConnectEnd` or `onReconnectEnd` on the same mouse event.

### New edge drag sequence

```
mousedown on Handle
  → onConnectStart(_, params)     stores params in connectingParams
mouseup on empty space
  → onConnectEnd(event, state)    state.isValid === null → openMenuAt(event)
  → onPaneClick()                 justOpenedMenuFromEdgeDrop guard skips close
user picks node from menu
  → handleAddNodeFromMenu(type)   creates node, reads connectingParams, calls onConnect
```

### Existing edge reconnect sequence

```
mousedown on edge endpoint (EdgeUpdateAnchors)
  → onReconnectStart(_, edge, handleType)   populates connectingParams from old edge
mouseup on valid handle
  → onReconnect(oldEdge, newConn)           store updates edge
  → onReconnectEnd(event, edge, _, state)   state.isValid !== null → cleanup only
mouseup on empty space
  → onReconnectEnd(event, edge, _, state)   deleteEdge(old), state.isValid === null → openMenuAt
```

### Key React Flow insight: `connectionState.isValid`

React Flow's `onConnectEnd` and `onReconnectEnd` receive a `FinalConnectionState` second argument whose `isValid` field is the canonical drop outcome:

| `isValid` | Meaning |
|---|---|
| `null` | Dropped in empty space — no handle nearby |
| `true` | Dropped on a compatible handle — `onConnect` already fired |
| `false` | Dropped near an incompatible handle |

All previous attempts used DOM class sniffing (`target.classList.contains('react-flow__handle')`) or workaround refs — `isValid` is the correct and reliable signal.

### Why `onPaneClick` fires after `onConnectEnd`

React Flow fires `onPaneClick` on every `mouseup` that lands on the pane background — the same event that triggers `onConnectEnd`. Because `onConnectEnd` calls `setMenuState({ isOpen: true })` and `onPaneClick` calls `setMenuState({ isOpen: false })`, both state updates would batch and the menu would never appear. The `justOpenedMenuFromEdgeDrop` ref is set synchronously in `openMenuAt` and checked+cleared synchronously in `onPaneClick`, preventing the race.

---

## Adding a New Language

1. Create `src/compiler/mylang.ts` implementing `CodeGenerator`.
2. Add a case to the `useEffect` in `App.tsx`.
3. Add an `<option>` to the language `<select>` in `App.tsx`.
4. Update the Monaco `language` prop and the file label for the new language.

The AST is the contract — the compiler produces it, generators consume it. No other files need to change.

---

## Adding a New Node Type

1. **Create `src/nodes/MyNode.tsx`** — a React component using `Handle` (via `ExecPin`, `InlineExecPin`, or `DataPin`) and `NodeDeleteButton`. Read node config from `useStore` via `node.data` and `updateNodeData`.
2. **Register in `Canvas.tsx`** — add to the `nodeTypes` object.
3. **Handle in the compiler** — add a `case 'myNode':` in `traverseExecution` (if it has exec pins) and/or `evaluateDataNode` (if it's pure data).
4. **Emit from the generator(s)** — add a case in `golang.ts` and/or `javascript.ts` for any new AST node types you introduced.
5. **Add to `ContextMenu.tsx`** — add an entry to `AVAILABLE_NODES` with `type`, `label`, and `category`.

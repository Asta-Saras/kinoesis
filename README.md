# Kinoesis

A visual, node-based programming environment that compiles to real source code. Build programs by connecting nodes on an infinite canvas — like Unreal Engine Blueprints — and watch the code generate live in a Monaco editor panel.

Currently targets **Go** and **JavaScript**, with the compiler pipeline designed to support additional languages.

---

## Features

- **Visual canvas** — drag, drop, and connect nodes on an infinite ReactFlow canvas
- **Two pin types** — white triangular execution pins (control flow) and colored circular/square data pins (typed values)
- **Live code generation** — every change to the graph instantly regenerates the target language source code
- **Dual language output** — switch between Go and JavaScript at runtime
- **In-browser JS execution** — run the generated JavaScript directly in the browser with console output captured
- **Smart edge interactions** — drag from any pin into empty space to open the node search menu; the spawned node auto-connects to the originating pin
- **Edge reconnection** — grab an existing edge endpoint and drag it to a new pin or empty space
- **Type safety** — connections validate pin types at connection time (exec vs data, int vs string, etc.)
- **Inline fallback inputs** — data input pins with no wire show an editable field as a literal fallback

---

## Getting Started

### CE2 showcase

```bash
npm install
npm run demo
```

Open the local URL printed by Vite and select **Open demo workspace → Open sample flow**. This mode runs without the API or a database.

1. Click **Run** to print `Hello Kinoesis!` from the starter graph.
2. Click **Add node**, choose **Literal Value**, and enter `42`. Drag the literal's green output pin to the gray **Value** pin on **Print**. The generated JavaScript updates to `console.log(42)`.
3. Click **Run** again to see `42`, then switch to **Golang** to show the same graph as Go source.
4. Use **Reset demo** to restore the starter graph or **Home** to return to the dashboard. Graph edits live in memory and reset when the browser reloads.

### Run with authentication

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, sign in, then open the editor from the dashboard.

Sign-in needs the backend in `server/`. Run it alongside the frontend with `npm run server`. For database and OAuth configuration, see **[SETUP.md](./SETUP.md)**.

```bash
npm run build   # type-check + production build
npm run lint    # ESLint
```

---

## How to Use

### Adding Nodes

- **Right-click** anywhere on the canvas to open the node search menu
- **Drag from any pin** into empty space — the menu opens at the drop point and the spawned node auto-wires to the originating pin

### Connecting Nodes

- **Drag** from any output (source) pin to an input (target) pin
- Execution pins (white triangles) only connect to other execution pins
- Data pins only connect to matching types (`int`, `string`, `bool`, `float`, array types, or `any`)
- Each execution pin enforces 1-to-1 connections; each data input accepts only one wire

### Reconnecting / Removing Edges

- **Drag an existing edge endpoint** to move it to a different pin
- **Drag it into empty space** to delete the edge and open the node menu for re-routing

### Running Code

- Use the **language selector** in the header to switch between Go and JavaScript
- In JavaScript mode, click **Run Code** to execute the generated code in-browser; output appears in the console panel below

---

## Node Reference

| Node | Category | Description |
|---|---|---|
| **Start** | — | Program entry point. Every graph must begin here. |
| **Declare Variable** | Variables | Declares a typed variable with an optional initial value. Supports `int`, `string`, `bool`, `float`, and array variants. |
| **Get Variable** | Variables | Reads a declared variable by name. Dropdown auto-populates from existing Declare Variable nodes. |
| **Literal Value** | Values | A hard-coded scalar value (int, float, string, or bool). |
| **Array Literal** | Values | An empty array literal of a chosen element type. |
| **Math Operation** | Math | Binary arithmetic (`+`, `-`, `*`, `/`, `%`) on two integer inputs. |
| **Compare** | Logic | Comparison operator (`==`, `!=`, `>`, `<`, `>=`, `<=`) returning bool. |
| **If Branch** | Control Flow | Conditional branch. Has separate exec outputs for the true branch, false branch, and after the block. |
| **For Loop** | Control Flow | Counted loop from `start` to `end` (inclusive). Exposes the loop index as a data output. |
| **For Each Loop** | Control Flow | Range loop over an array. Exposes the current index and item as data outputs. |
| **Print** | Output | Calls `fmt.Println` (Go) or `console.log` (JS). |
| **Array Append** | Arrays | Appends an element to an array variable (mutates in place). |
| **Array Get Element** | Arrays | Reads an element at a given index. |
| **Array Set Element** | Arrays | Sets an element at a given index. |
| **Array Length** | Arrays | Returns the length of an array. |

---

## Pin Colors

| Color | Type |
|---|---|
| White triangle | Execution flow |
| Emerald | `int` |
| Fuchsia | `string` |
| Red | `bool` |
| Cyan | `float` |
| Gray | `any` |
| Square shape | Array type |

---

## Tech Stack

| | |
|---|---|
| Framework | React 19 |
| Language | TypeScript 5 (strict) |
| Build | Vite 7 |
| Canvas | @xyflow/react (ReactFlow v12) |
| State | Zustand v5 |
| Code editor | Monaco Editor |
| Styling | Tailwind CSS v4 |
| Layout | react-resizable-panels |
| Icons | lucide-react |

---

## Project Structure

```
src/
├── App.tsx              Root layout, language selector, code panel, JS runner
├── Canvas.tsx           ReactFlow canvas, node registration, drag/connect logic
├── ContextMenu.tsx      Node search popup (right-click or edge drop)
├── store.ts             Zustand store — nodes, edges, connection validation
├── compiler/
│   ├── ast.ts           AST node type definitions
│   ├── compiler.ts      Graph → AST (execution traversal + data resolution)
│   ├── generator.ts     CodeGenerator interface
│   ├── golang.ts        AST → Go source
│   └── javascript.ts    AST → JavaScript source
└── nodes/
    ├── Pins.tsx          ExecPin, InlineExecPin, DataPin handle components
    ├── DataInputPin.tsx  Pin with inline fallback input field
    ├── NodeDeleteButton.tsx
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

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a deep dive into the compiler pipeline and canvas interaction model.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidance on adding new nodes, languages, and working with an AI agent on this codebase.

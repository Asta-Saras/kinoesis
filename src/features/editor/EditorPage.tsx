import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';
import { ReactFlowProvider } from '@xyflow/react';
import { ArrowLeft, Play } from 'lucide-react';
import { Canvas } from '../../Canvas';
import { useStore } from '../../store';
import { Compiler } from '../../compiler/compiler';
import { GolangGenerator } from '../../compiler/golang';
import { JavascriptGenerator } from '../../compiler/javascript';
import { useAuthStore } from '../../stores/authStore';
import { useWorkspaceTheme } from '../../hooks/useWorkspaceTheme';
import { Logo } from '../../components/brand/Logo';

type Language = 'go' | 'javascript';

const EDITOR_OPTIONS = {
  readOnly: true,
  minimap: { enabled: false },
  fontSize: 14,
  padding: { top: 16 },
} as const;

/** The visual flow editor (graph → AST → Go/JS). Previously the root App component. */
export function EditorPage() {
  const { nodes, edges } = useStore();
  const workspace = useAuthStore((s) => s.user?.workspace);
  const [generatedCode, setGeneratedCode] = useState('// Generating code...');
  const [language, setLanguage] = useState<Language>('go');
  const [consoleOutput, setConsoleOutput] = useState<string>('');

  useWorkspaceTheme(workspace);

  useEffect(() => {
    try {
      const compiler = new Compiler(nodes, edges);
      const ast = compiler.compile();
      const generator = language === 'go' ? new GolangGenerator() : new JavascriptGenerator();
      setGeneratedCode(generator.generate(ast));
    } catch (e) {
      console.error(e);
      setGeneratedCode(`// Error generating code: ${(e as Error).message}`);
    }
  }, [nodes, edges, language]);

  const runJavascript = () => {
    if (language !== 'javascript') return;

    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args) => {
      logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
      originalLog(...args);
    };

    try {
      const execute = new Function(generatedCode);
      execute();
      setConsoleOutput(logs.join('\n') || 'Execution finished (no output)');
    } catch (err) {
      setConsoleOutput(`Error during execution: ${(err as Error).message}`);
    } finally {
      console.log = originalLog;
    }
  };

  const codePanelHeader = (file: string) => (
    <div className="flex justify-between border-b border-gray-700 bg-gray-800 px-4 py-2 font-mono text-xs text-gray-200">
      <span>{file}</span>
      <span className="text-green-400">● Live Generated</span>
    </div>
  );

  return (
    <div className="flex h-screen w-screen flex-col bg-gray-50">
      <header className="z-20 flex h-14 items-center justify-between border-b border-line bg-ink-900 px-4 text-white">
        <div className="flex items-center gap-3">
          <Link
            to="/home"
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <div className="h-5 w-px bg-line" />
          <Logo />
          <span className="font-mono text-xs text-zinc-500">/ untitled.flow</span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="h-8 cursor-pointer rounded-md border border-line bg-ink-800 px-2 text-white focus:border-accent focus:outline-none"
          >
            <option value="go">Golang</option>
            <option value="javascript">JavaScript</option>
          </select>
          {language === 'javascript' && (
            <button
              onClick={runJavascript}
              className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-accent px-3 font-medium text-accent-fg transition hover:brightness-110"
            >
              <Play className="h-3.5 w-3.5" /> Run
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <PanelGroup orientation="horizontal">
          <Panel defaultSize={60} minSize={30}>
            <ReactFlowProvider>
              <Canvas />
            </ReactFlowProvider>
          </Panel>

          <PanelResizeHandle className="flex w-2 cursor-col-resize flex-col items-center justify-center bg-gray-200 transition-colors hover:bg-blue-400">
            <div className="h-8 w-1 rounded-full bg-gray-400" />
          </PanelResizeHandle>

          <Panel defaultSize={40} minSize={20} className="flex flex-col bg-[#1e1e1e]">
            {language === 'javascript' ? (
              <PanelGroup orientation="vertical">
                <Panel defaultSize={70}>
                  <div className="flex h-full flex-col">
                    {codePanelHeader('index.js')}
                    <div className="flex-1">
                      <Editor height="100%" language="javascript" theme="vs-dark" value={generatedCode} options={EDITOR_OPTIONS} />
                    </div>
                  </div>
                </Panel>
                <PanelResizeHandle className="flex h-2 cursor-row-resize flex-row items-center justify-center bg-gray-700 transition-colors hover:bg-blue-400">
                  <div className="h-1 w-8 rounded-full bg-gray-500" />
                </PanelResizeHandle>
                <Panel defaultSize={30} className="flex flex-col bg-[#1e1e1e]">
                  <div className="border-b border-gray-700 bg-gray-800 px-4 py-1 font-mono text-xs text-gray-200">Browser Console</div>
                  <div className="flex-1 overflow-y-auto p-2 font-mono text-sm whitespace-pre-wrap text-green-400">
                    {consoleOutput || '> Ready. Click "Run" to execute.'}
                  </div>
                </Panel>
              </PanelGroup>
            ) : (
              <div className="flex h-full flex-col">
                {codePanelHeader('main.go')}
                <div className="flex-1">
                  <Editor height="100%" language="go" theme="vs-dark" value={generatedCode} options={EDITOR_OPTIONS} />
                </div>
              </div>
            )}
          </Panel>
        </PanelGroup>
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';
import { Canvas } from './Canvas';
import { useStore } from './store';
import { Compiler } from './compiler/compiler';
import { GolangGenerator } from './compiler/golang';
import { JavascriptGenerator } from './compiler/javascript';
import { ReactFlowProvider } from '@xyflow/react';

type Language = 'go' | 'javascript';

function App() {
  const { nodes, edges } = useStore();
  const [generatedCode, setGeneratedCode] = useState('// Generating code...');
  const [language, setLanguage] = useState<Language>('go');
  const [consoleOutput, setConsoleOutput] = useState<string>('');

  useEffect(() => {
    try {
      const compiler = new Compiler(nodes, edges);
      const ast = compiler.compile();
      
      const generator = language === 'go' 
        ? new GolangGenerator() 
        : new JavascriptGenerator();
        
      const code = generator.generate(ast);
      setGeneratedCode(code);
    } catch (e) {
      console.error(e);
      setGeneratedCode(`// Error generating code: ${(e as Error).message}`);
    }
  }, [nodes, edges, language]);

  const runJavascript = () => {
    if (language !== 'javascript') return;
    
    // Capture console.log
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      originalLog(...args);
    };

    try {
      // Create a function from the generated code and run it
      const execute = new Function(generatedCode);
      execute();
      setConsoleOutput(logs.join('\n') || 'Execution finished (no output)');
    } catch (err) {
      setConsoleOutput(`Error during execution: ${(err as Error).message}`);
    } finally {
      // Restore original console.log
      console.log = originalLog;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50">
      <header className="bg-gray-900 text-white p-4 font-bold flex justify-between items-center shadow-md z-20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center text-xs">V</div>
          <span>flow2code</span>
        </div>
        
        <div className="flex items-center gap-4 text-sm font-normal">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="go">Golang</option>
            <option value="javascript">JavaScript</option>
          </select>
          
          {language === 'javascript' && (
            <button 
              onClick={runJavascript}
              className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded transition-colors cursor-pointer"
            >
              Run Code
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
          
          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-blue-400 transition-colors cursor-col-resize flex flex-col justify-center items-center">
            <div className="w-1 h-8 bg-gray-400 rounded-full" />
          </PanelResizeHandle>
          
          <Panel defaultSize={40} minSize={20} className="flex flex-col bg-[#1e1e1e]">
            {language === 'javascript' ? (
              <PanelGroup orientation="vertical">
                <Panel defaultSize={70}>
                  <div className="flex flex-col h-full">
                    <div className="bg-gray-800 text-gray-200 text-xs px-4 py-2 border-b border-gray-700 font-mono flex justify-between">
                      <span>index.js</span>
                      <span className="text-green-400">● Live Generated</span>
                    </div>
                    <div className="flex-1">
                      <Editor
                        height="100%"
                        language="javascript"
                        theme="vs-dark"
                        value={generatedCode}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          fontSize: 14,
                          padding: { top: 16 }
                        }}
                      />
                    </div>
                  </div>
                </Panel>
                <PanelResizeHandle className="h-2 bg-gray-700 hover:bg-blue-400 transition-colors cursor-row-resize flex flex-row justify-center items-center">
                   <div className="h-1 w-8 bg-gray-500 rounded-full" />
                </PanelResizeHandle>
                <Panel defaultSize={30} className="bg-[#1e1e1e] flex flex-col">
                  <div className="bg-gray-800 text-gray-200 text-xs px-4 py-1 border-b border-gray-700 font-mono">
                    Browser Console
                  </div>
                  <div className="p-2 font-mono text-sm text-green-400 overflow-y-auto whitespace-pre-wrap flex-1">
                    {consoleOutput || '> Ready. Click "Run Code" to execute.'}
                  </div>
                </Panel>
              </PanelGroup>
            ) : (
              <div className="flex flex-col h-full">
                <div className="bg-gray-800 text-gray-200 text-xs px-4 py-2 border-b border-gray-700 font-mono flex justify-between">
                  <span>main.go</span>
                  <span className="text-green-400">● Live Generated</span>
                </div>
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language="go"
                    theme="vs-dark"
                    value={generatedCode}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 14,
                      padding: { top: 16 }
                    }}
                  />
                </div>
              </div>
            )}
          </Panel>
        </PanelGroup>
      </main>
    </div>
  );
}

export default App;

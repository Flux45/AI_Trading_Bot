import React, { useState } from 'react';
import { Copy, Check, FileCode, Terminal, Layers, ArrowRight } from 'lucide-react';
import { PYTHON_SYSTEM_FILES } from '../data/pythonCode';

export const ArchitectureViewer: React.FC = () => {
  const [selectedFileIdx, setSelectedFileIdx] = useState<number>(0);
  const [copiedFileIdx, setCopiedFileIdx] = useState<number | null>(null);

  const selectedFile = PYTHON_SYSTEM_FILES[selectedFileIdx];

  const handleCopy = (idx: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFileIdx(idx);
    setTimeout(() => setCopiedFileIdx(null), 2000);
  };

  return (
    <div id="architecture-viewer-container" className="space-y-6">
      {/* Architecture Concept Overview */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-white">
            <Layers className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">AI BOT ADVANCE: Decoupled System Architecture</h2>
            <p className="mt-1 text-xs text-stone-600 leading-relaxed max-w-4xl">
              This architecture enforces strict separation of concerns across 4 core layers.
              The <strong>Sensory Engine</strong> ingests free Yahoo Finance candles and ATR volatility;
              the <strong>Episodic Memory</strong> retrieves past trade reflections from SQLite;
              the <strong>Cognitive Debate Layer</strong> runs a 3-agent committee (Bull vs. Bear vs. Risk) on Google Gemini;
              and the <strong>Deterministic Risk Engine</strong> mathematically sizes positions and rejects invalid orders before routing to the <strong>Broker Interface</strong> (Paper 0.05% slippage or live Zerodha Kite).
            </p>
          </div>
        </div>

        {/* Layer Flow Diagram */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
            <span className="font-bold text-blue-900">1. Sensory Layer</span>
            <p className="mt-0.5 text-stone-600">Yahoo Finance Ingestion & 14-day ATR calculation</p>
            <span className="mt-2 inline-block font-mono text-[10px] text-blue-800">data_engine.py</span>
          </div>

          <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-3">
            <span className="font-bold text-purple-900">2. Episodic Memory</span>
            <p className="mt-0.5 text-stone-600">SQLite Trade Post-Mortems & Historical Reflections</p>
            <span className="mt-2 inline-block font-mono text-[10px] text-purple-800">memory.py</span>
          </div>

          <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
            <span className="font-bold text-indigo-900">3. Cognitive Debate</span>
            <p className="mt-0.5 text-stone-600">Gemini Multi-Agent Debate (Bull vs. Bear vs. Risk)</p>
            <span className="mt-2 inline-block font-mono text-[10px] text-indigo-800">agent_committee.py</span>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
            <span className="font-bold text-emerald-900">4. Deterministic Risk</span>
            <p className="mt-0.5 text-stone-600">Paperclip Mathematical Position Sizing & Ruin Guards</p>
            <span className="mt-2 inline-block font-mono text-[10px] text-emerald-800">risk_engine.py</span>
          </div>
        </div>
      </div>

      {/* Code Browser */}
      <div className="rounded-xl border border-stone-200 bg-stone-900 text-stone-100 shadow-md overflow-hidden">
        {/* File Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-stone-800 bg-stone-950 px-4 py-2">
          <div className="flex flex-wrap gap-1.5">
            {PYTHON_SYSTEM_FILES.map((file, idx) => (
              <button
                key={file.filename}
                onClick={() => setSelectedFileIdx(idx)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono font-medium transition ${
                  selectedFileIdx === idx
                    ? 'bg-stone-800 text-white border border-stone-700'
                    : 'text-stone-400 hover:bg-stone-900 hover:text-stone-200'
                }`}
              >
                <FileCode className="h-3 w-3 text-stone-500" />
                {file.filename}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleCopy(selectedFileIdx, selectedFile.code)}
            className="flex items-center gap-1 rounded-md bg-stone-800 px-2.5 py-1 text-xs font-medium text-stone-300 hover:bg-stone-700 transition"
          >
            {copiedFileIdx === selectedFileIdx ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* File Metadata Info */}
        <div className="flex items-center justify-between border-b border-stone-800/80 bg-stone-900/90 px-4 py-2 text-xs">
          <div>
            <span className="font-semibold text-stone-300">{selectedFile.role}</span>
            <span className="mx-2 text-stone-600">&bull;</span>
            <span className="text-stone-400">{selectedFile.description}</span>
          </div>
          <span className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-amber-400 uppercase">
            {selectedFile.language}
          </span>
        </div>

        {/* Code Content */}
        <div className="max-h-[480px] overflow-auto p-4 text-xs font-mono leading-relaxed bg-[#131416]">
          <pre className="text-stone-200 selection:bg-stone-700">
            <code>{selectedFile.code}</code>
          </pre>
        </div>
      </div>

      {/* Terminal / Run Instructions */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-stone-700" />
          <h3 className="text-sm font-bold text-stone-900">PC Environment Setup & Execution Guide</h3>
        </div>
        <p className="mt-1 text-xs text-stone-500">
          To run this quantitative bot on your local terminal or VPS:
        </p>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="rounded-lg bg-stone-900 p-3 text-stone-200">
            <span className="text-stone-500"># Step 1: Venv</span>
            <p className="mt-1 text-emerald-400">mkdir AI_BOT_ADVANCE</p>
            <p className="text-emerald-400">cd AI_BOT_ADVANCE</p>
            <p className="text-emerald-400">python -m venv venv</p>
            <p className="text-stone-400">source venv/bin/activate</p>
          </div>

          <div className="rounded-lg bg-stone-900 p-3 text-stone-200">
            <span className="text-stone-500"># Step 2: Dependencies</span>
            <p className="mt-1 text-emerald-400 leading-normal">
              pip install yfinance langchain-google-genai pydantic tomli kiteconnect pandas numpy
            </p>
          </div>

          <div className="rounded-lg bg-stone-900 p-3 text-stone-200">
            <span className="text-stone-500"># Step 3: Run Orchestrator</span>
            <p className="mt-1 text-emerald-400">python main.py</p>
            <p className="mt-1 text-[11px] text-stone-500 font-sans">
              Runs heartbeat on RELIANCE, TCS, INFY, HDFCBANK with paper fills.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import { Check, Database, Mail, MessageSquare, ShoppingBag, Sheet, TrendingUp } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Developer: node graph + terminal                                    */
/* ------------------------------------------------------------------ */

type GraphNode = { id: string; x: number; y: number; title: string; sub: string; tone: 'trigger' | 'logic' | 'data' | 'out' };

const NODES: GraphNode[] = [
  { id: 'http', x: 8, y: 78, title: 'HTTP Trigger', sub: 'POST /orders', tone: 'trigger' },
  { id: 'validate', x: 160, y: 14, title: 'Validate', sub: 'schema: Order', tone: 'logic' },
  { id: 'db', x: 160, y: 142, title: 'Insert Row', sub: 'postgres.orders', tone: 'data' },
  { id: 'respond', x: 312, y: 78, title: 'Respond', sub: '201 Created', tone: 'out' },
];
const W = 120;
const H = 50;
const EDGES: [string, string][] = [
  ['http', 'validate'],
  ['http', 'db'],
  ['validate', 'respond'],
  ['db', 'respond'],
];
const TONE: Record<GraphNode['tone'], string> = {
  trigger: '#f59e0b',
  logic: 'var(--ws-accent-2)',
  data: '#60a5fa',
  out: 'var(--ws-accent)',
};

function edgePath(a: GraphNode, b: GraphNode) {
  const x1 = a.x + W;
  const y1 = a.y + H / 2;
  const x2 = b.x;
  const y2 = b.y + H / 2;
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

export function DeveloperVisual() {
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="overflow-hidden rounded-xl border border-line bg-ink-850/90 shadow-2xl shadow-black/50 backdrop-blur">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-3 font-mono text-xs text-zinc-500">orders-api / create-order.flow</span>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> compiled
          </span>
        </div>
        <svg viewBox="0 0 440 206" className="w-full bg-dot-grid p-3 font-mono">
          {EDGES.map(([a, b]) => (
            <g key={`${a}-${b}`}>
              <path d={edgePath(byId[a], byId[b])} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="2" />
              <path
                d={edgePath(byId[a], byId[b])}
                fill="none"
                style={{ stroke: 'var(--ws-accent)' }}
                strokeWidth="2"
                strokeDasharray="4 6"
                className="animate-dash"
                strokeLinecap="round"
              />
            </g>
          ))}
          {NODES.map((n) => (
            <g key={n.id} transform={`translate(${n.x} ${n.y})`}>
              <rect width={W} height={H} rx="8" fill="#15171e" stroke="rgb(255 255 255 / 0.12)" />
              <rect width="3" height={H - 16} y="8" x="0" rx="1.5" style={{ fill: TONE[n.tone] }} />
              <text x="12" y="21" fill="#e4e4e7" fontSize="11" fontWeight="600">
                {n.title}
              </text>
              <text x="12" y="37" fill="#71717a" fontSize="9.5">
                {n.sub}
              </text>
              {n.id !== 'http' && <circle cx="0" cy={H / 2} r="3.5" fill="#0b0c10" style={{ stroke: TONE[n.tone] }} strokeWidth="1.5" />}
              {n.id !== 'respond' && <circle cx={W} cy={H / 2} r="3.5" style={{ fill: TONE[n.tone] }} />}
            </g>
          ))}
        </svg>
      </div>

      <div className="ml-auto w-[88%] rounded-xl border border-line bg-black/60 p-4 font-mono text-[12px] leading-6 shadow-xl shadow-black/40 backdrop-blur animate-float">
        <div className="text-zinc-500">
          <span className="text-accent">$</span> kinoesis generate <span className="text-zinc-300">--lang go</span>
        </div>
        <div className="text-zinc-400">
          <span className="text-accent">✓</span> 4 nodes → <span className="text-zinc-200">main.go</span> (38 lines)
        </div>
        <div className="text-zinc-500">
          <span className="text-accent">$</span> kinoesis deploy <span className="text-zinc-300">orders-api</span>
        </div>
        <div className="text-zinc-400">
          <span className="text-accent">✓</span> live at <span className="text-accent-2">https://orders-api.kinoesis.run</span>
        </div>
        <span className="inline-block h-4 w-2 translate-y-0.5 animate-blink bg-accent" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Business: workflow run + KPIs                                       */
/* ------------------------------------------------------------------ */

const STEPS = [
  { icon: ShoppingBag, app: 'Shopify', action: 'New order received', color: 'from-lime-400 to-emerald-500', time: 'trigger' },
  { icon: Database, app: 'HubSpot', action: 'Enrich customer record', color: 'from-orange-400 to-rose-500', time: '182 ms' },
  { icon: MessageSquare, app: 'Slack', action: 'Notify #sales-wins', color: 'from-fuchsia-400 to-violet-500', time: '96 ms' },
  { icon: Sheet, app: 'Google Sheets', action: 'Append row to Q4 tracker', color: 'from-emerald-400 to-teal-500', time: '240 ms' },
  { icon: Mail, app: 'Gmail', action: 'Send thank-you email', color: 'from-sky-400 to-indigo-500', time: '310 ms' },
];

const BARS = [38, 52, 44, 68, 60, 82, 74];

export function BusinessVisual() {
  return (
    <div className="relative mx-auto max-w-xl">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-violet-950/40 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Order-to-cash automation</div>
            <div className="text-xs text-zinc-500">Sales Ops · runs on every new order</div>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
            ● Active
          </span>
        </div>
        <ol className="relative space-y-2.5">
          <div className="absolute top-5 bottom-5 left-[19px] w-px bg-gradient-to-b from-accent/60 via-accent-2/40 to-transparent" />
          {STEPS.map(({ icon: Icon, app, action, color, time }) => (
            <li key={app} className="relative flex items-center gap-3 rounded-xl border border-white/[0.06] bg-ink-900/60 px-3 py-2.5">
              <span className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-white shadow-md`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-zinc-100">{action}</div>
                <div className="text-[11px] text-zinc-500">{app}</div>
              </div>
              <span className="text-[11px] text-zinc-500 tabular-nums">{time}</span>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            </li>
          ))}
        </ol>
      </div>

      <div className="absolute -right-4 -bottom-10 w-52 animate-float rounded-2xl border border-white/10 bg-ink-850/90 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl xl:-right-8">
        <div className="text-[11px] text-zinc-500">Tasks automated · 7d</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-white tabular-nums">12,480</span>
          <span className="flex items-center gap-0.5 text-[11px] font-medium text-emerald-400">
            <TrendingUp className="h-3 w-3" /> 18%
          </span>
        </div>
        <div className="mt-3 flex h-10 items-end gap-1.5">
          {BARS.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-gradient-to-t from-accent/40 to-accent-2"
              style={{ height: `${h}%`, opacity: 0.45 + i * 0.08 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

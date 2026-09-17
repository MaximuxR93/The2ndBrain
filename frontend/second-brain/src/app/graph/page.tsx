"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  forceSimulation, forceLink, forceManyBody,
  forceCenter, forceCollide, SimulationNodeDatum,
} from "d3-force";
import { useStore } from "@/store/useStore";
import { buildGraph, GraphNode, GraphEdge } from "@/lib/graph";
import {
  Network, ZoomIn, ZoomOut, Maximize2,
  FileText, MessageSquare, Hash, Tag,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SimNode extends GraphNode, SimulationNodeDatum {
  x: number; y: number; vx: number; vy: number; fx: number | null; fy: number | null;
}
interface SimEdge { source: SimNode; target: SimNode; weight: number; }

// ── Constants ─────────────────────────────────────────────────────────────────
const EXT_COLOR: Record<string, string> = {
  ".pdf":  "#EF4444",
  ".docx": "#3B82F6",
  ".txt":  "#7E8090",
  ".csv":  "#22C55E",
  ".md":   "#F59E0B",
};
const EXT_LABEL: Record<string, string> = {
  ".pdf": "PDF", ".docx": "DOCX", ".txt": "TXT", ".csv": "CSV", ".md": "MD",
};
const ACCENT = "#7C5CFC";

function nodeRadius(wordCount: number): number {
  return Math.max(8, Math.min(22, 8 + Math.sqrt(wordCount) * 0.06));
}
function nodeColor(fileType: string) {
  return EXT_COLOR[fileType] ?? "#7E8090";
}
function fmtWords(n?: number) {
  if (!n) return "0";
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GraphPage() {
  const { documents, selectDoc, selectedDoc } = useStore();
  const router = useRouter();

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const simRef     = useRef<any>(null);
  const nodesRef   = useRef<SimNode[]>([]);
  const edgesRef   = useRef<SimEdge[]>([]);
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const dragState  = useRef<{ node: SimNode | null; panX: number; panY: number; isPan: boolean }>({
    node: null, panX: 0, panY: 0, isPan: false,
  });

  const [tooltip, setTooltip] = useState<{ node: SimNode; px: number; py: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  // ── Canvas-space → world-space conversion ──────────────────────────────────
  const toWorld = useCallback((cx: number, cy: number) => {
    const { x, y, scale } = transformRef.current;
    return { wx: (cx - x) / scale, wy: (cy - y) / scale };
  }, []);

  // ── Find node under pointer ─────────────────────────────────────────────────
  const hitTest = useCallback((cx: number, cy: number): SimNode | null => {
    const { wx, wy } = toWorld(cx, cy);
    return (
      nodesRef.current.find((n) => {
        const r = nodeRadius(n.wordCount) + 4;
        return Math.hypot(n.x - wx, n.y - wy) < r;
      }) ?? null
    );
  }, [toWorld]);

  // ── Render loop ────────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const { x: tx, y: ty, scale: ts } = transformRef.current;
    const W = canvas.width, H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Background dot grid
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.025)";
    const gridSize = 28 * ts;
    const offX = ((tx % gridSize) + gridSize) % gridSize;
    const offY = ((ty % gridSize) + gridSize) % gridSize;
    for (let gx = offX; gx < W; gx += gridSize) {
      for (let gy = offY; gy < H; gy += gridSize) {
        ctx.beginPath(); ctx.arc(gx, gy, 0.9, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();

    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(ts, ts);

    const visibleNodes = activeFilters.size === 0
      ? nodesRef.current
      : nodesRef.current.filter((n) => activeFilters.has(n.fileType));

    const visibleIds = new Set(visibleNodes.map((n) => n.id));

    // ── Edges ──
    edgesRef.current.forEach((e) => {
      if (!visibleIds.has(e.source.id) || !visibleIds.has(e.target.id)) return;
      const alpha = Math.min(0.65, 0.15 + e.weight * 0.8);
      ctx.save();
      ctx.strokeStyle = `rgba(124,92,252,${alpha})`;
      ctx.lineWidth = 1 + e.weight * 3.5;
      ctx.lineCap = "round";
      // Slight curve
      const mx = (e.source.x + e.target.x) / 2;
      const my = (e.source.y + e.target.y) / 2 - 20;
      ctx.beginPath();
      ctx.moveTo(e.source.x, e.source.y);
      ctx.quadraticCurveTo(mx, my, e.target.x, e.target.y);
      ctx.stroke();
      ctx.restore();
    });

    // ── Nodes ──
    visibleNodes.forEach((n) => {
      const r = nodeRadius(n.wordCount);
      const isSelected = n.id === selectedId;
      const isOrphan = n.connections === 0;
      const color = nodeColor(n.fileType);

      // Outer glow for selected
      if (isSelected) {
        const grad = ctx.createRadialGradient(n.x, n.y, r, n.x, n.y, r + 20);
        grad.addColorStop(0, "rgba(124,92,252,0.5)");
        grad.addColorStop(1, "rgba(124,92,252,0)");
        ctx.beginPath(); ctx.arc(n.x, n.y, r + 20, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
      }

      // Connection ring glow (non-orphan)
      if (!isOrphan && !isSelected) {
        const grad = ctx.createRadialGradient(n.x, n.y, r - 2, n.x, n.y, r + 10);
        grad.addColorStop(0, color + "50");
        grad.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(n.x, n.y, r + 10, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
      }

      // Main circle
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isOrphan ? color + "60" : color;
      ctx.fill();

      // Inner highlight
      ctx.beginPath(); ctx.arc(n.x, n.y - r * 0.25, r * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.fill();

      // Selected ring
      if (isSelected) {
        ctx.beginPath(); ctx.arc(n.x, n.y, r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = ACCENT; ctx.lineWidth = 2.5; ctx.stroke();
      }

      // Label
      const label = n.name.replace(/\.[^/.]+$/, "");
      const fontSize = Math.max(10, Math.min(13, 10 + ts));
      ctx.font = `500 ${fontSize}px Satoshi, Inter, sans-serif`;
      ctx.fillStyle = isSelected ? "#FFFFFF" : isOrphan ? "#5A5C6A" : "#C4C5D0";
      ctx.textAlign = "center";
      ctx.fillText(
        label.length > 20 ? label.slice(0, 18) + "…" : label,
        n.x, n.y + r + 14
      );
    });

    ctx.restore();
    rafRef.current = requestAnimationFrame(render);
  }, [selectedId, activeFilters]);

  // ── Build / rebuild simulation ─────────────────────────────────────────────
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    simRef.current?.stop();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width = canvas.clientWidth;
    const H = canvas.height = canvas.clientHeight;

    if (documents.length === 0) {
      nodesRef.current = []; edgesRef.current = [];
      setStats({ nodes: 0, edges: 0 });
      rafRef.current = requestAnimationFrame(render);
      return;
    }

    const { nodes, edges } = buildGraph(documents);

    // Seed positions in a circle so nodes don't stack
    const simNodes: SimNode[] = nodes.map((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      const r = Math.min(W, H) * 0.3;
      return {
        ...n, x: W / 2 + r * Math.cos(angle), y: H / 2 + r * Math.sin(angle),
        vx: 0, vy: 0, fx: null, fy: null,
      } as SimNode;
    });

    const simEdges = edges.map((e) => ({
      source: simNodes.find((n) => n.id === e.source)!,
      target: simNodes.find((n) => n.id === e.target)!,
      weight: e.weight,
    })).filter((e) => e.source && e.target) as SimEdge[];

    nodesRef.current = simNodes;
    edgesRef.current = simEdges;
    setStats({ nodes: simNodes.length, edges: simEdges.length });

    const sim = forceSimulation<SimNode>(simNodes)
      .force("link", forceLink<SimNode, SimEdge>(simEdges)
        .id((d: SimNode) => d.id)
        .distance((e: SimEdge) => 160 - e.weight * 80)
        .strength(0.6)
      )
      .force("charge", forceManyBody<SimNode>().strength((d: SimNode) => -200 - d.connections * 30))
      .force("center", forceCenter<SimNode>(W / 2, H / 2).strength(0.05))
      .force("collide", forceCollide<SimNode>().radius((d: SimNode) => nodeRadius(d.wordCount) + 18));

    simRef.current = sim;
    rafRef.current = requestAnimationFrame(render);

    return () => {
      sim.stop();
      cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents]);

  // Restart render when selectedId/filters change
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  // ── Canvas resize ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // ── Pointer events ─────────────────────────────────────────────────────────
  const getCanvasXY = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { cx: e.clientX - rect.left, cy: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.MouseEvent) => {
    const { cx, cy } = getCanvasXY(e);
    const hit = hitTest(cx, cy);
    if (hit) {
      hit.fx = hit.x; hit.fy = hit.y;
      dragState.current = { node: hit, panX: cx, panY: cy, isPan: false };
      simRef.current?.alphaTarget(0.1).restart();
    } else {
      dragState.current = { node: null, panX: cx, panY: cy, isPan: true };
    }
    setTooltip(null);
  };

  const onPointerMove = (e: React.MouseEvent) => {
    const { cx, cy } = getCanvasXY(e);
    const ds = dragState.current;

    if (ds.node) {
      const { wx, wy } = toWorld(cx, cy);
      ds.node.fx = wx; ds.node.fy = wy;
      setTooltip(null);
    } else if (ds.isPan) {
      transformRef.current.x += cx - ds.panX;
      transformRef.current.y += cy - ds.panY;
      ds.panX = cx; ds.panY = cy;
    } else {
      // Hover — show tooltip
      const hit = hitTest(cx, cy);
      if (hit) setTooltip({ node: hit, px: cx, py: cy });
      else setTooltip(null);
    }
  };

  const onPointerUp = (e: React.MouseEvent) => {
    const ds = dragState.current;
    if (ds.node && !e.movementX && !e.movementY) {
      // Click: select doc + navigate
      setSelectedId(ds.node.id);
      selectDoc(documents.find((d) => d.id === ds.node!.id) ?? null);
    }
    if (ds.node) {
      // Unpin after drag ends
      ds.node.fx = null; ds.node.fy = null;
      simRef.current?.alphaTarget(0);
    }
    dragState.current = { node: null, panX: 0, panY: 0, isPan: false };
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const { cx, cy } = getCanvasXY(e as unknown as React.MouseEvent);
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const t = transformRef.current;
    const newScale = Math.max(0.2, Math.min(4, t.scale * delta));
    t.x = cx - (cx - t.x) * (newScale / t.scale);
    t.y = cy - (cy - t.y) * (newScale / t.scale);
    t.scale = newScale;
  };

  const onDblClick = () => {
    transformRef.current = { x: 0, y: 0, scale: 1 };
  };

  const zoom = (dir: 1 | -1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const delta = dir > 0 ? 1.25 : 0.8;
    const t = transformRef.current;
    const newScale = Math.max(0.2, Math.min(4, t.scale * delta));
    t.x = cx - (cx - t.x) * (newScale / t.scale);
    t.y = cy - (cy - t.y) * (newScale / t.scale);
    t.scale = newScale;
  };

  const toggleFilter = (ext: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(ext)) next.delete(ext); else next.add(ext);
      return next;
    });
  };

  // File types actually present
  const presentTypes = [...new Set(documents.map((d) => d.fileType))];

  const selDoc = selectedId ? documents.find((d) => d.id === selectedId) : null;
  const selNode = selectedId ? nodesRef.current.find((n) => n.id === selectedId) : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden select-none" style={{ background: "#07070C" }}>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={() => { dragState.current.isPan = false; setTooltip(null); }}
        onWheel={onWheel}
        onDoubleClick={onDblClick}
      />

      {/* ── Top-left: Title + stats ── */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
          style={{ background: "rgba(10,10,18,0.85)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(124,92,252,0.15)", border: "1px solid rgba(124,92,252,0.25)" }}>
            <Network size={14} strokeWidth={1.8} className="text-[#7C5CFC]" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white tracking-[-0.02em] leading-none">Knowledge Graph</p>
            <p className="text-[10px] text-[#5A5C6A] mt-0.5">
              {stats.nodes} nodes · {stats.edges} edges
            </p>
          </div>
        </div>
      </div>

      {/* ── Top-right: Zoom + Filters ── */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-3">
        {/* Zoom controls */}
        <div className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: "rgba(10,10,18,0.85)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={() => zoom(1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7E8090] hover:text-white hover:bg-white/[0.06] transition-all"
            title="Zoom in">
            <ZoomIn size={14} strokeWidth={1.8} />
          </button>
          <button onClick={() => zoom(-1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7E8090] hover:text-white hover:bg-white/[0.06] transition-all"
            title="Zoom out">
            <ZoomOut size={14} strokeWidth={1.8} />
          </button>
          <button onClick={onDblClick}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7E8090] hover:text-white hover:bg-white/[0.06] transition-all"
            title="Reset view">
            <Maximize2 size={14} strokeWidth={1.8} />
          </button>
        </div>

        {/* File-type filters */}
        {presentTypes.length > 1 && (
          <div className="flex flex-col gap-1.5 p-2 rounded-xl"
            style={{ background: "rgba(10,10,18,0.85)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-[9px] font-bold text-[#3A3C4A] uppercase tracking-[0.12em] px-1 mb-0.5">Filter</p>
            {presentTypes.map((ext) => {
              const active = activeFilters.has(ext);
              return (
                <button key={ext} onClick={() => toggleFilter(ext)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all text-[11px] font-semibold"
                  style={{
                    background: active ? EXT_COLOR[ext] + "22" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${active ? EXT_COLOR[ext] + "55" : "rgba(255,255,255,0.06)"}`,
                    color: active ? EXT_COLOR[ext] : "#5A5C6A",
                  }}>
                  <span className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: EXT_COLOR[ext] ?? "#7E8090" }} />
                  {EXT_LABEL[ext] ?? ext}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Bottom-left: Legend ── */}
      <div className="absolute bottom-4 left-4 z-10 p-3 rounded-xl"
        style={{ background: "rgba(10,10,18,0.85)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-[9px] font-bold text-[#3A3C4A] uppercase tracking-[0.12em] mb-2">Legend</p>
        <div className="space-y-1.5">
          {Object.entries(EXT_LABEL).map(([ext, label]) => (
            <div key={ext} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: EXT_COLOR[ext] }} />
              <span className="text-[11px] text-[#5A5C6A]">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/[0.05]">
            <span className="w-2.5 h-0.5 rounded shrink-0" style={{ background: "rgba(124,92,252,0.6)" }} />
            <span className="text-[11px] text-[#5A5C6A]">Similarity edge</span>
          </div>
        </div>
      </div>

      {/* ── Bottom-right: Selected doc card ── */}
      {selDoc && selNode && (
        <div className="absolute bottom-4 right-4 z-10 w-64 p-4 rounded-2xl animate-fade-in"
          style={{ background: "rgba(10,10,18,0.92)", backdropFilter: "blur(24px)", border: "1px solid rgba(124,92,252,0.22)", boxShadow: "0 0 30px rgba(124,92,252,0.10), 0 8px 32px rgba(0,0,0,0.5)" }}>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: nodeColor(selDoc.fileType) + "22", border: `1px solid ${nodeColor(selDoc.fileType)}44` }}>
              <FileText size={14} strokeWidth={1.8} style={{ color: nodeColor(selDoc.fileType) }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white truncate leading-tight"
                title={selDoc.name}>
                {selDoc.name.replace(/\.[^/.]+$/, "")}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] mt-0.5"
                style={{ color: nodeColor(selDoc.fileType) }}>
                {EXT_LABEL[selDoc.fileType] ?? selDoc.fileType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-3 text-[11px] text-[#5A5C6A]">
            <span className="flex items-center gap-1">
              <Hash size={10} strokeWidth={1.8} /> {fmtWords(selDoc.wordCount)} words
            </span>
            <span className="flex items-center gap-1">
              <Network size={10} strokeWidth={1.8} /> {selNode.connections} links
            </span>
          </div>

          {selNode.keywords.length > 0 && (
            <div className="mb-3">
              <p className="text-[9px] font-bold text-[#3A3C4A] uppercase tracking-[0.1em] mb-1.5 flex items-center gap-1">
                <Tag size={8} strokeWidth={1.8} /> Top Keywords
              </p>
              <div className="flex flex-wrap gap-1">
                {selNode.keywords.map((kw) => (
                  <span key={kw}
                    className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                    style={{ background: "rgba(124,92,252,0.12)", color: "#9B7DFF", border: "1px solid rgba(124,92,252,0.20)" }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => { selectDoc(selDoc); router.push("/chat"); }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[12px] font-bold text-white transition-all btn-primary"
          >
            <MessageSquare size={13} strokeWidth={1.8} /> Open in Chat
          </button>
        </div>
      )}

      {/* ── Hover Tooltip ── */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none px-3 py-2.5 rounded-xl shadow-xl"
          style={{
            left: tooltip.px + 16,
            top: tooltip.py - 10,
            background: "rgba(10,10,18,0.95)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${nodeColor(tooltip.node.fileType)}44`,
            boxShadow: `0 0 20px ${nodeColor(tooltip.node.fileType)}22`,
          }}>
          <p className="text-[12px] font-bold text-white leading-tight max-w-[180px] truncate">
            {tooltip.node.name.replace(/\.[^/.]+$/, "")}
          </p>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-[#5A5C6A]">
            <span className="flex items-center gap-1">
              <Hash size={9} /> {fmtWords(tooltip.node.wordCount)}w
            </span>
            <span className="flex items-center gap-1">
              <Network size={9} /> {tooltip.node.connections} links
            </span>
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {documents.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 pointer-events-none">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center animate-glow-pulse"
            style={{ background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.18)", boxShadow: "0 0 40px rgba(124,92,252,0.10)" }}>
            <Network size={32} strokeWidth={1.5} className="text-[#7C5CFC]/60" />
          </div>
          <div className="text-center">
            <p className="text-[16px] font-bold text-[#C4C5D0] tracking-[-0.02em]">No documents yet</p>
            <p className="text-[13px] text-[#5A5C6A] mt-2 max-w-xs leading-relaxed">
              Upload documents to see how they connect in your knowledge graph.
            </p>
          </div>
        </div>
      )}

      {/* ── Hint ── */}
      {documents.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <p className="text-[10px] text-[#3A3C4A] text-center"
            style={{ background: "rgba(10,10,18,0.7)", backdropFilter: "blur(12px)", padding: "4px 12px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.04)" }}>
            Scroll to zoom · Drag to pan · Click node to select · Double-click to reset
          </p>
        </div>
      )}
    </div>
  );
}
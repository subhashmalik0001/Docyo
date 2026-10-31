"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  assetUrl,
  COMPANION_CAPTIONS,
  DEMO_FILES,
  FILE_ACTION_TARGETS,
  type CompanionPhase,
  type DemoFileSpec,
  type WheelMode,
} from "@/config/site";
import { CheckIcon, DocyoMark, FileKindIcon, NotchMascot } from "@/components/Icons";

interface WedgeOption {
  id: string;
  label: string;
  sublabel: string;
  outputName: string;
  outputMeta: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy - r * Math.sin(angleRad),
  };
}

/**
 * Generates an annular wedge SVG path centered at (cx, cy) starting from 12 o'clock clockwise.
 */
function buildWedgePath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  index: number,
  count: number,
  gapPx = 5
): { path: string; midX: number; midY: number; unitX: number; unitY: number } {
  const slice = (Math.PI * 2) / count;
  const centerAngle = Math.PI / 2 - index * slice;
  const halfSlice = slice / 2;

  const gapOuter = gapPx / (2 * rOuter);
  const gapInner = gapPx / (2 * rInner);

  const aOuterStart = centerAngle + halfSlice - gapOuter;
  const aOuterEnd = centerAngle - halfSlice + gapOuter;
  const aInnerStart = centerAngle + halfSlice - gapInner;
  const aInnerEnd = centerAngle - halfSlice + gapInner;

  const p1 = polarToCartesian(cx, cy, rOuter, aOuterStart);
  const p2 = polarToCartesian(cx, cy, rOuter, aOuterEnd);
  const p3 = polarToCartesian(cx, cy, rInner, aInnerEnd);
  const p4 = polarToCartesian(cx, cy, rInner, aInnerStart);

  const largeArc = slice - gapOuter * 2 > Math.PI ? 1 : 0;

  const path = [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    "Z",
  ].join(" ");

  const labelRadius = rInner + (rOuter - rInner) * 0.54;
  const mid = polarToCartesian(cx, cy, labelRadius, centerAngle);

  return {
    path,
    midX: mid.x,
    midY: mid.y,
    unitX: Math.cos(centerAngle),
    unitY: -Math.sin(centerAngle),
  };
}

function hitTestWheel(
  clientX: number,
  clientY: number,
  svgEl: SVGSVGElement | null,
  count: number
): number | null {
  if (!svgEl || count <= 0) return null;
  const rect = svgEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const scale = 340 / rect.width;
  const dx = (clientX - cx) * scale;
  const dy = (cy - clientY) * scale; // mathematical y-up
  const dist = Math.hypot(dx, dy);

  if (dist < 56 || dist > 168) return null;

  const slice = (Math.PI * 2) / count;
  let angle = Math.atan2(dy, dx);
  if (angle < 0) angle += Math.PI * 2;

  let relative = Math.PI / 2 + slice / 2 - angle;
  while (relative < 0) relative += Math.PI * 2;
  while (relative >= Math.PI * 2) relative -= Math.PI * 2;

  return Math.min(count - 1, Math.floor(relative / slice));
}

const ALL_PHASES: CompanionPhase[] = [
  "watching",
  "received",
  "processing",
  "delivering",
  "success",
  "failed",
  "cancelled",
];

export function InteractiveStage() {
  const reduced = useReducedMotion();
  const [selectedFileId, setSelectedFileId] = useState<DemoFileSpec["id"]>("photo");
  const [mode, setMode] = useState<WheelMode>("convert");
  const [notchStyle, setNotchStyle] = useState<"black" | "glass">("black");
  const [hoveredWedge, setHoveredWedge] = useState<number | null>(null);
  const [phase, setPhase] = useState<CompanionPhase>("watching");
  const [progress, setProgress] = useState<number>(0);
  const [gaze, setGaze] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [result, setResult] = useState<{
    sourceName: string;
    outputName: string;
    outputMeta: string;
    actionLabel: string;
  } | null>({
    sourceName: "photo.heic",
    outputName: "photo.png",
    outputMeta: "6.1 MB · Lossless RGBA",
    actionLabel: "HEIC → PNG",
  });

  // Pointer drag state (desktop)
  const [dragState, setDragState] = useState<{
    file: DemoFileSpec;
    x: number;
    y: number;
  } | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const wheelSvgRef = useRef<SVGSVGElement>(null);
  const timersRef = useRef<number[]>([]);
  const wedgeRefs = useRef<(SVGGElement | null)[]>([]);

  const activeFile = useMemo(
    () => DEMO_FILES.find((f) => f.id === selectedFileId) ?? DEMO_FILES[0],
    [selectedFileId]
  );

  const wedges: WedgeOption[] = useMemo(() => {
    if (mode === "convert") {
      return activeFile.convertTargets.map((t) => ({
        id: `conv-${t.label}`,
        label: t.label,
        sublabel: `.${t.ext}`,
        outputName: `${activeFile.stem}.${t.ext}`,
        outputMeta: `${t.outSize} · Atomic write`,
      }));
    }
    if (mode === "tools") {
      return activeFile.toolTargets.map((t) => ({
        id: `tool-${t.label}`,
        label: t.label,
        sublabel: t.detail,
        outputName: `${activeFile.stem}-${t.suffix}.${t.ext}`,
        outputMeta: `${t.detail} · Original kept`,
      }));
    }
    return FILE_ACTION_TARGETS.map((a) => ({
      id: `act-${a.label}`,
      label: a.label,
      sublabel: a.detail,
      outputName:
        a.label === "DUPLICATE"
          ? `${activeFile.stem} 2.${activeFile.ext.toLowerCase()}`
          : `${activeFile.name}`,
      outputMeta: `${a.detail} (${a.resultSuffix})`,
    }));
  }, [activeFile, mode]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const runConversion = useCallback(
    (wedgeIndex: number, fileOverride?: DemoFileSpec) => {
      const file = fileOverride ?? activeFile;
      const chosen = wedges[wedgeIndex];
      if (!chosen) return;

      clearTimers();
      setPhase("received");
      setProgress(12);

      if (reduced) {
        setProgress(100);
        setPhase("success");
        setResult({
          sourceName: file.name,
          outputName: chosen.outputName,
          outputMeta: chosen.outputMeta,
          actionLabel: `${file.ext} → ${chosen.label}`,
        });
        return;
      }

      const t1 = window.setTimeout(() => {
        setPhase("processing");
        setProgress(48);
      }, 210);

      const t2 = window.setTimeout(() => {
        setProgress(78);
      }, 480);

      const t3 = window.setTimeout(() => {
        setPhase("delivering");
        setProgress(94);
      }, 760);

      const t4 = window.setTimeout(() => {
        setPhase("success");
        setProgress(100);
        setResult({
          sourceName: file.name,
          outputName: chosen.outputName,
          outputMeta: chosen.outputMeta,
          actionLabel: `${file.ext} → ${chosen.label}`,
        });
      }, 1020);

      const t5 = window.setTimeout(() => {
        setPhase("watching");
      }, 3400);

      timersRef.current = [t1, t2, t3, t4, t5];
    },
    [activeFile, clearTimers, reduced, wedges]
  );

  const cancelRunningJob = () => {
    clearTimers();
    setPhase("cancelled");
    setProgress(0);
    const t = window.setTimeout(() => setPhase("watching"), 2400);
    timersRef.current = [t];
  };

  // Track pointer across stage for mascot gaze + drag hit testing
  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const stageEl = stageRef.current;
    if (stageEl) {
      const rect = stageEl.getBoundingClientRect();
      const nx = ((e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2));
      const ny = ((e.clientY - (rect.top + 48)) / rect.height);
      setGaze({
        x: Math.max(-1, Math.min(1, nx)),
        y: Math.max(-1, Math.min(1, ny)),
      });
    }

    if (dragState) {
      const stageRect = stageRef.current?.getBoundingClientRect();
      if (stageRect) {
        setDragState((prev) =>
          prev
            ? {
                ...prev,
                x: e.clientX - stageRect.left,
                y: e.clientY - stageRect.top,
              }
            : null
        );
      }
      const hit = hitTestWheel(e.clientX, e.clientY, wheelSvgRef.current, wedges.length);
      setHoveredWedge(hit);
    }
  };

  const handleStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState) return;
    const hit = hitTestWheel(e.clientX, e.clientY, wheelSvgRef.current, wedges.length);
    const droppedFile = dragState.file;
    setDragState(null);
    if (hit !== null) {
      runConversion(hit, droppedFile);
    }
    setHoveredWedge(null);
  };

  const startFileDrag = (
    e: React.PointerEvent<HTMLButtonElement>,
    file: DemoFileSpec
  ) => {
    setSelectedFileId(file.id);
    if (e.pointerType === "touch") return; // Touch uses clean tap-to-convert flow
    const stageRect = stageRef.current?.getBoundingClientRect();
    if (!stageRect) return;
    setDragState({
      file,
      x: e.clientX - stageRect.left,
      y: e.clientY - stageRect.top,
    });
    if (phase !== "processing" && phase !== "delivering") {
      setPhase("watching");
    }
  };

  const handleWedgeKeyDown = (
    e: React.KeyboardEvent<SVGGElement>,
    idx: number
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      runConversion(idx);
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = (idx + 1) % wedges.length;
      setHoveredWedge(next);
      wedgeRefs.current[next]?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (idx - 1 + wedges.length) % wedges.length;
      setHoveredWedge(prev);
      wedgeRefs.current[prev]?.focus();
    }
  };

  const activeWedgeObj = hoveredWedge !== null ? wedges[hoveredWedge] : null;
  const notchExpanded =
    Boolean(dragState) ||
    hoveredWedge !== null ||
    phase !== "watching";

  const liveCaption =
    phase === "watching" && activeWedgeObj
      ? `Looking at ${activeWedgeObj.label}`
      : COMPANION_CAPTIONS[phase];

  const ringCircumference = 2 * Math.PI * 9;
  const ringOffset = ringCircumference * (1 - progress / 100);

  return (
    <section
      id="demo"
      aria-label="Interactive Radial Wheel and Notch Companion Demo"
      className="relative pb-20 sm:pb-28"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* Top control strip outside simulated screen */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Wheel modifier mode">
            {(
              [
                { key: "convert", kbd: "⇧ Shift", title: "Convert" },
                { key: "tools", kbd: "⌥⇧ Opt+Shift", title: "Tools" },
                { key: "actions", kbd: "⌃ Ctrl", title: "File Actions" },
              ] as const
            ).map((item) => {
              const active = mode === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setMode(item.key);
                    setHoveredWedge(null);
                  }}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[#7C3AED] ${
                    active
                      ? "border-[#7C3AED]/60 bg-[#7C3AED]/15 text-white"
                      : "border-white/[0.08] bg-[#111114] text-white/60 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <span className="font-mono text-[11px] text-[#A78BFA]">
                    {item.kbd}
                  </span>
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-white/40">
              Notch material:
            </span>
            <div className="inline-flex rounded-lg border border-white/[0.08] bg-[#111114] p-0.5">
              {(["black", "glass"] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setNotchStyle(style)}
                  className={`rounded-md px-2.5 py-1 font-mono text-[11px] capitalize transition-colors focus-visible:outline-2 focus-visible:outline-[#7C3AED] ${
                    notchStyle === style
                      ? "bg-[#17171B] text-white border border-white/[0.12]"
                      : "text-white/50 hover:text-white/80 border border-transparent"
                  }`}
                >
                  {style === "black" ? "Pure Black" : "Glass"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Simulated macOS Desktop Window */}
        <div
          ref={stageRef}
          onPointerMove={handleStagePointerMove}
          onPointerUp={handleStagePointerUp}
          onPointerCancel={() => {
            setDragState(null);
            setHoveredWedge(null);
          }}
          className={`relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111114] shadow-[0_30px_90px_rgba(0,0,0,0.65)] select-none ${
            dragState ? "cursor-grabbing" : ""
          }`}
        >
          {/* Subtle desktop grid background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] opacity-60"
          />

          {/* Simulated macOS Menu Bar + Centered Notch Companion */}
          <div className="relative z-20 flex h-11 items-center justify-between border-b border-white/[0.07] bg-[#0A0A0B]/90 px-4 text-[12px]">
            <div className="flex items-center gap-3 text-white/55">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-white/[0.16]" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/[0.16]" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/[0.16]" />
              </div>
              <span className="hidden sm:inline font-medium text-white/80">
                Finder
              </span>
              <span className="hidden md:inline text-white/40">File</span>
              <span className="hidden md:inline text-white/40">Edit</span>
              <span className="hidden md:inline text-white/40">View</span>
            </div>

            {/* MacBook Notch Companion HUD */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 max-w-[calc(100%-88px)]">
              <motion.div
                layout={!reduced}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className={`flex items-center gap-2.5 rounded-b-2xl px-3 py-1.5 sm:px-3.5 transition-colors ${
                  notchStyle === "black"
                    ? "bg-[#000000] border-x border-b border-white/[0.13] shadow-[0_10px_30px_rgba(0,0,0,0.85)]"
                    : "bg-[#17171B]/80 backdrop-blur-xl border-x border-b border-white/[0.2] shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                } ${notchExpanded ? "w-[228px] sm:w-auto sm:min-w-[310px]" : "w-[178px] sm:w-auto sm:min-w-[196px]"}`}
              >
                <NotchMascot
                  phase={phase}
                  gazeX={gaze.x}
                  gazeY={gaze.y}
                  size={30}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#A78BFA]">
                      {phase}
                    </span>
                  </div>
                  <p className="truncate text-[11.5px] font-medium text-white/90">
                    {liveCaption}
                  </p>
                </div>

                {/* Live Notch Progress Ring / Status */}
                <div className="flex items-center gap-1.5">
                  {(phase === "received" ||
                    phase === "processing" ||
                    phase === "delivering") && (
                    <>
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        className="-rotate-90"
                        aria-label={`Conversion progress ${progress}%`}
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          fill="none"
                          stroke="rgba(255,255,255,0.14)"
                          strokeWidth="2"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          fill="none"
                          stroke="#7C3AED"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray={ringCircumference}
                          strokeDashoffset={ringOffset}
                          className="transition-all duration-200"
                        />
                      </svg>
                      <button
                        type="button"
                        onClick={cancelRunningJob}
                        title="Cancel conversion"
                        aria-label="Cancel conversion"
                        className="rounded p-0.5 text-white/45 hover:bg-white/10 hover:text-white"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M3 3l6 6M9 3 3 9"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </>
                  )}
                  {phase === "success" && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#7C3AED]/25 text-[#A78BFA]">
                      <CheckIcon size={13} />
                    </span>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="flex items-center gap-2.5 font-mono text-[11px] text-white/55">
              <span className="inline-flex items-center gap-1 text-white/80">
                <DocyoMark size={14} />
                <span className="hidden sm:inline">Docyo</span>
              </span>
              <span className="hidden sm:inline text-white/30">LOCAL</span>
            </div>
          </div>

          {/* Main 3-zone Interactive Desktop Workspace */}
          <div className="relative z-10 grid gap-8 p-5 pt-11 sm:p-8 sm:pt-12 lg:grid-cols-12 lg:items-center">
            {/* Zone 1: Source Finder Files */}
            <div className="lg:col-span-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/45">
                  01 · Finder selection
                </span>
                <span className="hidden md:inline font-mono text-[11px] text-[#A78BFA]">
                  Drag onto wheel →
                </span>
                <span className="md:hidden font-mono text-[11px] text-[#A78BFA]">
                  Tap to select
                </span>
              </div>

              <div className="space-y-2.5">
                {DEMO_FILES.map((file) => {
                  const isSelected = file.id === activeFile.id;
                  const isDraggingThis = dragState?.file.id === file.id;
                  return (
                    <button
                      key={file.id}
                      type="button"
                      onPointerDown={(e) => startFileDrag(e, file)}
                      onClick={() => setSelectedFileId(file.id)}
                      className={`group flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all duration-200 cursor-grab active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-[#7C3AED] ${
                        isSelected
                          ? "border-[#7C3AED]/60 bg-[#17171B] shadow-[0_0_0_1px_rgba(124,58,237,0.2)]"
                          : "border-white/[0.08] bg-[#0A0A0B]/70 hover:border-white/20 hover:bg-[#17171B]/60"
                      } ${isDraggingThis ? "opacity-45 scale-[0.98]" : ""}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                            isSelected
                              ? "border-[#7C3AED]/50 bg-[#7C3AED]/15 text-[#A78BFA]"
                              : "border-white/[0.09] bg-[#111114] text-white/70"
                          }`}
                        >
                          <FileKindIcon kind={file.kind} size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-mono text-[13.5px] font-medium text-white">
                            {file.name}
                          </div>
                          <div className="font-mono text-[11px] text-white/45">
                            {file.size} · {file.meta}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`ml-2 shrink-0 rounded border px-2 py-0.5 font-mono text-[10px] ${
                          isSelected
                            ? "border-[#7C3AED]/40 bg-[#7C3AED]/15 text-[#A78BFA]"
                            : "border-white/[0.08] text-white/40 group-hover:text-white/70"
                        }`}
                      >
                        .{file.ext}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-3 text-[12px] leading-relaxed text-white/40">
                <span className="hidden md:inline">
                  Drag any file chip onto a wedge, or click a wedge directly.
                </span>
                <span className="md:hidden">
                  Tap a file chip above, then tap any wedge on the wheel to convert.
                </span>
              </p>
            </div>

            {/* Zone 2: Physical SVG Radial Wheel */}
            <div className="flex flex-col items-center justify-center lg:col-span-4">
              <div className="relative flex items-center justify-center">
                {/* Subtle ambient wheel halo */}
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute h-64 w-64 rounded-full transition-opacity duration-300 ${
                    dragState || hoveredWedge !== null
                      ? "opacity-100"
                      : "opacity-45"
                  }`}
                  style={{
                    background:
                      "radial-gradient(circle, rgba(124,58,237,0.22) 0%, rgba(124,58,237,0) 70%)",
                  }}
                />

                <svg
                  ref={wheelSvgRef}
                  viewBox="0 0 340 340"
                  role="group"
                  aria-label={`Docyo radial ${mode} wheel for ${activeFile.name}`}
                  className="relative z-10 h-[286px] w-[286px] sm:h-[328px] sm:w-[328px] overflow-visible"
                >
                  {/* Outer subtle guide ring */}
                  <circle
                    cx="170"
                    cy="170"
                    r="160"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1"
                    strokeDasharray="3 5"
                  />

                  {wedges.map((wedge, index) => {
                    const geom = buildWedgePath(
                      170,
                      170,
                      64,
                      150,
                      index,
                      wedges.length,
                      6
                    );
                    const isActive = hoveredWedge === index;
                    const tx = isActive ? geom.unitX * 5.5 : 0;
                    const ty = isActive ? geom.unitY * 5.5 : 0;

                    return (
                      <g
                        key={wedge.id}
                        ref={(el) => {
                          wedgeRefs.current[index] = el;
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`${mode === "convert" ? "Convert" : "Apply"} ${activeFile.name} to ${wedge.label}`}
                        onPointerEnter={() => setHoveredWedge(index)}
                        onPointerLeave={() => {
                          if (!dragState) setHoveredWedge(null);
                        }}
                        onClick={() => runConversion(index)}
                        onFocus={() => setHoveredWedge(index)}
                        onBlur={() => setHoveredWedge(null)}
                        onKeyDown={(e) => handleWedgeKeyDown(e, index)}
                        style={{
                          transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`,
                          transition: reduced
                            ? "none"
                            : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                        className="cursor-pointer focus:outline-none"
                      >
                        <path
                          d={geom.path}
                          fill={
                            isActive
                              ? "rgba(124, 58, 237, 0.30)"
                              : "rgba(23, 23, 27, 0.94)"
                          }
                          stroke={
                            isActive
                              ? "#A78BFA"
                              : "rgba(255, 255, 255, 0.11)"
                          }
                          strokeWidth={isActive ? 1.6 : 1}
                          className="transition-colors duration-150"
                        />
                        <text
                          x={geom.midX}
                          y={geom.midY - 3}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={isActive ? "#FFFFFF" : "rgba(255,255,255,0.86)"}
                          className="pointer-events-none font-mono text-[11.5px] font-semibold tracking-wider"
                        >
                          {wedge.label}
                        </text>
                        <text
                          x={geom.midX}
                          y={geom.midY + 11}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={
                            isActive ? "#A78BFA" : "rgba(255,255,255,0.38)"
                          }
                          className="pointer-events-none font-mono text-[9px]"
                        >
                          {mode === "convert" ? wedge.sublabel : ""}
                        </text>
                      </g>
                    );
                  })}

                  {/* Center Hub */}
                  <circle
                    cx="170"
                    cy="170"
                    r="54"
                    fill="#0A0A0B"
                    stroke={
                      activeWedgeObj || dragState
                        ? "rgba(124, 58, 237, 0.65)"
                        : "rgba(255, 255, 255, 0.12)"
                    }
                    strokeWidth="1.25"
                  />

                  {/* Center Hub Progress Ring */}
                  {(phase === "received" ||
                    phase === "processing" ||
                    phase === "delivering") && (
                    <circle
                      cx="170"
                      cy="170"
                      r="54"
                      fill="none"
                      stroke="#7C3AED"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 54}
                      strokeDashoffset={2 * Math.PI * 54 * (1 - progress / 100)}
                      transform="rotate(-90 170 170)"
                      className="transition-all duration-200"
                    />
                  )}

                  <image
                    href={assetUrl("/docyo-logo.webp")}
                    x="154"
                    y="128"
                    width="32"
                    height="32"
                    preserveAspectRatio="xMidYMid meet"
                  />
                  <text
                    x="170"
                    y="175"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    className="font-mono text-[11.5px] font-semibold"
                  >
                    {activeWedgeObj
                      ? `.${activeFile.ext} → ${activeWedgeObj.label}`
                      : activeFile.name}
                  </text>
                  <text
                    x="170"
                    y="191"
                    textAnchor="middle"
                    fill="#A78BFA"
                    className="font-mono text-[9.5px]"
                  >
                    {dragState
                      ? "Release on wedge"
                      : activeWedgeObj
                      ? "Click to run"
                      : mode === "convert"
                      ? "⇧ Shift wheel"
                      : mode === "tools"
                      ? "⌥⇧ Tools wheel"
                      : "⌃ Actions wheel"}
                  </text>
                </svg>
              </div>
            </div>

            {/* Zone 3: Non-Destructive Output Inspector */}
            <div className="lg:col-span-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/45">
                  02 · Local disk output
                </span>
                <span className="font-mono text-[11px] text-white/40">
                  ~/Desktop
                </span>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#0A0A0B]/85 p-4 space-y-3">
                {/* Untouched Original */}
                <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#111114]/70 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate font-mono text-[12.5px] text-white/75">
                      {result?.sourceName ?? activeFile.name}
                    </div>
                    <div className="font-mono text-[10.5px] text-white/40">
                      Original source file
                    </div>
                  </div>
                  <span className="shrink-0 rounded border border-white/[0.1] bg-[#17171B] px-2 py-0.5 font-mono text-[10px] text-white/60">
                    UNTOUCHED
                  </span>
                </div>

                {/* Arrow / pipeline indicator */}
                <div className="flex items-center gap-2 px-1 font-mono text-[10.5px] text-white/40">
                  <span className="h-px flex-1 bg-white/[0.08]" />
                  <span className="text-[#A78BFA]">
                    {phase === "processing" || phase === "delivering"
                      ? `Staging .docyo- (${progress}%)`
                      : result?.actionLabel ?? "Atomic sibling output"}
                  </span>
                  <span className="h-px flex-1 bg-white/[0.08]" />
                </div>

                {/* Converted Output Card */}
                <motion.div
                  key={result?.outputName ?? "pending"}
                  initial={reduced ? false : { opacity: 0.5, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center justify-between rounded-lg border border-[#7C3AED]/45 bg-[#7C3AED]/[0.09] px-3.5 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-mono text-[13.5px] font-semibold text-white">
                        {result?.outputName ?? "photo.png"}
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-[#A78BFA]">
                      {result?.outputMeta ?? "6.1 MB · Ready beside original"}
                    </div>
                  </div>

                  <div className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#7C3AED]/50 bg-[#7C3AED]/20 text-white">
                    <CheckIcon size={15} />
                  </div>
                </motion.div>
              </div>

              {/* Mascot 7-State Inspector */}
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between font-mono text-[10.5px] text-white/40">
                  <span>Preview Notch Mascot states:</span>
                  <span className="text-white/60">{phase}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {ALL_PHASES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        clearTimers();
                        setPhase(p);
                        setProgress(
                          p === "processing"
                            ? 62
                            : p === "delivering"
                            ? 90
                            : p === "success"
                            ? 100
                            : 0
                        );
                      }}
                      className={`rounded border px-2 py-0.5 font-mono text-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-[#7C3AED] ${
                        phase === p
                          ? "border-[#7C3AED]/60 bg-[#7C3AED]/20 text-white"
                          : "border-white/[0.07] bg-[#0A0A0B] text-white/45 hover:border-white/20 hover:text-white/80"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating Drag Ghost Chip (Desktop pointer drag) */}
          {dragState && (
            <div
              aria-hidden="true"
              style={{
                transform: `translate3d(${dragState.x - 74}px, ${dragState.y - 22}px, 0)`,
              }}
              className="pointer-events-none absolute left-0 top-0 z-30 flex items-center gap-2.5 rounded-xl border border-[#A78BFA] bg-[#17171B]/95 px-3.5 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.75)]"
            >
              <span className="text-[#A78BFA]">
                <FileKindIcon kind={dragState.file.kind} size={16} />
              </span>
              <span className="font-mono text-[12.5px] font-medium text-white">
                {dragState.file.name}
              </span>
              {activeWedgeObj && (
                <span className="rounded bg-[#7C3AED] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                  → {activeWedgeObj.label}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

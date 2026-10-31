"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { assetUrl, DOWNLOAD_CONFIG } from "@/config/site";
import { useHydratedReducedMotion } from "@/lib/useHydratedReducedMotion";
import { DocyoMark, DownloadIcon } from "@/components/Icons";

interface LaunchVideoModalProps {
  open: boolean;
  onClose: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const DURATION = 30; // 30-second 60fps Launch Film

const clamp = (v: number, a = 0, b = 1) => Math.min(Math.max(v, a), b);
const prog = (t: number, s: number, d: number) => clamp((t - s) / d);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 4);
const easeInOut = (x: number) => {
  const c = clamp(x);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
const spring = (x: number) => {
  const c = clamp(x);
  if (c === 0 || c === 1) return c;
  return 1 - Math.exp(-6.5 * c) * Math.cos(9 * c);
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  t: number,
  logo: HTMLImageElement | null
) {
  const W = 1920;
  const H = 1080;

  const drawGrid = (alpha: number, dark = false) => {
    ctx.save();
    ctx.strokeStyle = dark
      ? `rgba(10,10,11,${alpha})`
      : `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 64) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
    }
    for (let y = 0; y <= H; y += 64) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
    }
    ctx.stroke();
    ctx.restore();
  };

  const drawGlow = (cx: number, cy: number, r: number, alpha: number) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(124,58,237,${alpha})`);
    g.addColorStop(0.5, `rgba(124,58,237,${alpha * 0.3})`);
    g.addColorStop(1, "rgba(124,58,237,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  };

  const drawSquircleLogo = (
    cx: number,
    cy: number,
    size: number,
    sc: number,
    alpha: number
  ) => {
    const s = size * sc;
    if (s < 2 || alpha <= 0.01) return;
    drawGlow(cx, cy, s * 1.4, 0.28 * alpha);
    ctx.save();
    ctx.globalAlpha = alpha;
    roundRect(ctx, cx - s / 2, cy - s / 2, s, s, s * 0.24);
    ctx.fillStyle = "#111114";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(124,58,237,0.65)";
    ctx.stroke();
    if (logo && logo.complete && logo.naturalWidth > 0) {
      const p = s * 0.11;
      ctx.drawImage(logo, cx - s / 2 + p, cy - s / 2 + p, s - p * 2, s - p * 2);
    }
    ctx.restore();
  };

  const drawWedge = (
    cx: number,
    cy: number,
    rIn: number,
    rOut: number,
    idx: number,
    count: number,
    push: number,
    sc: number,
    label: string,
    sub: string,
    active: boolean
  ) => {
    if (sc <= 0.03) return;
    const slice = (Math.PI * 2) / count;
    const angle = -Math.PI / 2 + idx * slice;
    const ri = rIn * sc;
    const ro = rOut * sc;
    const gapO = 7 / (2 * ro);
    const gapI = 7 / (2 * ri);
    const ox = cx + Math.cos(angle) * push;
    const oy = cy + Math.sin(angle) * push;

    ctx.save();
    ctx.beginPath();
    ctx.arc(ox, oy, ro, angle - slice / 2 + gapO, angle + slice / 2 - gapO);
    ctx.arc(
      ox,
      oy,
      ri,
      angle + slice / 2 - gapI,
      angle - slice / 2 + gapI,
      true
    );
    ctx.closePath();
    ctx.fillStyle = active ? "rgba(124,58,237,0.36)" : "rgba(23,23,27,0.96)";
    ctx.fill();
    ctx.lineWidth = active ? 2.4 : 1.3;
    ctx.strokeStyle = active ? "#A78BFA" : "rgba(255,255,255,0.13)";
    ctx.stroke();

    if (sc > 0.6) {
      const lr = ri + (ro - ri) * 0.52;
      const lx = ox + Math.cos(angle) * lr;
      const ly = oy + Math.sin(angle) * lr;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "600 16px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = active ? "#FFFFFF" : "rgba(255,255,255,0.88)";
      ctx.fillText(label, lx, ly - (sub ? 7 : 0));
      if (sub) {
        ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillStyle = active ? "#A78BFA" : "rgba(255,255,255,0.42)";
        ctx.fillText(sub, lx, ly + 11);
      }
    }
    ctx.restore();
  };

  // ACT 1 (0 - 4.2s): Hook + Official Penguin Reveal + "Drag. Hold Shift. Convert."
  if (t < 4.2) {
    ctx.fillStyle = "#0A0A0B";
    ctx.fillRect(0, 0, W, H);
    drawGrid(0.032);

    if (t < 1.35) {
      const a = easeOut(prog(t, 0.05, 0.45)) * (1 - easeInOut(prog(t, 1.05, 0.28)));
      drawGlow(960, 520, 560, 0.18 * a);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.textAlign = "center";
      ctx.font = "600 16px ui-monospace, SFMono-Regular, monospace";
      ctx.fillStyle = "#A78BFA";
      ctx.fillText("WHY UPLOAD PRIVATE FILES TO THE CLOUD", 960, 465);
      ctx.font = "600 62px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("Just to change four letters after a dot?", 960, 535);
      ctx.restore();
    } else {
      const lt = t - 1.35;
      const pop = spring(prog(lt, 0, 0.6));
      const a = easeOut(prog(lt, 0, 0.35));
      drawSquircleLogo(960, 278, 152, 0.72 + 0.28 * pop, a);

      ctx.save();
      ctx.textAlign = "center";
      ctx.globalAlpha = easeOut(prog(lt, 0.18, 0.4));
      ctx.font = "600 14px ui-monospace, SFMono-Regular, monospace";
      ctx.fillStyle = "#A78BFA";
      ctx.fillText(
        `DOCYO v${DOWNLOAD_CONFIG.version}  ·  LOCAL-FIRST FILE CONVERTER & TOOLKIT`,
        960,
        408
      );

      const b1 = easeOut(prog(lt, 0.38, 0.42));
      const b2 = easeOut(prog(lt, 0.74, 0.42));
      const b3 = easeOut(prog(lt, 1.1, 0.42));
      ctx.font = "700 108px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      const w1 = "Drag. ";
      const w2 = "Hold Shift. ";
      const w3 = "Convert.";
      const m1 = ctx.measureText(w1).width;
      const m2 = ctx.measureText(w2).width;
      const m3 = ctx.measureText(w3).width;
      const sx = 960 - (m1 + m2 + m3) / 2;

      ctx.globalAlpha = b1;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(w1, sx, 558 + (1 - b1) * 34);

      ctx.globalAlpha = b2;
      ctx.fillStyle = "#A78BFA";
      ctx.fillText(w2, sx + m1, 558 + (1 - b2) * 34);

      ctx.globalAlpha = b3;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(w3, sx + m1 + m2, 558 + (1 - b3) * 34);

      const sp = easeOut(prog(lt, 1.45, 0.45));
      ctx.globalAlpha = sp * 0.62;
      ctx.textAlign = "center";
      ctx.font = "400 26px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(
        "Private. Offline. Non-destructive. Zero cloud uploads, zero accounts, zero telemetry.",
        960,
        645
      );
      ctx.restore();
    }
  }
  // ACT 2 (4.2 - 11.8s): Desktop Drag -> Shift Radial Wheel -> Notch Companion -> Atomic PNG
  else if (t < 11.8) {
    const lt = t - 4.2;
    ctx.fillStyle = "#0A0A0B";
    ctx.fillRect(0, 0, W, H);
    drawGrid(0.025);
    drawGlow(960, 540, 720, 0.18);

    // Desktop frame
    const wx = 130;
    const wy = 90;
    const ww = 1660;
    const wh = 900;
    roundRect(ctx, wx, wy, ww, wh, 26);
    ctx.fillStyle = "#111114";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.stroke();

    // Menu bar
    ctx.fillStyle = "#0A0A0B";
    roundRect(ctx, wx + 2, wy + 2, ww - 4, 52, 24);
    ctx.fill();
    ctx.font = "500 15px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.textAlign = "left";
    ctx.fillText("Finder    File    Edit    View", wx + 36, wy + 33);

    const dropped = lt >= 3.8;
    const hoverPng = lt >= 2.35 && !dropped;
    const convP = clamp((lt - 3.85) / 1.6);
    const done = lt >= 5.45;

    // MacBook Notch Companion
    const nExp = easeOut(prog(lt, 1.35, 0.42));
    const nw = lerp(220, 420, nExp);
    const nh = lerp(42, 62, nExp);
    roundRect(ctx, 960 - nw / 2, wy, nw, nh, 18);
    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = done ? "rgba(124,58,237,0.75)" : "rgba(255,255,255,0.16)";
    ctx.stroke();

    if (logo && logo.complete) {
      ctx.drawImage(logo, 960 - nw / 2 + 16, wy + nh / 2 - 18, 36, 36);
    }
    ctx.font = "600 11px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = "#A78BFA";
    ctx.fillText(
      done
        ? "SUCCESS"
        : dropped
        ? "PROCESSING"
        : lt >= 1.35
        ? "WATCHING"
        : "READY",
      960 - nw / 2 + 62,
      wy + 23
    );
    ctx.font = "500 14px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(
      done
        ? "Done. photo.png is ready."
        : dropped
        ? `Encoding lossless PNG (${Math.round(convP * 100)}%)`
        : hoverPng
        ? "Looking at PNG (.png)"
        : "Docyo Notch Companion",
      960 - nw / 2 + 62,
      wy + 44
    );

    // Left Finder cards
    const files = [
      ["photo.heic", "4.2 MB · 4032 × 3024", ".HEIC"],
      ["report.pdf", "11.8 MB · 24 pages", ".PDF"],
      ["clip.mov", "38.0 MB · 4K 60fps", ".MOV"],
    ];
    ctx.font = "600 12px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText("01 · FINDER SELECTION", wx + 58, wy + 135);

    files.forEach(([name, meta, ext], i) => {
      const cy = wy + 160 + i * 102;
      roundRect(ctx, wx + 58, cy, 400, 84, 16);
      ctx.fillStyle = i === 0 ? "#17171B" : "#0A0A0B";
      ctx.fill();
      ctx.lineWidth = i === 0 ? 1.8 : 1.2;
      ctx.strokeStyle =
        i === 0 ? "rgba(124,58,237,0.65)" : "rgba(255,255,255,0.08)";
      ctx.stroke();

      ctx.font = "600 17px ui-monospace, SFMono-Regular, monospace";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(name, wx + 82, cy + 34);
      ctx.font = "400 13px ui-monospace, SFMono-Regular, monospace";
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillText(meta, wx + 82, cy + 59);
      ctx.fillStyle = i === 0 ? "#A78BFA" : "rgba(255,255,255,0.4)";
      ctx.fillText(ext, wx + 392, cy + 46);
    });

    // Shift badge
    if (lt >= 1.25) {
      roundRect(ctx, wx + 58, wy + wh - 115, 320, 62, 14);
      ctx.fillStyle = !dropped ? "rgba(124,58,237,0.2)" : "#0A0A0B";
      ctx.fill();
      ctx.strokeStyle = !dropped ? "#A78BFA" : "rgba(255,255,255,0.14)";
      ctx.stroke();
      ctx.font = "600 14px ui-monospace, SFMono-Regular, monospace";
      ctx.fillStyle = "#A78BFA";
      ctx.fillText(
        !dropped ? "⇧ SHIFT HELD — WHEEL ACTIVE" : "✓ DROPPED ON PNG",
        wx + 80,
        wy + wh - 79
      );
    }

    // Center Radial Wheel
    const wcx = 960;
    const wcy = 555;
    const wedges = [
      ["PNG", ".png"],
      ["JPEG", ".jpg"],
      ["WEBP", ".webp"],
      ["AVIF", ".avif"],
      ["PDF", ".pdf"],
      ["TIFF", ".tiff"],
    ];
    if (lt >= 1.3) {
      drawGlow(wcx, wcy, 250, 0.24);
      wedges.forEach(([lbl, sub], i) => {
        const sc = spring(prog(lt, 1.3 + i * 0.035, 0.48));
        const act = i === 0 && (hoverPng || (dropped && lt < 5.7));
        drawWedge(
          wcx,
          wcy,
          82,
          190,
          i,
          6,
          act ? 11 : 0,
          sc,
          lbl,
          sub,
          act
        );
      });
    }

    // Center hub
    ctx.beginPath();
    ctx.arc(wcx, wcy, 68, 0, Math.PI * 2);
    ctx.fillStyle = "#0A0A0B";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle =
      hoverPng || dropped ? "rgba(124,58,237,0.75)" : "rgba(255,255,255,0.16)";
    ctx.stroke();

    if (dropped && !done) {
      ctx.beginPath();
      ctx.arc(
        wcx,
        wcy,
        68,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * convP
      );
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "#7C3AED";
      ctx.stroke();
    }
    if (logo && logo.complete) {
      ctx.drawImage(logo, wcx - 22, wcy - 44, 44, 44);
    }
    ctx.textAlign = "center";
    ctx.font = "600 13px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(hoverPng || dropped ? ".HEIC → PNG" : "photo.heic", wcx, wcy + 18);
    ctx.fillStyle = "#A78BFA";
    ctx.font = "500 11.5px ui-monospace, SFMono-Regular, monospace";
    ctx.fillText(
      done ? "Saved ✓" : dropped ? `${Math.round(convP * 100)}%` : "⇧ Shift",
      wcx,
      wcy + 37
    );

    // Right Output Card
    const rx = wx + ww - 458;
    ctx.textAlign = "left";
    ctx.font = "600 12px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText("02 · LOCAL DISK OUTPUT", rx, wy + 135);

    roundRect(ctx, rx, wy + 160, 400, 270, 18);
    ctx.fillStyle = "#0A0A0B";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.stroke();

    roundRect(ctx, rx + 20, wy + 182, 360, 78, 13);
    ctx.fillStyle = "#111114";
    ctx.fill();
    ctx.font = "600 16px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText("photo.heic", rx + 38, wy + 215);
    ctx.font = "500 11.5px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText("Original untouched", rx + 38, wy + 240);

    roundRect(ctx, rx + 20, wy + 312, 360, 96, 14);
    ctx.fillStyle = done ? "rgba(124,58,237,0.16)" : "#111114";
    ctx.fill();
    ctx.lineWidth = done ? 2 : 1;
    ctx.strokeStyle = done ? "#7C3AED" : "rgba(255,255,255,0.08)";
    ctx.stroke();
    ctx.font = "600 19px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = done ? "#FFFFFF" : "rgba(255,255,255,0.5)";
    ctx.fillText(
      done ? "photo.png ✓" : dropped ? ".docyo-stage.tmp" : "Waiting…",
      rx + 38,
      wy + 354
    );
    ctx.font = "500 12.5px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = done ? "#A78BFA" : "rgba(255,255,255,0.38)";
    ctx.fillText(
      done ? "6.1 MB · Lossless RGBA · Atomic write" : "Sibling output",
      rx + 38,
      wy + 382
    );

    // Dragged ghost chip
    if (lt >= 1.1 && !dropped) {
      const p1 = easeInOut(prog(lt, 1.1, 1.0));
      const p2 = easeInOut(prog(lt, 2.15, 0.7));
      const gx = lt < 2.15 ? lerp(wx + 260, wcx, p1) : lerp(wcx, wcx, p2);
      const gy = lt < 2.15 ? lerp(wy + 200, wcy, p1) : lerp(wcy, wcy - 136, p2);
      roundRect(ctx, gx - 95, gy - 24, 190, 46, 12);
      ctx.fillStyle = "#17171B";
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = "#A78BFA";
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.font = "600 14px ui-monospace, SFMono-Regular, monospace";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(hoverPng ? "photo.heic → PNG" : "photo.heic", gx, gy + 5);
    }
  }
  // ACT 3 (11.8 - 17.4s): 176 Conversion Routes & 25 Single-Purpose Tools
  else if (t < 17.4) {
    const lt = t - 11.8;
    ctx.fillStyle = "#0A0A0B";
    ctx.fillRect(0, 0, W, H);
    drawGrid(0.03);
    drawGlow(1380, 320, 680, 0.2);

    const count = Math.round(176 * easeOut(prog(lt, 0, 0.85)));
    ctx.textAlign = "left";
    ctx.font = "600 14px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = "#A78BFA";
    ctx.fillText("01 / 176 CONVERSION ROUTES  ·  25 BUILT-IN TOOLS", 110, 110);

    ctx.font = "700 138px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${count}`, 110, 248);

    ctx.font = "600 46px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.fillText("local routes + 25 focused media & PDF tools.", 410, 188);
    ctx.font = "400 24px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(
      "Shift to convert · Option+Shift for 25 tools · Control for SHA-256 & file actions",
      410,
      236
    );

    const rows = [
      ["IMAGES · 56", "HEIC · AVIF · WEBP · TIFF · BMP", "PNG · JPEG · WEBP · AVIF · PDF"],
      ["DOCUMENTS · 12", "PDF · SCANS · MULTI-FILE", "MERGE · SPLIT · OCR · DOCX · REDACT"],
      ["VIDEO & AUDIO · 106", "MOV · MKV · WAV · FLAC · M4A", "MP4 · WEBM · MP3 · TRIM · NORMALIZE"],
      ["SUBTITLES & UTILS", "SRT ↔ VTT · EXIF · METADATA", "STRIP GPS · SHA-256 · BATCH RENAME"],
    ];

    rows.forEach(([title, src, dst], i) => {
      const p = easeOut(prog(lt, 0.22 + i * 0.14, 0.5));
      const ry = 330 + i * 165 + (1 - p) * 24;
      ctx.save();
      ctx.globalAlpha = p;
      roundRect(ctx, 110, ry, 1700, 140, 20);
      ctx.fillStyle = "#111114";
      ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.stroke();

      ctx.font = "700 24px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(title, 150, ry + 78);

      ctx.font = "500 18px ui-monospace, SFMono-Regular, monospace";
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.fillText(src, 490, ry + 78);

      ctx.fillStyle = "#A78BFA";
      ctx.fillText("→", 1075, ry + 78);

      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(dst, 1140, ry + 78);
      ctx.restore();
    });
  }
  // ACT 4 (17.4 - 23.4s): Pure White Contrast Section — "0.0 KB Uploaded"
  else if (t < 23.4) {
    const lt = t - 17.4;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);
    drawGrid(0.045, true);

    ctx.textAlign = "left";
    ctx.font = "600 14px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = "#7C3AED";
    ctx.fillText("02 / DATA SOVEREIGNTY", 110, 110);

    ctx.font = "700 68px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#0A0A0B";
    ctx.fillText("Your files never take a round-trip.", 110, 190);

    // Other converters lane
    const p1 = easeOut(prog(lt, 0.15, 0.5));
    ctx.save();
    ctx.globalAlpha = p1;
    roundRect(ctx, 110, 255, 1700, 220, 24);
    ctx.fillStyle = "rgba(10,10,11,0.03)";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(10,10,11,0.14)";
    ctx.stroke();

    ctx.font = "600 14px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = "rgba(10,10,11,0.5)";
    ctx.fillText("OTHER CONVERTERS  —  YOUR FILE → THEIR SERVER", 150, 305);
    ctx.font = "500 28px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = "rgba(10,10,11,0.65)";
    ctx.fillText(
      "Your Mac   ── upload ──▶   Stranger's Cloud Bucket   ── fetch ──▶   ~/Downloads",
      150,
      392
    );
    ctx.restore();

    // Docyo Local Vault + 0.0 KB Card
    const p2 = easeOut(prog(lt, 0.5, 0.55));
    ctx.save();
    ctx.globalAlpha = p2;
    roundRect(ctx, 110, 520, 1220, 430, 26);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#0A0A0B";
    ctx.stroke();

    ctx.font = "600 14px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = "#4C1D95";
    ctx.fillText("● DOCYO  —  YOUR FILE STAYS ON YOUR LOCAL VOLUME", 154, 576);

    ctx.font = "700 34px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = "#0A0A0B";
    ctx.fillText(
      "input.pdf   ──▶   Docyo Native Engine   ──▶   input.docx ✓",
      154,
      730
    );

    ctx.font = "600 15px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = "rgba(10,10,11,0.55)";
    ctx.fillText(
      "READ-ONLY INPUT  ·  ATOMIC .DOCYO- COMMIT  ·  COLLISION-SAFE  ·  SHELL-SAFE ARGV",
      154,
      885
    );

    // 0.0 KB card
    roundRect(ctx, 1368, 520, 442, 430, 26);
    ctx.fillStyle = "#0A0A0B";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#7C3AED";
    ctx.stroke();

    ctx.font = "600 14px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = "#A78BFA";
    ctx.fillText("EXTERNAL NETWORK", 1408, 580);
    ctx.font = "700 96px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("0.0 KB", 1408, 720);
    ctx.font = "500 22px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText("Crosses the network.", 1408, 795);
    ctx.fillText("Works with Wi-Fi off.", 1408, 830);
    ctx.restore();
  }
  // ACT 5 (23.4 - 30.0s): Finale CTA with Official Penguin Logo
  else {
    const lt = t - 23.4;
    ctx.fillStyle = "#0A0A0B";
    ctx.fillRect(0, 0, W, H);
    drawGrid(0.032);

    const enter = easeOut(prog(lt, 0, 0.65));
    const pop = spring(prog(lt, 0.05, 0.7));
    drawSquircleLogo(960, 265, 168, 0.75 + 0.25 * pop, enter);

    ctx.save();
    ctx.globalAlpha = easeOut(prog(lt, 0.22, 0.6));
    ctx.font = "700 100px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    const s1 = "Drag. ";
    const s2 = "Hold Shift. ";
    const s3 = "Convert.";
    const w1 = ctx.measureText(s1).width;
    const w2 = ctx.measureText(s2).width;
    const w3 = ctx.measureText(s3).width;
    const sx = 960 - (w1 + w2 + w3) / 2;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(s1, sx, 488);
    ctx.fillStyle = "#A78BFA";
    ctx.fillText(s2, sx + w1, 488);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(s3, sx + w1 + w2, 488);

    ctx.textAlign = "center";
    ctx.font = "500 20px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.68)";
    ctx.fillText(
      "macOS Native (.dmg)   ·   Windows 10/11   ·   Linux x64   ·   Open Source GPL-3.0",
      960,
      565
    );

    const cp = spring(prog(lt, 0.55, 0.6));
    const bw = 640 * (0.9 + 0.1 * cp);
    roundRect(ctx, 960 - bw / 2, 628, bw, 78, 20);
    ctx.fillStyle = "#7C3AED";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#A78BFA";
    ctx.stroke();

    ctx.font = "600 18px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Download Free  ·  github.com/subhashmalik0001/Docyo", 960, 673);

    ctx.font = "600 13.5px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.fillText(
      "NO ACCOUNTS   ·   NO UPLOADS   ·   NO TELEMETRY   ·   MADE BY SUBHASH MALIK",
      960,
      790
    );
    ctx.restore();
  }
}

export function LaunchVideoModal({ open, onClose }: LaunchVideoModalProps) {
  const reduced = useHydratedReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastCueRef = useRef<number>(-1);

  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [exporting, setExporting] = useState(false);

  const timeRef = useRef(0);
  const playingRef = useRef(true);
  const mutedRef = useRef(false);

  playingRef.current = playing;
  mutedRef.current = muted;

  const triggerChime = useCallback((freqs: number[], dur = 0.45, gainVal = 0.045) => {
    if (mutedRef.current) return;
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AC();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + idx * 0.045);
        g.gain.setValueAtTime(0.0001, now + idx * 0.045);
        g.gain.exponentialRampToValueAtTime(gainVal, now + idx * 0.045 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.045 + dur);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + dur + 0.02);
      });
    } catch {
      // Ignore Web Audio autoplay restrictions if blocked
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = assetUrl("/docyo-logo-512.png");
    logoRef.current = img;

    timeRef.current = 0;
    lastCueRef.current = -1;
    setTime(0);
    setPlaying(true);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    let raf = 0;
    let lastTs = performance.now();

    const cues: { at: number; notes: number[] }[] = [
      { at: 1.38, notes: [587.33, 880] },
      { at: 1.75, notes: [293.66] },
      { at: 2.12, notes: [369.99] },
      { at: 2.48, notes: [440] },
      { at: 5.55, notes: [659.25, 987.77] },
      { at: 9.65, notes: [587.33, 739.99, 880, 1174.66] },
      { at: 11.85, notes: [440, 659.25] },
      { at: 17.45, notes: [554.37, 880] },
      { at: 23.45, notes: [587.33, 880, 1174.66] },
    ];

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;

      if (playingRef.current) {
        const prev = timeRef.current;
        let next = prev + dt;
        if (next >= DURATION) {
          next = 0;
          lastCueRef.current = -1;
        }
        cues.forEach((c, idx) => {
          if (prev < c.at && next >= c.at && lastCueRef.current < idx) {
            lastCueRef.current = idx;
            triggerChime(c.notes);
          }
        });
        timeRef.current = next;
        setTime(next);
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        drawFrame(ctx, timeRef.current, logoRef.current);
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, triggerChime]);

  const exportLaunchVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || exporting || typeof MediaRecorder === "undefined") return;

    setExporting(true);
    timeRef.current = 0;
    lastCueRef.current = -1;
    setTime(0);
    setPlaying(true);

    const stream = canvas.captureStream(60);
    const mime = MediaRecorder.isTypeSupported("video/mp4")
      ? "video/mp4"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const ext = mime.includes("mp4") ? "mp4" : "webm";

    const recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: 8_000_000,
    });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Docyo-Launch-Video.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExporting(false);
    };

    recorder.start();
    window.setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, DURATION * 1000);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Docyo Launch Film"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.22 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl sm:p-8"
        >
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.32, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[1120px] overflow-hidden rounded-2xl border border-white/[0.14] bg-[#111114] shadow-[0_40px_120px_rgba(0,0,0,0.85)]"
          >
            {/* Top studio bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-[#0A0A0B] px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2.5">
                <DocyoMark size={24} />
                <span className="font-display text-[15px] font-medium text-white">
                  Docyo Launch Film
                </span>
                <span className="hidden sm:inline rounded border border-[#7C3AED]/45 bg-[#7C3AED]/15 px-2 py-0.5 font-mono text-[10.5px] text-[#A78BFA]">
                  1080p · 60fps
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={exportLaunchVideo}
                  disabled={exporting}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.12] bg-[#17171B] px-3 font-mono text-[11.5px] text-white/85 transition-colors hover:border-[#7C3AED]/60 hover:text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-[#7C3AED]"
                >
                  <DownloadIcon size={14} />
                  <span>
                    {exporting
                      ? `Recording (${Math.ceil(DURATION - time)}s)…`
                      : "Download Video"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close launch film"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#111114] px-2.5 font-mono text-[11.5px] text-white/65 transition-colors hover:border-white/25 hover:text-white focus-visible:outline-2 focus-visible:outline-[#7C3AED]"
                >
                  <span>ESC</span>
                </button>
              </div>
            </div>

            {/* 16:9 1080p60 Live Motion Canvas */}
            <div className="relative aspect-video w-full bg-[#0A0A0B]">
              <canvas
                ref={canvasRef}
                width={1920}
                height={1080}
                onClick={() => setPlaying((p) => !p)}
                className="h-full w-full cursor-pointer object-contain"
              />
            </div>

            {/* Playback Scrubber Bar */}
            <div className="flex items-center gap-3 border-t border-white/[0.08] bg-[#0A0A0B] px-4 py-2.5 sm:px-5">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="rounded-md border border-white/[0.12] bg-[#111114] px-2.5 py-1 font-mono text-[11px] text-white hover:border-[#7C3AED]/60"
              >
                {playing ? "Pause" : "Play"}
              </button>

              <input
                type="range"
                min={0}
                max={DURATION}
                step={0.05}
                value={time}
                aria-label="Scrub launch film timeline"
                onChange={(e) => {
                  const val = Number(e.target.value);
                  timeRef.current = val;
                  setTime(val);
                }}
                className="h-1.5 flex-1 cursor-pointer accent-[#7C3AED]"
              />

              <span className="font-mono text-[11px] text-white/55">
                0:{String(Math.floor(time)).padStart(2, "0")} / 0:{DURATION}
              </span>

              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="rounded-md border border-white/[0.1] bg-[#111114] px-2.5 py-1 font-mono text-[11px] text-white/75 hover:text-white"
              >
                {muted ? "Sound Off" : "Sound On"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

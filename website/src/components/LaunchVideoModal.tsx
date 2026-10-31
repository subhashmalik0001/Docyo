"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { assetUrl, DOWNLOAD_CONFIG } from "@/config/site";
import { useHydratedReducedMotion } from "@/lib/useHydratedReducedMotion";
import { DocyoMark, DownloadIcon } from "@/components/Icons";

interface LaunchVideoModalProps {
  open: boolean;
  onClose: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function LaunchVideoModal({ open, onClose }: LaunchVideoModalProps) {
  const reduced = useHydratedReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [needsUnmuteClick, setNeedsUnmuteClick] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Synchronize open state, autoplay & audio context
  useEffect(() => {
    if (!open) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setNeedsUnmuteClick(false);
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.volume = 1.0;
      video.muted = false;
      setMuted(false);
      setVolume(1.0);

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlaying(true);
            setNeedsUnmuteClick(false);
          })
          .catch(() => {
            // Browser autoplay policy prevented unmuted playback: play muted initially and prompt user to unmute
            video.muted = true;
            setMuted(true);
            setNeedsUnmuteClick(true);
            video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
          });
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " " && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const handleUnmute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = 1.0;
    setMuted(false);
    setVolume(1.0);
    setNeedsUnmuteClick(false);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.muted) {
      video.muted = false;
      video.volume = volume > 0 ? volume : 1.0;
      setMuted(false);
      setNeedsUnmuteClick(false);
    } else {
      video.muted = true;
      setMuted(true);
    }
  };

  const handleVolumeChange = (newVal: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVal;
    setVolume(newVal);
    if (newVal === 0) {
      video.muted = true;
      setMuted(true);
    } else if (video.muted) {
      video.muted = false;
      setMuted(false);
      setNeedsUnmuteClick(false);
    }
  };

  const handleScrub = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Docyo Official Launch Film"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.22 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-3 backdrop-blur-xl sm:p-6 lg:p-8"
        >
          <motion.div
            ref={containerRef}
            initial={reduced ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.32, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-[1140px] flex-col overflow-hidden rounded-2xl border border-white/[0.14] bg-[#111114] shadow-[0_40px_120px_rgba(0,0,0,0.85)]"
          >
            {/* Studio Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-[#0A0A0B] px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2.5">
                <DocyoMark size={24} />
                <span className="font-display text-[15px] font-medium text-white">
                  Docyo Launch Film
                </span>
                <span className="hidden sm:inline rounded border border-[#7C3AED]/45 bg-[#7C3AED]/15 px-2 py-0.5 font-mono text-[10.5px] text-[#A78BFA]">
                  1080p60 · Interactive Audio
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Direct Download Button with Full Interactive Audio */}
                <a
                  href={DOWNLOAD_CONFIG.launchVideoUrl}
                  download={DOWNLOAD_CONFIG.launchVideoFilename}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#7C3AED]/60 bg-[#7C3AED]/20 px-3 font-mono text-[11.5px] font-medium text-[#A78BFA] transition-all hover:bg-[#7C3AED] hover:text-white focus-visible:outline-2 focus-visible:outline-[#7C3AED]"
                  title="Download the full 1080p 60fps MP4 with interactive audio"
                >
                  <DownloadIcon size={14} />
                  <span>Download MP4 (with Audio)</span>
                </a>

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

            {/* 16:9 Studio Video Player */}
            <div className="relative aspect-video w-full bg-[#0A0A0B]">
              <video
                ref={videoRef}
                src={DOWNLOAD_CONFIG.launchVideoUrl}
                poster={assetUrl("/og-image.png")}
                playsInline
                preload="auto"
                onClick={togglePlay}
                onTimeUpdate={(e) => {
                  const target = e.currentTarget;
                  setCurrentTime(target.currentTime);
                  if (target.duration && !isNaN(target.duration)) {
                    setDuration(target.duration);
                  }
                }}
                onEnded={() => setPlaying(false)}
                className="h-full w-full cursor-pointer object-contain"
              />

              {/* Unmute Pill Banner if browser blocked unmuted autoplay */}
              {needsUnmuteClick && (
                <button
                  type="button"
                  onClick={handleUnmute}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 rounded-full border border-[#A78BFA]/60 bg-[#7C3AED]/90 px-4 py-2 font-mono text-[12px] font-semibold text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:bg-[#6D28D9]"
                >
                  <span className="flex h-2 w-2 rounded-full bg-white animate-ping" />
                  <span>🔊 Click to Enable Interactive Audio</span>
                </button>
              )}

              {/* Centered Large Play Button when paused */}
              {!playing && (
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label="Play video"
                  className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-sm transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-[#7C3AED]"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Playback Scrubber & Sound Controls */}
            <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.08] bg-[#0A0A0B] px-4 py-2.5 sm:px-5">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
                className="inline-flex h-8 items-center justify-center rounded-md border border-white/[0.12] bg-[#111114] px-3 font-mono text-[11.5px] font-medium text-white transition-colors hover:border-[#7C3AED]/60"
              >
                {playing ? "Pause" : "Play"}
              </button>

              <div className="flex flex-1 items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={duration || 39}
                  step={0.05}
                  value={currentTime}
                  aria-label="Scrub video"
                  onChange={(e) => handleScrub(Number(e.target.value))}
                  className="h-1.5 flex-1 cursor-pointer accent-[#7C3AED]"
                />
                <span className="font-mono text-[11px] text-white/55 min-w-[70px] text-right">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Volume / Unmute Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute sound" : "Mute sound"}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 font-mono text-[11px] transition-colors ${
                    muted
                      ? "border-[#7C3AED] bg-[#7C3AED]/20 text-[#A78BFA]"
                      : "border-white/[0.1] bg-[#111114] text-white/80 hover:text-white"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    {muted ? (
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    ) : (
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    )}
                  </svg>
                  <span>{muted ? "Muted" : `${Math.round(volume * 100)}%`}</span>
                </button>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  aria-label="Volume slider"
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="h-1.5 w-16 cursor-pointer accent-[#7C3AED]"
                />

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  className="hidden sm:inline-flex h-8 items-center justify-center rounded-md border border-white/[0.1] bg-[#111114] px-2 font-mono text-[11px] text-white/60 hover:text-white"
                  title="Toggle Fullscreen"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

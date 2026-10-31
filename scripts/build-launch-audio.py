#!/usr/bin/env python3
"""
Builds the 30.0-second 48kHz Stereo interactive soundtrack for the Docyo Launch Film:
- NO human speech / vocal voiceover (purely interactive background noise & UI sound design)
- Upbeat, polished 120 BPM Apple-style electronic soundscape (warm chords, sub bass, crisp hats)
- Highly tactile, punchy Apple Notch style UI sound effects:
  * Crisp Finder clicks & keyboard switch snaps
  * Radial wheel bloom detents & wedge hover ticks
  * MacBook Notch expansion swoosh & processing clocking
  * Crystal-clear Apple Notch success chime (C6-E6-G6-C7 shimmer)
  * Shutter impacts, mode switch detents, and data stream pulses
"""

import math
import struct
import sys
import wave

SAMPLE_RATE = 48_000
DURATION = 30.0
TOTAL_FRAMES = int(SAMPLE_RATE * DURATION)


def clamp(val, low=-1.0, high=1.0):
    return max(low, min(high, val))


def synthesize_soundtrack(out_wav: str):
    left = [0.0] * TOTAL_FRAMES
    right = [0.0] * TOTAL_FRAMES

    # Helper: add stereo sample
    def add(t_sec: float, l_val: float, r_val: float):
        idx = int(t_sec * SAMPLE_RATE)
        if 0 <= idx < TOTAL_FRAMES:
            left[idx] += l_val
            right[idx] += r_val

    # -------------------------------------------------------------
    # 1. 120 BPM Modern Electronic Tech Soundscape (0.0s - 30.0s)
    # 120 BPM = 2 beats per second (0.5s per beat, 0.125s per 16th note)
    # -------------------------------------------------------------
    bpm = 120.0
    beat_sec = 60.0 / bpm  # 0.5s
    sixteenth_sec = beat_sec / 4.0  # 0.125s

    # Chords (Dm9 -> Bbmaj7 -> Fmaj9 -> C/E)
    progression = [
        # Dm9: D3, F3, A3, C4, E4
        [146.83, 174.61, 220.00, 261.63, 329.63],
        # Bbmaj7: Bb2, D3, F3, A3, D4
        [116.54, 146.83, 174.61, 220.00, 293.66],
        # Fmaj9: F2, C3, E3, A3, G4
        [87.31, 130.81, 164.81, 220.00, 392.00],
        # C/E: E2, G2, C3, E3, B3
        [82.41, 98.00, 130.81, 164.81, 246.94],
    ]

    total_beats = int(DURATION / beat_sec)

    # Pre-render synth pads & sub bass
    for b in range(total_beats):
        t_start = b * beat_sec
        chord_idx = (b // 4) % len(progression)
        chord = progression[chord_idx]
        is_drop = (t_start >= 3.8 and t_start < 22.8) or (t_start >= 26.2 and t_start < 29.5)
        is_break = (t_start >= 22.8 and t_start < 26.2)  # White contrast section: stripped back, intimate

        # Pad chord synthesis
        pad_dur = beat_sec * 4.0 if (b % 4 == 0) else 0
        if pad_dur > 0 and t_start < 29.0:
            pad_frames = int(pad_dur * SAMPLE_RATE)
            for f in range(pad_frames):
                t_local = f / SAMPLE_RATE
                t_global = t_start + t_local
                if t_global >= DURATION:
                    break
                # Warm slow attack/decay envelope
                env = math.sin(math.pi * clamp(t_local / pad_dur, 0, 1)) ** 0.8
                vol = 0.045 if not is_break else 0.025
                sig_l = 0.0
                sig_r = 0.0
                for n_idx, freq in enumerate(chord):
                    # Slight detuning for analog lushness
                    detune = 1.0 + 0.0018 * (n_idx - 2)
                    phase_l = 2 * math.pi * freq * t_local
                    phase_r = 2 * math.pi * (freq * detune) * t_local
                    osc_l = math.sin(phase_l) + 0.3 * math.sin(phase_l * 2)
                    osc_r = math.sin(phase_r) + 0.3 * math.sin(phase_r * 2)
                    sig_l += osc_l
                    sig_r += osc_r
                add(t_global, sig_l * env * vol, sig_r * env * vol)

        # Sub-bass pulse on each quarter beat during drop
        if is_drop and (b % 2 == 0):
            bass_freq = chord[0] * 0.5  # Sub octave (e.g. D2 = 73.4 Hz or D1 = 36.7 Hz)
            bass_frames = int(beat_sec * 1.8 * SAMPLE_RATE)
            for f in range(bass_frames):
                t_local = f / SAMPLE_RATE
                t_global = t_start + t_local
                if t_global >= DURATION:
                    break
                env = math.exp(-3.5 * t_local)
                # Pitch envelope: slight pitch drop for rounded electronic punch
                f_cur = bass_freq * (1.0 + 0.4 * math.exp(-25.0 * t_local))
                osc = math.sin(2 * math.pi * f_cur * t_local) + 0.25 * math.sin(4 * math.pi * f_cur * t_local)
                bass_sig = math.tanh(osc * 1.4) * env * 0.13
                add(t_global, bass_sig, bass_sig)

        # Kick drum on beat 1 & 3 during drop
        if is_drop and (b % 2 == 0):
            kick_dur = 0.28
            kick_frames = int(kick_dur * SAMPLE_RATE)
            for f in range(kick_frames):
                t_local = f / SAMPLE_RATE
                t_global = t_start + t_local
                if t_global >= DURATION:
                    break
                pitch = 145.0 * math.exp(-28.0 * t_local) + 48.0
                env = math.exp(-12.0 * t_local)
                osc = math.sin(2 * math.pi * pitch * t_local)
                # Subtle click transient
                click = math.exp(-140.0 * t_local) * 0.4 * (1.0 if (f % 2 == 0) else -1.0)
                sig = clamp((osc * env + click) * 0.22)
                add(t_global, sig, sig)

        # Crisp Snare / Rimshot on beat 2 & 4
        if is_drop and (b % 2 == 1):
            snare_dur = 0.22
            snare_frames = int(snare_dur * SAMPLE_RATE)
            for f in range(snare_frames):
                t_local = f / SAMPLE_RATE
                t_global = t_start + t_local
                if t_global >= DURATION:
                    break
                tone_pitch = 210.0 * math.exp(-20.0 * t_local)
                tone = math.sin(2 * math.pi * tone_pitch * t_local) * math.exp(-15.0 * t_local) * 0.12
                # White noise burst filtered
                noise_env = math.exp(-18.0 * t_local)
                noise = (((f * 1103515245 + 12345) & 0x7FFFFFFF) / 0x3FFFFFFF - 1.0) * noise_env * 0.11
                sig = tone + noise
                add(t_global, sig * 0.95, sig * 1.05)

        # Hi-hats on sixteenth notes
        if is_drop or is_break:
            for s in range(4):
                t_six = t_start + s * sixteenth_sec
                if t_six >= DURATION:
                    break
                open_hat = (s == 2 and (b % 2 == 1))
                hat_dur = 0.12 if open_hat else 0.04
                hat_frames = int(hat_dur * SAMPLE_RATE)
                vel = 0.065 if open_hat else (0.045 if (s % 2 == 0) else 0.028)
                if is_break:
                    vel *= 0.6
                for f in range(hat_frames):
                    t_local = f / SAMPLE_RATE
                    t_global = t_six + t_local
                    if t_global >= DURATION:
                        break
                    hat_env = math.exp((-25.0 if open_hat else -75.0) * t_local)
                    noise = (((f * 1664525 + 1013904223) & 0x7FFFFFFF) / 0x3FFFFFFF - 1.0)
                    sig = noise * hat_env * vel
                    add(t_global, sig * 0.9, sig * 1.1)

    # Arpeggio melodic sparkle across Acts (D dorian / pentatonic)
    arp_notes = [440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.50]
    for step in range(int(DURATION / sixteenth_sec)):
        t_arp = step * sixteenth_sec
        if t_arp < 3.8 or t_arp > 28.5:
            continue
        note_freq = arp_notes[(step * 3) % len(arp_notes)]
        arp_dur = 0.18
        arp_frames = int(arp_dur * SAMPLE_RATE)
        pan = 0.5 + 0.35 * math.sin(step * 0.45)
        for f in range(arp_frames):
            t_local = f / SAMPLE_RATE
            t_global = t_arp + t_local
            if t_global >= DURATION:
                break
            env = math.exp(-20.0 * t_local)
            osc = math.sin(2 * math.pi * note_freq * t_local) + 0.2 * math.sin(4 * math.pi * note_freq * t_local)
            sig = osc * env * 0.032
            add(t_global, sig * (1.0 - pan), sig * pan)

    # -------------------------------------------------------------
    # 2. Tactile, Interactive Apple Notch UI Sound Design
    # -------------------------------------------------------------

    def play_tactile_click(t_sec: float, pitch=1800.0, vol=0.18):
        dur = 0.035
        frames = int(dur * SAMPLE_RATE)
        for f in range(frames):
            t = f / SAMPLE_RATE
            env = math.exp(-140.0 * t)
            osc = math.sin(2 * math.pi * pitch * math.exp(-60.0 * t) * t)
            # High frequency snap
            snap = (((f * 48271) & 0x7FFFFFFF) / 0x3FFFFFFF - 1.0) * math.exp(-220.0 * t) * 0.5
            sig = (osc + snap) * env * vol
            add(t_sec + t, sig, sig)

    def play_notch_whoosh(t_sec: float, dur=0.42, vol=0.22):
        frames = int(dur * SAMPLE_RATE)
        for f in range(frames):
            t = f / SAMPLE_RATE
            # Swelling then decaying bandpass whoosh
            env = math.sin(math.pi * clamp(t / dur, 0, 1)) ** 1.8
            pitch = 180.0 + 380.0 * math.sin(math.pi * (t / dur))
            osc = math.sin(2 * math.pi * pitch * t)
            noise = (((f * 16807) & 0x7FFFFFFF) / 0x3FFFFFFF - 1.0) * 0.6
            sig = (osc * 0.4 + noise * 0.6) * env * vol
            add(t_sec + t, sig * 0.9, sig * 1.1)

    def play_wheel_flutter(t_sec: float, count=6, gap=0.038):
        # 6 rapid micro-clicks as the 6 wedges bloom open
        for i in range(count):
            play_tactile_click(t_sec + i * gap, pitch=1600.0 + i * 140.0, vol=0.11)

    def play_drop_thud(t_sec: float):
        dur = 0.32
        frames = int(dur * SAMPLE_RATE)
        for f in range(frames):
            t = f / SAMPLE_RATE
            env = math.exp(-14.0 * t)
            pitch = 110.0 * math.exp(-35.0 * t) + 44.0
            osc = math.sin(2 * math.pi * pitch * t)
            pop = math.exp(-85.0 * t) * math.sin(2 * math.pi * 320.0 * t) * 0.5
            sig = (osc + pop) * env * 0.28
            add(t_sec + t, sig, sig)

    def play_notch_processing_clock(t_sec: float, dur=2.0, interval=0.12):
        steps = int(dur / interval)
        for i in range(steps):
            t_step = t_sec + i * interval
            f_clk = 2400.0 if (i % 2 == 0) else 3200.0
            play_tactile_click(t_step, pitch=f_clk, vol=0.045)

    def play_apple_notch_success_chime(t_sec: float):
        # Crystalline major triad shimmer: C6 (1046.5Hz) -> E6 (1318.5Hz) -> G6 (1567.9Hz) -> C7 (2093.0Hz)
        notes = [1046.50, 1318.51, 1567.98, 2093.00]
        note_stagger = 0.055
        note_dur = 1.35
        for idx, freq in enumerate(notes):
            t_note = t_sec + idx * note_stagger
            frames = int(note_dur * SAMPLE_RATE)
            pan = 0.35 + 0.1 * idx
            for f in range(frames):
                t = f / SAMPLE_RATE
                env = math.exp(-4.2 * t)
                # Harmonic shimmer with 2nd and 3rd overtones
                osc = (
                    math.sin(2 * math.pi * freq * t)
                    + 0.35 * math.sin(4 * math.pi * freq * t)
                    + 0.15 * math.sin(6 * math.pi * freq * t)
                )
                sig = osc * env * 0.16
                add(t_note + t, sig * (1.0 - pan), sig * pan)

    def play_shutter_impact(t_sec: float):
        dur = 0.38
        frames = int(dur * SAMPLE_RATE)
        for f in range(frames):
            t = f / SAMPLE_RATE
            env = math.exp(-12.0 * t)
            pitch = 280.0 * math.exp(-30.0 * t) + 60.0
            sub = math.sin(2 * math.pi * pitch * t)
            crack = (((f * 214013 + 2531011) & 0x7FFFFFFF) / 0x3FFFFFFF - 1.0) * math.exp(-65.0 * t)
            sig = (sub * 0.6 + crack * 0.4) * env * 0.26
            add(t_sec + t, sig, sig)

    def play_data_zip(t_sec: float, dur=0.25):
        frames = int(dur * SAMPLE_RATE)
        for f in range(frames):
            t = f / SAMPLE_RATE
            env = math.sin(math.pi * clamp(t / dur, 0, 1))
            f_cur = 800.0 + 1800.0 * (t / dur)
            sig = math.sin(2 * math.pi * f_cur * t) * env * 0.09
            add(t_sec + t, sig * (1.0 - (t / dur)), sig * (t / dur))

    # --- Schedule Precise Synchronized Interactive Cues ---
    # Act 1 (0.0s - 3.8s)
    play_tactile_click(0.15, pitch=2200.0, vol=0.18)
    play_notch_whoosh(1.40, dur=0.35, vol=0.22)
    play_tactile_click(1.65, pitch=3200.0, vol=0.20)  # Squircle snap
    play_tactile_click(2.20, pitch=1400.0, vol=0.16)  # "Drag."
    play_tactile_click(2.65, pitch=1800.0, vol=0.18)  # "Hold Shift."
    play_tactile_click(3.10, pitch=2400.0, vol=0.20)  # "Convert."

    # Act 2 (3.8s - 12.0s: Desktop -> Shift Wheel -> Drop -> Notch Success)
    play_notch_whoosh(3.85, dur=0.40, vol=0.18)       # Finder window entrance
    play_tactile_click(4.80, pitch=1900.0, vol=0.22)  # Grab photo.heic
    play_tactile_click(5.05, pitch=1200.0, vol=0.20)  # Shift key press
    play_wheel_flutter(5.58, count=6, gap=0.035)      # 6 wedges bloom open
    play_notch_whoosh(5.82, dur=0.42, vol=0.22)       # MacBook Notch expands down!
    play_tactile_click(7.15, pitch=2800.0, vol=0.18)  # Hover over PNG wedge detent
    play_drop_thud(7.60)                              # Drop on PNG wedge!
    play_notch_processing_clock(7.70, dur=2.0, interval=0.10) # Notch processing data clocking
    play_apple_notch_success_chime(9.80)              # Notch Success Chime!

    # Act 3 (12.0s - 17.5s: Modifier Rings & 25 Tools)
    play_notch_whoosh(12.00, dur=0.35, vol=0.18)      # Scene pan
    play_tactile_click(13.80, pitch=2100.0, vol=0.20) # Ring switch: Opt+Shift (25 Tools)
    play_tactile_click(15.60, pitch=2600.0, vol=0.20) # Ring switch: Ctrl (Actions)
    play_tactile_click(14.20, pitch=1600.0, vol=0.15) # Waveform scrub tick
    play_tactile_click(14.65, pitch=1900.0, vol=0.15) # Waveform trim in point
    play_tactile_click(15.10, pitch=2200.0, vol=0.15) # Waveform trim out point

    # Act 4 (17.5s - 22.8s: 176 Conversion Routes Matrix)
    play_notch_whoosh(17.50, dur=0.30, vol=0.18)
    # Fast counting tick-roll (0 -> 176)
    for i in range(12):
        play_tactile_click(17.60 + i * 0.055, pitch=1800.0 + i * 80.0, vol=0.08)
    play_data_zip(19.20, dur=0.22)
    play_data_zip(20.40, dur=0.22)
    play_data_zip(21.60, dur=0.22)

    # Act 5 (22.8s - 26.2s: Pure White Data Sovereignty Contrast)
    play_shutter_impact(22.80)                        # High contrast snap impact
    play_tactile_click(23.60, pitch=2400.0, vol=0.18)
    play_tactile_click(24.50, pitch=1400.0, vol=0.18)
    play_tactile_click(25.30, pitch=3200.0, vol=0.22) # 0.0 KB card stamp

    # Act 6 (26.2s - 30.0s: Finale CTA & Outro)
    play_notch_whoosh(26.20, dur=0.38, vol=0.20)      # Return to obsidian
    play_tactile_click(26.80, pitch=2200.0, vol=0.20) # Squircle logo pop
    play_apple_notch_success_chime(27.40)             # Warm finale resolve chime
    play_tactile_click(28.20, pitch=2800.0, vol=0.22) # Download CTA button press

    # Smooth master fade-out at end (29.5s -> 30.0s)
    fade_start = int(29.4 * SAMPLE_RATE)
    fade_len = TOTAL_FRAMES - fade_start
    for f in range(fade_len):
        idx = fade_start + f
        mult = (fade_len - f) / float(fade_len)
        left[idx] *= mult
        right[idx] *= mult

    # -------------------------------------------------------------
    # 3. Peak Limiting & 16-Bit Stereo Master
    # -------------------------------------------------------------
    max_amp = 0.0
    for idx in range(TOTAL_FRAMES):
        max_amp = max(max_amp, abs(left[idx]), abs(right[idx]))

    print(f"Raw Peak Amplitude before mastering: {max_amp:.3f}")
    target_peak = 0.94
    gain = (target_peak / max_amp) if max_amp > target_peak else 1.0

    raw_out = bytearray(TOTAL_FRAMES * 4)
    struct_pack = struct.pack
    for idx in range(TOTAL_FRAMES):
        l_s = math.tanh(left[idx] * gain) * 0.96
        r_s = math.tanh(right[idx] * gain) * 0.96
        l_i = int(clamp(l_s, -1.0, 1.0) * 32767.0)
        r_i = int(clamp(r_s, -1.0, 1.0) * 32767.0)
        struct_pack_into = struct.pack_into
        struct_pack_into("<hh", raw_out, idx * 4, l_i, r_i)

    with wave.open(out_wav, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(raw_out)

    size_mb = len(raw_out) / (1024 * 1024)
    print(f"✓ Mastered Interactive Background Soundtrack: {out_wav} ({size_mb:.2f} MB, {DURATION}s @ 48kHz Stereo)")


if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "/tmp/docyo-master-audio.wav"
    synthesize_soundtrack(out_file)

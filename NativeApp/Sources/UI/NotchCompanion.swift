import SwiftUI

/// 3D Grape Penguin avatar companion below the notch.
struct NotchCompanion: View {
    @ObservedObject var state = CompanionState.shared
    private var working: Bool { state.phase == .processing }
    private var failed: Bool { state.phase == .failed }
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 12, paused: ![.processing, .received, .delivering].contains(state.phase) || reduceMotion)) { timeline in
            let phase = !reduceMotion ? timeline.date.timeIntervalSinceReferenceDate * 5 : 0
            let bob = reduceMotion ? 0 : state.phase == .received ? -abs(sin(phase)) * 6 : state.phase == .delivering ? -abs(sin(phase)) * 3 : working ? sin(phase) * 2 : 0

            ZStack {
                // Interactive document float on file received / delivered
                if state.phase == .received || state.phase == .delivering {
                    Image(systemName: "doc.fill")
                        .font(.system(size: 15))
                        .foregroundStyle(.white)
                        .shadow(color: .black.opacity(0.35), radius: 3, x: 0, y: 1.5)
                        .offset(x: state.phase == .received ? -24 : 24, y: bob - 4)
                }

                // Success sparkles
                if state.phase == .success {
                    Image(systemName: "sparkles")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.yellow)
                        .shadow(color: .orange.opacity(0.5), radius: 4)
                        .offset(x: 22, y: -20)
                }

                // Soft ground shadow beneath avatar
                Ellipse()
                    .fill(Color(red: 0.48, green: 0.36, blue: 1.0).opacity(0.22))
                    .frame(width: 44, height: 7)
                    .offset(y: 24)

                // 3D Grape Penguin Vinyl Toy Avatar
                ZStack {
                    // Real 3D WebGL Three.js Avatar from avtar.html with cursor gaze tracking
                    Avatar3DView(allowsInteraction: true, transparentBackground: true, gaze: CGPoint(x: state.gaze, y: 0))
                        .frame(width: 52, height: 52)
                        .shadow(color: Color(red: 0.48, green: 0.36, blue: 1.0).opacity(0.28), radius: 6, x: 0, y: 3)

                    // Processing gear overlay
                    if working {
                        Image(systemName: "gearshape.fill")
                            .font(.system(size: 11))
                            .foregroundStyle(.white.opacity(0.95))
                            .shadow(color: .black.opacity(0.4), radius: 2)
                            .rotationEffect(.degrees(reduceMotion ? 0 : phase * 30))
                            .offset(x: 18, y: 15)
                    }

                    // Failure indicator
                    if failed {
                        Image(systemName: "exclamationmark.circle.fill")
                            .font(.system(size: 12))
                            .foregroundStyle(.red)
                            .shadow(color: .black.opacity(0.3), radius: 2)
                            .offset(x: 18, y: 15)
                    }

                    // Cancelled indicator
                    if state.phase == .cancelled {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 12))
                            .foregroundStyle(.white.opacity(0.75))
                            .offset(x: 18, y: 15)
                    }
                }
                .offset(x: state.phase == .watching ? state.gaze * 3 : 0, y: bob)
                .rotationEffect(.degrees(working && !reduceMotion ? sin(phase / 2) * 4 : 0))
            }
        }
        .frame(width: 66, height: 64)
        .animation(reduceMotion ? nil : .spring(response: 0.3, dampingFraction: 0.7), value: state.phase)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.15), value: state.gaze)
        .accessibilityHidden(true)
    }
}

typealias CitrusCompanion = NotchCompanion

struct NotchJobRow: View {
    @ObservedObject var job: Job
    let cancel: () -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack {
                Text(title).font(.system(size: 12, weight: .semibold)).lineLimit(1)
                Spacer(minLength: 5)
                if job.status.isFinished {
                    Image(systemName: failed ? "exclamationmark.circle.fill" : job.status == .cancelled ? "xmark.circle.fill" : "checkmark.circle.fill")
                        .foregroundStyle(failed ? .red : .green)
                } else {
                    Text("\(Int(min(max(job.progress, 0), 1) * 100))%")
                        .font(.system(size: 10, design: .monospaced)).foregroundStyle(.white.opacity(0.65))
                    Button(action: cancel) { Image(systemName: "xmark.circle.fill") }
                        .buttonStyle(.plain).help("Cancel this job").accessibilityLabel("Cancel \(job.detail)")
                }
            }
            Text(detail).font(.system(size: 10)).foregroundStyle(failed ? .red : .white.opacity(0.6)).lineLimit(1).help(detail)
            if job.status == .done && !job.outputs.isEmpty {
                JobOutputActions(job: job)
            } else {
                ProgressView(value: job.status == .done ? 1 : min(max(job.progress, 0), 1))
                    .tint(Theme.accent).progressViewStyle(.linear).controlSize(.mini)
            }
        }.foregroundStyle(.white).frame(height: 48)
    }
    private var title: String {
        switch job.status {
        case .failed: return job.title.replacingOccurrences(of: "Converting to", with: "Couldn’t convert to")
        case .done: return job.title.replacingOccurrences(of: "Converting to", with: "Converted to")
        case .cancelled: return "Conversion cancelled"
        case .waiting, .running: return job.title
        }
    }
    private var failed: Bool { if case .failed = job.status { return true }; return false }
    private var detail: String {
        switch job.status {
        case .failed(let message): return message
        case .done: return "Ready · " + job.detail
        case .cancelled: return "Cancelled · " + job.detail
        case .waiting: return "Waiting · " + job.detail
        case .running: return job.detail
        }
    }
}

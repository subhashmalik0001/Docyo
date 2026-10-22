import AppKit
import SwiftUI

enum Theme {
    static let accentNS = NSColor(srgbRed: 0.14, green: 0.42, blue: 0.96, alpha: 1.0)
    static let accent = Color(nsColor: accentNS)

    static let ink = Color(nsColor: .labelColor)
    static let inkSecondary = Color(nsColor: .secondaryLabelColor)
    static let cardCorner: CGFloat = 12

    static func isDark(_ appearance: NSAppearance) -> Bool {
        appearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua
    }
}

struct CardSurface: ViewModifier {
    var cornerRadius: CGFloat = Theme.cardCorner

    func body(content: Content) -> some View {
        content
            .background(.quaternary.opacity(0.5), in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(.separator, lineWidth: 1)
            }
    }
}

extension View {
    func card(cornerRadius: CGFloat = Theme.cardCorner) -> some View {
        modifier(CardSurface(cornerRadius: cornerRadius))
    }
}

struct SegmentedPicker<T: Hashable>: View {
    @Binding var selection: T
    let options: [(T, String)]

    var body: some View {
        Picker("", selection: $selection) {
            ForEach(options, id: \.0) { option in
                Text(option.1).tag(option.0)
            }
        }
        .pickerStyle(.segmented)
        .labelsHidden()
        .fixedSize()
    }
}


/// A state-driven illustration featuring the real 3D Grape Penguin avatar with cursor tracking.
struct FileOrbitGraphic: View {
    let tab: SettingsTab
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var appeared = false
    @State private var gaze: CGPoint = .zero
    private var angle: Double { Double(SettingsTab.allCases.firstIndex(of: tab) ?? 0) * 72 }

    var body: some View {
        ZStack {
            Circle().fill(Theme.accent.opacity(0.07)).frame(width: 140, height: 140)
            Circle().strokeBorder(Theme.accent.opacity(0.17), style: StrokeStyle(lineWidth: 1, dash: [3, 6]))
                .frame(width: 132, height: 132)
                .rotationEffect(.degrees(reduceMotion ? 0 : angle))
            ForEach(0..<4) { index in
                let radians = Double(index) * .pi * 2 / 4 - .pi / 2
                Image(systemName: ["photo", "waveform", "doc.text", "cube.transparent"][index])
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Theme.accent)
                    .frame(width: 26, height: 26)
                    .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Theme.accent.opacity(0.16)))
                    .offset(x: cos(radians) * 64, y: sin(radians) * 64)
            }

            // Real 3D WebGL Three.js Grape Penguin avatar
            Avatar3DView(allowsInteraction: true, transparentBackground: true, gaze: gaze)
                .frame(width: 104, height: 104)
                .shadow(color: Theme.accent.opacity(0.24), radius: 8, x: 0, y: 4)
        }
        .scaleEffect(reduceMotion ? 1 : appeared ? 1 : 0.88)
        .opacity(appeared ? 1 : 0)
        .onContinuousHover { phase in
            switch phase {
            case .active(let location):
                let nx = max(-1.0, min(1.0, (location.x - 70) / 70))
                let ny = max(-1.0, min(1.0, (location.y - 70) / 70))
                gaze = CGPoint(x: nx, y: ny)
            case .ended:
                gaze = .zero
            }
        }
        .animation(reduceMotion ? .easeOut(duration: 0.15) : .spring(response: 0.6, dampingFraction: 0.7), value: appeared)
        .animation(reduceMotion ? nil : .smooth(duration: 0.5), value: tab)
        .onAppear { appeared = true }
    }
}

struct SettingsPressStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var hovering = false
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .background(Color.primary.opacity(hovering ? 0.045 : 0), in: RoundedRectangle(cornerRadius: 13))
            .scaleEffect(reduceMotion ? 1 : configuration.isPressed ? 0.97 : 1)
            .animation(.easeOut(duration: 0.14), value: configuration.isPressed)
            .animation(.easeOut(duration: 0.14), value: hovering)
            .onHover { hovering = $0 }
    }
}

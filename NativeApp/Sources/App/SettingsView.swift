import AppKit
import SwiftUI
import UniformTypeIdentifiers

enum SettingsTab: String, CaseIterable, Identifiable {
    case companion
    case general
    case appearance
    case conversion
    case about

    var id: String { rawValue }

    var title: String {
        switch self {
        case .companion: return "3D Avatar"
        case .general: return "General"
        case .appearance: return "Appearance"
        case .conversion: return "Formats"
        case .about: return "About"
        }
    }

    var symbol: String {
        switch self {
        case .companion: return "cube.transparent.fill"
        case .general: return "gearshape"
        case .appearance: return "paintbrush"
        case .conversion: return "arrow.triangle.2.circlepath"
        case .about: return "info.circle"
        }
    }
}

@MainActor
final class SettingsTabModel: ObservableObject {
    @Published var tab: SettingsTab = .companion
}

struct SettingsView: View {
    @EnvironmentObject private var settings: AppSettings
    @ObservedObject var model: SettingsTabModel
    @State private var ffmpegHealth: FFmpeg.Health = .missing
    @State private var companionGaze: CGPoint = .zero
    @State private var isTestingNotch = false

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    @Namespace private var selection

    static let width: CGFloat = 820
    static let height: CGFloat = 620

    var body: some View {
        HStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 26) {
                HStack(spacing: 10) {
                    Image(nsImage: BrandArtwork.image(size: 40)).resizable().frame(width: 40, height: 40)
                    VStack(alignment: .leading, spacing: 1) {
                        Text("Docyo").font(.system(size: 20, weight: .bold))
                        Text("Local-First").font(.system(size: 10, weight: .medium)).foregroundStyle(.secondary)
                    }
                }
                .padding(.top, 20)
                VStack(spacing: 6) {
                    ForEach(SettingsTab.allCases) { tab in
                        Button {
                            withAnimation(reduceMotion ? .easeOut(duration: 0.15) : .spring(response: 0.38, dampingFraction: 0.85)) {
                                model.tab = tab
                            }
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: tab.symbol).font(.system(size: 16, weight: .medium)).frame(width: 22)
                                Text(tab.title).font(.system(size: 14, weight: model.tab == tab ? .semibold : .medium))
                                Spacer()
                            }
                            .padding(.horizontal, 14).padding(.vertical, 13)
                            .foregroundStyle(model.tab == tab ? Color.white : Color.primary)
                            .background {
                                if model.tab == tab {
                                    RoundedRectangle(cornerRadius: 13)
                                        .fill(Theme.accent.gradient)
                                        .matchedGeometryEffect(id: "sidebar", in: selection)
                                }
                            }
                            .contentShape(RoundedRectangle(cornerRadius: 13))
                        }
                        .buttonStyle(SettingsPressStyle())
                        .accessibilityAddTraits(model.tab == tab ? .isSelected : [])
                    }
                }
                Spacer()
                VStack(alignment: .leading, spacing: 8) {
                    Label("On your Mac", systemImage: "lock.shield")
                        .font(.system(size: 12, weight: .semibold))
                    Text("Your files. Your workflow.")
                        .font(.caption).foregroundStyle(.secondary)
                    Text("OPEN SOURCE  /  \(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "Development")")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .tracking(1.2).foregroundStyle(.tertiary)
                }
                .padding(.bottom, 12)
            }
            .padding(20).frame(width: 205)
            .background(reduceTransparency ? Color(nsColor: .windowBackgroundColor) : Color(nsColor: .controlBackgroundColor).opacity(0.65))
            Divider()
            VStack(spacing: 0) {
                HStack(alignment: .center, spacing: 12) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("MAKE ROOM FOR FLOW")
                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                            .tracking(2).foregroundStyle(Theme.accent)
                        Text(model.tab.title)
                            .font(.system(size: 34, weight: .bold, design: .rounded))
                            .contentTransition(.numericText())
                        Text(tabDescription)
                            .font(.system(size: 13)).foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Spacer(minLength: 0)
                    FileOrbitGraphic(tab: model.tab)
                        .frame(width: 155, height: 145)
                        .accessibilityHidden(true)
                }
                .padding(.horizontal, 30).padding(.top, 12).padding(.bottom, 4)
                ZStack {
                    Form {
                        switch model.tab {
                        case .companion: companionView
                        case .general: general
                        case .appearance: appearance
                        case .conversion: conversion
                        case .about: about
                        }
                    }
                    .formStyle(.grouped)
                    .scrollContentBackground(.hidden)
                    .id(model.tab)
                    .transition(reduceMotion ? .opacity : .opacity.combined(with: .offset(y: 9)))
                }
                .animation(reduceMotion ? .easeOut(duration: 0.15) : .smooth(duration: 0.28), value: model.tab)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background {
                LinearGradient(colors: [Theme.accent.opacity(0.06), Color(nsColor: .windowBackgroundColor), Color(nsColor: .windowBackgroundColor)], startPoint: .topTrailing, endPoint: .bottomLeading)
            }
        }
        .frame(width: Self.width, height: Self.height)
        .tint(Theme.accent)
        .onReceive(NotificationCenter.default.publisher(for: .init("DocyoShowAbout"))) { _ in model.tab = .about }
        .onReceive(NotificationCenter.default.publisher(for: NSApplication.didBecomeActiveNotification)) { _ in settings.refreshLoginStatus() }
        .task(id: settings.ffmpegPath) { ffmpegHealth = await FFmpeg.checkHealth() }
    }

    private var tabDescription: String {
        switch model.tab {
        case .companion: return "Interactive 3D vinyl toy companion in your app and notch."
        case .general: return "A few thoughtful defaults. A smoother day."
        case .appearance: return "Make your workspace feel like yours."
        case .conversion: return "Find the balance between detail and size."
        case .about: return "Small utility. Open possibilities."
        }
    }

    @ViewBuilder private var general: some View {
        Section("Output") {
            Picker("Save converted files", selection: $settings.outputLocation) {
                ForEach(OutputLocation.allCases) { Text($0.title).tag($0) }
            }
            Toggle("Reveal results in Finder", isOn: $settings.revealInFinder)
        }
        Section("General") {
            Toggle("Start automatically at login", isOn: $settings.launchAtLogin)
            Text("Keep Docyo ready in the menu bar after you restart and sign in. Move the app to Applications before enabling.")
                .font(.caption).foregroundStyle(.secondary)
            if let message = settings.loginMessage {
                Text(message).font(.caption).foregroundStyle(.orange)
                Button("Open Login Items…") { settings.openLoginSettings() }
            }
        }
        Section {
            LabeledContent("Conversion wheel") {
                Label("Shift", systemImage: "shift").labelStyle(.titleAndIcon)
            }
            LabeledContent("Tools wheel") {
                Label("Command (or Option + Shift)", systemImage: "option").labelStyle(.titleAndIcon)
            }
            LabeledContent("File actions", value: "Control")
        } header: {
            Text("Drag Modifiers")
        } footer: {
            Text("Hold the modifier while dragging files in Finder.")
        }
        Section("Excluded applications") {
            Text("Drag shortcuts stay off when a drag starts in these apps. Add CorelDRAW or other design tools here. You can still use Convert Files from the menu bar.")
                .font(.caption).foregroundStyle(.secondary)
            ForEach(settings.excludedApplications.keys.sorted(), id: \.self) { identifier in
                HStack {
                    Text(settings.excludedApplications[identifier] ?? identifier)
                    Spacer()
                    Button("Remove", systemImage: "minus.circle") {
                        settings.excludedApplications.removeValue(forKey: identifier)
                    }.help("Enable drag shortcuts in this application")
                }
            }
            Button("Add Application…", systemImage: "plus.circle", action: addExcludedApplication)
        }
    }

    private func addExcludedApplication() {
        let panel = NSOpenPanel()
        panel.title = "Disable drag shortcuts in applications"
        panel.allowedContentTypes = [.applicationBundle]
        panel.directoryURL = URL(fileURLWithPath: "/Applications")
        panel.allowsMultipleSelection = true
        panel.canChooseDirectories = false
        panel.begin { response in
            guard response == .OK else { return }
            for url in panel.urls {
                guard let bundle = Bundle(url: url), let identifier = bundle.bundleIdentifier else { continue }
                settings.excludedApplications[identifier] =
                    (bundle.object(forInfoDictionaryKey: "CFBundleDisplayName") as? String)
                    ?? (bundle.object(forInfoDictionaryKey: "CFBundleName") as? String)
                    ?? url.deletingPathExtension().lastPathComponent
            }
        }
    }

    @ViewBuilder private var companionView: some View {
        Section {
            VStack(spacing: 16) {
                ZStack {
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color(red: 0.15, green: 0.13, blue: 0.28),
                                    Color(red: 0.08, green: 0.07, blue: 0.16)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(height: 280)
                        .overlay(
                            RoundedRectangle(cornerRadius: 20, style: .continuous)
                                .strokeBorder(
                                    LinearGradient(
                                        colors: [Theme.accent.opacity(0.35), Color.clear],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 1
                                )
                        )

                    Avatar3DView(allowsInteraction: true, transparentBackground: true, gaze: companionGaze)
                        .frame(width: 260, height: 260)
                }
                .overlay(alignment: .bottomLeading) {
                    HStack(spacing: 6) {
                        Image(systemName: "cursorarrow.rays")
                            .font(.system(size: 10))
                        Text("Tracks cursor · Drag to spin · Scroll to zoom")
                            .font(.system(size: 10, weight: .medium, design: .monospaced))
                    }
                    .foregroundStyle(.white.opacity(0.75))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(.ultraThinMaterial, in: Capsule())
                    .padding(12)
                }
                .overlay(alignment: .topTrailing) {
                    Button {
                        if let url = BrandArtwork.avatarHTMLURL {
                            NSWorkspace.shared.open(url)
                        }
                    } label: {
                        Label("Web Viewer", systemImage: "arrow.up.right.square")
                            .font(.system(size: 10, weight: .medium))
                    }
                    .buttonStyle(.bordered)
                    .padding(12)
                }
                .onContinuousHover { phase in
                    switch phase {
                    case .active(let pt):
                        let nx = max(-1.0, min(1.0, (pt.x - 260) / 200))
                        let ny = max(-1.0, min(1.0, (pt.y - 140) / 140))
                        companionGaze = CGPoint(x: nx, y: ny)
                    case .ended:
                        companionGaze = .zero
                    }
                }

                HStack(spacing: 12) {
                    Button {
                        JobRunner.shared.watchWheel(label: "3D Companion Active", direction: 0)
                        isTestingNotch = true
                    } label: {
                        Label(isTestingNotch ? "Notch Active" : "Test in Notch", systemImage: "macbook.and.ipad")
                            .font(.system(size: 12, weight: .semibold))
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Theme.accent)

                    if isTestingNotch {
                        Button("Dismiss Notch") {
                            JobRunner.shared.dismissAll()
                            isTestingNotch = false
                        }
                        .buttonStyle(.bordered)
                    }

                    Spacer()

                    Text("Grape Penguin (Vinyl Toy)")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 4)
            }
            .padding(.vertical, 4)
        } header: {
            Text("3D Interactive Character")
        } footer: {
            Text("Your 3D companion is powered by Three.js WebGL and lives both in this app and beneath your MacBook notch.")
        }

        Section("Notch Companion Settings") {
            Picker("Surface", selection: $settings.notchSurface) {
                ForEach(NotchSurface.allCases) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)

            Picker("Display Mode", selection: $settings.progressStyle) {
                ForEach(ProgressStyle.allCases) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)
        }
    }

    @ViewBuilder private var appearance: some View {
        Section("Theme") {
            Picker("Theme", selection: $settings.appearanceMode) {
                ForEach(AppearanceMode.allCases) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)
        }
        Section {
            Picker("Progress", selection: $settings.progressStyle) {
                ForEach(ProgressStyle.allCases) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)
            if settings.progressStyle == .pill {
                Picker("Notch surface", selection: $settings.notchSurface) {
                    ForEach(NotchSurface.allCases) { Text($0.title).tag($0) }
                }.pickerStyle(.segmented)
            }
        } header: {
            Text("Progress")
        } footer: {
            Text(settings.progressStyle == .card
                 ? "A floating card in the top right corner with the file name and percentage."
                 : "An animated 3D companion below the notch, with file progress and results.")
        }
    }

    @ViewBuilder private var conversion: some View {
        Section("Images") {
            HStack {
                Text("JPEG / HEIC / WebP quality")
                Slider(value: $settings.jpegQuality, in: 0.3...1.0)
                Text("\(Int(settings.jpegQuality * 100))%").contentTransition(.numericText()).monospacedDigit().frame(width: 44, alignment: .trailing)
            }
        }
        Section {
            Picker("Preset", selection: $settings.compressionPreset) {
                ForEach(CompressionPreset.allCases) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)
            HStack {
                Text("Resize long edge to")
                TextField("Off", value: $settings.compressionResizeLongEdge, format: .number)
                    .labelsHidden()
                    .textFieldStyle(.roundedBorder)
                    .frame(width: 80)
                Text("px (0 = keep size)").foregroundStyle(.secondary)
            }
        } header: {
            Text("Compression")
        } footer: {
            Text(settings.compressionPreset == .balanced
                 ? "Balanced keeps detail while trimming size noticeably."
                 : "Strong prioritizes the smallest file, with visible quality loss.")
        }
        Section {
            HStack {
                TextField("Auto-detect (Homebrew, MacPorts, /usr/local/bin)", text: $settings.ffmpegPath)
                    .textFieldStyle(.roundedBorder)
                Button("Choose…") { chooseFFmpeg() }
            }
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Image(systemName: ffmpegHealthSymbol)
                    .foregroundStyle(ffmpegHealthColor)
                Text(ffmpegHealthText)
                    .font(.caption)
                    .textSelection(.enabled)
            }
        } header: {
            Text("FFmpeg (optional)")
        } footer: {
            Text("Docyo uses Apple frameworks for most work. FFmpeg fills the gaps: MP3, FLAC, OGG, Opus, WMA, MKV, WebM, AVI, WMV, GIF and AVIF/WebP encoding on older systems.")
        }
    }

    @ViewBuilder private var about: some View {
        Section {
            VStack(spacing: 16) {
                Image(nsImage: BrandArtwork.image(size: 100))
                    .resizable().frame(width: 84, height: 84)
                    .shadow(color: Theme.accent.opacity(0.18), radius: 12, y: 6)
                    .accessibilityLabel("Docyo icon")
                VStack(spacing: 6) {
                    Text("Docyo").font(.system(size: 25, weight: .bold, design: .rounded))
                    Text("Local-first document, media & file converter.")
                        .font(.system(size: 13)).foregroundStyle(.secondary)
                }
                Text("VERSION \(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "Development")  ·  OPEN SOURCE")
                    .font(.system(size: 9, weight: .semibold, design: .monospaced))
                    .tracking(1.1).foregroundStyle(.secondary)
                Divider().padding(.horizontal, 30)
                VStack(spacing: 7) {
                    Text("Docyo Community").font(.system(size: 13, weight: .semibold))
                    Text("Private, non-destructive desktop conversions.")
                        .font(.caption).foregroundStyle(.secondary)
                }
                HStack(spacing: 5) {
                    Text("Maintained by")
                    Link("Subhash Malik", destination: URL(string: "https://github.com/subhashmalik0001/Docyo")!)
                        .fontWeight(.semibold)
                        .help("Visit Docyo on GitHub")
                }
                .font(.system(size: 13))
                .padding(.top, 2)
                Button {
                    if let url = Bundle.main.url(forResource: "avatar", withExtension: "html") {
                        NSWorkspace.shared.open(url)
                    } else {
                        let fallback = URL(fileURLWithPath: "docs/avatar.html")
                        NSWorkspace.shared.open(fallback)
                    }
                } label: {
                    HStack(spacing: 5) {
                        Image(systemName: "cube.transparent")
                        Text("View 3D Interactive Avatar")
                    }
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(Theme.accent)
                }
                .buttonStyle(.plain)
                .padding(.top, 4)
                Text("GPL-3.0-only · Authored by Subhash Malik.\nLocal-first document, media & file converter.")
                    .font(.system(size: 10)).foregroundStyle(.secondary)
                    .multilineTextAlignment(.center).lineSpacing(3)
            }
            .frame(maxWidth: .infinity).padding(.vertical, 20)
        }
    }

    private var ffmpegHealthSymbol: String {
        switch ffmpegHealth {
        case .ready: return "checkmark.circle.fill"
        case .broken: return "xmark.octagon.fill"
        case .missing: return "exclamationmark.triangle.fill"
        }
    }

    private var ffmpegHealthColor: Color {
        switch ffmpegHealth {
        case .ready: return .green
        case .broken: return .red
        case .missing: return .orange
        }
    }

    private var ffmpegHealthText: String {
        switch ffmpegHealth {
        case let .ready(path, version): return "Using ffmpeg \(version) at \(path)"
        case let .broken(path, reason): return "ffmpeg at \(path) cannot run: \(reason)"
        case .missing: return "FFmpeg not found. Install with `brew install ffmpeg` or pick the binary."
        }
    }

    private func chooseFFmpeg() {
        let panel = NSOpenPanel()
        panel.canChooseFiles = true
        panel.canChooseDirectories = false
        panel.allowsMultipleSelection = false
        panel.showsHiddenFiles = true
        panel.directoryURL = URL(fileURLWithPath: "/opt/homebrew/bin")
        if panel.runModal() == .OK, let url = panel.url {
            settings.ffmpegPath = url.path
        }
    }
}

struct SettingsTabBar: View {
    @ObservedObject var model: SettingsTabModel
    @Namespace private var namespace

    var body: some View {
        GlassEffectContainer(spacing: 0) {
            HStack(spacing: 2) {
                ForEach(SettingsTab.allCases) { tab in
                    Button {
                        model.tab = tab
                    } label: {
                        Label(tab.title, systemImage: tab.symbol)
                            .labelStyle(.titleOnly)
                            .font(.system(size: 13, weight: model.tab == tab ? .semibold : .regular))
                            .foregroundStyle(model.tab == tab ? Color.white : Color.primary)
                            .lineLimit(1)
                            .fixedSize()
                            .padding(.horizontal, 14)
                            .padding(.vertical, 6)
                            .contentShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .background {
                        if model.tab == tab {
                            Color.clear
                                .glassEffect(.regular.tint(Theme.accent).interactive(), in: Capsule())
                                .matchedGeometryEffect(id: "selection", in: namespace)
                        }
                    }
                }
            }
            .padding(3)
            .glassEffect(.regular, in: Capsule())
        }
        .animation(.spring(response: 0.3, dampingFraction: 0.85), value: model.tab)
    }
}

final class SettingsWindow: NSWindow {
    var toolbarDelegate: SettingsToolbarDelegate?
}

@MainActor
final class SettingsToolbarDelegate: NSObject, NSToolbarDelegate {
    static let tabsItem = NSToolbarItem.Identifier("docyo.settings.tabs")
    let model: SettingsTabModel

    init(model: SettingsTabModel) {
        self.model = model
    }

    func toolbarDefaultItemIdentifiers(_ toolbar: NSToolbar) -> [NSToolbarItem.Identifier] {
        [.flexibleSpace, Self.tabsItem, .flexibleSpace]
    }

    func toolbarAllowedItemIdentifiers(_ toolbar: NSToolbar) -> [NSToolbarItem.Identifier] {
        toolbarDefaultItemIdentifiers(toolbar)
    }

    func toolbar(
        _ toolbar: NSToolbar,
        itemForItemIdentifier itemIdentifier: NSToolbarItem.Identifier,
        willBeInsertedIntoToolbar flag: Bool
    ) -> NSToolbarItem? {
        guard itemIdentifier == Self.tabsItem else { return nil }
        let item = NSToolbarItem(itemIdentifier: itemIdentifier)
        let hosting = NSHostingView(rootView: SettingsTabBar(model: model))
        hosting.sizingOptions = [.intrinsicContentSize]
        item.view = hosting
        item.isBordered = false
        return item
    }
}


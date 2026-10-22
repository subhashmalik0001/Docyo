import AppKit
import SwiftUI
import WebKit

/// Custom WKWebView subclass with active mouse tracking to drive 3D avatar gaze towards the cursor.
final class InteractiveAvatarWebView: WKWebView {
    var allowsInteraction: Bool = true
    private var trackingArea: NSTrackingArea?

    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        if let existing = trackingArea { removeTrackingArea(existing) }
        let area = NSTrackingArea(
            rect: bounds,
            options: [.mouseMoved, .mouseEnteredAndExited, .activeAlways, .inVisibleRect],
            owner: self,
            userInfo: nil
        )
        addTrackingArea(area)
        trackingArea = area
    }

    override func mouseMoved(with event: NSEvent) {
        super.mouseMoved(with: event)
        guard bounds.width > 0, bounds.height > 0 else { return }
        let pt = convert(event.locationInWindow, from: nil)
        let nx = max(-1.0, min(1.0, (pt.x - bounds.midX) / (bounds.width / 2)))
        let ny = max(-1.0, min(1.0, (bounds.midY - pt.y) / (bounds.height / 2)))
        evaluateJavaScript("window.setGaze && window.setGaze(\(nx), \(ny));", completionHandler: nil)
    }

    override func mouseExited(with event: NSEvent) {
        super.mouseExited(with: event)
        evaluateJavaScript("window.resetGaze && window.resetGaze();", completionHandler: nil)
    }
}

/// Interactive 3D WebGL Avatar renderer embedding the Three.js Grape Penguin from avtar.html.
struct Avatar3DView: NSViewRepresentable {
    var allowsInteraction: Bool = true
    var transparentBackground: Bool = true
    var gaze: CGPoint? = nil

    func makeNSView(context: Context) -> InteractiveAvatarWebView {
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        let webView = InteractiveAvatarWebView(frame: .zero, configuration: config)
        webView.allowsInteraction = allowsInteraction
        webView.setValue(false, forKey: "drawsBackground")
        if transparentBackground {
            webView.underPageBackgroundColor = .clear
        }

        context.coordinator.setup(webView: webView, allowsInteraction: allowsInteraction)

        if let targetURL = BrandArtwork.avatarHTMLURL {
            webView.loadFileURL(targetURL, allowingReadAccessTo: targetURL.deletingLastPathComponent())
        }
        return webView
    }

    func updateNSView(_ nsView: InteractiveAvatarWebView, context: Context) {
        nsView.allowsInteraction = allowsInteraction
        if let gaze = gaze {
            nsView.evaluateJavaScript("window.setGaze && window.setGaze(\(gaze.x), \(gaze.y));", completionHandler: nil)
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        var allowsInteraction: Bool = true

        func setup(webView: WKWebView, allowsInteraction: Bool) {
            self.allowsInteraction = allowsInteraction
            webView.navigationDelegate = self
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            let pointerEvents = allowsInteraction ? "auto" : "none"
            let js = """
            (() => {
                const style = document.createElement("style");
                style.textContent = `
                    html, body {
                        background: transparent !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        width: 100% !important;
                        height: 100% !important;
                        user-select: none !important;
                        -webkit-user-select: none !important;
                    }
                    .dv-bar, .dv-credit, .dv-hint, #da-msg {
                        display: none !important;
                    }
                    canvas.dv-canvas {
                        width: 100% !important;
                        height: 100% !important;
                        display: block !important;
                        background: transparent !important;
                        pointer-events: \(pointerEvents) !important;
                    }
                `;
                document.head.appendChild(style);
                document.body.style.background = "transparent";
            })();
            """
            webView.evaluateJavaScript(js, completionHandler: nil)
        }
    }
}

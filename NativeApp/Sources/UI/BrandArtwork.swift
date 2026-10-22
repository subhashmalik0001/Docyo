import AppKit

/// Brand artwork and assets for Docyo, featuring the 3D Grape Penguin avatar.
enum BrandArtwork {
    private static var _cachedAvatar: NSImage?

    static var avatarURL: URL? {
        if let url = Bundle.main.url(forResource: "avatar", withExtension: "png") {
            return url
        }
        if let resourceURL = Bundle.main.resourceURL?.appendingPathComponent("avatar.png"),
           FileManager.default.fileExists(atPath: resourceURL.path) {
            return resourceURL
        }
        let candidates = [
            "docs/assets/avatar.png",
            "../docs/assets/avatar.png",
            "NativeApp/Sources/Resources/avatar.png",
            "Contents/Resources/avatar.png",
            "/Users/subhash/conver/Open-Tangerine/docs/assets/avatar.png",
            "Desktop/icon.png"
        ]
        for path in candidates {
            let url = URL(fileURLWithPath: path)
            if FileManager.default.fileExists(atPath: url.path) {
                return url
            }
        }
        return nil
    }

    static var avatarHTMLURL: URL? {
        if let url = Bundle.main.url(forResource: "avatar", withExtension: "html") {
            return url
        }
        if let resourceURL = Bundle.main.resourceURL?.appendingPathComponent("avatar.html"),
           FileManager.default.fileExists(atPath: resourceURL.path) {
            return resourceURL
        }
        let candidates = [
            "avtar.html",
            "docs/avatar.html",
            "NativeApp/Sources/Resources/avatar.html",
            "/Users/subhash/conver/Open-Tangerine/avtar.html",
            "/Users/subhash/conver/Open-Tangerine/docs/avatar.html"
        ]
        for path in candidates {
            let url = URL(fileURLWithPath: path)
            if FileManager.default.fileExists(atPath: url.path) {
                return url
            }
        }
        return nil
    }

    static var avatarSourceImage: NSImage? {
        if let img = _cachedAvatar { return img }
        if let url = avatarURL, let img = NSImage(contentsOf: url) {
            _cachedAvatar = img
            return img
        }
        return nil
    }

    static var avatarImage: NSImage {
        if let img = avatarSourceImage {
            return img
        }
        return image(size: 256)
    }

    static func avatar(size: CGFloat) -> NSImage {
        let img = NSImage(size: NSSize(width: size, height: size), flipped: false) { rect in
            NSGraphicsContext.current?.imageInterpolation = .high
            if let source = avatarSourceImage {
                source.draw(in: rect, from: .zero, operation: .sourceOver, fraction: 1.0)
                return true
            }
            return false
        }
        img.isTemplate = false
        return img
    }

    static func image(size: CGFloat, template: Bool = false) -> NSImage {
        if !template {
            if let _ = avatarSourceImage {
                return avatar(size: size)
            }
        }

        // Template menu bar icon: crisp document with loop
        let image = NSImage(size: NSSize(width: size, height: size), flipped: false) { rect in
            let s = rect.width
            let strokeColor = NSColor.labelColor
            strokeColor.setStroke()

            let docRect = NSRect(x: s * 0.22, y: s * 0.14, width: s * 0.56, height: s * 0.72)
            let doc = NSBezierPath(roundedRect: docRect, xRadius: s * 0.09, yRadius: s * 0.09)
            doc.lineWidth = max(1.2, s * 0.08)
            doc.stroke()

            let center = NSPoint(x: docRect.midX, y: docRect.midY)
            let r = s * 0.16
            let loop = NSBezierPath()
            loop.appendArc(withCenter: center, radius: r, startAngle: 25, endAngle: 185)
            loop.lineWidth = max(1.0, s * 0.08)
            loop.lineCapStyle = .round
            loop.stroke()

            let loop2 = NSBezierPath()
            loop2.appendArc(withCenter: center, radius: r, startAngle: 205, endAngle: 365)
            loop2.lineWidth = max(1.0, s * 0.08)
            loop2.lineCapStyle = .round
            loop2.stroke()
            return true
        }
        image.isTemplate = template
        return image
    }
}

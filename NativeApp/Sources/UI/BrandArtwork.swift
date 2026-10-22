import AppKit

/// Original vector mark for Docyo, shared by app artwork, generated icons, and the template menu-bar icon.
enum BrandArtwork {
    static func image(size: CGFloat, template: Bool = false) -> NSImage {
        let image = NSImage(size: NSSize(width: size, height: size), flipped: false) { rect in
            let s = rect.width
            let ctx = NSGraphicsContext.current?.cgContext

            if !template {
                // Background squircle (macOS continuous corner standard)
                let inset = s * 0.05
                let corner = s * 0.22
                let bgPath = NSBezierPath(roundedRect: rect.insetBy(dx: inset, dy: inset), xRadius: corner, yRadius: corner)

                // Rich indigo-to-sapphire gradient for Docyo
                let colorSpace = CGColorSpaceCreateDeviceRGB()
                let startColor = CGColor(srgbRed: 0.12, green: 0.35, blue: 0.94, alpha: 1.0)
                let endColor = CGColor(srgbRed: 0.24, green: 0.58, blue: 0.99, alpha: 1.0)
                if let gradient = CGGradient(colorsSpace: colorSpace, colors: [startColor, endColor] as CFArray, locations: [0.0, 1.0]) {
                    ctx?.saveGState()
                    bgPath.addClip()
                    ctx?.drawLinearGradient(
                        gradient,
                        start: CGPoint(x: inset, y: inset),
                        end: CGPoint(x: s - inset, y: s - inset),
                        options: []
                    )
                    ctx?.restoreGState()
                }

                // Subtle inner border highlight
                ctx?.saveGState()
                let borderPath = NSBezierPath(roundedRect: rect.insetBy(dx: inset + 1, dy: inset + 1), xRadius: corner - 1, yRadius: corner - 1)
                borderPath.lineWidth = max(1.0, s * 0.015)
                NSColor(white: 1.0, alpha: 0.22).setStroke()
                borderPath.stroke()
                ctx?.restoreGState()

                // Foreground: Layered document cards representing file conversion
                // Back sheet (translucent document)
                let backDoc = NSBezierPath(roundedRect: NSRect(x: s * 0.34, y: s * 0.32, width: s * 0.36, height: s * 0.44), xRadius: s * 0.05, yRadius: s * 0.05)
                NSColor(white: 1.0, alpha: 0.35).setFill()
                backDoc.fill()

                // Front main sheet
                let frontDocRect = NSRect(x: s * 0.24, y: s * 0.22, width: s * 0.38, height: s * 0.46)
                let frontDoc = NSBezierPath(roundedRect: frontDocRect, xRadius: s * 0.05, yRadius: s * 0.05)
                NSColor.white.setFill()
                frontDoc.fill()

                // Conversion loop symbol on the front document
                let center = NSPoint(x: frontDocRect.midX, y: frontDocRect.midY)
                let loopRadius = s * 0.095
                let loopPath = NSBezierPath()
                loopPath.appendArc(withCenter: center, radius: loopRadius, startAngle: 30, endAngle: 180)
                loopPath.lineWidth = max(1.5, s * 0.035)
                loopPath.lineCapStyle = .round
                NSColor(srgbRed: 0.12, green: 0.38, blue: 0.95, alpha: 1.0).setStroke()
                loopPath.stroke()

                // Bottom arc
                let loopBottom = NSBezierPath()
                loopBottom.appendArc(withCenter: center, radius: loopRadius, startAngle: 210, endAngle: 360)
                loopBottom.lineWidth = max(1.5, s * 0.035)
                loopBottom.lineCapStyle = .round
                loopBottom.stroke()

                // Arrow heads for conversion cycle
                let arrow1 = NSBezierPath()
                arrow1.move(to: NSPoint(x: center.x - loopRadius - s * 0.03, y: center.y + s * 0.01))
                arrow1.line(to: NSPoint(x: center.x - loopRadius, y: center.y - s * 0.02))
                arrow1.line(to: NSPoint(x: center.x - loopRadius + s * 0.03, y: center.y + s * 0.01))
                arrow1.lineWidth = max(1.2, s * 0.03)
                arrow1.lineCapStyle = .round
                arrow1.lineJoinStyle = .round
                arrow1.stroke()

                let arrow2 = NSBezierPath()
                arrow2.move(to: NSPoint(x: center.x + loopRadius - s * 0.03, y: center.y - s * 0.01))
                arrow2.line(to: NSPoint(x: center.x + loopRadius, y: center.y + s * 0.02))
                arrow2.line(to: NSPoint(x: center.x + loopRadius + s * 0.03, y: center.y - s * 0.01))
                arrow2.lineWidth = max(1.2, s * 0.03)
                arrow2.lineCapStyle = .round
                arrow2.lineJoinStyle = .round
                arrow2.stroke()
            } else {
                // Template menu bar icon: crisp document with loop
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
            }
            return true
        }
        image.isTemplate = template
        return image
    }
}

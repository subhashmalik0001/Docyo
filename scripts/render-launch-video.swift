import Foundation
import AppKit
import AVFoundation
import CoreGraphics
import CoreText
import CoreVideo
import CoreMedia

// MARK: - Math & Motion Curves

@inline(__always)
func clamp(_ x: CGFloat, _ a: CGFloat = 0, _ b: CGFloat = 1) -> CGFloat {
    min(max(x, a), b)
}

@inline(__always)
func prog(_ t: CGFloat, _ start: CGFloat, _ dur: CGFloat) -> CGFloat {
    guard dur > 0 else { return t >= start ? 1 : 0 }
    return clamp((t - start) / dur)
}

@inline(__always)
func lerp(_ a: CGFloat, _ b: CGFloat, _ t: CGFloat) -> CGFloat {
    a + (b - a) * t
}

/// Studio cubic-bezier approximation of (0.22, 1, 0.36, 1) — fast launch, silky settle
@inline(__always)
func easeOutQuint(_ x: CGFloat) -> CGFloat {
    let c = clamp(x)
    return 1 - pow(1 - c, 4.2)
}

@inline(__always)
func easeInOutCubic(_ x: CGFloat) -> CGFloat {
    let c = clamp(x)
    return c < 0.5 ? 4 * c * c * c : 1 - pow(-2 * c + 2, 3) / 2
}

/// Physical critically-damped slight-overshoot spring for radial wheel wedges & badges
@inline(__always)
func springPop(_ x: CGFloat) -> CGFloat {
    let c = clamp(x)
    if c == 0 || c == 1 { return c }
    return 1 - exp(-6.8 * c) * cos(9.5 * c)
}

// MARK: - Strict Design System Palette (Black, White, Purple ONLY)

enum Palette {
    static let bgObsidian   = NSColor(srgbRed: 10/255,  green: 10/255,  blue: 11/255,  alpha: 1) // #0A0A0B
    static let surface1     = NSColor(srgbRed: 17/255,  green: 17/255,  blue: 20/255,  alpha: 1) // #111114
    static let surface2     = NSColor(srgbRed: 23/255,  green: 23/255,  blue: 27/255,  alpha: 1) // #17171B
    static let pureBlack    = NSColor(srgbRed: 0,       green: 0,       blue: 0,       alpha: 1)
    static let pureWhite    = NSColor(srgbRed: 1,       green: 1,       blue: 1,       alpha: 1) // #FFFFFF
    static let purple       = NSColor(srgbRed: 124/255, green: 58/255,  blue: 237/255, alpha: 1) // #7C3AED
    static let purpleSoft   = NSColor(srgbRed: 167/255, green: 139/255, blue: 250/255, alpha: 1) // #A78BFA
    static let purpleDeep   = NSColor(srgbRed: 76/255,  green: 29/255,  blue: 149/255, alpha: 1) // #4C1D95

    static func white(_ a: CGFloat) -> NSColor {
        NSColor(srgbRed: 1, green: 1, blue: 1, alpha: clamp(a))
    }
    static func black(_ a: CGFloat) -> NSColor {
        NSColor(srgbRed: 10/255, green: 10/255, blue: 11/255, alpha: clamp(a))
    }
    static func purple(_ a: CGFloat) -> NSColor {
        NSColor(srgbRed: 124/255, green: 58/255, blue: 237/255, alpha: clamp(a))
    }
    static func purpleSoft(_ a: CGFloat) -> NSColor {
        NSColor(srgbRed: 167/255, green: 139/255, blue: 250/255, alpha: clamp(a))
    }
}

// MARK: - Typography Loader (Geist Sans + Geist Mono + System SF Pro Display Fallback)

final class StudioFonts {
    private var displaySemiName: String?
    private var displayBoldName: String?
    private var sansMedName: String?
    private var sansRegName: String?
    private var monoMedName: String?
    private var monoSemiName: String?

    init(repoRoot: URL) {
        let sansDir = repoRoot.appendingPathComponent("website/node_modules/geist/dist/fonts/geist-sans")
        let monoDir = repoRoot.appendingPathComponent("website/node_modules/geist/dist/fonts/geist-mono")

        displaySemiName = Self.registerFont(at: sansDir.appendingPathComponent("Geist-SemiBold.ttf"))
        displayBoldName = Self.registerFont(at: sansDir.appendingPathComponent("Geist-Bold.ttf"))
        sansMedName     = Self.registerFont(at: sansDir.appendingPathComponent("Geist-Medium.ttf"))
        sansRegName     = Self.registerFont(at: sansDir.appendingPathComponent("Geist-Regular.ttf"))
        monoMedName     = Self.registerFont(at: monoDir.appendingPathComponent("GeistMono-Medium.ttf"))
        monoSemiName    = Self.registerFont(at: monoDir.appendingPathComponent("GeistMono-SemiBold.ttf"))
    }

    private static func registerFont(at url: URL) -> String? {
        guard FileManager.default.fileExists(atPath: url.path) else { return nil }
        CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        guard let descriptors = CTFontManagerCreateFontDescriptorsFromURL(url as CFURL) as? [CTFontDescriptor],
              let first = descriptors.first,
              let psName = CTFontDescriptorCopyAttribute(first, kCTFontNameAttribute) as? String else {
            return nil
        }
        return psName
    }

    func display(_ size: CGFloat, bold: Bool = false) -> NSFont {
        if let name = (bold ? displayBoldName : displaySemiName), let f = NSFont(name: name, size: size) {
            return f
        }
        return NSFont.systemFont(ofSize: size, weight: bold ? .bold : .semibold)
    }

    func sans(_ size: CGFloat, medium: Bool = false) -> NSFont {
        if let name = (medium ? sansMedName : sansRegName), let f = NSFont(name: name, size: size) {
            return f
        }
        return NSFont.systemFont(ofSize: size, weight: medium ? .medium : .regular)
    }

    func mono(_ size: CGFloat, semibold: Bool = false) -> NSFont {
        if let name = (semibold ? monoSemiName : monoMedName), let f = NSFont(name: name, size: size) {
            return f
        }
        return NSFont.monospacedSystemFont(ofSize: size, weight: semibold ? .semibold : .medium)
    }
}

// MARK: - Top-Left Canvas Drawing Helpers (1920 x 1080)

struct Canvas {
    let ctx: CGContext
    let width: CGFloat = 1920
    let height: CGFloat = 1080
    let fonts: StudioFonts
    let avatar: CGImage?

    func fillScreen(_ color: NSColor) {
        ctx.saveGState()
        ctx.setFillColor(color.cgColor)
        ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))
        ctx.restoreGState()
    }

    func drawGrid(lineAlpha: CGFloat = 0.032, step: CGFloat = 64, darkInk: Bool = false) {
        ctx.saveGState()
        let c = darkInk ? Palette.black(lineAlpha) : Palette.white(lineAlpha)
        ctx.setStrokeColor(c.cgColor)
        ctx.setLineWidth(1)
        var x: CGFloat = 0
        while x <= width {
            ctx.move(to: CGPoint(x: x + 0.5, y: 0))
            ctx.addLine(to: CGPoint(x: x + 0.5, y: height))
            x += step
        }
        var y: CGFloat = 0
        while y <= height {
            ctx.move(to: CGPoint(x: 0, y: y + 0.5))
            ctx.addLine(to: CGPoint(x: width, y: y + 0.5))
            y += step
        }
        ctx.strokePath()
        ctx.restoreGState()
    }

    func drawRadialSpotlight(cx: CGFloat, cy: CGFloat, radius: CGFloat, alpha: CGFloat) {
        guard alpha > 0.001 else { return }
        ctx.saveGState()
        let cs = CGColorSpace(name: CGColorSpace.sRGB)!
        let colors = [
            Palette.purple(alpha).cgColor,
            Palette.purple(alpha * 0.32).cgColor,
            Palette.purple(0).cgColor
        ] as CFArray
        let locs: [CGFloat] = [0.0, 0.48, 1.0]
        if let grad = CGGradient(colorsSpace: cs, colors: colors, locations: locs) {
            ctx.drawRadialGradient(
                grad,
                startCenter: CGPoint(x: cx, y: cy),
                startRadius: 0,
                endCenter: CGPoint(x: cx, y: cy),
                endRadius: radius,
                options: []
            )
        }
        ctx.restoreGState()
    }

    func roundedRectPath(_ rect: CGRect, radius: CGFloat) -> CGPath {
        CGPath(roundedRect: rect, cornerWidth: radius, cornerHeight: radius, transform: nil)
    }

    func drawBox(
        _ rect: CGRect,
        radius: CGFloat,
        fill: NSColor?,
        stroke: NSColor? = nil,
        lineWidth: CGFloat = 1.5,
        shadowAlpha: CGFloat = 0,
        shadowBlur: CGFloat = 32,
        shadowY: CGFloat = 14
    ) {
        ctx.saveGState()
        let path = roundedRectPath(rect, radius: radius)
        if let fill = fill {
            if shadowAlpha > 0 {
                ctx.setShadow(
                    offset: CGSize(width: 0, height: -shadowY), // Note: CG shadow offset is device-space Y
                    blur: shadowBlur,
                    color: NSColor(srgbRed: 0, green: 0, blue: 0, alpha: shadowAlpha).cgColor
                )
            }
            ctx.addPath(path)
            ctx.setFillColor(fill.cgColor)
            ctx.fillPath()
        }
        ctx.restoreGState()

        if let stroke = stroke {
            ctx.saveGState()
            ctx.addPath(path)
            ctx.setStrokeColor(stroke.cgColor)
            ctx.setLineWidth(lineWidth)
            ctx.strokePath()
            ctx.restoreGState()
        }
    }

    /// Correctly draws a CGImage right-side-up inside our top-left flipped coordinate space
    func drawImage(_ img: CGImage?, in rect: CGRect, alpha: CGFloat = 1.0, cornerRadius: CGFloat = 0) {
        guard let img = img, alpha > 0.001 else { return }
        ctx.saveGState()
        ctx.setAlpha(clamp(alpha))
        if cornerRadius > 0 {
            ctx.addPath(roundedRectPath(rect, radius: cornerRadius))
            ctx.clip()
        }
        ctx.interpolationQuality = .high
        // Unflip locally around rect so CGImage renders right-side-up
        ctx.translateBy(x: rect.minX, y: rect.maxY)
        ctx.scaleBy(x: 1, y: -1)
        ctx.draw(img, in: CGRect(x: 0, y: 0, width: rect.width, height: rect.height))
        ctx.restoreGState()
    }

    /// Draws the official Docyo 3D Purple Scholar Penguin inside an optional squircle app dock badge
    func drawLogoSquircle(center: CGPoint, size: CGFloat, scale: CGFloat = 1.0, alpha: CGFloat = 1.0, glowAlpha: CGFloat = 0.25) {
        guard alpha > 0.001, scale > 0.01 else { return }
        let s = size * scale
        let rect = CGRect(x: center.x - s / 2, y: center.y - s / 2, width: s, height: s)
        if glowAlpha > 0 {
            drawRadialSpotlight(cx: center.x, cy: center.y, radius: s * 1.35, alpha: glowAlpha * alpha)
        }
        drawBox(
            rect,
            radius: s * 0.24,
            fill: Palette.surface1.withAlphaComponent(alpha),
            stroke: Palette.purple(0.55 * alpha),
            lineWidth: 2.0,
            shadowAlpha: 0.55 * alpha,
            shadowBlur: 36,
            shadowY: 14
        )
        let pad = s * 0.10
        drawImage(avatar, in: rect.insetBy(dx: pad, dy: pad), alpha: alpha)
    }

    @discardableResult
    func drawText(
        _ text: String,
        at point: CGPoint,
        font: NSFont,
        color: NSColor,
        tracking: CGFloat = 0,
        align: NSTextAlignment = .left,
        maxWidth: CGFloat? = nil
    ) -> CGSize {
        let paragraph = NSMutableParagraphStyle()
        paragraph.alignment = align
        let attrs: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: color,
            .kern: tracking,
            .paragraphStyle: paragraph
        ]
        let attrStr = NSAttributedString(string: text, attributes: attrs)
        let size = attrStr.size()
        if let maxW = maxWidth {
            let drawRect = CGRect(x: point.x, y: point.y, width: maxW, height: size.height * 2.5)
            attrStr.draw(in: drawRect)
            return size
        } else {
            var drawX = point.x
            if align == .center {
                drawX -= size.width / 2
            } else if align == .right {
                drawX -= size.width
            }
            attrStr.draw(at: CGPoint(x: drawX, y: point.y))
            return size
        }
    }

    func measureText(_ text: String, font: NSFont, tracking: CGFloat = 0) -> CGSize {
        let attrs: [NSAttributedString.Key: Any] = [.font: font, .kern: tracking]
        return NSAttributedString(string: text, attributes: attrs).size()
    }

    func drawPill(
        centerX: CGFloat,
        topY: CGFloat,
        text: String,
        font: NSFont,
        textColor: NSColor,
        fill: NSColor,
        stroke: NSColor,
        padX: CGFloat = 22,
        padY: CGFloat = 10,
        dotColor: NSColor? = nil,
        alpha: CGFloat = 1
    ) -> CGRect {
        let tSize = measureText(text, font: font, tracking: 0.8)
        let dotSpace: CGFloat = dotColor != nil ? 18 : 0
        let w = tSize.width + padX * 2 + dotSpace
        let h = tSize.height + padY * 2
        let rect = CGRect(x: centerX - w / 2, y: topY, width: w, height: h)
        drawBox(
            rect,
            radius: h / 2,
            fill: fill.withAlphaComponent(fill.alphaComponent * alpha),
            stroke: stroke.withAlphaComponent(stroke.alphaComponent * alpha),
            lineWidth: 1.5
        )
        var textX = rect.minX + padX
        if let dot = dotColor {
            ctx.saveGState()
            ctx.setFillColor(dot.withAlphaComponent(alpha).cgColor)
            let d: CGFloat = 8
            ctx.fillEllipse(in: CGRect(x: textX, y: rect.midY - d / 2, width: d, height: d))
            ctx.restoreGState()
            textX += 18
        }
        drawText(
            text,
            at: CGPoint(x: textX, y: rect.minY + padY - 1),
            font: font,
            color: textColor.withAlphaComponent(textColor.alphaComponent * alpha),
            tracking: 0.8
        )
        return rect
    }

    func drawCheckmark(center: CGPoint, size: CGFloat, color: NSColor, lineWidth: CGFloat = 2.4) {
        ctx.saveGState()
        ctx.setStrokeColor(color.cgColor)
        ctx.setLineWidth(lineWidth)
        ctx.setLineCap(.round)
        ctx.setLineJoin(.round)
        ctx.move(to: CGPoint(x: center.x - size * 0.34, y: center.y + size * 0.02))
        ctx.addLine(to: CGPoint(x: center.x - size * 0.08, y: center.y + size * 0.28))
        ctx.addLine(to: CGPoint(x: center.x + size * 0.38, y: center.y - size * 0.24))
        ctx.strokePath()
        ctx.restoreGState()
    }

    func drawCursor(at p: CGPoint, pressed: Bool = false, alpha: CGFloat = 1.0) {
        guard alpha > 0.01 else { return }
        ctx.saveGState()
        ctx.translateBy(x: p.x, y: p.y)
        let sc: CGFloat = pressed ? 0.90 : 1.0
        ctx.scaleBy(x: sc, y: sc)

        let path = CGMutablePath()
        path.move(to: CGPoint(x: 0, y: 0))
        path.addLine(to: CGPoint(x: 0, y: 26))
        path.addLine(to: CGPoint(x: 7.2, y: 20.2))
        path.addLine(to: CGPoint(x: 12.2, y: 30.5))
        path.addLine(to: CGPoint(x: 16.4, y: 28.5))
        path.addLine(to: CGPoint(x: 11.4, y: 18.2))
        path.addLine(to: CGPoint(x: 20.0, y: 18.2))
        path.closeSubpath()

        ctx.setShadow(offset: CGSize(width: 0, height: -4), blur: 10, color: NSColor(srgbRed: 0, green: 0, blue: 0, alpha: 0.6 * alpha).cgColor)
        ctx.addPath(path)
        ctx.setFillColor(Palette.pureBlack.withAlphaComponent(alpha).cgColor)
        ctx.fillPath()

        ctx.setShadow(offset: .zero, blur: 0, color: nil)
        ctx.addPath(path)
        ctx.setStrokeColor(Palette.pureWhite.withAlphaComponent(alpha).cgColor)
        ctx.setLineWidth(2.0)
        ctx.strokePath()
        ctx.restoreGState()
    }

    func drawAnnularWedge(
        cx: CGFloat,
        cy: CGFloat,
        rInner: CGFloat,
        rOuter: CGFloat,
        index: Int,
        count: Int,
        gapPx: CGFloat = 7,
        pushOut: CGFloat = 0,
        scale: CGFloat = 1.0,
        fill: NSColor,
        stroke: NSColor,
        lineWidth: CGFloat,
        label: String,
        sublabel: String,
        isHighlighted: Bool,
        alpha: CGFloat = 1.0
    ) {
        guard scale > 0.02, alpha > 0.01 else { return }
        let slice = (.pi * 2.0) / CGFloat(count)
        // Top-left coordinates: 12 o'clock is -pi/2, clockwise increases angle!
        let centerAngle = -.pi / 2.0 + CGFloat(index) * slice
        let halfSlice = slice / 2.0

        let rIn = rInner * scale
        let rOut = rOuter * scale
        let gapOuter = gapPx / (2.0 * max(rOut, 1))
        let gapInner = gapPx / (2.0 * max(rIn, 1))

        let aOutStart = centerAngle - halfSlice + gapOuter
        let aOutEnd   = centerAngle + halfSlice - gapOuter
        let aInStart  = centerAngle - halfSlice + gapInner
        let aInEnd    = centerAngle + halfSlice - gapInner

        let dx = cos(centerAngle) * pushOut
        let dy = sin(centerAngle) * pushOut
        let ox = cx + dx
        let oy = cy + dy

        let path = CGMutablePath()
        path.addArc(center: CGPoint(x: ox, y: oy), radius: rOut, startAngle: aOutStart, endAngle: aOutEnd, clockwise: false)
        path.addArc(center: CGPoint(x: ox, y: oy), radius: rIn, startAngle: aInEnd, endAngle: aInStart, clockwise: true)
        path.closeSubpath()

        ctx.saveGState()
        ctx.addPath(path)
        ctx.setFillColor(fill.withAlphaComponent(fill.alphaComponent * alpha).cgColor)
        ctx.fillPath()

        ctx.addPath(path)
        ctx.setStrokeColor(stroke.withAlphaComponent(stroke.alphaComponent * alpha).cgColor)
        ctx.setLineWidth(lineWidth)
        ctx.strokePath()
        ctx.restoreGState()

        if scale > 0.55 {
            let labelR = rIn + (rOut - rIn) * 0.52
            let lx = ox + cos(centerAngle) * labelR
            let ly = oy + sin(centerAngle) * labelR
            drawText(
                label,
                at: CGPoint(x: lx, y: ly - (sublabel.isEmpty ? 9 : 15)),
                font: fonts.mono(15, semibold: true),
                color: (isHighlighted ? Palette.pureWhite : Palette.white(0.88)).withAlphaComponent(alpha),
                tracking: 0.8,
                align: .center
            )
            if !sublabel.isEmpty {
                drawText(
                    sublabel,
                    at: CGPoint(x: lx, y: ly + 5),
                    font: fonts.mono(11.5, semibold: false),
                    color: (isHighlighted ? Palette.purpleSoft : Palette.white(0.42)).withAlphaComponent(alpha),
                    tracking: 0.4,
                    align: .center
                )
            }
        }
    }
}

// MARK: - 7-Act Launch Film Storyboard Renderer (32.0s @ 60fps = 1,920 frames)

struct LaunchFilmDirector {
    let fonts: StudioFonts
    let avatar: CGImage?
    let duration: Double = 32.0
    let fps: Int = 60

    func renderFrame(time tSec: Double, into rawCtx: CGContext) {
        let t = CGFloat(tSec)

        // Flip CGContext so (0, 0) is TOP-LEFT (1920 x 1080) and pair with flipped NSGraphicsContext
        rawCtx.saveGState()
        rawCtx.translateBy(x: 0, y: 1080)
        rawCtx.scaleBy(x: 1, y: -1)

        let nsCtx = NSGraphicsContext(cgContext: rawCtx, flipped: true)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = nsCtx

        let c = Canvas(ctx: rawCtx, fonts: fonts, avatar: avatar)

        if t < 4.2 {
            renderAct1BrandReveal(c, t: t)
        } else if t < 11.8 {
            renderAct2InteractiveDesktop(c, t: t - 4.2)
        } else if t < 16.6 {
            renderAct3ModifierRingsAndTools(c, t: t - 11.8)
        } else if t < 21.4 {
            renderAct4FormatMatrix176(c, t: t - 16.6)
        } else if t < 26.2 {
            renderAct5WhitePrivacyContrast(c, t: t - 21.4)
        } else {
            renderAct6FinaleCTA(c, t: t - 26.2)
        }

        // Smooth cross-scene micro-transitions & clean end fade
        drawSceneTransitionOverlay(c, globalT: t)

        NSGraphicsContext.restoreGraphicsState()
        rawCtx.restoreGState()
    }

    // MARK: Act 1 (0.0s - 4.2s): Cold Open -> Official Penguin Reveal -> "Drag. Hold Shift. Convert."
    private func renderAct1BrandReveal(_ c: Canvas, t: CGFloat) {
        c.fillScreen(Palette.bgObsidian)
        c.drawGrid(lineAlpha: 0.032)

        if t < 1.42 {
            // Cold open hook
            let enter = easeOutQuint(prog(t, 0.08, 0.48))
            let exit = 1.0 - easeInOutCubic(prog(t, 1.15, 0.26))
            let a = enter * exit
            let yOff = (1 - enter) * 26

            c.drawRadialSpotlight(cx: 960, cy: 520, radius: 560, alpha: 0.16 * a)
            c.drawText(
                "WHY UPLOAD PRIVATE FILES TO THE CLOUD",
                at: CGPoint(x: 960, y: 430 + yOff),
                font: fonts.mono(16, semibold: true),
                color: Palette.purpleSoft(a),
                tracking: 3.0,
                align: .center
            )
            c.drawText(
                "Just to change four letters after a dot?",
                at: CGPoint(x: 960, y: 476 + yOff),
                font: fonts.display(64, bold: false),
                color: Palette.white(a),
                tracking: -2.0,
                align: .center
            )

            // Horizontal purple laser wipe at 1.18s - 1.42s
            let scan = prog(t, 1.14, 0.28)
            if scan > 0 && scan < 1 {
                let lineW = lerp(120, 1600, easeOutQuint(scan))
                let lineA = sin(scan * .pi)
                c.drawBox(
                    CGRect(x: 960 - lineW / 2, y: 538, width: lineW, height: 2.5),
                    radius: 1.25,
                    fill: Palette.purple(lineA)
                )
            }
        } else {
            // Brand Reveal (1.42s -> 4.20s)
            let local = t - 1.42
            let logoEnter = springPop(prog(local, 0.0, 0.62))
            let logoAlpha = easeOutQuint(prog(local, 0.0, 0.35))

            c.drawRadialSpotlight(cx: 960, cy: 420, radius: 680, alpha: 0.24 * logoAlpha)

            // Official Docyo 3D Purple Scholar Penguin Dock Icon
            c.drawLogoSquircle(
                center: CGPoint(x: 960, y: 278),
                size: 152,
                scale: 0.72 + 0.28 * logoEnter,
                alpha: logoAlpha,
                glowAlpha: 0.28
            )

            // Wordmark + Eyebrow Pill
            let pillP = easeOutQuint(prog(local, 0.18, 0.45))
            c.drawPill(
                centerX: 960,
                topY: 386 + (1 - pillP) * 16,
                text: "DOCYO v0.2  ·  LOCAL-FIRST FILE CONVERTER & TOOLKIT",
                font: fonts.mono(14, semibold: true),
                textColor: Palette.white(0.88),
                fill: Palette.surface1,
                stroke: Palette.white(0.12),
                dotColor: Palette.purple,
                alpha: pillP
            )

            // 3-Beat Split Headline: "Drag." | "Hold Shift." | "Convert."
            let fBig = fonts.display(112, bold: true)
            let w1 = "Drag."
            let w2 = "Hold Shift."
            let w3 = "Convert."
            let gap: CGFloat = 32
            let s1 = c.measureText(w1, font: fBig, tracking: -3.8)
            let s2 = c.measureText(w2, font: fBig, tracking: -3.8)
            let s3 = c.measureText(w3, font: fBig, tracking: -3.8)
            let totalW = s1.width + gap + s2.width + gap + s3.width
            let startX = 960 - totalW / 2
            let baseY: CGFloat = 472

            let b1 = easeOutQuint(prog(local, 0.42, 0.44))
            let b2 = easeOutQuint(prog(local, 0.80, 0.44))
            let b3 = easeOutQuint(prog(local, 1.18, 0.44))

            if b1 > 0 {
                c.drawText(
                    w1,
                    at: CGPoint(x: startX, y: baseY + (1 - b1) * 42),
                    font: fBig,
                    color: Palette.white(b1),
                    tracking: -3.8
                )
            }
            if b2 > 0 {
                c.drawText(
                    w2,
                    at: CGPoint(x: startX + s1.width + gap, y: baseY + (1 - b2) * 42),
                    font: fBig,
                    color: Palette.purpleSoft(b2),
                    tracking: -3.8
                )
            }
            if b3 > 0 {
                c.drawText(
                    w3,
                    at: CGPoint(x: startX + s1.width + gap + s2.width + gap, y: baseY + (1 - b3) * 42),
                    font: fBig,
                    color: Palette.white(b3),
                    tracking: -3.8
                )
            }

            let subP = easeOutQuint(prog(local, 1.52, 0.50))
            if subP > 0 {
                c.drawText(
                    "Private. Offline. Non-destructive. Zero cloud uploads, zero accounts, zero telemetry.",
                    at: CGPoint(x: 960, y: 632 + (1 - subP) * 18),
                    font: fonts.sans(25, medium: false),
                    color: Palette.white(0.60 * subP),
                    tracking: -0.3,
                    align: .center
                )
            }
        }
    }

    // MARK: Act 2 (4.2s - 11.8s, dur 7.6s): Simulated macOS Desktop -> Drag -> Shift Radial Wheel -> Notch Companion -> Atomic PNG
    private func renderAct2InteractiveDesktop(_ c: Canvas, t: CGFloat) {
        c.fillScreen(Palette.bgObsidian)
        c.drawGrid(lineAlpha: 0.024)
        c.drawRadialSpotlight(cx: 960, cy: 540, radius: 740, alpha: 0.18)

        let winEnter = easeOutQuint(prog(t, 0.0, 0.55))
        let winScale = lerp(0.96, 1.0, winEnter)
        let winW: CGFloat = 1660 * winScale
        let winH: CGFloat = 900 * winScale
        let winRect = CGRect(x: 960 - winW / 2, y: 552 - winH / 2, width: winW, height: winH)

        c.drawBox(
            winRect,
            radius: 26,
            fill: Palette.surface1,
            stroke: Palette.white(0.12),
            lineWidth: 1.5,
            shadowAlpha: 0.72,
            shadowBlur: 60,
            shadowY: 24
        )

        // Menu Bar inside simulated Mac screen
        let barRect = CGRect(x: winRect.minX + 1.5, y: winRect.minY + 1.5, width: winRect.width - 3, height: 54)
        c.ctx.saveGState()
        c.ctx.addPath(c.roundedRectPath(winRect, radius: 26))
        c.ctx.clip()
        c.ctx.setFillColor(Palette.bgObsidian.cgColor)
        c.ctx.fill(barRect)
        c.ctx.setStrokeColor(Palette.white(0.08).cgColor)
        c.ctx.setLineWidth(1)
        c.ctx.move(to: CGPoint(x: barRect.minX, y: barRect.maxY))
        c.ctx.addLine(to: CGPoint(x: barRect.maxX, y: barRect.maxY))
        c.ctx.strokePath()

        // Traffic lights & Finder menu items
        for i in 0..<3 {
            c.ctx.setFillColor(Palette.white(0.18).cgColor)
            c.ctx.fillEllipse(in: CGRect(x: barRect.minX + 24 + CGFloat(i) * 20, y: barRect.midY - 6, width: 12, height: 12))
        }
        c.drawText("Finder", at: CGPoint(x: barRect.minX + 98, y: barRect.minY + 17), font: fonts.sans(15, medium: true), color: Palette.white(0.85))
        c.drawText("File    Edit    View    Go", at: CGPoint(x: barRect.minX + 164, y: barRect.minY + 17), font: fonts.sans(15), color: Palette.white(0.42))

        // Right menu bar Docyo penguin status item
        c.drawImage(avatar, in: CGRect(x: barRect.maxX - 156, y: barRect.midY - 12, width: 24, height: 24))
        c.drawText("Docyo  LOCAL", at: CGPoint(x: barRect.maxX - 124, y: barRect.minY + 18), font: fonts.mono(13, semibold: true), color: Palette.white(0.75))

        // Timeline events inside Act 2 (t = 0 .. 7.6s):
        // 0.3 -> 1.1s : cursor moves to photo.heic
        // 1.2s        : pointer down & starts dragging toward center (960, 565)
        // 1.4s        : [ ⇧ Shift ] pressed -> Radial Wheel blooms open!
        // 2.3 -> 3.6s : cursor hovers onto wedge 0 / 1 ("PNG")
        // 3.8s        : cursor releases on PNG!
        // 3.8 -> 5.7s : Notch Companion runs RECEIVED -> PROCESSING (0->100%) -> SUCCESS
        // 5.5 -> 7.6s : Atomic output card photo.png glows on right!

        let shiftHeld = t >= 1.35 && t < 4.15
        let wheelOpen = prog(t, 1.38, 0.52)
        let dropped   = t >= 3.85
        let hoverPNG  = t >= 2.45 && !dropped
        let convProg  = clamp((t - 3.90) / 1.65) // 0 -> 1 between 3.90s and 5.55s
        let convDone  = t >= 5.55

        // MacBook Notch Companion State
        let notchExpanded = t >= 1.45
        let notchExpandP = easeOutQuint(prog(t, 1.45, 0.42))
        let notchW = lerp(220, 420, notchExpandP)
        let notchH = lerp(42, 60, notchExpandP)
        let notchRect = CGRect(x: 960 - notchW / 2, y: winRect.minY, width: notchW, height: notchH)

        c.drawBox(
            notchRect,
            radius: 18,
            fill: Palette.pureBlack,
            stroke: convDone ? Palette.purple(0.70) : Palette.white(0.16),
            lineWidth: 1.5,
            shadowAlpha: 0.85,
            shadowBlur: 28,
            shadowY: 8
        )

        let phaseTag: String
        let phaseCaption: String
        if !notchExpanded {
            phaseTag = "DORMANT"
            phaseCaption = "Ready in Notch"
        } else if !dropped {
            phaseTag = "WATCHING"
            phaseCaption = hoverPNG ? "Looking at PNG (.png)" : "Choose a format — I'm ready"
        } else if convProg < 0.22 {
            phaseTag = "RECEIVED"
            phaseCaption = "Got photo.heic!"
        } else if !convDone {
            phaseTag = "PROCESSING"
            phaseCaption = "Encoding lossless PNG (\(Int(convProg * 100))%)"
        } else {
            phaseTag = "SUCCESS"
            phaseCaption = "Done. photo.png is ready."
        }

        // Penguin Mascot inside Notch Companion
        let mascotSize: CGFloat = notchExpanded ? 38 : 26
        let mascotBounce: CGFloat = convDone ? -3 * sin(clamp((t - 5.55) * 4) * .pi) : 0
        c.drawImage(
            avatar,
            in: CGRect(
                x: notchRect.minX + 16,
                y: notchRect.midY - mascotSize / 2 + mascotBounce,
                width: mascotSize,
                height: mascotSize
            )
        )

        if notchExpanded {
            c.drawText(
                phaseTag,
                at: CGPoint(x: notchRect.minX + 64, y: notchRect.minY + 11),
                font: fonts.mono(11, semibold: true),
                color: Palette.purpleSoft,
                tracking: 1.2
            )
            c.drawText(
                phaseCaption,
                at: CGPoint(x: notchRect.minX + 64, y: notchRect.minY + 29),
                font: fonts.sans(14.5, medium: true),
                color: Palette.white(0.92)
            )

            // Progress ring or checkmark on right of Notch
            let ringCenter = CGPoint(x: notchRect.maxX - 30, y: notchRect.midY)
            if dropped && !convDone {
                c.ctx.saveGState()
                c.ctx.setStrokeColor(Palette.white(0.16).cgColor)
                c.ctx.setLineWidth(3)
                c.ctx.strokeEllipse(in: CGRect(x: ringCenter.x - 12, y: ringCenter.y - 12, width: 24, height: 24))

                c.ctx.setStrokeColor(Palette.purple.cgColor)
                c.ctx.setLineWidth(3)
                c.ctx.setLineCap(.round)
                c.ctx.addArc(
                    center: ringCenter,
                    radius: 12,
                    startAngle: -.pi / 2,
                    endAngle: -.pi / 2 + (.pi * 2 * convProg),
                    clockwise: false
                )
                c.ctx.strokePath()
                c.ctx.restoreGState()
            } else if convDone {
                c.ctx.saveGState()
                c.ctx.setFillColor(Palette.purple(0.28).cgColor)
                c.ctx.fillEllipse(in: CGRect(x: ringCenter.x - 13, y: ringCenter.y - 13, width: 26, height: 26))
                c.ctx.restoreGState()
                c.drawCheckmark(center: ringCenter, size: 14, color: Palette.purpleSoft, lineWidth: 2.2)
            }
        } else {
            c.drawText(
                "Docyo Notch",
                at: CGPoint(x: notchRect.minX + 52, y: notchRect.minY + 12),
                font: fonts.mono(12.5, semibold: true),
                color: Palette.white(0.75)
            )
        }

        // Zone 1 (Left): Finder Selection Cards
        let leftX = winRect.minX + 58
        let zoneTop = winRect.minY + 132
        c.drawText("01 · FINDER SELECTION", at: CGPoint(x: leftX, y: zoneTop), font: fonts.mono(12.5, semibold: true), color: Palette.white(0.45), tracking: 1.4)

        let files: [(String, String, String, Bool)] = [
            ("photo.heic", "4.2 MB · 4032 × 3024", ".HEIC", true),
            ("board-deck.pdf", "11.8 MB · 24 pages", ".PDF", false),
            ("screen-demo.mov", "38.0 MB · 4K 60fps", ".MOV", false)
        ]

        for (idx, f) in files.enumerated() {
            let cardY = zoneTop + 36 + CGFloat(idx) * 102
            let cardRect = CGRect(x: leftX, y: cardY, width: 410, height: 86)
            let isPicked = f.3 && t >= 1.15 && !dropped
            c.drawBox(
                cardRect,
                radius: 16,
                fill: f.3 ? Palette.surface2.withAlphaComponent(isPicked ? 0.55 : 1.0) : Palette.bgObsidian.withAlphaComponent(0.75),
                stroke: f.3 ? Palette.purple(0.65) : Palette.white(0.08),
                lineWidth: f.3 ? 1.8 : 1.2
            )
            // Extension badge
            let badgeRect = CGRect(x: cardRect.maxX - 78, y: cardRect.midY - 14, width: 58, height: 28)
            c.drawBox(badgeRect, radius: 7, fill: f.3 ? Palette.purple(0.18) : Palette.surface1, stroke: f.3 ? Palette.purple(0.45) : Palette.white(0.1))
            c.drawText(f.2, at: CGPoint(x: badgeRect.midX, y: badgeRect.minY + 6), font: fonts.mono(11.5, semibold: true), color: f.3 ? Palette.purpleSoft : Palette.white(0.5), align: .center)

            c.drawText(f.0, at: CGPoint(x: cardRect.minX + 22, y: cardRect.minY + 19), font: fonts.mono(17, semibold: true), color: Palette.white(isPicked ? 0.55 : 0.95))
            c.drawText(f.1, at: CGPoint(x: cardRect.minX + 22, y: cardRect.minY + 46), font: fonts.mono(12.5), color: Palette.white(0.45))
        }

        // Tactile Modifier Keycap HUD at bottom-left of desktop
        let keycapP = springPop(prog(t, 1.32, 0.45))
        if keycapP > 0.01 {
            let kcRect = CGRect(x: leftX, y: winRect.maxY - 116, width: 326, height: 62)
            c.drawBox(
                kcRect,
                radius: 14,
                fill: shiftHeld ? Palette.purple(0.20) : Palette.bgObsidian,
                stroke: shiftHeld ? Palette.purpleSoft : Palette.white(0.14),
                lineWidth: shiftHeld ? 2.0 : 1.2
            )
            c.drawText(
                shiftHeld ? "⇧ SHIFT HELD" : "⇧ SHIFT RELEASED",
                at: CGPoint(x: kcRect.minX + 20, y: kcRect.minY + 13),
                font: fonts.mono(13, semibold: true),
                color: shiftHeld ? Palette.purpleSoft : Palette.white(0.55),
                tracking: 1.0
            )
            c.drawText(
                shiftHeld ? "Radial Convert Wheel Active" : "Dropped onto PNG wedge",
                at: CGPoint(x: kcRect.minX + 20, y: kcRect.minY + 34),
                font: fonts.sans(13.5, medium: false),
                color: Palette.white(0.75)
            )
        }

        // Zone 2 (Center): Physical 6-Wedge Radial Wheel
        let wheelCenter = CGPoint(x: 960, y: 560)
        let wedges: [(String, String)] = [
            ("PNG", ".png"),
            ("JPEG", ".jpg"),
            ("WEBP", ".webp"),
            ("AVIF", ".avif"),
            ("PDF", ".pdf"),
            ("TIFF", ".tiff")
        ]

        // Guide ring
        c.ctx.saveGState()
        c.ctx.setStrokeColor(Palette.white(0.06).cgColor)
        c.ctx.setLineWidth(1.2)
        c.ctx.setLineDash(phase: 0, lengths: [4, 6])
        c.ctx.strokeEllipse(in: CGRect(x: wheelCenter.x - 206, y: wheelCenter.y - 206, width: 412, height: 412))
        c.ctx.restoreGState()

        if wheelOpen > 0.01 {
            c.drawRadialSpotlight(cx: wheelCenter.x, cy: wheelCenter.y, radius: 260, alpha: 0.25 * easeOutQuint(wheelOpen))
            for (idx, w) in wedges.enumerated() {
                let stagger = springPop(prog(t, 1.38 + CGFloat(idx) * 0.035, 0.48))
                let isTarget = idx == 0 && (hoverPNG || (dropped && t < 5.7))
                let pushP = isTarget ? easeOutQuint(prog(t, 2.45, 0.25)) * 11.0 : 0
                c.drawAnnularWedge(
                    cx: wheelCenter.x,
                    cy: wheelCenter.y,
                    rInner: 82,
                    rOuter: 192,
                    index: idx,
                    count: wedges.count,
                    gapPx: 8,
                    pushOut: pushP,
                    scale: stagger,
                    fill: isTarget ? Palette.purple(0.36) : Palette.surface2.withAlphaComponent(0.95),
                    stroke: isTarget ? Palette.purpleSoft : Palette.white(0.13),
                    lineWidth: isTarget ? 2.4 : 1.3,
                    label: w.0,
                    sublabel: w.1,
                    isHighlighted: isTarget,
                    alpha: clamp(stagger * 1.2)
                )
            }
        }

        // Center Hub
        let hubR: CGFloat = 70
        let hubRect = CGRect(x: wheelCenter.x - hubR, y: wheelCenter.y - hubR, width: hubR * 2, height: hubR * 2)
        c.drawBox(
            hubRect,
            radius: hubR,
            fill: Palette.bgObsidian,
            stroke: (hoverPNG || dropped) ? Palette.purple(0.75) : Palette.white(0.15),
            lineWidth: 2.0
        )
        if dropped && !convDone {
            c.ctx.saveGState()
            c.ctx.setStrokeColor(Palette.purple.cgColor)
            c.ctx.setLineWidth(3.5)
            c.ctx.setLineCap(.round)
            c.ctx.addArc(
                center: wheelCenter,
                radius: hubR,
                startAngle: -.pi / 2,
                endAngle: -.pi / 2 + (.pi * 2 * convProg),
                clockwise: false
            )
            c.ctx.strokePath()
            c.ctx.restoreGState()
        }
        c.drawImage(avatar, in: CGRect(x: wheelCenter.x - 23, y: wheelCenter.y - 46, width: 46, height: 46))
        c.drawText(
            hoverPNG || dropped ? ".HEIC → PNG" : "photo.heic",
            at: CGPoint(x: wheelCenter.x, y: wheelCenter.y + 8),
            font: fonts.mono(13.5, semibold: true),
            color: Palette.pureWhite,
            align: .center
        )
        c.drawText(
            convDone ? "Saved ✓" : (dropped ? "\(Int(convProg * 100))%" : "⇧ Shift wheel"),
            at: CGPoint(x: wheelCenter.x, y: wheelCenter.y + 28),
            font: fonts.mono(11.5),
            color: Palette.purpleSoft,
            align: .center
        )

        // Drop shockwave ring at t = 3.85s
        let rippleP = prog(t, 3.85, 0.55)
        if rippleP > 0 && rippleP < 1 {
            let rr = lerp(80, 235, easeOutQuint(rippleP))
            c.ctx.saveGState()
            c.ctx.setStrokeColor(Palette.purpleSoft(1 - rippleP).cgColor)
            c.ctx.setLineWidth(2.5)
            c.ctx.strokeEllipse(in: CGRect(x: wheelCenter.x - rr, y: wheelCenter.y - 135 - rr * 0.15 + 135, width: rr * 2, height: rr * 2))
            c.ctx.restoreGState()
        }

        // Zone 3 (Right): Local Disk Output Inspector
        let rightX = winRect.maxX - 468
        c.drawText("02 · LOCAL DISK OUTPUT (~/Desktop)", at: CGPoint(x: rightX, y: zoneTop), font: fonts.mono(12.5, semibold: true), color: Palette.white(0.45), tracking: 1.2)

        let outPanel = CGRect(x: rightX, y: zoneTop + 36, width: 410, height: 286)
        c.drawBox(outPanel, radius: 18, fill: Palette.bgObsidian.withAlphaComponent(0.85), stroke: Palette.white(0.10), lineWidth: 1.4)

        // Untouched original row
        let origBox = CGRect(x: outPanel.minX + 20, y: outPanel.minY + 20, width: 370, height: 84)
        c.drawBox(origBox, radius: 13, fill: Palette.surface1, stroke: Palette.white(0.08), lineWidth: 1.2)
        c.drawText("photo.heic", at: CGPoint(x: origBox.minX + 18, y: origBox.minY + 18), font: fonts.mono(16, semibold: true), color: Palette.white(0.82))
        c.drawText("Original source file", at: CGPoint(x: origBox.minX + 18, y: origBox.minY + 44), font: fonts.mono(12), color: Palette.white(0.42))
        let untouchBadge = CGRect(x: origBox.maxX - 118, y: origBox.midY - 14, width: 100, height: 28)
        c.drawBox(untouchBadge, radius: 7, fill: Palette.surface2, stroke: Palette.white(0.12))
        c.drawText("UNTOUCHED", at: CGPoint(x: untouchBadge.midX, y: untouchBadge.minY + 6), font: fonts.mono(11, semibold: true), color: Palette.white(0.70), align: .center)

        // Pipeline status divider
        let pipeLabel = convDone ? "HEIC → PNG · Atomic commit" : (dropped ? "Staging .docyo-tmp (\(Int(convProg * 100))%)" : "Waiting for drop…")
        c.drawText(pipeLabel, at: CGPoint(x: outPanel.midX, y: outPanel.minY + 124), font: fonts.mono(12, semibold: true), color: Palette.purpleSoft, align: .center)

        // Converted Output Card (animates from staging to glowing finished card!)
        let resAppear = easeOutQuint(prog(t, 4.0, 0.5))
        let doneGlow = easeOutQuint(prog(t, 5.55, 0.45))
        let resBox = CGRect(x: outPanel.minX + 20, y: outPanel.minY + 162 + (1 - resAppear) * 14, width: 370, height: 102)
        c.drawBox(
            resBox,
            radius: 14,
            fill: convDone ? Palette.purple(0.14) : Palette.surface1.withAlphaComponent(0.6),
            stroke: convDone ? Palette.purple(0.80) : Palette.white(0.08),
            lineWidth: convDone ? 2.0 : 1.2
        )
        c.drawText(
            convDone ? "photo.png" : (dropped ? ".docyo-8a3f.tmp" : "—"),
            at: CGPoint(x: resBox.minX + 18, y: resBox.minY + 22),
            font: fonts.mono(19, semibold: true),
            color: convDone ? Palette.pureWhite : Palette.white(0.55)
        )
        c.drawText(
            convDone ? "6.1 MB · Lossless RGBA · Ready" : (dropped ? "Atomic staging buffer…" : "Drop file on wheel to convert"),
            at: CGPoint(x: resBox.minX + 18, y: resBox.minY + 54),
            font: fonts.mono(12.5),
            color: convDone ? Palette.purpleSoft : Palette.white(0.38)
        )
        if doneGlow > 0.05 {
            let chkCenter = CGPoint(x: resBox.maxX - 36, y: resBox.midY)
            c.ctx.saveGState()
            c.ctx.setFillColor(Palette.purple(0.30 * doneGlow).cgColor)
            c.ctx.fillEllipse(in: CGRect(x: chkCenter.x - 18, y: chkCenter.y - 18, width: 36, height: 36))
            c.ctx.restoreGState()
            c.drawCheckmark(center: chkCenter, size: 18, color: Palette.pureWhite.withAlphaComponent(doneGlow), lineWidth: 2.5)
        }

        // Animated Cursor & Dragged File Ghost Chip
        let startPt = CGPoint(x: leftX + 210, y: zoneTop + 80)
        let centerPt = CGPoint(x: wheelCenter.x - 18, y: wheelCenter.y + 12)
        let pngWedgePt = CGPoint(x: wheelCenter.x, y: wheelCenter.y - 136) // 12 o'clock wedge 0 ("PNG")
        let restPt = CGPoint(x: wheelCenter.x + 125, y: wheelCenter.y + 115)

        var cursorPt = CGPoint(x: leftX + 90, y: zoneTop + 210)
        if t < 1.15 {
            let p = easeInOutCubic(prog(t, 0.25, 0.85))
            cursorPt = CGPoint(x: lerp(leftX + 80, startPt.x, p), y: lerp(zoneTop + 240, startPt.y, p))
        } else if t < 2.25 {
            let p = easeInOutCubic(prog(t, 1.15, 1.05))
            cursorPt = CGPoint(x: lerp(startPt.x, centerPt.x, p), y: lerp(startPt.y, centerPt.y, p))
        } else if t < 3.85 {
            let p = easeInOutCubic(prog(t, 2.25, 0.75))
            cursorPt = CGPoint(x: lerp(centerPt.x, pngWedgePt.x, p), y: lerp(centerPt.y, pngWedgePt.y, p))
        } else {
            let p = easeOutQuint(prog(t, 3.85, 0.75))
            cursorPt = CGPoint(x: lerp(pngWedgePt.x, restPt.x, p), y: lerp(pngWedgePt.y, restPt.y, p))
        }

        // Floating dragged file chip while dragging (1.15s .. 3.85s)
        if t >= 1.15 && !dropped {
            let ghostRect = CGRect(x: cursorPt.x - 95, y: cursorPt.y - 54, width: 224, height: 48)
            c.drawBox(
                ghostRect,
                radius: 13,
                fill: Palette.surface2.withAlphaComponent(0.96),
                stroke: Palette.purpleSoft,
                lineWidth: 1.8,
                shadowAlpha: 0.75,
                shadowBlur: 24,
                shadowY: 10
            )
            c.drawText("photo.heic", at: CGPoint(x: ghostRect.minX + 16, y: ghostRect.minY + 13), font: fonts.mono(14.5, semibold: true), color: Palette.pureWhite)
            if hoverPNG {
                let tagR = CGRect(x: ghostRect.maxX - 76, y: ghostRect.midY - 12, width: 62, height: 24)
                c.drawBox(tagR, radius: 6, fill: Palette.purple)
                c.drawText("→ PNG", at: CGPoint(x: tagR.midX, y: tagR.minY + 4), font: fonts.mono(11, semibold: true), color: Palette.pureWhite, align: .center)
            }
        }

        c.drawCursor(at: cursorPt, pressed: t >= 1.15 && !dropped)
        c.ctx.restoreGState()
    }

    // MARK: Act 3 (11.8s - 16.6s, dur 4.8s): Three Modifier Rings & 25 Built-in Single-Purpose Tools
    private func renderAct3ModifierRingsAndTools(_ c: Canvas, t: CGFloat) {
        c.fillScreen(Palette.bgObsidian)
        c.drawGrid(lineAlpha: 0.03)
        c.drawRadialSpotlight(cx: 520, cy: 560, radius: 620, alpha: 0.20)

        let headP = easeOutQuint(prog(t, 0.0, 0.5))
        c.drawText(
            "01 / THREE MODIFIER RINGS · 25 BUILT-IN TOOLS",
            at: CGPoint(x: 110, y: 88 + (1 - headP) * 18),
            font: fonts.mono(14, semibold: true),
            color: Palette.purpleSoft(headP),
            tracking: 2.2
        )
        c.drawText(
            "One drag from Finder. Zero timeline bloat.",
            at: CGPoint(x: 110, y: 122 + (1 - headP) * 18),
            font: fonts.display(58, bold: true),
            color: Palette.white(headP),
            tracking: -2.0
        )

        // Active modifier steps: 0 -> Shift (0..1.45s), 1 -> Opt+Shift (1.45..3.15s), 2 -> Ctrl (3.15..4.8s)
        let activeMod: Int = t < 1.45 ? 0 : (t < 3.15 ? 1 : 2)

        // Left Card: Modifier Selector + Dynamic Wheel Preview
        let leftCard = CGRect(x: 110, y: 230, width: 820, height: 740)
        c.drawBox(leftCard, radius: 24, fill: Palette.surface1, stroke: Palette.white(0.10), lineWidth: 1.5)

        let modSpecs: [(String, String, String)] = [
            ("⇧ Shift", "Convert Format", "176 direct codec routes"),
            ("⌥⇧ Opt + Shift", "25 Built-In Tools", "Trim, Crop, Merge PDF, OCR, Redact"),
            ("⌃ Control", "Instant File Actions", "Duplicate, Copy Path, SHA-256")
        ]

        for (i, m) in modSpecs.enumerated() {
            let rowRect = CGRect(x: leftCard.minX + 36, y: leftCard.minY + 38 + CGFloat(i) * 86, width: 748, height: 72)
            let isAct = i == activeMod
            c.drawBox(
                rowRect,
                radius: 14,
                fill: isAct ? Palette.purple(0.18) : Palette.bgObsidian,
                stroke: isAct ? Palette.purple(0.75) : Palette.white(0.08),
                lineWidth: isAct ? 2.0 : 1.2
            )
            c.drawText(m.0, at: CGPoint(x: rowRect.minX + 22, y: rowRect.minY + 23), font: fonts.mono(16, semibold: true), color: isAct ? Palette.purpleSoft : Palette.white(0.55))
            c.drawText(m.1, at: CGPoint(x: rowRect.minX + 215, y: rowRect.minY + 22), font: fonts.display(20, bold: false), color: isAct ? Palette.pureWhite : Palette.white(0.70))
            c.drawText(m.2, at: CGPoint(x: rowRect.maxX - 22, y: rowRect.minY + 25), font: fonts.mono(13), color: isAct ? Palette.white(0.85) : Palette.white(0.40), align: .right)
        }

        // Morphing Radial Wheel inside Left Card bottom
        let wc = CGPoint(x: leftCard.midX, y: leftCard.minY + 528)
        let ringLabels: [[String]] = [
            ["PNG", "WEBP", "AVIF", "DOCX", "MP4", "FLAC"],
            ["TRIM", "CROP", "MERGE", "OCR", "REDACT", "EXIF"],
            ["DUP", "PATH", "NAME", "REVEAL", "SHA256"]
        ]
        let curLabels = ringLabels[activeMod]
        for (idx, lbl) in curLabels.enumerated() {
            let hi = idx == (activeMod == 1 ? 0 : 1)
            c.drawAnnularWedge(
                cx: wc.x,
                cy: wc.y,
                rInner: 66,
                rOuter: 158,
                index: idx,
                count: curLabels.count,
                gapPx: 7,
                pushOut: hi ? 8 : 0,
                scale: 1.0,
                fill: hi ? Palette.purple(0.34) : Palette.surface2,
                stroke: hi ? Palette.purpleSoft : Palette.white(0.12),
                lineWidth: hi ? 2.2 : 1.2,
                label: lbl,
                sublabel: "",
                isHighlighted: hi
            )
        }
        c.drawBox(CGRect(x: wc.x - 54, y: wc.y - 54, width: 108, height: 108), radius: 54, fill: Palette.bgObsidian, stroke: Palette.purple(0.6), lineWidth: 1.8)
        c.drawImage(avatar, in: CGRect(x: wc.x - 20, y: wc.y - 34, width: 40, height: 40))
        c.drawText(
            activeMod == 0 ? "CONVERT" : (activeMod == 1 ? "25 TOOLS" : "ACTIONS"),
            at: CGPoint(x: wc.x, y: wc.y + 12),
            font: fonts.mono(12, semibold: true),
            color: Palette.purpleSoft,
            align: .center
        )

        // Right Column: Two Bento Micro-Tool Cards (Video Trim Waveform + PDF/Image Redact & Suite)
        let rightX: CGFloat = 970
        let card1 = CGRect(x: rightX, y: 230, width: 840, height: 354)
        c.drawBox(card1, radius: 24, fill: Palette.surface1, stroke: Palette.white(0.10), lineWidth: 1.5)
        c.drawText("VIDEO & AUDIO SUITE", at: CGPoint(x: card1.minX + 36, y: card1.minY + 34), font: fonts.mono(13, semibold: true), color: Palette.purpleSoft, tracking: 1.5)
        c.drawText("Trim, crop, speed, join & normalize", at: CGPoint(x: card1.minX + 36, y: card1.minY + 66), font: fonts.display(30), color: Palette.pureWhite, tracking: -0.8)

        // Animated Waveform + Tightening Purple Trim Brackets
        let waveBox = CGRect(x: card1.minX + 36, y: card1.minY + 132, width: 768, height: 146)
        c.drawBox(waveBox, radius: 16, fill: Palette.bgObsidian, stroke: Palette.white(0.08))

        let heights: [CGFloat] = [28, 52, 40, 74, 88, 62, 94, 70, 48, 84, 92, 58, 78, 64, 90, 72, 50, 82, 68, 44, 76, 56, 36, 48, 30, 62, 44, 26]
        let trimAnim = easeInOutCubic(prog(t, 0.5, 2.2))
        let leftBracketFrac = lerp(0.10, 0.22, trimAnim)
        let rightBracketFrac = lerp(0.90, 0.78, trimAnim)

        let barAreaW = waveBox.width - 56
        let barStep = barAreaW / CGFloat(heights.count)
        for (i, hPct) in heights.enumerated() {
            let frac = CGFloat(i) / CGFloat(heights.count - 1)
            let inside = frac >= leftBracketFrac && frac <= rightBracketFrac
            let bh = (waveBox.height - 44) * (hPct / 100.0)
            let bx = waveBox.minX + 28 + CGFloat(i) * barStep
            let by = waveBox.midY - bh / 2
            c.drawBox(
                CGRect(x: bx, y: by, width: max(6, barStep - 7), height: bh),
                radius: 3,
                fill: inside ? Palette.purple : Palette.white(0.16)
            )
        }
        let trimRect = CGRect(
            x: waveBox.minX + 28 + barAreaW * leftBracketFrac,
            y: waveBox.minY + 12,
            width: barAreaW * (rightBracketFrac - leftBracketFrac),
            height: waveBox.height - 24
        )
        c.drawBox(trimRect, radius: 8, fill: Palette.purple(0.12), stroke: Palette.purpleSoft, lineWidth: 2.5)
        c.drawText("clip.mov  ·  00:04.12 — 00:14.00  ·  Lossless stream cut", at: CGPoint(x: card1.minX + 36, y: card1.maxY - 46), font: fonts.mono(13.5), color: Palette.white(0.60))

        // Bottom Right Card: PDF & Photo Privacy Toolkit
        let card2 = CGRect(x: rightX, y: 616, width: 840, height: 354)
        c.drawBox(card2, radius: 24, fill: Palette.surface1, stroke: Palette.white(0.10), lineWidth: 1.5)
        c.drawText("DOCUMENT & IMAGE TOOLKIT", at: CGPoint(x: card2.minX + 36, y: card2.minY + 34), font: fonts.mono(13, semibold: true), color: Palette.purpleSoft, tracking: 1.5)
        c.drawText("Merge, split, OCR, redact & strip EXIF", at: CGPoint(x: card2.minX + 36, y: card2.minY + 66), font: fonts.display(30), color: Palette.pureWhite, tracking: -0.8)

        let toolChips = [
            "Merge PDF", "Split PDF", "Organize Pages", "PDF → DOCX",
            "Local OCR", "Redact Photo", "Strip GPS EXIF", "Resize & Crop",
            "Collage", "Compress", "Watermark", "SHA-256 Verify"
        ]
        for (i, chip) in toolChips.enumerated() {
            let col = i % 4
            let row = i / 4
            let chipP = easeOutQuint(prog(t, 0.35 + CGFloat(i) * 0.06, 0.45))
            let cx = card2.minX + 36 + CGFloat(col) * 194
            let cy = card2.minY + 134 + CGFloat(row) * 62 + (1 - chipP) * 12
            let highlight = (i == 0 || i == 4 || i == 5 || i == 6)
            c.drawBox(
                CGRect(x: cx, y: cy, width: 180, height: 48),
                radius: 11,
                fill: highlight ? Palette.purple(0.16 * chipP) : Palette.bgObsidian.withAlphaComponent(chipP),
                stroke: highlight ? Palette.purple(0.55 * chipP) : Palette.white(0.09 * chipP),
                lineWidth: 1.3
            )
            c.drawText(
                chip,
                at: CGPoint(x: cx + 90, y: cy + 14),
                font: fonts.mono(13.5, semibold: highlight),
                color: (highlight ? Palette.pureWhite : Palette.white(0.75)).withAlphaComponent(chipP),
                align: .center
            )
        }
    }

    // MARK: Act 4 (16.6s - 21.4s, dur 4.8s): 176 Local Conversion Routes Explorer
    private func renderAct4FormatMatrix176(_ c: Canvas, t: CGFloat) {
        c.fillScreen(Palette.bgObsidian)
        c.drawGrid(lineAlpha: 0.03)
        c.drawRadialSpotlight(cx: 1380, cy: 300, radius: 680, alpha: 0.20)

        // Giant Animated Counter "176"
        let countP = easeOutQuint(prog(t, 0.0, 0.85))
        let countVal = Int(round(176.0 * countP))

        c.drawText("02 / DIRECT CODEC MATRIX", at: CGPoint(x: 110, y: 88), font: fonts.mono(14, semibold: true), color: Palette.purpleSoft, tracking: 2.2)
        c.drawText("\(countVal)", at: CGPoint(x: 110, y: 122), font: fonts.display(146, bold: true), color: Palette.pureWhite, tracking: -6.0)
        c.drawText("local conversion routes.\nEvery codec runs on your machine.", at: CGPoint(x: 410, y: 154), font: fonts.display(46, bold: false), color: Palette.white(0.88), tracking: -1.4)

        // 4 Horizontal Routing Lanes
        let lanes: [(String, String, [String], [String], String)] = [
            ("IMAGES", "56 routes", [".HEIC", ".AVIF", ".WEBP", ".TIFF", ".BMP"], [".PNG", ".JPEG", ".WEBP", ".AVIF", ".PDF"], "ImageIO + Lossless WebP"),
            ("DOCUMENTS", "12 routes", [".PDF", ".SCAN", ".IMAGES"], [".DOCX", ".OCR TXT", ".MERGED PDF", ".PNG"], "PDFKit + Vision OCR + DOCX"),
            ("VIDEO & AUDIO", "106 routes", [".MOV", ".MKV", ".WAV", ".FLAC", ".M4A"], [".MP4", ".WEBM", ".MP3", ".AAC", ".OGG"], "AVFoundation + Local FFmpeg"),
            ("SUBTITLES", "2 routes", [".SRT"], [".VTT", "TIMECODE SYNC"], "Native Parser")
        ]

        for (idx, lane) in lanes.enumerated() {
            let p = easeOutQuint(prog(t, 0.25 + CGFloat(idx) * 0.14, 0.55))
            let y = 336 + CGFloat(idx) * 164 + (1 - p) * 24
            let rowRect = CGRect(x: 110, y: y, width: 1700, height: 142)
            c.drawBox(rowRect, radius: 20, fill: Palette.surface1.withAlphaComponent(p), stroke: Palette.white(0.10 * p), lineWidth: 1.4)

            // Category title & route count
            c.drawText(lane.0, at: CGPoint(x: rowRect.minX + 34, y: rowRect.minY + 34), font: fonts.display(26, bold: true), color: Palette.white(p), tracking: -0.6)
            c.drawText("\(lane.1)  ·  \(lane.4)", at: CGPoint(x: rowRect.minX + 34, y: rowRect.minY + 76), font: fonts.mono(13), color: Palette.white(0.48 * p))

            // Source Chips
            var sx: CGFloat = rowRect.minX + 430
            for src in lane.2 {
                let cw = c.measureText(src, font: fonts.mono(15, semibold: true)).width + 32
                let cr = CGRect(x: sx, y: rowRect.midY - 22, width: cw, height: 44)
                c.drawBox(cr, radius: 10, fill: Palette.bgObsidian.withAlphaComponent(p), stroke: Palette.white(0.13 * p))
                c.drawText(src, at: CGPoint(x: cr.midX, y: cr.minY + 12), font: fonts.mono(15, semibold: true), color: Palette.white(0.85 * p), align: .center)
                sx += cw + 10
            }

            // Animated purple arrow conduit
            let arrowX: CGFloat = rowRect.minX + 985
            let pulse = 0.5 + 0.5 * sin((t * 4.5) - CGFloat(idx) * 0.8)
            c.drawBox(CGRect(x: arrowX, y: rowRect.midY - 19, width: 78, height: 38), radius: 19, fill: Palette.purple((0.18 + 0.14 * pulse) * p), stroke: Palette.purple(0.65 * p))
            c.drawText("→", at: CGPoint(x: arrowX + 39, y: rowRect.midY - 13), font: fonts.mono(20, semibold: true), color: Palette.purpleSoft(p), align: .center)

            // Output Chips
            var ox: CGFloat = rowRect.minX + 1095
            for dst in lane.3 {
                let cw = c.measureText(dst, font: fonts.mono(15, semibold: true)).width + 32
                if ox + cw > rowRect.maxX - 28 { break }
                let cr = CGRect(x: ox, y: rowRect.midY - 22, width: cw, height: 44)
                c.drawBox(cr, radius: 10, fill: Palette.purple(0.14 * p), stroke: Palette.purpleSoft(0.45 * p))
                c.drawText(dst, at: CGPoint(x: cr.midX, y: cr.minY + 12), font: fonts.mono(15, semibold: true), color: Palette.white(p), align: .center)
                ox += cw + 10
            }
        }
    }

    // MARK: Act 5 (21.4s - 26.2s, dur 4.8s): Pure White Contrast Section — Data Sovereignty ("0.0 KB")
    private func renderAct5WhitePrivacyContrast(_ c: Canvas, t: CGFloat) {
        c.fillScreen(Palette.pureWhite)
        c.drawGrid(lineAlpha: 0.045, darkInk: true)

        let headP = easeOutQuint(prog(t, 0.0, 0.45))
        c.drawText("03 / DATA SOVEREIGNTY", at: CGPoint(x: 110, y: 86 + (1 - headP) * 16), font: fonts.mono(14, semibold: true), color: Palette.purple.withAlphaComponent(headP), tracking: 2.2)
        c.drawText("Your files never take a round-trip.", at: CGPoint(x: 110, y: 122 + (1 - headP) * 16), font: fonts.display(66, bold: true), color: Palette.black(headP), tracking: -2.4)

        // Lane 1: Other converters (faded, dashed remote server)
        let l1P = easeOutQuint(prog(t, 0.20, 0.50))
        let lane1 = CGRect(x: 110, y: 248 + (1 - l1P) * 18, width: 1700, height: 260)
        c.drawBox(lane1, radius: 24, fill: Palette.black(0.025 * l1P), stroke: Palette.black(0.12 * l1P), lineWidth: 1.5)
        c.drawText("OTHER CONVERTERS  —  YOUR FILE → THEIR CLOUD SERVER", at: CGPoint(x: lane1.minX + 38, y: lane1.minY + 28), font: fonts.mono(13.5, semibold: true), color: Palette.black(0.50 * l1P), tracking: 1.2)

        let n1 = CGRect(x: lane1.minX + 38, y: lane1.minY + 82, width: 410, height: 132)
        let n2 = CGRect(x: lane1.minX + 610, y: lane1.minY + 82, width: 480, height: 132)
        let n3 = CGRect(x: lane1.minX + 1252, y: lane1.minY + 82, width: 410, height: 132)

        c.drawBox(n1, radius: 16, fill: Palette.pureWhite, stroke: Palette.black(0.14 * l1P))
        c.drawText("YOUR MAC", at: CGPoint(x: n1.minX + 24, y: n1.minY + 24), font: fonts.mono(12, semibold: true), color: Palette.black(0.45 * l1P))
        c.drawText("tax-return.pdf", at: CGPoint(x: n1.minX + 24, y: n1.minY + 54), font: fonts.mono(20, semibold: true), color: Palette.black(0.75 * l1P))
        c.drawText("Uploaded over HTTPS", at: CGPoint(x: n1.minX + 24, y: n1.minY + 88), font: fonts.sans(15), color: Palette.black(0.48 * l1P))

        c.drawText("upload ──▶", at: CGPoint(x: n1.maxX + 81, y: n1.midY - 12), font: fonts.mono(15, semibold: true), color: Palette.black(0.38 * l1P), align: .center)

        c.drawBox(n2, radius: 16, fill: Palette.black(0.03 * l1P), stroke: Palette.black(0.24 * l1P))
        c.drawText("STRANGER'S S3 BUCKET", at: CGPoint(x: n2.minX + 24, y: n2.minY + 24), font: fonts.mono(12, semibold: true), color: Palette.black(0.50 * l1P))
        c.drawText("Remote Cloud Queue & Cache", at: CGPoint(x: n2.minX + 24, y: n2.minY + 54), font: fonts.display(22, bold: false), color: Palette.black(0.80 * l1P))
        c.drawText("Retention logs · File-size paywalls · Slow", at: CGPoint(x: n2.minX + 24, y: n2.minY + 88), font: fonts.sans(15), color: Palette.black(0.50 * l1P))

        c.drawText("fetch ──▶", at: CGPoint(x: n2.maxX + 81, y: n2.midY - 12), font: fonts.mono(15, semibold: true), color: Palette.black(0.38 * l1P), align: .center)

        c.drawBox(n3, radius: 16, fill: Palette.pureWhite, stroke: Palette.black(0.14 * l1P))
        c.drawText("~/DOWNLOADS", at: CGPoint(x: n3.minX + 24, y: n3.minY + 24), font: fonts.mono(12, semibold: true), color: Palette.black(0.45 * l1P))
        c.drawText("tax-return (1).docx", at: CGPoint(x: n3.minX + 24, y: n3.minY + 54), font: fonts.mono(20, semibold: true), color: Palette.black(0.75 * l1P))
        c.drawText("Manual re-download", at: CGPoint(x: n3.minX + 24, y: n3.minY + 88), font: fonts.sans(15), color: Palette.black(0.48 * l1P))

        // Lane 2: DOCYO — Closed Local Enclosure + Bold "0.0 KB" Air-Gap Card
        let l2P = easeOutQuint(prog(t, 0.55, 0.55))
        let vault = CGRect(x: 110, y: 544 + (1 - l2P) * 22, width: 1230, height: 420)
        c.drawBox(vault, radius: 26, fill: Palette.pureWhite, stroke: Palette.bgObsidian.withAlphaComponent(l2P), lineWidth: 3.0)

        c.drawPill(
            centerX: vault.minX + 248,
            topY: vault.minY + 30,
            text: "DOCYO  ·  YOUR FILE STAYS ON YOUR DISK",
            font: fonts.mono(13, semibold: true),
            textColor: Palette.purpleDeep,
            fill: Palette.purple(0.12),
            stroke: Palette.purple(0.35),
            dotColor: Palette.purple,
            alpha: l2P
        )

        let d1 = CGRect(x: vault.minX + 36, y: vault.minY + 114, width: 340, height: 176)
        let d2 = CGRect(x: vault.minX + 436, y: vault.minY + 114, width: 358, height: 176)
        let d3 = CGRect(x: vault.minX + 854, y: vault.minY + 114, width: 340, height: 176)

        c.drawBox(d1, radius: 18, fill: Palette.black(0.03 * l2P), stroke: Palette.black(0.14 * l2P))
        c.drawText("READ-ONLY FD", at: CGPoint(x: d1.minX + 24, y: d1.minY + 26), font: fonts.mono(12, semibold: true), color: Palette.black(0.50 * l2P))
        c.drawText("tax-return.pdf", at: CGPoint(x: d1.minX + 24, y: d1.minY + 64), font: fonts.mono(21, semibold: true), color: Palette.black(l2P))
        c.drawText("Original untouched", at: CGPoint(x: d1.minX + 24, y: d1.minY + 112), font: fonts.sans(16, medium: true), color: Palette.black(0.62 * l2P))

        c.drawText("→", at: CGPoint(x: d1.maxX + 30, y: d1.midY - 18), font: fonts.mono(28, semibold: true), color: Palette.purple.withAlphaComponent(l2P), align: .center)

        c.drawBox(d2, radius: 18, fill: Palette.purple(0.09 * l2P), stroke: Palette.purple(0.55 * l2P), lineWidth: 2.0)
        c.drawImage(avatar, in: CGRect(x: d2.maxX - 58, y: d2.minY + 20, width: 38, height: 38), alpha: l2P)
        c.drawText("APPLE SILICON / x64", at: CGPoint(x: d2.minX + 24, y: d2.minY + 26), font: fonts.mono(12, semibold: true), color: Palette.purpleDeep.withAlphaComponent(l2P))
        c.drawText("Docyo Native Engine", at: CGPoint(x: d2.minX + 24, y: d2.minY + 64), font: fonts.display(24, bold: true), color: Palette.black(l2P))
        c.drawText(".docyo-stage → atomic commit", at: CGPoint(x: d2.minX + 24, y: d2.minY + 112), font: fonts.mono(13.5, semibold: true), color: Palette.purpleDeep.withAlphaComponent(l2P))

        c.drawText("→", at: CGPoint(x: d2.maxX + 30, y: d2.midY - 18), font: fonts.mono(28, semibold: true), color: Palette.purple.withAlphaComponent(l2P), align: .center)

        c.drawBox(d3, radius: 18, fill: Palette.bgObsidian.withAlphaComponent(l2P), stroke: Palette.bgObsidian.withAlphaComponent(l2P))
        c.drawText("SIBLING OUTPUT", at: CGPoint(x: d3.minX + 24, y: d3.minY + 26), font: fonts.mono(12, semibold: true), color: Palette.purpleSoft(l2P))
        c.drawText("tax-return.docx", at: CGPoint(x: d3.minX + 24, y: d3.minY + 64), font: fonts.mono(21, semibold: true), color: Palette.white(l2P))
        c.drawText("Ready in same folder ✓", at: CGPoint(x: d3.minX + 24, y: d3.minY + 112), font: fonts.sans(16, medium: true), color: Palette.white(0.75 * l2P))

        c.drawText(
            "READ_ONLY_FD   ·   ATOMIC_COMMIT   ·   COLLISION_SAFE   ·   SHELL_SAFE_ARGV",
            at: CGPoint(x: vault.minX + 36, y: vault.maxY - 62),
            font: fonts.mono(13.5, semibold: true),
            color: Palette.black(0.55 * l2P),
            tracking: 1.0
        )

        // Right Callout Card: "0.0 KB"
        let zeroP = springPop(prog(t, 0.85, 0.60))
        let zeroCard = CGRect(x: 1372, y: 544, width: 438, height: 420)
        c.drawBox(
            zeroCard,
            radius: 26,
            fill: Palette.bgObsidian.withAlphaComponent(clamp(zeroP)),
            stroke: Palette.purple.withAlphaComponent(clamp(zeroP)),
            lineWidth: 2.5
        )
        c.drawText("EXTERNAL NETWORK", at: CGPoint(x: zeroCard.minX + 36, y: zeroCard.minY + 38), font: fonts.mono(13, semibold: true), color: Palette.purpleSoft(clamp(zeroP)), tracking: 1.6)
        c.drawText("0.0 KB", at: CGPoint(x: zeroCard.minX + 36, y: zeroCard.minY + 112), font: fonts.display(100, bold: true), color: Palette.white(clamp(zeroP)), tracking: -4.0)
        c.drawText("Crosses the network.\nWorks on an airplane\nwith Wi-Fi turned off.", at: CGPoint(x: zeroCard.minX + 36, y: zeroCard.minY + 246), font: fonts.sans(22, medium: true), color: Palette.white(0.75 * clamp(zeroP)))
    }

    // MARK: Act 6 (26.2s - 32.0s, dur 5.8s): Hero Finale & Direct Download CTA
    private func renderAct6FinaleCTA(_ c: Canvas, t: CGFloat) {
        c.fillScreen(Palette.bgObsidian)
        c.drawGrid(lineAlpha: 0.032)

        let enter = easeOutQuint(prog(t, 0.0, 0.70))
        let pop = springPop(prog(t, 0.05, 0.72))

        c.drawRadialSpotlight(cx: 960, cy: 430, radius: 780, alpha: 0.28 * enter)

        // Center Hero Penguin Squircle
        c.drawLogoSquircle(
            center: CGPoint(x: 960, y: 256),
            size: 168,
            scale: 0.76 + 0.24 * pop,
            alpha: enter,
            glowAlpha: 0.34
        )

        // Headline
        let hP = easeOutQuint(prog(t, 0.25, 0.65))
        let fHero = fonts.display(102, bold: true)
        let p1 = "Drag. "
        let p2 = "Hold Shift. "
        let p3 = "Convert."
        let s1 = c.measureText(p1, font: fHero, tracking: -3.5)
        let s2 = c.measureText(p2, font: fHero, tracking: -3.5)
        let s3 = c.measureText(p3, font: fHero, tracking: -3.5)
        let tot = s1.width + s2.width + s3.width
        let hx = 960 - tot / 2
        let hy = 382 + (1 - hP) * 26

        c.drawText(p1, at: CGPoint(x: hx, y: hy), font: fHero, color: Palette.white(hP), tracking: -3.5)
        c.drawText(p2, at: CGPoint(x: hx + s1.width, y: hy), font: fHero, color: Palette.purpleSoft(hP), tracking: -3.5)
        c.drawText(p3, at: CGPoint(x: hx + s1.width + s2.width, y: hy), font: fHero, color: Palette.white(hP), tracking: -3.5)

        // Platform & License strip
        let subP = easeOutQuint(prog(t, 0.50, 0.55))
        c.drawText(
            "macOS Native (.dmg)   ·   Windows 10/11   ·   Linux x64   ·   100% Open Source (GPL-3.0)",
            at: CGPoint(x: 960, y: 526 + (1 - subP) * 16),
            font: fonts.mono(18, semibold: false),
            color: Palette.white(0.66 * subP),
            tracking: 0.4,
            align: .center
        )

        // Glowing Purple CTA Pill Button
        let ctaP = springPop(prog(t, 0.72, 0.65))
        let ctaA = easeOutQuint(prog(t, 0.72, 0.45))
        if ctaA > 0.01 {
            let bw: CGFloat = 650 * (0.9 + 0.1 * ctaP)
            let bh: CGFloat = 78
            let btnRect = CGRect(x: 960 - bw / 2, y: 610, width: bw, height: bh)
            c.drawBox(
                btnRect,
                radius: 20,
                fill: Palette.purple.withAlphaComponent(ctaA),
                stroke: Palette.purpleSoft.withAlphaComponent(ctaA),
                lineWidth: 2.0,
                shadowAlpha: 0.65 * ctaA,
                shadowBlur: 40,
                shadowY: 14
            )
            c.drawText(
                "Download Docyo Free  ·  github.com/subhashmalik0001/Docyo",
                at: CGPoint(x: 960, y: btnRect.minY + 25),
                font: fonts.mono(17, semibold: true),
                color: Palette.white(ctaA),
                tracking: 0.2,
                align: .center
            )
        }

        // Four trust badges at bottom
        let trP = easeOutQuint(prog(t, 1.0, 0.55))
        c.drawText(
            "NO ACCOUNTS     ·     NO UPLOADS     ·     NO TELEMETRY     ·     ORIGINALS NEVER TOUCHED",
            at: CGPoint(x: 960, y: 760 + (1 - trP) * 12),
            font: fonts.mono(13.5, semibold: true),
            color: Palette.white(0.42 * trP),
            tracking: 2.2,
            align: .center
        )
    }

    private func drawSceneTransitionOverlay(_ c: Canvas, globalT t: CGFloat) {
        // Crisp 0.18s micro-fade around hard cuts + 0.45s fade-in at 0s and fade-out at 32s
        let cutPoints: [CGFloat] = [4.2, 11.8, 16.6, 21.4, 26.2]
        var flashAlpha: CGFloat = 0
        for cp in cutPoints {
            let dist = abs(t - cp)
            if dist < 0.12 {
                flashAlpha = max(flashAlpha, (1.0 - dist / 0.12) * 0.65)
            }
        }
        if t < 0.30 {
            flashAlpha = max(flashAlpha, 1.0 - t / 0.30)
        }
        if t > 31.45 {
            flashAlpha = max(flashAlpha, (t - 31.45) / 0.55)
        }
        if flashAlpha > 0.005 {
            c.fillScreen(Palette.bgObsidian.withAlphaComponent(clamp(flashAlpha)))
        }
    }
}

// MARK: - Studio Procedural Audio Synthesizer (48 kHz Stereo PCM -> AAC)

struct StudioSoundDesigner {
    let sampleRate: Double = 48_000
    let duration: Double = 32.0

    func renderStereoPCM() -> [Int16] {
        let totalFrames = Int(sampleRate * duration)
        var left = [Double](repeating: 0, count: totalFrames)
        var right = [Double](repeating: 0, count: totalFrames)

        // 1. Warm Minimal Ambient Pad Progression (Raycast / Linear style soft filtered sine+fifth+ninth)
        let chords: [(Double, Double, [Double])] = [
            (0.0,  8.0,  [146.83, 220.00, 261.63, 329.63]), // Dm9 (D3, A3, C4, E4)
            (8.0,  16.6, [116.54, 174.61, 220.00, 293.66]), // Bbmaj7 (Bb2, F3, A3, D4)
            (16.6, 21.4, [130.81, 196.00, 246.94, 293.66]), // Cmaj9 / G
            (21.4, 26.2, [110.00, 220.00, 277.18, 329.63]), // Bright A major lift on White Privacy Cut
            (26.2, 31.8, [146.83, 220.00, 293.66, 369.99, 440.00]) // Warm resolving Dmaj add9 Finale
        ]

        for (start, end, freqs) in chords {
            let i0 = max(0, Int(start * sampleRate))
            let i1 = min(totalFrames, Int(end * sampleRate))
            let dur = end - start
            for i in i0..<i1 {
                let localT = Double(i - i0) / sampleRate
                let fadeIn = min(1.0, localT / 0.85)
                let fadeOut = min(1.0, (dur - localT) / 0.95)
                let env = fadeIn * fadeOut * 0.055
                let globalT = Double(i) / sampleRate
                var sL = 0.0
                var sR = 0.0
                for (k, f) in freqs.enumerated() {
                    let detune = (k % 2 == 0) ? 1.0012 : 0.9988
                    let lfo = 0.85 + 0.15 * sin(2 * .pi * (0.22 + Double(k) * 0.05) * globalT)
                    sL += sin(2 * .pi * f * globalT) * lfo
                    sR += sin(2 * .pi * (f * detune) * globalT + 0.35) * lfo
                }
                let norm = 1.0 / Double(freqs.count)
                left[i] += sL * norm * env
                right[i] += sR * norm * env
            }
        }

        // Helper: Soft low-end beat thump
        func addSubPulse(at t0: Double, freqStart: Double = 92, freqEnd: Double = 42, dur: Double = 0.24, amp: Double = 0.22) {
            let startIdx = Int(t0 * sampleRate)
            let count = Int(dur * sampleRate)
            var phase = 0.0
            for j in 0..<count where startIdx + j < totalFrames {
                let p = Double(j) / Double(count)
                let f = freqStart + (freqEnd - freqStart) * pow(p, 0.45)
                phase += (2 * .pi * f) / sampleRate
                let env = exp(-9.5 * p) * min(1.0, Double(j) / 64.0)
                let v = sin(phase) * env * amp
                left[startIdx + j] += v
                right[startIdx + j] += v
            }
        }

        // Helper: Tactile UI click / detent
        func addTactileTick(at t0: Double, freq: Double = 1650, dur: Double = 0.018, amp: Double = 0.11, pan: Double = 0) {
            let startIdx = Int(t0 * sampleRate)
            let count = Int(dur * sampleRate)
            for j in 0..<count where startIdx + j < totalFrames {
                let p = Double(j) / Double(count)
                let env = exp(-14.0 * p) * min(1.0, Double(j) / 24.0)
                let v = (sin(2 * .pi * freq * (Double(j) / sampleRate)) + 0.35 * sin(2 * .pi * freq * 2.1 * (Double(j) / sampleRate))) * env * amp
                left[startIdx + j] += v * (1.0 - max(0, pan) * 0.4)
                right[startIdx + j] += v * (1.0 + min(0, pan) * 0.4)
            }
        }

        // Helper: Crystalline harmonic bell chime
        func addBellNote(at t0: Double, freq: Double, dur: Double = 0.85, amp: Double = 0.09, pan: Double = 0) {
            let startIdx = Int(t0 * sampleRate)
            let count = Int(dur * sampleRate)
            for j in 0..<count where startIdx + j < totalFrames {
                let dt = Double(j) / sampleRate
                let env = exp(-4.8 * (dt / dur)) * min(1.0, Double(j) / 96.0)
                let sig = (sin(2 * .pi * freq * dt) + 0.22 * sin(2 * .pi * freq * 2.0 * dt) + 0.08 * sin(2 * .pi * freq * 3.0 * dt)) * env * amp
                left[startIdx + j] += sig * (1.0 - max(0, pan) * 0.35)
                right[startIdx + j] += sig * (1.0 + min(0, pan) * 0.35)
            }
        }

        // Synchronized Foley Timeline:
        // Act 1: Cold open + Penguin reveal + 3 Tagline Beats ("Drag.", "Hold Shift.", "Convert.")
        addSubPulse(at: 0.10, amp: 0.16)
        addBellNote(at: 1.44, freq: 587.33, dur: 0.9, amp: 0.08, pan: -0.2) // D5
        addBellNote(at: 1.50, freq: 880.00, dur: 1.0, amp: 0.07, pan: 0.2)  // A5

        for bt in [1.42 + 0.42, 1.42 + 0.80, 1.42 + 1.18] {
            addSubPulse(at: bt, freqStart: 105, freqEnd: 46, dur: 0.22, amp: 0.22)
            addTactileTick(at: bt, freq: 1400, amp: 0.09)
        }

        // Act 2 (starts 4.2s): Drag pickup (5.35s), Shift held + Wheel bloom (5.58s), Wedge hover ticks, Drop (8.05s), Notch Success Chime (9.75s)
        addTactileTick(at: 4.2 + 1.15, freq: 1100, amp: 0.10, pan: -0.3)
        addTactileTick(at: 4.2 + 1.38, freq: 1850, amp: 0.13)
        addSubPulse(at: 4.2 + 1.40, freqStart: 88, freqEnd: 45, dur: 0.20, amp: 0.17)
        for (k, ht) in [4.2 + 1.50, 4.2 + 1.62, 4.2 + 2.45].enumerated() {
            addTactileTick(at: ht, freq: 1550 + Double(k) * 260, amp: 0.09, pan: 0.15)
        }
        // Drop onto PNG wedge
        addSubPulse(at: 4.2 + 3.85, freqStart: 110, freqEnd: 48, dur: 0.20, amp: 0.19)
        addTactileTick(at: 4.2 + 3.85, freq: 2100, amp: 0.11)
        // Notch Companion Success Arpeggio (t = 9.75s)
        addBellNote(at: 4.2 + 5.55, freq: 587.33, dur: 0.75, amp: 0.085, pan: -0.25) // D5
        addBellNote(at: 4.2 + 5.63, freq: 739.99, dur: 0.80, amp: 0.085, pan: 0.0)   // F#5
        addBellNote(at: 4.2 + 5.72, freq: 880.00, dur: 0.95, amp: 0.095, pan: 0.25)  // A5
        addBellNote(at: 4.2 + 5.82, freq: 1174.66, dur: 1.10, amp: 0.075, pan: 0.1)  // D6

        // Act 3 (starts 11.8s): 3 Modifier Ring Switches
        addSubPulse(at: 11.8, amp: 0.17)
        for mt in [11.8 + 0.05, 11.8 + 1.45, 11.8 + 3.15] {
            addTactileTick(at: mt, freq: 1750, amp: 0.11)
        }

        // Act 4 (starts 16.6s): 176 Routes Counter Cascade
        addSubPulse(at: 16.6, amp: 0.18)
        for step in 0..<8 {
            addTactileTick(at: 16.68 + Double(step) * 0.085, freq: 1300 + Double(step) * 140, dur: 0.014, amp: 0.065)
        }

        // Act 5 (starts 21.4s): Pure White Contrast Cut + "0.0 KB" Slam (22.25s)
        addSubPulse(at: 21.4, freqStart: 115, freqEnd: 40, dur: 0.28, amp: 0.24)
        addSubPulse(at: 21.4 + 0.85, freqStart: 98, freqEnd: 44, dur: 0.24, amp: 0.20)
        addBellNote(at: 21.4 + 0.86, freq: 880.0, dur: 0.8, amp: 0.075)

        // Act 6 (starts 26.2s): Finale Reveal + CTA Pop
        addSubPulse(at: 26.2, freqStart: 102, freqEnd: 42, dur: 0.32, amp: 0.22)
        addBellNote(at: 26.28, freq: 587.33, dur: 1.3, amp: 0.08, pan: -0.2)
        addBellNote(at: 26.38, freq: 880.00, dur: 1.5, amp: 0.08, pan: 0.2)
        addTactileTick(at: 26.2 + 0.72, freq: 1920, amp: 0.09)

        // Soft limiter + Master Fade-Out + Interleave Stereo Int16
        var pcm = [Int16](repeating: 0, count: totalFrames * 2)
        for i in 0..<totalFrames {
            let t = Double(i) / sampleRate
            let masterFade = t > 31.1 ? max(0.0, (31.95 - t) / 0.85) : min(1.0, t / 0.15)
            let l = tanh(left[i] * masterFade * 1.15) * 0.88
            let r = tanh(right[i] * masterFade * 1.15) * 0.88
            pcm[i * 2]     = Int16(max(-32767, min(32767, l * 32767.0)))
            pcm[i * 2 + 1] = Int16(max(-32767, min(32767, r * 32767.0)))
        }
        return pcm
    }
}

// MARK: - Main CLI Entrypoint

@main
struct RenderDocyoLaunchFilm {
    static func savePNG(from pixelBuffer: CVPixelBuffer, to url: URL) throws {
        CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly) }
        let w = CVPixelBufferGetWidth(pixelBuffer)
        let h = CVPixelBufferGetHeight(pixelBuffer)
        let cs = CGColorSpace(name: CGColorSpace.sRGB)!
        guard let ctx = CGContext(
            data: CVPixelBufferGetBaseAddress(pixelBuffer),
            width: w,
            height: h,
            bitsPerComponent: 8,
            bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer),
            space: cs,
            bitmapInfo: CGBitmapInfo.byteOrder32Little.rawValue | CGImageAlphaInfo.premultipliedFirst.rawValue
        ), let cgImg = ctx.makeImage() else { return }
        let rep = NSBitmapImageRep(cgImage: cgImg)
        if let data = rep.representation(using: .png, properties: [:]) {
            try data.write(to: url)
        }
    }

    static func main() async throws {
        let cwd = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
        var outPath = cwd.appendingPathComponent("dist/Docyo-Launch-Video.mp4").path
        var previewDir: String? = nil

        var idx = 1
        let args = CommandLine.arguments
        while idx < args.count {
            if args[idx] == "--out", idx + 1 < args.count {
                outPath = args[idx + 1]
                idx += 2
            } else if args[idx] == "--preview-dir", idx + 1 < args.count {
                previewDir = args[idx + 1]
                idx += 2
            } else {
                idx += 1
            }
        }

        let outURL = URL(fileURLWithPath: outPath)
        try FileManager.default.createDirectory(at: outURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try? FileManager.default.removeItem(at: outURL)

        if let pDir = previewDir {
            try FileManager.default.createDirectory(atPath: pDir, withIntermediateDirectories: true)
        }

        // Load official 3D Purple Scholar Penguin brand logo
        let avatarCandidates = [
            cwd.appendingPathComponent("docs/assets/avatar.png"),
            cwd.appendingPathComponent("website/public/docyo-logo-512.png")
        ]
        var avatarCG: CGImage? = nil
        for cand in avatarCandidates {
            if let nsImg = NSImage(contentsOf: cand) {
                var r = CGRect(x: 0, y: 0, width: nsImg.size.width, height: nsImg.size.height)
                if let cg = nsImg.cgImage(forProposedRect: &r, context: nil, hints: nil) {
                    avatarCG = cg
                    break
                }
            }
        }
        guard avatarCG != nil else {
            fatalError("Could not load official Docyo avatar.png")
        }

        let fonts = StudioFonts(repoRoot: cwd)
        let director = LaunchFilmDirector(fonts: fonts, avatar: avatarCG)

        let width = 1920
        let height = 1080
        let fps = director.fps
        let totalFrames = Int(director.duration * Double(fps))

        let writer = try AVAssetWriter(outputURL: outURL, fileType: .mp4)
        writer.shouldOptimizeForNetworkUse = true // Fast-start moov atom for instant web playback!

        let videoSettings: [String: Any] = [
            AVVideoCodecKey: AVVideoCodecType.h264,
            AVVideoWidthKey: width,
            AVVideoHeightKey: height,
            AVVideoCompressionPropertiesKey: [
                AVVideoAverageBitRateKey: 8_500_000,
                AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
                AVVideoMaxKeyFrameIntervalKey: 60,
                AVVideoAllowFrameReorderingKey: true
            ]
        ]
        let vInput = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
        vInput.expectsMediaDataInRealTime = false

        let adaptor = AVAssetWriterInputPixelBufferAdaptor(
            assetWriterInput: vInput,
            sourcePixelBufferAttributes: [
                kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA),
                kCVPixelBufferWidthKey as String: width,
                kCVPixelBufferHeightKey as String: height,
                kCVPixelBufferCGImageCompatibilityKey as String: true,
                kCVPixelBufferCGBitmapContextCompatibilityKey as String: true
            ]
        )
        writer.add(vInput)

        let audioSettings: [String: Any] = [
            AVFormatIDKey: kAudioFormatMPEG4AAC,
            AVSampleRateKey: 48_000,
            AVNumberOfChannelsKey: 2,
            AVEncoderBitRateKey: 192_000
        ]
        let aInput = AVAssetWriterInput(mediaType: .audio, outputSettings: audioSettings)
        aInput.expectsMediaDataInRealTime = false
        writer.add(aInput)

        guard writer.startWriting() else {
            fatalError("AVAssetWriter failed to start: \(String(describing: writer.error))")
        }
        writer.startSession(atSourceTime: .zero)

        let previewKeyframes: [Int: String] = [
            Int(0.75 * Double(fps)):  "01_cold_open.png",
            Int(3.40 * Double(fps)):  "02_brand_reveal.png",
            Int(7.20 * Double(fps)):  "03_radial_wheel_drag.png",
            Int(10.60 * Double(fps)): "04_notch_success.png",
            Int(14.20 * Double(fps)): "05_modifier_tools.png",
            Int(19.20 * Double(fps)): "06_routes_176.png",
            Int(24.20 * Double(fps)): "07_white_privacy.png",
            Int(29.50 * Double(fps)): "08_finale_cta.png"
        ]

        let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
        print("Rendering \(totalFrames) frames (1920x1080 @ \(fps)fps)...")

        for frame in 0..<totalFrames {
            while !vInput.isReadyForMoreMediaData {
                try await Task.sleep(nanoseconds: 1_000_000)
            }
            try autoreleasepool {
                guard let pool = adaptor.pixelBufferPool else {
                    fatalError("Missing pixelBufferPool")
                }
                var pbOut: CVPixelBuffer?
                CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pbOut)
                guard let pb = pbOut else { fatalError("PixelBuffer allocation failed") }

                CVPixelBufferLockBaseAddress(pb, [])
                if let ctx = CGContext(
                    data: CVPixelBufferGetBaseAddress(pb),
                    width: width,
                    height: height,
                    bitsPerComponent: 8,
                    bytesPerRow: CVPixelBufferGetBytesPerRow(pb),
                    space: colorSpace,
                    bitmapInfo: CGBitmapInfo.byteOrder32Little.rawValue | CGImageAlphaInfo.premultipliedFirst.rawValue
                ) {
                    let tSec = Double(frame) / Double(fps)
                    director.renderFrame(time: tSec, into: ctx)
                }
                CVPixelBufferUnlockBaseAddress(pb, [])

                let pts = CMTime(value: CMTimeValue(frame), timescale: CMTimeScale(fps))
                adaptor.append(pb, withPresentationTime: pts)

                if let pDir = previewDir, let name = previewKeyframes[frame] {
                    try savePNG(from: pb, to: URL(fileURLWithPath: pDir).appendingPathComponent(name))
                }
            }
        }
        vInput.markAsFinished()

        // Feed synthesized 48kHz stereo PCM audio track
        print("Synthesizing & encoding 48kHz stereo soundscape...")
        let soundDesigner = StudioSoundDesigner()
        let pcm = soundDesigner.renderStereoPCM()
        let totalSamples = pcm.count / 2

        var asbd = AudioStreamBasicDescription(
            mSampleRate: 48_000,
            mFormatID: kAudioFormatLinearPCM,
            mFormatFlags: kLinearPCMFormatFlagIsSignedInteger | kLinearPCMFormatFlagIsPacked,
            mBytesPerPacket: 4,
            mFramesPerPacket: 1,
            mBytesPerFrame: 4,
            mChannelsPerFrame: 2,
            mBitsPerChannel: 16,
            mReserved: 0
        )
        var formatDesc: CMAudioFormatDescription?
        CMAudioFormatDescriptionCreate(
            allocator: kCFAllocatorDefault,
            asbd: &asbd,
            layoutSize: 0,
            layout: nil,
            magicCookieSize: 0,
            magicCookie: nil,
            extensions: nil,
            formatDescriptionOut: &formatDesc
        )

        let chunkFrames = 4096
        var offsetFrames = 0
        while offsetFrames < totalSamples {
            while !aInput.isReadyForMoreMediaData {
                try await Task.sleep(nanoseconds: 1_000_000)
            }
            let framesThisChunk = min(chunkFrames, totalSamples - offsetFrames)
            let byteCount = framesThisChunk * 4

            var blockBuf: CMBlockBuffer?
            CMBlockBufferCreateWithMemoryBlock(
                allocator: kCFAllocatorDefault,
                memoryBlock: nil,
                blockLength: byteCount,
                blockAllocator: kCFAllocatorDefault,
                customBlockSource: nil,
                offsetToData: 0,
                dataLength: byteCount,
                flags: 0,
                blockBufferOut: &blockBuf
            )
            pcm.withUnsafeBytes { rawBuf in
                let base = rawBuf.baseAddress!.advanced(by: offsetFrames * 4)
                _ = CMBlockBufferReplaceDataBytes(
                    with: base,
                    blockBuffer: blockBuf!,
                    offsetIntoDestination: 0,
                    dataLength: byteCount
                )
            }

            var timing = CMSampleTimingInfo(
                duration: CMTime(value: 1, timescale: 48_000),
                presentationTimeStamp: CMTime(value: CMTimeValue(offsetFrames), timescale: 48_000),
                decodeTimeStamp: .invalid
            )
            var sampleBuf: CMSampleBuffer?
            CMSampleBufferCreate(
                allocator: kCFAllocatorDefault,
                dataBuffer: blockBuf,
                dataReady: true,
                makeDataReadyCallback: nil,
                refcon: nil,
                formatDescription: formatDesc,
                sampleCount: framesThisChunk,
                sampleTimingEntryCount: 1,
                sampleTimingArray: &timing,
                sampleSizeEntryCount: 0,
                sampleSizeArray: nil,
                sampleBufferOut: &sampleBuf
            )
            if let sb = sampleBuf {
                aInput.append(sb)
            }
            offsetFrames += framesThisChunk
        }
        aInput.markAsFinished()

        await writer.finishWriting()
        guard writer.status == .completed else {
            fatalError("Video writing failed: \(String(describing: writer.error))")
        }
        print("✓ Rendered \(outURL.path)")
    }
}

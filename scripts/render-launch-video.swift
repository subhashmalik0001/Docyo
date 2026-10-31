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

// MARK: - Typography Loader

final class StudioFonts: @unchecked Sendable {
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

// MARK: - Canvas Drawing Helpers (1920 x 1080)

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

    func drawGrid(lineAlpha: CGFloat = 0.032, step: CGFloat = 64, darkInk: Bool = false, driftX: CGFloat = 0, driftY: CGFloat = 0) {
        ctx.saveGState()
        let c = darkInk ? Palette.black(lineAlpha) : Palette.white(lineAlpha)
        ctx.setStrokeColor(c.cgColor)
        ctx.setLineWidth(1)
        var x: CGFloat = driftX.truncatingRemainder(dividingBy: step)
        while x <= width + step {
            ctx.move(to: CGPoint(x: x + 0.5, y: 0))
            ctx.addLine(to: CGPoint(x: x + 0.5, y: height))
            x += step
        }
        var y: CGFloat = driftY.truncatingRemainder(dividingBy: step)
        while y <= height + step {
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
                    offset: CGSize(width: 0, height: -shadowY),
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

    func drawImage(_ img: CGImage?, in rect: CGRect, alpha: CGFloat = 1.0, cornerRadius: CGFloat = 0) {
        guard let img = img, alpha > 0.001 else { return }
        ctx.saveGState()
        ctx.setAlpha(clamp(alpha))
        if cornerRadius > 0 {
            ctx.addPath(roundedRectPath(rect, radius: cornerRadius))
            ctx.clip()
        }
        ctx.interpolationQuality = .high
        ctx.translateBy(x: rect.minX, y: rect.maxY)
        ctx.scaleBy(x: 1, y: -1)
        ctx.draw(img, in: CGRect(x: 0, y: 0, width: rect.width, height: rect.height))
        ctx.restoreGState()
    }

    func drawLogoSquircle(center: CGPoint, size: CGFloat, scale: CGFloat = 1.0, alpha: CGFloat = 1.0, glowAlpha: CGFloat = 0.25, rotation: CGFloat = 0) {
        guard alpha > 0.001, scale > 0.01 else { return }
        ctx.saveGState()
        ctx.translateBy(x: center.x, y: center.y)
        if rotation != 0 {
            ctx.rotate(by: rotation)
        }
        let s = size * scale
        let rect = CGRect(x: -s / 2, y: -s / 2, width: s, height: s)
        if glowAlpha > 0 {
            drawRadialSpotlight(cx: 0, cy: 0, radius: s * 1.4, alpha: glowAlpha * alpha)
        }
        drawBox(
            rect,
            radius: s * 0.24,
            fill: Palette.surface1.withAlphaComponent(alpha),
            stroke: Palette.purple(0.65 * alpha),
            lineWidth: 2.0,
            shadowAlpha: 0.55 * alpha,
            shadowBlur: 36,
            shadowY: 14
        )
        let pad = s * 0.10
        drawImage(avatar, in: rect.insetBy(dx: pad, dy: pad), alpha: alpha)
        ctx.restoreGState()
    }

    @discardableResult
    func drawText(
        _ text: String,
        at point: CGPoint,
        font: NSFont,
        color: NSColor,
        tracking: CGFloat = 0,
        align: NSTextAlignment = .left
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
        var drawX = point.x
        if align == .center {
            drawX -= size.width / 2
        } else if align == .right {
            drawX -= size.width
        }
        attrStr.draw(at: CGPoint(x: drawX, y: point.y))
        return size
    }

    func measureText(_ text: String, font: NSFont, tracking: CGFloat = 0) -> CGSize {
        let attrs: [NSAttributedString.Key: Any] = [.font: font, .kern: tracking]
        return NSAttributedString(string: text, attributes: attrs).size()
    }

    @discardableResult
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
        rotationOffset: CGFloat = 0,
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
        let centerAngle = -.pi / 2.0 + CGFloat(index) * slice + rotationOffset
        let halfSlice = slice / 2.0

        let rIn = rInner * scale
        let rOut = rOuter * scale
        let gapOuter = gapPx / (2.0 * max(rOut, 1))
        let gapInner = gapPx / (2.0 * max(rIn, 1))

        let aOutStart = centerAngle - halfSlice + gapOuter
        let aOutEnd   = centerAngle + halfSlice - gapOuter
        let aInStart  = centerAngle - halfSlice + gapInner
        let aInEnd    = centerAngle + halfSlice - gapInner

        let ox = cx + cos(centerAngle) * pushOut
        let oy = cy + sin(centerAngle) * pushOut

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

// MARK: - Motion-Rich Launch Film Director (30.0s, 60fps = 1,800 frames)

struct LaunchFilmDirector: @unchecked Sendable {
    let fonts: StudioFonts
    let avatar: CGImage?
    let duration: Double = 30.0
    let fps: Int = 60

    private static let hudPills: [(CGFloat, CGFloat, String, String)] = [
        (0.00,  3.80,  "LOCAL ENGINE",      "DOCYO v0.2 · ZERO CLOUD UPLOADS · 100% PRIVATE"),
        (3.80,  7.60,  "RADIAL WHEEL",     "⇧ SHIFT TO SUMMON WHEEL · DROP TO CONVERT"),
        (7.60,  12.00, "NOTCH COMPANION",  "LIVE STATUS IN NOTCH · ORIGINALS UNTOUCHED"),
        (12.00, 17.50, "MODIFIER RINGS",   "⌥⇧ 25 BUILT-IN TOOLS · ⌃ INSTANT ACTIONS"),
        (17.50, 22.80, "CODEC MATRIX",     "176 LOCAL CONVERSION ROUTES AT NATIVE SPEED"),
        (22.80, 26.20, "AIR-GAPPED",       "0.0 KB UPLOADED · ZERO TELEMETRY · NO ACCOUNTS"),
        (26.20, 30.00, "FREE & OPEN",      "MAC · WINDOWS · LINUX · SUBHASH MALIK")
    ]

    func renderFrame(time tSec: Double, into rawCtx: CGContext) {
        let t = CGFloat(tSec)

        rawCtx.saveGState()
        rawCtx.translateBy(x: 0, y: 1080)
        rawCtx.scaleBy(x: 1, y: -1)

        let nsCtx = NSGraphicsContext(cgContext: rawCtx, flipped: true)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = nsCtx

        let c = Canvas(ctx: rawCtx, fonts: fonts, avatar: avatar)
        let isWhiteScene = (t >= 22.80 && t < 26.20)

        // Subtle camera zoom & float for dynamic cinema motion
        let camZoom = 1.0 + 0.025 * sin(t * 0.35)
        let camDriftX = sin(t * 0.45) * 8.0
        let camDriftY = cos(t * 0.35) * 6.0

        rawCtx.saveGState()
        rawCtx.translateBy(x: 960 + camDriftX, y: 540 + camDriftY)
        rawCtx.scaleBy(x: camZoom, y: camZoom)
        rawCtx.translateBy(x: -960, y: -540)

        if t < 3.80 {
            renderAct1BrandReveal(c, t: t)
        } else if t < 12.00 {
            renderAct2InteractiveDesktop(c, t: t - 3.80)
        } else if t < 17.50 {
            renderAct3ModifierRingsAndTools(c, t: t - 12.00)
        } else if t < 22.80 {
            renderAct4FormatMatrix176(c, t: t - 17.50)
        } else if t < 26.20 {
            renderAct5WhitePrivacyContrast(c, t: t - 22.80)
        } else {
            renderAct6FinaleCTA(c, t: t - 26.20)
        }

        rawCtx.restoreGState()

        // Dynamic Interactive Bottom Product HUD (Replaces speech captions)
        drawInteractiveProductHUD(c, globalT: t, onWhite: isWhiteScene)

        // Transitions
        drawSceneTransitionOverlay(c, globalT: t)

        NSGraphicsContext.restoreGraphicsState()
        rawCtx.restoreGState()
    }

    private func drawInteractiveProductHUD(_ c: Canvas, globalT t: CGFloat, onWhite: Bool) {
        for (s, e, tag, desc) in Self.hudPills {
            if t >= s && t <= e {
                let fi = easeOutQuint(prog(t, s, 0.20))
                let fo = 1.0 - easeInOutCubic(prog(t, e - 0.20, 0.20))
                let a = clamp(fi * fo)
                guard a > 0.02 else { break }

                let tagFont = fonts.mono(11, semibold: true)
                let descFont = fonts.mono(13.5, semibold: true)
                let tagW = c.measureText(tag, font: tagFont, tracking: 1.2).width + 20
                let descW = c.measureText(desc, font: descFont, tracking: 0.8).width
                let totalW = tagW + descW + 58
                let boxH: CGFloat = 42
                let boxRect = CGRect(x: 960 - totalW / 2, y: 1014 + (1 - fi) * 12, width: totalW, height: boxH)

                c.drawBox(
                    boxRect,
                    radius: 21,
                    fill: onWhite ? Palette.bgObsidian.withAlphaComponent(0.94 * a) : Palette.pureBlack.withAlphaComponent(0.88 * a),
                    stroke: Palette.purple(0.65 * a),
                    lineWidth: 1.5,
                    shadowAlpha: 0.5 * a,
                    shadowBlur: 24,
                    shadowY: 8
                )

                // Animated active pulse dot
                let dotCenter = CGPoint(x: boxRect.minX + 20, y: boxRect.midY)
                let dotPulse = 0.5 + 0.5 * sin(Double(t) * 9.0)
                c.ctx.saveGState()
                c.ctx.setFillColor(Palette.purple(0.35 * CGFloat(dotPulse) * a).cgColor)
                c.ctx.fillEllipse(in: CGRect(x: dotCenter.x - 7, y: dotCenter.y - 7, width: 14, height: 14))
                c.ctx.setFillColor(Palette.purpleSoft(a).cgColor)
                c.ctx.fillEllipse(in: CGRect(x: dotCenter.x - 3.5, y: dotCenter.y - 3.5, width: 7, height: 7))
                c.ctx.restoreGState()

                // Tag pill
                let tagRect = CGRect(x: boxRect.minX + 34, y: boxRect.midY - 11, width: tagW, height: 22)
                c.drawBox(tagRect, radius: 6, fill: Palette.purple(0.25 * a), stroke: Palette.purple(0.6 * a), lineWidth: 1.0)
                c.drawText(tag, at: CGPoint(x: tagRect.midX, y: tagRect.minY + 4), font: tagFont, color: Palette.purpleSoft(a), tracking: 1.2, align: .center)

                // Text
                c.drawText(
                    desc,
                    at: CGPoint(x: tagRect.maxX + 12, y: boxRect.minY + 12),
                    font: descFont,
                    color: Palette.white(0.92 * a),
                    tracking: 0.8
                )
                break
            }
        }
    }

    // MARK: Act 1 (0.0s - 3.8s): Brand Hook & Official Scholar Penguin Reveal
    private func renderAct1BrandReveal(_ c: Canvas, t: CGFloat) {
        c.fillScreen(Palette.bgObsidian)
        let drift = t * 14.0
        c.drawGrid(lineAlpha: 0.035, driftX: drift, driftY: drift * 0.5)

        if t < 1.40 {
            let enter = easeOutQuint(prog(t, 0.05, 0.40))
            let exit = 1.0 - easeInOutCubic(prog(t, 1.15, 0.25))
            let a = enter * exit
            let yOff = (1 - enter) * 28

            c.drawRadialSpotlight(cx: 960, cy: 520, radius: 620, alpha: 0.22 * a)
            c.drawText(
                "WHY UPLOAD PRIVATE FILES TO THE CLOUD?",
                at: CGPoint(x: 960, y: 420 + yOff),
                font: fonts.mono(18, semibold: true),
                color: Palette.purpleSoft(a),
                tracking: 3.2,
                align: .center
            )
            c.drawText(
                "Just to change four letters after a dot?",
                at: CGPoint(x: 960, y: 472 + yOff),
                font: fonts.display(68, bold: false),
                color: Palette.white(a),
                tracking: -2.2,
                align: .center
            )

            let scan = prog(t, 1.16, 0.24)
            if scan > 0 && scan < 1 {
                let lineW = lerp(80, 1720, easeOutQuint(scan))
                let lineA = sin(scan * .pi)
                c.drawBox(CGRect(x: 960 - lineW / 2, y: 550, width: lineW, height: 3.5), radius: 1.75, fill: Palette.purple(lineA))
            }
        } else {
            let local = t - 1.40
            let logoEnter = springPop(prog(local, 0.0, 0.55))
            let logoAlpha = easeOutQuint(prog(local, 0.0, 0.30))
            let logoRot = (1.0 - easeOutQuint(prog(local, 0.0, 0.55))) * -0.25 // Dynamic entrance rotation

            c.drawRadialSpotlight(cx: 960, cy: 380, radius: 760, alpha: 0.30 * logoAlpha)

            // Animated glowing halo ring behind logo
            let haloP = prog(local, 0.2, 2.0)
            let haloR: CGFloat = 100 + 15 * sin(haloP * .pi * 3)
            c.ctx.saveGState()
            c.ctx.setStrokeColor(Palette.purple(0.35 * logoAlpha).cgColor)
            c.ctx.setLineWidth(2.0)
            c.ctx.setLineDash(phase: CGFloat(local * 40), lengths: [6, 8])
            c.ctx.strokeEllipse(in: CGRect(x: 960 - haloR, y: 262 - haloR, width: haloR * 2, height: haloR * 2))
            c.ctx.restoreGState()

            c.drawLogoSquircle(
                center: CGPoint(x: 960, y: 262),
                size: 160,
                scale: 0.70 + 0.30 * logoEnter,
                alpha: logoAlpha,
                glowAlpha: 0.36,
                rotation: logoRot
            )

            let pillP = easeOutQuint(prog(local, 0.15, 0.40))
            c.drawPill(
                centerX: 960,
                topY: 374 + (1 - pillP) * 16,
                text: "DOCYO v0.2  ·  LOCAL-FIRST FILE CONVERTER & TOOLKIT",
                font: fonts.mono(14, semibold: true),
                textColor: Palette.white(0.90),
                fill: Palette.surface1,
                stroke: Palette.purple(0.5),
                dotColor: Palette.purple,
                alpha: pillP
            )

            // Dynamic kinetic headline entries
            let fBig = fonts.display(112, bold: true)
            let w1 = "Drag."
            let w2 = "Hold Shift."
            let w3 = "Convert."
            let gap: CGFloat = 34
            let s1 = c.measureText(w1, font: fBig, tracking: -3.8)
            let s2 = c.measureText(w2, font: fBig, tracking: -3.8)
            let s3 = c.measureText(w3, font: fBig, tracking: -3.8)
            let totalW = s1.width + gap + s2.width + gap + s3.width
            let startX = 960 - totalW / 2
            let baseY: CGFloat = 464

            let b1 = springPop(prog(local, 0.35, 0.42))
            let b2 = springPop(prog(local, 0.70, 0.42))
            let b3 = springPop(prog(local, 1.05, 0.42))

            if b1 > 0 {
                c.drawText(w1, at: CGPoint(x: startX, y: baseY + (1 - b1) * 36), font: fBig, color: Palette.white(b1), tracking: -3.8)
            }
            if b2 > 0 {
                c.drawText(w2, at: CGPoint(x: startX + s1.width + gap, y: baseY + (1 - b2) * 36), font: fBig, color: Palette.purpleSoft(b2), tracking: -3.8)
            }
            if b3 > 0 {
                c.drawText(w3, at: CGPoint(x: startX + s1.width + gap + s2.width + gap, y: baseY + (1 - b3) * 36), font: fBig, color: Palette.white(b3), tracking: -3.8)
            }

            let subP = easeOutQuint(prog(local, 1.35, 0.45))
            if subP > 0 {
                c.drawText(
                    "Private. Offline. Non-destructive. Zero cloud uploads, zero accounts, zero telemetry.",
                    at: CGPoint(x: 960, y: 622 + (1 - subP) * 16),
                    font: fonts.sans(25, medium: false),
                    color: Palette.white(0.66 * subP),
                    tracking: -0.3,
                    align: .center
                )
            }
        }
    }

    // MARK: Act 2 (3.8s - 12.0s): Interactive Desktop -> Radial Wheel Bloom -> Drop -> Notch Success
    private func renderAct2InteractiveDesktop(_ c: Canvas, t: CGFloat) {
        c.fillScreen(Palette.bgObsidian)
        let drift = t * 8.0
        c.drawGrid(lineAlpha: 0.026, driftX: drift, driftY: drift * 0.4)
        c.drawRadialSpotlight(cx: 960, cy: 520, radius: 760, alpha: 0.20)

        // Floating Finder window with subtle physics levitation
        let floatY = sin(Double(t) * 1.8) * 4.0
        let winEnter = springPop(prog(t, 0.0, 0.50))
        let winScale = lerp(0.95, 1.0, winEnter)
        let winW: CGFloat = 1660 * winScale
        let winH: CGFloat = 860 * winScale
        let winRect = CGRect(x: 960 - winW / 2, y: 516 - winH / 2 + CGFloat(floatY), width: winW, height: winH)

        c.drawBox(
            winRect,
            radius: 26,
            fill: Palette.surface1,
            stroke: Palette.white(0.12),
            lineWidth: 1.5,
            shadowAlpha: 0.75,
            shadowBlur: 64,
            shadowY: 26
        )

        // Window Titlebar
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

        for i in 0..<3 {
            c.ctx.setFillColor(Palette.white(0.20).cgColor)
            c.ctx.fillEllipse(in: CGRect(x: barRect.minX + 24 + CGFloat(i) * 20, y: barRect.midY - 6, width: 12, height: 12))
        }
        c.drawText("Finder", at: CGPoint(x: barRect.minX + 98, y: barRect.minY + 17), font: fonts.sans(15, medium: true), color: Palette.white(0.85))
        c.drawText("File    Edit    View    Go", at: CGPoint(x: barRect.minX + 164, y: barRect.minY + 17), font: fonts.sans(15), color: Palette.white(0.42))

        c.drawImage(avatar, in: CGRect(x: barRect.maxX - 156, y: barRect.midY - 12, width: 24, height: 24))
        c.drawText("Docyo  LOCAL", at: CGPoint(x: barRect.maxX - 124, y: barRect.minY + 18), font: fonts.mono(13, semibold: true), color: Palette.white(0.75))

        // Timeline milestones:
        // t=1.00s (shift key down)
        // t=1.60s (wheel blooms open with 35° rotation spin!)
        // t=3.35s (cursor hovers PNG wedge)
        // t=3.80s (DROP!)
        // t=3.85..5.90s (Notch progress 0% -> 100%)
        // t=6.00s (SUCCESS CHIME & checkmark!)
        let shiftHeld = t >= 1.00 && t < 3.90
        let wheelOpen = prog(t, 1.58, 0.50)
        let hoverPNG  = t >= 3.20 && t < 3.80
        let dropped   = t >= 3.80
        let convProg  = clamp((t - 3.85) / 2.05)
        let convDone  = t >= 6.00

        // MacBook Notch Companion Dropdown
        let notchExpanded = t >= 1.80
        let notchExpandP = springPop(prog(t, 1.80, 0.45))
        let notchW = lerp(220, 440, notchExpandP)
        let notchH = lerp(42, 64, notchExpandP)
        let notchRect = CGRect(x: 960 - notchW / 2, y: winRect.minY, width: notchW, height: notchH)

        c.drawBox(
            notchRect,
            radius: 18,
            fill: Palette.pureBlack,
            stroke: convDone ? Palette.purple(0.80) : Palette.white(0.16),
            lineWidth: 1.5,
            shadowAlpha: 0.85,
            shadowBlur: 30,
            shadowY: 10
        )

        let phaseTag: String
        let phaseCaption: String
        if !notchExpanded {
            phaseTag = "DORMANT"
            phaseCaption = "Ready in Notch"
        } else if !dropped {
            phaseTag = "WATCHING"
            phaseCaption = hoverPNG ? "Looking at PNG (.png)" : "Choose a format — I'm ready"
        } else if convProg < 0.20 {
            phaseTag = "RECEIVED"
            phaseCaption = "Got photo.heic!"
        } else if !convDone {
            phaseTag = "PROCESSING"
            phaseCaption = "Encoding lossless PNG (\(Int(convProg * 100))%)"
        } else {
            phaseTag = "SUCCESS"
            phaseCaption = "Done. photo.png is ready."
        }

        // Mascot eye bounce / happy reaction
        let mascotBounce: CGFloat = convDone ? -4 * abs(sin(clamp((t - 6.00) * 4) * .pi)) : (dropped && !convDone ? sin(t * 12) * 1.5 : 0)
        c.drawImage(
            avatar,
            in: CGRect(x: notchRect.minX + 16, y: notchRect.midY - 18 + mascotBounce, width: 36, height: 36)
        )

        if notchExpanded {
            c.drawText(phaseTag, at: CGPoint(x: notchRect.minX + 64, y: notchRect.minY + 12), font: fonts.mono(11, semibold: true), color: Palette.purpleSoft, tracking: 1.2)
            c.drawText(phaseCaption, at: CGPoint(x: notchRect.minX + 64, y: notchRect.minY + 32), font: fonts.sans(14.5, medium: true), color: Palette.white(0.92))

            let ringCenter = CGPoint(x: notchRect.maxX - 30, y: notchRect.midY)
            if dropped && !convDone {
                c.ctx.saveGState()
                c.ctx.setStrokeColor(Palette.white(0.16).cgColor)
                c.ctx.setLineWidth(3)
                c.ctx.strokeEllipse(in: CGRect(x: ringCenter.x - 12, y: ringCenter.y - 12, width: 24, height: 24))
                c.ctx.setStrokeColor(Palette.purple.cgColor)
                c.ctx.setLineWidth(3)
                c.ctx.setLineCap(.round)
                c.ctx.addArc(center: ringCenter, radius: 12, startAngle: -.pi / 2, endAngle: -.pi / 2 + (.pi * 2 * convProg), clockwise: false)
                c.ctx.strokePath()
                c.ctx.restoreGState()
            } else if convDone {
                c.ctx.saveGState()
                c.ctx.setFillColor(Palette.purple(0.30).cgColor)
                c.ctx.fillEllipse(in: CGRect(x: ringCenter.x - 13, y: ringCenter.y - 13, width: 26, height: 26))
                c.ctx.restoreGState()
                c.drawCheckmark(center: ringCenter, size: 14, color: Palette.purpleSoft, lineWidth: 2.2)
            }
        }

        // Left Finder Cards
        let leftX = winRect.minX + 58
        let zoneTop = winRect.minY + 122
        c.drawText("01 · FINDER SELECTION", at: CGPoint(x: leftX, y: zoneTop), font: fonts.mono(12.5, semibold: true), color: Palette.white(0.45), tracking: 1.4)

        let files: [(String, String, String, Bool)] = [
            ("photo.heic", "4.2 MB · 4032 × 3024", ".HEIC", true),
            ("board-deck.pdf", "11.8 MB · 24 pages", ".PDF", false),
            ("screen-demo.mov", "38.0 MB · 4K 60fps", ".MOV", false)
        ]
        for (idx, f) in files.enumerated() {
            let cardY = zoneTop + 34 + CGFloat(idx) * 100
            let cardRect = CGRect(x: leftX, y: cardY, width: 410, height: 84)
            let isPicked = f.3 && t >= 0.80 && !dropped
            c.drawBox(
                cardRect,
                radius: 16,
                fill: f.3 ? Palette.surface2.withAlphaComponent(isPicked ? 0.50 : 1.0) : Palette.bgObsidian.withAlphaComponent(0.75),
                stroke: f.3 ? Palette.purple(0.65) : Palette.white(0.08),
                lineWidth: f.3 ? 1.8 : 1.2
            )
            let badgeRect = CGRect(x: cardRect.maxX - 78, y: cardRect.midY - 14, width: 58, height: 28)
            c.drawBox(badgeRect, radius: 7, fill: f.3 ? Palette.purple(0.18) : Palette.surface1, stroke: f.3 ? Palette.purple(0.45) : Palette.white(0.1))
            c.drawText(f.2, at: CGPoint(x: badgeRect.midX, y: badgeRect.minY + 6), font: fonts.mono(11.5, semibold: true), color: f.3 ? Palette.purpleSoft : Palette.white(0.5), align: .center)
            c.drawText(f.0, at: CGPoint(x: cardRect.minX + 22, y: cardRect.minY + 18), font: fonts.mono(17, semibold: true), color: Palette.white(isPicked ? 0.55 : 0.95))
            c.drawText(f.1, at: CGPoint(x: cardRect.minX + 22, y: cardRect.minY + 45), font: fonts.mono(12.5), color: Palette.white(0.45))
        }

        // Shift Key Indicator
        let keycapP = springPop(prog(t, 0.95, 0.45))
        if keycapP > 0.01 {
            let kcRect = CGRect(x: leftX, y: winRect.maxY - 106, width: 326, height: 60)
            c.drawBox(
                kcRect,
                radius: 14,
                fill: shiftHeld ? Palette.purple(0.22) : Palette.bgObsidian,
                stroke: shiftHeld ? Palette.purpleSoft : Palette.white(0.14),
                lineWidth: shiftHeld ? 2.0 : 1.2
            )
            c.drawText(
                shiftHeld ? "⇧ SHIFT HELD" : "⇧ SHIFT RELEASED",
                at: CGPoint(x: kcRect.minX + 20, y: kcRect.minY + 12),
                font: fonts.mono(13, semibold: true),
                color: shiftHeld ? Palette.purpleSoft : Palette.white(0.55),
                tracking: 1.0
            )
            c.drawText(
                shiftHeld ? "Radial Convert Wheel Active" : "Dropped onto PNG wedge",
                at: CGPoint(x: kcRect.minX + 20, y: kcRect.minY + 33),
                font: fonts.sans(13.5, medium: false),
                color: Palette.white(0.75)
            )
        }

        // Center Radial Wheel with dynamic spin bloom
        let wheelCenter = CGPoint(x: 960, y: 534)
        let wedges: [(String, String)] = [
            ("PNG", ".png"), ("JPEG", ".jpg"), ("WEBP", ".webp"),
            ("AVIF", ".avif"), ("PDF", ".pdf"), ("TIFF", ".tiff")
        ]

        if wheelOpen > 0.01 {
            c.drawRadialSpotlight(cx: wheelCenter.x, cy: wheelCenter.y, radius: 270, alpha: 0.28 * easeOutQuint(wheelOpen))
            // Rotational momentum settling: -0.6 rad -> 0 rad
            let rotInertia = (1.0 - easeOutQuint(prog(t, 1.58, 0.65))) * -0.65

            for (idx, w) in wedges.enumerated() {
                let stagger = springPop(prog(t, 1.58 + CGFloat(idx) * 0.035, 0.48))
                let isTarget = idx == 0 && (hoverPNG || (dropped && t < 6.2))
                let pushP = isTarget ? easeOutQuint(prog(t, 3.20, 0.25)) * 12.0 : 0
                c.drawAnnularWedge(
                    cx: wheelCenter.x,
                    cy: wheelCenter.y,
                    rInner: 80,
                    rOuter: 188,
                    index: idx,
                    count: wedges.count,
                    rotationOffset: rotInertia,
                    gapPx: 8,
                    pushOut: pushP,
                    scale: stagger,
                    fill: isTarget ? Palette.purple(0.38) : Palette.surface2.withAlphaComponent(0.95),
                    stroke: isTarget ? Palette.purpleSoft : Palette.white(0.13),
                    lineWidth: isTarget ? 2.4 : 1.3,
                    label: w.0,
                    sublabel: w.1,
                    isHighlighted: isTarget,
                    alpha: clamp(stagger * 1.2)
                )
            }
        }

        // Center Hub with dynamic progress ring
        let hubR: CGFloat = 68
        c.drawBox(
            CGRect(x: wheelCenter.x - hubR, y: wheelCenter.y - hubR, width: hubR * 2, height: hubR * 2),
            radius: hubR,
            fill: Palette.bgObsidian,
            stroke: (hoverPNG || dropped) ? Palette.purple(0.75) : Palette.white(0.15),
            lineWidth: 2.0
        )
        if dropped && !convDone {
            c.ctx.saveGState()
            c.ctx.setStrokeColor(Palette.purple.cgColor)
            c.ctx.setLineWidth(4.0)
            c.ctx.setLineCap(.round)
            c.ctx.addArc(center: wheelCenter, radius: hubR, startAngle: -.pi / 2, endAngle: -.pi / 2 + (.pi * 2 * convProg), clockwise: false)
            c.ctx.strokePath()
            c.ctx.restoreGState()
        }
        c.drawImage(avatar, in: CGRect(x: wheelCenter.x - 22, y: wheelCenter.y - 45, width: 44, height: 44))
        c.drawText(hoverPNG || dropped ? ".HEIC → PNG" : "photo.heic", at: CGPoint(x: wheelCenter.x, y: wheelCenter.y + 8), font: fonts.mono(13.5, semibold: true), color: Palette.pureWhite, align: .center)
        c.drawText(convDone ? "Saved ✓" : (dropped ? "\(Int(convProg * 100))%" : "⇧ Shift wheel"), at: CGPoint(x: wheelCenter.x, y: wheelCenter.y + 27), font: fonts.mono(11.5), color: Palette.purpleSoft, align: .center)

        // Drop Shockwave Ripple Rings
        let rippleP = prog(t, 3.80, 0.65)
        if rippleP > 0 && rippleP < 1 {
            let rr1 = lerp(80, 260, easeOutQuint(rippleP))
            let rr2 = lerp(60, 200, easeOutQuint(rippleP))
            c.ctx.saveGState()
            c.ctx.setStrokeColor(Palette.purpleSoft(1 - rippleP).cgColor)
            c.ctx.setLineWidth(2.5)
            c.ctx.strokeEllipse(in: CGRect(x: wheelCenter.x - rr1, y: wheelCenter.y - rr1, width: rr1 * 2, height: rr1 * 2))
            c.ctx.setStrokeColor(Palette.purple((1 - rippleP) * 0.7).cgColor)
            c.ctx.strokeEllipse(in: CGRect(x: wheelCenter.x - rr2, y: wheelCenter.y - rr2, width: rr2 * 2, height: rr2 * 2))
            c.ctx.restoreGState()
        }

        // Right Local Output Card
        let rightX = winRect.maxX - 468
        c.drawText("02 · LOCAL DISK OUTPUT (~/Desktop)", at: CGPoint(x: rightX, y: zoneTop), font: fonts.mono(12.5, semibold: true), color: Palette.white(0.45), tracking: 1.2)

        let outPanel = CGRect(x: rightX, y: zoneTop + 34, width: 410, height: 282)
        c.drawBox(outPanel, radius: 18, fill: Palette.bgObsidian.withAlphaComponent(0.85), stroke: Palette.white(0.10), lineWidth: 1.4)

        let origBox = CGRect(x: outPanel.minX + 20, y: outPanel.minY + 20, width: 370, height: 82)
        c.drawBox(origBox, radius: 13, fill: Palette.surface1, stroke: Palette.white(0.08), lineWidth: 1.2)
        c.drawText("photo.heic", at: CGPoint(x: origBox.minX + 18, y: origBox.minY + 17), font: fonts.mono(16, semibold: true), color: Palette.white(0.82))
        c.drawText("Original source file", at: CGPoint(x: origBox.minX + 18, y: origBox.minY + 43), font: fonts.mono(12), color: Palette.white(0.42))
        let untouchBadge = CGRect(x: origBox.maxX - 118, y: origBox.midY - 14, width: 100, height: 28)
        c.drawBox(untouchBadge, radius: 7, fill: Palette.surface2, stroke: Palette.white(0.12))
        c.drawText("UNTOUCHED", at: CGPoint(x: untouchBadge.midX, y: untouchBadge.minY + 6), font: fonts.mono(11, semibold: true), color: Palette.white(0.70), align: .center)

        let pipeLabel = convDone ? "HEIC → PNG · Atomic commit" : (dropped ? "Staging .docyo-tmp (\(Int(convProg * 100))%)" : "Waiting for drop…")
        c.drawText(pipeLabel, at: CGPoint(x: outPanel.midX, y: outPanel.minY + 122), font: fonts.mono(12, semibold: true), color: Palette.purpleSoft, align: .center)

        let resAppear = springPop(prog(t, 3.85, 0.5))
        let doneGlow = easeOutQuint(prog(t, 6.00, 0.45))
        let resBox = CGRect(x: outPanel.minX + 20, y: outPanel.minY + 160 + (1 - resAppear) * 14, width: 370, height: 100)
        c.drawBox(
            resBox,
            radius: 14,
            fill: convDone ? Palette.purple(0.16) : Palette.surface1.withAlphaComponent(0.6),
            stroke: convDone ? Palette.purple(0.85) : Palette.white(0.08),
            lineWidth: convDone ? 2.0 : 1.2
        )
        c.drawText(convDone ? "photo.png" : (dropped ? ".docyo-8a3f.tmp" : "—"), at: CGPoint(x: resBox.minX + 18, y: resBox.minY + 21), font: fonts.mono(19, semibold: true), color: convDone ? Palette.pureWhite : Palette.white(0.55))
        c.drawText(convDone ? "6.1 MB · Lossless RGBA · Ready" : (dropped ? "Atomic staging buffer…" : "Drop file on wheel to convert"), at: CGPoint(x: resBox.minX + 18, y: resBox.minY + 53), font: fonts.mono(12.5), color: convDone ? Palette.purpleSoft : Palette.white(0.38))
        if doneGlow > 0.05 {
            let chkCenter = CGPoint(x: resBox.maxX - 36, y: resBox.midY)
            c.ctx.saveGState()
            c.ctx.setFillColor(Palette.purple(0.30 * doneGlow).cgColor)
            c.ctx.fillEllipse(in: CGRect(x: chkCenter.x - 18, y: chkCenter.y - 18, width: 36, height: 36))
            c.ctx.restoreGState()
            c.drawCheckmark(center: chkCenter, size: 18, color: Palette.pureWhite.withAlphaComponent(doneGlow), lineWidth: 2.5)
        }

        // Animated Mouse Cursor with Dynamic Bezier Path
        let startPt = CGPoint(x: leftX + 210, y: zoneTop + 76)
        let centerPt = CGPoint(x: wheelCenter.x - 18, y: wheelCenter.y + 12)
        let pngWedgePt = CGPoint(x: wheelCenter.x, y: wheelCenter.y - 134)
        let restPt = CGPoint(x: wheelCenter.x + 130, y: wheelCenter.y + 120)

        var cursorPt = CGPoint(x: leftX + 90, y: zoneTop + 210)
        if t < 0.80 {
            let p = easeInOutCubic(prog(t, 0.15, 0.65))
            cursorPt = CGPoint(x: lerp(leftX + 80, startPt.x, p), y: lerp(zoneTop + 230, startPt.y, p))
        } else if t < 2.30 {
            let p = easeInOutCubic(prog(t, 0.80, 1.45))
            cursorPt = CGPoint(x: lerp(startPt.x, centerPt.x, p), y: lerp(startPt.y, centerPt.y, p))
        } else if t < 3.80 {
            let p = easeInOutCubic(prog(t, 2.30, 0.90))
            cursorPt = CGPoint(x: lerp(centerPt.x, pngWedgePt.x, p), y: lerp(centerPt.y, pngWedgePt.y, p))
        } else {
            let p = easeOutQuint(prog(t, 3.80, 0.70))
            cursorPt = CGPoint(x: lerp(pngWedgePt.x, restPt.x, p), y: lerp(pngWedgePt.y, restPt.y, p))
        }

        if t >= 0.80 && !dropped {
            let ghostRect = CGRect(x: cursorPt.x - 95, y: cursorPt.y - 54, width: 224, height: 48)
            c.drawBox(ghostRect, radius: 13, fill: Palette.surface2.withAlphaComponent(0.96), stroke: Palette.purpleSoft, lineWidth: 1.8, shadowAlpha: 0.75, shadowBlur: 24, shadowY: 10)
            c.drawText("photo.heic", at: CGPoint(x: ghostRect.minX + 16, y: ghostRect.minY + 13), font: fonts.mono(14.5, semibold: true), color: Palette.pureWhite)
            if hoverPNG {
                let tagR = CGRect(x: ghostRect.maxX - 76, y: ghostRect.midY - 12, width: 62, height: 24)
                c.drawBox(tagR, radius: 6, fill: Palette.purple)
                c.drawText("→ PNG", at: CGPoint(x: tagR.midX, y: tagR.minY + 4), font: fonts.mono(11, semibold: true), color: Palette.pureWhite, align: .center)
            }
        }

        c.drawCursor(at: cursorPt, pressed: t >= 0.80 && !dropped)
    }

    // MARK: Act 3 (12.0s - 17.5s, dur 5.5s): Three Modifier Rings & 25 Built-In Tools
    private func renderAct3ModifierRingsAndTools(_ c: Canvas, t: CGFloat) {
        c.fillScreen(Palette.bgObsidian)
        let drift = t * 12.0
        c.drawGrid(lineAlpha: 0.03, driftX: drift, driftY: drift * 0.3)
        c.drawRadialSpotlight(cx: 520, cy: 520, radius: 620, alpha: 0.22)

        let headP = easeOutQuint(prog(t, 0.0, 0.45))
        c.drawText("01 / THREE MODIFIER RINGS · 25 BUILT-IN TOOLS", at: CGPoint(x: 110, y: 74 + (1 - headP) * 16), font: fonts.mono(14, semibold: true), color: Palette.purpleSoft(headP), tracking: 2.2)
        c.drawText("One drag from Finder. Zero timeline bloat.", at: CGPoint(x: 110, y: 108 + (1 - headP) * 16), font: fonts.display(56, bold: true), color: Palette.white(headP), tracking: -2.0)

        // Switching between 3 modifier rings with rotational snap:
        // 0.0 .. 1.8s: Shift (Convert)
        // 1.8 .. 3.6s: Option+Shift (25 Tools)
        // 3.6 .. 5.5s: Control (Actions)
        let activeMod: Int = t < 1.80 ? 0 : (t < 3.60 ? 1 : 2)
        let ringRotAngle = CGFloat(activeMod) * 1.05 // Dynamic 60° rotation inertia per switch

        let leftCard = CGRect(x: 110, y: 206, width: 820, height: 760)
        c.drawBox(leftCard, radius: 24, fill: Palette.surface1, stroke: Palette.white(0.10), lineWidth: 1.5)

        let modSpecs: [(String, String, String)] = [
            ("⇧ Shift", "Convert Format", "176 direct codec routes"),
            ("⌥⇧ Opt + Shift", "25 Built-In Tools", "Trim, Crop, Merge PDF, OCR, Redact"),
            ("⌃ Control", "Instant File Actions", "Duplicate, Copy Path, SHA-256")
        ]
        for (i, m) in modSpecs.enumerated() {
            let rowRect = CGRect(x: leftCard.minX + 36, y: leftCard.minY + 34 + CGFloat(i) * 84, width: 748, height: 70)
            let isAct = i == activeMod
            c.drawBox(rowRect, radius: 14, fill: isAct ? Palette.purple(0.20) : Palette.bgObsidian, stroke: isAct ? Palette.purple(0.75) : Palette.white(0.08), lineWidth: isAct ? 2.0 : 1.2)
            c.drawText(m.0, at: CGPoint(x: rowRect.minX + 22, y: rowRect.minY + 22), font: fonts.mono(16, semibold: true), color: isAct ? Palette.purpleSoft : Palette.white(0.55))
            c.drawText(m.1, at: CGPoint(x: rowRect.minX + 215, y: rowRect.minY + 21), font: fonts.display(20, bold: false), color: isAct ? Palette.pureWhite : Palette.white(0.70))
            c.drawText(m.2, at: CGPoint(x: rowRect.maxX - 22, y: rowRect.minY + 24), font: fonts.mono(13), color: isAct ? Palette.white(0.85) : Palette.white(0.40), align: .right)
        }

        let wc = CGPoint(x: leftCard.midX, y: leftCard.minY + 534)
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
                rotationOffset: ringRotAngle,
                gapPx: 7,
                pushOut: hi ? 8 : 0,
                scale: 1.0,
                fill: hi ? Palette.purple(0.36) : Palette.surface2,
                stroke: hi ? Palette.purpleSoft : Palette.white(0.12),
                lineWidth: hi ? 2.2 : 1.2,
                label: lbl,
                sublabel: "",
                isHighlighted: hi
            )
        }
        c.drawBox(CGRect(x: wc.x - 54, y: wc.y - 54, width: 108, height: 108), radius: 54, fill: Palette.bgObsidian, stroke: Palette.purple(0.65), lineWidth: 1.8)
        c.drawImage(avatar, in: CGRect(x: wc.x - 20, y: wc.y - 34, width: 40, height: 40))
        c.drawText(activeMod == 0 ? "CONVERT" : (activeMod == 1 ? "25 TOOLS" : "ACTIONS"), at: CGPoint(x: wc.x, y: wc.y + 12), font: fonts.mono(12, semibold: true), color: Palette.purpleSoft, align: .center)

        // Right side: Video Trimmer & Tools
        let rightX: CGFloat = 970
        let card1 = CGRect(x: rightX, y: 206, width: 840, height: 364)
        c.drawBox(card1, radius: 24, fill: Palette.surface1, stroke: Palette.white(0.10), lineWidth: 1.5)
        c.drawText("VIDEO & AUDIO SUITE", at: CGPoint(x: card1.minX + 36, y: card1.minY + 32), font: fonts.mono(13, semibold: true), color: Palette.purpleSoft, tracking: 1.5)
        c.drawText("Trim, crop, speed, join & normalize", at: CGPoint(x: card1.minX + 36, y: card1.minY + 64), font: fonts.display(30), color: Palette.pureWhite, tracking: -0.8)

        let waveBox = CGRect(x: card1.minX + 36, y: card1.minY + 132, width: 768, height: 150)
        c.drawBox(waveBox, radius: 16, fill: Palette.bgObsidian, stroke: Palette.white(0.08))

        let heights: [CGFloat] = [28, 52, 40, 74, 88, 62, 94, 70, 48, 84, 92, 58, 78, 64, 90, 72, 50, 82, 68, 44, 76, 56, 36, 48, 30, 62, 44, 26]
        let trimAnim = easeInOutCubic(prog(t, 0.4, 2.2))
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
            c.drawBox(CGRect(x: bx, y: by, width: max(6, barStep - 7), height: bh), radius: 3, fill: inside ? Palette.purple : Palette.white(0.16))
        }
        let trimRect = CGRect(x: waveBox.minX + 28 + barAreaW * leftBracketFrac, y: waveBox.minY + 12, width: barAreaW * (rightBracketFrac - leftBracketFrac), height: waveBox.height - 24)
        c.drawBox(trimRect, radius: 8, fill: Palette.purple(0.12), stroke: Palette.purpleSoft, lineWidth: 2.5)

        // Animated moving playback scrubber line
        let scrubFrac = leftBracketFrac + (rightBracketFrac - leftBracketFrac) * (0.5 + 0.5 * sin(Double(t) * 3.5))
        let scrubX = waveBox.minX + 28 + barAreaW * scrubFrac
        c.ctx.saveGState()
        c.ctx.setStrokeColor(Palette.pureWhite.cgColor)
        c.ctx.setLineWidth(2.0)
        c.ctx.move(to: CGPoint(x: scrubX, y: waveBox.minY + 10))
        c.ctx.addLine(to: CGPoint(x: scrubX, y: waveBox.maxY - 10))
        c.ctx.strokePath()
        c.ctx.restoreGState()

        c.drawText("clip.mov  ·  00:04.12 — 00:14.00  ·  Lossless stream cut", at: CGPoint(x: card1.minX + 36, y: card1.maxY - 46), font: fonts.mono(13.5), color: Palette.white(0.60))

        let card2 = CGRect(x: rightX, y: 602, width: 840, height: 364)
        c.drawBox(card2, radius: 24, fill: Palette.surface1, stroke: Palette.white(0.10), lineWidth: 1.5)
        c.drawText("DOCUMENT & IMAGE TOOLKIT", at: CGPoint(x: card2.minX + 36, y: card2.minY + 32), font: fonts.mono(13, semibold: true), color: Palette.purpleSoft, tracking: 1.5)
        c.drawText("Merge, split, OCR, redact & strip EXIF", at: CGPoint(x: card2.minX + 36, y: card2.minY + 64), font: fonts.display(30), color: Palette.pureWhite, tracking: -0.8)

        let toolChips = [
            "Merge PDF", "Split PDF", "Organize Pages", "PDF → DOCX",
            "Local OCR", "Redact Photo", "Strip GPS EXIF", "Resize & Crop",
            "Collage", "Compress", "Watermark", "SHA-256 Verify"
        ]
        for (i, chip) in toolChips.enumerated() {
            let col = i % 4
            let row = i / 4
            let chipP = springPop(prog(t, 0.25 + CGFloat(i) * 0.06, 0.45))
            let cx = card2.minX + 36 + CGFloat(col) * 194
            let cy = card2.minY + 134 + CGFloat(row) * 64 + (1 - chipP) * 12
            let highlight = (i == 0 || i == 4 || i == 5 || i == 6)
            c.drawBox(CGRect(x: cx, y: cy, width: 180, height: 48), radius: 11, fill: highlight ? Palette.purple(0.18 * chipP) : Palette.bgObsidian.withAlphaComponent(chipP), stroke: highlight ? Palette.purple(0.60 * chipP) : Palette.white(0.09 * chipP), lineWidth: 1.3)
            c.drawText(chip, at: CGPoint(x: cx + 90, y: cy + 14), font: fonts.mono(13.5, semibold: highlight), color: (highlight ? Palette.pureWhite : Palette.white(0.75)).withAlphaComponent(chipP), align: .center)
        }
    }

    // MARK: Act 4 (17.5s - 22.8s, dur 5.3s): 176 Local Conversion Routes & Streaming Data Pulses
    private func renderAct4FormatMatrix176(_ c: Canvas, t: CGFloat) {
        c.fillScreen(Palette.bgObsidian)
        let drift = t * 14.0
        c.drawGrid(lineAlpha: 0.03, driftX: drift, driftY: drift * 0.4)
        c.drawRadialSpotlight(cx: 1380, cy: 290, radius: 700, alpha: 0.24)

        let countP = easeOutQuint(prog(t, 0.0, 0.85))
        let countVal = Int(round(176.0 * countP))

        c.drawText("02 / DIRECT CODEC MATRIX", at: CGPoint(x: 110, y: 74), font: fonts.mono(14, semibold: true), color: Palette.purpleSoft, tracking: 2.2)
        c.drawText("\(countVal)", at: CGPoint(x: 110, y: 108), font: fonts.display(142, bold: true), color: Palette.pureWhite, tracking: -6.0)
        c.drawText("local conversion routes.\nEvery codec runs on your machine.", at: CGPoint(x: 410, y: 138), font: fonts.display(46, bold: false), color: Palette.white(0.88), tracking: -1.4)

        let lanes: [(String, String, [String], [String], String)] = [
            ("IMAGES", "65 routes", [".HEIC", ".AVIF", ".WEBP", ".TIFF", ".SVG"], [".PNG", ".JPEG", ".WEBP", ".AVIF", ".PDF"], "ImageIO + Lossless WebP"),
            ("DOCUMENTS", "14 routes", [".PDF", ".TXT", ".PNG", ".JPEG"], [".DOCX", ".PDF", ".TXT", ".PNG"], "PDFKit + Native OCR + DOCX"),
            ("VIDEO & AUDIO", "93 routes", [".MOV", ".MKV", ".WAV", ".FLAC", ".M4A"], [".MP4", ".WEBM", ".MP3", ".OPUS", ".OGG"], "AVFoundation + Local FFmpeg"),
            ("SUBTITLES", "4 routes", [".SRT", ".VTT"], [".VTT", ".SRT", ".TXT"], "Deterministic Cue Parser")
        ]

        for (idx, lane) in lanes.enumerated() {
            let p = easeOutQuint(prog(t, 0.20 + CGFloat(idx) * 0.12, 0.50))
            let y = 316 + CGFloat(idx) * 164 + (1 - p) * 24
            let rowRect = CGRect(x: 110, y: y, width: 1700, height: 142)
            c.drawBox(rowRect, radius: 20, fill: Palette.surface1.withAlphaComponent(p), stroke: Palette.white(0.10 * p), lineWidth: 1.4)

            c.drawText(lane.0, at: CGPoint(x: rowRect.minX + 34, y: rowRect.minY + 34), font: fonts.display(26, bold: true), color: Palette.white(p), tracking: -0.6)
            c.drawText("\(lane.1)  ·  \(lane.4)", at: CGPoint(x: rowRect.minX + 34, y: rowRect.minY + 76), font: fonts.mono(13), color: Palette.white(0.48 * p))

            var sx: CGFloat = rowRect.minX + 430
            for src in lane.2 {
                let cw = c.measureText(src, font: fonts.mono(15, semibold: true)).width + 32
                let cr = CGRect(x: sx, y: rowRect.midY - 22, width: cw, height: 44)
                c.drawBox(cr, radius: 10, fill: Palette.bgObsidian.withAlphaComponent(p), stroke: Palette.white(0.13 * p))
                c.drawText(src, at: CGPoint(x: cr.midX, y: cr.minY + 12), font: fonts.mono(15, semibold: true), color: Palette.white(0.85 * p), align: .center)
                sx += cw + 10
            }

            let arrowX: CGFloat = rowRect.minX + 985
            let pulse = 0.5 + 0.5 * sin((Double(t) * 5.0) - Double(idx) * 0.8)
            c.drawBox(CGRect(x: arrowX, y: rowRect.midY - 19, width: 78, height: 38), radius: 19, fill: Palette.purple((0.18 + 0.14 * CGFloat(pulse)) * p), stroke: Palette.purple(0.65 * p))
            c.drawText("→", at: CGPoint(x: arrowX + 39, y: rowRect.midY - 13), font: fonts.mono(20, semibold: true), color: Palette.purpleSoft(p), align: .center)

            // Streaming glowing data beam pulse traveling through the arrow
            let beamFrac = CGFloat((t * 2.5 + CGFloat(idx) * 0.35).truncatingRemainder(dividingBy: 1.0))
            let beamX = arrowX - 40 + beamFrac * 158
            c.ctx.saveGState()
            c.ctx.setFillColor(Palette.purpleSoft(0.7 * p).cgColor)
            c.ctx.fillEllipse(in: CGRect(x: beamX - 4, y: rowRect.midY - 4, width: 8, height: 8))
            c.ctx.restoreGState()

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

    // MARK: Act 5 (22.8s - 26.2s, dur 3.4s): Pure White Contrast Section — Data Sovereignty ("0.0 KB")
    private func renderAct5WhitePrivacyContrast(_ c: Canvas, t: CGFloat) {
        c.fillScreen(Palette.pureWhite)
        c.drawGrid(lineAlpha: 0.045, darkInk: true)

        let headP = easeOutQuint(prog(t, 0.0, 0.40))
        c.drawText("03 / DATA SOVEREIGNTY", at: CGPoint(x: 110, y: 74 + (1 - headP) * 16), font: fonts.mono(14, semibold: true), color: Palette.purple.withAlphaComponent(headP), tracking: 2.2)
        c.drawText("Your files never take a round-trip.", at: CGPoint(x: 110, y: 108 + (1 - headP) * 16), font: fonts.display(64, bold: true), color: Palette.black(headP), tracking: -2.4)

        let l1P = easeOutQuint(prog(t, 0.15, 0.45))
        let lane1 = CGRect(x: 110, y: 228 + (1 - l1P) * 18, width: 1700, height: 256)
        c.drawBox(lane1, radius: 24, fill: Palette.black(0.025 * l1P), stroke: Palette.black(0.12 * l1P), lineWidth: 1.5)
        c.drawText("OTHER CONVERTERS  —  YOUR FILE → THEIR CLOUD SERVER", at: CGPoint(x: lane1.minX + 38, y: lane1.minY + 26), font: fonts.mono(13.5, semibold: true), color: Palette.black(0.50 * l1P), tracking: 1.2)

        let n1 = CGRect(x: lane1.minX + 38, y: lane1.minY + 78, width: 410, height: 132)
        let n2 = CGRect(x: lane1.minX + 610, y: lane1.minY + 78, width: 480, height: 132)
        let n3 = CGRect(x: lane1.minX + 1252, y: lane1.minY + 78, width: 410, height: 132)

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

        // Docyo Local Vault
        let l2P = easeOutQuint(prog(t, 0.45, 0.50))
        let vault = CGRect(x: 110, y: 518 + (1 - l2P) * 22, width: 1230, height: 446)
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

        let d1 = CGRect(x: vault.minX + 36, y: vault.minY + 118, width: 340, height: 184)
        let d2 = CGRect(x: vault.minX + 436, y: vault.minY + 118, width: 358, height: 184)
        let d3 = CGRect(x: vault.minX + 854, y: vault.minY + 118, width: 340, height: 184)

        c.drawBox(d1, radius: 18, fill: Palette.black(0.03 * l2P), stroke: Palette.black(0.14 * l2P))
        c.drawText("READ-ONLY FD", at: CGPoint(x: d1.minX + 24, y: d1.minY + 26), font: fonts.mono(12, semibold: true), color: Palette.black(0.50 * l2P))
        c.drawText("tax-return.pdf", at: CGPoint(x: d1.minX + 24, y: d1.minY + 66), font: fonts.mono(21, semibold: true), color: Palette.black(l2P))
        c.drawText("Original untouched", at: CGPoint(x: d1.minX + 24, y: d1.minY + 116), font: fonts.sans(16, medium: true), color: Palette.black(0.62 * l2P))

        c.drawText("→", at: CGPoint(x: d1.maxX + 30, y: d1.midY - 18), font: fonts.mono(28, semibold: true), color: Palette.purple.withAlphaComponent(l2P), align: .center)

        c.drawBox(d2, radius: 18, fill: Palette.purple(0.09 * l2P), stroke: Palette.purple(0.55 * l2P), lineWidth: 2.0)
        c.drawImage(avatar, in: CGRect(x: d2.maxX - 58, y: d2.minY + 20, width: 38, height: 38), alpha: l2P)
        c.drawText("APPLE SILICON / x64", at: CGPoint(x: d2.minX + 24, y: d2.minY + 26), font: fonts.mono(12, semibold: true), color: Palette.purpleDeep.withAlphaComponent(l2P))
        c.drawText("Docyo Native Engine", at: CGPoint(x: d2.minX + 24, y: d2.minY + 66), font: fonts.display(24, bold: true), color: Palette.black(l2P))
        c.drawText(".docyo-stage → atomic commit", at: CGPoint(x: d2.minX + 24, y: d2.minY + 116), font: fonts.mono(13.5, semibold: true), color: Palette.purpleDeep.withAlphaComponent(l2P))

        c.drawText("→", at: CGPoint(x: d2.maxX + 30, y: d2.midY - 18), font: fonts.mono(28, semibold: true), color: Palette.purple.withAlphaComponent(l2P), align: .center)

        c.drawBox(d3, radius: 18, fill: Palette.bgObsidian.withAlphaComponent(l2P), stroke: Palette.bgObsidian.withAlphaComponent(l2P))
        c.drawText("SIBLING OUTPUT", at: CGPoint(x: d3.minX + 24, y: d3.minY + 26), font: fonts.mono(12, semibold: true), color: Palette.purpleSoft(l2P))
        c.drawText("tax-return.docx", at: CGPoint(x: d3.minX + 24, y: d3.minY + 66), font: fonts.mono(21, semibold: true), color: Palette.white(l2P))
        c.drawText("Ready in same folder ✓", at: CGPoint(x: d3.minX + 24, y: d3.minY + 116), font: fonts.sans(16, medium: true), color: Palette.white(0.75 * l2P))

        c.drawText(
            "READ_ONLY_FD   ·   ATOMIC_COMMIT   ·   COLLISION_SAFE   ·   SHELL_SAFE_ARGV",
            at: CGPoint(x: vault.minX + 36, y: vault.maxY - 58),
            font: fonts.mono(13.5, semibold: true),
            color: Palette.black(0.55 * l2P),
            tracking: 1.0
        )

        // 0.0 KB Card
        let zeroP = springPop(prog(t, 0.70, 0.55))
        let zeroCard = CGRect(x: 1372, y: 518, width: 438, height: 446)
        c.drawBox(zeroCard, radius: 26, fill: Palette.bgObsidian.withAlphaComponent(clamp(zeroP)), stroke: Palette.purple.withAlphaComponent(clamp(zeroP)), lineWidth: 2.5)
        c.drawText("EXTERNAL NETWORK", at: CGPoint(x: zeroCard.minX + 36, y: zeroCard.minY + 38), font: fonts.mono(13, semibold: true), color: Palette.purpleSoft(clamp(zeroP)), tracking: 1.6)
        c.drawText("0.0 KB", at: CGPoint(x: zeroCard.minX + 36, y: zeroCard.minY + 114), font: fonts.display(100, bold: true), color: Palette.white(clamp(zeroP)), tracking: -4.0)
        c.drawText("Crosses the network.\nWorks on an airplane\nwith Wi-Fi turned off.", at: CGPoint(x: zeroCard.minX + 36, y: zeroCard.minY + 252), font: fonts.sans(22, medium: true), color: Palette.white(0.75 * clamp(zeroP)))
    }

    // MARK: Act 6 (26.2s - 30.0s, dur 3.8s): Finale & Direct Download CTA
    private func renderAct6FinaleCTA(_ c: Canvas, t: CGFloat) {
        c.fillScreen(Palette.bgObsidian)
        let drift = t * 10.0
        c.drawGrid(lineAlpha: 0.032, driftX: drift, driftY: drift * 0.4)

        let enter = easeOutQuint(prog(t, 0.0, 0.60))
        let pop = springPop(prog(t, 0.05, 0.65))

        // Gentle floating mascot hover physics
        let mascotHoverY = sin(Double(t) * 2.2) * 5.0
        c.drawRadialSpotlight(cx: 960, cy: 400, radius: 780, alpha: 0.30 * enter)

        c.drawLogoSquircle(
            center: CGPoint(x: 960, y: 242 + CGFloat(mascotHoverY)),
            size: 168,
            scale: 0.76 + 0.24 * pop,
            alpha: enter,
            glowAlpha: 0.36
        )

        let hP = easeOutQuint(prog(t, 0.20, 0.55))
        let fHero = fonts.display(102, bold: true)
        let p1 = "Drag. "
        let p2 = "Hold Shift. "
        let p3 = "Convert."
        let s1 = c.measureText(p1, font: fHero, tracking: -3.5)
        let s2 = c.measureText(p2, font: fHero, tracking: -3.5)
        let s3 = c.measureText(p3, font: fHero, tracking: -3.5)
        let tot = s1.width + s2.width + s3.width
        let hx = 960 - tot / 2
        let hy = 368 + (1 - hP) * 24

        c.drawText(p1, at: CGPoint(x: hx, y: hy), font: fHero, color: Palette.white(hP), tracking: -3.5)
        c.drawText(p2, at: CGPoint(x: hx + s1.width, y: hy), font: fHero, color: Palette.purpleSoft(hP), tracking: -3.5)
        c.drawText(p3, at: CGPoint(x: hx + s1.width + s2.width, y: hy), font: fHero, color: Palette.white(hP), tracking: -3.5)

        let subP = easeOutQuint(prog(t, 0.45, 0.50))
        c.drawText(
            "macOS Native (.dmg)   ·   Windows 10/11   ·   Linux x64   ·   100% Open Source (GPL-3.0)",
            at: CGPoint(x: 960, y: 510 + (1 - subP) * 16),
            font: fonts.mono(18, semibold: false),
            color: Palette.white(0.66 * subP),
            tracking: 0.4,
            align: .center
        )

        let ctaP = springPop(prog(t, 0.95, 0.60))
        let ctaA = easeOutQuint(prog(t, 0.95, 0.40))
        if ctaA > 0.01 {
            let bw: CGFloat = 660 * (0.9 + 0.1 * ctaP)
            let bh: CGFloat = 78
            let btnRect = CGRect(x: 960 - bw / 2, y: 594, width: bw, height: bh)
            c.drawBox(btnRect, radius: 20, fill: Palette.purple.withAlphaComponent(ctaA), stroke: Palette.purpleSoft.withAlphaComponent(ctaA), lineWidth: 2.0, shadowAlpha: 0.65 * ctaA, shadowBlur: 40, shadowY: 14)

            // Animated light sheen shimmer gliding across button
            let shimmerFrac = CGFloat((t * 0.9).truncatingRemainder(dividingBy: 1.0))
            let shimmerX = btnRect.minX - 100 + shimmerFrac * (btnRect.width + 200)
            c.ctx.saveGState()
            c.ctx.addPath(c.roundedRectPath(btnRect, radius: 20))
            c.ctx.clip()
            let sheenGrad = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB)!, colors: [Palette.white(0).cgColor, Palette.white(0.28 * ctaA).cgColor, Palette.white(0).cgColor] as CFArray, locations: [0.0, 0.5, 1.0])!
            c.ctx.drawLinearGradient(sheenGrad, start: CGPoint(x: shimmerX - 60, y: btnRect.minY), end: CGPoint(x: shimmerX + 60, y: btnRect.maxY), options: [])
            c.ctx.restoreGState()

            c.drawText("Download Docyo Free  ·  github.com/subhashmalik0001/Docyo", at: CGPoint(x: 960, y: btnRect.minY + 25), font: fonts.mono(17, semibold: true), color: Palette.white(ctaA), tracking: 0.2, align: .center)
        }

        let trP = easeOutQuint(prog(t, 1.25, 0.50))
        c.drawText(
            "NO ACCOUNTS     ·     NO UPLOADS     ·     NO TELEMETRY     ·     MADE BY SUBHASH MALIK",
            at: CGPoint(x: 960, y: 734 + (1 - trP) * 12),
            font: fonts.mono(13.5, semibold: true),
            color: Palette.white(0.42 * trP),
            tracking: 2.2,
            align: .center
        )
    }

    private func drawSceneTransitionOverlay(_ c: Canvas, globalT t: CGFloat) {
        let cutPoints: [CGFloat] = [3.80, 12.00, 17.50, 22.80, 26.20]
        var flashAlpha: CGFloat = 0
        for cp in cutPoints {
            let dist = abs(t - cp)
            if dist < 0.12 {
                flashAlpha = max(flashAlpha, (1.0 - dist / 0.12) * 0.65)
            }
        }
        if t < 0.22 {
            flashAlpha = max(flashAlpha, 1.0 - t / 0.22)
        }
        if t > 29.50 {
            flashAlpha = max(flashAlpha, (t - 29.50) / 0.50)
        }
        if flashAlpha > 0.005 {
            c.fillScreen(Palette.bgObsidian.withAlphaComponent(clamp(flashAlpha)))
        }
    }
}

// MARK: - Concurrent Deadlock-Free AVAssetWriter MP4 Muxer (Video 1080p60 + Master Audio 48kHz Stereo)

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

    static func extractWAVPCM(from wavURL: URL) throws -> Data {
        let raw = try Data(contentsOf: wavURL)
        let tag = Data("data".utf8)
        if let range = raw.range(of: tag), range.upperBound + 4 <= raw.count {
            return raw.subdata(in: (range.upperBound + 4)..<raw.count)
        }
        return raw.subdata(in: 44..<raw.count)
    }

    static func main() throws {
        let cwd = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
        var outPath = cwd.appendingPathComponent("website/public/docyo-launch.mp4").path
        var audioWavPath = "/tmp/docyo-master-audio.wav"
        var previewDir: String? = nil

        var idx = 1
        let args = CommandLine.arguments
        while idx < args.count {
            if args[idx] == "--out", idx + 1 < args.count {
                outPath = args[idx + 1]
                idx += 2
            } else if args[idx] == "--audio", idx + 1 < args.count {
                audioWavPath = args[idx + 1]
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

        let pcmData = try extractWAVPCM(from: URL(fileURLWithPath: audioWavPath))
        let totalAudioSamples = pcmData.count / 4 // 16-bit stereo = 4 bytes per frame

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
        writer.shouldOptimizeForNetworkUse = true

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

        guard writer.startWriting() else {
            fatalError("AVAssetWriter failed to start: \(String(describing: writer.error))")
        }
        writer.startSession(atSourceTime: .zero)

        let previewKeyframes: [Int: String] = [
            Int(1.00 * Double(fps)):  "01_cold_open.png",
            Int(3.00 * Double(fps)):  "02_brand_reveal.png",
            Int(7.00 * Double(fps)):  "03_radial_wheel_drag.png",
            Int(10.50 * Double(fps)): "04_notch_success.png",
            Int(15.00 * Double(fps)): "05_modifier_tools.png",
            Int(20.00 * Double(fps)): "06_routes_176.png",
            Int(24.50 * Double(fps)): "07_white_privacy.png",
            Int(28.00 * Double(fps)): "08_finale_cta.png"
        ]

        let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
        print("Encoding \(totalFrames) 1080p60 video frames + \(totalAudioSamples) 48kHz stereo interactive audio samples...")

        let group = DispatchGroup()
        let videoQueue = DispatchQueue(label: "com.docyo.render.video")
        let audioQueue = DispatchQueue(label: "com.docyo.render.audio")

        var currentFrame = 0
        var videoFinished = false
        group.enter()
        vInput.requestMediaDataWhenReady(on: videoQueue) {
            while vInput.isReadyForMoreMediaData && !videoFinished {
                if currentFrame >= totalFrames {
                    videoFinished = true
                    vInput.markAsFinished()
                    group.leave()
                    break
                }
                autoreleasepool {
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
                        let tSec = Double(currentFrame) / Double(fps)
                        director.renderFrame(time: tSec, into: ctx)
                    }
                    CVPixelBufferUnlockBaseAddress(pb, [])

                    let pts = CMTime(value: CMTimeValue(currentFrame), timescale: CMTimeScale(fps))
                    adaptor.append(pb, withPresentationTime: pts)

                    if let pDir = previewDir, let name = previewKeyframes[currentFrame] {
                        try? savePNG(from: pb, to: URL(fileURLWithPath: pDir).appendingPathComponent(name))
                    }
                }
                currentFrame += 1
            }
        }

        var audioOffset = 0
        var audioFinished = false
        let chunkFrames = 4096
        group.enter()
        aInput.requestMediaDataWhenReady(on: audioQueue) {
            while aInput.isReadyForMoreMediaData && !audioFinished {
                if audioOffset >= totalAudioSamples {
                    audioFinished = true
                    aInput.markAsFinished()
                    group.leave()
                    break
                }
                let framesThisChunk = min(chunkFrames, totalAudioSamples - audioOffset)
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
                pcmData.withUnsafeBytes { rawBuf in
                    let base = rawBuf.baseAddress!.advanced(by: audioOffset * 4)
                    _ = CMBlockBufferReplaceDataBytes(
                        with: base,
                        blockBuffer: blockBuf!,
                        offsetIntoDestination: 0,
                        dataLength: byteCount
                    )
                }

                var timing = CMSampleTimingInfo(
                    duration: CMTime(value: 1, timescale: 48_000),
                    presentationTimeStamp: CMTime(value: CMTimeValue(audioOffset), timescale: 48_000),
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
                audioOffset += framesThisChunk
            }
        }

        group.wait()

        let finishSem = DispatchSemaphore(value: 0)
        writer.finishWriting {
            finishSem.signal()
        }
        finishSem.wait()

        guard writer.status == .completed else {
            fatalError("Video writing failed: \(String(describing: writer.error))")
        }
        print("✓ Rendered 30.0s Launch Film with interactive audio & dynamic motion: \(outURL.path)")
    }
}

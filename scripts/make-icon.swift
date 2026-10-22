import AppKit

@main struct MakeIcon {
    static func main() throws {
        let root = URL(fileURLWithPath: CommandLine.arguments[1])
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        var master512: Data?
        for points in [16, 32, 128, 256, 512] {
            for scale in [1, 2] {
                let pixels = points * scale
                let image = BrandArtwork.image(size: CGFloat(pixels))
                var rect = CGRect(x: 0, y: 0, width: pixels, height: pixels)
                guard let cg = image.cgImage(forProposedRect: &rect, context: nil, hints: nil) else { fatalError("Icon rendering failed") }
                let data = NSBitmapImageRep(cgImage: cg).representation(using: .png, properties: [:])!
                let filename = "icon_\(points)x\(points)\(scale == 2 ? "@2x" : "").png"
                try data.write(to: root.appendingPathComponent(filename))
                if points == 256 && scale == 2 {
                    master512 = data
                }
            }
        }
        if CommandLine.arguments.count > 2, let master512 = master512 {
            let desktopIconPath = URL(fileURLWithPath: CommandLine.arguments[2])
            try master512.write(to: desktopIconPath)
        }
        if CommandLine.arguments.count > 3, let master512 = master512 {
            let socialIconPath = URL(fileURLWithPath: CommandLine.arguments[3])
            try master512.write(to: socialIconPath)
        }
    }
}

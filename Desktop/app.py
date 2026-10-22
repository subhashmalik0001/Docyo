"""Docyo desktop edition for Windows and Linux."""
import sys
# Worker never imports Qt, creates a window or recursively starts the app.
if '--worker' in sys.argv:
    from engine import worker_main
    raise SystemExit(worker_main())

import os, math, threading
from pathlib import Path
from PySide6.QtCore import Qt, QPointF, QRectF, Signal, QTimer, QUrl, QSettings, QThread
from PySide6.QtGui import (QPainter, QBrush, QPen, QColor, QRadialGradient,
                           QPainterPath, QFont, QPixmap, QIcon, QDesktopServices)
from PySide6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout,
                             QHBoxLayout, QLabel, QPushButton, QFileDialog,
                             QComboBox, QListWidget, QProgressBar, QSpinBox,
                             QMessageBox, QAbstractItemView, QTabWidget)
from engine import VERSION, OPERATIONS, source_file
from runner import run_job, Cancelled

WEBSITE = 'https://subhashmalik0001.github.io/Docyo/'

def get_asset_path(filename: str) -> Path:
    """Resolve asset paths in source directory and PyInstaller frozen bundle."""
    if getattr(sys, 'frozen', False):
        base = Path(getattr(sys, '_MEIPASS', sys.executable))
        if base.is_file():
            base = base.parent
        cand = base / filename
        if cand.exists():
            return cand
    cand = Path(__file__).resolve().parent / filename
    return cand

class Batch(QThread):
    result = Signal(int, str, list)
    progress = Signal(int, int)
    def __init__(self, paths, target, options):
        super().__init__()
        self.paths = paths
        self.target = target
        self.options = options
        self.cancel = threading.Event()
    def run(self):
        try:
            groups = [self.paths] if self.target == 'Merge PDFs' else [[p] for p in self.paths]
            for i, paths in enumerate(groups):
                if self.cancel.is_set():
                    break
                try:
                    outputs = run_job(dict(paths=paths, target=self.target, **self.options), self.cancel)
                    self.result.emit(i, 'Done', outputs)
                except Cancelled as e:
                    self.result.emit(i, str(e), [])
                    break
                except Exception as e:
                    self.result.emit(i, str(e), [])
                self.progress.emit(i + 1, len(groups))
        except Exception as e:
            self.result.emit(0, f'Unexpected error: {e}', [])

class DropList(QListWidget):
    files = Signal(list)
    def __init__(self):
        super().__init__()
        self.setAcceptDrops(True)
        self.setSelectionMode(QAbstractItemView.ExtendedSelection)
        self.setMinimumHeight(190)
    def dragEnterEvent(self, event):
        if event.mimeData().hasUrls() and all(u.isLocalFile() for u in event.mimeData().urls()):
            self.setStyleSheet('border:2px solid #7b5cff; background:#1e1a33;')
            event.acceptProposedAction()
        else:
            event.ignore()
    def dragMoveEvent(self, event):
        self.dragEnterEvent(event)
    def dragLeaveEvent(self, event):
        self.setStyleSheet('')
        event.accept()
    def dropEvent(self, event):
        self.setStyleSheet('')
        if event.mimeData().hasUrls() and all(u.isLocalFile() for u in event.mimeData().urls()):
            self.files.emit([u.toLocalFile() for u in event.mimeData().urls()])
            event.acceptProposedAction()
        else:
            event.ignore()

class RadialWheelWidget(QWidget):
    slice_clicked = Signal(str)
    slice_dropped = Signal(str, list)
    avatar_clicked = Signal()

    SLICES = [
        ("PNG", "IMAGE"),
        ("JPEG", "IMAGE"),
        ("WEBP", "IMAGE"),
        ("PDF", "DOCUMENT"),
        ("Merge PDFs", "DOCUMENT"),
        ("MP4", "VIDEO"),
        ("MP3", "AUDIO"),
        ("Extract text", "DOCUMENT"),
    ]

    def __init__(self, parent=None, wheel_radius=150, inner_radius=56):
        super().__init__(parent)
        self.wheel_radius = wheel_radius
        self.inner_radius = inner_radius
        self.highlighted = -1
        self.selected_target = "PNG"
        self.center_hovered = False
        self.setAcceptDrops(True)
        self.setMouseTracking(True)
        size = int((wheel_radius + 20) * 2)
        self.setMinimumSize(size, size)

        avatar_path = get_asset_path('avatar.png')
        self.avatar_pixmap = QPixmap(str(avatar_path)) if avatar_path.exists() else None

    def set_selected_target(self, target: str):
        self.selected_target = target
        self.update()

    def _hit_test(self, pos):
        w, h = self.width(), self.height()
        cx, cy = w / 2.0, h / 2.0
        dx = pos.x() - cx
        dy = pos.y() - cy
        dist = math.hypot(dx, dy)
        if dist < self.inner_radius:
            return ('center', None)
        if self.inner_radius <= dist <= self.wheel_radius:
            theta = math.degrees(math.atan2(-dy, dx)) % 360
            deg_cw = (90 - theta) % 360
            n = len(self.SLICES)
            angle_step = 360.0 / n
            slice_idx = int((deg_cw + angle_step / 2.0) / angle_step) % n
            return ('slice', slice_idx)
        return (None, None)

    def mouseMoveEvent(self, event):
        kind, idx = self._hit_test(event.position().toPoint())
        old_hl = self.highlighted
        old_ch = self.center_hovered
        if kind == 'center':
            self.center_hovered = True
            self.highlighted = -1
            self.setCursor(Qt.PointingHandCursor)
        elif kind == 'slice':
            self.center_hovered = False
            self.highlighted = idx
            self.setCursor(Qt.PointingHandCursor)
        else:
            self.center_hovered = False
            self.highlighted = -1
            self.setCursor(Qt.ArrowCursor)
        if old_hl != self.highlighted or old_ch != self.center_hovered:
            self.update()

    def leaveEvent(self, event):
        self.highlighted = -1
        self.center_hovered = False
        self.setCursor(Qt.ArrowCursor)
        self.update()

    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton:
            kind, idx = self._hit_test(event.position().toPoint())
            if kind == 'center':
                self.avatar_clicked.emit()
            elif kind == 'slice' and 0 <= idx < len(self.SLICES):
                target_name = self.SLICES[idx][0]
                self.slice_clicked.emit(target_name)

    def dragEnterEvent(self, event):
        if event.mimeData().hasUrls() and all(u.isLocalFile() for u in event.mimeData().urls()):
            event.acceptProposedAction()
            self._update_drag_hover(event.position().toPoint())
        else:
            event.ignore()

    def dragMoveEvent(self, event):
        if event.mimeData().hasUrls() and all(u.isLocalFile() for u in event.mimeData().urls()):
            event.acceptProposedAction()
            self._update_drag_hover(event.position().toPoint())
        else:
            event.ignore()

    def dragLeaveEvent(self, event):
        self.highlighted = -1
        self.center_hovered = False
        self.update()
        event.accept()

    def _update_drag_hover(self, pos):
        kind, idx = self._hit_test(pos)
        if kind == 'center':
            self.center_hovered = True
            self.highlighted = -1
        elif kind == 'slice':
            self.center_hovered = False
            self.highlighted = idx
        else:
            self.center_hovered = False
            self.highlighted = -1
        self.update()

    def dropEvent(self, event):
        pos = event.position().toPoint()
        kind, idx = self._hit_test(pos)
        self.highlighted = -1
        self.center_hovered = False
        self.update()
        if event.mimeData().hasUrls() and all(u.isLocalFile() for u in event.mimeData().urls()):
            paths = [u.toLocalFile() for u in event.mimeData().urls()]
            if kind == 'slice' and 0 <= idx < len(self.SLICES):
                target_name = self.SLICES[idx][0]
                self.slice_dropped.emit(target_name, paths)
            else:
                self.slice_dropped.emit(self.selected_target, paths)
            event.acceptProposedAction()
        else:
            event.ignore()

    def paintEvent(self, event):
        p = QPainter(self)
        p.setRenderHint(QPainter.Antialiasing)
        p.setRenderHint(QPainter.TextAntialiasing)
        w, h = self.width(), self.height()
        center = QPointF(w / 2.0, h / 2.0)
        radius = self.wheel_radius
        inner_radius = self.inner_radius
        n = len(self.SLICES)
        angle_step = 360.0 / n

        # Deep glowing outer gradient
        bg_grad = QRadialGradient(center, radius + 12)
        bg_grad.setColorAt(0, QColor(24, 21, 38, 255))
        bg_grad.setColorAt(0.65, QColor(15, 13, 24, 255))
        bg_grad.setColorAt(1, QColor(8, 7, 14, 255))
        p.setBrush(QBrush(bg_grad))
        p.setPen(QPen(QColor(123, 92, 255, 70), 1.5))
        p.drawEllipse(center, radius + 6, radius + 6)

        rect = QRectF(center.x() - radius, center.y() - radius, radius * 2, radius * 2)
        inner_rect = QRectF(center.x() - inner_radius, center.y() - inner_radius, inner_radius * 2, inner_radius * 2)

        for i, (name, cat) in enumerate(self.SLICES):
            center_deg_cw = i * angle_step
            theta_c = (90 - center_deg_cw) % 360
            start_angle = theta_c - angle_step / 2.0

            path = QPainterPath()
            path.arcMoveTo(rect, start_angle)
            path.arcTo(rect, start_angle, angle_step)
            path.arcTo(inner_rect, start_angle + angle_step, -angle_step)
            path.closeSubpath()

            is_hl = (i == self.highlighted)
            is_sel = (name == self.selected_target)

            if is_hl:
                p.setBrush(QBrush(QColor(123, 92, 255, 210)))
                p.setPen(QPen(QColor(255, 255, 255, 240), 1.5))
            elif is_sel:
                p.setBrush(QBrush(QColor(123, 92, 255, 100)))
                p.setPen(QPen(QColor(154, 130, 255, 220), 1.5))
            else:
                p.setBrush(QBrush(QColor(28, 25, 42, 175)))
                p.setPen(QPen(QColor(255, 255, 255, 25), 1))
            p.drawPath(path)

            rad = math.radians(theta_c)
            text_r = (radius + inner_radius) / 2.0
            tx = center.x() + text_r * math.cos(rad)
            ty = center.y() - text_r * math.sin(rad)

            font = QFont('Segoe UI', 9)
            font.setBold(is_hl or is_sel)
            p.setFont(font)
            p.setPen(QColor(255, 255, 255) if (is_hl or is_sel) else QColor(220, 215, 235))
            p.drawText(QRectF(tx - 40, ty - 14, 80, 16), Qt.AlignCenter, name)

            font_sub = QFont('Segoe UI', 6)
            font_sub.setBold(False)
            p.setFont(font_sub)
            p.setPen(QColor(240, 235, 255, 200) if (is_hl or is_sel) else QColor(140, 135, 160))
            p.drawText(QRectF(tx - 40, ty + 2, 80, 12), Qt.AlignCenter, cat)

        # Center disc
        if self.center_hovered:
            p.setPen(QPen(QColor(154, 130, 255, 255), 3))
            p.setBrush(QBrush(QColor(32, 28, 52)))
        else:
            p.setPen(QPen(QColor(123, 92, 255, 180), 2.5))
            p.setBrush(QBrush(QColor(18, 16, 28)))
        p.drawEllipse(center, inner_radius - 2, inner_radius - 2)

        # Avatar vinyl toy graphic
        if self.avatar_pixmap and not self.avatar_pixmap.isNull():
            avatar_w = (inner_radius - 8) * 1.4
            avatar_rect = QRectF(center.x() - avatar_w / 2, center.y() - avatar_w / 2, avatar_w, avatar_w)
            p.drawPixmap(avatar_rect.toRect(), self.avatar_pixmap)

        p.end()

class FloatingRadialWheelWindow(QWidget):
    def __init__(self, main_window):
        super().__init__(None, Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint | Qt.Tool)
        self.setAttribute(Qt.WA_TranslucentBackground, True)
        self.main_window = main_window
        self.drag_position = None

        layout = QVBoxLayout(self)
        layout.setContentsMargins(10, 10, 10, 10)
        layout.setSpacing(6)

        header = QWidget()
        header.setStyleSheet("background: rgba(22, 19, 36, 235); border-radius: 12px; border: 1px solid rgba(123, 92, 255, 90);")
        h_layout = QHBoxLayout(header)
        h_layout.setContentsMargins(12, 4, 8, 4)

        title = QLabel("Docyo • Companion Wheel")
        title.setStyleSheet("font-size: 11px; font-weight: bold; color: #d0c8f5;")
        h_layout.addWidget(title)
        h_layout.addStretch()

        close_btn = QPushButton("✕")
        close_btn.setFixedSize(20, 20)
        close_btn.setCursor(Qt.PointingHandCursor)
        close_btn.setStyleSheet("background: transparent; color: #a59ac8; border: none; font-weight: bold; font-size: 12px;")
        close_btn.clicked.connect(self.hide)
        h_layout.addWidget(close_btn)

        layout.addWidget(header)

        self.wheel = RadialWheelWidget(self, wheel_radius=130, inner_radius=50)
        self.wheel.slice_clicked.connect(self._on_slice_clicked)
        self.wheel.slice_dropped.connect(self._on_slice_dropped)
        self.wheel.avatar_clicked.connect(self.main_window.open_avatar_studio)
        layout.addWidget(self.wheel, 0, Qt.AlignCenter)

        self.resize(320, 360)

    def _on_slice_clicked(self, target_name):
        self.main_window.on_wheel_slice_clicked(target_name)
        self.main_window.show()
        self.main_window.raise_()
        self.main_window.activateWindow()

    def _on_slice_dropped(self, target_name, paths):
        self.main_window.on_wheel_slice_dropped(target_name, paths)
        self.main_window.show()
        self.main_window.raise_()
        self.main_window.activateWindow()

    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton:
            self.drag_position = event.globalPosition().toPoint() - self.frameGeometry().topLeft()
            event.accept()

    def mouseMoveEvent(self, event):
        if event.buttons() == Qt.LeftButton and self.drag_position is not None:
            self.move(event.globalPosition().toPoint() - self.drag_position)
            event.accept()

class Window(QMainWindow):
    def __init__(self):
        super().__init__()
        self.paths = []
        self.outputs = []
        self.batch = None
        self.floating_wheel = None
        self.settings = QSettings('Docyo', 'Docyo Desktop')
        self.setWindowTitle('Docyo · Universal Media Suite')
        self.resize(840, 720)

        icon = get_asset_path('icon.png')
        if icon.exists():
            self.setWindowIcon(QIcon(str(icon)))

        box = QWidget()
        self.setCentralWidget(box)
        layout = QVBoxLayout(box)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(12)

        # Header with Grape Penguin Avatar and Title
        header_row = QHBoxLayout()
        header_row.setSpacing(14)
        avatar_img_path = get_asset_path('avatar.png')
        if avatar_img_path.exists():
            avatar_lbl = QLabel()
            pix = QPixmap(str(avatar_img_path)).scaled(42, 42, Qt.KeepAspectRatio, Qt.SmoothTransformation)
            avatar_lbl.setPixmap(pix)
            avatar_lbl.setFixedSize(42, 42)
            avatar_lbl.setStyleSheet("border-radius: 21px; border: 2px solid #7b5cff;")
            header_row.addWidget(avatar_lbl)

        title_box = QVBoxLayout()
        title_box.setSpacing(2)
        title = QLabel('Docyo')
        title.setStyleSheet('font-size: 24px; font-weight: bold; color: #ffffff;')
        subtitle = QLabel('Universal Media Suite • Windows Edition')
        subtitle.setStyleSheet('font-size: 12px; color: #a59ac8;')
        title_box.addWidget(title)
        title_box.addWidget(subtitle)
        header_row.addLayout(title_box)

        header_row.addStretch()

        self.btn_floating = QPushButton('🎡 Floating Wheel')
        self.btn_floating.setToolTip('Open always-on-top companion wheel on desktop')
        self.btn_floating.clicked.connect(self.open_floating_wheel)
        header_row.addWidget(self.btn_floating)

        self.btn_avatar = QPushButton('🌟 3D Avatar')
        self.btn_avatar.setToolTip('Launch interactive 3D Grape Penguin studio')
        self.btn_avatar.clicked.connect(self.open_avatar_studio)
        header_row.addWidget(self.btn_avatar)

        self.btn_limits = QPushButton('Supported features')
        self.btn_limits.clicked.connect(self.show_limits)
        header_row.addWidget(self.btn_limits)

        layout.addLayout(header_row)

        # Tabs for Radial Wheel & Batch Queue
        self.tabs = QTabWidget()
        layout.addWidget(self.tabs, 1)

        # Tab 1: Radial Wheel
        tab_wheel = QWidget()
        wheel_layout = QVBoxLayout(tab_wheel)
        wheel_layout.setContentsMargins(10, 10, 10, 10)
        wheel_layout.setSpacing(8)

        wheel_hint = QLabel('Drop files onto any format wedge for instant conversion, or click a wedge to select.')
        wheel_hint.setStyleSheet('color: #b0a6d6; font-size: 12px; text-align: center;')
        wheel_hint.setAlignment(Qt.AlignCenter)
        wheel_layout.addWidget(wheel_hint)

        self.wheel = RadialWheelWidget(wheel_radius=150, inner_radius=56)
        self.wheel.slice_clicked.connect(self.on_wheel_slice_clicked)
        self.wheel.slice_dropped.connect(self.on_wheel_slice_dropped)
        self.wheel.avatar_clicked.connect(self.open_avatar_studio)
        wheel_layout.addWidget(self.wheel, 1, Qt.AlignCenter)

        self.tabs.addTab(tab_wheel, '🎡 Radial Converter')

        # Tab 2: Batch Queue
        tab_queue = QWidget()
        queue_layout = QVBoxLayout(tab_queue)
        queue_layout.setContentsMargins(10, 10, 10, 10)
        queue_layout.setSpacing(8)

        queue_hint = QLabel('Drop files into the queue below to process multiple items with rich tracking.')
        queue_hint.setStyleSheet('color: #b0a6d6; font-size: 12px;')
        queue_layout.addWidget(queue_hint)

        self.list = DropList()
        self.list.files.connect(self.add_paths)
        queue_layout.addWidget(self.list, 1)

        self.tabs.addTab(tab_queue, '📋 Batch Queue')

        # Row: Target selection and options
        row_opts = QHBoxLayout()
        row_opts.setSpacing(10)
        row_opts.addWidget(QLabel('Target format:'))
        self.target = QComboBox()
        self.target.addItems(OPERATIONS)
        row_opts.addWidget(self.target, 1)

        self.width = QSpinBox()
        self.width.setRange(0, 10000)
        self.width.setSpecialValueText('Original size')
        self.width.setSuffix(' px max side')
        self.width.setAccessibleName('Maximum image side in pixels')
        row_opts.addWidget(self.width)

        self.rotate = QComboBox()
        self.rotate.addItems(['No rotation', '90° clockwise', '180°', '270° clockwise'])
        row_opts.addWidget(self.rotate)

        self.folder = QPushButton('Save beside originals')
        self.folder.clicked.connect(self.choose_folder)
        row_opts.addWidget(self.folder)
        layout.addLayout(row_opts)

        self.output = ''
        self.target.currentTextChanged.connect(self.update_options)

        # Row: Conversion Actions
        row_actions = QHBoxLayout()
        row_actions.setSpacing(10)
        self.add = QPushButton('Add files…')
        self.add.clicked.connect(self.pick)
        row_actions.addWidget(self.add)

        self.clear = QPushButton('Clear')
        self.clear.clicked.connect(self.clear_files)
        row_actions.addWidget(self.clear)

        self.convert = QPushButton('Convert files')
        self.convert.setStyleSheet('background:#7b5cff;color:#ffffff;font-weight:bold;padding:10px 18px;border-radius:8px;')
        self.convert.clicked.connect(self.start)
        row_actions.addWidget(self.convert)

        self.cancel = QPushButton('Cancel')
        self.cancel.setEnabled(False)
        self.cancel.clicked.connect(self.cancel_batch)
        row_actions.addWidget(self.cancel)

        self.open = QPushButton('Open output folder')
        self.open.setEnabled(False)
        self.open.clicked.connect(self.open_output)
        row_actions.addWidget(self.open)
        layout.addLayout(row_actions)

        # Progress and status
        self.progress = QProgressBar()
        self.progress.setValue(0)
        layout.addWidget(self.progress)

        self.status = QLabel('Ready. Up to 100 files per batch; 100 MiB per input.')
        self.status.setWordWrap(True)
        self.status.setTextFormat(Qt.PlainText)
        layout.addWidget(self.status)

        # Bottom info bar
        bottom_row = QHBoxLayout()
        bottom_row.addWidget(QLabel(f'Docyo · GPL-3.0-only · v{VERSION} · Local-first processing'))
        bottom_row.addStretch()
        ff = QPushButton('Set FFmpeg…')
        ff.clicked.connect(self.set_ffmpeg)
        bottom_row.addWidget(ff)
        updates = QPushButton('Downloads / updates')
        updates.clicked.connect(lambda: QDesktopServices.openUrl(QUrl(WEBSITE + '?platform=desktop&version=' + VERSION + '#desktop')))
        bottom_row.addWidget(updates)
        layout.addLayout(bottom_row)

        self.update_options()

    def update_options(self):
        current = self.target.currentText()
        enabled = current in ['PNG', 'JPEG', 'WEBP', 'TIFF', 'BMP', 'Image → PDF']
        self.width.setEnabled(enabled)
        self.rotate.setEnabled(enabled)
        self.wheel.set_selected_target(current)
        if self.floating_wheel:
            self.floating_wheel.wheel.set_selected_target(current)

    def on_wheel_slice_clicked(self, target_name):
        if target_name in OPERATIONS:
            self.target.setCurrentText(target_name)
            self.update_options()
            if self.paths:
                self.status.setText(f'Target: {target_name}. Click "Convert files" to begin.')
            else:
                self.status.setText(f'Target: {target_name}. Drop files directly onto the wheel to convert.')

    def on_wheel_slice_dropped(self, target_name, paths):
        if target_name in OPERATIONS:
            self.target.setCurrentText(target_name)
            self.update_options()
        self.add_paths(paths)
        if self.paths and not (self.batch and self.batch.isRunning()):
            self.start()

    def open_floating_wheel(self):
        if self.floating_wheel is None:
            self.floating_wheel = FloatingRadialWheelWindow(self)
        self.floating_wheel.show()
        self.floating_wheel.raise_()
        self.floating_wheel.activateWindow()

    def open_avatar_studio(self):
        html_path = get_asset_path('avatar.html')
        if html_path.exists():
            QDesktopServices.openUrl(QUrl.fromLocalFile(str(html_path)))
        else:
            QDesktopServices.openUrl(QUrl(WEBSITE))

    def add_paths(self, paths):
        if self.batch and self.batch.isRunning():
            return
        errors = []
        for raw in paths:
            try:
                p = str(source_file(raw))
                if p in self.paths:
                    continue
                if len(self.paths) >= 100:
                    raise ValueError('Batch limit: 100 files.')
                self.paths.append(p)
                self.list.addItem(Path(p).name)
            except Exception as e:
                errors.append(str(e))
        self.status.setText('; '.join(errors[:3]) if errors else f'{len(self.paths)} files ready.')

    def pick(self):
        self.add_paths(QFileDialog.getOpenFileNames(self, 'Select files')[0])

    def clear_files(self):
        self.paths = []
        self.list.clear()
        self.outputs = []
        self.open.setEnabled(False)
        self.status.setText('Ready.')

    def choose_folder(self):
        folder = QFileDialog.getExistingDirectory(self, 'Choose output folder')
        if folder:
            self.output = folder
            self.folder.setText('Output: ' + Path(folder).name)

    def set_ffmpeg(self):
        path = QFileDialog.getOpenFileName(self, 'Select FFmpeg from a trusted installation')[0]
        if path:
            self.settings.setValue('ffmpeg', str(Path(path).resolve()))
            self.status.setText('FFmpeg selected. It runs only when you request media conversion.')

    def show_limits(self):
        QMessageBox.information(self, 'Docyo Desktop Capabilities',
            'Images: PNG, JPEG, WebP, TIFF, BMP output; PNG/JPEG/WebP/TIFF/BMP/AVIF input. Resize and rotate. Single-frame only; 40 megapixels.\n\n'
            'PDF: image to PDF, merge (up to 200 pages), split and extract text.\n\n'
            'Media: MP4/WebM/MP3/WAV/FLAC/Ogg using a separately selected FFmpeg.\n\n'
            'Radial Wheel & Floating Wheel: Fast one-drop conversion onto format wedges.\n\n'
            '3D Avatar Studio: Interactive 3D Grape Penguin Vinyl Toy viewer.')

    def start(self):
        if not self.paths:
            return
        self.outputs = []
        self.open.setEnabled(False)
        self.progress.setValue(0)
        for button in (self.add, self.clear, self.folder, self.convert, self.target):
            button.setEnabled(False)
        self.cancel.setEnabled(True)
        self.status.setText('Converting…')
        self.batch = Batch(list(self.paths), self.target.currentText(), {
            'output': self.output,
            'width': self.width.value(),
            'rotation': self.rotate.currentIndex() * 90,
            'ffmpeg': self.settings.value('ffmpeg', '')
        })
        self.batch.result.connect(self.result)
        self.batch.progress.connect(lambda n, total: self.progress.setValue(round(n / total * 100)))
        self.batch.finished.connect(self.finished)
        self.batch.start()
        self._watchdog = QTimer(self)
        self._watchdog.setInterval(500)
        self._watchdog.timeout.connect(self._check_batch)
        self._watchdog.start()

    def _check_batch(self):
        if self.batch and not self.batch.isRunning():
            self.finished()

    def result(self, index, status, outputs):
        self.outputs.extend(outputs)
        item = self.list.item(index)
        if item:
            item.setText(Path(self.paths[index]).name + ' — ' + status)
            item.setToolTip('\n'.join(outputs) or status)
        self.status.setText(status)
        self.open.setEnabled(bool(self.outputs))

    def finished(self):
        if hasattr(self, '_watchdog') and self._watchdog.isActive():
            self._watchdog.stop()
        if self.add.isEnabled():
            return
        for button in (self.add, self.clear, self.folder, self.convert, self.target):
            button.setEnabled(True)
        self.cancel.setEnabled(False)
        self.status.setText(f'Finished: {len(self.outputs)} output file(s). Check each row for failures or cancellation.')
        self.update_options()

    def cancel_batch(self):
        if self.batch:
            self.batch.cancel.set()
            self.status.setText('Cancelling… Completed outputs will be kept.')

    def open_output(self):
        if self.outputs:
            QDesktopServices.openUrl(QUrl.fromLocalFile(str(Path(self.outputs[-1]).parent)))

    def closeEvent(self, event):
        if self.floating_wheel:
            self.floating_wheel.close()
        if self.batch and self.batch.isRunning():
            self.batch.cancel.set()
            event.ignore()
            self.status.setText('Stopping conversion before closing…')
            QTimer.singleShot(200, self.close)
        else:
            event.accept()

DARK_STYLESHEET = '''
QWidget {
    background-color: #0e0d16;
    color: #f1effa;
    font-family: -apple-system, 'Segoe UI', system-ui, sans-serif;
    font-size: 13px;
}
QTabWidget::pane {
    border: 1px solid rgba(123, 92, 255, 0.3);
    border-radius: 12px;
    background: #151324;
    padding: 6px;
}
QTabBar::tab {
    background: #1a172c;
    color: #a49bc4;
    padding: 8px 18px;
    margin-right: 4px;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    font-weight: 600;
}
QTabBar::tab:selected {
    background: #25203d;
    color: #ffffff;
    border-bottom: 2px solid #7b5cff;
}
QPushButton {
    background-color: #201c34;
    color: #f1effa;
    padding: 8px 14px;
    border: 1px solid rgba(123, 92, 255, 0.4);
    border-radius: 8px;
    font-weight: 500;
}
QPushButton:hover {
    background-color: #2b2546;
    border: 1px solid #7b5cff;
}
QPushButton:pressed {
    background-color: #38305c;
}
QPushButton:disabled {
    background-color: #161424;
    color: #6c6682;
    border: 1px solid #28243c;
}
QComboBox, QSpinBox {
    background-color: #191629;
    color: #f1effa;
    padding: 7px 10px;
    border: 1px solid rgba(123, 92, 255, 0.4);
    border-radius: 8px;
}
QComboBox:focus, QSpinBox:focus {
    border: 1px solid #7b5cff;
}
QListWidget {
    background-color: #12101e;
    color: #f1effa;
    border: 2px dashed rgba(123, 92, 255, 0.35);
    border-radius: 10px;
    padding: 8px;
}
QProgressBar {
    border: 1px solid rgba(123, 92, 255, 0.3);
    border-radius: 6px;
    text-align: center;
    background: #151322;
    color: #ffffff;
    height: 18px;
}
QProgressBar::chunk {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0, stop:0 #7b5cff, stop:1 #9a82ff);
    border-radius: 5px;
}
'''

def main():
    if os.name == 'nt' and getattr(sys, 'frozen', False):
        import ctypes
        handle = ctypes.windll.kernel32.GetConsoleWindow()
        if handle:
            ctypes.windll.user32.ShowWindow(handle, 0)
    app = QApplication(sys.argv)
    app.setStyle('Fusion')
    app.setStyleSheet(DARK_STYLESHEET)
    window = Window()
    window.show()
    if '--smoke-test' in sys.argv:
        QTimer.singleShot(400, app.quit)
    return app.exec()

if __name__ == '__main__':
    raise SystemExit(main())

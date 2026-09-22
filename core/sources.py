import sys
from pathlib import Path

import cv2
import numpy as np

IMG_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}


def read_image(path):
    """cv2.imread breaks on non-ASCII paths on Windows, this does not."""
    data = np.fromfile(str(path), dtype=np.uint8)
    return cv2.imdecode(data, cv2.IMREAD_COLOR)


class FolderSource:
    """Also used for a single image (a folder of one)."""

    def __init__(self, paths):
        self.paths = list(paths)
        self.i = 0

    @classmethod
    def from_folder(cls, folder):
        files = sorted(p for p in Path(folder).iterdir() if p.suffix.lower() in IMG_EXT)
        return cls(files)

    def __len__(self):
        return len(self.paths)

    def current(self):
        p = self.paths[self.i]
        return read_image(p), p.name

    def step(self, delta):
        self.i = (self.i + delta) % len(self.paths)
        return self.current()


class WebcamSource:
    """Laptop or USB camera. If the OSEE camera shows up as a normal USB camera,
    this works for it too, just change the index."""

    def __init__(self, index=0, width=None, height=None):
        backend = cv2.CAP_DSHOW if sys.platform.startswith("win") else cv2.CAP_ANY
        self.cap = cv2.VideoCapture(index, backend)
        if width:
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        if height:
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    def is_open(self):
        return self.cap.isOpened()

    def read(self):
        return self.cap.read()

    def release(self):
        self.cap.release()


class IndustrialCamSource:
    """Placeholder for the real industrial camera. If it is not a plain USB camera,
    implement read() and release() with the vendor SDK here. The rest of the app
    does not need to change."""

    def __init__(self, *args, **kwargs):
        raise NotImplementedError("Add the vendor SDK code here when the camera arrives")

"""
Level 2: image enhancement, rotation correction, noise removal.

A basic grayscale + denoise pipeline is implemented and active. The
rotation-correction step (Hough-line based deskew) is stubbed with
instructions, since it needs real scanned samples to tune thresholds
against — wire it in once you have sample documents to test with.
"""
import cv2
import numpy as np
from PIL import Image


def preprocess_image(img: Image.Image) -> Image.Image:
    cv_img = cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2BGR)

    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    _, thresholded = cv2.threshold(
        denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    # deskewed = _deskew(thresholded)  # see _deskew() below

    return Image.fromarray(thresholded)


def _deskew(img_array: np.ndarray) -> np.ndarray:
    """
    TODO: detect skew angle via cv2.HoughLinesP over Canny edges, then
    cv2.warpAffine to rotate back to horizontal. Left disabled by default
    because an incorrect skew estimate on a document that's already
    straight can make OCR worse, not better — enable once tested against
    your real input distribution.
    """
    return img_array

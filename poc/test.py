# simple_paint_smoother.py

import cv2
import numpy as np

# --- Global variables ---
is_drawing = False
last_point = (0, 0)
brush_color = (255, 255, 255)
brush_thickness = 5

def draw_on_canvas(event, x, y, flags, param):
    """Callback function to handle mouse events for drawing."""
    global is_drawing, last_point, canvas

    if event == cv2.EVENT_LBUTTONDOWN:
        is_drawing = True
        last_point = (x, y)
    elif event == cv2.EVENT_MOUSEMOVE:
        if is_drawing:
            cv2.line(canvas, last_point, (x, y), brush_color, brush_thickness)
            last_point = (x, y)
    elif event == cv2.EVENT_LBUTTONUP:
        is_drawing = False

# --- Main Program ---
canvas = np.zeros((600, 800, 3), np.uint8)
window_name = "Simple Paint (Smoother)"
cv2.namedWindow(window_name)
cv2.setMouseCallback(window_name, draw_on_canvas)

print("--- 🎨 Simple Paint ---")
print("Drag the mouse to draw.")
print("Press 'c' to clear the screen.")
print("Press 'q' or Esc to quit.")
print("-----------------------")

while True:
    cv2.imshow(window_name, canvas)
    
    # THE FIX: Increased waitKey from 1ms to 10ms.
    # This gives the window more time to process the flood of mouse events
    # between each frame, making the drawing appear smoother.
    key = cv2.waitKey(10) & 0xFF

    if key == ord('q') or key == 27:
        break
    if key == ord('c'):
        canvas = np.zeros((600, 800, 3), np.uint8)

cv2.destroyAllWindows()
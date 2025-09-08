import cv2
import numpy as np

# --- Global State Variables ---
points = []
simplified_points = None
is_drawing = False
mode = 'draw'
image = None
clone = None
canvas = None # NEW: A dedicated canvas to draw on
previous_point = None # NEW: To track the last point for drawing segments

def interactive_drawing(event, x, y, flags, param):
    """Mouse callback function optimized for performance."""
    global points, is_drawing, mode, canvas, previous_point

    # --- Mouse Down Event ---
    if event == cv2.EVENT_LBUTTONDOWN:
        is_drawing = True
        previous_point = (x, y)
        if mode == 'draw':
            points.append((x, y))

    # --- Mouse Move Event ---
    elif event == cv2.EVENT_MOUSEMOVE:
        if is_drawing:
            current_point = (x, y)
            if mode == 'draw':
                # Draw only the new line segment on the canvas
                cv2.line(canvas, previous_point, current_point, (0, 0, 255), 2)
                points.append(current_point)
                previous_point = current_point
            elif mode == 'erase':
                erase_radius = 15
                points = [p for p in points if np.linalg.norm(np.array(p) - np.array(current_point)) > erase_radius]
                # For erase, we must redraw the whole line on a clean canvas
                canvas = clone.copy()
                if len(points) > 1:
                    cv2.polylines(canvas, [np.array(points)], isClosed=False, color=(0, 0, 255), thickness=2)

    # --- Mouse Up Event ---
    elif event == cv2.EVENT_LBUTTONUP:
        is_drawing = False
        previous_point = None

def main():
    global points, mode, simplified_points, image, clone, canvas
    
    # --- Setup ---
    image_path = input("Enter the path to your image: ")
    image = cv2.imread(image_path)
    if image is None:
        print("Error: Could not load the image.")
        return
    clone = image.copy()
    canvas = image.copy() # Initialize the canvas
    
    cv2.namedWindow("ROI Editor")
    cv2.setMouseCallback("ROI Editor", interactive_drawing)

    print("\n--- 🖼️ Advanced ROI Editor ---")
    print("  - Draw Mode ('d'): Left-click and drag to draw the ROI.")
    print("  - Erase Mode ('e'): Click and drag to erase parts of the drawing.")
    print("  - Reset ('r'): Clears the entire drawing.")
    print("  - Confirm ('c'): Finalizes and simplifies the shape.")
    print("  - Quit ('q'): Exits the program.")
    print("--------------------------------\n")

    # --- Main Loop ---
    while True:
        # The main display image starts from the canvas, which already has our drawing
        display_image = canvas.copy()

        # If finalized, draw the simplified polygon on top
        if simplified_points is not None:
            cv2.polylines(display_image, [simplified_points], isClosed=True, color=(255, 0, 0), thickness=3)

        # Display the current mode
        text_color = (0, 255, 0) if mode == 'draw' else (0, 165, 255)
        cv2.putText(display_image, f"Mode: {mode.upper()}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 3)
        cv2.putText(display_image, f"Mode: {mode.upper()}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, text_color, 2)

        cv2.imshow("ROI Editor", display_image)
        key = cv2.waitKey(1) & 0xFF

        if key == ord('d'):
            mode = 'draw'
            print("Mode changed to: DRAW")
        elif key == ord('e'):
            mode = 'erase'
            print("Mode changed to: ERASE")
        elif key == ord('r'):
            points = []
            simplified_points = None
            canvas = clone.copy() # Reset the canvas to the original image
            print("Drawing has been reset.")
        elif key == ord('c'):
            if len(points) < 3:
                print("Error: Not enough points to create a polygon. Please draw more.")
            else:
                # The finalization logic remains the same
                print("Finalizing shape...")
                points_np = np.array(points, dtype=np.int32)
                epsilon = 0.005 * cv2.arcLength(points_np, True)
                simplified_points = cv2.approxPolyDP(points_np, epsilon, True)
                print(f"Original point count: {len(points)}. Simplified to: {len(simplified_points)} points.")
        elif key == ord('q'):
            break

    cv2.destroyAllWindows()

    # --- Final Output ---
    if simplified_points is not None:
        print("\n--- ✅ ROI Selection Complete! ---")
        print("Copy the NumPy array below and paste it into your main script:\n")
        output_string = "ROI_POLYGON = np.array([\n"
        for point in simplified_points.reshape(-1, 2):
            output_string += f"    [{point[0]}, {point[1]}],\n"
        output_string += "], np.int32)"
        print(output_string)

if __name__ == "__main__":
    main()
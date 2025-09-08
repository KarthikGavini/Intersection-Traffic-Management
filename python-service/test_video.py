# python-service/test_video_loop.py
import cv2

# --- IMPORTANT: Change this to one of your actual video filenames ---
video_filename = "north_cam.mp4"
print(f"--- Starting Loop Test for: {video_filename} ---")

cap = cv2.VideoCapture(video_filename)

if not cap.isOpened():
    print("--- ❌ ERROR: Could not open video. ---")
else:
    print("--- ✅ Video opened. Press 'q' in the video window to quit. ---")
    frame_count = 0
    loop_count = 0
    
    while True:
        ret, frame = cap.read()
        
        # This is the looping logic
        if not ret:
            loop_count += 1
            if loop_count >= 3: # Let's stop after looping 3 times
                print(f"\n--- ✅ Looped successfully {loop_count} times. Test complete. ---")
                break
            
            print(f"\n>>> Video ended. LOOPING (Starting loop #{loop_count + 1}) <<<\n")
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            frame_count = 0
            continue # Skip to the next iteration to read the new first frame

        frame_count += 1
        
        # Display progress in the terminal
        if frame_count % 50 == 0:
            print(f"Read frame #{frame_count} in loop #{loop_count + 1}")

        # Display the video feed in a window
        cv2.imshow("Loop Test - Press 'q' to exit", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()
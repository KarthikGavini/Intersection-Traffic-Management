import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import cv2
import numpy as np
from PIL import Image, ImageTk

class ROIEditorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Advanced Media ROI Editor")
        self.root.geometry("1200x800")

        # --- State Variables ---
        self.points = [] # Stores ROI points in ORIGINAL media coordinates
        self.simplified_points = None
        self.mode = 'draw'
        self.is_drawing = False

        # --- Media and View State ---
        self.media_type = None # 'image' or 'video'
        self.original_media = None # Holds image OR cv2.VideoCapture object
        self.current_frame = None # The full-resolution, unmodified frame/image
        self.photo_image = None
        self.canvas_image_id = None
        self.scale_factor = 1.0
        self.pan_start_x = 0
        self.pan_start_y = 0

        # --- Video Specific State ---
        self.is_playing = False
        self.video_fps = 30
        self.video_frame_count = 0
        self.current_frame_index = 0
        self.is_slider_busy = False # Flag to prevent slider recursion

        # --- UI Setup ---
        self.setup_ui()

    def setup_ui(self):
        # --- Top Control Frame ---
        top_control_frame = ttk.Frame(self.root, padding="10")
        top_control_frame.pack(side=tk.TOP, fill=tk.X)

        ttk.Button(top_control_frame, text="Load Media", command=self.load_media).pack(side=tk.LEFT, padx=5)
        self.mode_label = ttk.Label(top_control_frame, text="Mode: DRAW", font=('Helvetica', 10, 'bold'), foreground="green")
        self.mode_label.pack(side=tk.LEFT, padx=20)
        ttk.Button(top_control_frame, text="Draw ('d')", command=self.set_draw_mode).pack(side=tk.LEFT, padx=5)
        ttk.Button(top_control_frame, text="Erase ('e')", command=self.set_erase_mode).pack(side=tk.LEFT, padx=5)
        ttk.Button(top_control_frame, text="Confirm ('c')", command=self.confirm_roi).pack(side=tk.RIGHT, padx=5)
        ttk.Button(top_control_frame, text="Reset ('r')", command=self.reset).pack(side=tk.RIGHT, padx=5)

        # --- Canvas for Media ---
        self.canvas = tk.Canvas(self.root, bg="gray", cursor="crosshair")
        self.canvas.pack(fill=tk.BOTH, expand=True)
        
        # --- Bottom Video Control Frame ---
        self.video_controls_frame = ttk.Frame(self.root, padding="5")
        self.play_pause_button = ttk.Button(self.video_controls_frame, text="▶ Play", command=self.toggle_play_pause)
        self.frame_slider = ttk.Scale(self.video_controls_frame, from_=0, to=100, orient=tk.HORIZONTAL, command=self.on_slider_move)
        self.frame_label = ttk.Label(self.video_controls_frame, text="Frame: 0 / 0")


        # --- Bindings ---
        self.canvas.bind("<ButtonPress-1>", self.start_drawing)
        self.canvas.bind("<B1-Motion>", self.draw_or_erase)
        self.canvas.bind("<ButtonRelease-1>", self.stop_drawing)
        self.canvas.bind("<ButtonPress-3>", self.start_pan)
        self.canvas.bind("<B3-Motion>", self.pan_image)
        self.canvas.bind("<MouseWheel>", self.zoom)
        self.canvas.bind("<Button-4>", self.zoom)
        self.canvas.bind("<Button-5>", self.zoom)
        self.root.bind('<d>', lambda event: self.set_draw_mode())
        self.root.bind('<e>', lambda event: self.set_erase_mode())
        self.root.bind('<r>', lambda event: self.reset())
        self.root.bind('<c>', lambda event: self.confirm_roi())
        self.root.bind('<space>', lambda event: self.toggle_play_pause())


    def load_media(self):
        path = filedialog.askopenfilename(filetypes=[("Media Files", "*.jpg *.jpeg *.png *.bmp *.mp4 *.avi *.mov")])
        if not path: return

        self.reset(full=True) # Full reset before loading new media

        # --- Determine media type ---
        if path.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp')):
            self.media_type = 'image'
            self.current_frame = cv2.imread(path)
            if self.current_frame is None:
                messagebox.showerror("Error", "Could not load image file.")
                self.media_type = None
                return
        else:
            self.media_type = 'video'
            self.original_media = cv2.VideoCapture(path)
            if not self.original_media.isOpened():
                messagebox.showerror("Error", "Could not open video file.")
                self.media_type = None
                return

            self.video_fps = self.original_media.get(cv2.CAP_PROP_FPS)
            self.video_frame_count = int(self.original_media.get(cv2.CAP_PROP_FRAME_COUNT))
            self.current_frame_index = 0
            
            # --- Setup video controls ---
            self.frame_slider.config(to=self.video_frame_count - 1)
            self.frame_slider.set(0)
            self.play_pause_button.pack(side=tk.LEFT, padx=5)
            self.frame_slider.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)
            self.frame_label.pack(side=tk.LEFT, padx=5)
            self.video_controls_frame.pack(side=tk.BOTTOM, fill=tk.X)

            ret, self.current_frame = self.original_media.read()
            if not ret:
                 messagebox.showerror("Error", "Could not read the first frame of the video.")
                 return
        
        self.fit_to_window()
        self.update_display_image()

    def fit_to_window(self):
        if self.current_frame is None: return
        window_width = self.root.winfo_width()
        window_height = self.root.winfo_height()
        img_height, img_width, _ = self.current_frame.shape

        scale_w = window_width / img_width
        scale_h = window_height / img_height
        self.scale_factor = min(scale_w, scale_h, 1.0)


    def update_display_image(self):
        if self.current_frame is None: return

        disp_w = int(self.current_frame.shape[1] * self.scale_factor)
        disp_h = int(self.current_frame.shape[0] * self.scale_factor)
        
        display_image = cv2.resize(self.current_frame, (disp_w, disp_h), interpolation=cv2.INTER_AREA)

        rgb_image = cv2.cvtColor(display_image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_image)
        self.photo_image = ImageTk.PhotoImage(pil_image)

        self.canvas.config(scrollregion=self.canvas.bbox(tk.ALL))
        if self.canvas_image_id:
            self.canvas.delete(self.canvas_image_id)
        self.canvas_image_id = self.canvas.create_image(0, 0, anchor=tk.NW, image=self.photo_image)
        
        self.redraw_canvas_overlay()
        self.update_frame_label()

    def get_coords(self, event):
        canvas_x = self.canvas.canvasx(event.x)
        canvas_y = self.canvas.canvasy(event.y)
        return canvas_x / self.scale_factor, canvas_y / self.scale_factor

    def start_drawing(self, event):
        if self.current_frame is None or self.is_playing: return
        self.is_drawing = True
        if self.mode == 'draw':
            orig_x, orig_y = self.get_coords(event)
            self.points.append((orig_x, orig_y))
        self.draw_or_erase(event)

    def draw_or_erase(self, event):
        if not self.is_drawing or self.current_frame is None: return
        
        orig_x, orig_y = self.get_coords(event)

        if self.mode == 'draw':
            self.points.append((orig_x, orig_y))
        elif self.mode == 'erase':
            erase_radius = 15 / self.scale_factor
            self.points = [p for p in self.points if np.linalg.norm(np.array(p) - np.array((orig_x, orig_y))) > erase_radius]
        
        self.redraw_canvas_overlay()

    def stop_drawing(self, event):
        self.is_drawing = False

    def redraw_canvas_overlay(self):
        self.canvas.delete("drawing")
        if not self.points and self.simplified_points is None: return

        scaled_points = [(p[0] * self.scale_factor, p[1] * self.scale_factor) for p in self.points]
        if len(scaled_points) > 1:
            self.canvas.create_line(scaled_points, fill="red", width=2, tags="drawing")
        
        if self.simplified_points is not None:
            scaled_poly = self.simplified_points * self.scale_factor
            flat_points = scaled_poly.reshape(-1).tolist()
            self.canvas.create_polygon(flat_points, outline="blue", fill="", width=3, tags="drawing")
        
        self.canvas.tag_raise("drawing")

    def start_pan(self, event):
        self.canvas.scan_mark(event.x, event.y)

    def pan_image(self, event):
        self.canvas.scan_dragto(event.x, event.y, gain=1)
    
    def zoom(self, event):
        if self.current_frame is None: return
        
        if event.delta > 0 or event.num == 4: factor = 1.1
        elif event.delta < 0 or event.num == 5: factor = 0.9
        else: return

        new_scale = self.scale_factor * factor
        if 0.1 < new_scale < 5.0:
            mouse_x = self.canvas.canvasx(event.x)
            mouse_y = self.canvas.canvasy(event.y)
            
            # Calculate where the mouse is in the full-size image
            img_x = mouse_x / self.scale_factor
            img_y = mouse_y / self.scale_factor

            self.scale_factor = new_scale
            self.update_display_image()
            
            # Calculate the new canvas coordinates for the point under the mouse
            new_mouse_x = img_x * self.scale_factor
            new_mouse_y = img_y * self.scale_factor

            # Calculate the scroll amount to keep the point under the mouse
            scroll_x = new_mouse_x - event.x
            scroll_y = new_mouse_y - event.y

            self.canvas.xview_moveto(scroll_x / (self.current_frame.shape[1] * self.scale_factor))
            self.canvas.yview_moveto(scroll_y / (self.current_frame.shape[0] * self.scale_factor))

    # --- Video Playback ---
    def on_slider_move(self, value):
        # If the slider is being set programmatically, do nothing.
        if self.is_slider_busy:
            return
            
        if self.media_type == 'video' and not self.is_playing:
            frame_index = int(float(value))
            # Only update if the user has actually moved to a new frame
            if frame_index != self.current_frame_index:
                self.display_frame(frame_index)

    def display_frame(self, frame_index):
        if self.media_type != 'video' or self.original_media is None: return
        self.original_media.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
        ret, frame = self.original_media.read()
        if ret:
            self.current_frame = frame
            self.current_frame_index = frame_index

            # --- FIX: Set busy flag to prevent recursion ---
            self.is_slider_busy = True
            self.frame_slider.set(frame_index)
            self.is_slider_busy = False
            
            self.update_display_image()
        else:
            print(f"Failed to read frame {frame_index}")
    
    def toggle_play_pause(self):
        if self.media_type != 'video': return
        self.is_playing = not self.is_playing
        if self.is_playing:
            self.play_pause_button.config(text="❚❚ Pause")
            self.play_video_loop()
        else:
            self.play_pause_button.config(text="▶ Play")

    def play_video_loop(self):
        if self.is_playing and self.media_type == 'video':
            ret, frame = self.original_media.read()
            if ret:
                self.current_frame_index += 1
                self.display_frame(self.current_frame_index)
                
                delay = int(1000 / self.video_fps)
                self.root.after(delay, self.play_video_loop)
            else: # End of video
                self.is_playing = False
                self.play_pause_button.config(text="▶ Play")


    def update_frame_label(self):
        if self.media_type == 'video':
            self.frame_label.config(text=f"Frame: {self.current_frame_index} / {self.video_frame_count}")
        else:
            self.frame_label.config(text="")

    # --- Mode and Action Functions ---
    def set_draw_mode(self):
        self.mode = 'draw'
        self.mode_label.config(text="Mode: DRAW", foreground="green")

    def set_erase_mode(self):
        self.mode = 'erase'
        self.mode_label.config(text="Mode: ERASE", foreground="orange")

    def reset(self, full=False):
        self.points = []
        self.simplified_points = None
        if self.current_frame is not None:
            self.redraw_canvas_overlay()
        
        if full and self.media_type == 'video' and self.original_media:
            self.original_media.release()
            self.original_media = None
            self.media_type = None
            self.is_playing = False
            self.video_controls_frame.pack_forget()

        print("Drawing has been reset.")

    def confirm_roi(self):
        if len(self.points) < 3:
            messagebox.showwarning("Warning", "Not enough points to create a polygon.")
            return

        print("Finalizing shape...")
        points_np = np.array(self.points, dtype=np.int32)
        epsilon = 0.008 * cv2.arcLength(points_np, True)
        self.simplified_points = cv2.approxPolyDP(points_np, epsilon, True)
        
        print(f"Simplified to: {len(self.simplified_points)} points.")
        self.redraw_canvas_overlay()
        self.print_roi_to_console()

    def print_roi_to_console(self):
        if self.simplified_points is None: return
        print("\n--- ✅ ROI Selection Complete! ---")
        
        output_string = "ROI_POLYGON = np.array([\n"
        for point in self.simplified_points.reshape(-1, 2):
            output_string += f"    [{point[0]}, {point[1]}],\n"
        output_string += "], np.int32)"
        
        print(output_string)
        try:
            self.root.clipboard_clear()
            self.root.clipboard_append(output_string)
            print("\n(The array has been copied to your clipboard!)")
        except tk.TclError:
            print("\n(Could not copy to clipboard on this system.)")

if __name__ == "__main__":
    root = tk.Tk()
    app = ROIEditorApp(root)
    root.mainloop()



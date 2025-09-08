# python-service/bridge.py
import socketio
import serial
import time

# --- CONFIGURATION ---
# IMPORTANT: Change this to the port name you found in the step above
ARDUINO_PORT = "/dev/tty.usbmodem141011" # For macOS, e.g., /dev/tty.usbmodemXXXX
# ARDUINO_PORT = "COM3"  # For Windows, e.g., COM3, COM4, etc.
BAUD_RATE = 9600
SERVER_URL = "http://localhost:5001"

# --- SERIAL CONNECTION SETUP ---
try:
    print(f"Attempting to connect to Arduino on port {ARDUINO_PORT}...")
    arduino = serial.Serial(port=ARDUINO_PORT, baudrate=BAUD_RATE, timeout=.1)
    print("✅ Successfully connected to Arduino.")
except serial.SerialException as e:
    print(f"❌ Error: Could not connect to Arduino on port '{ARDUINO_PORT}'.")
    print("Please check the port name and ensure the Arduino is connected.")
    print(f"Details: {e}")
    exit()

# --- WEBSOCKET CLIENT SETUP ---
sio = socketio.Client()

@sio.event
def connect():
    print("✅ Successfully connected to the Node.js WebSocket server.")

@sio.event
def connect_error(data):
    print("❌ Connection to WebSocket server failed!")

@sio.event
def disconnect():
    print("🔌 Disconnected from WebSocket server.")

# This is the most important part: listening for our custom event
@sio.on('arduino-command')
def on_arduino_command(data):
    """This function is called when the server sends a command."""
    command = data + '\n' # Add a newline character for the Arduino to read
    print(f"➡️ Received command: '{data}'. Forwarding to Arduino...")
    arduino.write(command.encode('utf-8')) # Send the command to the Arduino

# --- MAIN EXECUTION ---
if __name__ == '__main__':
    try:
        print("Attempting to connect to WebSocket server...")
        sio.connect(SERVER_URL)
        sio.wait() # Wait indefinitely for events
    except socketio.exceptions.ConnectionError as e:
        print(f"❌ Error: Could not connect to the WebSocket server at {SERVER_URL}.")
        print(f"Please ensure the Node.js server is running.")
    finally:
        print("Bridge script shutting down.")
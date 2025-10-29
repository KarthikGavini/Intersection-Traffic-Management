# # python-service/dummy_violator.py

# import requests
# import time
# import random

# # --- Configuration ---
# API_ENDPOINT = "http://localhost:5001/api/violations"
# REAL_INTERSECTION_ID = "68bf113329a3d66abae0fd7c"
# REAL_INTERSECTION_NAME = "Main & First (Real)"

# # --- Define the two violations ---
# violations_to_add = [
#     {
#         "cameraName": "North",
#         "licensePlate": "AP 39 GH 1234", # Example plate 1
#         # Assumes server will serve images from /violation-cars/
#         "imageUrl": "http://localhost:5001/violation-cars/car1.png",
#         "timestamp": time.time() - 600 # 10 minutes ago
#     },
#     {
#         "cameraName": "East",
#         "licensePlate": "TS 07 ZZ 9999", # Example plate 2
#         # Assumes server will serve images from /violation-cars/
#         "imageUrl": "http://localhost:5001/violation-cars/car2.png",
#         "timestamp": time.time() - 1200 # 20 minutes ago
#     }
# ]

# print("--- 🚓 Adding Specific Violations ---")
# print(f"Posting data to: {API_ENDPOINT}")

# all_successful = True

# for violation in violations_to_add:
#     payload = {
#         "intersectionId": REAL_INTERSECTION_ID,
#         "intersectionName": REAL_INTERSECTION_NAME,
#         "cameraName": violation["cameraName"],
#         "licensePlate": violation["licensePlate"],
#         "imageUrl": violation["imageUrl"],
#         # Convert timestamp to ISO format for MongoDB Date
#         "timestamp": time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime(violation["timestamp"]))
#     }

#     try:
#         response = requests.post(API_ENDPOINT, json=payload)

#         if response.status_code == 201: # 201 = Created
#             print(f"✅ Successfully added violation for plate: {payload['licensePlate']}")
#         else:
#             print(f"❌ Error adding violation for {payload['licensePlate']}. Status: {response.status_code}, {response.text}")
#             all_successful = False

#     except requests.exceptions.ConnectionError:
#         print("❌ Connection failed. Is the Node.js server running?")
#         all_successful = False
#         break # Stop if server isn't running

# if all_successful:
#     print("--- ✅ All specific violations added successfully. ---")
# else:
#     print("--- ❌ Some violations failed to add. ---")




# python-service/dummy_violator.py

import requests
import time
import random

# --- Configuration ---
API_ENDPOINT = "http://localhost:5001/api/violations"
REAL_INTERSECTION_ID = "68bf113329a3d66abae0fd7c"
REAL_INTERSECTION_NAME = "Main & First (Real)"
CAMERA_NAMES = ["North", "South", "East", "West"]

# A public-domain image of a car for "evidence"
# This is a real photo of a car running a red light.
IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/2/20/Red_light_camera_photo.jpg" 

def generate_fake_plate():
    """Generates a random Indian-style license plate."""
    letters1 = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=2))
    digits1 = "".join(random.choices("0123456789", k=2))
    letters2 = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=2))
    digits2 = "".join(random.choices("0123456789", k=4))
    return f"{letters1} {digits1} {letters2} {digits2}"

print("--- 🚓 Dummy Violator Script Started ---")
print("This will create a new fake violation every 30-60 seconds.")
print(f"Posting data to: {API_ENDPOINT}")
print("Press Ctrl+C to stop.")

while True:
    try:
        # 1. Wait for a random time
        sleep_time = random.randint(30, 60)
        time.sleep(sleep_time)
        
        # 2. Create the fake violation data
        fake_plate = generate_fake_plate()
        random_camera = random.choice(CAMERA_NAMES)
        
        payload = {
            "intersectionId": REAL_INTERSECTION_ID,
            "intersectionName": REAL_INTERSECTION_NAME,
            "cameraName": random_camera,
            "licensePlate": fake_plate,
            "imageUrl": IMAGE_URL
        }
        
        # 3. Send the POST request to our server
        response = requests.post(API_ENDPOINT, json=payload)
        
        if response.status_code == 201: # 201 = Created
            print(f"✅ Successfully reported violation for plate: {fake_plate} at {random_camera}")
        else:
            print(f"❌ Error reporting violation. Status: {response.status_code}, {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed. Is the Node.js server running?")
        time.sleep(10) # Wait 10 seconds before retrying
        
    except KeyboardInterrupt:
        print("\nStopping the dummy violator script. Goodbye.")
        break



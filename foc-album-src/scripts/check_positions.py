from PIL import Image
import numpy as np

img = Image.open("public/assets/pages/P07_3B.webp").convert("L")
data = np.array(img)

# Candidate slots
candidates = [
    # Left column candidates
    ("Slot 1 (Left, Top)", 40, 120),
    ("Slot 1 (Left, Middle)", 40, 400),
    ("Slot 1 (Left, Bottom)", 40, 629),
    # Right column candidates
    ("Slot 2 (Right, Top)", 430, 120),
    ("Slot 2 (Right, Middle)", 430, 400),
    ("Slot 2 (Right, Bottom)", 430, 629)
]

for name, x, y in candidates:
    # Crop the candidate region
    crop = data[y:y+451, x:x+330]
    mean_val = np.mean(crop)
    std_val = np.std(crop)
    print(f"{name}: Mean Brightness={mean_val:.2f}, Std Dev={std_val:.2f}")


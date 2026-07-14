import os
import sys
from PIL import Image
from rembg import remove

def create_cutout(input_path, output_path):
    print(f"Removing background from {input_path} to {output_path}")
    with open(input_path, 'rb') as i:
        input_data = i.read()
        output_data = remove(input_data)
        
        with open(output_path, 'wb') as o:
            o.write(output_data)
            
    print("Background removed successfully.")

if __name__ == "__main__":
    create_cutout(sys.argv[1], sys.argv[2])

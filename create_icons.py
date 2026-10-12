import struct
import zlib
import os

def create_png(width, height, path):
    # RGBA color: indigo with nice rounded gradient or circle
    raw_data = bytearray()
    center_x = width / 2.0
    center_y = height / 2.0
    radius = min(width, height) * 0.45

    for y in range(height):
        raw_data.append(0)  # filter type 0
        for x in range(width):
            dist = ((x - center_x) ** 2 + (y - center_y) ** 2) ** 0.5
            if dist <= radius:
                # Indigo color: R: 79, G: 70, B: 229, A: 255
                # Inner sparkle / highlight
                if dist <= radius * 0.4:
                    raw_data.extend([129, 140, 248, 255])
                else:
                    raw_data.extend([79, 70, 229, 255])
            else:
                raw_data.extend([0, 0, 0, 0])  # transparent

    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)

    png_header = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr = chunk(b'IHDR', ihdr_data)
    idat = chunk(b'IDAT', zlib.compress(bytes(raw_data)))
    iend = chunk(b'IEND', b'')

    with open(path, 'wb') as f:
        f.write(png_header + ihdr + idat + iend)

out_dir = os.path.join(os.path.dirname(__file__), 'src-tauri', 'icons')
os.makedirs(out_dir, exist_ok=True)
create_png(32, 32, os.path.join(out_dir, '32x32.png'))
create_png(128, 128, os.path.join(out_dir, '128x128.png'))
create_png(256, 256, os.path.join(out_dir, '128x128@2x.png'))
create_png(512, 512, os.path.join(out_dir, 'icon.png'))
print(f"Generated icons in {out_dir}")

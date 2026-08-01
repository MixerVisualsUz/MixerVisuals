const fs = require('fs');
const path = require('path');

// Create a simple 144x144 PNG of Steve's face (scaled up 8x pixel art)
const SIZE = 144;
const PIXEL = SIZE / 8; // 18px per pixel

// Steve face 8x8 pixels (index 0-7)
const face = [
  //  hair          hair          hair          hair          hair          hair          hair          hair
  ['#1D1D21','#1D1D21','#1D1D21','#1D1D21','#1D1D21','#1D1D21','#1D1D21','#1D1D21'],
  //  hair          hair          hair          hair          hair          hair          hair          hair
  ['#1D1D21','#1D1D21','#1D1D21','#1D1D21','#1D1D21','#1D1D21','#1D1D21','#1D1D21'],
  //  skin          skin          skin          skin          skin          skin          skin          skin
  ['#8B6B4D','#8B6B4D','#8B6B4D','#8B6B4D','#8B6B4D','#8B6B4D','#8B6B4D','#8B6B4D'],
  //  skin          skin          eye           eye           skin          skin          eye           eye
  ['#8B6B4D','#8B6B4D','#5B6B9A','#5B6B9A','#8B6B4D','#8B6B4D','#5B6B9A','#5B6B9A'],
  //  skin          skin          eye           eye           skin          skin          eye           eye
  ['#8B6B4D','#8B6B4D','#5B6B9A','#5B6B9A','#8B6B4D','#8B6B4D','#5B6B9A','#5B6B9A'],
  //  skin          skin          skin          skin          skin          skin          skin          skin
  ['#8B6B4D','#8B6B4D','#8B6B4D','#8B6B4D','#8B6B4D','#8B6B4D','#8B6B4D','#8B6B4D'],
  //  skin          mouth         mouth         skin          skin          mouth         mouth         skin
  ['#8B6B4D','#6B4B3D','#6B4B3D','#8B6B4D','#8B6B4D','#6B4B3D','#6B4B3D','#8B6B4D'],
  //  skin          skin          skin          skin          skin          skin          skin          skin
  ['#8B6B4D','#8B6B4D','#8B6B4D','#8B6B4D','#8B6B4D','#8B6B4D','#8B6B4D','#8B6B4D'],
];

// Create raw pixel data (RGBA)
const pixels = Buffer.alloc(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const pi = Math.floor(y / PIXEL);
    const pj = Math.floor(x / PIXEL);
    const color = face[Math.min(pi, 7)][Math.min(pj, 7)];
    const idx = (y * SIZE + x) * 4;
    const r = parseInt(color.slice(1,3), 16);
    const g = parseInt(color.slice(3,5), 16);
    const b = parseInt(color.slice(5,7), 16);
    pixels[idx] = r;
    pixels[idx+1] = g;
    pixels[idx+2] = b;
    pixels[idx+3] = 255;
  }
}

// Write PNG manually (minimal PNG)
function createPNG(data, w, h) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function chunk(type, data) {
    const t = Buffer.from(type);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const crcData = Buffer.concat([t, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData), 0);
    return Buffer.concat([len, crcData, crc]);
  }

  // Filter bytes (none filter for each row)
  const rawData = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    rawData[y * (1 + w * 4)] = 0; // filter none
    data.copy(rawData, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4);
  }

  // Compress using zlib
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(rawData);

  const chunks = [
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ];

  return Buffer.concat(chunks);
}

const png = createPNG(pixels, SIZE, SIZE);
const outPath = path.join(__dirname, 'assets', 'images', 'steve.png');
fs.writeFileSync(outPath, png);
console.log('Steve face PNG created at:', outPath);
console.log('Size:', png.length, 'bytes');

import fs from 'fs';

const filePath = 'C:\\Users\\Falker\\Downloads\\test\\Squadra Blu.sav';
const buffer = fs.readFileSync(filePath);

const items = [70, 81, 78, 81, 70];

let out = "--- Byte Search for Items ---\n";
for (let stride = 1; stride <= 8; stride++) { // stride in bytes
    for (let i = 0; i < buffer.length - (items.length * stride); i++) {
        let match = true;
        for (let j = 0; j < items.length; j++) {
            if (buffer[i + (j * stride)] !== items[j]) {
                match = false;
                break;
            }
        }
        if (match) {
            out += `MATCH found! Stride: ${stride} bytes. Initial offset: ${i} (0x${i.toString(16).toUpperCase()})\n`;
        }
    }
}

// What if it's 23-bit aligned?
// My previous script checked 23-bit stride but maybe the bit-offset was miscalculated.
class BitBlock {
    constructor(buffer) { this.buffer = buffer; }
    getBit(index) { return (this.buffer[Math.floor(index / 8)] >> (index % 8)) & 1; }
    getInt(bitIndex, length) {
        let val = 0;
        for (let i = 0; i < length; i++) val |= (this.getBit(bitIndex + i) << i);
        return val;
    }
}
const bits = new BitBlock(buffer);
out += "--- Bit Search 23-bit Stride ---\n";
// Let's just search the whole file for the first item 70 with length 9 bits
// and see if the next 23 bits away is 81.
for (let i = 0; i < buffer.length * 8 - 150; i++) {
    if (bits.getInt(i, 9) === 70) {
        if (bits.getInt(i + 23, 9) === 81) {
            if (bits.getInt(i + 46, 9) === 78) {
                out += `23-BIT MATCH! Bit offset: ${i}. Byte approx: 0x${Math.floor(i / 8).toString(16).toUpperCase()}\n`;
            }
        }
    }
    // Try 8-bit length
    if (bits.getInt(i, 8) === 70) {
        if (bits.getInt(i + 23, 8) === 81) {
            if (bits.getInt(i + 46, 8) === 78) {
                out += `23-BIT MATCH (8-bit ID)! Bit offset: ${i}. Byte approx: 0x${Math.floor(i / 8).toString(16).toUpperCase()}\n`;
            }
        }
    }
}

fs.writeFileSync('scan_items_byte.txt', out);
console.log("Done");

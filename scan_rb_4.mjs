import fs from 'fs';

const filePath = 'C:\\Users\\Falker\\Downloads\\test\\Squadra Blu.sav';
const buffer = fs.readFileSync(filePath);

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
const targetStr = [70, 81, 78, 81, 70];

let out = "";
console.log("Searching for bit patterns...");

// Search for any combination of sequence spacing
for (let idLength of [8, 9, 10, 16]) {
    for (let stride = idLength; stride <= 48; stride++) {
        for (let base = 0; base < buffer.length * 8 - (targetStr.length * stride); base++) {
            let match = true;
            for (let j = 0; j < targetStr.length; j++) {
                if (bits.getInt(base + (j * stride), idLength) !== targetStr[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                out += `FOUND! ID Length: ${idLength} bits. Stride: ${stride} bits. Base Bit: ${base} (approx Byte: 0x${Math.floor(base / 8).toString(16)})\n`;
            }
        }
    }
}

fs.writeFileSync('scan_bag.txt', out);
console.log("Done");

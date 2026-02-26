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

let out = "--- Checking Stored Items (Kangaskhan Bank) ---\n";
// StoredItemOffset => 0x4D2F * 8 - 2 (EU)
// StoredItemCount => 239. 10 bits per item.
let storedBase = 0x4D2F * 8 - 2;
for (let i = 0; i < 239; i++) {
    let qty = bits.getInt(storedBase + i * 10, 10);
    if (qty > 0) {
        out += `Bank Item ID ${i + 1}: Qty ${qty}\n`;
    }
}

out += "\n--- Searching 16-bit array around 0x4CF4 ---\n";
for (let offset = 0x4CF4 - 16; offset < 0x4CF4 + 64; offset++) {
    out += `0x${offset.toString(16)}: ${buffer[offset]}\n`;
}

out += "\n--- Searching ANY 70, 81, 78 near each other ---\n";
// Let's just look for bytes 70, 81, 78 anywhere.
for (let i = 0; i < buffer.length - 200; i++) {
    if (buffer[i] === 70) {
        // Look within 100 bytes for 81
        for (let j = i + 1; j < i + 100; j++) {
            if (buffer[j] === 81) {
                // Look within 100 bytes for 78
                for (let k = j + 1; k < j + 100; k++) {
                    if (buffer[k] === 78) {
                        out += `Loose Match: 70 at ${i}, 81 at ${j}, 78 at ${k}\n`;
                    }
                }
            }
        }
    }
}

fs.writeFileSync('scan_stored.txt', out);

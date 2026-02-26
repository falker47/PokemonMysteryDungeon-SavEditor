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

let out = "--- 23-bit chunks from 0x4CF4 ---\n";
let startBit = 0x4CF4 * 8; // 157600
for (let i = 0; i < 5; i++) {
    let chunk = "";
    for (let b = 0; b < 23; b++) {
        chunk += bits.getBit(startBit + i * 23 + b);
    }
    let val = bits.getInt(startBit + i * 23, 23);

    // Test different length mappings
    let id_3_9 = bits.getInt(startBit + i * 23 + 3, 9);
    let id_4_8 = bits.getInt(startBit + i * 23 + 4, 8);
    let id_15_8 = bits.getInt(startBit + i * 23 + 15, 8);
    let id_14_9 = bits.getInt(startBit + i * 23 + 14, 9);

    out += `Slot ${i}: BIN: ${chunk.split('').reverse().join('')} | HEX: 0x${val.toString(16).padStart(6, '0')} | id(3,9)=${id_3_9} | id(4,8)=${id_4_8} | id(15,8)=${id_15_8} | id(14,9)=${id_14_9}\n`;
}

out += "\n--- 24-bit chunks from 0x4CF4 ---\n";
for (let i = 0; i < 5; i++) {
    let chunk = "";
    for (let b = 0; b < 24; b++) {
        chunk += bits.getBit(startBit + i * 24 + b);
    }
    let val = bits.getInt(startBit + i * 24, 24);

    // What if the ID is just 8 bits somewhere? Search for 70...
    let possible = [];
    for (let j = 0; j <= 16; j++) {
        if (bits.getInt(startBit + i * 24 + j, 8) === 70) possible.push(`8-bit@${j}=70`);
        if (bits.getInt(startBit + i * 24 + j, 9) === 70) possible.push(`9-bit@${j}=70`);
    }
    out += `Slot ${i}: BIN: ${chunk.split('').reverse().join('')} | HEX: 0x${val.toString(16).padStart(6, '0')} | ${possible.join(', ')}\n`;
}

fs.writeFileSync('scan_bit_chunks.txt', out);

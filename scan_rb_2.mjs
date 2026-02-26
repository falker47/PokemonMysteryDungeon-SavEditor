import fs from 'fs';
import path from 'path';

const filePath = 'C:\\Users\\Falker\\Downloads\\test\\Squadra Blu.sav';
const buffer = fs.readFileSync(filePath);

console.log("TeamName from 0x4ECC:");
console.log(buffer.subarray(0x4ECC, 0x4ECC + 10).toString('utf16le'));
console.log(buffer.subarray(0x4ECC, 0x4ECC + 10).toString('ascii'));

console.log("\nTeamName from 0x4ED0:");
console.log(buffer.subarray(0x4ED0, 0x4ED0 + 10).toString('utf16le'));
console.log(buffer.subarray(0x4ED0, 0x4ED0 + 10).toString('ascii'));

console.log("\nTeamName from 0x4EC8:");
console.log(buffer.subarray(0x4EC8, 0x4EC8 + 10).toString('utf16le'));
console.log(buffer.subarray(0x4EC8, 0x4EC8 + 10).toString('ascii'));

let out = "";

class BitBlock {
    constructor(buffer) {
        this.buffer = buffer;
    }
    getBit(index) {
        const byte = Math.floor(index / 8);
        const bit = index % 8;
        return (this.buffer[byte] >> bit) & 1;
    }
    getInt(bitIndex, length) {
        let val = 0;
        for (let i = 0; i < length; i++) {
            val |= (this.getBit(bitIndex + i) << i);
        }
        return val;
    }
}

const bits = new BitBlock(buffer);

// Let's decode items using a 9-bit ID from exactly 0x4CF4 and 0x4CF0 and 0x4CF8
function readItems(baseByte) {
    let res = "";
    res += `\n--- Reading items at 0x${baseByte.toString(16)} ---\n`;
    for (let i = 0; i < 5; i++) {
        // According to RBOffsets:
        // get HeldItemLength(): number { return 23; }
        // get HeldItemIDOffset(): number { return 3; } -> Length 9
        // get HeldItemQtyOffset(): number { return 12; } -> Length 7
        const itemBitBase = baseByte * 8 + i * 23;
        const exists = bits.getInt(itemBitBase, 1);
        const inBag = bits.getInt(itemBitBase + 1, 1);
        const id = bits.getInt(itemBitBase + 3, 9);
        const qty = bits.getInt(itemBitBase + 12, 7);
        res += `Slot ${i}: Exists=${exists}, ID=${id}, Qty=${qty}\n`;
    }
    return res;
}

out += readItems(0x4CF0);  // US
out += readItems(0x4CF4);  // EU ?
out += readItems(0x4CF8);  // Other ?
out += readItems(0x4CFC);

fs.writeFileSync('scan_out2.txt', out);

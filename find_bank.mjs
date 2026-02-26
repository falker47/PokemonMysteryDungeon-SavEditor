import fs from 'fs';

const filePath = 'C:\\Users\\Falker\\Downloads\\test\\Squadra Blu.sav';
const b = fs.readFileSync(filePath);

class Bit {
    constructor(b) { this.b = b; }
    get(i) { return (this.b[Math.floor(i / 8)] >> (i % 8)) & 1; }
    getInt(o, l) {
        let v = 0;
        for (let i = 0; i < l; i++) Math.floor(v |= (this.get(o + i) << i));
        return v;
    }
}
const bits = new Bit(b);

// User has 3 items in bank: Mela (82), Baccaliegia (67), Semedormita (69)
// It's possible the +15 internal offset DOES exist for the BANK but not the Bag?
// Or maybe the bank has a different index layout entirely.
// Let's dump all 10-bit values from 0x4D00 to 0x4E00 that are > 0 and < 50
let baseBytes = 0x4D2B;
let baseEU = 0x4D2F;

for (let base of [baseBytes * 8 - 2, baseEU * 8 + 30, baseBytes * 8, baseEU * 8, baseEU * 8 - 2]) {
    console.log(`\n--- Buffer Base Bit: ${base} (Byte 0x${Math.floor(base / 8).toString(16)}+${base % 8}) ---`);
    let found = [];
    for (let i = 0; i < 240; i++) {
        let qty = bits.getInt(base + i * 10, 10);
        if (qty > 0) {
            found.push(`ID ${i + 1}: ${qty}`);
        }
    }
    console.log(`Found Items: ${found.join(', ')}`);
}


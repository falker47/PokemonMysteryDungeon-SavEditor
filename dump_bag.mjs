import fs from 'fs';
const b = fs.readFileSync('C:/Users/Falker/Downloads/test/Squadra Blu.sav');
class Bit {
    constructor(b) { this.b = b; }
    get(i) { return (this.b[Math.floor(i / 8)] >> (i % 8)) & 1 }
    getInt(o, l) {
        let v = 0;
        for (let i = 0; i < l; i++)v |= (this.get(o + i) << i);
        return v;
    }
}
const bits = new Bit(b);

let base = (0x4CF4 * 8);
let out = '';
for (let i = 0; i < 10; i++) {
    let valid = bits.get(base + i * 23);
    let id_8 = bits.getInt(base + i * 23 + 15, 8);
    let id_9 = bits.getInt(base + i * 23 + 14, 9);
    let id_10 = bits.getInt(base + i * 23 + 13, 10);
    // Rescue team is allegedly 9 bits. If 9 bits, what is it?
    // In legacy it was bits.getInt(0, 3, 9). Which we abandoned because it didn't align.
    let legacy_id = bits.getInt(base + i * 23 + 3, 9);

    // Check old id from 15
    out += `Slot ${i}: Valid=${valid} | 8-bit@15: ${id_8} | 9-bit@14: ${id_9} | 10-bit@13: ${id_10} | Legacy@3: ${legacy_id}\n`;
}
fs.writeFileSync('dump_bag.txt', out);

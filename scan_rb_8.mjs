import fs from 'fs';

const filePath = 'C:\\Users\\Falker\\Downloads\\test\\Squadra Blu.sav';
const buffer = fs.readFileSync(filePath);

let out = "--- Searching for A, B, C, B, A Pattern ---\n";

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

// Method 1: Bytes
for (let stride = 1; stride <= 4; stride++) { // struct size in bytes
    for (let offset = 0; offset < stride; offset++) { // ID offset within struct
        for (let i = 0; i < buffer.length - (5 * stride); i++) {
            let a1 = buffer[i + offset];
            let b1 = buffer[i + stride + offset];
            let c = buffer[i + 2 * stride + offset];
            let b2 = buffer[i + 3 * stride + offset];
            let a2 = buffer[i + 4 * stride + offset];

            // Check palindrome A, B, C, B, A
            if (a1 === a2 && b1 === b2 && a1 !== b1 && a1 !== c && a1 !== 0 && b1 !== 0 && c !== 0) {
                out += `BYTE PALINDROME! Stride=${stride}, Offset=${offset}. Base=0x${i.toString(16)}. Values: ${a1}, ${b1}, ${c}, ${b1}, ${a1}\n`;
            }
        }
    }
}

// Method 2: Bit strides (e.g. 23 bits, 24 bits, 32 bits, 33 bits)
for (let strideBits of [23, 24, 32, 33]) {
    for (let idLen of [8, 9, 10]) {
        for (let idOffset = 0; idOffset < strideBits - idLen; idOffset++) {
            for (let i = 0; i < buffer.length * 8 - (5 * strideBits); i += 8) { // Assuming byte-aligned start of array
                let a1 = bits.getInt(i + idOffset, idLen);
                let b1 = bits.getInt(i + strideBits + idOffset, idLen);
                let c = bits.getInt(i + 2 * strideBits + idOffset, idLen);
                let b2 = bits.getInt(i + 3 * strideBits + idOffset, idLen);
                let a2 = bits.getInt(i + 4 * strideBits + idOffset, idLen);

                if (a1 === a2 && b1 === b2 && a1 !== b1 && a1 !== c && a1 !== 0 && b1 !== 0 && c !== 0) {
                    out += `BIT PALINDROME! StrideBits=${strideBits}, idLen=${idLen}, idOffset=${idOffset}. BaseBit=${i} (Byte=0x${Math.floor(i / 8).toString(16)}). Values: ${a1}, ${b1}, ${c}, ${b1}, ${a1}\n`;
                }
            }
        }
    }
}

fs.writeFileSync('scan_pattern.txt', out);
console.log("Done");

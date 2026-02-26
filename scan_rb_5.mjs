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

console.log("Checking legacy bit structures for 70, 81, 78...");

const searchSeq = [70, 81, 78, 81, 70];

function checkStructure(startByte, strideBits, idStartBit, idLen) {
    let out = `--- Checking at 0x${startByte.toString(16)} with Stride=${strideBits}, ID at ${idStartBit} (len ${idLen}) ---\n`;
    for (let i = 0; i < 10; i++) {
        let bitBase = startByte * 8 + i * strideBits;
        let valid = bits.getInt(bitBase, 1);
        let id = bits.getInt(bitBase + idStartBit, idLen);
        out += `Slot ${i}: Valid=${valid}, ID=${id}\n`;
    }
    console.log(out);
}

// In the current TS, we have: ID at 3, Len 9; Qty at 12, Len 7. Stride 23.
checkStructure(0x4CF4, 23, 3, 9);

// In the C# legacy, we have: Qty at 8, Len 7; ID at 15, Len 8. Stride 23.
checkStructure(0x4CF4, 23, 15, 8);

// In the C# legacy LoadItems, there was briefly a `i * 33` and length `33`.
checkStructure(0x4CF4, 33, 15, 8);
checkStructure(0x4CF4, 33, 3, 9);
checkStructure(0x4CF4, 33, 24, 8); // what if ID is at 24?

// Also check around... maybe +4 bytes
checkStructure(0x4CF8, 23, 15, 8);
checkStructure(0x4CF8, 33, 15, 8);

// Let's do a fast search for the sequence using the C# struct (ID at bit 15, len 8, stride 23)
for (let bitBase = 0; bitBase < buffer.length * 8 - (searchSeq.length * 23); bitBase++) {
    let match = true;
    for (let k = 0; k < searchSeq.length; k++) {
        let idPos = bitBase + (k * 23) + 15;
        if (bits.getInt(idPos, 8) !== searchSeq[k]) {
            match = false;
            break;
        }
    }
    if (match) {
        console.log(`BINGO C# Struct! Base bit: ${bitBase} (Byte 0x${Math.floor(bitBase / 8).toString(16)})`);
    }
}

// Search for sequence with ID at bit 24, len 8, stride 33
for (let bitBase = 0; bitBase < buffer.length * 8 - (searchSeq.length * 33); bitBase++) {
    let match = true;
    for (let k = 0; k < searchSeq.length; k++) {
        let idPos = bitBase + (k * 33) + 24; // assumption
        if (bits.getInt(idPos, 8) !== searchSeq[k]) {
            match = false;
            break;
        }
    }
    if (match) {
        console.log(`BINGO 33-bit Struct! Base bit: ${bitBase} (Byte 0x${Math.floor(bitBase / 8).toString(16)})`);
    }
}

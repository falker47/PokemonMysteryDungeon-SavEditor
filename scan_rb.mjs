import fs from 'fs';

const filePath = 'C:\\Users\\Falker\\Downloads\\test\\Squadra Blu.sav';
const buffer = fs.readFileSync(filePath);

let out = "";
const pocketMoney = 221;
const bankMoney = 459;

for (let i = 0; i < buffer.length - 3; i++) {
    const valLE = buffer.readInt32LE(i) & 0xFFFFFF;
    const val32LE = buffer.readInt32LE(i);
    if (valLE === pocketMoney || val32LE === pocketMoney) {
        out += `Pocket money at: ${i} (0x${i.toString(16)})\n`;
    }
    if (valLE === bankMoney || val32LE === bankMoney) {
        out += `Bank money at: ${i} (0x${i.toString(16)})\n`;
    }
}

// Check items with regular 8-bit increments first
const items = [70, 81, 78, 81, 70];
for (let i = 0; i < buffer.length - items.length * 2; i++) {
    let match1 = true;
    for (let j = 0; j < items.length; j++) {
        // Assume 16-bit struct size, maybe ID is 1st or 2nd byte
        if (buffer[i + (j * 4)] !== items[j]) { // maybe 4 bytes per item
            match1 = false; break;
        }
    }
    if (match1) out += `Item chain (4-byte stride) at: ${i} (0x${i.toString(16)})\n`;

    let match2 = true;
    for (let j = 0; j < items.length; j++) {
        // Assume ID is 10-bit... Wait, DS save format for items is different.
    }
}

fs.writeFileSync('scan_out.txt', out);
console.log("Done");

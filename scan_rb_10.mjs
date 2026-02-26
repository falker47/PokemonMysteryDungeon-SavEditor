import fs from 'fs';

const filePath = 'C:\\Users\\Falker\\Downloads\\test\\Squadra Blu.sav';
const buffer = fs.readFileSync(filePath);

let out = "";
// Let's dump non-zero bytes from 0x4D00 to 0x4F00 to see where the data is
for (let i = 0x4D00; i < 0x4F00; i++) {
    if (buffer[i] !== 0) {
        out += `0x${i.toString(16)}: ${buffer[i]}\n`;
    }
}

fs.writeFileSync('scan_bank.txt', out);

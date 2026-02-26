import fs from 'fs';

const filePath = 'C:\\Users\\Falker\\Downloads\\test\\Squadra Blu.sav';
const buffer = fs.readFileSync(filePath);

let out = "--- Searching for EoS IDs: 108, 114, 111 ---\n";

const skyItems = [108, 114, 111, 114, 108];

// Byte array search
for (let i = 0; i < buffer.length - 20; i++) {
    // Check 1-byte, 2-byte, 4-byte strides
    for (let stride of [1, 2, 3, 4]) {
        let match = true;
        for (let j = 0; j < skyItems.length; j++) {
            if (buffer[i + j * stride] !== skyItems[j]) {
                match = false; break;
            }
        }
        if (match) out += `FOUND EoS IDs! Stride: ${stride} bytes at offset 0x${i.toString(16)}\n`;
    }
}

// Check if they are just close to each other
for (let i = 0; i < buffer.length - 100; i++) {
    if (buffer[i] === 108) {
        for (let j = i + 1; j < i + 50; j++) {
            if (buffer[j] === 114) {
                for (let k = j + 1; k < j + 50; k++) {
                    if (buffer[k] === 111) {
                        out += `Loose Match EoS IDs: 108 at 0x${i.toString(16)}, 114 at 0x${j.toString(16)}, 111 at 0x${k.toString(16)}\n`;
                    }
                }
            }
        }
    }
}

fs.writeFileSync('scan_sky_ids.txt', out);

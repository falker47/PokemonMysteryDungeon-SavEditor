import { BitBlock } from '../utils/BitBlock';
import { CharacterEncoding } from '../utils/CharacterEncoding';
import { RBHeldItem, RBStoredItem } from './RBItem';
import { RBStoredPokemon, RBActivePokemon } from './RBPokemon';
import { SaveFile } from './SaveFile';

export class RBOffsets {
    // Checksums
    get ChecksumEnd(): number { return 0x57D0; }
    get BackupSaveStart(): number { return 0x6000; }

    // General
    get TeamNameStart(): number { return 0x4EC8 * 8; }
    get TeamNameLength(): number { return 10; }
    get BaseTypeOffset(): number { return 0x67 * 8; }
    get HeldMoneyOffset(): number { return 0x4E6C * 8; }
    get HeldMoneyLength(): number { return 24; }
    get StoredMoneyOffset(): number { return 0x4E6F * 8; }
    get StoredMoneyLength(): number { return 24; }
    get RescuePointsOffset(): number { return 0x4ED3 * 8; }
    get RescuePointsLength(): number { return 32; }

    // Stored Items
    get StoredItemOffset(): number { return 0x4D2B * 8 - 2; }
    get StoredItemCount(): number { return 239; }

    // Held Items
    get HeldItemOffset(): number { return 0x4CF0 * 8; }
    get HeldItemCount(): number { return 20; }
    get HeldItemLength(): number { return 23; }
    get HeldItemIDOffset(): number { return 3; }
    get HeldItemIDLength(): number { return 9; }
    get HeldItemQtyOffset(): number { return 12; }
    get HeldItemQtyLength(): number { return 7; }

    // Stored Pokemon
    get StoredPokemonOffset(): number { return (0x5B3 * 8 + 3) - (323 * 9); }
    get StoredPokemonLength(): number { return 323; } // Note: 362 in RBPokemon.ts? Legacy RBSave.cs says 323. RBPokemon defines 362.
    // Wait, Legacy RBStoredPokemon.cs says BitLength = 362.
    // Legacy RBSave.cs says StoredPokemonLength => 323.
    // THIS IS A MAJOR CONFLICT.
    // Let's re-read legacy files carefully.

    get StoredPokemonCount(): number { return 407 + 6; }

    // Active Pokemon (Party)
    get ActivePokemonOffset(): number { return 0x4226 * 8 + 6; }
    get ActivePokemonCount(): number { return 4; }
    get ActivePokemonLength(): number { return 544; }
}

export class RBEUOffsets extends RBOffsets {
    get TeamNameStart(): number { return 0x4ECC * 8; }
    get HeldMoneyOffset(): number { return 0x4E70 * 8; }
    get StoredMoneyOffset(): number { return 0x4E73 * 8; }
    get RescuePointsOffset(): number { return 0x4ED7 * 8; }
    get StoredItemOffset(): number { return 158070; } // Discovered via brute force Bit matching 0x4D36 + 6
    get HeldItemOffset(): number { return 0x4CF4 * 8; }
    get StoredPokemonOffset(): number { return (0x5B7 * 8 + 3) - (323 * 9); }
    get ActivePokemonOffset(): number { return 0x422a * 8 + 6; }
}

export class RBSave implements SaveFile {
    public gameType: 'RescueTeam' = 'RescueTeam';
    public bits: BitBlock;
    public offsets: RBOffsets;

    public static async isOfType(data: Uint8Array): Promise<boolean> {
        if (data.length < 0x57D0) return false;
        const bits = new BitBlock(data);
        const usChecksum = RBSave.calculate32BitChecksumStatic(bits, 4, 0x57D0);
        const fileChecksum = bits.getUInt(0, 0, 32);
        return fileChecksum === usChecksum || fileChecksum === (usChecksum - 1) >>> 0;
    }

    private static calculate32BitChecksumStatic(bits: BitBlock, startIndex: number, endIndex: number): number {
        let sum = 0;
        for (let i = startIndex; i <= endIndex; i += 4) {
            sum += bits.getUInt(0, i * 8, 32);
        }
        return sum >>> 0;
    }

    // Checksums
    public primaryChecksum: number = 0;
    public secondaryChecksum: number = 0;

    // General
    public teamName: string = "";
    public heldMoney: number = 0;
    public storedMoney: number = 0;
    public rescueTeamPoints: number = 0;
    public baseType: number = 0;

    // Lists
    public storedItems: RBStoredItem[] = [];
    public heldItems: RBHeldItem[] = [];
    public storedPokemon: RBStoredPokemon[] = [];
    public activePokemon: RBActivePokemon[] = [];

    constructor(data: Uint8Array) {
        this.bits = new BitBlock(data);
        this.offsets = new RBOffsets();
        this.init();
    }

    private init(): void {
        this.primaryChecksum = this.bits.getUInt(0, 0, 32);
        this.secondaryChecksum = this.bits.getUInt(this.offsets.BackupSaveStart, 0, 32);

        // Detect EU
        const usChecksum = this.calculate32BitChecksum(this.bits, 4, 0x57D0);
        console.log(`RBSave Checksums: File=${this.primaryChecksum.toString(16)}, CalcUS=${usChecksum.toString(16)}`);

        if (this.primaryChecksum === (usChecksum - 1) >>> 0) {
            console.log("RBSave: Auto-detected EU");
            this.offsets = new RBEUOffsets();
        } else {
            console.log("RBSave: Auto-detected US");
        }

        this.reload();
    }

    public setRegion(region: 'US' | 'EU') {
        if (region === 'EU') {
            this.offsets = new RBEUOffsets();
        } else {
            this.offsets = new RBOffsets();
        }
        this.reload();
    }

    private reload() {
        let baseOffset = 0;
        if (!this.isPrimaryChecksumValid() && this.isSecondaryChecksumValid()) {
            baseOffset = this.offsets.BackupSaveStart;
        }

        this.loadGeneral(baseOffset);
        this.loadItems(baseOffset);
        this.loadStoredPokemon(baseOffset);
        this.loadActivePokemon(baseOffset);
    }

    private loadGeneral(baseOffset: number): void {
        const nameBits = this.bits.getRange(baseOffset * 8 + this.offsets.TeamNameStart, this.offsets.TeamNameLength * 8);
        const nameBytes = nameBits.toByteArray();
        this.teamName = CharacterEncoding.decode(nameBytes);

        // Held money, stored money, points, and base type are global (ignored baseOffset in byte index sense, 
        // but offsets themselves are regional). 
        // Legacy: Bits.GetInt(0, Offsets.HeldMoneyOffset, ...)
        this.heldMoney = this.bits.getInt(0, this.offsets.HeldMoneyOffset, this.offsets.HeldMoneyLength);
        this.storedMoney = this.bits.getInt(0, this.offsets.StoredMoneyOffset, this.offsets.StoredMoneyLength);
        this.rescueTeamPoints = this.bits.getInt(0, this.offsets.RescuePointsOffset, this.offsets.RescuePointsLength);
        this.baseType = this.bits.getInt(0, this.offsets.BaseTypeOffset, 8);
    }

    private loadItems(baseOffset: number): void {
        // Stored items are global
        this.storedItems = [];
        const block = this.bits.getRange(this.offsets.StoredItemOffset, this.offsets.StoredItemCount * 10);

        if (this.offsets instanceof RBEUOffsets) console.log("RBSave: EU detected");
        else console.log("RBSave: US detected");

        for (let i = 0; i < this.offsets.StoredItemCount; i++) {
            const quantity = block.getInt(0, i * 10, 10);
            if (i < 10) console.log(`RB Stored ${i} (ID ${i + 1}): Qty=${quantity} (Bits: ${block.getRange(i * 10, 10).bits.map(b => b ? '1' : '0').join('')})`);
            // Bank Logic: ID = i + 1, Value = Quantity
            // We push ALL items so user can edit quantity from 0 to >0
            this.storedItems.push(new RBStoredItem(i + 1, quantity));
        }

        // Held Items use baseOffset
        this.heldItems = [];

        for (let i = 0; i < 20; i++) {
            const itemBits = this.bits.getRange(
                baseOffset * 8 + this.offsets.HeldItemOffset + (i * this.offsets.HeldItemLength),
                this.offsets.HeldItemLength
            );
            const item = new RBHeldItem(itemBits);
            if (item.isValid) {
                this.heldItems.push(item);
            }
        }
    }

    private loadActivePokemon(baseOffset: number): void {
        this.activePokemon = [];
        for (let i = 0; i < this.offsets.ActivePokemonCount; i++) {
            const pkmBits = this.bits.getRange(
                baseOffset * 8 + this.offsets.ActivePokemonOffset + i * this.offsets.ActivePokemonLength,
                this.offsets.ActivePokemonLength
            );
            const pkm = new RBActivePokemon(pkmBits);
            if (pkm.isValid) {
                this.activePokemon.push(pkm);
            }
        }
    }

    private loadStoredPokemon(baseOffset: number): void {
        this.storedPokemon = [];
        for (let i = 0; i < this.offsets.StoredPokemonCount; i++) {
            const pkmBits = this.bits.getRange(
                baseOffset * 8 + this.offsets.StoredPokemonOffset + i * this.offsets.StoredPokemonLength,
                this.offsets.StoredPokemonLength
            );
            // CONFLICT: StoredPokemonLength in Offsets is 323.
            // RBStoredPokemon class says 362.
            // If I read 323 bits, but class expects 362...
            // It will fail or readOutOfBounds if I passed a block of 323?
            // RBStoredPokemon `Initialize`:
            // ...
            // Name at 243, 10 chars -> 80 bits. 243+80 = 323.
            // So 323 IS CORRECT for Rescue Team (no Name at end in same way?).
            // RBStoredPokemon.cs: `Name = bits.GetStringPMD(0, 243, 10);` -> Ends at 323.
            // So `BitLength` 362 in `RBStoredPokemon.cs` is WRONG?
            // Or maybe 362 is for something else?
            // Wait, 362 - 323 = 39.
            // Maybe extra padding?
            // But `GetRange` logic uses `StoredPokemonLength` from offsets (323).
            // So we pass 323 bits.
            // `RBStoredPokemon` reads up to 323.
            // So 323 is the correct length.

            const pkm = new RBStoredPokemon(pkmBits);
            this.storedPokemon.push(pkm);
            if (i < 5) console.log(`RB Pkm ${i}: ID=${pkm.id}, Valid=${pkm.isValid}, Name=${pkm.name}`);
        }
    }

    public toByteArray(): Uint8Array {
        this.saveGeneral(0);
        this.saveItems(0);
        this.saveStoredPokemon(0);
        this.saveActivePokemon(0);

        // Copy backup
        const backupStartBit = this.offsets.BackupSaveStart * 8;
        const copyLength = backupStartBit - 32;
        const sourceData = this.bits.getRange(32, copyLength);
        this.bits.setRange(backupStartBit + 32, copyLength, sourceData);

        // Checksums
        this.primaryChecksum = this.calculatePrimaryChecksum();
        this.bits.setUInt(0, 0, 32, this.primaryChecksum);

        this.secondaryChecksum = this.calculateSecondaryChecksum();
        this.bits.setUInt(this.offsets.BackupSaveStart, 0, 32, this.secondaryChecksum);

        return this.bits.toByteArray();
    }

    private saveGeneral(baseOffset: number): void {
        const nameBytes = CharacterEncoding.encode(this.teamName, this.offsets.TeamNameLength);
        const nameBlock = new BitBlock(nameBytes);
        this.bits.setRange(baseOffset * 8 + this.offsets.TeamNameStart, this.offsets.TeamNameLength * 8, nameBlock);

        // Shared fields: write only to primary (0) offset.
        // Even if saving to backup, legacy logic doesn't use baseOffset for these.
        this.bits.setInt(0, this.offsets.HeldMoneyOffset, this.offsets.HeldMoneyLength, this.heldMoney);
        this.bits.setInt(0, this.offsets.StoredMoneyOffset, this.offsets.StoredMoneyLength, this.storedMoney);
        this.bits.setInt(0, this.offsets.RescuePointsOffset, this.offsets.RescuePointsLength, this.rescueTeamPoints);
        this.bits.setInt(0, this.offsets.BaseTypeOffset, 8, this.baseType);
    }

    private saveItems(baseOffset: number): void {
        const compiledItems: { [id: number]: number } = {};
        for (const item of this.storedItems) {
            if (!compiledItems[item.itemID]) compiledItems[item.itemID] = 0;
            compiledItems[item.itemID] = Math.min(item.quantity + compiledItems[item.itemID], 1024);
        }

        const block = new BitBlock(this.offsets.StoredItemCount * 10);
        for (let i = 0; i < this.offsets.StoredItemCount; i++) {
            const displayId = i + 1;
            const qty = compiledItems[displayId] || 0;
            block.setInt(0, i * 10, 10, qty);
        }

        // Stored items are global
        this.bits.setRange(this.offsets.StoredItemOffset, this.offsets.StoredItemCount * 10, block);

        // Held items handle baseOffset
        for (let i = 0; i < 20; i++) {
            const itemOffset = baseOffset * 8 + this.offsets.HeldItemOffset + (i * this.offsets.HeldItemLength);
            if (i < this.heldItems.length) {
                const itemBits = this.heldItems[i].toBitBlock();
                const bitsStride = new BitBlock(this.offsets.HeldItemLength);
                for (let b = 0; b < this.offsets.HeldItemLength; b++) bitsStride.setBit(b, itemBits.getBit(b));
                this.bits.setRange(itemOffset, this.offsets.HeldItemLength, bitsStride);
            } else {
                this.bits.setRange(itemOffset, this.offsets.HeldItemLength, new BitBlock(this.offsets.HeldItemLength));
            }
        }
    }

    private saveActivePokemon(baseOffset: number): void {
        for (let i = 0; i < this.offsets.ActivePokemonCount; i++) {
            const pkmOffset = baseOffset * 8 + this.offsets.ActivePokemonOffset + i * this.offsets.ActivePokemonLength;
            if (i < this.activePokemon.length) {
                const pkmBits = this.activePokemon[i].toBitBlock();
                this.bits.setRange(pkmOffset, this.offsets.ActivePokemonLength, pkmBits);
            } else {
                // Keep existing data or clear? Usually better to keep if invalid? 
                // But typically we'd clear the ID at least.
                // For now, if fewer than 4, we don't zero the rest to avoid corruption if count is elsewhere.
            }
        }
    }

    private saveStoredPokemon(baseOffset: number): void {
        for (let i = 0; i < this.offsets.StoredPokemonCount; i++) {
            const pkmOffset = baseOffset * 8 + this.offsets.StoredPokemonOffset + i * this.offsets.StoredPokemonLength;
            if (i < this.storedPokemon.length) {
                // RBPokemon returns 362 bits?
                // Offsets.StoredPokemonLength is 323.
                // We MUST use 323.
                // `RBStoredPokemon.toBitBlock()` returns `bitLength` (362).
                // I need to only take the first 323 bits?
                // The Name ends at 323.
                // `Unk2` is 43 bits? 
                // Wait. 323 + ??? = 362. Difference 39.
                // RBStoredPokemon.ts: `Unk2` (43) + `Name` (80) + ...
                // `Name` starts at 243. 243+80 = 323.
                // End of struct is 323.
                // `RBStoredPokemon` logic in `Initialize`: `Unk2 = bits.GetRange(120, 43)`.
                // `Attack1` at 163.
                // 120 + 43 = 163. Correct.
                // `Name` ends at 323.
                // So where does 362 come from?
                // `RBStoredPokemon.cs` defines `BitLength = 362`.
                // But `Initialize` only reads up to 323.
                // So 362 is bogus/unused space or legacy garbage?
                // I will use 323 bits.

                const fullBits = this.storedPokemon[i].toBitBlock();
                const bits323 = new BitBlock(323);
                for (let b = 0; b < 323; b++) bits323.setBit(b, fullBits.getBit(b));
                this.bits.setRange(pkmOffset, 323, bits323);
            } else {
                this.bits.setRange(pkmOffset, 323, new BitBlock(323));
            }
        }
    }

    public calculatePrimaryChecksum(): number {
        const sum = this.calculate32BitChecksum(this.bits, 4, this.offsets.ChecksumEnd);
        return (this.offsets instanceof RBEUOffsets) ? (sum - 1) >>> 0 : sum;
    }

    public calculateSecondaryChecksum(): number {
        const sum = this.calculate32BitChecksum(this.bits, this.offsets.BackupSaveStart + 4, this.offsets.BackupSaveStart + this.offsets.ChecksumEnd);
        return (this.offsets instanceof RBEUOffsets) ? (sum - 1) >>> 0 : sum;
    }

    private calculate32BitChecksum(bits: BitBlock, startIndex: number, endIndex: number): number {
        let sum = 0;
        for (let i = startIndex; i <= endIndex; i += 4) {
            sum += bits.getUInt(0, i * 8, 32);
        }
        return sum >>> 0;
    }

    public isPrimaryChecksumValid(): boolean {
        return this.primaryChecksum === this.calculatePrimaryChecksum();
    }

    public isSecondaryChecksumValid(): boolean {
        return this.secondaryChecksum === this.calculateSecondaryChecksum();
    }

    public scanForName(name: string): number[] {
        if (!name || name.length < 2) return [];
        try {
            const encoded = CharacterEncoding.encode(name, name.length);
            const foundOffsets: number[] = [];

            // Rescue Team names are often stored at bit-offsets or with padding
            // We search byte by byte for the encoded string
            const fileBytes = this.bits.toByteArray();

            for (let i = 0; i < fileBytes.length - encoded.length; i++) {
                let match = true;
                for (let j = 0; j < encoded.length; j++) {
                    if (fileBytes[i + j] !== encoded[j]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    foundOffsets.push(i);
                }
            }
            return foundOffsets;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    public scanForItemSequence(appxIDs: number[]): string[] {
        const results: string[] = [];
        const bitCount = this.bits.count;

        // We try 8, 9, 10, 11, 12, and 16 bit IDs
        for (const idLen of [8, 9, 10, 11, 12, 16]) {
            const idBitOffsets: number[][] = [];
            for (const targetId of appxIDs) {
                const offsets: number[] = [];
                for (let i = 0; i < bitCount - idLen; i++) {
                    if (this.bits.getInt(0, i, idLen) === targetId) {
                        offsets.push(i);
                    }
                }
                idBitOffsets.push(offsets);
            }

            if (idBitOffsets[0].length === 0) continue;

            // Try all possible strides
            const startOffsets = idBitOffsets[0];
            for (const start of startOffsets) {
                // Try many internal offsets
                for (let internalOffset = 0; internalOffset < 32; internalOffset++) {
                    const potentialBase = start - internalOffset;
                    if (potentialBase < 0) continue;

                    // Common strides: 16, 23, 24, 31, 32, 33, 40, 48, 64
                    for (const stride of [16, 23, 24, 31, 32, 33, 40, 48, 64]) {
                        let chainValid = true;
                        for (let k = 1; k < appxIDs.length; k++) {
                            const expectedPos = potentialBase + k * stride + internalOffset;
                            if (!idBitOffsets[k].includes(expectedPos)) {
                                chainValid = false;
                                break;
                            }
                        }
                        if (chainValid) {
                            const byteOffset = Math.floor(potentialBase / 8);
                            const bitRemainder = potentialBase % 8;
                            results.push(`MATCH: ${idLen}-bit ID. Base Bit ${potentialBase} (Byte 0x${byteOffset.toString(16)} + ${bitRemainder}). Stride: ${stride}, ID @ Bit ${internalOffset}`);
                            if (results.length > 30) return results;
                        }
                    }
                }
            }
        }

        if (results.length === 0) return ["No matches found. Try scanning for DIFFERENT IDs (ensure they are in Bag)."];
        return results;
    }

    public scanForMoney(amount: number): string[] {
        const results: string[] = [];
        const fileBytes = this.bits.toByteArray();

        for (let i = 0; i < fileBytes.length - 3; i++) {
            const valLE = fileBytes[i] | (fileBytes[i + 1] << 8) | (fileBytes[i + 2] << 16);
            if (valLE === amount) results.push(`MONEY (LE): 0x${i.toString(16)}`);
            const valBE = (fileBytes[i] << 16) | (fileBytes[i + 1] << 8) | fileBytes[i + 2];
            if (valBE === amount) results.push(`MONEY (BE): 0x${i.toString(16)}`);
        }

        return results.length > 0 ? results : ["No money matches found."];
    }

    public scanForPokemon(level: number, speciesId: number): string[] {
        const results: string[] = [];
        const bitCount = this.bits.count;

        // Search for Level (7 bits) then Species (9 bits)
        // Or Level (8 bits) then Species (16 bits)?

        const scan = (lvlLen: number, spLen: number, gap: number) => {
            for (let i = 0; i < bitCount - (lvlLen + spLen + gap); i++) {
                if (this.bits.getInt(0, i, lvlLen) === level &&
                    this.bits.getInt(0, i + lvlLen + gap, spLen) === speciesId) {
                    const byteOffset = Math.floor(i / 8);
                    const bitRemainder = i % 8;
                    results.push(`POKEMON: Lvl(${lvlLen}b) + Sp(${spLen}b) @ 0x${byteOffset.toString(16)}+${bitRemainder}. Gap: ${gap}b`);
                }
            }
        };

        scan(7, 9, 0); // Standard RB: Lvl(7), Sp(9)
        scan(8, 16, 0); // 16-bit species?
        scan(7, 9, 1); // Maybe a flag between?

        if (results.length === 0) return ["No pokemon matches found."];
        return results;
    }
}

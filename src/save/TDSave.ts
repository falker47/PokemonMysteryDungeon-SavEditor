
import { BitBlock } from '../utils/BitBlock';
import { CharacterEncoding } from '../utils/CharacterEncoding';
import { TDHeldItem } from './TDItem';
import { ExplorersItem } from './ExplorersItem';
import { TDActivePokemon, TDStoredPokemon } from './TDPokemon';
import { SaveFile, GenericItem } from './SaveFile';

export class TDOffsets {
    // Checksums
    get ChecksumEnd(): number { return 0xDC7B; }
    get BackupSaveStart(): number { return 0x10000; }
    get QuicksaveStart(): number { return 0x2E000; }
    get QuicksaveChecksumStart(): number { return 0x2E004; }
    get QuicksaveChecksumEnd(): number { return 0x2E0FF; }

    // General
    get TeamNameStart(): number { return 0x96F7 * 8; }
    get TeamNameLength(): number { return 10; }

    // Held Items
    get HeldItemOffset(): number { return 0x8B71 * 8; }
    get HeldItemCount(): number { return 48; }
    get HeldItemLength(): number { return 31; }

    // Stored Pokemon
    get StoredPokemonOffset(): number { return 0x460 * 8 + 3; }
    get StoredPokemonLength(): number { return 388; }
    get StoredPokemonCount(): number { return 550; }

    // Active Pokemon
    get ActivePokemonOffset(): number { return 0x83CB * 8; }
    get ActivePokemonLength(): number { return 544; }
    get ActivePokemonCount(): number { return 4; }

    // Stored Items (Kangaskhan Warehouse)
    get StoredItemOffset(): number { return 0x8CF4 * 8 + 5; } // bit 288677
    get StoredItemCount(): number { return 1000; }
    get StoredItemBitWidth(): number { return 10; }

    // Money & Rank
    get HeldMoney(): number { return 0x96D6 * 8 + 5; }
    get StoredMoney(): number { return 0x96DC * 8 + 5; }
    get ExplorerRank(): number { return 0x9702 * 8; }
}

export class TDSave implements SaveFile {
    public gameType: 'TimeDarkness' = 'TimeDarkness';
    public bits: BitBlock;
    public offsets: TDOffsets;

    // Checksums
    public primaryChecksum: number = 0;
    public secondaryChecksum: number = 0;
    public quicksaveChecksum: number = 0;

    // General
    public teamName: string = "";
    public heldMoney: number = 0;
    public storedMoney: number = 0;
    public rankPoints: number = 0;

    // List implementations
    public heldItems: TDHeldItem[] = [];
    public storedPokemon: TDStoredPokemon[] = [];
    public activePokemon: TDActivePokemon[] = [];
    public storedItems: GenericItem[] = [];

    constructor(data: Uint8Array) {
        this.bits = new BitBlock(data);
        this.offsets = new TDOffsets();
        this.init();
    }

    private init(): void {
        this.primaryChecksum = this.bits.getUInt(0, 0, 32);
        this.secondaryChecksum = this.bits.getUInt(this.offsets.BackupSaveStart, 0, 32);
        this.quicksaveChecksum = this.bits.getUInt(this.offsets.QuicksaveStart, 0, 32);

        // Validate checksums to determine which save to load?
        // Legacy logic: if primary invalid && secondary valid, use backup.
        let baseOffset = 0;
        if (!this.isPrimaryChecksumValid() && this.isSecondaryChecksumValid()) {
            baseOffset = this.offsets.BackupSaveStart;
        }

        this.loadGeneral(baseOffset);
        this.loadItems(baseOffset);
        this.loadStoredItems(baseOffset);
        this.loadStoredPokemon(baseOffset);
        this.loadActivePokemon(baseOffset);
    }

    private loadGeneral(baseOffset: number): void {
        const nameBits = this.bits.getRange(baseOffset * 8 + this.offsets.TeamNameStart, this.offsets.TeamNameLength * 8);
        const nameBytes = nameBits.toByteArray();
        this.teamName = CharacterEncoding.decode(nameBytes);

        this.heldMoney = this.bits.getInt(baseOffset, this.offsets.HeldMoney, 24);
        this.storedMoney = this.bits.getInt(baseOffset, this.offsets.StoredMoney, 24);
        this.rankPoints = this.bits.getInt(baseOffset, this.offsets.ExplorerRank, 32);
    }

    private loadItems(baseOffset: number): void {
        this.heldItems = [];
        for (let i = 0; i < this.offsets.HeldItemCount; i++) {
            const itemBits = this.bits.getRange(
                baseOffset * 8 + this.offsets.HeldItemOffset + (i * this.offsets.HeldItemLength),
                this.offsets.HeldItemLength
            );
            const item = new TDHeldItem(itemBits);
            if (item.isValid) {
                this.heldItems.push(item);
            } else {
                break;
            }
        }
    }

    private loadStoredItems(baseOffset: number): void {
        this.storedItems = [];
        const start = baseOffset * 8 + this.offsets.StoredItemOffset;
        const bitWidth = this.offsets.StoredItemBitWidth;

        for (let i = 0; i < this.offsets.StoredItemCount; i++) {
            const id = this.bits.getInt(0, start + i * bitWidth, bitWidth);
            if (id > 0) {
                this.storedItems.push(new ExplorersItem(id, 0));
            } else {
                break;
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
            const pkm = new TDStoredPokemon(pkmBits);
            if (pkm.isValid) {
                this.storedPokemon.push(pkm);
            } else {
                break; // Break on first invalid/empty pokemon? Legacy does `break`.
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
            const pkm = new TDActivePokemon(pkmBits);
            if (pkm.isValid) {
                this.activePokemon.push(pkm);
            }
        }
    }

    public toByteArray(): Uint8Array {
        this.saveGeneral(0);
        this.saveItems(0);
        this.saveStoredItems(0);
        this.saveStoredPokemon(0);
        this.saveActivePokemon(0);

        // Copy primary save to backup save
        const backupStartBit = this.offsets.BackupSaveStart * 8;
        const copyLength = backupStartBit - 4;

        const sourceData = this.bits.getRange(4, copyLength);
        this.bits.setRange(backupStartBit + 4, copyLength, sourceData);

        // Checksums
        this.primaryChecksum = this.calculatePrimaryChecksum();
        this.bits.setUInt(0, 0, 32, this.primaryChecksum);

        this.secondaryChecksum = this.calculateSecondaryChecksum();
        this.bits.setUInt(this.offsets.BackupSaveStart, 0, 32, this.secondaryChecksum);

        this.quicksaveChecksum = this.calculateQuicksaveChecksum();
        this.bits.setUInt(this.offsets.QuicksaveStart, 0, 32, this.quicksaveChecksum);

        return this.bits.toByteArray();
    }

    private saveGeneral(baseOffset: number): void {
        const nameBytes = CharacterEncoding.encode(this.teamName, this.offsets.TeamNameLength);
        const nameBlock = new BitBlock(nameBytes);
        this.bits.setRange(baseOffset * 8 + this.offsets.TeamNameStart, this.offsets.TeamNameLength * 8, nameBlock);

        this.bits.setInt(baseOffset, this.offsets.HeldMoney, 24, this.heldMoney);
        this.bits.setInt(baseOffset, this.offsets.StoredMoney, 24, this.storedMoney);
        this.bits.setInt(baseOffset, this.offsets.ExplorerRank, 32, this.rankPoints);
    }

    private saveItems(baseOffset: number): void {
        for (let i = 0; i < this.offsets.HeldItemCount; i++) {
            const itemOffset = baseOffset * 8 + this.offsets.HeldItemOffset + (i * this.offsets.HeldItemLength);
            if (i < this.heldItems.length) {
                this.bits.setRange(itemOffset, this.offsets.HeldItemLength, this.heldItems[i].toBitBlock());
            } else {
                const empty = new TDHeldItem();
                empty.isValid = false;
                this.bits.setRange(itemOffset, this.offsets.HeldItemLength, empty.toBitBlock());
            }
        }
    }

    private saveStoredItems(baseOffset: number): void {
        const start = baseOffset * 8 + this.offsets.StoredItemOffset;
        const bitWidth = this.offsets.StoredItemBitWidth;

        for (let i = 0; i < this.offsets.StoredItemCount; i++) {
            if (i < this.storedItems.length) {
                this.bits.setInt(0, start + i * bitWidth, bitWidth, this.storedItems[i].id);
            } else {
                this.bits.setInt(0, start + i * bitWidth, bitWidth, 0);
            }
        }
    }

    private saveStoredPokemon(baseOffset: number): void {
        for (let i = 0; i < this.offsets.StoredPokemonCount; i++) {
            const pkmOffset = baseOffset * 8 + this.offsets.StoredPokemonOffset + i * this.offsets.StoredPokemonLength;
            if (i < this.storedPokemon.length) {
                this.bits.setRange(pkmOffset, this.offsets.StoredPokemonLength, this.storedPokemon[i].toBitBlock());
            } else {
                const empty = new TDStoredPokemon();
                empty.isValid = false;
                this.bits.setRange(pkmOffset, this.offsets.StoredPokemonLength, new BitBlock(this.offsets.StoredPokemonLength));
            }
        }
    }

    private saveActivePokemon(baseOffset: number): void {
        for (let i = 0; i < this.offsets.ActivePokemonCount; i++) {
            const pkmOffset = baseOffset * 8 + this.offsets.ActivePokemonOffset + i * this.offsets.ActivePokemonLength;
            if (i < this.activePokemon.length) {
                this.bits.setRange(pkmOffset, this.offsets.ActivePokemonLength, this.activePokemon[i].toBitBlock());
            } else {
                this.bits.setRange(pkmOffset, this.offsets.ActivePokemonLength, new BitBlock(this.offsets.ActivePokemonLength));
            }
        }
    }

    public calculatePrimaryChecksum(): number {
        return this.calculate32BitChecksum(this.bits, 4, this.offsets.ChecksumEnd);
    }

    public calculateSecondaryChecksum(): number {
        return this.calculate32BitChecksum(this.bits, this.offsets.BackupSaveStart + 4, this.offsets.BackupSaveStart + this.offsets.ChecksumEnd);
    }

    public calculateQuicksaveChecksum(): number {
        return this.calculate32BitChecksum(this.bits, this.offsets.QuicksaveChecksumStart, this.offsets.QuicksaveChecksumEnd);
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

    public scanForValue(value: number, bitLength: number): number[] {
        const results: number[] = [];
        const startBit = 0x9000 * 8;
        const endBit = 0xA000 * 8;

        for (let i = startBit; i < endBit; i++) {
            if (this.bits.getInt(0, i, bitLength) === value) {
                results.push(i);
            }
        }
        return results;
    }
}

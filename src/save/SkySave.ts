import { BitBlock } from '../utils/BitBlock';
import { CharacterEncoding } from '../utils/CharacterEncoding';
import { SkyHeldItem, ExplorersItem } from './ExplorersItem';
import { SkyStoredPokemon, ExplorersPokemonId } from './SkyPokemon';
import { SkyActivePokemon } from './SkyActivePokemon';
import { SkyQuicksavePokemon } from './SkyQuicksavePokemon';
import { SaveFile } from './SaveFile';

export class SkyOffsets {
    get BackupSaveStart(): number { return 0xC800; }
    get ChecksumEnd(): number { return 0xB65A; }
    get QuicksaveStart(): number { return 0x19000; }
    get QuicksaveChecksumStart(): number { return 0x19004; }
    get QuicksaveChecksumEnd(): number { return 0x1E7FF; }

    get TeamNameStart(): number { return 0x994E * 8; }
    get TeamNameLength(): number { return 10; }
    get HeldMoney(): number { return 0x990C * 8 + 6; }
    get SpEpisodeHeldMoney(): number { return 0x990F * 8 + 6; }
    get StoredMoney(): number { return 0x9915 * 8 + 6; }
    get NumberOfAdventures(): number { return 0x8B70 * 8; }
    get ExplorerRank(): number { return 0x9958 * 8; }

    get StoredItemOffset(): number { return 0x8E0C * 8 + 6; }
    get HeldItemOffset(): number { return 0x8BA2 * 8; }

    get StoredPokemonOffset(): number { return 0x464 * 8; }
    get StoredPokemonLength(): number { return 362; }
    get StoredPokemonCount(): number { return 720; }

    // Active Pokemon
    get ActivePokemon1RosterIndexOffset(): number { return 0x83D1 * 8 + 1; }
    get ActivePokemon2RosterIndexOffset(): number { return 0x83D3 * 8 + 1; }
    get ActivePokemon3RosterIndexOffset(): number { return 0x83D5 * 8 + 1; }
    get ActivePokemon4RosterIndexOffset(): number { return 0x83D7 * 8 + 1; }
    get ActivePokemonOffset(): number { return 0x83D9 * 8 + 1; }
    get SpActivePokemonOffset(): number { return 0x84F4 * 8 + 2; }
    get ActivePokemonLength(): number { return 546; }
    get ActivePokemonCount(): number { return 4; }

    get QuicksavePokemonCount(): number { return 20; }
    get QuicksavePokemonLength(): number { return 429 * 8; }
    get QuicksavePokemonOffset(): number { return 0x19000 * 8 + (0x3170 * 8); }

    get OriginalPlayerID(): number { return 0xBE * 8; }
    get OriginalPartnerID(): number { return 0xC0 * 8; }
    get OriginalPlayerName(): number { return 0x13F * 8; }
    get OriginalPartnerName(): number { return 0x149 * 8; }

    get WindowFrameType(): number { return 0x995F * 8 + 5; }
}

export class SkySave implements SaveFile {
    public gameType: 'Sky' = 'Sky';
    public bits: BitBlock;
    public offsets: SkyOffsets;

    // Checksums
    public primaryChecksum: number = 0;
    public secondaryChecksum: number = 0;
    public quicksaveChecksum: number = 0;

    // General Data
    public teamName: string = "";
    public heldMoney: number = 0;
    public storedMoney: number = 0;
    public numberOfAdventures: number = 0;
    public explorerRankPoints: number = 0;

    // Lists
    public storedItems: ExplorersItem[] = [];
    public heldItems: SkyHeldItem[] = [];
    public spEpisodeHeldItems: SkyHeldItem[] = [];
    public friendRescueHeldItems: SkyHeldItem[] = [];
    public storedPokemon: SkyStoredPokemon[] = [];
    public activePokemon: SkyActivePokemon[] = [];
    public spEpisodeActivePokemon: SkyActivePokemon[] = [];
    public quicksavePokemon: SkyQuicksavePokemon[] = [];

    // History
    public originalPlayerId: ExplorersPokemonId = new ExplorersPokemonId();
    public originalPartnerId: ExplorersPokemonId = new ExplorersPokemonId();
    public originalPlayerName: string = "";
    public originalPartnerName: string = "";

    // Settings
    public windowFrameType: number = 0;

    constructor(data: Uint8Array) {
        this.bits = new BitBlock(data);
        this.offsets = new SkyOffsets();
        this.init();
    }

    private init(): void {
        this.primaryChecksum = this.bits.getUInt(0, 0, 32);
        this.secondaryChecksum = this.bits.getUInt(this.offsets.BackupSaveStart, 0, 32);
        this.quicksaveChecksum = this.bits.getUInt(this.offsets.QuicksaveStart, 0, 32);

        this.loadGeneral(0); // Using 0 base offset
        this.loadItems(0);
        this.loadStoredPokemon(0);
        this.loadActivePokemon(0);
        this.loadQuicksavePokemon(0);
        this.loadHistory(0);
        this.loadSettings(0);
    }

    private loadGeneral(baseOffset: number): void {
        const nameBits = this.bits.getRange(baseOffset * 8 + this.offsets.TeamNameStart, this.offsets.TeamNameLength * 8);
        const nameBytes = nameBits.toByteArray();
        this.teamName = CharacterEncoding.decode(nameBytes);

        this.heldMoney = this.bits.getInt(baseOffset, this.offsets.HeldMoney, 24);
        this.storedMoney = this.bits.getInt(baseOffset, this.offsets.StoredMoney, 24);
        this.numberOfAdventures = this.bits.getInt(baseOffset, this.offsets.NumberOfAdventures, 32);
        this.explorerRankPoints = this.bits.getInt(baseOffset, this.offsets.ExplorerRank, 32);
    }

    private loadItems(baseOffset: number): void {
        this.storedItems = [];

        const storedItemStart = baseOffset * 8 + this.offsets.StoredItemOffset;
        const idsBlock = this.bits.getRange(storedItemStart, 11 * 1000);
        const paramsBlock = this.bits.getRange(storedItemStart + (11 * 1000), 11 * 1000);

        idsBlock.position = 0;
        paramsBlock.position = 0;

        for (let i = 0; i < 1000; i++) {
            const id = idsBlock.getNextInt(11);
            const param = paramsBlock.getNextInt(11);
            if (id > 0) {
                this.storedItems.push(new ExplorersItem(id, param));
            } else {
                break;
            }
        }

        this.heldItems = [];
        this.spEpisodeHeldItems = [];
        this.friendRescueHeldItems = [];

        // - Main Game (0-49)
        for (let i = 0; i < 50; i++) {
            const itemBits = this.bits.getRange(baseOffset * 8 + this.offsets.HeldItemOffset + (i * 33), 33);
            const item = new SkyHeldItem(itemBits);
            if (item.isValid) {
                this.heldItems.push(item);
            } else {
                break;
            }
        }

        // - Sp. Episode (50-99)
        for (let i = 50; i < 100; i++) {
            const itemBits = this.bits.getRange(baseOffset * 8 + this.offsets.HeldItemOffset + (i * 33), 33);
            const item = new SkyHeldItem(itemBits);
            if (item.isValid) {
                this.spEpisodeHeldItems.push(item);
            } else {
                break;
            }
        }

        // - Friend Rescue (100-149)
        for (let i = 100; i < 150; i++) {
            const itemBits = this.bits.getRange(baseOffset * 8 + this.offsets.HeldItemOffset + (i * 33), 33);
            const item = new SkyHeldItem(itemBits);
            if (item.isValid) {
                this.friendRescueHeldItems.push(item);
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
            const pkm = new SkyStoredPokemon(pkmBits);
            if (pkm.isValid) {
                this.storedPokemon.push(pkm);
            } else {
                break;
            }
        }
    }

    private loadActivePokemon(baseOffset: number): void {
        this.activePokemon = [];
        this.spEpisodeActivePokemon = [];

        for (let i = 0; i < this.offsets.ActivePokemonCount; i++) {
            const mainBits = this.bits.getRange(
                baseOffset * 8 + this.offsets.ActivePokemonOffset + i * this.offsets.ActivePokemonLength,
                this.offsets.ActivePokemonLength
            );
            const main = new SkyActivePokemon(mainBits);
            if (main.isValid) {
                this.activePokemon.push(main);
            }

            const spBits = this.bits.getRange(
                baseOffset * 8 + this.offsets.SpActivePokemonOffset + i * this.offsets.ActivePokemonLength,
                this.offsets.ActivePokemonLength
            );
            const special = new SkyActivePokemon(spBits);
            if (special.isValid) {
                this.spEpisodeActivePokemon.push(special);
            }
        }
    }

    // --- SAVING LOGIC ---

    public toByteArray(): Uint8Array {
        // We write back to existing bits to preserve unknown data
        this.saveGeneral(0);
        this.saveItems(0);
        this.saveStoredPokemon(0);
        this.saveActivePokemon(0);
        this.saveHistory(0);
        this.saveSettings(0);
        this.saveQuicksavePokemon();

        this.saveQuicksavePokemon();

        // Copy primary save to backup save (0x4 to BackupSaveStart-4 copied to BackupSaveStart+4)
        // Legacy: Bits.SetRange(Offsets.BackupSaveStart * 8 + 4, Bits.GetRange(4, Offsets.BackupSaveStart * 8 - 4));
        // JS BitBlock offsets are in bits.
        // BackupSaveStart is byte offset 0xC800.
        // Source: 4 bits? No, 0x4 bytes?
        // Legacy C# OpenFile adds 6 bits padding? No, that's Quicksave.
        // Legacy PreSave: Bits.SetRange(Offsets.BackupSaveStart * 8 + 4, Bits.GetRange(4, Offsets.BackupSaveStart * 8 - 4));
        // In C# BitBlock, indices are bits.
        // So 4 bits?
        // Wait, Checksum is 4 bytes (32 bits).
        // PrimaryChecksum is at 0x0.
        // The save data starts after checksum?
        // `Calculate32BitChecksum(Bits, 4, Offsets.ChecksumEnd)` -> 4 bytes.
        // So the range to copy starts at byte 4 (bit 32).
        // Length: (BackupSaveStart) - 4 bytes.
        // Target: BackupSaveStart + 4 bytes.

        // Wait, legacy says `Offsets.BackupSaveStart * 8 + 4`. That's 4 bits offset if `* 8` was base.
        // But `BackupSaveStart` is 0xC800. 0xC800 * 8 = 409600 bits.
        // `+ 4` bits?
        // If it was bytes it would be `+ 32`.
        // Let's check `Calculate32BitChecksum` usage: `Calculate32BitChecksum(Bits, 4, ...)` where 2nd arg is `startIndex` in bytes?
        // `for (let i = startIndex; i <= endIndex; i += 4) { sum += bits.getUInt(0, i * 8, 32); }`
        // So `startIndex` is BYTES.
        // In PreSave: `Bits.SetRange(Offsets.BackupSaveStart * 8 + 4, Bits.GetRange(4, Offsets.BackupSaveStart * 8 - 4));`
        // In C# `BitBlock`, `SetRange(int index, BitBlock block)` -> index is bits.
        // `GetRange(int index, int length)` -> index is bits.
        // So `Offsets.BackupSaveStart * 8 + 4` means 4 bits offset?
        // Why 4 bits?
        // Maybe C# code implies `Offsets.BackupSaveStart` is bytes, so `* 8` is bits.
        // But `+ 4`?
        // If checksum is 32 bits, it usually takes 32 bits (0-31).
        // If we skip checksum, we start at 32.
        // If legacy code says `+ 4`, maybe it means 4 bits?
        // But `Calculate32BitChecksum` starts at 4 bytes (32 bits).
        // If we copy starting at 4 bits, we include most of the checksum?
        // That seems wrong.
        // Let's look closely at Legacy `SkySave.cs`:
        // `Bits.SetRange(Offsets.BackupSaveStart * 8 + 4, Bits.GetRange(4, Offsets.BackupSaveStart * 8 - 4));`
        // `CalculatePrimaryChecksum` calls `Calculate32BitChecksum(Bits, 4, Offsets.ChecksumEnd)`.
        // `Calculate32BitChecksum(..., int startIndex, ...)`
        // `for (int i = startIndex; i < endIndex; i += 4) { ... Bits.GetUInt(i * 8, ...)`
        // So `startIndex` passed to `Calculate` is in BYTES.
        // But `SetRange` takes BITS.
        // `GetRange` takes BITS.
        // `GetRange(4, ...)` gets from bit 4.
        // This implies the backup copy is shifted by 4 bits?
        // Or specific alignment?
        // "matix2267's convention adds 6 bits to the beginning of a file" -> that's for Quicksave.
        // For main save?
        // Maybe the checksum is only 4 bits? No, `GetUInt(..., 32)`.

        // Wait, `Offsets.BackupSaveStart * 8 + 4` matches `Bits.GetRange(4, ...)`
        // If they both have `+4` (or `4` as index), maybe it's preserving a 4-bit alignment or header?
        // 0xC800 is 51200.
        // 0xC800 * 8 = 409600.
        // Checksum is at 0.
        // If we copy from bit 4, we copy 28 bits of checksum + potential data?
        // This looks extremely like a typo in C# or my understanding of C# BitBlock.
        // But `Calculate32BitChecksum` uses `i * 8`, so it expects bytes.
        // `PrimaryChecksum` is `Bits.GetUInt(0, 0, 32)` -> Bit 0, 32 bits.
        // So Checksum is bits 0-31.
        // If we copy range starting at 4... we copy bits 4-31 (part of checksum) and then data?
        // That effectively shifts the data by 4 bits if we wrote it index 0?
        // But we write to `BackupSaveStart * 8 + 4`.
        // So bit 4 goes to bit (BackupStart*8 + 4).
        // Bit 0, 1, 2, 3 are NOT copied.
        // Bit 0, 1, 2, 3 of Backup are skipped.
        // But Checksum is bits 0-31.
        // Backup Checksum is `Offsets.BackupSaveStart`.
        // `SecondaryChecksum = Bits.GetUInt(Offsets.BackupSaveStart, 0, 32);` -> At byte `BackupSaveStart`?
        // `GetUInt(int byteOffset, int bitOffset, int length)`
        // `GetUInt(Offsets.BackupSaveStart, 0, 32)` -> Byte `0xC800`, bit 0.
        // So Secondary Checksum is at `0xC800` bytes (bit `0xC800 * 8` = 409600).
        // If we copy to `0xC800 * 8 + 4`, we are overwriting part of Secondary Checksum (bits 4-31) and beyond.
        // This means the Secondary Checksum calculation `GetUInt(Offsets.BackupSaveStart, 0, 32)` reads the checksum.
        // But if we overwrite it with data from `GetRange(4, ...)`, we are copying Primary's bits 4-31 into Secondary's bits 4-31.
        // Effectively, we are copying the Primary Save (including Checksum bits 4-31) to Backup Save position.
        // And then `RecalculateChecksums` writes the *correct* checksums at 0-31.
        // `Bits.SetUInt(Offsets.BackupSaveStart, 0, 32, SecondaryChecksum);` -> Writes full 32 bits at `BackupSaveStart`.
        // So the `+4` copy is overwriting bits 4-end of the backup area.
        // And `SetUInt` overwrites bits 0-31.
        // So bits 0-3 are NOT touched by the copy.
        // And bits 0-3 of Primary were not copied?
        // `GetRange(4, ...)` starts at bit 4.
        // So bits 0-3 of Primary are effectively ignored/not copied.
        // But those are part of Primary Checksum.
        // Backup Checksum (bits 0-3) is written by `SetUInt`.
        // So effectively, the copy replicates the data body *and* the checksum (partially), but the checksum is overwritten anyway.
        // The real question is: Does the data start at bit 4? No, data starts later.
        // Why start copying at bit 4?
        // Maybe to align?
        // If I assume this logic is correct for legacy, I should copy it.
        // Range length: `Offsets.BackupSaveStart * 8 - 4` bits.
        // Source start: 4.
        // End source: 4 + (BackupSaveStart * 8 - 4) = BackupSaveStart * 8.
        // This covers exactly the range from bit 4 to the start of BackupSave.
        // And destination: (BackupSaveStart * 8) + 4.
        // End destination: (BackupSaveStart * 8) + 4 + (BackupSaveStart * 8 - 4) = 2 * BackupSaveStart * 8.
        // This logic seems explicitly to safeguard bits 0-3 of both areas?
        // I will replicate it exactly.

        const backupStartBit = this.offsets.BackupSaveStart * 8; // 0xC800 * 8
        const copyLength = backupStartBit - 4;
        const sourceData = this.bits.getRange(4, copyLength);
        this.bits.setRange(backupStartBit + 4, copyLength, sourceData);

        // Recalculate checksums
        this.primaryChecksum = this.calculatePrimaryChecksum();
        this.bits.setUInt(0, 0, 32, this.primaryChecksum);

        // Secondary Checksum
        // Legacy: CalculateSecondaryChecksum() -> Calculate32BitChecksum(Bits, Offsets.BackupSaveStart + 4, Offsets.BackupSaveStart + Offsets.ChecksumEnd);
        // BackupSaveStart+4 is BYTES (0xC804).
        // ChecksumEnd is 0xB65A.
        // End: 0xC800 + 0xB65A.

        // Wait, why BackupSaveStart + 4 bytes?
        // Primary Checksum calc starts at 4 bytes (after checksum).
        // So Secondary Checksum calc starts at 4 bytes after Secondary Checksum.
        // Secondary Checksum is at 0xC800.
        // So start at 0xC804.
        // Makes sense.

        this.secondaryChecksum = this.calculate32BitChecksum(this.bits, this.offsets.BackupSaveStart + 4, this.offsets.BackupSaveStart + this.offsets.ChecksumEnd);
        this.bits.setUInt(this.offsets.BackupSaveStart, 0, 32, this.secondaryChecksum);

        // Quicksave Checksum
        // Legacy: CalculateQuicksaveChecksum() -> Calculate32BitChecksum(Bits, Offsets.QuicksaveChecksumStart, Offsets.QuicksaveChecksumEnd);
        // QuicksaveChecksumStart = 0x19004.
        // QuicksaveStart = 0x19000.
        // Checksum is at 0x19000? 
        // `QuicksaveChecksum = Bits.GetUInt(Offsets.QuicksaveStart, 0, 32);` -> 0x19000.
        // Start calculation at 0x19004. Correct.
        this.quicksaveChecksum = this.calculate32BitChecksum(this.bits, this.offsets.QuicksaveChecksumStart, this.offsets.QuicksaveChecksumEnd);
        this.bits.setUInt(this.offsets.QuicksaveStart, 0, 32, this.quicksaveChecksum);

        // Return full array
        return this.bits.toByteArray();
    }

    private saveGeneral(baseOffset: number): void {
        // Team Name
        const nameBytes = CharacterEncoding.encode(this.teamName, this.offsets.TeamNameLength);
        const nameBlock = new BitBlock(nameBytes);
        this.bits.setRange(baseOffset * 8 + this.offsets.TeamNameStart, this.offsets.TeamNameLength * 8, nameBlock);

        this.bits.setInt(baseOffset, this.offsets.HeldMoney, 24, this.heldMoney);
        this.bits.setInt(baseOffset, this.offsets.StoredMoney, 24, this.storedMoney);
        this.bits.setInt(baseOffset, this.offsets.NumberOfAdventures, 32, this.numberOfAdventures);
        this.bits.setInt(baseOffset, this.offsets.ExplorerRank, 32, this.explorerRankPoints);
    }

    private saveItems(baseOffset: number): void {
        // Stored Items
        const storedItemStart = baseOffset * 8 + this.offsets.StoredItemOffset;
        // Wipes existing logical space, but likely fine to overwrite
        // We need 1000 items worth of space for IDs and Params
        const idsBlock = new BitBlock(11 * 1000);
        const paramsBlock = new BitBlock(11 * 1000);

        for (let i = 0; i < 1000; i++) {
            if (i < this.storedItems.length) {
                idsBlock.setNextInt(11, this.storedItems[i].id);
                paramsBlock.setNextInt(11, this.storedItems[i].parameter);
            } else {
                idsBlock.setNextInt(11, 0);
                paramsBlock.setNextInt(11, 0);
            }
        }

        this.bits.setRange(storedItemStart, 11 * 1000, idsBlock);
        this.bits.setRange(storedItemStart + (11 * 1000), 11 * 1000, paramsBlock);

        // Held Items (Main Game)
        for (let i = 0; i < 50; i++) {
            const itemOffset = baseOffset * 8 + this.offsets.HeldItemOffset + (i * 33);
            if (i < this.heldItems.length) {
                this.bits.setRange(itemOffset, 33, this.heldItems[i].toBitBlock());
            } else {
                const empty = new SkyHeldItem();
                empty.isValid = false;
                this.bits.setRange(itemOffset, 33, empty.toBitBlock());
            }
        }

        // Sp. Episode Held Items
        for (let i = 0; i < 50; i++) {
            const itemOffset = baseOffset * 8 + this.offsets.HeldItemOffset + ((i + 50) * 33);
            if (i < this.spEpisodeHeldItems.length) {
                this.bits.setRange(itemOffset, 33, this.spEpisodeHeldItems[i].toBitBlock());
            } else {
                const empty = new SkyHeldItem();
                empty.isValid = false;
                this.bits.setRange(itemOffset, 33, empty.toBitBlock());
            }
        }

        // Friend Rescue Held Items
        for (let i = 0; i < 50; i++) {
            const itemOffset = baseOffset * 8 + this.offsets.HeldItemOffset + ((i + 100) * 33);
            if (i < this.friendRescueHeldItems.length) {
                this.bits.setRange(itemOffset, 33, this.friendRescueHeldItems[i].toBitBlock());
            } else {
                const empty = new SkyHeldItem();
                empty.isValid = false;
                this.bits.setRange(itemOffset, 33, empty.toBitBlock());
            }
        }
    }

    private saveStoredPokemon(baseOffset: number): void {
        for (let i = 0; i < this.offsets.StoredPokemonCount; i++) {
            const pkmOffset = baseOffset * 8 + this.offsets.StoredPokemonOffset + i * this.offsets.StoredPokemonLength;
            if (i < this.storedPokemon.length) {
                this.bits.setRange(pkmOffset, this.offsets.StoredPokemonLength, this.storedPokemon[i].toBitBlock());
            } else {
                // Write invalid
                const empty = new SkyStoredPokemon();
                empty.isValid = false;
                this.bits.setRange(pkmOffset, this.offsets.StoredPokemonLength, empty.toBitBlock());
            }
        }
    }

    private saveActivePokemon(baseOffset: number): void {
        // Update Roster Indices
        // 1
        const roster1 = this.activePokemon.length > 0 ? this.activePokemon[0].rosterNumber : -1;
        this.bits.setInt(baseOffset, this.offsets.ActivePokemon1RosterIndexOffset, 16, roster1);

        // 2
        const roster2 = this.activePokemon.length > 1 ? this.activePokemon[1].rosterNumber : -1;
        this.bits.setInt(baseOffset, this.offsets.ActivePokemon2RosterIndexOffset, 16, roster2);

        // 3
        const roster3 = this.activePokemon.length > 2 ? this.activePokemon[2].rosterNumber : -1;
        this.bits.setInt(baseOffset, this.offsets.ActivePokemon3RosterIndexOffset, 16, roster3);

        // 4
        const roster4 = this.activePokemon.length > 3 ? this.activePokemon[3].rosterNumber : -1;
        this.bits.setInt(baseOffset, this.offsets.ActivePokemon4RosterIndexOffset, 16, roster4);

        for (let i = 0; i < this.offsets.ActivePokemonCount; i++) {
            // Main
            const mainOffset = baseOffset * 8 + this.offsets.ActivePokemonOffset + i * this.offsets.ActivePokemonLength;
            if (i < this.activePokemon.length) {
                this.bits.setRange(mainOffset, this.offsets.ActivePokemonLength, this.activePokemon[i].toBitBlock());
            } else {
                const empty = new SkyActivePokemon();
                empty.isValid = false;
                this.bits.setRange(mainOffset, this.offsets.ActivePokemonLength, empty.toBitBlock());
            }

            // Special Episode
            const spOffset = baseOffset * 8 + this.offsets.SpActivePokemonOffset + i * this.offsets.ActivePokemonLength;
            if (i < this.spEpisodeActivePokemon.length) {
                this.bits.setRange(spOffset, this.offsets.ActivePokemonLength, this.spEpisodeActivePokemon[i].toBitBlock());
            } else {
                const empty = new SkyActivePokemon();
                empty.isValid = false;
                this.bits.setRange(spOffset, this.offsets.ActivePokemonLength, empty.toBitBlock());
            }
        }
    }

    // History
    private loadHistory(baseOffset: number): void {
        this.originalPlayerId = new ExplorersPokemonId(this.bits.getInt(baseOffset, this.offsets.OriginalPlayerID, 16));
        this.originalPartnerId = new ExplorersPokemonId(this.bits.getInt(baseOffset, this.offsets.OriginalPartnerID, 16));

        const playerNameBytes = this.bits.getRange(baseOffset * 8 + this.offsets.OriginalPlayerName, 10 * 8).toByteArray();
        this.originalPlayerName = CharacterEncoding.decode(playerNameBytes);

        const partnerNameBytes = this.bits.getRange(baseOffset * 8 + this.offsets.OriginalPartnerName, 10 * 8).toByteArray();
        this.originalPartnerName = CharacterEncoding.decode(partnerNameBytes);
    }

    private saveHistory(baseOffset: number): void {
        this.bits.setInt(baseOffset, this.offsets.OriginalPlayerID, 16, this.originalPlayerId.rawID);
        this.bits.setInt(baseOffset, this.offsets.OriginalPartnerID, 16, this.originalPartnerId.rawID);

        const playerNameBytes = CharacterEncoding.encode(this.originalPlayerName, 10);
        const nameBlock = new BitBlock(playerNameBytes);
        this.bits.setRange(baseOffset * 8 + this.offsets.OriginalPlayerName, 10 * 8, nameBlock);

        const partnerNameBytes = CharacterEncoding.encode(this.originalPartnerName, 10);
        const partnerNameBlock = new BitBlock(partnerNameBytes);
        this.bits.setRange(baseOffset * 8 + this.offsets.OriginalPartnerName, 10 * 8, partnerNameBlock);
    }

    // Settings
    private loadSettings(baseOffset: number): void {
        this.windowFrameType = this.bits.getInt(baseOffset, this.offsets.WindowFrameType, 3) + 1;
    }

    private saveSettings(baseOffset: number): void {
        let val = this.windowFrameType - 1;
        if (val < 0) val = 0;
        if (val > 4) val = 4;
        this.bits.setInt(baseOffset, this.offsets.WindowFrameType, 3, val);
    }

    private loadQuicksavePokemon(baseOffset: number): void {
        this.quicksavePokemon = [];
        for (let i = 0; i < this.offsets.QuicksavePokemonCount; i++) {
            const pkmBits = this.bits.getRange(
                baseOffset * 8 + this.offsets.QuicksavePokemonOffset + i * this.offsets.QuicksavePokemonLength,
                this.offsets.QuicksavePokemonLength
            );
            this.quicksavePokemon.push(new SkyQuicksavePokemon(pkmBits));
        }
    }

    private saveQuicksavePokemon(): void {
        for (let i = 0; i < this.offsets.QuicksavePokemonCount; i++) {
            const pkmOffset = this.offsets.QuicksavePokemonOffset + i * this.offsets.QuicksavePokemonLength;
            if (i < this.quicksavePokemon.length) {
                this.bits.setRange(pkmOffset, this.offsets.QuicksavePokemonLength, this.quicksavePokemon[i].toBitBlock());
            } else {
                this.bits.setRange(pkmOffset, this.offsets.QuicksavePokemonLength, new BitBlock(this.offsets.QuicksavePokemonLength));
            }
        }
    }

    public calculatePrimaryChecksum(): number {
        return this.calculate32BitChecksum(this.bits, 4, this.offsets.ChecksumEnd);
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
        return this.secondaryChecksum === this.calculate32BitChecksum(this.bits, this.offsets.BackupSaveStart + 4, this.offsets.BackupSaveStart + this.offsets.ChecksumEnd);
    }

    // --- SYNC LOGIC ---

    public syncPokemonAttributes(source: SkyStoredPokemon | SkyActivePokemon, target: SkyStoredPokemon | SkyActivePokemon): void {
        // Copy shareable attributes
        target.nickname = source.nickname;
        target.level = source.level;
        target.exp = source.exp;
        target.iq = source.iq;

        target.hp = source.hp; // For Active, this is CurrentHP. For Stored, it is MaxHP (mostly).
        // Actually Stored HP is usually MaxHP. Active has Current and Max.
        // If syncing Stored -> Active: Active.MaxHP = Stored.HP
        // If syncing Active -> Stored: Stored.HP = Active.MaxHP

        if (target instanceof SkyActivePokemon && source instanceof SkyStoredPokemon) {
            target.maxHP = source.hp;
            target.currentHP = source.hp; // Heal on sync? Or keep current? Let's full sync.
            target.speciesId = source.speciesId;
            target.attack = source.attack;
            target.defense = source.defense;
            target.spAttack = source.spAttack;
            target.spDefense = source.spDefense;
            // Moves
            for (let i = 0; i < 4; i++) {
                if (i < source.moves.length) {
                    target.moves[i].id = source.moves[i].id;
                    target.moves[i].powerBoost = source.moves[i].powerBoost;
                    // Active moves have PP, stored don't (conceptually). Stored imply max PP?
                    // We can't easily guess MaxPP without a database.
                    // For now, keep existing PP or set to arbitrary?
                    // Let's leave PP alone or set to 0 if ID changed?
                }
            }
        } else if (target instanceof SkyStoredPokemon && source instanceof SkyActivePokemon) {
            target.hp = source.maxHP;
            target.speciesId = source.speciesId;
            target.attack = source.attack;
            target.defense = source.defense;
            target.spAttack = source.spAttack;
            target.spDefense = source.spDefense;
            // Moves
            for (let i = 0; i < 4; i++) {
                if (i < source.moves.length) {
                    target.moves[i].id = source.moves[i].id;
                    target.moves[i].powerBoost = source.moves[i].powerBoost;
                }
            }
        }
    }
}

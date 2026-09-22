import { RBSave } from './RBSave';
import { SaveFile } from './SaveFile';
import { SkySave } from './SkySave';
import { TDSave } from './TDSave';

interface SaveCandidate<T extends SaveFile> {
    minLength: number;
    create: (data: Uint8Array) => T;
    hasValidChecksum: (save: T) => boolean;
}

function storedChecksumIsValid(
    checksum: number,
    validate: () => boolean,
): boolean {
    // A zero-filled/truncated file can otherwise satisfy "stored 0 === calculated 0".
    return checksum !== 0 && validate();
}

const SAVE_CANDIDATES: SaveCandidate<any>[] = [
    {
        // Rescue Team must be checked first: BRT.sav can satisfy the broader
        // Time/Darkness checksum heuristic even though the layout is different.
        minLength: 0xB7D4,
        create: (data) => new RBSave(data),
        hasValidChecksum: (save: RBSave) =>
            storedChecksumIsValid(save.primaryChecksum, () => save.isPrimaryChecksumValid()) ||
            storedChecksumIsValid(save.secondaryChecksum, () => save.isSecondaryChecksumValid()),
    },
    {
        // Includes the Sky quicksave/checksum region through 0x1E7FF.
        minLength: 0x1E800,
        create: (data) => new SkySave(data),
        hasValidChecksum: (save: SkySave) =>
            storedChecksumIsValid(save.primaryChecksum, () => save.isPrimaryChecksumValid()) ||
            storedChecksumIsValid(save.secondaryChecksum, () => save.isSecondaryChecksumValid()),
    },
    {
        // Includes the Time/Darkness quicksave/checksum region through 0x2E0FF.
        minLength: 0x2E100,
        create: (data) => new TDSave(data),
        hasValidChecksum: (save: TDSave) =>
            storedChecksumIsValid(save.primaryChecksum, () => save.isPrimaryChecksumValid()) ||
            storedChecksumIsValid(save.secondaryChecksum, () => save.isSecondaryChecksumValid()),
    },
];

export function detectSaveFile(data: Uint8Array): SaveFile | null {
    for (const candidate of SAVE_CANDIDATES) {
        if (data.length < candidate.minLength) {
            continue;
        }

        try {
            const save = candidate.create(data);
            if (candidate.hasValidChecksum(save)) {
                return save;
            }
        } catch {
            // The data does not match this save layout.
        }
    }

    return null;
}

import { RBSave } from './RBSave';
import { SaveFile } from './SaveFile';
import { SkySave } from './SkySave';
import { TDSave } from './TDSave';

type SaveFactory = (data: Uint8Array) => SaveFile;

const SAVE_FACTORIES: SaveFactory[] = [
    // Rescue Team must be checked first: its fixture can satisfy the broader
    // Time/Darkness checksum heuristic even though the layout is different.
    (data) => new RBSave(data),
    (data) => new SkySave(data),
    (data) => new TDSave(data),
];

export function detectSaveFile(data: Uint8Array): SaveFile | null {
    for (const createSave of SAVE_FACTORIES) {
        try {
            const save = createSave(data);
            if (save.isPrimaryChecksumValid() || save.isSecondaryChecksumValid()) {
                return save;
            }
        } catch {
            // The data does not match this save layout.
        }
    }

    return null;
}

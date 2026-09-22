import { RBSave } from './RBSave';
import { SaveFile } from './SaveFile';
import { SkySave } from './SkySave';
import { TDSave } from './TDSave';

type SaveFactory = (data: Uint8Array) => SaveFile;

const SAVE_FACTORIES: SaveFactory[] = [
    (data) => new SkySave(data),
    (data) => new TDSave(data),
    (data) => new RBSave(data),
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

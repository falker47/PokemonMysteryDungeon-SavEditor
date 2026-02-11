import React, { useState } from 'react';
import { SaveFile, GenericItem } from '../save/SaveFile';
import { SkySave } from '../save/SkySave';
import { ItemSelect } from './ItemSelect';
import { DataManager } from '../utils/DataManager';

import { useTranslation } from '../hooks/useTranslation';

interface ItemsTabProps {
    save: SaveFile;
    onUpdate: () => void;
    language: string;
}

export const ItemsTab: React.FC<ItemsTabProps> = ({ save, onUpdate, language }) => {
    const { t } = useTranslation(language);
    const [view, setView] = useState<'held' | 'storage' | 'spEpisode' | 'friendRescue'>('held');
    const isSky = save.gameType === 'Sky';
    const skySave = isSky ? (save as SkySave) : null;

    const getItems = (): GenericItem[] => {
        switch (view) {
            case 'storage': return save.storedItems;
            case 'spEpisode': return skySave ? skySave.spEpisodeHeldItems : [];
            case 'friendRescue': return skySave ? skySave.friendRescueHeldItems : [];
            case 'held':
            default:
                return save.heldItems;
        }
    };

    const currentItems = getItems();
    const isStorage = view === 'storage';

    return (
        <div className="card">
            <h2>{t('Items')}</h2>
            <div className="tabs" style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                <button disabled={view === 'held'} onClick={() => setView('held')}>{t('HeldItems')}</button>
                <button disabled={view === 'storage'} onClick={() => setView('storage')}>{t('StoredItems')}</button>
                {isSky && (
                    <>
                        <button disabled={view === 'spEpisode'} onClick={() => setView('spEpisode')}>Special Episode</button>
                        <button disabled={view === 'friendRescue'} onClick={() => setView('friendRescue')}>Friend Rescue</button>
                    </>
                )}
            </div>

            <div className="tab-content">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #555' }}>
                            <th>Slot</th>
                            <th>Item</th>

                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((item, index) => (
                            <ItemRow
                                key={`${view}-${index}`}
                                index={index}
                                item={item}
                                onUpdate={onUpdate}
                                isHeld={!isStorage}
                                isStorage={isStorage}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface ItemRowProps {
    index: number;
    item: GenericItem;
    onUpdate: () => void;
    isHeld: boolean;
    isStorage?: boolean;
}

const ItemRow: React.FC<ItemRowProps> = ({ index, item, onUpdate, isStorage }) => {
    // Check if it's an ExplorersItem to access stackable property?
    // GenericItem doesn't have isStackableItem.
    // We can cast if we know it is Sky/TD/RB structure that supports it?
    // Or just check if parameter > 0?
    // For now, simple implementation.

    return (
        <tr style={{ borderBottom: '1px solid #333' }}>
            <td>{index + 1}</td>
            <td>
                {isStorage ? (
                    // For Rescue Team Storage, ID is fixed by index.
                    // We just show the Name.
                    <span>{DataManager.getInstance().getItemName(item.id)}</span>
                ) : (
                    <ItemSelect
                        value={item.id}
                        onChange={(val) => {
                            item.id = val;
                            onUpdate();
                        }}
                    />
                )}
            </td>

        </tr>
    );
};

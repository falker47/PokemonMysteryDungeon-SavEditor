import React, { useState } from 'react';
import { SaveFile, GenericItem } from '../save/SaveFile';
import { SkySave } from '../save/SkySave';
import { ItemSelect } from './ItemSelect';

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
    const isRB = save.gameType === 'RescueTeam';
    const skySave = isSky ? (save as SkySave) : null;

    const getItems = (): GenericItem[] => {
        switch (view) {
            case 'storage': {
                // RB uses a bank model (fixed slots, index=ID). Filter to only show items with quantity > 0.
                if (isRB) {
                    return save.storedItems.filter(item => item.parameter > 0);
                }
                return save.storedItems;
            }
            case 'spEpisode': return skySave ? skySave.spEpisodeHeldItems : [];
            case 'friendRescue': return skySave ? skySave.friendRescueHeldItems : [];
            case 'held':
            default:
                return save.heldItems;
        }
    };

    const currentItems = getItems();
    const isStorage = view === 'storage';
    const showQty = isStorage && isRB;

    return (
        <div className="card">
            <h2>{t('Items')}</h2>
            <div className="tabs" style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                <button style={{ padding: '0.2em 0.5em', fontSize: '0.9em' }} disabled={view === 'held'} onClick={() => setView('held')}>{t('HeldItems')}</button>
                <button style={{ padding: '0.2em 0.5em', fontSize: '0.9em' }} disabled={view === 'storage'} onClick={() => setView('storage')}>{t('StoredItems')}</button>
                {isSky && (
                    <>
                        <button style={{ padding: '0.2em 0.5em', fontSize: '0.9em' }} disabled={view === 'spEpisode'} onClick={() => setView('spEpisode')}>{t('SpecialEpisode')}</button>
                        {/* <button style={{ padding: '0.2em 0.5em', fontSize: '0.9em' }} disabled={view === 'friendRescue'} onClick={() => setView('friendRescue')}>Friend Rescue</button> */}
                    </>
                )}
            </div>

            <div className="tab-content">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #555' }}>
                            <th>{t('Slot')}</th>
                            <th>{t('Item')}</th>
                            {showQty && <th>{t('Qty') || 'Qty'}</th>}
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
                                showQty={showQty}
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
    showQty?: boolean;
}

const ItemRow: React.FC<ItemRowProps> = ({ index, item, onUpdate, showQty }) => {
    return (
        <tr style={{ borderBottom: '1px solid #333' }}>
            <td>{index + 1}</td>
            <td>
                <ItemSelect
                    value={item.id}
                    onChange={(val) => {
                        item.id = val;
                        onUpdate();
                    }}
                />
            </td>
            {showQty && (
                <td>
                    <input
                        type="number"
                        min={0}
                        max={999}
                        value={item.parameter}
                        onChange={(e) => {
                            item.parameter = parseInt(e.target.value) || 0;
                            onUpdate();
                        }}
                        style={{ width: '60px' }}
                    />
                </td>
            )}
        </tr>
    );
};

import React from 'react';
import { SaveFile } from '../save/SaveFile';
import { SkySave } from '../save/SkySave';
import { RBSave, RBEUOffsets } from '../save/RBSave';
import { PokemonSelect } from './PokemonSelect';

import { useTranslation } from '../hooks/useTranslation';

interface GeneralTabProps {
    save: SaveFile;
    onUpdate: () => void;
    language: string;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ save, onUpdate, language }) => {
    const { t } = useTranslation(language);
    const isSky = save.gameType === 'Sky';
    const skySave = isSky ? (save as SkySave) : null;

    // We bind directly to the save object for now, triggering re-renders via onUpdate

    return (
        <div className="card">
            <h2>{t('General')}</h2>

            <div className="tab-content">
                <div className="form-group">
                    <label>{t('TeamName')}</label>
                    <input
                        type="text"
                        maxLength={10}
                        value={save.teamName}
                        onChange={(e) => {
                            save.teamName = e.target.value;
                            onUpdate();
                        }}
                    />
                </div>

                {(save.heldMoney !== undefined) && (
                    <div className="form-group">
                        <label>{t('HeldMoney')}</label>
                        <input
                            type="number"
                            value={save.heldMoney}
                            onChange={(e) => {
                                save.heldMoney = parseInt(e.target.value) || 0;
                                onUpdate();
                            }}
                        />
                    </div>
                )}

                {(save.storedMoney !== undefined) && (
                    <div className="form-group">
                        <label>{t('StoredMoney')}</label>
                        <input
                            type="number"
                            value={save.storedMoney}
                            onChange={(e) => {
                                save.storedMoney = parseInt(e.target.value) || 0;
                                onUpdate();
                            }}
                        />
                    </div>
                )}

                {(save.rescueTeamPoints !== undefined) && (
                    <div className="form-group">
                        <label>{t('RescuePoints')}</label>
                        <input
                            type="number"
                            value={save.rescueTeamPoints}
                            onChange={(e) => {
                                save.rescueTeamPoints = parseInt(e.target.value) || 0;
                                onUpdate();
                            }}
                        />
                    </div>
                )}

                {(save.rankPoints !== undefined) && (
                    <div className="form-group">
                        <label>{t('RankPoints')}</label>
                        <input
                            type="number"
                            value={save.rankPoints}
                            onChange={(e) => {
                                save.rankPoints = parseInt(e.target.value) || 0;
                                onUpdate();
                            }}
                        />
                    </div>
                )}

                {(save.gameType === 'RescueTeam') && (
                    <div className="form-group">
                        <label>Region (Auto-detection failed? Try switching)</label>
                        <select
                            value={(save as RBSave).offsets instanceof RBEUOffsets ? 'EU' : 'US'}
                            onChange={(e) => {
                                (save as RBSave).setRegion(e.target.value as 'EU' | 'US');
                                onUpdate();
                            }}
                        >
                            <option value="US">US</option>
                            <option value="EU">EU</option>
                        </select>
                    </div>
                )}

                {(save.baseType !== undefined) && (
                    <div className="form-group">
                        <label>{t('BaseCampTheme') || 'Base Camp Theme'}</label>
                        <input
                            type="number"
                            value={save.baseType}
                            onChange={(e) => {
                                save.baseType = parseInt(e.target.value) || 0;
                                onUpdate();
                            }}
                        />
                    </div>
                )}

                {isSky && skySave && (
                    <>
                        <div className="form-group">
                            <label>{t('Adventures')}</label>
                            <input
                                type="number"
                                value={skySave.numberOfAdventures}
                                onChange={(e) => {
                                    skySave.numberOfAdventures = parseInt(e.target.value) || 0;
                                    onUpdate();
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('RankPoints')}</label>
                            <input
                                type="number"
                                value={skySave.explorerRankPoints}
                                onChange={(e) => {
                                    skySave.explorerRankPoints = parseInt(e.target.value) || 0;
                                    onUpdate();
                                }}
                            />
                        </div>


                        <div className="form-group">
                            <label>{t('OriginalPlayerGeneric')}</label>
                            <PokemonSelect
                                value={skySave.originalPlayerId.id}
                                onChange={(val) => {
                                    skySave.originalPlayerId.id = val;
                                    onUpdate();
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('OriginalPartnerGeneric')}</label>
                            <PokemonSelect
                                value={skySave.originalPartnerId.id}
                                onChange={(val) => {
                                    skySave.originalPartnerId.id = val;
                                    onUpdate();
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Original Player Name</label>
                            <input
                                type="text"
                                maxLength={10}
                                value={skySave.originalPlayerName}
                                onChange={(e) => {
                                    skySave.originalPlayerName = e.target.value;
                                    onUpdate();
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Original Partner Name</label>
                            <input
                                type="text"
                                maxLength={10}
                                value={skySave.originalPartnerName}
                                onChange={(e) => {
                                    skySave.originalPartnerName = e.target.value;
                                    onUpdate();
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Window Frame Type</label>
                            <input
                                type="number"
                                value={skySave.windowFrameType}
                                onChange={(e) => {
                                    skySave.windowFrameType = parseInt(e.target.value) || 0;
                                    onUpdate();
                                }}
                            />
                        </div>
                    </>
                )}

                {isSky && skySave && (
                    <div style={{ marginTop: '10px' }}>
                        {/* Sky Debug or other Sky specific UI */}
                    </div>
                )}

                {/* Debug Section for Rescue Team */}
                {save.gameType === 'RescueTeam' && (
                    <div className="card" style={{ marginTop: '20px', border: '1px solid #555' }}>
                        <h3>Debug Tools (Rescue Team)</h3>
                        <p>Use this if Auto-Region failed.</p>
                        <div className="form-group">
                            <label>Scan for Team Name in File</label>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    placeholder="Enter CURRENT Team Name"
                                    id="scanNameInput"
                                    style={{ flex: '1 1 auto' }}
                                />
                                <button onClick={() => {
                                    const name = (document.getElementById('scanNameInput') as HTMLInputElement).value;
                                    if ((save as RBSave).scanForName) {
                                        const offsets = (save as RBSave).scanForName(name);
                                        alert(`Found name "${name}" at byte offsets:\n${offsets.map(o => `0x${o.toString(16)}`).join(', ')}\n\nExpected US: 0x4EC8\nExpected EU: 0x4ECC`);
                                    }
                                }}>Scan</button>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}>
                            <label>Scan for Held Items Sequence</label>
                            <p style={{ fontSize: '0.8em', color: '#aaa' }}>
                                Enter IDs of items you see in game, separated by commas.<br />
                                Example from your screenshot: <b>70, 5, 73, 3, 73</b> (Oran, Cacnea, Reviver, Silver, Reviver)
                            </p>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    placeholder="e.g. 70, 5, 73"
                                    id="scanItemsInput"
                                    style={{ flex: '1 1 auto' }}
                                />
                                <button onClick={() => {
                                    const input = (document.getElementById('scanItemsInput') as HTMLInputElement).value;
                                    const ids = input.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                                    if (ids.length < 2) {
                                        alert("Please enter at least 2 Item IDs.");
                                        return;
                                    }

                                    if ((save as RBSave).scanForItemSequence) {
                                        const results = (save as RBSave).scanForItemSequence(ids);
                                        if (results.length === 0) alert("No matches found.");
                                        else alert(`Matches:\n${results.join('\n')}`);
                                    }
                                }}>Scan Items (Bit-Level)</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

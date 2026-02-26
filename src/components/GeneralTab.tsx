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
                        <label>{t('RegionLabel')}</label>
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
                        <label>{t('BaseCampTheme')}</label>
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
                            <label>{t('OriginalPlayerName')}</label>
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
                            <label>{t('OriginalPartnerName')}</label>
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
                            <label>{t('WindowFrameType')}</label>
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
                        <h3>{t('DebugToolsRT')}</h3>
                        <p>{t('DebugToolsHint')}</p>
                        <div className="form-group">
                            <label>{t('ScanTeamName')}</label>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    placeholder={t('ScanNamePlaceholder')}
                                    id="scanNameInput"
                                    style={{ flex: '1 1 auto' }}
                                />
                                <button onClick={() => {
                                    const name = (document.getElementById('scanNameInput') as HTMLInputElement).value;
                                    if ((save as RBSave).scanForName) {
                                        const offsets = (save as RBSave).scanForName(name);
                                        alert(`Found name "${name}" at byte offsets:\n${offsets.map(o => `0x${o.toString(16)}`).join(', ')}\n\nExpected US: 0x4EC8\nExpected EU: 0x4ECC`);
                                    }
                                }}>{t('ScanButton')}</button>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}>
                            <label>{t('ScanItemSequence')}</label>
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
                                }}>{t('ScanItemsButton')}</button>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}>
                            <label>Scan for Active Pokemon (Leader)</label>
                            <p style={{ fontSize: '0.8em', color: '#aaa' }}>
                                Enter Level and Species ID of your current leader.<br />
                                Example: <b>15, 258</b> (Mudkip Lvl 15)
                            </p>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <input type="number" placeholder="Lvl" id="scanPkmLvl" style={{ width: '80px' }} />
                                <input type="number" placeholder="Species ID" id="scanPkmID" style={{ width: '100px' }} />
                                <button onClick={() => {
                                    const lvl = parseInt((document.getElementById('scanPkmLvl') as HTMLInputElement).value);
                                    const spId = parseInt((document.getElementById('scanPkmID') as HTMLInputElement).value);
                                    if (isNaN(lvl) || isNaN(spId)) return;
                                    if ((save as RBSave).scanForPokemon) {
                                        const res = (save as RBSave).scanForPokemon(lvl, spId);
                                        alert(res.join('\n'));
                                    }
                                }}>Scan Pokemon</button>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}>
                            <label>Scan for Money (Held/Stored)</label>
                            <p style={{ fontSize: '0.8em', color: '#aaa' }}>
                                Enter the exact amount of money you have in Wallet or Bank.<br />
                                Example: <b>1500</b>
                            </p>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <input type="number" placeholder="Amount" id="scanMoneyAmount" style={{ width: '120px' }} />
                                <button onClick={() => {
                                    const amount = parseInt((document.getElementById('scanMoneyAmount') as HTMLInputElement).value);
                                    if (isNaN(amount)) return;
                                    if ((save as RBSave).scanForMoney) {
                                        const res = (save as RBSave).scanForMoney(amount);
                                        alert(res.join('\n'));
                                    }
                                }}>Scan Money</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

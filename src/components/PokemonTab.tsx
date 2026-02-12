import React, { useState } from 'react';
import { SaveFile, GenericPokemon } from '../save/SaveFile';
import { SkySave } from '../save/SkySave';
import { PokemonSelect } from './PokemonSelect';
import { MoveSelect } from './MoveSelect';
import { DataManager } from '../utils/DataManager';

import { useTranslation } from '../hooks/useTranslation';

interface PokemonTabProps {
    save: SaveFile;
    onUpdate: () => void;
    language: string;
}

export const PokemonTab: React.FC<PokemonTabProps> = ({ save, onUpdate, language }) => {
    const { t } = useTranslation(language);
    const [mode, setMode] = useState<'recruited' | 'active' | 'special'>('recruited');
    const [selectedStored, setSelectedStored] = useState<GenericPokemon | null>(null);
    const [selectedActive, setSelectedActive] = useState<GenericPokemon | null>(null);

    // Auto-Sync state (forced to true as requested)
    const [autoSync] = useState(true);


    const dataManager = DataManager.getInstance();

    const isSky = save.gameType === 'Sky';
    const skySave = isSky ? (save as SkySave) : null;

    // Reset selection when switching modes
    const handleModeChange = (newMode: 'recruited' | 'active' | 'special') => {
        setMode(newMode);
        setSelectedStored(null);
        setSelectedActive(null);
    };

    const renderList = () => {
        if (mode === 'recruited') {
            // Filter out Special Episode Pokemon from the main Recruited list?
            // The user said: "display pokemons of special episode just in their dedicated tab and not on 'recruited'"
            // This implies we need to know WHICH stored pokemon are "Special Episode" ones.
            // Hypothesis: They are the ones referenced by spEpisodeActivePokemon.
            // But what about the ones RECRUITED during a special episode but not currently in party?
            // Without a clear flag, we can only reliably identify those currently IN the special party.
            // Let's assume for now we filter out those that are currently in the Special Episode Party.

            const spActiveIndices = new Set<number>();
            if (skySave) {
                skySave.spEpisodeActivePokemon.forEach(p => {
                    if (p.isValid && p.rosterNumber >= 0) spActiveIndices.add(p.rosterNumber);
                });
            }

            // Filter storedPokemon to exclude those in Special Episode Party AND invalid ones
            const filteredStored = save.storedPokemon.map((p, i) => ({ pkm: p, index: i }))
                .filter(({ pkm, index }) => pkm.isValid && !spActiveIndices.has(index));

            return (
                <>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.3em' }}>{t('StoredPokemon')} ({filteredStored.length})</h2>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #555' }}>
                                    <th>{t('ID')}</th>
                                    <th>{t('Name')}</th>
                                    <th>{t('Lvl')}</th>
                                    <th>{t('Species')}</th>
                                    <th>{t('Status')}</th>
                                    <th>{t('Action')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStored.map(({ pkm, index }) => {
                                    // Check if active in Main
                                    let status = "";
                                    if (save.activePokemon) {
                                        // For Sky/TD/Rescue, check if rosterNumber matches index
                                        // NOTE: GenericPokemon doesn't have rosterNumber, need to cast
                                        const isMainActive = save.activePokemon.some(p => {
                                            if (!p.isValid) return false;
                                            // Handle different game types if needed, but standard is rosterNumber
                                            const activePkm = p as any;
                                            return activePkm.rosterNumber === index;
                                        });
                                        if (isMainActive) status = t('Active');
                                    }

                                    return (
                                        <tr key={index} style={{ borderBottom: '1px solid #333', height: '32px' }}>
                                            <td>{index + 1}</td>
                                            <td>{pkm.isValid ? pkm.nickname : '---'}</td>
                                            <td>{pkm.isValid ? pkm.level : '-'}</td>
                                            <td>
                                                {pkm.isValid
                                                    ? `${dataManager.getPokemonName(pkm.speciesId)}`
                                                    : '-'
                                                }
                                            </td>
                                            <td style={{ fontSize: '0.8em', color: '#88ff88' }}>{status}</td>
                                            <td>
                                                <button
                                                    style={{ padding: '2px 8px', fontSize: '0.8em', width: '100%' }}
                                                    onClick={() => setSelectedStored(pkm)}
                                                >
                                                    {t('EditButton')}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                </>
            );
        } else {
            const isRB = save.gameType === 'RescueTeam';
            // Show Special Episode Party
            const list = mode === 'active' ? (save.activePokemon || []) : (skySave ? skySave.spEpisodeActivePokemon : []);

            if (mode === 'active' && isRB) {
                return <div className="card">{t('RTActiveHint')}</div>;
            }

            if (mode === 'active' && !save.activePokemon) {
                return <div>{t('NoActiveData')}</div>;
            }

            return (
                <>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.3em' }}>{mode === 'active' ? t('ActivePokemonHeader') : t('SpEpisodeParty')} ({list.length})</h2>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #555' }}>
                                    <th>#</th>
                                    <th>{t('Name')}</th>
                                    <th>{t('Lvl')}</th>
                                    <th>{t('Species')}</th>
                                    {mode === 'special' && <th>{t('RosterID')}</th>}
                                    <th>{t('Action')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((pkm, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #333', height: '32px' }}>
                                        <td>{idx + 1}</td>
                                        <td>{pkm.isValid ? pkm.nickname : '---'}</td>
                                        <td>{pkm.isValid ? pkm.level : '-'}</td>
                                        <td>
                                            {pkm.isValid
                                                ? `${dataManager.getPokemonName(pkm.speciesId)}`
                                                : '-'
                                            }
                                        </td>
                                        {mode === 'special' && (
                                            <td style={{ fontSize: '0.8em' }}>{(pkm as any).rosterNumber}</td>
                                        )}
                                        <td>
                                            <button
                                                style={{ padding: '2px 8px', fontSize: '0.8em', width: '100%' }}
                                                onClick={() => setSelectedActive(pkm)}
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            );
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em', height: 'calc(100vh - 160px)' }}>
            <div className="card" style={{ flex: 4, minHeight: 0, display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '5px', flexWrap: 'wrap' }}>
                    <button style={{ padding: '0.2em 0.5em', fontSize: '0.9em' }} disabled={mode === 'recruited'} onClick={() => handleModeChange('recruited')}>{t('Recruited')}</button>
                    <button style={{ padding: '0.2em 0.5em', fontSize: '0.9em' }} disabled={mode === 'active'} onClick={() => handleModeChange('active')}>{t('ActiveTeam')}</button>
                    {isSky && (
                        <button style={{ padding: '0.2em 0.5em', fontSize: '0.9em' }} disabled={mode === 'special'} onClick={() => handleModeChange('special')}>{t('Special')}</button>
                    )}
                </div>
                {renderList()}
            </div>

            <div className="card" style={{ flex: 6, minHeight: 0, overflowY: 'auto', marginBottom: 0 }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5em' }}>{t('EditPokemon')}</h2>

                {mode === 'recruited' && selectedStored && (
                    <GenericPokemonEditor
                        pokemon={selectedStored}
                        save={save}
                        onUpdate={onUpdate}
                        isSky={isSky}
                        autoSync={autoSync}
                        mode="recruited"
                        language={language}
                    />
                )}
                {(mode === 'active' || mode === 'special') && selectedActive && (
                    <GenericPokemonEditor
                        pokemon={selectedActive}
                        save={save}
                        onUpdate={onUpdate}
                        isSky={isSky}
                        autoSync={autoSync}
                        mode={mode}
                        language={language}
                    />
                )}
                {((mode === 'recruited' && !selectedStored) || ((mode !== 'recruited') && !selectedActive)) && (
                    <p>{t('SelectPokemonHint')}</p>
                )}
            </div>
        </div>
    );
};

interface GenericPokemonEditorProps {
    pokemon: GenericPokemon;
    save: SaveFile; // Added save to access sync methods
    onUpdate: () => void;
    isSky: boolean;
    autoSync: boolean;
    mode: 'recruited' | 'active' | 'special';
    language: string;
}



const GenericPokemonEditor: React.FC<GenericPokemonEditorProps> = ({ pokemon, save, onUpdate, isSky, autoSync, mode, language }) => {
    const { t } = useTranslation(language);

    const handleUpdate = () => {
        // Automatically make pokemon valid if edited
        pokemon.isValid = true;

        if (isSky && autoSync && (save as SkySave).syncPokemonAttributes) {
            const skySave = save as SkySave;
            // SYNC LOGIC
            if (mode === 'recruited') {
                // Sync Stored -> Active
                // We need to find the index of this pokemon in stored list
                const storedIndex = skySave.storedPokemon.indexOf(pokemon as any);
                if (storedIndex !== -1) {
                    // Find active pokemon with this roster number
                    skySave.activePokemon.forEach(p => {
                        if (p.rosterNumber === storedIndex && p.isValid) {
                            skySave.syncPokemonAttributes(pokemon as any, p);
                        }
                    });
                    skySave.spEpisodeActivePokemon.forEach(p => {
                        if (p.rosterNumber === storedIndex && p.isValid) {
                            skySave.syncPokemonAttributes(pokemon as any, p);
                        }
                    });
                }
            } else {
                // Sync Active -> Stored
                // We assume active pokemon has a rosterNumber pointing to stored
                const active = pokemon as any; // SkyActivePokemon
                if (active.rosterNumber !== undefined && active.rosterNumber >= 0 && active.rosterNumber < skySave.storedPokemon.length) {
                    const target = skySave.storedPokemon[active.rosterNumber];
                    if (target && target.isValid) {
                        skySave.syncPokemonAttributes(active, target);
                    }
                }
            }
        }
        onUpdate();
    };

    return (
        <div>

            <>
                {/* Row 1: Nickname + Species */}
                <div className="form-group-inline">
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>{t('Nickname')}</label>
                        <input
                            type="text"
                            maxLength={10}
                            value={pokemon.nickname}
                            onChange={(e) => {
                                pokemon.nickname = e.target.value;
                                handleUpdate();
                            }}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>{t('Species')}</label>
                        <PokemonSelect
                            value={pokemon.speciesId}
                            onChange={(val) => {
                                pokemon.speciesId = val;
                                handleUpdate();
                            }}
                        />
                    </div>
                </div>

                {/* Row 2: Gender + Level + Exp + IQ */}
                <div className="form-group-inline">
                    {pokemon.isFemale !== undefined && (
                        <div className="form-group" style={{ flex: '0 0 auto' }}>
                            <label>&nbsp;</label>
                            <button
                                type="button"
                                onClick={() => {
                                    if (pokemon.isFemale !== undefined) {
                                        pokemon.isFemale = !pokemon.isFemale;
                                        handleUpdate();
                                    }
                                }}
                                style={{
                                    fontSize: '1.2em',
                                    padding: '0.3em 0.6em',
                                    background: pokemon.isFemale ? '#e91e8e' : '#3b82f6',
                                    minWidth: '36px',
                                }}
                                title={pokemon.isFemale ? t('Female') : t('Male')}
                            >
                                {pokemon.isFemale ? '♀' : '♂'}
                            </button>
                        </div>
                    )}
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>{t('Level')}</label>
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={pokemon.level}
                            onChange={(e) => {
                                pokemon.level = parseInt(e.target.value) || 1;
                                handleUpdate();
                            }}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>{t('Experience')}</label>
                        <input
                            type="number"
                            value={pokemon.exp}
                            onChange={(e) => {
                                pokemon.exp = parseInt(e.target.value) || 0;
                                handleUpdate();
                            }}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>{t('IQ')}</label>
                        <input
                            type="number"
                            value={pokemon.iq}
                            onChange={(e) => {
                                pokemon.iq = parseInt(e.target.value) || 0;
                                handleUpdate();
                            }}
                        />
                    </div>
                </div>

                {/* Row 3: HP + Atk + Def + Sp.Atk + Sp.Def */}
                <div className="form-group-inline">
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>{t('HP')}</label>
                        <input
                            type="number"
                            value={pokemon.hp}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                pokemon.hp = val;
                                if (pokemon.maxHP !== undefined) {
                                    pokemon.maxHP = val;
                                }
                                handleUpdate();
                            }}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>{t('Atk')}</label>
                        <input
                            type="number"
                            value={pokemon.attack}
                            onChange={(e) => {
                                pokemon.attack = parseInt(e.target.value) || 0;
                                handleUpdate();
                            }}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>{t('Def')}</label>
                        <input
                            type="number"
                            value={pokemon.defense}
                            onChange={(e) => {
                                pokemon.defense = parseInt(e.target.value) || 0;
                                handleUpdate();
                            }}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>{t('SpAttack')}</label>
                        <input
                            type="number"
                            value={pokemon.spAttack}
                            onChange={(e) => {
                                pokemon.spAttack = parseInt(e.target.value) || 0;
                                handleUpdate();
                            }}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>{t('SpDefense')}</label>
                        <input
                            type="number"
                            value={pokemon.spDefense}
                            onChange={(e) => {
                                pokemon.spDefense = parseInt(e.target.value) || 0;
                                handleUpdate();
                            }}
                        />
                    </div>
                </div>



                <h3>{t('Moves')}</h3>
                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1em' }}>
                    {pokemon.moves.map((move, idx) => (
                        <div key={idx} className="form-group-inline">
                            <div className="form-group" style={{ flex: 3 }}>
                                <label>{t('Move')} {idx + 1}</label>
                                <MoveSelect
                                    value={move.id}
                                    onChange={(val) => {
                                        move.id = val;
                                        handleUpdate();
                                    }}
                                />
                            </div>
                            <div className="form-group" style={{ flex: '0 0 auto' }}>
                                <label>{t('Ginseng')}</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={99}
                                    value={move.powerBoost || 0}
                                    onChange={(e) => {
                                        move.powerBoost = parseInt(e.target.value) || 0;
                                        handleUpdate();
                                    }}
                                    style={{ width: '50px' }}
                                    placeholder="+0"
                                />
                            </div>
                            {move.pp !== undefined && (
                                <div style={{ flexBasis: '100%' }}>{t('PP')}: {move.pp}</div>
                            )}
                        </div>
                    ))}
                </div>
            </>
        </div >
    );
};

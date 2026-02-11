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

    const [page, setPage] = useState(0);
    const itemsPerPage = 50;
    const dataManager = DataManager.getInstance();

    const isSky = save.gameType === 'Sky';
    const skySave = isSky ? (save as SkySave) : null;

    // Reset selection when switching modes
    const handleModeChange = (newMode: 'recruited' | 'active' | 'special') => {
        setMode(newMode);
        setSelectedStored(null);
        setSelectedActive(null);
        setPage(0);
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

            // Filter storedPokemon to exclude those in Special Episode Party
            const filteredStored = save.storedPokemon.map((p, i) => ({ pkm: p, index: i }))
                .filter(({ index }) => !spActiveIndices.has(index));

            const paginatedPokemon = filteredStored.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
            const totalPages = Math.ceil(filteredStored.length / itemsPerPage);

            return (
                <>
                    <h2>{t('StoredPokemon')} ({filteredStored.length})</h2>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #555' }}>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Lvl</th>
                                    <th>Species</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPokemon.map(({ pkm, index }) => {
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
                                        if (isMainActive) status = "Active";
                                    }

                                    return (
                                        <tr key={index} style={{ borderBottom: '1px solid #333' }}>
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
                                                    style={{ padding: '2px 5px', fontSize: '0.8em' }}
                                                    onClick={() => setSelectedStored(pkm)}
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ marginTop: '1em', display: 'flex', justifyContent: 'center', gap: '0.5em' }}>
                        <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>&lt;</button>
                        <span>Page {page + 1} / {totalPages}</span>
                        <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>&gt;</button>
                    </div>
                </>
            );
        } else {
            const isRB = save.gameType === 'RescueTeam';
            // Show Special Episode Party
            const list = mode === 'active' ? (save.activePokemon || []) : (skySave ? skySave.spEpisodeActivePokemon : []);

            if (mode === 'active' && isRB) {
                return <div className="card">Rescue Team uses the recruited list for active party members. Check the Recruited tab.</div>;
            }

            if (mode === 'active' && !save.activePokemon) {
                return <div>No active pokemon data available for this save type.</div>;
            }

            return (
                <>
                    <h2>{mode === 'active' ? t('ActivePokemonHeader') : t('SpEpisodeParty')} ({list.length})</h2>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #555' }}>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Lvl</th>
                                    <th>Species</th>
                                    {mode === 'special' && <th>Roster ID</th>}
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((pkm, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
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
                                                style={{ padding: '2px 5px', fontSize: '0.8em' }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
            <div className="card" style={{ height: '240px', maxHeight: '24vh', display: 'flex', flexDirection: 'column', minWidth: '0', overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <button disabled={mode === 'recruited'} onClick={() => handleModeChange('recruited')}>Recruited</button>
                    <button disabled={mode === 'active'} onClick={() => handleModeChange('active')}>Active Team</button>
                    {isSky && (
                        <button disabled={mode === 'special'} onClick={() => handleModeChange('special')}>Special Episode</button>
                    )}
                </div>
                {renderList()}
            </div>

            <div className="card" style={{ height: '360px', maxHeight: '36vh', overflowY: 'auto' }}>
                <h2>Edit Pokemon</h2>

                {mode === 'recruited' && selectedStored && (
                    <GenericPokemonEditor
                        pokemon={selectedStored}
                        save={save}
                        onUpdate={onUpdate}
                        isSky={isSky}
                        autoSync={autoSync}
                        mode="recruited"
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
                    />
                )}
                {((mode === 'recruited' && !selectedStored) || ((mode !== 'recruited') && !selectedActive)) && (
                    <p>Select a Pokemon to edit.</p>
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
}

const isTimeDarkness = (save: SaveFile) => save.gameType === 'TimeDarkness';

const GenericPokemonEditor: React.FC<GenericPokemonEditorProps> = ({ pokemon, save, onUpdate, isSky, autoSync, mode }) => {

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
                <div className="form-group">
                    <label>Nickname</label>
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

                <div className="form-group">
                    <label>Species</label>
                    <PokemonSelect
                        value={pokemon.speciesId}
                        onChange={(val) => {
                            pokemon.speciesId = val;
                            handleUpdate();
                        }}
                    />
                </div>

                {pokemon.isFemale !== undefined && (
                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={pokemon.isFemale}
                                onChange={(e) => {
                                    if (pokemon.isFemale !== undefined) {
                                        pokemon.isFemale = e.target.checked;
                                        handleUpdate();
                                    }
                                }}
                            />
                            Is Female
                        </label>
                    </div>
                )}

                <div className="form-group">
                    <label>Level</label>
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

                <div className="form-group">
                    <label>Experience</label>
                    <input
                        type="number"
                        value={pokemon.exp}
                        onChange={(e) => {
                            pokemon.exp = parseInt(e.target.value) || 0;
                            handleUpdate();
                        }}
                    />
                </div>

                <div className="form-group">
                    <label>HP</label>
                    <input
                        type="number"
                        style={{ width: '60px' }}
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
                <div style={{ display: 'flex', gap: '1em', flexWrap: 'wrap' }}>
                    <div className="form-group">
                        <label>Atk</label>
                        <input
                            type="number"
                            style={{ width: '50px' }}
                            value={pokemon.attack}
                            onChange={(e) => {
                                pokemon.attack = parseInt(e.target.value) || 0;
                                handleUpdate();
                            }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Def</label>
                        <input
                            type="number"
                            style={{ width: '50px' }}
                            value={pokemon.defense}
                            onChange={(e) => {
                                pokemon.defense = parseInt(e.target.value) || 0;
                                handleUpdate();
                            }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Sp.Atk</label>
                        <input
                            type="number"
                            style={{ width: '50px' }}
                            value={pokemon.spAttack}
                            onChange={(e) => {
                                pokemon.spAttack = parseInt(e.target.value) || 0;
                                handleUpdate();
                            }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Sp.Def</label>
                        <input
                            type="number"
                            style={{ width: '50px' }}
                            value={pokemon.spDefense}
                            onChange={(e) => {
                                pokemon.spDefense = parseInt(e.target.value) || 0;
                                handleUpdate();
                            }}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>IQ</label>
                    <input
                        type="number"
                        value={pokemon.iq}
                        onChange={(e) => {
                            pokemon.iq = parseInt(e.target.value) || 0;
                            handleUpdate();
                        }}
                    />
                </div>

                {pokemon.metAt !== undefined && !isTimeDarkness(save) && (
                    <div className="form-group">
                        <label>Met At</label>
                        <input
                            type="number"
                            value={pokemon.metAt}
                            onChange={(e) => {
                                pokemon.metAt = parseInt(e.target.value) || 0;
                                handleUpdate();
                            }}
                        />
                    </div>
                )}

                <h3>Moves</h3>
                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1em' }}>
                    {pokemon.moves.map((move, idx) => (
                        <div key={idx} className="form-group">
                            <label>Move {idx + 1}</label>
                            <div style={{ display: 'flex', gap: '0.5em' }}>
                                <div style={{ flex: 3 }}>
                                    <MoveSelect
                                        value={move.id}
                                        onChange={(val) => {
                                            move.id = val;
                                            handleUpdate();
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.8em' }}>Ginseng</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={99}
                                        value={move.powerBoost || 0}
                                        onChange={(e) => {
                                            move.powerBoost = parseInt(e.target.value) || 0;
                                            handleUpdate();
                                        }}
                                        style={{ width: '100%' }}
                                        placeholder="+0"
                                    />
                                </div>
                            </div>
                            {move.pp !== undefined && (
                                <div>PP: {move.pp}</div>
                            )}
                        </div>
                    ))}
                </div>
            </>
        </div>
    );
};

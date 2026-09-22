import assert from 'node:assert/strict';
import fs from 'node:fs';

import { detectSaveFile } from '../src/save/detectSaveFile';
import type { GenericItem, GenericPokemon, SaveFile } from '../src/save/SaveFile';
import { SkySave } from '../src/save/SkySave';
import { TDSave } from '../src/save/TDSave';

const fixtureRoot = 'legacy/Tests/SkyEditor.SaveEditor.Tests/Resources';

function readFixture(name: string): Uint8Array {
    return new Uint8Array(fs.readFileSync(`${fixtureRoot}/${name}`));
}

function itemSummary(item: GenericItem) {
    return [item.id, item.parameter, item.isValid] as const;
}

function pokemonSummary(pokemon: GenericPokemon) {
    return {
        speciesId: pokemon.speciesId,
        nickname: pokemon.nickname,
        level: pokemon.level,
        hp: pokemon.hp,
        maxHP: pokemon.maxHP,
        attack: pokemon.attack,
        defense: pokemon.defense,
        spAttack: pokemon.spAttack,
        spDefense: pokemon.spDefense,
        exp: pokemon.exp,
        iq: pokemon.iq,
        moves: pokemon.moves.map((move) => [move.id, move.pp, move.powerBoost]),
    };
}

function saveSummary(save: SaveFile) {
    return {
        gameType: save.gameType,
        teamName: save.teamName,
        heldMoney: save.heldMoney,
        storedMoney: save.storedMoney,
        rescueTeamPoints: save.rescueTeamPoints,
        rankPoints: save.rankPoints,
        baseType: save.baseType,
        heldItems: save.heldItems.map(itemSummary),
        storedItems: save.storedItems.map(itemSummary),
        activePokemon: save.activePokemon?.map(pokemonSummary) ?? [],
        storedPokemon: save.storedPokemon.map(pokemonSummary),
    };
}

function assertRoundTrip(fixture: string, expectedGameType: SaveFile['gameType']) {
    const original = detectSaveFile(readFixture(fixture));
    assert.ok(original, `${fixture}: fixture was not detected`);
    assert.equal(original.gameType, expectedGameType, `${fixture}: wrong game type`);
    assert.ok(
        original.isPrimaryChecksumValid() || original.isSecondaryChecksumValid(),
        `${fixture}: neither original checksum is valid`,
    );

    const before = saveSummary(original);
    const exported = original.toByteArray();
    const reopened = detectSaveFile(exported);

    assert.ok(reopened, `${fixture}: exported save was not detected`);
    assert.equal(reopened.gameType, expectedGameType, `${fixture}: exported save changed game type`);
    assert.equal(reopened.isPrimaryChecksumValid(), true, `${fixture}: primary checksum invalid after export`);
    assert.equal(reopened.isSecondaryChecksumValid(), true, `${fixture}: backup checksum invalid after export`);
    assert.deepEqual(saveSummary(reopened), before, `${fixture}: no-op export changed editable data`);
}

assertRoundTrip('BRT.sav', 'RescueTeam');
assertRoundTrip('EoS.sav', 'Sky');
assertRoundTrip('EoT.sav', 'TimeDarkness');

// Expectations ported from the original SkyEditor tests bundled in legacy/.
const sky = detectSaveFile(readFixture('EoS.sav'));
assert.ok(sky instanceof SkySave);
assert.equal(sky.teamName, 'Blue');
assert.equal(sky.heldMoney, 42);
assert.equal(sky.storedMoney, 44459);
assert.equal(sky.storedItems.length, 321);
assert.equal(sky.heldItems.length, 12);
assert.equal(sky.storedPokemon.length, 97);
assert.equal(sky.activePokemon.length, 2);
assert.deepEqual(
    sky.storedPokemon.slice(0, 2).map((p) => [p.speciesId, p.level, p.nickname]),
    [[490, 60, 'Evan'], [430, 59, 'Empoleon']],
);

const time = detectSaveFile(readFixture('EoT.sav'));
assert.ok(time instanceof TDSave);
assert.equal(time.teamName, 'I.D.A.S.');
assert.equal(time.heldItems.length, 25);
assert.equal(time.storedPokemon.length, 20);
assert.equal(time.activePokemon.length, 2);
assert.deepEqual(
    time.storedPokemon.slice(0, 2).map((p) => [p.speciesId, p.level, p.nickname]),
    [[428, 50, 'Evan'], [152, 49, 'Chikorita']],
);

// Regression for issue #1: Rescue Team uses a different species-ID table than Explorers.
function parseResource(path: string): Map<number, string> {
    const result = new Map<number, string>();
    for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
        const separator = line.indexOf('=');
        if (separator < 0) continue;
        const id = Number(line.slice(0, separator));
        if (Number.isFinite(id)) result.set(id, line.slice(separator + 1).trim());
    }
    return result;
}

const rbPokemon = parseResource('public/resources/en/RBPokemon.txt');
assert.equal(rbPokemon.get(285), 'Swampert');
assert.equal(rbPokemon.get(288), 'Zigzagoon');
assert.equal(rbPokemon.get(227), 'Wobbuffet');
assert.equal(rbPokemon.get(276), 'Celebi');
assert.equal(rbPokemon.get(380), 'Kecleon');
assert.equal(rbPokemon.get(415), 'Unown');
assert.equal(rbPokemon.get(416), 'Unown');

assert.equal(detectSaveFile(new Uint8Array(128)), null, 'short invalid data must be rejected');

console.log('Save verification passed for BRT.sav, EoS.sav, and EoT.sav.');

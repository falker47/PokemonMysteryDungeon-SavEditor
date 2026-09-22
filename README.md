# PMD Save Editor

<p align="center">
  <img src="public/hero-preview16-9.jpg" alt="PMD Save Editor preview" width="900">
</p>

A browser-based save editor for **Pokémon Mystery Dungeon: Red/Blue Rescue Team** and **Explorers of Time, Darkness, and Sky**.

**Live app:** https://pokemonmysterydungeon-saveditor.netlify.app/

## What it edits

The current web editor exposes:

- team name, money, rescue/rank points, and selected game-specific settings;
- bag and storage contents;
- recruited and active Pokémon, including species, nickname, level, stats, IQ, moves, and Ginseng boosts;
- Sky-specific Special Episode data supported by the current parser.

All processing is local to the browser. Export writes the edited data back into the loaded save, refreshes the game's internal backup block where implemented, and recalculates the relevant checksums.

> **Keep an external copy of your original save.** The editor updates the save file's own primary/backup structures; it does not create a separate backup file for you.

## Supported games and validation

| Game family | Parser/writer | Fixture in repo | Current validation |
| --- | --- | --- | --- |
| Red / Blue Rescue Team | Yes | `BRT.sav` | detection, checksum validation, no-op round trip, Rescue-specific Pokémon ID regression |
| Explorers of Sky | Yes | `EoS.sav` | legacy expected values, checksum validation, no-op round trip |
| Explorers of Time / Darkness | Yes, shared layout | `EoT.sav` | Time legacy expected values, checksum validation, no-op round trip |

Darkness uses the shared Time/Darkness implementation, but this repository currently contains a Time fixture rather than a separate Darkness fixture.

Unsupported or malformed files are rejected when none of the supported layouts has a valid primary or backup checksum; the editor no longer silently assumes Explorers of Sky.

### Rescue Team species IDs

Rescue Team and Explorers do **not** use the same internal Pokémon numbering. The modern editor uses the Rescue Team mapping preserved by the legacy SkyEditor implementation. For example, Rescue Team ID `288` is **Zigzagoon**, while `285` is **Swampert**. This mapping is covered by the verification script because a wrong shared table can make a correctly stored Pokémon appear as another species in the UI.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/falker47/PokemonMysteryDungeon-SavEditor.git
cd PokemonMysteryDungeon-SavEditor
npm ci
npm run dev
```

Create a production build:

```bash
npm run build
```

Run the save-format regression checks:

```bash
npm run verify:saves
```

The verification command exercises the bundled `BRT.sav`, `EoS.sav`, and `EoT.sav` fixtures and checks that a no-op export remains readable with valid primary and backup checksums and preserves the editable data model.

## Architecture

- **React + TypeScript** for the UI and editor model
- **Vite** for development and production builds
- save-format implementations under [`src/save/`](src/save/)
- localized game resources under [`public/resources/`](public/resources/)
- preserved SkyEditor source, resources, and historical tests under [`legacy/`](legacy/)

## Provenance and licensing

This project is a modern refactor/continuation of **SkyEditor.SaveEditor** by Evan Dixon and contributors. The legacy source is intentionally preserved for traceability.

See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for provenance details and [`legacy/LICENSE`](legacy/LICENSE) for the MIT license retained with the legacy code.

The repository root currently does **not** declare a blanket license for all modern code, so the previous README statement that the entire repository was MIT-licensed was too broad.

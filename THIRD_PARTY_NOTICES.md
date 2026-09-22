# Third-party and legacy provenance

The modern TypeScript/React editor in this repository is a refactor and continuation of research and implementation from **SkyEditor.SaveEditor** by Evan Dixon and contributors.

The preserved upstream/legacy code lives under [`legacy/`](legacy/). Its original MIT license is retained at [`legacy/LICENSE`](legacy/LICENSE) with the original 2016 Evan Dixon copyright notice.

The Rescue Team Pokémon ID mapping used by the modern web editor is derived from the preserved SkyEditor `IDConversion` logic and `RBPokemon.txt` resource. Keeping that mapping explicit is important because Rescue Team and Explorers do not use identical internal Pokémon IDs.

This notice documents provenance only. It does not replace or broaden the license attached to the legacy code, and the repository root currently does not declare a blanket license for all modern code.

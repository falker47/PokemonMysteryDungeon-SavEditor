// Junk name patterns to filter from all dropdowns
const JUNK_NAMES = new Set(['Nothing', '$$$', '[M:D1]', '??????????', '-', '1 Sala', 'One-Room', 'Fill-In', 'Trapper', 'Possess', 'Itemize']);
const RESERVE_PATTERN = /^reserve_\d+$/;

function isJunkEntry(name: string): boolean {
    return JUNK_NAMES.has(name) || RESERVE_PATTERN.test(name);
}

// Pokemon form suffixes keyed by game data ID
const POKEMON_FORM_SUFFIXES: Record<number, string> = {
    // Unown A-Z, !, ?
    201: 'A', 202: 'B', 203: 'C', 204: 'D', 205: 'E', 206: 'F', 207: 'G',
    208: 'H', 209: 'I', 210: 'J', 211: 'K', 212: 'L', 213: 'M', 214: 'N',
    215: 'O', 216: 'P', 217: 'Q', 218: 'R', 219: 'S', 220: 'T', 221: 'U',
    222: 'V', 223: 'W', 224: 'X', 225: 'Y', 226: 'Z', 227: '!', 228: '?',
    // Celebi
    278: 'Normal', 279: 'Shiny',
    // Castform
    379: 'Normal', 380: 'Sunny', 381: 'Rainy', 382: 'Snowy',
    // Kecleon
    383: 'Green', 384: 'Purple',
    // Deoxys
    418: 'Normal', 419: 'Attack', 420: 'Defense', 421: 'Speed',
    // Burmy
    447: 'Plant', 448: 'Sandy', 449: 'Trash',
    // Wormadam
    450: 'Plant', 451: 'Sandy', 452: 'Trash',
    // Cherrim
    460: 'Overcast', 461: 'Sunshine',
    // Shellos
    462: 'West', 463: 'East',
    // Gastrodon
    464: 'West', 465: 'East',
    // Giratina
    529: 'Altered', 536: 'Origin',
    // Shaymin
    534: 'Land', 535: 'Sky',
};

export class DataManager {
    private static instance: DataManager;

    public items: Record<number, string> = {};
    public pokemon: Record<number, string> = {};
    public moves: Record<number, string> = {};
    public currentLanguage: string = 'en';
    public currentGameType: string = 'Sky';

    private constructor() { }

    public static getInstance(): DataManager {
        if (!DataManager.instance) {
            DataManager.instance = new DataManager();
        }
        return DataManager.instance;
    }

    public async setLanguage(lang: string): Promise<void> {
        this.currentLanguage = lang;
        await this.loadData(this.currentGameType);
    }

    public async loadData(gameType: string = 'Sky'): Promise<void> {
        this.currentGameType = gameType;
        try {
            const prefix = gameType === 'RescueTeam' ? 'RB' : (gameType === 'TimeDarkness' ? 'TD' : 'Sky');

            await Promise.all([
                this.loadItems(prefix),
                this.loadPokemon(prefix),
                this.loadMoves(prefix)
            ]);
        } catch (e) {
            console.error("Failed to load data resources", e);
        }
    }

    private async loadItems(prefix: string) {
        try {
            const response = await fetch(`/resources/${this.currentLanguage}/${prefix}Items.txt`);
            if (!response.ok) throw new Error("404");
            const text = await response.text();
            this.items = this.parseResource(text);
        } catch {
            // Fallback to Sky if not found? or Empty.
            console.warn(`Failed to load ${prefix}Items.txt`);
            this.items = {};
        }
    }

    private async loadPokemon(prefix: string) {
        try {
            const response = await fetch(`/resources/${this.currentLanguage}/${prefix}Pokemon.txt`);
            if (!response.ok) throw new Error("404");
            const text = await response.text();
            const parsed = this.parseResource(text);

            // Disambiguate Pokemon forms with suffixes
            for (const idStr of Object.keys(parsed)) {
                const id = parseInt(idStr);
                const suffix = POKEMON_FORM_SUFFIXES[id];
                if (suffix) {
                    parsed[id] = `${parsed[id]} (${suffix})`;
                }
            }

            this.pokemon = parsed;
        } catch {
            console.warn(`Failed to load ${prefix}Pokemon.txt`);
            this.pokemon = {};
        }
    }

    private async loadMoves(prefix: string) {
        try {
            const response = await fetch(`/resources/${this.currentLanguage}/${prefix}Moves.txt`);
            if (!response.ok) throw new Error("404");
            const text = await response.text();
            this.moves = this.parseResource(text);
        } catch {
            console.warn(`Failed to load ${prefix}Moves.txt`);
            this.moves = {};
        }
    }

    private parseResource(text: string): Record<number, string> {
        const map: Record<number, string> = {};
        const lines = text.split('\n');
        for (const line of lines) {
            if (!line.trim()) continue;
            // Format: ID=Name
            const parts = line.split('=');
            if (parts.length >= 2) {
                const id = parseInt(parts[0].trim());
                if (!isNaN(id)) {
                    const name = parts.slice(1).join('=').trim();
                    if (name && !isJunkEntry(name)) {
                        map[id] = name;
                    }
                }
            }
        }
        return map;
    }

    public getItemName(id: number): string {
        return this.items[id] || `Unknown Item (${id})`;
    }

    public getPokemonName(id: number): string {
        return this.pokemon[id] || `Unknown Pokemon (${id})`;
    }

    public getMoveName(id: number): string {
        return this.moves[id] || `Unknown Move (${id})`;
    }
}

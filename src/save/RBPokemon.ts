import { BitBlock } from '../utils/BitBlock';
import { CharacterEncoding } from '../utils/CharacterEncoding';
import { GenericPokemon, GenericMove } from './SaveFile';

export class RBAttack implements GenericMove {
    public static readonly bitLength: number = 20;

    public isValid: boolean = false;
    public isLinked: boolean = false;
    public isSwitched: boolean = false;
    public isSet: boolean = false;

    private _id: number = 0;
    get id(): number { return this._id; }
    set id(val: number) {
        this._id = val;
        if (val > 0) this.isValid = true;
    }

    public powerBoost: number = 0;

    constructor(bits?: BitBlock) {
        if (bits) {
            this.isValid = bits.getBit(0);
            this.isLinked = bits.getBit(1);
            this.isSwitched = bits.getBit(2);
            this.isSet = bits.getBit(3);
            this._id = bits.getInt(0, 4, 9);
            this.powerBoost = bits.getInt(0, 13, 7);
        }
    }

    toBitBlock(): BitBlock {
        const bits = new BitBlock(RBAttack.bitLength);
        bits.setBit(0, this.isValid);
        bits.setBit(1, this.isLinked);
        bits.setBit(2, this.isSwitched);
        bits.setBit(3, this.isSet);
        bits.setInt(0, 4, 9, this.id);
        bits.setInt(0, 13, 7, this.powerBoost);
        return bits;
    }
}

export class RBStoredPokemon implements GenericPokemon {
    public static readonly bitLength: number = 323;

    public level: number = 0;
    public id: number = 0;
    public metAt: number = 0;
    public unk1: BitBlock = new BitBlock(21);
    public iq: number = 0;
    public hp: number = 0;
    public attack: number = 0;
    public spAttack: number = 0;
    public defense: number = 0;
    public spDefense: number = 0;
    public exp: number = 0;
    public unk2: BitBlock = new BitBlock(43);
    public moves: RBAttack[] = [];
    public name: string = "";

    protected extraBits: BitBlock | null = null;

    get speciesId(): number { return this.id; }
    set speciesId(val: number) { this.id = val; }

    get nickname(): string { return this.name; }
    set nickname(val: string) { this.name = val; }

    set isValid(val: boolean) {
        if (!val) {
            this.id = 0;
        } else if (this.id === 0) {
            this.id = 1; // Default to Bulbasaur
        }
    }

    constructor(bits?: BitBlock) {
        if (bits) {
            this.level = bits.getInt(0, 0, 7);
            this.id = bits.getInt(0, 7, 9);
            this.metAt = bits.getInt(0, 16, 7);
            this.unk1 = bits.getRange(23, 21);
            this.iq = bits.getInt(0, 44, 10);
            this.hp = bits.getInt(0, 54, 10);
            this.attack = bits.getInt(0, 64, 8);
            this.spAttack = bits.getInt(0, 72, 8);
            this.defense = bits.getInt(0, 80, 8);
            this.spDefense = bits.getInt(0, 88, 8);
            this.exp = bits.getInt(0, 96, 24);
            this.unk2 = bits.getRange(120, 43);

            this.moves = [
                new RBAttack(bits.getRange(163, RBAttack.bitLength)),
                new RBAttack(bits.getRange(183, RBAttack.bitLength)),
                new RBAttack(bits.getRange(203, RBAttack.bitLength)),
                new RBAttack(bits.getRange(223, RBAttack.bitLength))
            ];

            const nameBytes = bits.getRange(243, 80).toByteArray();
            this.name = CharacterEncoding.decode(nameBytes);

            if (bits.count > 323) {
                this.extraBits = bits.getRange(323, bits.count - 323);
            }
        } else {
            this.moves = [new RBAttack(), new RBAttack(), new RBAttack(), new RBAttack()];
        }
    }

    toBitBlock(): BitBlock {
        const bits = new BitBlock(323);
        bits.setInt(0, 0, 7, this.level);
        bits.setInt(0, 7, 9, this.id);
        bits.setInt(0, 16, 7, this.metAt);
        bits.setRange(23, 21, this.unk1);
        bits.setInt(0, 44, 10, this.iq);
        bits.setInt(0, 54, 10, this.hp);
        bits.setInt(0, 64, 8, this.attack);
        bits.setInt(0, 72, 8, this.spAttack);
        bits.setInt(0, 80, 8, this.defense);
        bits.setInt(0, 88, 8, this.spDefense);
        bits.setInt(0, 96, 24, this.exp);
        bits.setRange(120, 43, this.unk2);

        bits.setRange(163, RBAttack.bitLength, this.moves[0]?.toBitBlock() || new BitBlock(RBAttack.bitLength));
        bits.setRange(183, RBAttack.bitLength, this.moves[1]?.toBitBlock() || new BitBlock(RBAttack.bitLength));
        bits.setRange(203, RBAttack.bitLength, this.moves[2]?.toBitBlock() || new BitBlock(RBAttack.bitLength));
        bits.setRange(223, RBAttack.bitLength, this.moves[3]?.toBitBlock() || new BitBlock(RBAttack.bitLength));

        const nameBytes = CharacterEncoding.encode(this.name, 10);
        const nameBlock = new BitBlock(nameBytes);
        bits.setRange(243, 80, nameBlock);

        if (this.extraBits) {
            const fullBlock = new BitBlock(bits.count + this.extraBits.count);
            fullBlock.setRange(0, bits.count, bits);
            fullBlock.setRange(bits.count, this.extraBits.count, this.extraBits);
            return fullBlock;
        }

        return bits;
    }

    get isValid(): boolean {
        return this.id > 0;
    }
}

export class RBActivePokemon extends RBStoredPokemon {
    public static override readonly bitLength: number = 544; // 0x44 bytes
}


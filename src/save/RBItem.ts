import { BitBlock } from '../utils/BitBlock';
import { GenericItem } from './SaveFile';

export class RBHeldItem implements GenericItem {
    public static readonly length: number = 23;

    public isValid: boolean = true;
    public flag1: boolean = false;
    public flag2: boolean = false;
    public flag3: boolean = false;
    public flag4: boolean = false;
    public flag5: boolean = false;
    public flag6: boolean = false;
    public flag7: boolean = false;
    public parameter: number = 0;
    public id: number = 0;

    constructor(bits?: BitBlock) {
        if (bits) {
            this.isValid = bits.getBit(0);
            this.flag1 = bits.getBit(1);
            this.flag2 = bits.getBit(2);
            this.flag3 = bits.getBit(3);
            this.flag4 = bits.getBit(4);
            this.flag5 = bits.getBit(5);
            this.flag6 = bits.getBit(6);
            this.flag7 = bits.getBit(7);

            // True layout: Qty inside bits 8-14 (7 bits), ID inside bits 15-22 (8 bits)
            this.parameter = bits.getInt(0, 8, 7);
            this.id = bits.getInt(0, 15, 8);
        }
    }

    toBitBlock(): BitBlock {
        const bits = new BitBlock(RBHeldItem.length);
        bits.setBit(0, this.isValid);
        bits.setBit(1, this.flag1);
        bits.setBit(2, this.flag2);
        bits.setBit(3, this.flag3);
        bits.setBit(4, this.flag4);
        bits.setBit(5, this.flag5);
        bits.setBit(6, this.flag6);
        bits.setBit(7, this.flag7);

        // Qty inside bits 8-14 (7 bits)
        bits.setInt(0, 8, 7, this.parameter);

        // Save direct ID without shifts
        bits.setInt(0, 15, 8, this.id);
        return bits;
    }

    clone(): RBHeldItem {
        return new RBHeldItem(this.toBitBlock());
    }
}

export class RBStoredItem implements GenericItem {
    public itemID: number;
    public quantity: number;

    get id(): number { return this.itemID; }
    set id(val: number) { this.itemID = val; }

    get parameter(): number { return this.quantity; }
    set parameter(val: number) { this.quantity = val; }

    get isValid(): boolean { return this.itemID > 0; }
    set isValid(val: boolean) { if (!val) this.itemID = 0; }

    constructor(itemID: number = 0, quantity: number = 0) {
        this.itemID = itemID;
        this.quantity = quantity;
    }
}

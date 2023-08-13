export type Instructions = number[];

export type Opcode = number;

export const OpConstant: Opcode = 0;

export class Definition {
    name: string;
    operandWidths: number[];

    constructor(name: string, widths: number[]) {
        this.name = name;
        this.operandWidths = widths;
    }
}

const bitmask = 0b11111111

const definitions = {
    [OpConstant]: new Definition('OpConstant', [2]),
}

export function Lookup(op: number) {
    return definitions[op];
}

function getBytes(num: number, width: number) {
    let values: number[] = [];
    for(let i = 0 ; i < width; i++) {
        values.unshift(num >> (i * 8) & bitmask)
    }
    return values;
}

export function Make(op: Opcode, ...operands: number[]) {
    const definition = definitions[op];
    if(!definition) {
        return [] as number[];
    }
    let instructionLength = 1;
    definition.operandWidths.forEach((num) => instructionLength += num);
    const instruction = new Array<number>(instructionLength);
    instruction[0] = op;
    let offSet = 1;
    for(let i = 0; i < operands.length; i++) {
        const width = definition.operandWidths[i];
        switch(width) {
            case 2:
                instruction.splice(offSet, 2, ...getBytes(operands[i], 2));
        }
        offSet += width;
    }
    return instruction;
}
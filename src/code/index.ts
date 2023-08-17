export class Instructions extends Array<number> {
    public toString() {
        let outputString = ""
        let offSet = 0;

        while(offSet < this.length) {
            const def = Lookup(this[offSet]);
            if(def === undefined) {
                outputString += `ERROR: Could not look up ${def}, it is undefined`;
                break;
            }
            const [operands, read] = ReadOperands(def, this.slice(offSet + 1) as Instructions);
            outputString += `${Instructions.formatOffset(offSet)} ${Instructions.formatInstruction(def, operands)}\n`
            offSet += 1 + read;
        }
        return outputString.slice(0, -1);
    }

    public static formatInstruction(def: Definition, operands: number[]): string {
        const operandCount = def.operandWidths.length;
        if(operands.length !== operandCount) {
            return `Error: operand length ${operands.length} does not match defined ${operandCount}`;
        }

        switch (operandCount) {
            case 1:
                return `${def.name} ${operands[0]}`;
            case 0:
                return `${def.name}`;
        }

        return `Error: unhandled operandCount for ${def.name}`;
    }

    public static formatOffset(offSet: number) {
        const thousand =  Math.floor(offSet / 1000);
        const hundred = Math.floor((offSet % 1000)/100);
        const ten = Math.floor((offSet % 100)/10);
        const zero = Math.floor((offSet % 10));
        return `${thousand}${hundred}${ten}${zero}`;
    }
}

export type Opcode = number;

export const OpConstant: Opcode = 0;
export const OpAdd: Opcode = 1;
export const OpPop: Opcode = 2;
export const OpSub: Opcode = 3;
export const OpMul: Opcode = 4;
export const OpDiv: Opcode = 5;
export const OpTrue: Opcode = 6;
export const OpFalse: Opcode = 7;
export const OpEqual: Opcode = 8;
export const OpNotEqual: Opcode = 9;
export const OpGreaterThan: Opcode = 10;
export const OpMinus: Opcode = 11;
export const OpBang: Opcode = 12;
export const OpJumpNotTruthy: Opcode = 13;
export const OpJump: Opcode = 14;

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
    [OpAdd]: new Definition('OpAdd', []),
    [OpPop]: new Definition('OpPop', []),
    [OpSub]: new Definition('OpSub', []),
    [OpMul]: new Definition('OpMul', []),
    [OpDiv]: new Definition('OpDiv', []),
    [OpTrue]: new Definition('OpTrue', []),
    [OpFalse]: new Definition('OpFalse', []),
    [OpEqual]: new Definition('OpEqual', []),
    [OpNotEqual]: new Definition('OpNotEqual', []),
    [OpGreaterThan]: new Definition('OpGreaterThan', []),
    [OpMinus]: new Definition('OpMinus', []),
    [OpBang]: new Definition('OpBang', []),
    [OpJumpNotTruthy]: new Definition('OpJumpNotTruthy', [2]),
    [OpJump]: new Definition('OpJump', [2]),
}

export function Lookup(op: number) {
    return definitions[op];
}

function getBytes(num: number, width: number) {
    let values: Instructions = new Instructions();
    for(let i = 0 ; i < width; i++) {
        values.unshift(num >> (i * 8) & bitmask)
    }
    return values;
}

function getNumber(instructions: Instructions, width: number) {
    let num = 0;
    for(let i = 0; i < width; i++) {
        num = (num << 8) + instructions[i];
    }
    return num;
}

export function Make(op: Opcode, ...operands: number[]): Instructions {
    const definition = definitions[op];
    if(!definition) {
        return new Instructions();
    }
    let instructionLength = 1;
    definition.operandWidths.forEach((num) => instructionLength += num);
    const instruction = new Instructions(instructionLength);
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

export function ReadOperands(def: Definition, instructions: Instructions): [number[], number] {
    const operands = new Array<number>(def.operandWidths.length);
    let offset = 0;

    def.operandWidths.forEach((width, index) => {
        switch (width) {
            case 2:
                operands[index] = ReadUint16(instructions.splice(offset, offset + 2));
        }
        offset += width;
    })

    return [operands, offset];
}

export function ReadUint16(instructions: Instructions): number {
    return getNumber(instructions, 2);
}
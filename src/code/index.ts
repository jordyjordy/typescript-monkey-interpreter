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
        return outputString.trimEnd();
    }

    public static formatInstruction(def: Definition, operands: number[]): string {
        const operandCount = def.operandCount;

        if(operands.length !== operandCount) {
            return `Error: operand length ${operands.length} does not match defined ${operandCount}`;
        }

        switch (operandCount) {
            case 2:
                return `${def.name} ${operands[0]} ${operands[1]}`
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
export const OpNull: Opcode = 15;
export const OpGetGlobal: Opcode = 16;
export const OpSetGlobal: Opcode = 17;
export const OpArray: Opcode = 18;
export const OpHash: Opcode = 19;
export const OpIndex: Opcode = 20;
export const OpCall: Opcode = 21;
export const OpReturnValue: Opcode = 22;
export const OpReturn: Opcode = 23;
export const OpGetLocal: Opcode = 24;
export const OpSetLocal: Opcode = 25;
export const OpGetBuiltin: Opcode = 26;
export const OpClosure: Opcode = 27;
export const OpGetFree: Opcode = 28;
export const OpCurrentClosure: Opcode = 29;

export class Definition {
    name: string;
    operandCount: number

    constructor(name: string, operandCount: number) {
        this.name = name;
        this.operandCount = operandCount;
    }
}

const bitmask = 0b11111111

const definitions = {
    [OpConstant]: new Definition('OpConstant', 1),
    [OpAdd]: new Definition('OpAdd', 0),
    [OpPop]: new Definition('OpPop', 0),
    [OpSub]: new Definition('OpSub', 0),
    [OpMul]: new Definition('OpMul', 0),
    [OpDiv]: new Definition('OpDiv', 0),
    [OpTrue]: new Definition('OpTrue', 0),
    [OpFalse]: new Definition('OpFalse', 0),
    [OpEqual]: new Definition('OpEqual', 0),
    [OpNotEqual]: new Definition('OpNotEqual', 0),
    [OpGreaterThan]: new Definition('OpGreaterThan', 0),
    [OpMinus]: new Definition('OpMinus', 0),
    [OpBang]: new Definition('OpBang', 0),
    [OpJumpNotTruthy]: new Definition('OpJumpNotTruthy', 1),
    [OpJump]: new Definition('OpJump', 1),
    [OpNull]: new Definition('OpNull', 0),
    [OpGetGlobal]: new Definition('OpGetGlobal', 1),
    [OpSetGlobal]: new Definition('OpSetGlobal', 1),
    [OpArray]: new Definition('OpArray', 1),
    [OpHash]: new Definition('OpHash', 1),
    [OpIndex]: new Definition('OpIndex', 0),
    [OpCall]: new Definition('OpCall', 1),
    [OpReturnValue]: new Definition('OpReturnValue', 0),
    [OpReturn]: new Definition('OpReturn', 0),
    [OpGetLocal]: new Definition('OpGetLocal', 1), 
    [OpSetLocal]: new Definition('OpSetLocal', 1),
    [OpGetBuiltin]: new Definition('OpGetBuiltin', 1),
    [OpClosure]: new Definition('OpClosure', 2),
    [OpGetFree]: new Definition('OpGetFree', 1),
    [OpCurrentClosure]: new Definition('OpCurrentClosure', 0),
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
    let instructionLength = 1 + definition.operandCount;
    const instruction = new Instructions(instructionLength);
    instruction[0] = op;
    let offSet = 1;
    for(let i = 0; i < operands.length; i++) {
        instruction.splice(offSet, 1, operands[i])
        offSet += 1;
    }
    return instruction;
}

export function ReadOperands(def: Definition, instructions: Instructions): [number[], number] {
    const operands = new Array<number>(def.operandCount);
    let offset = 0;
    for(let i = 0; i < def.operandCount; i++) {
        operands[i] = instructions[i];
        offset++;
    }
    return [operands, offset];
}
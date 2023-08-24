import * as Obj from "../object";
import * as Code from "../code";
import { Bytecode } from "../compiler";
import { FALSE, NULL, TRUE } from "../evaluator";
import { Boolean } from "../ast";

const stackSize = 2048;

export const globalSize = 65536;


export class Vm {
    constants: Obj.Obj[];
    instructions: Code.Instructions;
    globals: Obj.Obj[];

    stack: Obj.Obj[];
    sp: number;

    constructor(bytecode: Bytecode) {
        this.instructions = bytecode.instructions;
        this.constants = bytecode.constants;

        this.globals = new Array(globalSize);
        this.stack = new Array(stackSize);
        this.sp = 0;

    }

    static newWithGlobalsStore( byteCode: Bytecode, s: Obj.Obj[]) {
        const vm = new Vm(byteCode);
        vm.globals = s;
        return vm;
    }

    stackTop(): Obj.Obj | undefined {
        if (this.sp === 0) {
            return;
        }
        return this.stack[this.sp - 1];
    }

    lastPoppedStackElem(): Obj.Obj | undefined {
        return this.stack[this.sp];
    }

    executeBinaryOperation(op: Code.Opcode): Error | void {
        const right = this.pop();
        const left = this.pop();
        if(left.type() === Obj.INTEGER_OBJ && right.type() === Obj.INTEGER_OBJ) {
            this.executeBinaryIntegerOperation(op, left, right);
        } else if(left.type() === Obj.STRING_OBJ && right.type() === Obj.STRING_OBJ) {
            return this.executeBinaryStringOperation(op, left as Obj.String, right as Obj.String);
        }
    }
    
    executeBinaryIntegerOperation(op: Code.Opcode, left: Obj.Obj, right: Obj.Obj): Error | void {
        const leftValue = (left as Obj.Integer).value;
        const rightValue = (right as Obj.Integer).value;
        let result: number;
        switch (op) {
            case Code.OpAdd:
                result = leftValue + rightValue;
                break;
            case Code.OpSub:
                result = leftValue - rightValue;
                break;
            case Code.OpMul:
                result = leftValue * rightValue;
                break;
            case Code.OpDiv:
                result = Math.floor(leftValue / rightValue);
                break;
            default:
                return new Error(`Unknown integer operation: ${op}`);
        }

        return this.push(new Obj.Integer(result));
    }

    executeBinaryStringOperation(op: Code.Opcode, left: Obj.String, right: Obj.String) {
        const leftValue = left.value;
        const rightValue = right.value;
        let result: string = '';
        switch(op) {
            case Code.OpAdd:
                result = leftValue + rightValue;
                break;
            default: 
                return new Error(`Unknown string operation: ${op}`);
        }
        return this.push(new Obj.String(result));
    }

    executeComparison(op: Code.Opcode): Error | void {
        const right = this.pop();
        const left = this.pop()

        if(left.type() === Obj.INTEGER_OBJ && right.type() === Obj.INTEGER_OBJ) {
            return this.executeIntegerComparison(op, left, right);
        }

        switch (op) {
            case Code.OpEqual:
                this.push(nativeBoolToBooleanObject(right === left));
                break;
            case Code.OpNotEqual:
                this.push(nativeBoolToBooleanObject(right !== left));
                break;
            default:
                return new Error(`Unknown operator: ${op}, ${left.type()}, ${right.type()}`);
        }
    }

    executeIntegerComparison(op: Code.Opcode, left: Obj.Obj, right: Obj.Obj): Error | void {
        const leftValue = (left as Obj.Integer).value;
        const rightValue = (right as Obj.Integer).value;
        switch (op) {
            case Code.OpEqual:
                return this.push(nativeBoolToBooleanObject(rightValue === leftValue));
            case Code.OpNotEqual:
                return this.push(nativeBoolToBooleanObject(rightValue !== leftValue));
            case Code.OpGreaterThan:
                return this.push(nativeBoolToBooleanObject(rightValue < leftValue));
            default:
                return new Error(`unknown operator: ${op}`);
        }
    }

    executeBangOperator(): Error | void {
        const operand = this.pop();
        switch(operand) {
            case TRUE:
                return this.push(FALSE);
            case FALSE: 
                return this.push(TRUE);
            case NULL:
                return this.push(TRUE);
            default:
                return this.push(FALSE);
        }
    }

    executeMinusOperator(): Error | void {
        const operand = this.pop();
        if(operand.type() !== Obj.INTEGER_OBJ) {
            return new Error(`unsupported type for negation: ${operand.type()}`);
        }
        return this.push(new Obj.Integer(-(operand as Obj.Integer).value));
    }

    executeIndexExpression(left: Obj.Obj, index: Obj.Obj): Error | void {
        switch(true) {
            case left.type() === Obj.ARRAY_OBJ && index.type() === Obj.INTEGER_OBJ:
                return this.executeArrayIndexExpression(left as Obj.ArrayLiteral, index as Obj.Integer);
            case left.type() === Obj.HASH_OBJ:
                return this.executeHashIndexExpression(left as Obj.Hash, index);
            default:
                return new Error(`index operator not supported: ${left.type()}`);
        }
    }

    executeArrayIndexExpression(left: Obj.ArrayLiteral, index: Obj.Integer): Error | void {
        const i = index.value;
        const max = left.elements.length - 1;
        if(i < 0 || i > max) {
            return this.push(NULL);
        }
        return this.push(left.elements[i]);
    }

    executeHashIndexExpression(left: Obj.Hash, index: Obj.Obj): Error | void {
        if(!(index instanceof Obj.Hashable)) {
            return new Error(`${index.type()} is not as suitable hashkey`);
        }
        const hashedIndex = index as Obj.IHashable;

        const pair = left.pairs.get(hashedIndex.hashKey().value);
        if(!pair) {
            return this.push(NULL);
        }
        return this.push(pair.value);
    }

    buildArray(startIndex: number, endIndex: number): Obj.ArrayLiteral {
        const elements: Obj.Obj[] = new Array<Obj.Obj>(endIndex - startIndex);
        for(let i = startIndex; i < endIndex; i++) {
            elements[i - startIndex] = this.stack[i];
        }
        return new Obj.ArrayLiteral(elements);
    }

    buildHash(startIndex: number, endIndex: number): Obj.Hash | Error {
        const hashedPairs = new Map<string, Obj.HashPair>();
        for(let i = startIndex; i < endIndex; i+=2) {
            const key = this.stack[i];
            const value = this.stack[i + 1];
            const pair = new Obj.HashPair(key, value);
            if(!(key instanceof Obj.Hashable)) {
                return new Error(`unusable as hash key: ${key}`);
            }
            const hashKey = key as Obj.IHashable;

            hashedPairs.set(hashKey.hashKey().value , pair);
        }
        return new Obj.Hash(hashedPairs);
    }

    run(): Error | void {
        
        for(let ip = 0; ip < this.instructions.length; ip++) {
            const op = this.instructions[ip] as Code.Opcode;
            switch (op) {
                case Code.OpConstant:
                    
                    const constIndex = Code.ReadUint16(this.instructions.slice(ip + 1));
                    ip += 2;

                    this.push(this.constants[constIndex]);
                    break;
                case Code.OpAdd:
                case Code.OpSub:
                case Code.OpMul:
                case Code.OpDiv: {
                    const error = this.executeBinaryOperation(op);
                    if(error) {
                        return error;
                    }
                    break;
                }
                case Code.OpTrue: {
                    const err = this.push(TRUE);
                    if(err) {
                        return err;
                    }
                    break;
                }
                case Code.OpFalse: {
                    const err = this.push(FALSE);
                    if(err) {
                        return err;
                    }
                    break;
                }
                case Code.OpEqual:
                case Code.OpNotEqual:
                case Code.OpGreaterThan: {
                    const err = this.executeComparison(op);
                    if(err) {
                        return err;
                    }
                    break;
                }
                case Code.OpBang: {
                    const err = this.executeBangOperator();
                    if (err) {
                        return err;
                    }
                    break;
                }
                case Code.OpMinus: {
                    const err = this.executeMinusOperator();
                    if (err) {
                        return err;
                    }
                    break;
                }
                case Code.OpJump: {
                    const pos = Code.ReadUint16(this.instructions.slice(ip + 1));
                    ip = pos - 1; 
                    break;
                }
                case Code.OpJumpNotTruthy: {
                    const pos = Code.ReadUint16(this.instructions.slice(ip + 1));
                    ip += 2;
                    const condition = this.pop();
                    if(!this.isTruthy(condition)) {
                        ip = pos - 1;
                    }
                }
                case Code.OpNull: {
                    const err = this.push(NULL);
                    if (err) {
                        return err;
                    }
                    break;
                }
                case Code.OpSetGlobal: {
                    const globalIndex = Code.ReadUint16(this.instructions.slice(ip + 1));
                    ip += 2;

                    this.globals[globalIndex] = this.pop();
                    break;
                }
                case Code.OpGetGlobal: {
                    const globalIndex = Code.ReadUint16(this.instructions.slice(ip + 1));
                    
                    ip += 2;

                    const err = this.push(this.globals[globalIndex]);
                    if(err) {
                        return err;
                    }
                    break;
                }
                case Code.OpArray: {
                    const numElements = Code.ReadUint16(this.instructions.slice(ip + 1));
                    ip += 2;
                    const array = this.buildArray(this.sp - numElements, this.sp);
                    this.sp -= numElements;
                    const err = this.push(array);

                    if(err) {
                        return err;
                    }
                    break;
                }
                case Code.OpHash: {
                    const numElements = Code.ReadUint16(this.instructions.slice(ip+ 1));
                    ip += 2;
                    const hash = this.buildHash(this.sp - numElements, this.sp);
                    if(hash instanceof Error) {
                        return hash;
                    }
                    this.sp -= numElements;
                    const err = this.push(hash);
                    if(err) {
                        return err;
                    }
                    break;
                }
                case Code.OpIndex: {
                    const index = this.pop();
                    const left = this.pop();
                    const error = this.executeIndexExpression(left, index);
                    if(error) {
                        return error;
                    }

                    break;
                }
                case Code.OpPop:
                    this.pop();
                    break;
            }
        }
    }

    isTruthy(obj: Obj.Obj): boolean {
        switch(obj.type()) {
            case Obj.BOOLEAN_OBJ:
                return (obj as Obj.Bool).value;
            case Obj.NULL_OBJ:
                return false;
            default:
                return true;
        }
    }

    push(o: Obj.Obj): Error | void {
        if(this.sp >= stackSize) {
            return new Error('Stack overflow');
        }
        this.stack[this.sp] = o;
        this.sp ++;
    }

    pop(): Obj.Obj {
        const obj = this.stack[this.sp - 1];
        this.sp--;
        return obj;
    }
}


function nativeBoolToBooleanObject(input: boolean): Obj.Bool {
    return input
        ? TRUE
        : FALSE;
}

import * as Obj from "../object";
import * as Code from "../code";
import { Bytecode } from "../compiler";

const stackSize = 2048;

export class Vm {
    constants: Obj.Obj[];
    instructions: Code.Instructions;

    stack: Obj.Obj[];
    sp: number;

    constructor(bytecode: Bytecode) {
        this.instructions = bytecode.instructions;
        this.constants = bytecode.constants;

        this.stack = new Array(stackSize);
        this.sp = 0;

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
                case Code.OpDiv:
                    const error = this.executeBinaryOperation(op);
                    if(error) {
                        return error;
                    }
                    break;
                case Code.OpPop:
                    this.pop();
                    break;
            }
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
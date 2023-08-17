import * as Obj from "../object";
import * as Code from "../code";
import { Bytecode } from "../compiler";
import { FALSE, TRUE } from "../evaluator";
import { Boolean } from "../ast";

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

import * as Ast from "../ast";
import * as Code from "../code";
import Lexer from "../lexer";
import * as Obj from "../object";
import { Parser } from "../parser";

export class Bytecode {
    instructions: Code.Instructions;
    constants: Obj.Obj[];
    constructor(instructions: Code.Instructions, constants: Obj.Obj[]) {
        this.instructions = instructions;
        this.constants = constants;
    }
}

export class Compiler {
    instructions: Code.Instructions;
    constants: Obj.Obj[];

    constructor() {
        this.instructions = [];
        this.constants = [];
    }

    compile(node: Ast.Node): Error | void {
        switch(node.constructor) {
            case Ast.Program:
                const program = node as Ast.Program;
                program.statements.forEach((statement) => {
                    const error = this.compile(statement);
                    if(error !== undefined) {
                        return error;
                    }
                })
                break;
            case Ast.ExpressionStatement:
                const expressionStmnt = node as Ast.ExpressionStatement;
                if(expressionStmnt.expression) {
                    const error = this.compile(expressionStmnt.expression);
                    if(error !== undefined) {
                        return error;
                    }
                } else {
                    return new Error('Expressions statement is missing expression');
                }
                break;
            case Ast.InfixExpression:
                const infix = node as Ast.InfixExpression;
                let error = this.compile(infix.left);
                if(error !== undefined) {
                    return error;
                }
                if(!infix.right) {
                    return new Error('Infix expression is missing right hand side');
                }
                error = this.compile(infix.right);
                if(error !== undefined) {
                    return error;
                }
                switch(infix.operator) {
                    case "+":
                        this.emit(Code.OpAdd);
                        break;
                    default: 
                        return new Error(`Unknown operator: ${infix.operator}`);
                }
                break;
            case Ast.IntegerLiteral:
                const intLit = node as Ast.IntegerLiteral;
                if(!intLit.value) {
                    return new Error('IntegerLiteral is missing a value');
                }
                const integer = new Obj.Integer(intLit.value);
                this.emit(Code.OpConstant, this.addConstant(integer));
        }
    }

    addConstant(obj: Obj.Obj): number {
        this.constants.push(obj);
        return this.constants.length - 1;
    }

    emit(op: Code.Opcode, ...operands: number[]) {
        const ins = Code.Make(op, ...operands);
        const pos = this.addInstruction(ins);
        return pos;
    }

    addInstruction(instruction: number[]): number {
        const posNewInstruction = this.instructions.length;
        this.instructions.push(...instruction);
        return posNewInstruction;
    }

    byteCode(): Bytecode {
        return new Bytecode(this.instructions, this.constants);
    }
}
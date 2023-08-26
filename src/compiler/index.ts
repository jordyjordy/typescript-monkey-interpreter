import * as Ast from "../ast";
import * as Code from "../code";
import Lexer from "../lexer";
import * as Obj from "../object";
import { Parser } from "../parser";
import { EnclosedSymbolTable, GlobalScope, SymbolTable } from "./symbolTable";

export class Bytecode {
    instructions: Code.Instructions;
    constants: Obj.Obj[];
    constructor(instructions: Code.Instructions, constants: Obj.Obj[]) {
        this.instructions = instructions;
        this.constants = constants;
    }
}

export class EmittedInstruction {
    OpCode?: Code.Opcode;
    position?: number;

    constructor(OpCode?: Code.Opcode, position?: number) {
        this.OpCode = OpCode;
        this.position = position;
    }
}

export class ComplationScope {
    instructions: Code.Instructions;
    lastInstruction: EmittedInstruction;
    previousInstruction: EmittedInstruction;

    constructor() {
        this.instructions = new Code.Instructions(); 
        this.lastInstruction = new EmittedInstruction();
        this.previousInstruction = new EmittedInstruction();
    }
}

export class Compiler {
    constants: Obj.Obj[];
    symbolTable: SymbolTable;

    scopes: ComplationScope[];
    scopeIndex: number;

    constructor() {
        this.constants = new Array<Obj.Obj>();
        this.symbolTable = new SymbolTable();
        this.scopes = new Array<ComplationScope>(new ComplationScope());
        this.scopeIndex = 0;
    }

    static newWithState(s: SymbolTable, constants: Obj.Obj[]) {
        const compiler = new Compiler();
        compiler.symbolTable = s;
        compiler.constants = constants;
        return compiler;
    }

    currentInstructions(): Code.Instructions {
        return this.scopes[this.scopeIndex].instructions;
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
            case Ast.PrefixExpression:
                const prefix = node as Ast.PrefixExpression;
                if(!prefix.right) {
                    return new Error('Prefix missing right side');
                }
                const err = this.compile(prefix.right);
                if(err) {
                    return err;
                }
                switch(prefix.operator) {
                    case "!":
                        this.emit(Code.OpBang);
                        return;
                    case "-":
                        this.emit(Code.OpMinus);
                        return;
                    default:
                        return new Error(`unknown operator: ${prefix.operator}`);
                }
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
                this.emit(Code.OpPop);
                break;
            case Ast.InfixExpression:
                const infix = node as Ast.InfixExpression;
                if(infix.operator === '<') {
                    if(!infix.right) {
                        return new Error('Infix expression is missing right hand side');
                    }
                    let error = this.compile(infix.right);
                    if(error) {
                        return error;
                    }

                    error = this.compile(infix.left);
                    if(error) {
                        return error;
                    }
                    this.emit(Code.OpGreaterThan);
                    return;
                }
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
                    case "-":
                        this.emit(Code.OpSub)
                        break;
                    case "*":
                        this.emit(Code.OpMul);
                        break;
                    case "/":
                        this.emit(Code.OpDiv);
                        break;
                    case ">":
                        this.emit(Code.OpGreaterThan);
                        break;
                    case "==":
                        this.emit(Code.OpEqual);
                        break;
                    case "!=":
                        this.emit(Code.OpNotEqual);
                        break;
                    default: 
                        return new Error(`Unknown operator: ${infix.operator}`);
                }
                break;
            case Ast.IntegerLiteral:
                const intLit = node as Ast.IntegerLiteral;
                if(intLit.value === undefined) {
                    return new Error('IntegerLiteral is missing a value');
                }
                const integer = new Obj.Integer(intLit.value);
                this.emit(Code.OpConstant, this.addConstant(integer));
                break;
            case Ast.Boolean:
                const bool = node as Ast.Boolean;
                if(bool.value) {
                    this.emit(Code.OpTrue);
                } else {
                    this.emit(Code.OpFalse);
                }
                break;
            case Ast.IfExpression: {
                const ifExp = node as Ast.IfExpression;
                if(!ifExp.condition) {
                    throw new Error('If expression missing conditions');
                }
                const err = this.compile(ifExp.condition);
                if(err) {
                    return err;
                }
                const jumpPosNotTruthy = this.emit(Code.OpJumpNotTruthy, 9999);
                if(!ifExp.consequence) {
                    return new Error('If expression missing consequence');
                }
                const consequenceError = this.compile(ifExp.consequence);
                if(consequenceError) {
                    return consequenceError;
                }
                if(this.lastInstructionIs(Code.OpPop)) {
                    this.removeLastPop();
                }

                const jumpPos = this.emit(Code.OpJump, 9999);
                const afterConsequencePos = this.currentInstructions().length;
                this.changeOperand(jumpPosNotTruthy, afterConsequencePos);

                if(!ifExp.alternative) {
                    this.emit(Code.OpNull);
                } else {
                    const err = this.compile(ifExp.alternative);
                    if(err) {
                        return err;
                    }

                    if(this.lastInstructionIs(Code.OpPop)) {
                        this.removeLastPop()
                    }
                }
                const afterAlternativePos = this.currentInstructions().length;
                this.changeOperand(jumpPos, afterAlternativePos);

                break;
            }
            case Ast.LetStatement: {
                const letNode = node as Ast.LetStatement;
                if(!letNode.value) {
                    return new Error('let statement is missing value');
                }
                const err = this.compile(letNode.value);
                if(err) {
                    return err;
                }
                const symbol = this.symbolTable.define(letNode.name?.value!);
                const opCode = symbol.scope === GlobalScope
                    ? Code.OpSetGlobal
                    : Code.OpSetLocal

                this.emit(opCode, symbol.index);
                break;
            }
            case Ast.Identifier: {
                const identifier = node as Ast.Identifier;
                const symbol = this.symbolTable.resolve(identifier.value);
                if(!symbol) {
                    return new Error(`undefined variable: ${identifier.value}`);
                }
                const opCode = symbol.scope === GlobalScope
                ? Code.OpGetGlobal
                : Code.OpGetLocal
                this.emit(opCode, symbol.index);
                break;
            }
            case Ast.StringLiteral: {
                const stringLit = node as Ast.StringLiteral;
                const string = new Obj.String(stringLit.value);
                this.emit(Code.OpConstant, this.addConstant(string));
                break;
            }
            case Ast.ArrayLiteral: {
                const arrayLit = node as Ast.ArrayLiteral;
                for(let i = 0; i < arrayLit.elements.length; i++) {
                    const err = this.compile(arrayLit.elements[i]!);
                    if(err) {
                        return err;
                    }
                }
                this.emit(Code.OpArray, arrayLit.elements.length);
                break;
            }
            case Ast.HashLiteral: {
                const hashLit = node as Ast.HashLiteral;
                const entries = hashLit.pairs.entries();
                let entry = entries.next();
                while(!entry.done) {
                    this.compile(entry.value[0]);
                    this.compile(entry.value[1]);
                    entry = entries.next();
                }
                this.emit(Code.OpHash, hashLit.pairs.size * 2);
                break;
            }
            case Ast.IndexExpression: {
                const indexExpr = node as Ast.IndexExpression;
                const leftError = this.compile(indexExpr.left);
                if(leftError) {
                    return leftError;
                }
                const indexError = this.compile(indexExpr.index!);
                if(indexError) {
                    return indexError;
                }
                this.emit(Code.OpIndex);
                break;
            }
            case Ast.FunctionLiteral: {
                this.enterScope();
                const funcLit = node as Ast.FunctionLiteral;
                const err = this.compile(funcLit.body!);
                if(err) {
                    return err;
                }

                if(this.lastInstructionIs(Code.OpPop)) {
                    this.replaceLastPopWithReturn();
                }
                if(!this.lastInstructionIs(Code.OpReturnValue)) {
                    this.emit(Code.OpReturn);
                }
                const numLocals = this.symbolTable.numDefinitions;
                const instructions = this.leaveScope();
                
                const compiledFunction = new Obj.CompiledFunction(instructions, numLocals);
                this.emit(Code.OpConstant, this.addConstant(compiledFunction));
                break;
            }
            case Ast.ReturnStatement: {
                const returnStmnt = node as Ast.ReturnStatement;
                const err = this.compile(returnStmnt.returnValue!);
                if(err) {
                    return err;
                }
                this.emit(Code.OpReturnValue);
                break;
            }
            case Ast.CallExpression: {
                const callExpr = node as Ast.CallExpression;
                const error = this.compile(callExpr.func!);
                if(error) {
                    return error
                }
                this.emit(Code.OpCall);
                break;
            }
            case Ast.BlockStatement: {
                const blockStmt = node as Ast.BlockStatement;
                for(let i = 0; i < blockStmt.statements.length; i++) {
                    const err = this.compile(blockStmt.statements[i]);
                    if(err) {
                        return err;
                    }
                }
                return;             
            }
        }
    }

    addConstant(obj: Obj.Obj): number {
        this.constants.push(obj);
        return this.constants.length - 1;
    }

    emit(op: Code.Opcode, ...operands: number[]) {
        const ins = Code.Make(op, ...operands);
        const pos = this.addInstruction(ins);

        this.setLastInstruction(op, pos);
        return pos;
    }

    addInstruction(instruction: number[]): number {
        const posNewInstruction = this.currentInstructions().length;
        this.currentInstructions().push(...instruction);
        return posNewInstruction;
    }

    byteCode(): Bytecode {
        return new Bytecode(this.currentInstructions(), this.constants);
    }

    setLastInstruction(op: Code.Opcode, position: number) {
        const previous = this.scopes[this.scopeIndex].lastInstruction;
        const last = new EmittedInstruction(op, position);
        this.scopes[this.scopeIndex].previousInstruction = previous;
        this.scopes[this.scopeIndex].lastInstruction = last;
    }

    lastInstructionIs(op: Code.Opcode): boolean {
        return this.currentInstructions().length === 0
            ? false
            : this.scopes[this.scopeIndex].lastInstruction.OpCode === op;
    }
    
    removeLastPop() {
        const last = this.scopes[this.scopeIndex].lastInstruction;
        
        this.scopes[this.scopeIndex].instructions = this.currentInstructions().slice(0, last?.position);
        this.scopes[this.scopeIndex].lastInstruction = this.scopes[this.scopeIndex].previousInstruction;
    }

    replaceInstruction(pos: number, newInstruction: Code.Instructions) {
        this.currentInstructions().splice(pos, newInstruction.length, ...newInstruction);
    }
    
    replaceLastPopWithReturn() {
        const lastPos = this.scopes[this.scopeIndex].lastInstruction.position;
        this.replaceInstruction(lastPos!, Code.Make(Code.OpReturnValue));

        this.scopes[this.scopeIndex].lastInstruction.OpCode = Code.OpReturnValue;
    }

    changeOperand(opPos: number, operand: number) {
        const op = this.currentInstructions()[opPos] as Code.Opcode;
        const newInstruction = Code.Make(op, operand);

        this.replaceInstruction(opPos, newInstruction);
    }

    enterScope() {
        const scope = new ComplationScope();
        this.symbolTable = new EnclosedSymbolTable(this.symbolTable);
        this.scopes.push(scope);
        this.scopeIndex++;
    }

    leaveScope() {
        const instructions = this.currentInstructions();
        this.symbolTable = (this.symbolTable as EnclosedSymbolTable).parentTable;
        this.scopes.pop();
        this.scopeIndex--;

        return instructions;
    }
}
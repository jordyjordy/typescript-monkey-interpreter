import * as ast from "../ast";
import * as code from "../code";
import Lexer from "../lexer";
import * as obj from "../object";
import { Parser } from "../parser";


export class Bytecode {
    instructions: code.Instructions;
    constants: obj.Obj[];
    constructor(instructions: code.Instructions, constants: obj.Obj[]) {
        this.instructions = instructions;
        this.constants = constants;
    }
}

export class Compiler {
    instructions: code.Instructions;
    constants: obj.Obj[];

    constructor() {
        this.instructions = [];
        this.constants = [];
    }

    compile(node: ast.Node) {
        return null;
    }

    byteCode(): Bytecode {
        return new Bytecode(this.instructions, this.constants);
    }
}
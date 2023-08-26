import Lexer from "./lexer";
import { Parser } from "./parser";
import { Eval } from "./evaluator";
import { Program } from "./ast";
import Environment from "./evaluator/environment"
import { Compiler } from "./compiler";
import { Vm, globalSize } from "./vm";
import * as Obj from "./object";
import { SymbolTable } from "./compiler/symbolTable";
import Builtins from "./object/builtins";

const prompt =">> ";
const MONKEY_FACE = `            __,__
   .--.  .-"     "-.  .--.
  / .. \\/  .-. .-.  \\/ .. \\
 | |  '|  /   Y   \\  |'  | |
 | \\   \\  \\ 0 | 0 /  /   / |
  \\ '- ,\\.-"""""""-./, -' /
   ''-' /_   ^ ^   _\ '-''
       |  \\._   _./  |
       \\   \\ '~' /   /
        '._ '-=-' _.'
           '-----'
`

function start() {
    const env = new Environment();

    const constants: Obj.Obj[] = [];
    const globals = new Array<Obj.Obj>(globalSize);
    const symbolTable = new SymbolTable();

    Object.entries(Builtins).forEach(([name], i) => {
        symbolTable.defineBuiltIn(i, name);
    })

    process.stdin.resume();
    process.stdin.setEncoding('utf-8');
    process.stdout.write(prompt);
    process.stdin.on('data', function(text) {
        text.toString().trim();
        if(text.toString().trim() === 'quit' || text.toString().trim() === 'exit') {
            process.exit()
        }
        const lexer = new Lexer(text.toString().trim());
        const parser = new Parser(lexer);
        const program = parser.ParseProgram();
        if(parser.errors.length > 0) {
            process.stderr.write(MONKEY_FACE);
            process.stderr.write('Whoops we ran into some monkey business here!\n');
            process.stderr.write(' parser errors:\n');
            process.stderr.write(`\t- ${parser.errors.join('\n\t- ')}\n`);
            process.stdout.write(`\n${prompt}`);
            return;
        }
        const compiler = Compiler.newWithState(symbolTable, constants);
        const compileErrors = compiler.compile(program!);
        if(compileErrors) {
            console.error(`Whoops compilation failed, ${compileErrors}`);
            return;
        }
        const code = compiler.byteCode();

        const machine = Vm.newWithGlobalsStore(code, globals);
        const vmError = machine.run();
        if(vmError) {
            console.error(`Whoops executing bytecode failed, ${compileErrors}`);
            return;
        }

        const stackTop = machine.lastPoppedStackElem();

        if(stackTop) {
            process.stdout.write(stackTop?.inspect() ?? '');
            process.stdout.write(`\n${prompt}`);
        } else {
            process.stdout.write(prompt);
        }
    })
};

export default {
    start
};

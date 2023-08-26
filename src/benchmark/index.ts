import { Compiler } from "../compiler";
import { Eval } from "../evaluator";
import Environment from "../evaluator/environment";
import Lexer from "../lexer";
import { Parser } from "../parser";
import { Vm } from "../vm";

const input: string = `
let fibonacci = fn(x) {
if (x == 0) {
0
} else {
if (x == 1) {
return 1;
} else {
fibonacci(x - 1) + fibonacci(x - 2);
}
}
};
fibonacci(35);
`;



const lexer = new Lexer(input);
const parser = new Parser(lexer);
const program = parser.ParseProgram();

const compiler = new Compiler();
const err = compiler.compile(program!);
const machine = new Vm(compiler.byteCode());
console.time('vm');
machine.run();
console.timeEnd('vm');

console.log(machine.lastPoppedStackElem());
console.time('eval')
const env = new Environment();
const result = Eval(program!, env);
console.timeEnd('eval');

console.log(result);

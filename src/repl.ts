import Lexer from "./lexer";
import { Parser } from "./parser";
import { Eval } from "./evaluator";
import { Program } from "./ast";

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
        const evaluated = Eval(program as Program);
        if(evaluated) {
            process.stdout.write(evaluated.inspect());
        }
        process.stdout.write(`\n${prompt}`);
    })
};


export default {
    start
};
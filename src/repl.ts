import Lexer from "./lexer";
import token, { Token } from "./token";

const prompt =">> ";

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
        let tok: Token;
        do {
            tok = lexer.NextToken();
            console.log(tok);
        } while(tok[0] !== token.EOF)
        process.stdout.write(prompt);
    })
};

export default {
    start
};
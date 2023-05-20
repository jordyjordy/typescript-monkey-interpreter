import token, { Token, TokenType } from "./token";
import Lexer from "./lexer";

describe('lexer', () => {
    it('tests next token', () => {
        const input = '=+(){},;';
        const tests: [TokenType, string][] = [
            [token.ASSIGN, '='],
            [token.PLUS, '+'],
            [token.LPAREN, '('],
            [token.RPAREN, ')'],
            [token.LBRACE, '{'],
            [token.RBRACE, '}'],
            [token.COMMA, ','],
            [token.SEMICOLON, ';'],
            [token.EOF, ''],
        ]

        const lexer = new Lexer(input);

        for(let i = 0; i < tests.length; i++) {
            const test = tests[i];
            const token = lexer.NextToken() as Token;
            expect(token[0]).toEqual(test[0]);
            expect(token[1]).toEqual(test[1]);
        }
    })

    it('handles basic syntax', () => {
        const input =  `let five = 5;
let ten = 10;
let add = fn(x, y) {
    x + y;
};
let result = add(five, ten);
`;
        const tests: [TokenType, string][] = [
            [token.LET, "let"],
            [token.IDENT, "five"],
            [token.ASSIGN, "="],
            [token.INT, "5"],
            [token.SEMICOLON, ";"],
            [token.LET, "let"],
            [token.IDENT, "ten"],
            [token.ASSIGN, "="],
            [token.INT, "10"],
            [token.SEMICOLON, ";"],
            [token.LET, "let"],
            [token.IDENT, "add"],
            [token.ASSIGN, "="],
            [token.FUNCTION, "fn"],
            [token.LPAREN, "("],
            [token.IDENT, "x"],
            [token.COMMA, ","],
            [token.IDENT, "y"],
            [token.RPAREN, ")"],
            [token.LBRACE, "{"],
            [token.IDENT, "x"],
            [token.PLUS, "+"],
            [token.IDENT, "y"],
            [token.SEMICOLON, ";"],
            [token.RBRACE, "}"],
            [token.SEMICOLON, ";"],
            [token.LET, "let"],
            [token.IDENT, "result"],
            [token.ASSIGN, "="],
            [token.IDENT, "add"],
            [token.LPAREN, "("],
            [token.IDENT, "five"],
            [token.COMMA, ","],
            [token.IDENT, "ten"],
            [token.RPAREN, ")"],
            [token.SEMICOLON, ";"],
            [token.EOF, ""]
        ]

        const lexer = new Lexer(input);

        for(let i = 0; i < tests.length; i++) {
            const test = tests[i];
            const token = lexer.NextToken() as Token;
            expect(token[0]).toEqual(test[0]);
            expect(token[1]).toEqual(test[1]);
        }
    })

    it('handles extended tokens', () => {
        const input = `let five = 5;
let ten = 10;
let add = fn(x, y) {
    x + y;
};
let result = add(five, ten);
!-/*5;
5 < 10 > 5;
`;
        const tests: [TokenType, string][] = [
            [token.LET, "let"],
            [token.IDENT, "five"],
            [token.ASSIGN, "="],
            [token.INT, "5"],
            [token.SEMICOLON, ";"],
            [token.LET, "let"],
            [token.IDENT, "ten"],
            [token.ASSIGN, "="],
            [token.INT, "10"],
            [token.SEMICOLON, ";"],
            [token.LET, "let"],
            [token.IDENT, "add"],
            [token.ASSIGN, "="],
            [token.FUNCTION, "fn"],
            [token.LPAREN, "("],
            [token.IDENT, "x"],
            [token.COMMA, ","],
            [token.IDENT, "y"],
            [token.RPAREN, ")"],
            [token.LBRACE, "{"],
            [token.IDENT, "x"],
            [token.PLUS, "+"],
            [token.IDENT, "y"],
            [token.SEMICOLON, ";"],
            [token.RBRACE, "}"],
            [token.SEMICOLON, ";"],
            [token.LET, "let"],
            [token.IDENT, "result"],
            [token.ASSIGN, "="],
            [token.IDENT, "add"],
            [token.LPAREN, "("],
            [token.IDENT, "five"],
            [token.COMMA, ","],
            [token.IDENT, "ten"],
            [token.RPAREN, ")"],
            [token.SEMICOLON, ";"],
            [token.BANG, '!'],
            [token.MINUS, '-'],
            [token.SLASH, '/'],
            [token.ASTERISK, '*'],
            [token.INT, '5'],
            [token.SEMICOLON, ';'],
            [token.INT, '5'],
            [token.LT, '<'],
            [token.INT, '10'],
            [token.GT, '>'],
            [token.INT, '5'],
            [token.SEMICOLON, ';'],
            [token.EOF, '']
        ]

        const lexer = new Lexer(input);

        for(let i = 0; i < tests.length; i++) {
            const test = tests[i];
            const token = lexer.NextToken() as Token;
            expect(token[0]).toEqual(test[0]);
            expect(token[1]).toEqual(test[1]);
        }
    })

    it('handles true/false keywords', () => {
        const input = `if (5 < 10) {
    return true;
} else {
    return false;
}`;
        const tests: [TokenType, string][] = [
           [token.IF, 'if'],
           [token.LPAREN, '('],
           [token.INT, '5'],
           [token.LT, '<'],
           [token.INT, '10'],
           [token.RPAREN, ')'],
           [token.LBRACE, '{'],
           [token.RETURN, 'return'],
           [token.TRUE, 'true'],
           [token.SEMICOLON, ';'],
           [token.RBRACE, '}'],
           [token.ELSE, 'else'],
           [token.LBRACE, '{'],
           [token.RETURN, 'return'],
           [token.FALSE, 'false'],
           [token.SEMICOLON, ';'],
           [token.RBRACE, '}'],
           [token.EOF, ''],
        ]

        const lexer = new Lexer(input);

        for(let i = 0; i < tests.length; i++) {
            const test = tests[i];
            const token = lexer.NextToken() as Token;
            expect(token[0]).toEqual(test[0]);
            expect(token[1]).toEqual(test[1]);
        }
    })

    it('handles equals and not equals', () => {
        const input = `10 == 10;
10 != 9;`;
        const tests: [TokenType, string][] = [
            [token.INT, '10'],
            [token.EQ, '=='],
            [token.INT, '10'],
            [token.SEMICOLON, ';'],
            [token.INT, '10'],
            [token.NEQ, '!='],
            [token.INT, '9'],
            [token.SEMICOLON, ';'],
            [token.EOF, ''],
        ]

        const lexer = new Lexer(input);

        for(let i = 0; i < tests.length; i++) {
            const test = tests[i];
            const token = lexer.NextToken() as Token;
            expect(token[0]).toEqual(test[0]);
            expect(token[1]).toEqual(test[1]);
        }
    })
})
import token, { Token, TokenType } from "./token";

const keywords: {[k:string]: TokenType | undefined } = {
    fn: token.FUNCTION,
    let: token.LET,
    true: token.TRUE,
    false: token.FALSE,
    if: token.IF,
    else: token.ELSE,
    return: token.RETURN,
}

function lookupIdent(ident:string) {
    return keywords[ident] ?? token.IDENT
}

function isLetter(letter: string) {
    return letter.length === 1
        ? /[a-zA-Z]/.test(letter)
        : false
}

function isDigit(digit: string) {
    return /[0-9]+/.test(digit);
}

export class Lexer {
    input: string;
    position: number;
    readPosition: number;
    ch: string;

    constructor(input: string) {
        this.input = input;
        this.position = 0;
        this.readPosition = 0;
        this.ch = '';

        this.readChar();
    }


    readChar() {
        if(this.readPosition >= this.input.length) {
            this.ch = '';
        } else {
            this.ch = this.input[this.readPosition];
        }
        this.position = this.readPosition;
        this.readPosition += 1;
    }

    peekChar() {
        return this.readPosition >= this.input.length
            ? ''
            : this.input[this.readPosition]
    }

    readIdentifier(): string {
        const pos = this.position;
        while(isLetter(this.ch)) {
            this.readChar();
        }
        return this.input.substring(pos, this.position);
    }

    readString() {
        const pos = this.position + 1;
        do {
            this.readChar();
        } while (this.ch !== '"' && this.ch !== '');
        return this.input.substring(pos, this.position);
    }

    readNumber(): string {
        const pos = this.position;
        while(isDigit(this.ch)) {
            this.readChar();
        }
        return this.input.substring(pos, this.position);
    }

    skipWhiteSpace() {
        while(this.ch === ' ' || this.ch === '\t' || this.ch === '\n' || this.ch === '\r') {
            this.readChar();
        }
    }

    NextToken(): Token {
        var tok: Token;
        this.skipWhiteSpace();
        switch (this.ch) {
            case '=':
                if(this.peekChar() === '=') {
                    const ch = this.ch;
                    this.readChar();
                    tok = [token.EQ, `${ch}${this.ch}`];
                    break;
                }
                tok = [token.ASSIGN, this.ch];
                break;
            case ';':
                tok = [token.SEMICOLON, this.ch];
                break;
            case '(':
                tok = [token.LPAREN, this.ch];
                break;
            case ')':
                tok = [token.RPAREN, this.ch];
                break;
            case ',':
                tok = [token.COMMA, this.ch];
                break;
            case '+':
                tok = [token.PLUS, this.ch];
                break;
            case '-':
                tok = [token.MINUS, this.ch];
                break;
            case '!':
                if(this.peekChar() === '=') {
                    const ch = this.ch;
                    this.readChar();
                    tok = [token.NEQ, `${ch}${this.ch}`];
                    break;
                }
                tok = [token.BANG, this.ch];
                break;
            case '/':
                tok = [token.SLASH, this.ch];
                break;
            case '*':
                tok = [token.ASTERISK, this.ch];
                break;
            case '<':
                tok = [token.LT, this.ch];
                break;
            case '>':
                tok = [token.GT, this.ch];
                break;
            case '{':
                tok = [token.LBRACE, this.ch];
                break;
            case '}':
                tok = [token.RBRACE, this.ch];
                break;
            case '[':
                tok = [token.LBRACKET, this.ch];
                break;
            case ']':
                tok = [token.RBRACKET, this.ch];
                break;
            case '"':
                tok = [token.STRING, this.readString()];
                break;
            case '':
                tok = [token.EOF, this.ch];
                break;
            default:
                if(isLetter(this.ch)) {
                    const literal = this.readIdentifier();
                    return [lookupIdent(literal), literal];
                } else if(isDigit(this.ch)) {
                    return [token.INT,  this.readNumber()]
                }
                tok = [token.ILLEGAL, this.ch];
        }
        this.readChar();
        return tok;
    }
}


export default Lexer;
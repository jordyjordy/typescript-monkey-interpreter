export type Token = [
    TokenType,
    string
]

const token = {
    ILLEGAL: 'ILLEGAL',
    EOF: 'EOF',

    IDENT: 'IDENT',
    INT: 'INT',

    ASSIGN: '=',
    PLUS: '+',
    MINUS: '-',
    BANG: '!',
    ASTERISK: '*',
    SLASH: '/',
    COLON: ':',

    LT: '<',
    GT: '>',

    EQ: '==',
    NEQ: '!=',

    COMMA: ',',
    SEMICOLON: ';',
    LPAREN: '(',
    RPAREN: ')',
    LBRACE: '{',
    RBRACE: '}',
    LBRACKET: '[',
    RBRACKET: ']',

    FUNCTION: 'FUNCTION',
    LET: 'LET',
    TRUE: 'TRUE',
    FALSE: 'FALSE',
    IF: 'IF',
    ELSE: 'ELSE',
    RETURN: 'RETURN',
    STRING: 'STRING',
} as const;

type Keys = keyof typeof token;
export type TokenType = (typeof token)[Keys];

export default token;

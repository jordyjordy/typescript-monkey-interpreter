import { BlockStatement, Boolean, CallExpression, Expression, ExpressionStatement, FunctionLiteral, Identifier, IfExpression, InfixExpression, IntegerLiteral, LetStatement, PrefixExpression, Program, ReturnStatement } from "./ast";
import Lexer from "./lexer";
import token, { Token, TokenType } from "./token";

export type prefixParseFn = () => Expression | undefined;

export type infixParseFn = (ex: Expression | undefined) => Expression | undefined;

const LOWEST = 0;
const EQUALS = 1;
const LESSGREATER = 2;
const SUM = 3;
const PRODUCT = 4;
const PREFIX = 5;
const CALL = 6;


const precedences: Partial<Record<TokenType, number>> = {
    [token.EQ]: EQUALS,
    [token.NEQ]: EQUALS,
    [token.LT]: LESSGREATER,
    [token.GT]: LESSGREATER,
    [token.PLUS]: SUM,
    [token.MINUS]: SUM,
    [token.SLASH]: PRODUCT,
    [token.ASTERISK]: PRODUCT,
    [token.LPAREN]: CALL,
};

export class Parser {
    lexer: Lexer
    curToken: Token;
    peekToken: Token;
    errors: string[];

    prefixParseFns: Partial<Record<TokenType, prefixParseFn>>;
    infixParseFns: Partial<Record<TokenType, infixParseFn>>;

    constructor(lexer: Lexer) {
        this.lexer = lexer;
        this.curToken = [token.ILLEGAL, ''];
        this.peekToken = [token.ILLEGAL, ''];
        this.errors = [];
        this.prefixParseFns = {};
        this.infixParseFns = {};
        this.parseIdentifier = this.parseIdentifier.bind(this);
        this.parseIntegerLiteral = this.parseIntegerLiteral.bind(this);
        this.parseBoolean = this.parseBoolean.bind(this);
        this.parsePrefixExpression = this.parsePrefixExpression.bind(this);
        this.parseInfixExpression = this.parseInfixExpression.bind(this);
        this.parseGroupedExpression = this.parseGroupedExpression.bind(this);
        this.parseIfExpression = this.parseIfExpression.bind(this);
        this.parseBlockStatement = this.parseBlockStatement.bind(this);
        this.parseFunctionLiteral = this.parseFunctionLiteral.bind(this);
        this.parseFunctionParameters = this.parseFunctionParameters.bind(this);
        this.parseCallExpression = this.parseCallExpression.bind(this);
        this.parseCallArguments = this.parseCallArguments.bind(this);

        this.registerPrefix(token.IDENT, this.parseIdentifier);
        this.registerPrefix(token.INT, this.parseIntegerLiteral);
        this.registerPrefix(token.BANG, this.parsePrefixExpression);
        this.registerPrefix(token.MINUS, this.parsePrefixExpression);
        this.registerPrefix(token.TRUE, this.parseBoolean);
        this.registerPrefix(token.FALSE, this.parseBoolean);
        this.registerPrefix(token.LPAREN, this.parseGroupedExpression);
        this.registerPrefix(token.FUNCTION, this.parseFunctionLiteral);
        this.registerPrefix(token.IF, this.parseIfExpression);
        this.registerInfix(token.PLUS, this.parseInfixExpression);
        this.registerInfix(token.MINUS, this.parseInfixExpression);
        this.registerInfix(token.SLASH, this.parseInfixExpression);
        this.registerInfix(token.ASTERISK, this.parseInfixExpression);
        this.registerInfix(token.EQ, this.parseInfixExpression);
        this.registerInfix(token.NEQ, this.parseInfixExpression);
        this.registerInfix(token.LT, this.parseInfixExpression);
        this.registerInfix(token.GT, this.parseInfixExpression);
        this.registerInfix(token.LPAREN, this.parseCallExpression);
        this.nextToken();
    }

    nextToken() {
        this.curToken = this.peekToken;
        this.peekToken = this.lexer.NextToken();
    }

    ParseProgram(): Program | undefined {
        const program = new Program([]);
        this.nextToken();
        while(!this.curTokenIs(token.EOF)) {
            const statement = this.parseStatement();
            if(statement != undefined) {
                program.statements.push(statement);
            }
            this.nextToken();
        }
        return program;
    }

    parseStatement() {
        switch(this.curToken[0]) {
            case token.LET:
                return this.parseLetStatement();
            case token.RETURN:
                return this.parseReturnStatement();
            default:
                return this.parseExpressionStatement();
        }
    }

    parseLetStatement() {
        const statement = new LetStatement(this.curToken);
        if(!this.expectPeek(token.IDENT)) {
            return undefined;
        }

        statement.name = new Identifier(this.curToken, this.curToken[1]);

        if(!this.expectPeek(token.ASSIGN)) {
            return undefined;
        }

        while(!this.curTokenIs(token.SEMICOLON)) {
            this.nextToken();
        }
        return statement;
    }

    parseReturnStatement() {
        const statement = new ReturnStatement(this.curToken);

        this.nextToken();

        while(!this.curTokenIs(token.SEMICOLON)) {
            this.nextToken();
        }

        return statement;
    }

    parseExpressionStatement() {
        const statement = new ExpressionStatement(this.curToken, this.parseExpression(LOWEST));
        if(this.peekTokenIs(token.SEMICOLON)) {
            this.nextToken();
        }

        return statement;
    }

    parseExpression(precedence: number) {
        const prefix = this.prefixParseFns[this.curToken[0]];
        if(!prefix) {
            this.noPrefixParseFnError(this.curToken[0]);
            return undefined;
        }
        let left = prefix();
        while(!this.peekTokenIs(token.SEMICOLON) && precedence < this.peekPrecendence()) {
            const infix = this.infixParseFns[this.peekToken[0]];
            if(!infix) {
                return left;
            }

            this.nextToken();

            left = infix(left);
        }
        return left;
    }


    parseIdentifier() {
        return new Identifier(this.curToken, this.curToken[1]);
    }

    parseIntegerLiteral() {
        try {
            return new IntegerLiteral(this.curToken, parseInt(this.curToken[1], 10));
        } catch {
            this.errors.push(`Could not parse ${this.curToken[1]} as integer`);
            return undefined;
        }
    }

    parseBoolean() {
        return new Boolean(this.curToken, this.curTokenIs(token.TRUE));
    }

    parseGroupedExpression() {
        this.nextToken();

        const exp = this.parseExpression(LOWEST);
        return this.expectPeek(token.RPAREN)
            ? exp
            : undefined
    }

    parseIfExpression() {
        const expression = new IfExpression(this.curToken);
        if(!this.expectPeek(token.LPAREN)) {
            return undefined;
        }
        this.nextToken();
        expression.condition = this.parseExpression(LOWEST);

        if(!this.expectPeek(token.RPAREN)) {
            return undefined;
        }
        if(!this.expectPeek(token.LBRACE)) {
            return undefined;
        }

        expression.consequence = this.parseBlockStatement();

        if(this.peekTokenIs(token.ELSE)) {
            this.nextToken();
            if(!this.expectPeek(token.LBRACE)) {
                return undefined;
            }
            expression.alternative = this.parseBlockStatement();
        }
        return expression;
    }

    parseBlockStatement() {
        const block = new BlockStatement(this.curToken);
        this.nextToken();
        while(!this.curTokenIs(token.RBRACE) && !this.curTokenIs(token.EOF)) {
            const statement = this.parseStatement();
            if(statement !== undefined) {
                block.statements.push(statement);
            }
            this.nextToken();
        }
        return block;
    }

    parseFunctionLiteral() {
        const funcLit = new FunctionLiteral(this.curToken);
        if(!this.expectPeek(token.LPAREN)) {
            return undefined;
        }
        funcLit.parameters = this.parseFunctionParameters();

        if(!this.expectPeek(token.LBRACE)) {
            return undefined;
        }
        funcLit.body = this.parseBlockStatement();

        return funcLit;
    }

    parseFunctionParameters() {
        const identifiers: Identifier[] = [];
        if(this.peekTokenIs(token.RPAREN)) {
            this.nextToken();
            return identifiers;
        }
        this.nextToken();
        const identifier = new Identifier(this.curToken, this.curToken[1]);
        identifiers.push(identifier);
        while(this.peekTokenIs(token.COMMA)) {
            this.nextToken();
            this.nextToken();
            const identifier = new Identifier(this.curToken, this.curToken[1]);
            identifiers.push(identifier);
        }

        if(!this.expectPeek(token.RPAREN)) {
            return undefined;
        }
        return identifiers;
    }

    parseCallExpression(func: Expression | undefined): Expression {
        const exp = new CallExpression(this.curToken, func);
        exp.functionArguments = this.parseCallArguments();
        return exp;
    }

    parseCallArguments() {
        const args: (Expression | undefined)[] = [];
        if(this.peekTokenIs(token.RPAREN)) {
            this.nextToken();
            return args;
        }

        this.nextToken();
        args.push(this.parseExpression(LOWEST));
        while(this.peekTokenIs(token.COMMA)) {
            this.nextToken();
            this.nextToken();
            args.push(this.parseExpression(LOWEST));
        }
        if(!this.expectPeek(token.RPAREN)) {
            return [];
        }
        return args;
    }

    parsePrefixExpression() {
        const expression = new PrefixExpression(this.curToken, this.curToken[1]);

        this.nextToken();

        expression.right = this.parseExpression(PREFIX);

        return expression;
    }

    parseInfixExpression(left: Expression | undefined) {
        if(!left) {
            return undefined;
        }
        const expression = new InfixExpression(this.curToken,left, this.curToken[1]);

        const precedence =  this.curPrecedence();

        this.nextToken();
        
        expression.right = this.parseExpression(precedence);

        return expression;
    }

    curTokenIs(token: TokenType) {
        return this.curToken[0] === token;
    }
    
    peekTokenIs(token: TokenType) {
        return this.peekToken[0] === token;
    }

    expectPeek(token: TokenType) {
        if(this.peekTokenIs(token)) {
            this.nextToken();
            return true;
        }
        this.peekError(token);
        return false;
    }

    noPrefixParseFnError(t: TokenType) {
        this.errors.push(`no prefix parse function for ${t} found`);
    }

    peekError(token: TokenType) {
        this.errors.push(`expected next token to be ${token}, but got ${this.peekToken[0]} instead`);
    }

    curPrecedence() {
        return precedences[this.curToken[0]] ?? LOWEST;
    }

    peekPrecendence() {
        return precedences[this.peekToken[0]] ?? LOWEST;
    }

    registerPrefix(tokenType: TokenType, fn: prefixParseFn) {
        this.prefixParseFns[tokenType] = fn;
    }
    
    registerInfix(tokenType: TokenType, fn: infixParseFn) {
        this.infixParseFns[tokenType] = fn;
    }
}
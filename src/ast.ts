import { Token } from "./token";

export interface Node {
    TokenLiteral: () => string
    string: () => string
}

export interface Statement extends Node {
    statementNode: () => any
}

export interface Expression extends Node {
    expressionNode: () => any
}


export class Program implements Node {
    statements: Statement[];

    constructor(statements: Statement[]) {
        this.statements = statements;
    }

    TokenLiteral() {
        if(this.statements.length > 0) {
            return this.statements[0].TokenLiteral();
        } else {
            return "";
        }
    }

    string() {
        const string = this.statements.map((statement) => {
            return statement.string();
        })
        return string.join('');
    }
}

export class LetStatement implements Statement {
    token: Token;
    name?: Identifier;
    value?: Expression;

    constructor(token: Token, name?: Identifier, value?: Expression) {
        this.token = token;
        this.name = name;
        this.value = value;
    }

    statementNode() {

    }

    TokenLiteral() {
        return this.token[1];
    }

    string() {
        return `${this.TokenLiteral()} ${this.name?.string() ?? ''} = ${this.value?.string()};`
    }
}

export class ReturnStatement implements Statement {
    token: Token;
    returnValue?: Expression;

    constructor(token: Token, reteturnValue?: Expression) {
        this.token = token;
        this.returnValue = reteturnValue;
    }

    statementNode() {

    }

    TokenLiteral() {
        return this.token[1];
    }

    string() {
        return `${this.TokenLiteral()} ${this.returnValue?.string() ?? ''};`
    }
}

export class ExpressionStatement implements Statement {
    token: Token;
    expression?: Expression;

    constructor(token: Token, expression?: Expression) {
        this.token = token;
        this.expression = expression;
    }

    statementNode() {}

    TokenLiteral() {
        return this.token[1];
    }

    string() {
        return this.expression?.string() ?? "";
    }
}



export class Identifier implements Expression {
    token: Token;
    value: string;

    constructor(token: Token, value: string) {
        this.token = token;
        this.value = value;
    }

    expressionNode() {

    }

    TokenLiteral() {
        return this.token[1];
    }

    string() {
        return this.value;
    }
}

export class IntegerLiteral implements Expression {
    token: Token;
    value?: number;

    constructor(token:Token, value? :number) {
        this.token = token;
        this.value = value;
    }

    expressionNode() {}

    TokenLiteral() { return this.token[1]; }

    string() { return this.token[1]; }
}

export class PrefixExpression implements Expression {
    token: Token;
    operator: string;
    right?: Expression;

    constructor(token: Token, operator: string, right?: Expression) {
        this.token = token;
        this.operator = operator;
        this.right = right;
    }

    expressionNode() {}

    TokenLiteral() { return this.token[1]; }

    string() {
        return `(${this.operator}${this.right?.string()})`;
    }
};

export class InfixExpression implements Expression {
    token: Token;
    operator: string;
    left: Expression;
    right?: Expression;

    constructor(token: Token, left: Expression, operator: string) {
        this.token = token;
        this.left = left;
        this.operator = operator;
    }

    expressionNode() {}
    
    TokenLiteral() {
        return this.token[1];
    }

    string() {
        return `(${this.left?.string()} ${this.operator} ${this.right?.string()})`
    }
}

export class Boolean implements Expression {
    token: Token;
    value: boolean;
    
    constructor(token: Token, value: boolean) {
        this.token = token;
        this.value = value;
    }

    expressionNode() {}
    
    TokenLiteral() { return this.token[1]; }

    string() { return this.token[1].toString(); }
}
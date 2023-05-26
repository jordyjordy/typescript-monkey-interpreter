import { Expression, ExpressionStatement, Identifier, InfixExpression, IntegerLiteral, LetStatement, PrefixExpression, ReturnStatement, Statement } from './ast';
import { Lexer } from './lexer';
import { Parser } from './parser';

function testLetStatement(s: Statement, name: string) {
    expect(s.TokenLiteral()).toEqual('let');
    expect(s instanceof LetStatement).toBe(true);
    const x = s as LetStatement;
    expect(x.name?.value).toEqual(name);
    expect(x.name?.TokenLiteral()).toEqual(name);
}

function checkParserErrors(parser: Parser) {
    if(parser.errors.length === 0) {
        return
    }
    parser.errors.forEach((err) => {
        console.error(err);
    });
    expect(parser.errors.length).toEqual(0);
}

function testIntegerLiteral(exp: Expression, value: number) {
    expect(exp instanceof IntegerLiteral).toBe(true);
    const integ = exp as IntegerLiteral;
    expect(integ.value).toBe(value);
    expect(integ.TokenLiteral()).toBe(`${value}`);
}

function testIdentifier(exp: Expression, value: string) {
    expect(exp instanceof Identifier).toBe(true);
    const ident = exp as Identifier;
    expect(ident.value).toEqual(value);
    expect(ident.TokenLiteral()).toEqual(value);
}

function testLiteralExpression(exp: Expression, expected: any) {
    switch (typeof expected) {
        case 'number':
            testIntegerLiteral(exp, expected)
            return;
        case 'string':
            testIdentifier(exp, expected);
            return;
        default:
            expect('expected type').toBe(`number or string, got ${typeof expected}`);
    }
}

function testInfixExpression(exp: Expression, left: any, operator: string, right: any) {
    expect(exp instanceof InfixExpression).toBe(true);
    const infix = exp as InfixExpression;
    
    testLiteralExpression(infix.left, left);

    expect(infix.operator).toEqual(operator);

    expect(infix.right).not.toEqual(undefined);
    testLiteralExpression(infix.right as Expression, right);
}

describe('Parser tests', () => {
    it('handles three let statements', () => {
        const input = `
let x = 5;
let y = 10;
let foobar = 838383;
`;      
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);

        const program = parser.ParseProgram();
        expect(program).not.toEqual(undefined)
        expect(program?.statements.length).toBe(3);
        checkParserErrors(parser);
        const tests = [
            ["x"],
            ["y"],
            ["foobar"],
        ];

        for(let i = 0; i < tests.length; i++) {
            const statement = program?.statements[i] as Statement;
            testLetStatement(statement, tests[i][0])
        }
    })

    it('parses return statements', () => {
        const input = `
return 5;
return 10;
return 993322;
`;
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.ParseProgram();
        expect(parser.errors.length).toBe(0);
        expect(program).not.toEqual(undefined)
        expect(program?.statements.length).toEqual(3);
        program?.statements.forEach((statement) => {
            expect(statement instanceof ReturnStatement).toBe(true);
            expect(statement.TokenLiteral()).toEqual('return');
        }) 
    })

    it('handles identifierExpressions', () => {
        const input = 'foobar;'
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.ParseProgram();
        checkParserErrors(parser);
        expect(program?.statements.length).toBe(1);
        expect(program?.statements[0] instanceof ExpressionStatement).toBe(true);
        const expressionStatement = program?.statements[0] as ExpressionStatement;
        expect(expressionStatement.expression instanceof Identifier).toBe(true);
        const ident = expressionStatement.expression as Identifier;
        expect(ident.value).toEqual('foobar');
        expect(ident.TokenLiteral()).toEqual('foobar')
    })

    it('handles integer literal expressions', () => {
        const input = '5;';
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.ParseProgram();
        checkParserErrors(parser);
        expect(program?.statements.length).toBe(1);
        expect(program?.statements[0] instanceof ExpressionStatement).toBe(true);
        const expressionStatement = program?.statements[0] as ExpressionStatement;
        expect(expressionStatement.expression instanceof IntegerLiteral).toBe(true);
        const literal = expressionStatement.expression as IntegerLiteral;
        expect(literal.value).toBe(5);
        expect(literal.TokenLiteral()).toEqual('5');
    })

    it('handles prefix expressions', () => {
        const prefixTests: [string, string, number][] = [
            ["!5", "!", 5],
            ["-15", "-", 15]
        ];

        prefixTests.forEach(([input, prefix, literal]) => {
            const lexer = new Lexer(input);
            const parser = new Parser(lexer);
            const program = parser.ParseProgram();
            checkParserErrors(parser);
            expect(program?.statements.length).toBe(1);
            expect(program?.statements[0] instanceof ExpressionStatement).toBe(true);
            const expressionStatement = program?.statements[0] as ExpressionStatement;
            expect(expressionStatement.expression instanceof PrefixExpression).toBe(true);
            const exp = expressionStatement.expression as PrefixExpression;
            expect(exp.operator).toEqual(prefix);
            expect(exp.right).not.toEqual(undefined);
            testIntegerLiteral(exp.right as Expression, literal);
        })
    })

    it('handles infix expressions', () => {
        const infixTests: [string, number, string, number][] = [
            ["5 + 5;", 5, "+", 5],
            ["5 - 5;", 5, "-", 5],
            ["5 * 5;", 5, "*", 5],
            ["5 / 5;", 5, "/", 5],
            ["5 > 5;", 5, ">", 5],
            ["5 < 5;", 5, "<", 5],
            ["5 == 5;", 5, "==", 5],
            ["5 != 5;", 5, "!=", 5],
        ]

        infixTests.forEach(([input, left, operator, right]) => {
            const lexer = new Lexer(input);
            const parser = new Parser(lexer);
            const program = parser.ParseProgram();
            checkParserErrors(parser);
            expect(program?.statements.length).toBe(1);
            expect(program?.statements[0] instanceof ExpressionStatement).toBe(true);
            const expressionStatement = program?.statements[0] as ExpressionStatement;
            expect(expressionStatement.expression instanceof InfixExpression).toBe(true);
            const exp = expressionStatement.expression as unknown as InfixExpression;
            expect(exp.right).not.toEqual(undefined);
            expect(exp.left).not.toEqual(undefined);
            testIntegerLiteral(exp.left as Expression, left);
            expect(exp.operator).toEqual(operator);
            testIntegerLiteral(exp.right as Expression, right);
        })
    })

    it('handles complex expressions with math', () => {
        const tests:[string, any, string, any][] = [
            ["5 + 5;", 5, "+", 5],
            ["5 - 5;", 5, "-", 5],
            ["5 * 5;", 5, "*", 5],
            ["5 / 5;", 5, "/", 5],
            ["5 > 5;", 5, ">", 5],
            ["5 < 5;", 5, "<", 5],
            ["5 == 5;", 5, "==", 5],
            ["5 != 5;", 5, "!=", 5],
            ["foobar + barfoo;", "foobar", "+", "barfoo"],
            ["foobar - barfoo;", "foobar", "-", "barfoo"],
            ["foobar * barfoo;", "foobar", "*", "barfoo"],
            ["foobar / barfoo;", "foobar", "/", "barfoo"],
            ["foobar > barfoo;", "foobar", ">", "barfoo"],
            ["foobar < barfoo;", "foobar", "<", "barfoo"],
            ["foobar == barfoo;", "foobar", "==", "barfoo"],
            ["foobar != barfoo;", "foobar", "!=", "barfoo"],
        ];

        tests.forEach(([input, left, operator, right]) => {
            const lexer = new Lexer(input);
            const parser = new Parser(lexer);
            const program = parser.ParseProgram();
            checkParserErrors(parser);
            const result = program?.string();
            expect(program?.statements.length).toBe(1);
            expect(program?.statements[0] instanceof ExpressionStatement).toBe(true);
            const exp = program?.statements[0] as ExpressionStatement;
            expect(exp.expression).not.toEqual(undefined);
            testInfixExpression(exp.expression as Expression, left, operator, right);
        })
    });
})
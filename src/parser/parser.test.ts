import * as ast from '../ast';
import { Lexer } from '../lexer';
import { Parser } from '.';

function testLetStatement(s: ast.Statement, name: string) {
    expect(s.TokenLiteral()).toEqual('let');
    expect(s instanceof ast.LetStatement).toBe(true);
    const x = s as ast.LetStatement;
    expect(x.name?.value).toEqual(name);
    expect(x.name?.TokenLiteral()).toEqual(name);
}

function checkParserErrors(parser: Parser) {
    if(parser.errors.length === 0) {
        return
    }
    console.error(parser.errors.join('\n'))

    expect(parser.errors.length).toEqual(0);
}

function testIntegerLiteral(exp: ast.Expression, value: number) {
    expect(exp instanceof ast.IntegerLiteral).toBe(true);
    const integ = exp as ast.IntegerLiteral;
    expect(integ.value).toBe(value);
    expect(integ.TokenLiteral()).toBe(`${value}`);
}

function testIdentifier(exp: ast.Expression, value: string) {
    expect(exp instanceof ast.Identifier).toBe(true);
    const ident = exp as ast.Identifier;
    expect(ident.value).toEqual(value);
    expect(ident.TokenLiteral()).toEqual(value);
}

function testBooleanLiteral(exp: ast.Expression, value: boolean) {
    expect(exp instanceof ast.Boolean).toBe(true);
    const bool = exp as ast.Boolean;
    expect(bool.value).toEqual(value);
    expect(bool.TokenLiteral()).toEqual(`${value}`);
}

function testLiteralExpression(exp: ast.Expression, expected: any) {
    switch (typeof expected) {
        case 'number':
            testIntegerLiteral(exp, expected)
            return;
        case 'string':
            testIdentifier(exp, expected);
            return;
        case 'boolean':
            testBooleanLiteral(exp, expected);
            return;
        default:
            expect('expected type').toBe(`number or string, got ${typeof expected}`);
    }
}

function testInfixExpression(exp: ast.Expression, left: any, operator: string, right: any) {
    expect(exp instanceof ast.InfixExpression).toBe(true);
    const infix = exp as ast.InfixExpression;
    
    testLiteralExpression(infix.left, left);

    expect(infix.operator).toEqual(operator);

    expect(infix.right).not.toEqual(undefined);
    testLiteralExpression(infix.right as ast.Expression, right);
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
            const statement = program?.statements[i] as ast.Statement;
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
            expect(statement instanceof ast.ReturnStatement).toBe(true);
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
        expect(program?.statements[0] instanceof ast.ExpressionStatement).toBe(true);
        const expressionStatement = program?.statements[0] as ast.ExpressionStatement;
        expect(expressionStatement.expression instanceof ast.Identifier).toBe(true);
        const ident = expressionStatement.expression as ast.Identifier;
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
        expect(program?.statements[0] instanceof ast.ExpressionStatement).toBe(true);
        const expressionStatement = program?.statements[0] as ast.ExpressionStatement;
        expect(expressionStatement.expression instanceof ast.IntegerLiteral).toBe(true);
        const literal = expressionStatement.expression as ast.IntegerLiteral;
        expect(literal.value).toBe(5);
        expect(literal.TokenLiteral()).toEqual('5');
    })

    it('handles prefix expressions', () => {
        const prefixTests: [string, string, number|string|boolean][] = [
            ["!5", "!", 5],
            ["-15", "-", 15],
            ["!foobar;", "!", "foobar"],
            ["-foobar;", "-", "foobar"],
            ["!true;", "!", true],
            ["!false;", "!", false],
        ];

        prefixTests.forEach(([input, prefix, literal]) => {
            const lexer = new Lexer(input);
            const parser = new Parser(lexer);
            const program = parser.ParseProgram();
            checkParserErrors(parser);
            expect(program?.statements.length).toBe(1);
            expect(program?.statements[0] instanceof ast.ExpressionStatement).toBe(true);
            const expressionStatement = program?.statements[0] as ast.ExpressionStatement;
            expect(expressionStatement.expression instanceof ast.PrefixExpression).toBe(true);
            const exp = expressionStatement.expression as ast.PrefixExpression;
            expect(exp.operator).toEqual(prefix);
            expect(exp.right).not.toEqual(undefined);
            switch(typeof literal) {
                case 'number':
                    testIntegerLiteral(exp.right as ast.Expression, literal);
                    break;
                case 'boolean':
                    testBooleanLiteral(exp.right as ast.Expression, literal);
                    break;
                case 'string':
                    testIdentifier(exp.right as ast.Expression, literal);
                    break;
            }
        })
    })

    it('handles infix expression', () => {
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
            ["true == true", true, "==", true],
            ["true != false", true, "!=", false],
            ["false == false", false, "==", false],

        ];

        tests.forEach(([input, left, operator, right]) => {
            const lexer = new Lexer(input);
            const parser = new Parser(lexer);
            const program = parser.ParseProgram();
            checkParserErrors(parser);
            expect(program?.statements.length).toBe(1);
            expect(program?.statements[0] instanceof ast.ExpressionStatement).toBe(true);
            const exp = program?.statements[0] as ast.ExpressionStatement;
            expect(exp.expression).not.toEqual(undefined);
            testInfixExpression(exp.expression as ast.Expression, left, operator, right);
        })
    });

    it('handles operatorPrecedence', () => {
        const tests = [
            [
                "-a * b",
                "((-a) * b)",
            ],
            [
                "!-a",
                "(!(-a))",
            ],
            [
                "a + b + c",
                "((a + b) + c)",
            ],
            [
                "a + b - c",
                "((a + b) - c)",
            ],
            [
                "a * b * c",
                "((a * b) * c)",
            ],
            [
                "a * b / c",
                "((a * b) / c)",
            ],
            [
                "a + b / c",
                "(a + (b / c))",
            ],
            [
                "a + b * c + d / e - f",
                "(((a + (b * c)) + (d / e)) - f)",
            ],
            [
                "3 + 4; -5 * 5",
                "(3 + 4)((-5) * 5)",
            ],
            [
                "5 > 4 == 3 < 4",
                "((5 > 4) == (3 < 4))",
            ],
            [
                "5 < 4 != 3 > 4",
                "((5 < 4) != (3 > 4))",
            ],
            [
                "3 + 4 * 5 == 3 * 1 + 4 * 5",
                "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))",
            ],
            [
                "true",
                "true",
            ],
            [
                "false",
                "false",
            ],
            [
                "3 > 5 == false",
                "((3 > 5) == false)",
            ],
            [
                "3 < 5 == true",
                "((3 < 5) == true)",
            ],
            [
                "1 + (2 + 3) + 4",
                "((1 + (2 + 3)) + 4)",
            ],
            [
                "(5 + 5) * 2",
                "((5 + 5) * 2)",
            ],
            [
                "2 / (5 + 5)",
                "(2 / (5 + 5))",
            ],
            [
                "(5 + 5) * 2 * (5 + 5)",
                "(((5 + 5) * 2) * (5 + 5))",
            ],
            [
                "-(5 + 5)",
                "(-(5 + 5))",
            ],
            [
                "!(true == true)",
                "(!(true == true))",
            ],
            [
                "a + add(b * c) + d",
                "((a + add((b * c))) + d)",
            ],
            [
                "add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8))",
                "add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)))",
            ],
            [
                "add(a + b + c * d / f + g)",
                "add((((a + b) + ((c * d) / f)) + g))",
            ],
            [
                "a * [1, 2, 3, 4][b * c] * d",
                "((a * ([1, 2, 3, 4][(b * c)])) * d)",
            ],
            [
                "add(a * b[2], b[1], 2 * [1, 2][1])",
                "add((a * (b[2])), (b[1]), (2 * ([1, 2][1])))",
            ],
        ];

        tests.forEach(([input, expected]) => {
            const lexer = new Lexer(input);
            const parser = new Parser(lexer);
            const program = parser.ParseProgram();
            checkParserErrors(parser);
            const result = program?.string();
            expect(program?.statements[0] instanceof ast.ExpressionStatement).toBe(true);
            const exp = program?.statements[0] as ast.ExpressionStatement;
            expect(result).toEqual(expected);
        })
    })

    it('handles if expressions', () => {
        const input =  `if (x < y) { x }`;
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.ParseProgram();
        checkParserErrors(parser);
        expect(program?.statements.length).toBe(1);
        expect(program?.statements[0] instanceof ast.ExpressionStatement).toBe(true);
        const expr = program?.statements[0] as ast.ExpressionStatement;
        expect(expr.expression instanceof ast.IfExpression).toBe(true);
        const ifexpr = expr.expression as ast.IfExpression;
        testInfixExpression(ifexpr.condition as ast.Expression, 'x' , '<', 'y');
        expect(ifexpr.consequence).not.toBe(undefined);
        expect(ifexpr.consequence?.statements.length).toBe(1);
        expect(ifexpr.consequence?.statements[0] instanceof ast.ExpressionStatement);
        const consequence = ifexpr.consequence?.statements[0] as ast.ExpressionStatement;
        testIdentifier(consequence.expression as ast.Expression, 'x');
        expect(ifexpr.alternative).toEqual(undefined);
    })

    it('handles if else expressions', () => {
        const input =  `if (x < y) { x } else { y }`;
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.ParseProgram();
        checkParserErrors(parser);
        expect(program?.statements.length).toBe(1);
        expect(program?.statements[0] instanceof ast.ExpressionStatement).toBe(true);
        const expr = program?.statements[0] as ast.ExpressionStatement;
        expect(expr.expression instanceof ast.IfExpression).toBe(true);
        const ifexpr = expr.expression as ast.IfExpression;
        testInfixExpression(ifexpr.condition as ast.Expression, 'x' , '<', 'y');
        expect(ifexpr.consequence).not.toBe(undefined);
        expect(ifexpr.consequence?.statements.length).toBe(1);
        expect(ifexpr.consequence?.statements[0] instanceof ast.ExpressionStatement);
        const consequence = ifexpr.consequence?.statements[0] as ast.ExpressionStatement;
        testIdentifier(consequence.expression as ast.Expression, 'x');
        expect(ifexpr.alternative).not.toBe(undefined);
        expect(ifexpr.alternative?.statements.length).toBe(1);
        expect(ifexpr.alternative?.statements[0] instanceof ast.ExpressionStatement);
        const alternative = ifexpr.alternative?.statements[0] as ast.ExpressionStatement;
        testIdentifier(alternative.expression as ast.Expression, 'y');
    })

    it('handles function literals', () => {
        const input =  `fn(x, y) { x + y; }`;
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.ParseProgram();
        checkParserErrors(parser);
        expect(program?.statements.length).toBe(1);
        expect(program?.statements[0] instanceof ast.ExpressionStatement).toBe(true);
        const expr = program?.statements[0] as ast.ExpressionStatement;
        expect(expr.expression instanceof ast.FunctionLiteral).toBe(true);
        const func = expr.expression as ast.FunctionLiteral;
        expect(func.parameters?.length).toBe(2);

        testLiteralExpression(func.parameters?.[0] as ast.Expression, 'x');
        testLiteralExpression(func.parameters?.[1] as ast.Expression, 'y');

        expect(func.body?.statements.length).toBe(1);
        expect(func.body?.statements[0] instanceof ast.ExpressionStatement);
        const bodyStatement = func.body?.statements[0] as ast.ExpressionStatement;

        testInfixExpression(bodyStatement.expression as ast.Expression, 'x', '+', 'y');
    })

    test('function literal with name', () => {
        const input =  `let myfunction = fn() { };`;
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.ParseProgram();
        checkParserErrors(parser);
        expect(program?.statements.length).toBe(1);
        
        expect(program?.statements[0] instanceof ast.LetStatement).toBe(true);

        const statement = program?.statements[0] as ast.LetStatement;
        const func = statement.value;
        expect(func instanceof ast.FunctionLiteral).toBeTruthy();

        expect((func as ast.FunctionLiteral).name).toEqual('myfunction');
    })

    it('handles function parameters correctly', () => {
        const tests: [string, string[]][] = [
            ['fn() {};', []],
            ['fn(x) {};', ['x']],
            ['fn(x, y, z) {};', ['x', 'y', 'z']],
        ];

        tests.forEach(([input, expected]) => {
            const lexer = new Lexer(input);
            const parser = new Parser(lexer);
            const program = parser.ParseProgram();

            const statement = program?.statements[0] as ast.ExpressionStatement;
            const func = statement.expression as ast.FunctionLiteral;
            expect(func.parameters?.length).toEqual(expected.length);

            expected.forEach((val, index) => {
                testLiteralExpression(func.parameters?.[index] as ast.Expression, val);
            })
        })
    })

    it('handles function calls', () => {
        const input = "add(1, 2 * 3, 4 + 5);"
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.ParseProgram();
        checkParserErrors(parser);
        expect(program?.statements.length).toBe(1);
        expect(program?.statements[0] instanceof ast.ExpressionStatement).toBe(true);
        const expr = program?.statements[0] as ast.ExpressionStatement;
        expect(expr.expression instanceof ast.CallExpression).toBe(true);
        const call = expr.expression as ast.CallExpression;

        testIdentifier(call.func as ast.Expression, 'add');

        expect(call.functionArguments.length).toBe(3);

        testLiteralExpression(call.functionArguments[0] as ast.Expression, 1);
        testInfixExpression(call.functionArguments[1] as ast.Expression, 2, "*", 3);
        testInfixExpression(call.functionArguments[2] as ast.Expression, 4, "+", 5);
    })

    it('parses let statements', () => {
        const tests: [string, string, any][] = [
            ["let x = 5;", "x", 5],
            ["let y = true;", "y", true],
            ["let foobar = y;", "foobar", "y"],
        ];

        tests.forEach(([input, identifier, expected]) => {
            const lexer = new Lexer(input);
            const parser = new Parser(lexer);
            const program = parser.ParseProgram();
            checkParserErrors(parser);

            expect(program?.statements.length).toBe(1);
            expect(program?.statements[0] instanceof ast.LetStatement).toBe(true);
            const statement = program?.statements[0] as ast.LetStatement;
            testLetStatement(statement, identifier);
            testLiteralExpression(statement.value as ast.Expression, expected);
        })
    })

    it('parses string literals', () => {
        const input = '"hello world";'
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.ParseProgram();
        checkParserErrors(parser);

        expect(program?.statements.length).toBe(1);
        expect(program?.statements[0] instanceof ast.ExpressionStatement).toBe(true);
        const expr = program?.statements[0] as ast.ExpressionStatement;
        expect(expr.expression instanceof ast.StringLiteral).toBe(true);
        const stringlit = expr.expression as ast.StringLiteral;
        expect(stringlit.value).toEqual('hello world');
    })


    it('parses array literals', () => {
        const input = '[1, 2 * 2, 3 + 3];';
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.ParseProgram();
        checkParserErrors(parser);

        expect(program?.statements.length).toBe(1);
        expect(program?.statements[0] instanceof ast.ExpressionStatement).toBe(true);
        const expr = program?.statements[0] as ast.ExpressionStatement;
        expect(expr.expression instanceof ast.ArrayLiteral).toBe(true);
        const arraylit = expr.expression as ast.ArrayLiteral;
        expect(arraylit.elements.length).toBe(3);

        testIntegerLiteral(arraylit.elements[0] as ast.Expression, 1);
        testInfixExpression(arraylit.elements[1] as ast.Expression, 2, '*', 2);
        testInfixExpression(arraylit.elements[2] as ast.Expression, 3, '+', 3);
    })

    it('parses index expressions', () => {
        const input = 'myArray[1 + 1]';
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.ParseProgram();
        checkParserErrors(parser);

        expect(program?.statements.length).toBe(1);
        expect(program?.statements[0] instanceof ast.ExpressionStatement).toBe(true);
        const expr = program?.statements[0] as ast.ExpressionStatement;
        expect(expr.expression instanceof ast.IndexExpression).toBe(true);
        const indexExpr = expr.expression as ast.IndexExpression;

        testIdentifier(indexExpr.left, 'myArray');
        testInfixExpression(indexExpr.index as ast.Expression, 1, '+', 1);
    })

    it('parses hash literals string keys', () => {
        const input = '{ "one": 1, "two": 2, "three": 3 }';
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.ParseProgram();
        checkParserErrors(parser);

        expect(program?.statements.length).toBe(1);
        expect(program?.statements[0] instanceof ast.ExpressionStatement).toBe(true);
        const expr = program?.statements[0] as ast.ExpressionStatement;
        expect(expr.expression instanceof ast.HashLiteral).toBe(true);
        const hash = expr.expression as ast.HashLiteral;

        const expected: Record<string, number> = {
            "one": 1,
            "two": 2,
            "three": 3,
        }

        for(let [key, value] of hash.pairs) {
            expect(key instanceof ast.StringLiteral).toBe(true);
            testIntegerLiteral(value, expected[key.string()]);
        }
    })

    it('parses an empty hash literal', () => {
        const input = '{}';
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.ParseProgram();
        checkParserErrors(parser);

        expect(program?.statements.length).toBe(1);
        expect(program?.statements[0] instanceof ast.ExpressionStatement).toBe(true);
        const expr = program?.statements[0] as ast.ExpressionStatement;
        expect(expr.expression instanceof ast.HashLiteral).toBe(true);
        const hash = expr.expression as ast.HashLiteral;
        expect(hash.pairs.size).toBe(0);
    })

    it('parses hash literals with expressions', () => {
        const input = `{"one": 0 + 1, "two": 10 - 8, "three": 15 / 5}`;
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.ParseProgram();
        checkParserErrors(parser);

        expect(program?.statements.length).toBe(1);
        expect(program?.statements[0] instanceof ast.ExpressionStatement).toBe(true);
        const expr = program?.statements[0] as ast.ExpressionStatement;
        expect(expr.expression instanceof ast.HashLiteral).toBe(true);
        const hash = expr.expression as ast.HashLiteral;

        const expected: Record<string, any> = {
            "one": (e: ast.Expression) => testInfixExpression(e, 0, "+", 1),
            "two": (e: ast.Expression) => testInfixExpression(e, 10, "-", 8),
            "three": (e: ast.Expression) => testInfixExpression(e, 15, "/", 5),
        }

        for(let [key, value] of hash.pairs) {
            expect(key instanceof ast.StringLiteral).toBe(true);
            expected[key.string()](value);
        }
    })
})
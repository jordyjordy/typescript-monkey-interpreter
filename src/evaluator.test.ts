import Lexer from './lexer';
import { Bool, Function, Integer, InterpretError, Obj } from './object';
import { Eval, NULL } from './evaluator';
import { Parser } from './parser';
import { Node } from './ast';
import Environment from './environment';

describe('evaluator tests', () => {
    test('eval integer expression', () => {
        const tests: [string, number][] = [
            ["5", 5],
            ["10", 10],
            ["-5", -5],
            ["-10", -10],
            ["5 + 5 + 5 + 5 - 10", 10],
            ["2 * 2 * 2 * 2 * 2", 32],
            ["-50 + 100 + -50", 0],
            ["5 * 2 + 10", 20],
            ["5 + 2 * 10", 25],
            ["20 + 2 * -10", 0],
            ["50 / 2 * 2 + 10", 60],
            ["2 * (5 + 10)", 30],
            ["3 * 3 * 3 + 10", 37],
            ["3 * (3 * 3) + 10", 37],
            ["(5 + 10 * 2 + 15 / 3) * 2 + -10", 50],
            ["7 / 2", 3],

        ];

        tests.forEach(([input, expected]) => {
            const evaluated = testEval(input);
            testIntegerObject(evaluated, expected);
        });
    })

    test('eval boolean expression', () => {
        const tests: [string, boolean][] = [
            ["true", true],
            ["false", false],
            ["1 < 2", true],
            ["1 > 2", false],
            ["1 < 1", false],
            ["1 > 1", false],
            ["1 == 1", true],
            ["1 != 1", false],
            ["1 == 2", false],
            ["1 != 2", true],
            ["true == true", true],
            ["false == false", true],
            ["true == false", false],
            ["true != false", true],
            ["false != true", true],
        ]

        tests.forEach(([input, expected]) => {
            const evaluated = testEval(input);
            testBooleanObject(evaluated, expected);
        });
    })

    test('eval bang operator', () => {
        const tests: [string,boolean][] = [
            ["!true", false],
            ["!false", true],
            ["!5", false],
            ["!!true", true],
            ["!!false", false],
            ["!!5", true],
        ];
        tests.forEach(([input, expected]) => {
            const evaluated = testEval(input);
            testBooleanObject(evaluated, expected);
        });
    })

    test('if else expressions', () => {
        const tests: [string, number | undefined][] = [
            ["if (true) { 10 }", 10],
            ["if (false) { 10 }", undefined],
            ["if (1) { 10 }", 10],
            ["if (1 < 2) { 10 }", 10],
            ["if (1 > 2) { 10 }", undefined],
            ["if (1 > 2) { 10 } else { 20 }", 20],
            ["if (1 < 2) { 10 } else { 20 }", 10],
        ]
        tests.forEach(([input, expected]) => {
            const evaluated = testEval(input);
            if(expected) {
                testIntegerObject(evaluated, expected);
            } else {
                testNullObject(evaluated);
            }
        });
    })

    test('return statements', () => {
        const tests:[string, number][] = [
            ["return 10;", 10],
            ["return 10; 9;", 10],
            ["return 2 * 5; 9;", 10],
            ["9; return 2 * 5; 9;", 10],
            [
                 `if (10 > 1) {
    if (10 > 1) {
        return 10;
    }
    return 1;
}
                `,
                10,
            ],    
        ];
        tests.forEach(([input, expected]) => {
            const evaluated = testEval(input);
            testIntegerObject(evaluated, expected);
        });
    })

    test('error handling', () => {
        const tests: [string, string][] = [
            [
            "5 + true;",
            "type mismatch: INTEGER + BOOLEAN",
            ],
            [
            "5 + true; 5;",
            "type mismatch: INTEGER + BOOLEAN",
            ],
            [
            "-true",
            "unknown operator: -BOOLEAN",
            ],
            [
            "true + false;",
            "unknown operator: BOOLEAN + BOOLEAN",
            ],
            [
            "5; true + false; 5",
            "unknown operator: BOOLEAN + BOOLEAN",
            ],
            [
            "if (10 > 1) { true + false; }",
            "unknown operator: BOOLEAN + BOOLEAN",
            ],
            [
            `
            if (10 > 1) {
            if (10 > 1) {
            return true + false;
            }
            return 1;
            }
            `,
            "unknown operator: BOOLEAN + BOOLEAN",
            ],
            [
                'foobar',
                "identifier not found: foobar",
            ],
        ];
        tests.forEach(([input, expected]) => {
            const evaluated = testEval(input);
            expect(evaluated instanceof InterpretError).toBe(true);
            const errObj = evaluated as InterpretError;
            expect(errObj.message).toEqual(expected);
        });
    })

    test('let statements', () => {
        const tests: [string, number][] = [
            ["let a = 5; a;", 5],
            ["let a = 5 * 5; a;", 25],
            ["let a = 5; let b = a; b;", 5],
            ["let a = 5; let b = a; let c = a + b + 5; c;", 15],
        ];

        tests.forEach(([input, expected]) => {
            const evaluated = testEval(input);
            testIntegerObject(evaluated, expected);
        });
    })

    test('function object', () => {
        const input = "fn(x) { x + 2; };"
        const evaluated = testEval(input);

        expect(evaluated instanceof Function).toBe(true);
        const func = evaluated as Function;
        expect(func.parameters.length).toEqual(1);
        expect(func.parameters[0].string()).toEqual('x');

        expect(func.body.string()).toEqual('(x + 2)');
    })

    test('function application', () => {
        const tests: [string, number][] = [
            ["let identity = fn(x) { x; }; identity(5);", 5],
            ["let identity = fn(x) { return x; }; identity(5);", 5],
            ["let double = fn(x) { x * 2; }; double(5);", 10],
            ["let add = fn(x, y) { x + y; }; add(5, 5);", 10],
            ["let add = fn(x, y) { x + y; }; add(5 + 5, add(5, 5));", 20],
            ["fn(x) { x; }(5)", 5],
        ]

        tests.forEach(([input, expected]) => {
            const evaluated = testEval(input);
            testIntegerObject(evaluated, expected);
        });
    })
})

function testEval(input: string): Obj | undefined {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.ParseProgram();
    const env: Environment = new Environment();
    return Eval(program as Node, env);
}

function testIntegerObject(object: Obj | undefined, expected: number) {
    expect(object instanceof Integer).toBe(true);
    const result = object as Integer;
    expect(result.value).toEqual(expected);
}

function testBooleanObject(object: Obj | undefined, expected: boolean) {
    expect(object instanceof Bool).toBe(true);
    const result = object as Bool;
    expect(result.value).toEqual(expected);
}

function testNullObject(object: Obj | undefined) {
    expect(object).toBe(NULL);
};
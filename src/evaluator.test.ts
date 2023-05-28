import Lexer from './lexer';
import { ArrayLiteral, Bool, Function, Hash, Integer, InterpretError, Obj, String } from './object';
import { Eval, FALSE, NULL, TRUE } from './evaluator';
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
        const tests: [string, boolean][] = [
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
            if (expected) {
                testIntegerObject(evaluated, expected);
            } else {
                testNullObject(evaluated);
            }
        });
    })

    test('return statements', () => {
        const tests: [string, number][] = [
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
            [
                '"Hello" - "World',
                "unknown operator: STRING - STRING",
            ],
            [
                `{"name": "Monkey"}[fn(x) { x }];`,
                "unusable as hash key: FUNCTION",
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

    test('string object', () => {
        const input = '"hello world"';
        const evaluated = testEval(input);
        expect(evaluated?.constructor).toBe(String);
        expect((evaluated as String).value).toEqual('hello world');
    })

    test('string concatenation', () => {
        const input = '"Hello" + " " + "World!"';
        const evaluated = testEval(input);
        expect(evaluated?.constructor).toBe(String);
        expect((evaluated as String).value).toEqual('Hello World!');
    })

    test('builtin functions', () => {
        const tests: [string, string | number][] = [
            [`len("")`, 0],
            [`len("four")`, 4],
            [`len("hello world")`, 11],
            [`len(1)`, "argument to `len` not supported, got INTEGER"],
            [`len("one", "two")`, "wrong number of arguments. got=2, want=1"],
        ];
        tests.forEach(([input, expected]) => {
            const evaluated = testEval(input);
            switch (typeof expected) {
                case 'number':
                    testIntegerObject(evaluated, expected);
                    break;
                case 'string':
                    expect(evaluated?.constructor).toEqual(InterpretError);
                    const err = evaluated as InterpretError;
                    expect(err.message).toEqual(expected);
                    break;
            }
        });
    })

    test('array literals', () => {
        const input = '[1, 2 * 2, 3 + 3]';
        const evaluated = testEval(input);
        expect(evaluated?.constructor).toEqual(ArrayLiteral);
        const arr = evaluated as ArrayLiteral;
        expect(arr.elements.length).toBe(3);

        testIntegerObject(arr.elements[0], 1);
        testIntegerObject(arr.elements[1], 4);
        testIntegerObject(arr.elements[2], 6);
    })

    test('array index epxressions', () => {
        const tests: [string, number | undefined][] = [
            [
                "[1, 2, 3][0]",
                1,
            ],
            [
                "[1, 2, 3][1]",
                2,
            ],
            [
                "[1, 2, 3][2]",
                3,
            ],
            [
                "let i = 0; [1][i];",
                1,
            ],
            [
                "[1, 2, 3][1 + 1];",
                3,
            ],
            [
                "let myArray = [1, 2, 3]; myArray[2];",
                3,
            ],
            [
                "let myArray = [1, 2, 3]; myArray[0] + myArray[1] + myArray[2];",
                6,
            ],
            [
                "let myArray = [1, 2, 3]; let i = myArray[0]; myArray[i]",
                2,
            ],
            [
                "[1, 2, 3][3]",
                undefined,
            ],
            [
                "[1, 2, 3][-1]",
                undefined,
            ],
        ]
        tests.forEach(([input, expected]) => {
            const evaluated = testEval(input);
            if (expected) {
                testIntegerObject(evaluated, expected);
            } else {
                testNullObject(evaluated);
            }
        });
    })

    test('hash literals', () => {
        const input = `let two = "two";
        {
        "one": 10 - 9,
        two: 1 + 1,
        "thr" + "ee": 6 / 2,
        4: 4,
        true: 5,
        false: 6
        }`;
        const evaluated = testEval(input);
        expect(evaluated?.constructor).toEqual(Hash);

        const expected = new Map([
            [new String('one').hashKey(), 1],
            [new String('two').hashKey(), 2],
            [new String('three').hashKey(), 3],
            [new Integer(4).hashKey(), 4],
            [TRUE.hashKey(), 5],
            [FALSE.hashKey(), 6],
        ])

        const hash = evaluated as Hash;
        expect(hash.pairs.size).toEqual(expected.size);

        for (const [key, value] of expected) {
            expect((hash.pairs.get(key.value)?.value as any).value).toEqual(value);
        }
    })

    test('hash index expressions', () => {
        const tests: [string, number | undefined][] = [
            [
                `{"foo": 5}["foo"]`,
                5,
            ],
            [
                `{"foo": 5}["bar"]`,
                undefined,
            ],
            [
                `let key = "foo"; {"foo": 5}[key]`,
                5,
            ],
            [
                `{}["foo"]`,
                undefined,
            ],
            [
                `{5: 5}[5]`,
                5,
            ],
            [
                `{true: 5}[true]`,
                5,
            ],
            [
                `{false: 5}[false]`,
                5,
            ],
        ];
        tests.forEach(([input, expected]) => {
            const evaluated = testEval(input);
            if (expected) {
                testIntegerObject(evaluated, expected);
            } else {
                testNullObject(evaluated);
            }
        })
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
import Lexer from './lexer';
import { Bool, Integer, Obj } from './object';
import { Eval, NULL } from './evaluator';
import { Parser } from './parser';
import { Node } from './ast';

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

})

function testEval(input: string): Obj | undefined {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.ParseProgram();
    return Eval(program as Node);
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
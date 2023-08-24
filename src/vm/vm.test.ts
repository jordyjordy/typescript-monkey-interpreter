import * as Ast from "../ast";
import { Lexer } from '../lexer';
import { Parser } from '../parser';
import * as Obj from '../object';
import { Compiler } from "../compiler";
import { Vm } from './';
import { NULL } from "../evaluator";

function parse(input: string): Ast.Program | undefined {
    const l = new Lexer(input);
    const p = new Parser(l);
    return p.ParseProgram();
}

type vmTestCase = {
    input: string,
    expected: any
}

const testIntegerObject = (expected: number, actual?: Obj.Obj) => {
    expect(actual instanceof Obj.Integer).toBe(true);
    const actualInteger = actual as Obj.Integer;
    expect(actualInteger.value).toEqual(expected);
}

const testStringObject = (expected: string, actual?: Obj.Obj) => {
    expect(actual instanceof Obj.String).toBe(true);
    const actualString = actual as Obj.String;
    expect(actualString.value).toEqual(expected);
}

const testBooleanObject = (expected: boolean, actual?: Obj.Obj) => {
    expect(actual instanceof Obj.Bool).toBe(true);
    const actualBoolean = actual as Obj.Bool;
    expect(actualBoolean.value).toEqual(expected);
}

const testArrayObject = (expected: Array<any>, actual?: Obj.Obj) => {
    expect(actual instanceof Obj.ArrayLiteral).toBe(true);
    const arrayObj = actual as Obj.ArrayLiteral;
    expect(arrayObj.elements.length).toEqual(expected.length);
    arrayObj.elements.forEach((el, i) => {
        testExpectedObject(el, arrayObj.elements[i]);
    })
}

const testHashObject = (expected: Map<Obj.HashKey, any>, actual?: Obj.Obj) => {
    expect(actual instanceof Obj.Hash).toBe(true);
    const hashObj = actual as Obj.Hash;
    expect(hashObj.pairs.size).toEqual(expected.size);
    expected.forEach((expectedValue, expectedKey) => {
        expect(expectedKey instanceof Obj.HashKey);
        const hashableKey = expectedKey as Obj.HashKey;
        const pair = hashObj.pairs.get(hashableKey.value);
        testIntegerObject(expectedValue, pair?.value);
    })
}

function runVmTests(tests: vmTestCase[]) {
    tests.forEach((test) => {
        const program = parse(test.input);
        expect(program).toBeDefined();
        const compiler = new Compiler();
        const error = compiler.compile(program!);
        expect(error).toBeUndefined();

        const vm = new Vm(compiler.byteCode());

        const vmError = vm.run();

        expect(vmError).toBeUndefined();

        const stackElement = vm.lastPoppedStackElem();

        testExpectedObject(test.expected, stackElement);
    })
}

function testExpectedObject(expected: any, actual?: Obj.Obj) {
    switch (typeof expected) {
        case 'number':
            testIntegerObject(expected, actual);
            break;
        case 'boolean':
            testBooleanObject(expected, actual);
            break;
        case 'object':
            if (expected === null) {
                expect(actual).toEqual(NULL);
            }
            if(Array.isArray(expected)) {
                testArrayObject(expected, actual);
            }
            if(expected instanceof Map) {
                testHashObject(expected, actual);
            }
            break;
        case 'string':
            testStringObject(expected, actual);
            break;
        
    }
}

describe('vm tests', () => {
    test('integer arithmetic', () => {
        const tests: vmTestCase[] = [
            { input: "1", expected: 1 },
            { input: "2", expected: 2 },
            { input: "1 + 2", expected: 3 },
            { input: "1 - 2", expected: -1 },
            { input: "1 * 2", expected: 2 },
            { input: "4 / 2", expected: 2 },
            { input: "50 / 2 * 2 + 10 - 5", expected: 55 },
            { input: "5 + 5 + 5 + 5 - 10", expected: 10 },
            { input: "2 * 2 * 2 * 2 * 2", expected: 32 },
            { input: "5 * 2 + 10", expected: 20 },
            { input: "5 + 2 * 10", expected: 25 },
            { input: "5 * (2 + 10)", expected: 60 },
            { input: "-5", expected: - 5 },
            { input: "-10", expected: - 10 },
            { input: "-50 + 100 + -50, ", expected: 0 },
            { input: "(5 + 10 * 2 + 15 / 3) * 2 + -10", expected: 50 },
        ]

        runVmTests(tests);
    })

    test('boolean expressions', () => {
        const tests: vmTestCase[] = [
            { input: "true", expected: true },
            { input: "false", expected: false },
            { input: "1 < 2", expected: true },
            { input: "1 > 2", expected: false },
            { input: "1 < 1", expected: false },
            { input: "1 > 1", expected: false },
            { input: "1 == 1", expected: true },
            { input: "1 != 1", expected: false },
            { input: "1 == 2", expected: false },
            { input: "1 != 2", expected: true },
            { input: "true == true", expected: true },
            { input: "false == false", expected: true },
            { input: "true == false", expected: false },
            { input: "true != false", expected: true },
            { input: "false != true", expected: true },
            { input: "(1 < 2) == true", expected: true },
            { input: "(1 < 2) == false", expected: false },
            { input: "(1 > 2) == true", expected: false },
            { input: "(1 > 2) == false", expected: true },
            { input: "!false", expected: true },
            { input: "!true", expected: false },
            { input: "!5", expected: false },
            { input: "!!true", expected: true },
            { input: "!!false", expected: false },
            { input: "!!5", expected: true },
            { input: "!(if (false) { 5; })", expected: true },

        ];
        runVmTests(tests);
    });

    test('conditionals', () => {
        const tests: vmTestCase[] = [
            { input: "if (true) { 10 }", expected: 10 },
            { input: "if (true) { 10 } else { 20 }", expected: 10 },
            { input: "if (false) { 10 } else { 20 } ", expected: 20 },
            { input: "if (1) { 10 }", expected: 10 },
            { input: "if (1 < 2) { 10 }", expected: 10 },
            { input: "if (1 < 2) { 10 } else { 20 }", expected: 10 },
            { input: "if (1 > 2) { 10 } else { 20 }", expected: 20 },
            { input: "if (1 > 2) { 10 }", expected: null },
            { input: "if (false) { 10 }", expected: null },
            { input: "if ((if (false) { 10 })) { 10 } else { 20 }", expected: 20 },
        ];

        runVmTests(tests);
    })

    test('global let statements', () => {
        const tests: vmTestCase[] = [
            { input: "let one = 1; one", expected: 1 },
            { input: "let one = 1; let two = 2; one + two", expected: 3 },
            { input: "let one = 1; let two = one + one; one + two", expected: 3 },
        ];

        runVmTests(tests);
    })

    test('string expressions', () => {
        const tests: vmTestCase[] = [
            { input: `"monkey"`, expected: "monkey" },
            { input: `"mon" + "key"`, expected: "monkey" },
            { input: `"mon" + "key" + "banana"`, expected: "monkeybanana" },
        ];

        runVmTests(tests);
    })

    test('array literals', () => {
        const tests: vmTestCase[] = [
            { input:  "[]", expected: []},
            { input:  "[1, 2, 3]", expected: [1, 2, 3]},
            { input:  "[1 + 2, 3 * 4, 5 + 6]", expected:[3, 12, 11]},
        ];

        runVmTests(tests);
    })

    test('hash literals', () => {
        const tests: vmTestCase[] = [
            {
                input: "{}", expected: new Map([]),
            },
            {
                input: "{1: 2, 2: 3}",
                expected: new Map([
                    [
                        new Obj.Integer(1).hashKey(),
                        2
                    ],
                    [
                        new Obj.Integer(2).hashKey(),
                        3
                    ]
                ]),
            },
            {
                input: "{1 + 1: 2 * 2, 3 + 3: 4 * 4}",
                expected: new Map([
                    [
                        new Obj.Integer(2).hashKey(),
                        4
                    ],
                    [
                        new Obj.Integer(6).hashKey(),
                        16
                    ]
                ]),
            },      
        ];
        runVmTests(tests);
    })
})
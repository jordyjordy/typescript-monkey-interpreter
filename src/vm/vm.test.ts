import * as Ast from "../ast";
import { Lexer } from '../lexer';
import { Parser } from '../parser';
import * as Obj from '../object';
import { Compiler } from "../compiler";
import { Vm } from './';

const { NULL } = Obj;

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
        try {
            testExpectedObject(test.expected, stackElement)
        } catch (err) {
            throw err;
        }
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
            if (Array.isArray(expected)) {
                testArrayObject(expected, actual);
            }
            if (expected instanceof Map) {
                testHashObject(expected, actual);
            }
            if(expected instanceof Obj.InterpretError) {
                expect(expected.message).toEqual((actual as Obj.InterpretError).message);
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
            { input: "[]", expected: [] },
            { input: "[1, 2, 3]", expected: [1, 2, 3] },
            { input: "[1 + 2, 3 * 4, 5 + 6]", expected: [3, 12, 11] },
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

    test('index expressions', () => {
        const tests: vmTestCase[] = [
            { input: "[1, 2, 3][1]", expected: 2 },
            { input: "[1, 2, 3][0 + 2]", expected: 3 },
            { input: "[[1, 1, 1]][0][0]", expected: 1 },
            { input: "[][0]", expected: null },
            { input: "[1, 2, 3][99]", expected: null },
            { input: "[1][-1]", expected: null },
            { input: "{1: 1, 2: 2}[1]", expected: 1 },
            { input: "{1: 1, 2: 2}[2]", expected: 2 },
            { input: "{1: 1}[0]", expected: null },
            { input: "{}[0]", expected: null },
        ];

        runVmTests(tests);
    })

    test('function calls without arguments', () => {
        const tests: vmTestCase[] = [
            {
                input: `
                let fivePlusTen = fn() { 5 + 10; };
                fivePlusTen();
                `,
                expected: 15,
            },
            {
                input: `
                let one = fn() { 1; };
                let two = fn() { 2; };
                one() + two()
                `,
                expected: 3,
            },
            {
                input: `
                let a = fn() { 1 };
                let b = fn() { a() + 1 };
                let c = fn() { b() + 1 };
                c();
                `,
                expected: 3,
            },
            {
                input: `
                let earlyExit = fn() { return 99; 100; };
                earlyExit();
                `,
                expected: 99,
            },
            {
                input: `
                let earlyExit = fn() { return 99; return 100; };
                earlyExit();
                `,
                expected: 99,
            },
            {
                input: `
                let noReturn = fn() { };
                noReturn();
                `,
                expected: NULL,
            },
            {
                input: `
                let noReturn = fn() { };
                let noReturnTwo = fn() { noReturn(); };
                noReturn();
                noReturnTwo();
                `,
                expected: NULL,
            },
            {
                input: `
                let returnsOneReturner = fn() {
                let returnsOne = fn() { 1; };
                returnsOne;
                };
                returnsOneReturner()();
                `,
                expected: 1,
            },


        ];

        runVmTests(tests);
    })

    test('calling functions with bindings', () => {
        const tests = [
            {
                input: `
                let one = fn() { let one = 1; one };
                one();
                `,
                expected: 1,
            },
            {
                input: `
                let oneAndTwo = fn() { let one = 1; let two = 2; one + two; };
                oneAndTwo();
                `,
                expected: 3,
            },
            {
                input: `
                let oneAndTwo = fn() { let one = 1; let two = 2; one + two; };
                let threeAndFour = fn() { let three = 3; let four = 4; three + four; };
                oneAndTwo() + threeAndFour();
                `,
                expected: 10,
            },
            {
                input: `
                let firstFoobar = fn() { let foobar = 50; foobar; };
                let secondFoobar = fn() { let foobar = 100; foobar; };
                firstFoobar() + secondFoobar();
                `,
                expected: 150,
            },
            {
                input: `
                let globalSeed = 50;
                let minusOne = fn() {
                let num = 1;
                globalSeed - num;
                }
                let minusTwo = fn() {
                let num = 2;
                globalSeed - num;
                }
                minusOne() + minusTwo();
                `,
                expected: 97,
            }
        ];

        runVmTests(tests);
    })

    test('calling functions with arguments and bindings', () => {
        const tests = [
            {
                input: `
                let identity = fn(a) { a; };
                identity(4);
                `,
                expected: 4,
            },
            {
                input: `
                let sum = fn(a, b) { a + b; };
                sum(1, 2);
                `,
                expected: 3,
            },
            {
                input: `
                let sum = fn(a, b) {
                let c = a + b;
                c;
                };
                sum(1, 2);
                `,
                expected: 3,
            },
            {
                input: `
                let sum = fn(a, b) {
                let c = a + b;
                c;
                };
                sum(1, 2) + sum(3, 4);`,
                expected: 10,
            },
            {
                input: `
                let sum = fn(a, b) {
                let c = a + b;
                c;
                };
                let outer = fn() {
                sum(1, 2) + sum(3, 4);
                };
                outer();
                `,
                expected: 10,
            },
            {
                input: `
                let globalNum = 10;
                let sum = fn(a, b) {
                let c = a + b;
                c + globalNum;
                };
                let outer = fn() {
                sum(1, 2) + sum(3, 4) + globalNum;
                };
                outer() + globalNum;
                `,
                expected: 50,
            },
        ];
        runVmTests(tests);
    })

    test('calling functions with wrong arguments', () => {
        const tests: vmTestCase[] = [
            {
                input: `fn() { 1; }(1);`,
                expected: `wrong number of arguments: want=0, got=1`,
            },
            {
                input: `fn(a) { a; }();`,
                expected: `wrong number of arguments: want=1, got=0`,
            },
            {
                input: `fn(a, b) { a + b; }(1);`,
                expected: `wrong number of arguments: want=2, got=1`,
            },

        ];
        tests.forEach((test) => {
            const program = parse(test.input);
            const compiler = new Compiler();
            let err = compiler.compile(program!);
            expect(err).toBeUndefined();

            const vm = new Vm(compiler.byteCode());

            err = vm.run();
            expect(err).toBeDefined();
            expect((err as Error).message).toEqual(test.expected);

        })
    })

    test('builtIn functions', () => {
        const tests: vmTestCase[] = [
            { input: `len("")`, expected: 0 },
            { input: `len("four")`, expected: 4 },
            { input: `len("hello world")`, expected: 11 },
            {
                input:
                    `len(1)`,
                expected: new Obj.InterpretError("argument to `len` not supported, got INTEGER"),
            },
            {
                input: `len("one", "two")`,
                expected: new Obj.InterpretError("wrong number of arguments. got=2, want=1"),
            },
            { input: `len([1, 2, 3])`, expected: 3 },
            { input: `len([])`, expected: 0 },
            { input: `puts("hello", "world!")`, expected: NULL },
            { input: `first([1, 2, 3])`, expected: 1 },
            { input: `first([])`, expected: NULL },
            {
                input: `first(1)`,
                expected: new Obj.InterpretError("argument to `first` must be ARRAY, got INTEGER"),
            },
            { input: `last([1, 2, 3])`, expected: 3 },
            { input: `last([])`, expected: NULL },
            {
                input: `last(1)`,
                expected: new Obj.InterpretError("argument to `last` must be ARRAY, got INTEGER"),
            },
            { input: `rest([1, 2, 3])`, expected: [2, 3] },
            { input: `rest([])`, expected: NULL },
            { input: `push([], 1)`, expected: [1] },
            {
                input: `push(1, 1)`,
                expected: new Obj.InterpretError("argument to `push` must be ARRAY, got INTEGER"),
            }
        ];
        runVmTests(tests);
    })
})
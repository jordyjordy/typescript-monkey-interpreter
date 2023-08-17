import * as Ast from "../ast";
import { Lexer } from '../lexer';
import { Parser } from '../parser';
import * as Obj from '../object';
import { Compiler } from "../compiler";
import { Vm } from './';

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

const testBooleanObject = (expected: boolean, actual?: Obj.Obj) => {
    expect(actual instanceof Obj.Bool).toBe(true);
    const actualBoolean = actual as Obj.Bool;
    expect(actualBoolean.value).toEqual(expected);
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
            { input:  "-5", expected: - 5},
            { input:  "-10", expected: - 10},
            { input:  "-50 + 100 + -50, ", expected: 0},
            { input:  "(5 + 10 * 2 + 15 / 3) * 2 + -10", expected: 50},
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
            { input: "!true", expected: false},
            { input: "!false", expected: true},
            { input: "!5", expected: false},
            { input: "!!true", expected: true},
            { input: "!!false", expected: false},
            { input: "!!5", expected: true},
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
            { input : "if (1 > 2) { 10 } else { 20 }", expected: 20 },
        ];

        runVmTests(tests);
    })
})
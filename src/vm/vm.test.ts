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

function testExpectedObject(expected:any, actual?: Obj.Obj) {
    switch(typeof expected) {
        case 'number':
            testIntegerObject(expected as number, actual);
    }
}

describe('vm tests', () => {
    test('integer arithmetic', () => {
        const tests: vmTestCase[] = [
            { input:"1", expected: 1 },
            { input: "2", expected: 2},
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
        ]
        
        runVmTests(tests);
    })
})
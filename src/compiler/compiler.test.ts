import * as ast from "../ast";
import * as code from "../code"
import * as obj from "../object";
import Lexer from "../lexer";
import { Parser } from "../parser";
import { Compiler } from './';

describe('compiler tests', () => {
    test('integer arithemetic', () => {
        const tests = [{
            input: "1 + 2",
            expectedConstants: [1, 2],
            expectedInstructions: [
                code.Make(code.OpConstant, 0),
                code.Make(code.OpConstant, 1),
                code.Make(code.OpAdd),
                code.Make(code.OpPop),
            ],
        },
        {
            input: "1; 2",
            expectedConstants: [1, 2],
            expectedInstructions: [
                code.Make(code.OpConstant, 0),
                code.Make(code.OpPop),
                code.Make(code.OpConstant, 1),
                code.Make(code.OpPop),
            ],
        },
        {
            input: "1 - 2",
            expectedConstants: [1, 2],
            expectedInstructions: [
                code.Make(code.OpConstant, 0),
                code.Make(code.OpConstant, 1),
                code.Make(code.OpSub),
                code.Make(code.OpPop),
            ],
        },
        {
            input: "1 * 2",
            expectedConstants: [1, 2],
            expectedInstructions: [
                code.Make(code.OpConstant, 0),
                code.Make(code.OpConstant, 1),
                code.Make(code.OpMul),
                code.Make(code.OpPop),
            ],
        },
        {
            input: "2 / 1",
            expectedConstants: [2, 1],
            expectedInstructions: [
                code.Make(code.OpConstant, 0),
                code.Make(code.OpConstant, 1),
                code.Make(code.OpDiv),
                code.Make(code.OpPop),
            ],
        }];

        runCompilerTests(tests);
    })

    test('boolean expressions', () => {
        const tests = [{
            input: "true",
            expectedConstants: [],
            expectedInstructions: [
                code.Make(code.OpTrue),
                code.Make(code.OpPop),
            ],
        },
        {
            input: "false",
            expectedConstants: [],
            expectedInstructions: [
                code.Make(code.OpFalse),
                code.Make(code.OpPop),
            ],
        },
        {
            input: "1 > 2",
            expectedConstants: [1, 2],
            expectedInstructions: [
                code.Make(code.OpConstant, 0),
                code.Make(code.OpConstant, 1),
                code.Make(code.OpGreaterThan),
                code.Make(code.OpPop),
            ],
        },
        {
            input: "1 < 2",
            expectedConstants: [2, 1],
            expectedInstructions: [
                code.Make(code.OpConstant, 0),
                code.Make(code.OpConstant, 1),
                code.Make(code.OpGreaterThan),
                code.Make(code.OpPop),
            ],
        },
        {
            input: "1 == 2",
            expectedConstants: [1, 2],
            expectedInstructions: [
                code.Make(code.OpConstant, 0),
                code.Make(code.OpConstant, 1),
                code.Make(code.OpEqual),
                code.Make(code.OpPop),
            ],
        },
        {
            input: "1 != 2",
            expectedConstants: [1, 2],
            expectedInstructions: [
                code.Make(code.OpConstant, 0),
                code.Make(code.OpConstant, 1),
                code.Make(code.OpNotEqual),
                code.Make(code.OpPop),
            ],
        },
        {
            input: "1 != 2",
            expectedConstants: [1, 2],
            expectedInstructions: [
                code.Make(code.OpConstant, 0),
                code.Make(code.OpConstant, 1),
                code.Make(code.OpNotEqual),
                code.Make(code.OpPop),
            ],
        },
        {
            input: "true == false",
            expectedConstants: [],
            expectedInstructions: [
                code.Make(code.OpTrue),
                code.Make(code.OpFalse),
                code.Make(code.OpEqual),
                code.Make(code.OpPop),
            ],
        },
        {
            input: "true != false",
            expectedConstants: [],
            expectedInstructions: [
                code.Make(code.OpTrue),
                code.Make(code.OpFalse),
                code.Make(code.OpNotEqual),
                code.Make(code.OpPop),
            ],
        }]

        runCompilerTests(tests);
    })
})


const runCompilerTests = (tests: {input: string, expectedConstants: number[], expectedInstructions: number[][] }[]) => {
    tests.forEach((test) => {
        const compiler = new Compiler();
        const program = parse(test.input);
        expect(program).not.toBe(undefined);
        const res = compiler.compile(program as ast.Program);
        // expect(res).not.toBe(null);

        const byteCode = compiler.byteCode();

        testInstructions(test.expectedInstructions, byteCode.instructions);

        testConstants(test.expectedConstants, byteCode.constants);
    })
}

const testInstructions = (expectedInstructions: code.Instructions[], instructions: code.Instructions) => {
    const concatted = concatInstructions(expectedInstructions);
    expect(instructions.length).toEqual(concatted.length);
    for(let i = 0; i < concatted.length; i++) {
        expect(concatted[i]).toEqual(instructions[i]);
    }
}

const testConstants = (expected: any[], actual: obj.Obj[]) => {
    expect(expected.length).toEqual(actual.length);
    for (let i = 0; i < expected.length; i++) {
        const constant = expected[i];
        switch (typeof constant) {
            case 'number':
                testIntegerObject(constant, actual[i])
        }
    }
}

const testIntegerObject = (expected: number, actual: obj.Obj) => {
    expect(actual instanceof obj.Integer).toBe(true);
    const actualInteger = actual as obj.Integer;
    expect(actualInteger.value).toEqual(expected);
}

const concatInstructions = (instructions: code.Instructions[]) => {
    const out: code.Instructions = [];
    for(let i = 0; i < instructions.length; i++) {
        out.push(...instructions[i]); 
    }
    return out;
}

const parse = (input: string): ast.Program | undefined => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.ParseProgram();
    return program;
}
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
        },
        {
            input: "- 1",
            expectedConstants: [1],
            expectedInstructions: [
                code.Make(code.OpConstant, 0),
                code.Make(code.OpMinus),
                code.Make(code.OpPop),
            ]
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
        },
        {
            input: "!true",
            expectedConstants: [],
            expectedInstructions: [
                code.Make(code.OpTrue),
                code.Make(code.OpBang),
                code.Make(code.OpPop),
            ]
        }]

        runCompilerTests(tests);
    })

    test('conditionals', () => {
        const tests = [
            {
                input: 'if (true) { 10 }; 3333;',
                expectedConstants: [
                    10,
                    3333
                ],
                expectedInstructions: [
                    // 0000
                    code.Make(code.OpTrue),
                    // 0001
                    code.Make(code.OpJumpNotTruthy, 10),
                    // 0004
                    code.Make(code.OpConstant, 0),
                    // 0007
                    code.Make(code.OpJump, 11),
                    // 0010
                    code.Make(code.OpNull),
                    // 0011
                    code.Make(code.OpPop),
                    // 0012
                    code.Make(code.OpConstant, 1),
                    // 0015
                    code.Make(code.OpPop),
                ]
            },
            {
                input: `
                if (true) { 10 } else { 20 }; 3333;
                `,
                expectedConstants: [10, 20, 3333],
                expectedInstructions: [
                    // 0000
                    code.Make(code.OpTrue),
                    // 0001
                    code.Make(code.OpJumpNotTruthy, 10),
                    // 0004
                    code.Make(code.OpConstant, 0),
                    // 0007
                    code.Make(code.OpJump, 13),
                    // 0010
                    code.Make(code.OpConstant, 1),
                    // 0013
                    code.Make(code.OpPop),
                    // 0014
                    code.Make(code.OpConstant, 2),
                    // 0017
                    code.Make(code.OpPop),
                ],
            },
            {
                input: 'if (10 > 5) { 10; } else { 12; }',
                expectedConstants: [10, 5, 10, 12],
                expectedInstructions: [
                    // 0000
                    code.Make(code.OpConstant, 0),
                    // 0003
                    code.Make(code.OpConstant, 1),
                    // 0006
                    code.Make(code.OpGreaterThan),
                    // 0007
                    code.Make(code.OpJumpNotTruthy, 16),
                    // 0010
                    code.Make(code.OpConstant, 2),
                    // 0013
                    code.Make(code.OpJump, 19),
                    // 0016
                    code.Make(code.OpConstant, 3),
                    // 0019
                    code.Make(code.OpPop),
                ]
            }
        ];
        runCompilerTests(tests);
    })

    test('global let statements', () => {
        const tests = [
            {
                input: `
                let one = 1;
                let two = 2;
                `,
                expectedConstants: [1, 2],
                expectedInstructions: [
                    code.Make(code.OpConstant, 0),
                    code.Make(code.OpSetGlobal, 0),
                    code.Make(code.OpConstant, 1),
                    code.Make(code.OpSetGlobal, 1),
                ],
            },
            {
                input: `
                let one = 1;
                one;
                `,
                expectedConstants: [1],
                expectedInstructions: [
                    //0000
                    code.Make(code.OpConstant, 0),
                    //0003
                    code.Make(code.OpSetGlobal, 0),
                    //0006
                    code.Make(code.OpGetGlobal, 0),
                    //0009
                    code.Make(code.OpPop),
                ],
            },
            {
                input: `
                let one = 1;
                let two = one;
                two;
                `,
                expectedConstants: [1],
                expectedInstructions: [
                    code.Make(code.OpConstant, 0),
                    code.Make(code.OpSetGlobal, 0),
                    code.Make(code.OpGetGlobal, 0),
                    code.Make(code.OpSetGlobal, 1),
                    code.Make(code.OpGetGlobal, 1),
                    code.Make(code.OpPop),
                ],
            }
        ];
        runCompilerTests(tests);
    })

    test('string expressions', () => {
        const tests = [
            {
                input: `"monkey"`,
                expectedConstants: ['monkey'],
                expectedInstructions: [
                    code.Make(code.OpConstant, 0),
                    code.Make(code.OpPop),
                ],
            },
            {
                input: `"mon" + "key"`,
                expectedConstants: ["mon", "key"],
                expectedInstructions: [
                    code.Make(code.OpConstant, 0),
                    code.Make(code.OpConstant, 1),
                    code.Make(code.OpAdd),
                    code.Make(code.OpPop),
                ]
            },
        ];

        runCompilerTests(tests);
    })

    test('array literals', () => {
        const tests = [
            {
                input: "[]",
                expectedConstants: [],
                expectedInstructions: [
                    code.Make(code.OpArray, 0),
                    code.Make(code.OpPop),
                ],
            },
            {
                input: "[1, 2, 3]",
                expectedConstants: [1, 2, 3],
                expectedInstructions: [
                    code.Make(code.OpConstant, 0),
                    code.Make(code.OpConstant, 1),
                    code.Make(code.OpConstant, 2),
                    code.Make(code.OpArray, 3),
                    code.Make(code.OpPop),
                ],
            },
            {
                input: "[1 + 2, 3 - 4, 5 * 6]",
                expectedConstants: [1, 2, 3, 4, 5, 6],
                expectedInstructions: [
                    code.Make(code.OpConstant, 0),
                    code.Make(code.OpConstant, 1),
                    code.Make(code.OpAdd),
                    code.Make(code.OpConstant, 2),
                    code.Make(code.OpConstant, 3),
                    code.Make(code.OpSub),
                    code.Make(code.OpConstant, 4),
                    code.Make(code.OpConstant, 5),
                    code.Make(code.OpMul),
                    code.Make(code.OpArray, 3),
                    code.Make(code.OpPop),
                ],
            },
        ];

        runCompilerTests(tests);
    })

    test('has literals', () => {
        const tests = [
            {
                input: "{}",
                expectedConstants: [],
                expectedInstructions: [
                    code.Make(code.OpHash, 0),
                    code.Make(code.OpPop),
                ],
            },
            {
                input: "{1: 2, 3: 4, 5: 6}",
                expectedConstants: [1, 2, 3, 4, 5, 6],
                expectedInstructions: [
                    code.Make(code.OpConstant, 0),
                    code.Make(code.OpConstant, 1),
                    code.Make(code.OpConstant, 2),
                    code.Make(code.OpConstant, 3),
                    code.Make(code.OpConstant, 4),
                    code.Make(code.OpConstant, 5),
                    code.Make(code.OpHash, 6),
                    code.Make(code.OpPop),
                ],
            },
            {
                input: "{1: 2 + 3, 4: 5 * 6}",
                expectedConstants: [1, 2, 3, 4, 5, 6],
                expectedInstructions: [
                    code.Make(code.OpConstant, 0),
                    code.Make(code.OpConstant, 1),
                    code.Make(code.OpConstant, 2),
                    code.Make(code.OpAdd),
                    code.Make(code.OpConstant, 3),
                    code.Make(code.OpConstant, 4),
                    code.Make(code.OpConstant, 5),
                    code.Make(code.OpMul),
                    code.Make(code.OpHash, 4),
                    code.Make(code.OpPop),
                ],
            }
        ];
        runCompilerTests(tests);
    })

    test('index expressions', () => {
        const tests = [
            {
                input: "[1, 2, 3][1 + 1]",
                expectedConstants: [1, 2, 3, 1, 1],
                expectedInstructions: [
                    code.Make(code.OpConstant, 0),
                    code.Make(code.OpConstant, 1),
                    code.Make(code.OpConstant, 2),
                    code.Make(code.OpArray, 3),
                    code.Make(code.OpConstant, 3),
                    code.Make(code.OpConstant, 4),
                    code.Make(code.OpAdd),
                    code.Make(code.OpIndex),
                    code.Make(code.OpPop),
                ],
            },
            {
                input: "{1: 2}[2 - 1]",
                expectedConstants: [1, 2, 2, 1],
                expectedInstructions: [
                    code.Make(code.OpConstant, 0),
                    code.Make(code.OpConstant, 1),
                    code.Make(code.OpHash, 2),
                    code.Make(code.OpConstant, 2),
                    code.Make(code.OpConstant, 3),
                    code.Make(code.OpSub),
                    code.Make(code.OpIndex),
                    code.Make(code.OpPop),
                ],
            },
            {
                input: "[1, 2, 3][0 + 2]",
                expectedConstants: [1, 2, 3, 0, 2],
                expectedInstructions: [
                    code.Make(code.OpConstant, 0),
                    code.Make(code.OpConstant, 1),
                    code.Make(code.OpConstant, 2),
                    code.Make(code.OpArray, 3),
                    code.Make(code.OpConstant, 3),
                    code.Make(code.OpConstant, 4),
                    code.Make(code.OpAdd),
                    code.Make(code.OpIndex),
                    code.Make(code.OpPop),
                ]
            }
        ];

        runCompilerTests(tests);
    })

    test('functions', () => {
        const tests = [
            {
                input: `fn() { return 5 + 10 }`,
                expectedConstants: [
                    5,
                    10,
                    [
                        code.Make(code.OpConstant, 0),
                        code.Make(code.OpConstant, 1),
                        code.Make(code.OpAdd),
                        code.Make(code.OpReturnValue),
                    ],
                ],
                expectedInstructions: [
                    code.Make(code.OpConstant, 2),
                    code.Make(code.OpPop),
                ],
            },
            {
                input: `fn() { 5 + 10 }`,
                expectedConstants: [
                    5,
                    10,
                    [
                        code.Make(code.OpConstant, 0),
                        code.Make(code.OpConstant, 1),
                        code.Make(code.OpAdd),
                        code.Make(code.OpReturnValue),
                    ],
                ],
                expectedInstructions: [
                    code.Make(code.OpConstant, 2),
                    code.Make(code.OpPop),
                ],
            },
            {
                input: `fn() { 1; 2 }`,
                expectedConstants: [
                    1,
                    2,
                    [
                        code.Make(code.OpConstant, 0),
                        code.Make(code.OpPop),
                        code.Make(code.OpConstant, 1),
                        code.Make(code.OpReturnValue),
                    ],
                ],
                expectedInstructions: [
                    code.Make(code.OpConstant, 2),
                    code.Make(code.OpPop),
                ],
            },
        ];
        runCompilerTests(tests);
    });

    test('compiler scopes', () => {
        const compiler = new Compiler();
        expect(compiler.scopeIndex).toBe(0);
        compiler.emit(code.OpMul);
        compiler.enterScope();
        expect(compiler.scopeIndex).toBe(1);
        compiler.emit(code.OpSub);
        expect(compiler.scopes[compiler.scopeIndex].instructions.length).toBe(1);

        let last = compiler.scopes[compiler.scopeIndex].lastInstruction;
        expect(last?.OpCode).toEqual(code.OpSub);
        compiler.leaveScope();
        expect(compiler.scopeIndex).toBe(0);

        compiler.emit(code.OpAdd);
        expect(compiler.scopes[compiler.scopeIndex].instructions.length).toBe(2);

        last = compiler.scopes[compiler.scopeIndex].lastInstruction;
        expect(last?.OpCode).toEqual(code.OpAdd);
        const previous = compiler.scopes[compiler.scopeIndex].previousInstruction;
        expect(previous?.OpCode).toEqual(code.OpMul);

    })

    test('functions without return value', () => {
        const tests = [
            {
                input: `fn() { }`,
                expectedConstants: [
                    [
                        code.Make(code.OpReturn),
                    ],
                ],
                expectedInstructions: [
                    code.Make(code.OpConstant, 0),
                    code.Make(code.OpPop),
                ],
            },
        ]

        runCompilerTests(tests);
    })

    test('function calls', () => {
        const tests = [
            {
                input: `fn() { 24 }();`,
                expectedConstants: [
                    24,
                    [
                        code.Make(code.OpConstant, 0), // The literal "24"
                        code.Make(code.OpReturnValue),
                    ],
                ],
                expectedInstructions: [
                    code.Make(code.OpConstant, 1), // The compiled function
                    code.Make(code.OpCall),
                    code.Make(code.OpPop),
                ],
            },
            {
                input: `
                let fivePlusTen = fn() { 5 + 10; };
                fivePlusTen();
                `,
                expectedConstants: [
                    5,
                    10,
                    [
                        code.Make(code.OpConstant, 0),
                        code.Make(code.OpConstant, 1),
                        code.Make(code.OpAdd),
                        code.Make(code.OpReturnValue),
                    ]
                ],
                expectedInstructions: [
                    code.Make(code.OpConstant, 2),
                    code.Make(code.OpSetGlobal, 0),
                    code.Make(code.OpGetGlobal, 0),
                    code.Make(code.OpCall),
                    code.Make(code.OpPop),
                ]
            },
            {
                input: `
                let noArg = fn() { 24 };
                noArg();
                `,
                expectedConstants: [
                    24,
                    [
                        code.Make(code.OpConstant, 0), // The literal "24"
                        code.Make(code.OpReturnValue),
                    ],
                ],
                expectedInstructions: [
                    code.Make(code.OpConstant, 1), // The compiled function
                    code.Make(code.OpSetGlobal, 0),
                    code.Make(code.OpGetGlobal, 0),
                    code.Make(code.OpCall),
                    code.Make(code.OpPop),
                ],
            }
        ];
        runCompilerTests(tests);
    })
})


const runCompilerTests = (tests: { input: string, expectedConstants: any[], expectedInstructions: number[][] }[]) => {
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
    // console.log(instructions.toString());
    // console.log(new code.Instructions(...concatted).toString())
    expect(instructions.length).toEqual(concatted.length);
    for (let i = 0; i < concatted.length; i++) {
        expect(concatted[i]).toEqual(instructions[i]);
    }
}

const testConstants = (expected: any[], actual: obj.Obj[]) => {
    expect(expected.length).toEqual(actual.length);
    for (let i = 0; i < expected.length; i++) {
        const constant = expected[i];
        switch (typeof constant) {
            case 'number':
                testIntegerObject(constant, actual[i]);
                break;
            case 'string':
                testStringObject(constant, actual[i]);
                break;
            case 'object':
                if (constant instanceof Array) {
                    expect(actual[i] instanceof obj.CompiledFunction).toBe(true);
                    const error = testInstructions(constant, (actual[i] as obj.CompiledFunction).instructions)
                }
        }
    }
}

const testIntegerObject = (expected: number, actual: obj.Obj) => {
    expect(actual instanceof obj.Integer).toBe(true);
    const actualInteger = actual as obj.Integer;
    expect(actualInteger.value).toEqual(expected);
}

const testStringObject = (expected: string, actual: obj.Obj) => {
    expect(actual instanceof obj.String).toBe(true);
    const actualString = actual as obj.String;
    expect(actualString.value).toEqual(expected);
}

const concatInstructions = (instructions: code.Instructions[]) => {
    const out: code.Instructions = [];
    for (let i = 0; i < instructions.length; i++) {
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
import * as Ast from "../ast";
import * as Code from "../code"
import * as Obj from "../object";
import Lexer from "../lexer";
import { Parser } from "../parser";
import { Compiler } from './';
import { EnclosedSymbolTable } from "./symbolTable";

describe('compiler tests', () => {
    test('integer arithemetic', () => {
        const tests = [{
            input: "1 + 2",
            expectedConstants: [1, 2],
            expectedInstructions: [
                Code.Make(Code.OpConstant, 0),
                Code.Make(Code.OpConstant, 1),
                Code.Make(Code.OpAdd),
                Code.Make(Code.OpPop),
            ],
        },
        {
            input: "1; 2",
            expectedConstants: [1, 2],
            expectedInstructions: [
                Code.Make(Code.OpConstant, 0),
                Code.Make(Code.OpPop),
                Code.Make(Code.OpConstant, 1),
                Code.Make(Code.OpPop),
            ],
        },
        {
            input: "1 - 2",
            expectedConstants: [1, 2],
            expectedInstructions: [
                Code.Make(Code.OpConstant, 0),
                Code.Make(Code.OpConstant, 1),
                Code.Make(Code.OpSub),
                Code.Make(Code.OpPop),
            ],
        },
        {
            input: "1 * 2",
            expectedConstants: [1, 2],
            expectedInstructions: [
                Code.Make(Code.OpConstant, 0),
                Code.Make(Code.OpConstant, 1),
                Code.Make(Code.OpMul),
                Code.Make(Code.OpPop),
            ],
        },
        {
            input: "2 / 1",
            expectedConstants: [2, 1],
            expectedInstructions: [
                Code.Make(Code.OpConstant, 0),
                Code.Make(Code.OpConstant, 1),
                Code.Make(Code.OpDiv),
                Code.Make(Code.OpPop),
            ],
        },
        {
            input: "- 1",
            expectedConstants: [1],
            expectedInstructions: [
                Code.Make(Code.OpConstant, 0),
                Code.Make(Code.OpMinus),
                Code.Make(Code.OpPop),
            ]
        }];

        runCompilerTests(tests);
    })

    test('boolean expressions', () => {
        const tests = [{
            input: "true",
            expectedConstants: [],
            expectedInstructions: [
                Code.Make(Code.OpTrue),
                Code.Make(Code.OpPop),
            ],
        },
        {
            input: "false",
            expectedConstants: [],
            expectedInstructions: [
                Code.Make(Code.OpFalse),
                Code.Make(Code.OpPop),
            ],
        },
        {
            input: "1 > 2",
            expectedConstants: [1, 2],
            expectedInstructions: [
                Code.Make(Code.OpConstant, 0),
                Code.Make(Code.OpConstant, 1),
                Code.Make(Code.OpGreaterThan),
                Code.Make(Code.OpPop),
            ],
        },
        {
            input: "1 < 2",
            expectedConstants: [2, 1],
            expectedInstructions: [
                Code.Make(Code.OpConstant, 0),
                Code.Make(Code.OpConstant, 1),
                Code.Make(Code.OpGreaterThan),
                Code.Make(Code.OpPop),
            ],
        },
        {
            input: "1 == 2",
            expectedConstants: [1, 2],
            expectedInstructions: [
                Code.Make(Code.OpConstant, 0),
                Code.Make(Code.OpConstant, 1),
                Code.Make(Code.OpEqual),
                Code.Make(Code.OpPop),
            ],
        },
        {
            input: "1 != 2",
            expectedConstants: [1, 2],
            expectedInstructions: [
                Code.Make(Code.OpConstant, 0),
                Code.Make(Code.OpConstant, 1),
                Code.Make(Code.OpNotEqual),
                Code.Make(Code.OpPop),
            ],
        },
        {
            input: "1 != 2",
            expectedConstants: [1, 2],
            expectedInstructions: [
                Code.Make(Code.OpConstant, 0),
                Code.Make(Code.OpConstant, 1),
                Code.Make(Code.OpNotEqual),
                Code.Make(Code.OpPop),
            ],
        },
        {
            input: "true == false",
            expectedConstants: [],
            expectedInstructions: [
                Code.Make(Code.OpTrue),
                Code.Make(Code.OpFalse),
                Code.Make(Code.OpEqual),
                Code.Make(Code.OpPop),
            ],
        },
        {
            input: "true != false",
            expectedConstants: [],
            expectedInstructions: [
                Code.Make(Code.OpTrue),
                Code.Make(Code.OpFalse),
                Code.Make(Code.OpNotEqual),
                Code.Make(Code.OpPop),
            ],
        },
        {
            input: "!true",
            expectedConstants: [],
            expectedInstructions: [
                Code.Make(Code.OpTrue),
                Code.Make(Code.OpBang),
                Code.Make(Code.OpPop),
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
                    Code.Make(Code.OpTrue),
                    // 0001
                    Code.Make(Code.OpJumpNotTruthy, 7),
                    // 0004
                    Code.Make(Code.OpConstant, 0),
                    // 0007
                    Code.Make(Code.OpJump, 8),
                    // 0010
                    Code.Make(Code.OpNull),
                    // 0011
                    Code.Make(Code.OpPop),
                    // 0012
                    Code.Make(Code.OpConstant, 1),
                    // 0015
                    Code.Make(Code.OpPop),
                ]
            },
            {
                input: `
                if (true) { 10 } else { 20 }; 3333;
                `,
                expectedConstants: [10, 20, 3333],
                expectedInstructions: [
                    // 0000
                    Code.Make(Code.OpTrue),
                    // 0001
                    Code.Make(Code.OpJumpNotTruthy, 7),
                    // 0004
                    Code.Make(Code.OpConstant, 0),
                    // 0007
                    Code.Make(Code.OpJump, 9),
                    // 0010
                    Code.Make(Code.OpConstant, 1),
                    // 0013
                    Code.Make(Code.OpPop),
                    // 0014
                    Code.Make(Code.OpConstant, 2),
                    // 0017
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: 'if (10 > 5) { 10; } else { 12; }',
                expectedConstants: [10, 5, 10, 12],
                expectedInstructions: [
                    // 0000
                    Code.Make(Code.OpConstant, 0),
                    // 0003
                    Code.Make(Code.OpConstant, 1),
                    // 0006
                    Code.Make(Code.OpGreaterThan),
                    // 0007
                    Code.Make(Code.OpJumpNotTruthy, 11),
                    // 0010
                    Code.Make(Code.OpConstant, 2),
                    // 0013
                    Code.Make(Code.OpJump, 13),
                    // 0016
                    Code.Make(Code.OpConstant, 3),
                    // 0019
                    Code.Make(Code.OpPop),
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
                    Code.Make(Code.OpConstant, 0),
                    Code.Make(Code.OpSetGlobal, 0),
                    Code.Make(Code.OpConstant, 1),
                    Code.Make(Code.OpSetGlobal, 1),
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
                    Code.Make(Code.OpConstant, 0),
                    //0003
                    Code.Make(Code.OpSetGlobal, 0),
                    //0006
                    Code.Make(Code.OpGetGlobal, 0),
                    //0009
                    Code.Make(Code.OpPop),
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
                    Code.Make(Code.OpConstant, 0),
                    Code.Make(Code.OpSetGlobal, 0),
                    Code.Make(Code.OpGetGlobal, 0),
                    Code.Make(Code.OpSetGlobal, 1),
                    Code.Make(Code.OpGetGlobal, 1),
                    Code.Make(Code.OpPop),
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
                    Code.Make(Code.OpConstant, 0),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: `"mon" + "key"`,
                expectedConstants: ["mon", "key"],
                expectedInstructions: [
                    Code.Make(Code.OpConstant, 0),
                    Code.Make(Code.OpConstant, 1),
                    Code.Make(Code.OpAdd),
                    Code.Make(Code.OpPop),
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
                    Code.Make(Code.OpArray, 0),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: "[1, 2, 3]",
                expectedConstants: [1, 2, 3],
                expectedInstructions: [
                    Code.Make(Code.OpConstant, 0),
                    Code.Make(Code.OpConstant, 1),
                    Code.Make(Code.OpConstant, 2),
                    Code.Make(Code.OpArray, 3),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: "[1 + 2, 3 - 4, 5 * 6]",
                expectedConstants: [1, 2, 3, 4, 5, 6],
                expectedInstructions: [
                    Code.Make(Code.OpConstant, 0),
                    Code.Make(Code.OpConstant, 1),
                    Code.Make(Code.OpAdd),
                    Code.Make(Code.OpConstant, 2),
                    Code.Make(Code.OpConstant, 3),
                    Code.Make(Code.OpSub),
                    Code.Make(Code.OpConstant, 4),
                    Code.Make(Code.OpConstant, 5),
                    Code.Make(Code.OpMul),
                    Code.Make(Code.OpArray, 3),
                    Code.Make(Code.OpPop),
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
                    Code.Make(Code.OpHash, 0),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: "{1: 2, 3: 4, 5: 6}",
                expectedConstants: [1, 2, 3, 4, 5, 6],
                expectedInstructions: [
                    Code.Make(Code.OpConstant, 0),
                    Code.Make(Code.OpConstant, 1),
                    Code.Make(Code.OpConstant, 2),
                    Code.Make(Code.OpConstant, 3),
                    Code.Make(Code.OpConstant, 4),
                    Code.Make(Code.OpConstant, 5),
                    Code.Make(Code.OpHash, 6),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: "{1: 2 + 3, 4: 5 * 6}",
                expectedConstants: [1, 2, 3, 4, 5, 6],
                expectedInstructions: [
                    Code.Make(Code.OpConstant, 0),
                    Code.Make(Code.OpConstant, 1),
                    Code.Make(Code.OpConstant, 2),
                    Code.Make(Code.OpAdd),
                    Code.Make(Code.OpConstant, 3),
                    Code.Make(Code.OpConstant, 4),
                    Code.Make(Code.OpConstant, 5),
                    Code.Make(Code.OpMul),
                    Code.Make(Code.OpHash, 4),
                    Code.Make(Code.OpPop),
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
                    Code.Make(Code.OpConstant, 0),
                    Code.Make(Code.OpConstant, 1),
                    Code.Make(Code.OpConstant, 2),
                    Code.Make(Code.OpArray, 3),
                    Code.Make(Code.OpConstant, 3),
                    Code.Make(Code.OpConstant, 4),
                    Code.Make(Code.OpAdd),
                    Code.Make(Code.OpIndex),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: "{1: 2}[2 - 1]",
                expectedConstants: [1, 2, 2, 1],
                expectedInstructions: [
                    Code.Make(Code.OpConstant, 0),
                    Code.Make(Code.OpConstant, 1),
                    Code.Make(Code.OpHash, 2),
                    Code.Make(Code.OpConstant, 2),
                    Code.Make(Code.OpConstant, 3),
                    Code.Make(Code.OpSub),
                    Code.Make(Code.OpIndex),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: "[1, 2, 3][0 + 2]",
                expectedConstants: [1, 2, 3, 0, 2],
                expectedInstructions: [
                    Code.Make(Code.OpConstant, 0),
                    Code.Make(Code.OpConstant, 1),
                    Code.Make(Code.OpConstant, 2),
                    Code.Make(Code.OpArray, 3),
                    Code.Make(Code.OpConstant, 3),
                    Code.Make(Code.OpConstant, 4),
                    Code.Make(Code.OpAdd),
                    Code.Make(Code.OpIndex),
                    Code.Make(Code.OpPop),
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
                        Code.Make(Code.OpConstant, 0),
                        Code.Make(Code.OpConstant, 1),
                        Code.Make(Code.OpAdd),
                        Code.Make(Code.OpReturnValue),
                    ],
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 2, 0),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: `fn() { 5 + 10 }`,
                expectedConstants: [
                    5,
                    10,
                    [
                        Code.Make(Code.OpConstant, 0),
                        Code.Make(Code.OpConstant, 1),
                        Code.Make(Code.OpAdd),
                        Code.Make(Code.OpReturnValue),
                    ],
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 2, 0),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: `fn() { 1; 2 }`,
                expectedConstants: [
                    1,
                    2,
                    [
                        Code.Make(Code.OpConstant, 0),
                        Code.Make(Code.OpPop),
                        Code.Make(Code.OpConstant, 1),
                        Code.Make(Code.OpReturnValue),
                    ],
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 2, 0),
                    Code.Make(Code.OpPop),
                ],
            },
        ];
        runCompilerTests(tests);
    });

    test('compiler scopes', () => {
        const compiler = new Compiler();
        expect(compiler.scopeIndex).toBe(0);

        const globalTable = compiler.symbolTable;
        compiler.emit(Code.OpMul);
        compiler.enterScope();
        expect(compiler.scopeIndex).toBe(1);
        compiler.emit(Code.OpSub);
        expect(compiler.scopes[compiler.scopeIndex].instructions.length).toBe(1);

        let last = compiler.scopes[compiler.scopeIndex].lastInstruction;
        expect(last?.OpCode).toEqual(Code.OpSub);

        expect((compiler.symbolTable as EnclosedSymbolTable).parentTable).toBe(globalTable)
        compiler.leaveScope();
        expect(compiler.scopeIndex).toBe(0);

        compiler.emit(Code.OpAdd);
        expect(compiler.scopes[compiler.scopeIndex].instructions.length).toBe(2);

        last = compiler.scopes[compiler.scopeIndex].lastInstruction;
        expect(last?.OpCode).toEqual(Code.OpAdd);
        const previous = compiler.scopes[compiler.scopeIndex].previousInstruction;
        expect(previous?.OpCode).toEqual(Code.OpMul);

        expect(compiler.symbolTable).toBe(globalTable);

    })

    test('functions without return value', () => {
        const tests = [
            {
                input: `fn() { }`,
                expectedConstants: [
                    [
                        Code.Make(Code.OpReturn),
                    ],
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 0, 0),
                    Code.Make(Code.OpPop),
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
                        Code.Make(Code.OpConstant, 0), // The literal "24"
                        Code.Make(Code.OpReturnValue),
                    ],
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 1, 0), // The compiled function
                    Code.Make(Code.OpCall, 0),
                    Code.Make(Code.OpPop),
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
                        Code.Make(Code.OpConstant, 0),
                        Code.Make(Code.OpConstant, 1),
                        Code.Make(Code.OpAdd),
                        Code.Make(Code.OpReturnValue),
                    ]
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 2, 0),
                    Code.Make(Code.OpSetGlobal, 0),
                    Code.Make(Code.OpGetGlobal, 0),
                    Code.Make(Code.OpCall, 0),
                    Code.Make(Code.OpPop),
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
                        Code.Make(Code.OpConstant, 0), // The literal "24"
                        Code.Make(Code.OpReturnValue),
                    ],
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 1, 0), // The compiled function
                    Code.Make(Code.OpSetGlobal, 0),
                    Code.Make(Code.OpGetGlobal, 0),
                    Code.Make(Code.OpCall, 0),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: `
                let oneArg = fn(a) { };
                oneArg(24);
                `,
                expectedConstants: [
                    [
                        Code.Make(Code.OpReturn),
                    ],
                    24,
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 0, 0),
                    Code.Make(Code.OpSetGlobal, 0),
                    Code.Make(Code.OpGetGlobal, 0),
                    Code.Make(Code.OpConstant, 1),
                    Code.Make(Code.OpCall, 1),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: `
                let manyArg = fn(a, b, c) { };
                manyArg(24, 25, 26);
                `,
                expectedConstants: [
                    [
                        Code.Make(Code.OpReturn),
                    ],
                    24,
                    25,
                    26,
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 0, 0),
                    Code.Make(Code.OpSetGlobal, 0),
                    Code.Make(Code.OpGetGlobal, 0),
                    Code.Make(Code.OpConstant, 1),
                    Code.Make(Code.OpConstant, 2),
                    Code.Make(Code.OpConstant, 3),
                    Code.Make(Code.OpCall, 3),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: `
                let oneArg = fn(a) { a };
                oneArg(24);
                `,
                expectedConstants: [
                    [
                        Code.Make(Code.OpGetLocal, 0),
                        Code.Make(Code.OpReturnValue),
                    ],
                    24,
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 0, 0),
                    Code.Make(Code.OpSetGlobal, 0),
                    Code.Make(Code.OpGetGlobal, 0),
                    Code.Make(Code.OpConstant, 1),
                    Code.Make(Code.OpCall, 1),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: `
                let manyArg = fn(a, b, c) { a; b; c };
                manyArg(24, 25, 26);
                `,
                expectedConstants: [
                    [
                        Code.Make(Code.OpGetLocal, 0),
                        Code.Make(Code.OpPop),
                        Code.Make(Code.OpGetLocal, 1),
                        Code.Make(Code.OpPop),
                        Code.Make(Code.OpGetLocal, 2),
                        Code.Make(Code.OpReturnValue),
                    ],
                    24,
                    25,
                    26,
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 0, 0),
                    Code.Make(Code.OpSetGlobal, 0),
                    Code.Make(Code.OpGetGlobal, 0),
                    Code.Make(Code.OpConstant, 1),
                    Code.Make(Code.OpConstant, 2),
                    Code.Make(Code.OpConstant, 3),
                    Code.Make(Code.OpCall, 3),
                    Code.Make(Code.OpPop),
                ],
            }
        ];
        runCompilerTests(tests);
    })

    test('let statement scopes', () => {
        const tests = [
            {
                input: `
                let num = 55;
                fn() { num }
                `,
                expectedConstants: [
                    55,
                    [
                        Code.Make(Code.OpGetGlobal, 0),
                        Code.Make(Code.OpReturnValue),
                    ],
                ],
                expectedInstructions: [
                    Code.Make(Code.OpConstant, 0),
                    Code.Make(Code.OpSetGlobal, 0),
                    Code.Make(Code.OpClosure, 1, 0),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: `
                fn() {
                let num = 55;
                num
                }
                `,
                expectedConstants: [
                    55,
                    [
                        Code.Make(Code.OpConstant, 0),
                        Code.Make(Code.OpSetLocal, 0),
                        Code.Make(Code.OpGetLocal, 0),
                        Code.Make(Code.OpReturnValue),
                    ],
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 1, 0),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: `
                fn() {
                let a = 55;
                let b = 77;
                a + b
                }
                `,
                expectedConstants: [
                    55,
                    77,
                    [
                        Code.Make(Code.OpConstant, 0),
                        Code.Make(Code.OpSetLocal, 0),
                        Code.Make(Code.OpConstant, 1),
                        Code.Make(Code.OpSetLocal, 1),
                        Code.Make(Code.OpGetLocal, 0),
                        Code.Make(Code.OpGetLocal, 1),
                        Code.Make(Code.OpAdd),
                        Code.Make(Code.OpReturnValue),
                    ],
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 2, 0),
                    Code.Make(Code.OpPop),
                ],
            }
        ];
        runCompilerTests(tests);
    })

    test('functions with bindings', () => {
        const tests = [
            {
                input: `
                let one = fn() { let one = 1; one };
                one();
                `,
                expectedConstants: [
                    1,
                    [
                        // 0000
                        Code.Make(Code.OpConstant, 0),
                        // 0003
                        Code.Make(Code.OpSetLocal, 0),
                        // 0005
                        Code.Make(Code.OpGetLocal, 0),
                        // 0007
                        Code.Make(Code.OpReturnValue),
                    ]
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 1, 0),
                    Code.Make(Code.OpSetGlobal, 0),
                    Code.Make(Code.OpGetGlobal, 0),
                    Code.Make(Code.OpCall, 0),
                    Code.Make(Code.OpPop),
                ],

            },
        ];
        runCompilerTests(tests);
    })

    test('builtins', () => {
        const tests = [
            {
                input: `
                len([]);
                push([], 1);
                `,
                expectedConstants: [1],
                expectedInstructions: [
                    Code.Make(Code.OpGetBuiltin, 0),
                    Code.Make(Code.OpArray, 0),
                    Code.Make(Code.OpCall, 1),
                    Code.Make(Code.OpPop),
                    Code.Make(Code.OpGetBuiltin, 4),
                    Code.Make(Code.OpArray, 0),
                    Code.Make(Code.OpConstant, 0),
                    Code.Make(Code.OpCall, 2),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: `fn() { len([]) }`,
                expectedConstants: [
                    [
                        Code.Make(Code.OpGetBuiltin, 0),
                        Code.Make(Code.OpArray, 0),
                        Code.Make(Code.OpCall, 1),
                        Code.Make(Code.OpReturnValue),
                    ],
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 0, 0),
                    Code.Make(Code.OpPop),
                ],
            },
        ];
        runCompilerTests(tests);
    })

    test('closures', () => {
        const tests = [
            {
                input: `
                fn(a) {
                fn(b) {
                a + b
                }
                }
                `,
                expectedConstants: [
                    [
                        Code.Make(Code.OpGetFree, 0),
                        Code.Make(Code.OpGetLocal, 0),
                        Code.Make(Code.OpAdd),
                        Code.Make(Code.OpReturnValue),
                    ],
                    [
                        Code.Make(Code.OpGetLocal, 0),
                        Code.Make(Code.OpClosure, 0, 1),
                        Code.Make(Code.OpReturnValue),
                    ],
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 1, 0),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: `
                fn(a) {
                fn(b) {
                fn(c) {
                a + b + c
                }
                }
                };
                `,
                expectedConstants: [
                    [
                        Code.Make(Code.OpGetFree, 0),
                        Code.Make(Code.OpGetFree, 1),
                        Code.Make(Code.OpAdd),
                        Code.Make(Code.OpGetLocal, 0),
                        Code.Make(Code.OpAdd),
                        Code.Make(Code.OpReturnValue),
                    ],
                    [
                        Code.Make(Code.OpGetFree, 0),
                        Code.Make(Code.OpGetLocal, 0),
                        Code.Make(Code.OpClosure, 0, 2),
                        Code.Make(Code.OpReturnValue),
                    ],
                    [
                        Code.Make(Code.OpGetLocal, 0),
                        Code.Make(Code.OpClosure, 1, 1),
                        Code.Make(Code.OpReturnValue),
                    ],
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 2, 0),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: `
                let global = 55;
                fn() {
                let a = 66;
                fn() {
                let b = 77;
                fn() {
                let c = 88;
                global + a + b + c;
                }
                }
                }
                `,
                expectedConstants: [
                    55,
                    66,
                    77,
                    88,
                    [
                        Code.Make(Code.OpConstant, 3),
                        Code.Make(Code.OpSetLocal, 0),
                        Code.Make(Code.OpGetGlobal, 0),
                        Code.Make(Code.OpGetFree, 0),
                        Code.Make(Code.OpAdd),
                        Code.Make(Code.OpGetFree, 1),
                        Code.Make(Code.OpAdd),
                        Code.Make(Code.OpGetLocal, 0),
                        Code.Make(Code.OpAdd),
                        Code.Make(Code.OpReturnValue),
                    ],
                    [
                        Code.Make(Code.OpConstant, 2),
                        Code.Make(Code.OpSetLocal, 0),
                        Code.Make(Code.OpGetFree, 0),
                        Code.Make(Code.OpGetLocal, 0),
                        Code.Make(Code.OpClosure, 4, 2),
                        Code.Make(Code.OpReturnValue),
                    ],
                    [
                        Code.Make(Code.OpConstant, 1),
                        Code.Make(Code.OpSetLocal, 0),
                        Code.Make(Code.OpGetLocal, 0),
                        Code.Make(Code.OpClosure, 5, 1),
                        Code.Make(Code.OpReturnValue),
                    ],
                ],
                expectedInstructions: [
                    Code.Make(Code.OpConstant, 0),
                    Code.Make(Code.OpSetGlobal, 0),
                    Code.Make(Code.OpClosure, 6, 0),
                    Code.Make(Code.OpPop),
                ],
            }
        ];

        runCompilerTests(tests);
    })

    test('recursive functions', () => {
        const tests = [
            {
                input: `
                let countDown = fn(x) { countDown(x - 1); };
                countDown(1);
                `,
                expectedConstants: [
                    1,
                    [
                        Code.Make(Code.OpCurrentClosure),
                        Code.Make(Code.OpGetLocal, 0),
                        Code.Make(Code.OpConstant, 0),
                        Code.Make(Code.OpSub),
                        Code.Make(Code.OpCall, 1),
                        Code.Make(Code.OpReturnValue),
                    ],
                    1,
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 1, 0),
                    Code.Make(Code.OpSetGlobal, 0),
                    Code.Make(Code.OpGetGlobal, 0),
                    Code.Make(Code.OpConstant, 2),
                    Code.Make(Code.OpCall, 1),
                    Code.Make(Code.OpPop),
                ],
            },
            {
                input: `
                let wrapper = fn() {
                let countDown = fn(x) { countDown(x - 1); };
                countDown(1);
                };
                wrapper();
                `,
                expectedConstants: [
                    1,
                    [
                        Code.Make(Code.OpCurrentClosure),
                        Code.Make(Code.OpGetLocal, 0),
                        Code.Make(Code.OpConstant, 0),
                        Code.Make(Code.OpSub),
                        Code.Make(Code.OpCall, 1),
                        Code.Make(Code.OpReturnValue),
                    ],
                    1,
                    [
                        Code.Make(Code.OpClosure, 1, 0),
                        Code.Make(Code.OpSetLocal, 0),
                        Code.Make(Code.OpGetLocal, 0),
                        Code.Make(Code.OpConstant, 2),
                        Code.Make(Code.OpCall, 1),
                        Code.Make(Code.OpReturnValue),
                    ],
                ],
                expectedInstructions: [
                    Code.Make(Code.OpClosure, 3, 0),
                    Code.Make(Code.OpSetGlobal, 0),
                    Code.Make(Code.OpGetGlobal, 0),
                    Code.Make(Code.OpCall, 0),
                    Code.Make(Code.OpPop),
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
        const res = compiler.compile(program as Ast.Program);
        // expect(res).not.toBe(null);

        const byteCode = compiler.byteCode();
        try {
            testInstructions(test.expectedInstructions, byteCode.instructions);
        } catch (err) {
            console.log(test.expectedInstructions);
            throw err;
        }

        testConstants(test.expectedConstants, byteCode.constants);
    })
}

const testInstructions = (expectedInstructions: Code.Instructions[], instructions: Code.Instructions) => {
    const concatted = concatInstructions(expectedInstructions);
    // console.log(instructions.toString());
    // console.log(new code.Instructions(...concatted).toString())
    expect(instructions.length).toEqual(concatted.length);
    for (let i = 0; i < concatted.length; i++) {
        expect(concatted[i]).toEqual(instructions[i]);
    }
}

const testConstants = (expected: any[], actual: Obj.Obj[]) => {
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
                    expect(actual[i] instanceof Obj.CompiledFunction).toBe(true);
                    const error = testInstructions(constant, (actual[i] as Obj.CompiledFunction).instructions)
                }
        }
    }
}

const testIntegerObject = (expected: number, actual: Obj.Obj) => {
    expect(actual instanceof Obj.Integer).toBe(true);
    const actualInteger = actual as Obj.Integer;
    expect(actualInteger.value).toEqual(expected);
}

const testStringObject = (expected: string, actual: Obj.Obj) => {
    expect(actual instanceof Obj.String).toBe(true);
    const actualString = actual as Obj.String;
    expect(actualString.value).toEqual(expected);
}

const concatInstructions = (instructions: Code.Instructions[]) => {
    const out: Code.Instructions = [];
    for (let i = 0; i < instructions.length; i++) {
        out.push(...instructions[i]);
    }
    return out;
}

const parse = (input: string): Ast.Program | undefined => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.ParseProgram();
    return program;
}
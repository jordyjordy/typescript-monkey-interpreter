import { GlobalScope, SSymbol, SymbolTable, LocalScope, EnclosedSymbolTable, BuiltinScope, FreeScope, FunctionScope } from './symbolTable';

describe("symbol table tests", () => {
    test('define', () => {
        const expected = {
            "a": new SSymbol("a", GlobalScope, 0),
            "b": new SSymbol("b", GlobalScope, 1),
            "c": new SSymbol("c", LocalScope, 0),
            "d": new SSymbol("d", LocalScope, 1),
            "e": new SSymbol("e", LocalScope, 0),
            "f": new SSymbol("f", LocalScope, 1),
        };

        const global = new SymbolTable();

        const a = global.define("a");
        expect(a).toEqual(expected.a);
        const b = global.define("b");
        expect(b).toEqual(expected.b);

        const local = new EnclosedSymbolTable(global);
        const c = local.define('c');
        expect(c).toEqual(expected.c);
        const d =local.define('d');
        expect(d).toEqual(expected.d);

        const secondLocal = new EnclosedSymbolTable(global);
        const e =secondLocal.define('e');
        expect(e).toEqual(expected.e);
        const f =secondLocal.define('f');
        expect(f).toEqual(expected.f);
    })

    test('resolve global', () => {
        const global = new SymbolTable();
        global.define("a");
        global.define("b");

        const expected = [
            new SSymbol("a", GlobalScope, 0),
            new SSymbol("b", GlobalScope, 1),
        ];

        expected.forEach((expectedSymbol) => {
            const result = global.resolve(expectedSymbol.name);
            expect(result).toBeDefined();
            expect(result).toEqual(expectedSymbol);
        })
    })

    test('resolve local', () => {
        const global = new SymbolTable();
        global.define('a');
        global.define('b');

        const local = new EnclosedSymbolTable(global);
        local.define('c');
        local.define('d');
    
        const expected = [
            new SSymbol("a", GlobalScope, 0),
            new SSymbol("b", GlobalScope, 1),
            new SSymbol('c', LocalScope, 0),
            new SSymbol('d', LocalScope, 1),
        ];

        expected.forEach((expectedSymbol) => {
            const result = local.resolve(expectedSymbol.name);
            expect(result).toBeDefined();
            expect(result).toEqual(expectedSymbol);
        })
    });

    test('nested local', () => {
        const global = new SymbolTable();
        global.define('a');
        global.define('b');

        const local = new EnclosedSymbolTable(global);
        local.define('c');
        local.define('d');

        const secondLocal = new EnclosedSymbolTable(global);
        secondLocal.define('e');
        secondLocal.define('f');

        const tests: [any, Array<SSymbol>][] = [
            [
                local,
                [
                    new SSymbol("a", GlobalScope, 0),
                    new SSymbol("b", GlobalScope, 1),
                    new SSymbol('c', LocalScope, 0),
                    new SSymbol('d', LocalScope, 1),
                ],
            ],
            [
                secondLocal,
                [
                    new SSymbol("a", GlobalScope, 0),
                    new SSymbol("b", GlobalScope, 1),
                    new SSymbol('e', LocalScope, 0),
                    new SSymbol('f', LocalScope, 1),
                ]
            ],
                
        ];

        tests.forEach(([scope, expected]) => {
            expected.forEach((expectedSymbol) => {
                const result = scope.resolve(expectedSymbol.name);
                expect(result).toBeDefined();
                expect(result).toEqual(expectedSymbol);
            })
        });
    })

    test('define resolve builtins', () => {
        const global = new SymbolTable();
        const firstLocal = new EnclosedSymbolTable(global);
        const secondLocal = new EnclosedSymbolTable(firstLocal);

        const expected = [
            new SSymbol("a", BuiltinScope, 0),
            new SSymbol("b", BuiltinScope, 1),
            new SSymbol('c', BuiltinScope, 2),
            new SSymbol('d', BuiltinScope, 3),
        ]

        expected.forEach((v, i) => {
            global.defineBuiltIn(i, v.name);
        });
    
        [global, firstLocal, secondLocal].forEach((table) => {
            expected.forEach(sym => {
                const res = table.resolve(sym.name);
                expect(res).toEqual(sym);
            })
        })
    })

    test('resolve free', () => {
        const global = new SymbolTable();
        const a = global.define("a");
        const b = global.define("b");

        const local = new EnclosedSymbolTable(global);
        const c = local.define('c');
        const d =local.define('d');


        const secondLocal = new EnclosedSymbolTable(local);
        const e =secondLocal.define('e');
        const f =secondLocal.define('f');

        const tests: [SymbolTable, SSymbol[], SSymbol[]][] = [
            [
                local,
                [
                    new SSymbol('a', GlobalScope, 0),
                    new SSymbol('b', GlobalScope, 1),
                    new SSymbol('c', LocalScope, 0),
                    new SSymbol('d', LocalScope, 1),
                ],
                []
            ],
            [
                secondLocal,
                [
                    new SSymbol('a', GlobalScope, 0),
                    new SSymbol('b', GlobalScope, 1),
                    new SSymbol('c', FreeScope, 0),
                    new SSymbol('d', FreeScope, 1),
                    new SSymbol('e', LocalScope, 0),
                    new SSymbol('f', LocalScope, 1),
                ],
                [
                    new SSymbol('c', LocalScope, 0),
                    new SSymbol('d', LocalScope, 1),
                ]
            ],
        ];
        tests.forEach((test) => {
            test[1].forEach((sym) => {
                const res = test[0].resolve(sym.name);
                expect(res).toBeDefined();
                expect(res).toEqual(sym);
            })

            expect(test[0].freeSymbols.length).toEqual(test[2].length);

            test[2].forEach((sym, i) => {
                const res = test[0].freeSymbols[i];
                expect(res).toEqual(sym);
            })
        });
    })

    test('unresolvable free', () => {
        const global = new SymbolTable();
        global.define("a");

        const local = new EnclosedSymbolTable(global);
        local.define('c');

        const secondLocal = new EnclosedSymbolTable(local);
        secondLocal.define('e');
        secondLocal.define('f');

        const expected = [
            new SSymbol('a', GlobalScope, 0),
            new SSymbol('c', FreeScope, 0),
            new SSymbol('e', LocalScope, 0),
            new SSymbol('f', LocalScope, 1),
        ]

        expected.forEach((sym) => {
            const res = secondLocal.resolve(sym.name);
            expect(res).toBeDefined();
            expect(res).toEqual(sym);
        })

        const expectUnresolvable = [
            "b",
            "d"
        ];

        expectUnresolvable.forEach((name) => {
            const res = secondLocal.resolve(name);
            expect(res).toBeUndefined();
        })
    })

    test('define and resolve function name', () => {
        const global = new SymbolTable();
        global.defineFunctionName("a");
        
        const expected = new SSymbol('a', FunctionScope, 0);

        const res = global.resolve(expected.name);
        expect(res).toBeDefined();

        expect(res).toEqual(expected);
    })

    test('shadowing function name', () => {
        const global = new SymbolTable();
        global.defineFunctionName("a");
        global.define('a');

        const expected = new SSymbol('a', GlobalScope, 0);

        const res = global.resolve(expected.name);
        expect(res).toBeDefined();

        expect(res).toEqual(expected);
    })
})
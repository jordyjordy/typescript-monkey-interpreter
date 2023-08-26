import { GlobalScope, SSymbol, SymbolTable, localScope, EnclosedSymbolTable } from './symbolTable';

describe("symbol table tests", () => {
    test('define', () => {
        const expected = {
            "a": new SSymbol("a", GlobalScope, 0),
            "b": new SSymbol("b", GlobalScope, 1),
            "c": new SSymbol("c", localScope, 0),
            "d": new SSymbol("d", localScope, 1),
            "e": new SSymbol("e", localScope, 0),
            "f": new SSymbol("f", localScope, 1),
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
            new SSymbol('c', localScope, 0),
            new SSymbol('d', localScope, 1),
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
                    new SSymbol('c', localScope, 0),
                    new SSymbol('d', localScope, 1),
                ],
            ],
            [
                secondLocal,
                [
                    new SSymbol("a", GlobalScope, 0),
                    new SSymbol("b", GlobalScope, 1),
                    new SSymbol('e', localScope, 0),
                    new SSymbol('f', localScope, 1),
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
})
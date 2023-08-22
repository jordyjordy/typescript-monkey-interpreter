import { GlobalScope, SSymbol, SymbolTable } from './symbolTable';

describe("symbol table tests", () => {
    test('define', () => {
        const expected = {
            "a": new SSymbol("a", GlobalScope, 0),
            "b": new SSymbol("b", GlobalScope, 1),
        };

        const global = new SymbolTable();

        const a = global.define("a");
        expect(a).toEqual(expected.a);
        const b = global.define("b");
        expect(b).toEqual(expected.b);
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
})
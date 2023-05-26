import { Identifier, LetStatement, Program } from "./ast"
import token from "./token"

describe('AST tests', () => {
    it('returns a String', () => {
        const program = new Program([
            new LetStatement(
                [token.LET, 'let'],
                new Identifier([token.LET, 'myVar'], 'myVar'),
                new Identifier([token.IDENT, 'anotherVar'], 'anotherVar'),
            )
        ]);
        expect(program.string()).toEqual('let myVar = anotherVar;');
    })
})
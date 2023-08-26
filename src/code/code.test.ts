import { Instructions, Lookup, Make, OpAdd, OpClosure, OpConstant, OpGetLocal, Opcode, ReadOperands } from './'

describe("code tests", () => {
    test('make', () => {
        const tests: [Opcode, number[], number[]][] = [
            [OpConstant, [65534], [OpConstant,  65534]],
            [OpAdd, [], [OpAdd]],
            [OpGetLocal, [255], [OpGetLocal, 255]],
            [OpClosure, [65534, 255], [OpClosure, 65534, 255]]
        ];

        tests.forEach(([op, operand, expected]) => {
            const instruction = Make(op, ...operand);
            expect(instruction.length).toEqual(expected.length);
            for(let i = 0; i < instruction.length; i++) {
                expect(instruction[i]).toEqual(expected[i]);
            }
        })
    })

    test('instructions string', () => {
        const instructions: Instructions[] = [
            Make(OpAdd),
            Make(OpGetLocal, 1),
            Make(OpConstant, 2),
            Make(OpConstant, 65535),
            Make(OpClosure, 65535, 255),
        ];
        const expected = '0000 OpAdd\n' +
                         '0001 OpGetLocal 1\n' +
                         '0003 OpConstant 2\n' +
                         '0005 OpConstant 65535\n' +
                         '0007 OpClosure 65535 255';
        
        const concatted = new Instructions();
        instructions.forEach((instruction) => {
            concatted.push(...instruction);
        })
        expect(concatted.toString()).toEqual(expected)
    })

    test('read operands', () => {
        const tests: [Opcode, number[], number][] = [
            [OpConstant, [65535], 1],
            [OpGetLocal, [255], 1],
            [OpClosure, [65535, 255], 2],
        ]

        tests.forEach((test) => {
            const instruction = Make(test[0], ...test[1]);
            const def = Lookup(test[0]);

            expect(def).toBeDefined();

            const [operandsRead, n] = ReadOperands(def, instruction.slice(1));

            expect(n).toEqual(test[2]);

            test[1].forEach((value, index) => {
                expect(operandsRead[index]).toEqual(value);
            })

        })
    })
});
import { Instructions, Lookup, Make, OpConstant, Opcode, ReadOperands } from './'

describe("code tests", () => {
    test('make', () => {
        const tests: [Opcode, number[], number[]][] = [
            [OpConstant, [65534], [OpConstant, 255, 254]],
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
            Make(OpConstant, 1),
            Make(OpConstant, 2),
            Make(OpConstant, 65535),
        ];
        const expected = '0000 OpConstant 1\n' +
                         '0003 OpConstant 2\n' +
                         '0006 OpConstant 65535';
        
        const concatted = new Instructions();
        instructions.forEach((instruction) => {
            concatted.push(...instruction);
        })
        expect(concatted.toString()).toEqual(expected)
    })

    test('read operands', () => {
        const tests: [Opcode, number[], number][] = [
            [OpConstant, [65535], 2]
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
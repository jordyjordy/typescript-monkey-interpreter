import { Make, OpConstant, Opcode } from './'

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
});
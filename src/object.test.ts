import { String } from "./object"

describe('object tests', () => {
    test('string hash key', () => {
        const hello1 = new String('Hello World');
        const hello2 = new String('Hello World');
        const diff1 = new String('My name is Johnny');
        const diff2 = new String('My name is Johnny');
        expect(hello1.hashKey()).toEqual(hello2.hashKey());

        expect(diff1.hashKey()).toEqual(diff2.hashKey());

        expect(hello1.hashKey()).not.toEqual(diff1.hashKey());
    })
})
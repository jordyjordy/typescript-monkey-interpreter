import { BlockStatement, Identifier } from "../ast";
import Environment from "../evaluator/environment";
import * as Code from '../code';
import crypto from 'crypto';

type ObjectType = string;

const INTEGER_OBJ = "INTEGER";
const BOOLEAN_OBJ = "BOOLEAN";
const NULL_OBJ = "NULL";
const RETURN_VALUE_OBJ = "RETURN_VALUE";
const ERROR_OBJ = 'ERROR';
const FUNCTION_OBJ = 'FUNCTION';
const COMPILED_FUNCTION_OBJ = 'COMPILED_FUNCTION_OBJ';
const STRING_OBJ = 'STRING';
const BUILTIN_OBJ = 'BUILTIN';
const ARRAY_OBJ = 'ARRAY';
const HASH_OBJ = 'HASH';

export interface Obj {
    type: () => ObjectType;
    inspect: () => string;
}

export class Hashable {}

export interface IHashable extends Obj {
    hashKey: () => HashKey;
}

class Integer extends Hashable implements IHashable {
    value: number;

    constructor(value: number) {
        super();
        this.value = value;
    }

    type() {
        return INTEGER_OBJ;
    }

    inspect() {
        return this.value.toString();
    }

    hashKey() {
        return new HashKey(this.type(), this.value.toString());
    }
}

class Bool extends Hashable implements IHashable {
    value: boolean;

    constructor(value: boolean) {
        super();
        this.value = value;
    }
    
    type() {
        return BOOLEAN_OBJ;
    }

    inspect() {
        return this.value + '';
    }

    hashKey() {
        return new HashKey(this.type(), this.value ? '1' : '0');
    }
}

class Null implements Obj {
    type() {
        return NULL_OBJ;
    }

    inspect() {
        return 'null';
    }
}

class ReturnValue implements Obj {
    value: Obj;
    constructor(value: Obj) {
        this.value = value;
    }

    type() {
        return RETURN_VALUE_OBJ;
    }

    inspect() {
        return this.value.inspect();
    }
}

class InterpretError implements Obj {
    message: string

    constructor(message: string) {
        this.message = message;
    }

    type() {
        return ERROR_OBJ;
    }

    inspect() {
        return `ERROR: ${this.message}`;
    }
}

class CompiledFunction implements Obj {
    instructions: Code.Instructions;
    constructor(instructions: Code.Instructions) {
        this.instructions = instructions;
    }

    type() {
        return COMPILED_FUNCTION_OBJ;
    }

    inspect() {
        return this.toString();
    }
}

class Function implements Obj {
    parameters: Identifier[];
    body: BlockStatement;
    env: Environment;

    constructor(parameters: Identifier[], body: BlockStatement, env: Environment) {
        this.parameters = parameters;
        this.body = body;
        this.env = env;
    }

    type() {
        return FUNCTION_OBJ;
    }

    inspect() {
        const params = this.parameters.map((param) => param.string()).join(', ');
        return `fn(${params}){\n${this.body.string()}\n}`;
    }
}

class String extends Hashable implements IHashable {
    value: string;
    constructor(value: string) {
        super();
        this.value = value;
    }
    type() {
        return STRING_OBJ;
    }

    inspect() {
        return this.value;
    }

    hashKey() {
        return new HashKey(
            this.type(),  crypto.createHash('sha1').update(this.value).digest('hex')
        );
    }
}

class BuiltIn implements Obj {
    value: (...args: Obj[]) => Obj;

    constructor(value: (...args: Obj[]) => Obj) {
        this.value = value;
    }

    type() {
        return BUILTIN_OBJ;
    }

    inspect() {
        return "builtin function";
    }
}

class ArrayLiteral implements Obj {
    elements: Obj[];
    constructor(elements: Obj[] = []) {
        this.elements = elements;
    }
    type() { return  ARRAY_OBJ };

    inspect() {
        return `[${this.elements.map((el) => el.inspect()).join(', ')}]`;
    }
}

export class HashKey {
    type: ObjectType;
    value: string;

    constructor(type: ObjectType, value: string) {
        this.type = type;
        this.value = value;
    }
}

export class HashPair {
    key: Obj;
    value: Obj;

    constructor(key: Obj, value: Obj) {
        this.key = key;
        this.value = value;
    }
}

class Hash implements Obj {
    pairs: Map<string, HashPair>;

    constructor(pairs: Map<string, HashPair> = new Map()) {
        this.pairs = pairs;
    }

    type() {
        return HASH_OBJ;
    }

    inspect() {
        const pairs: string[] = [];
        for(const [key, value] of this.pairs) {
            pairs.push(`${value.key.inspect()}: ${value.value.inspect()}`)
        }
        return `{${pairs.join(', ')}}`;
    }
}

export {
    Integer,
    Null,
    Bool,
    ReturnValue,
    InterpretError,
    CompiledFunction,
    Function,
    String,
    BuiltIn,
    ArrayLiteral,
    Hash,
    INTEGER_OBJ,
    NULL_OBJ,
    BOOLEAN_OBJ,
    RETURN_VALUE_OBJ,
    ERROR_OBJ,
    COMPILED_FUNCTION_OBJ,
    FUNCTION_OBJ,
    STRING_OBJ,
    BUILTIN_OBJ,
    ARRAY_OBJ,
    HASH_OBJ
}
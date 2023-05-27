import { BlockStatement, Identifier } from "./ast";
import Environment from "./environment";

type ObjectType = string;

const INTEGER_OBJ = "INTEGER";
const BOOLEAN_OBJ = "BOOLEAN";
const NULL_OBJ = "NULL";
const RETURN_VALUE_OBJ = "RETURN_VALUE";
const ERROR_OBJ = 'ERROR';
const FUNCTION_OBJ = 'FUNCTION';

export interface Obj {
    type: () => ObjectType;
    inspect: () => string;
}

class Integer implements Obj {
    value: number;
    constructor(value: number) {
        this.value = value;
    }

    type() {
        return INTEGER_OBJ;
    }

    inspect() {
        return this.value.toString();
    }
}

class Bool implements Obj {
    value: boolean;

    constructor(value: boolean) {
        this.value = value;
    }
    
    type() {
        return BOOLEAN_OBJ;
    }

    inspect() {
        return this.value + '';
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

export {
    Integer,
    Null,
    Bool,
    ReturnValue,
    InterpretError,
    Function,
    INTEGER_OBJ,
    NULL_OBJ,
    BOOLEAN_OBJ,
    RETURN_VALUE_OBJ,
    ERROR_OBJ,
    FUNCTION_OBJ,
}
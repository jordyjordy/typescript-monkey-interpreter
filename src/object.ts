
type ObjectType = string;

const INTEGER_OBJ = "INTEGER";
const BOOLEAN_OBJ = "BOOLEAN";
const NULL_OBJ = "NULL";
const RETURN_VALUE_OBJ = "RETURN_VALUE";
const ERROR_OBJ = 'ERROR';
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

export {
    Integer,
    Null,
    Bool,
    ReturnValue,
    InterpretError,
    INTEGER_OBJ,
    NULL_OBJ,
    BOOLEAN_OBJ,
    RETURN_VALUE_OBJ,
    ERROR_OBJ,
}
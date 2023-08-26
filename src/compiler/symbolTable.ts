type SymbolScope = string;

export const GlobalScope: SymbolScope = "GLOBAL";
export const localScope: SymbolScope = "LOCAL";

export class SSymbol {
    name: string;
    scope: SymbolScope;
    index: number;   

    constructor(name: string, scope: SymbolScope, index: number) {
        this.name = name;
        this.scope = scope;
        this.index = index;
    }
}

export class SymbolTable {
    store: Record<string, SSymbol>;
    numDefinitions: number;

    constructor() {
        this.store = {};
        this.numDefinitions = 0;
    }

    define(name: string): SSymbol {
        const symbol = new SSymbol(name, GlobalScope, this.numDefinitions);
        this.store[name] = symbol;
        this.numDefinitions++;
        return symbol; 
    }

    resolve(name: string): SSymbol {
        return this.store[name];
    }
}

export class EnclosedSymbolTable extends SymbolTable {
    parentTable: SymbolTable;

    constructor(parentTable: SymbolTable) {
        super();
        this.parentTable =parentTable;
    }

    define(name: string): SSymbol {
        const symbol = new SSymbol(name, localScope, this.numDefinitions);
        this.store[name] = symbol;
        this.numDefinitions++;
        return symbol;
    }

    resolve(name: string): SSymbol {
        return this.store[name] ?? this.parentTable.resolve(name);
    }
}
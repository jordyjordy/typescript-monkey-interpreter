type SymbolScope = string;

export const GlobalScope: SymbolScope = "GLOBAL";
export const LocalScope: SymbolScope = "LOCAL";
export const BuiltinScope: SymbolScope = "BUILTIN";
export const FreeScope: SymbolScope = "FREE";
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
    freeSymbols: SSymbol[];
    parentTable: SymbolTable | undefined;
    constructor() {
        this.store = {};
        this.freeSymbols = [];
        this.numDefinitions = 0;
    }

    define(name: string): SSymbol {
        const symbol = new SSymbol(name, GlobalScope, this.numDefinitions);
        this.store[name] = symbol;
        this.numDefinitions++;
        return symbol; 
    }

    defineFree(original: SSymbol) {
        this.freeSymbols.push(original);
        const symbol = new SSymbol(original.name, FreeScope, this.freeSymbols.length - 1);
        this.store[original.name] = symbol;
        return symbol;
    }
    
    defineBuiltIn(index: number, name: string) {
        const symbol = new SSymbol(name, BuiltinScope, index);
        this.store[name] = symbol;
        return symbol;
    }

    resolve(name: string): SSymbol | undefined {
        const res = this.store[name];
        if(res) {
            return res;
        }
        if(this.parentTable) {
            const parentRes = this.parentTable.resolve(name);
            if(!parentRes || (parentRes.scope === GlobalScope || parentRes.scope === BuiltinScope)) {
                return parentRes;
            }
            const free = this.defineFree(parentRes);
            return free;
        }
    }
}

export class EnclosedSymbolTable extends SymbolTable {
    constructor(parentTable: SymbolTable) {
        super();
        this.parentTable = parentTable;
    }

    define(name: string): SSymbol {
        const symbol = new SSymbol(name, LocalScope, this.numDefinitions);
        this.store[name] = symbol;
        this.numDefinitions++;
        return symbol;
    }
}
import { Obj } from "../object";

export function newEnclosedEnvironment(outer: Environment) {
    const env = new Environment();
    env.outer = outer;
    return env;
}

class Environment {
    store: Partial<Record<string, Obj>>;
    outer?: Environment;
    constructor() {
        this.store = {};
    }

    get(name: string): Obj | undefined {
        return this.store[name] ?? this.outer?.get(name);
    }

    set(name: string, val: Obj) {
        return this.store[name] = val;
    }
}

export default Environment;

import { Obj } from "./object";

class Environment {
    store: Partial<Record<string, Obj>>;
    constructor() {
        this.store = {};
    }

    get(name: string) {
        return this.store[name];
    }

    set(name: string, val: Obj) {
        return this.store[name] = val;
    }
}

export default Environment;

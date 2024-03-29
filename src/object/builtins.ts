import * as Obj from ".";

export const getBuiltinByName = (name: string): Obj.BuiltIn => {
    return Builtins[name];
}

const Builtins = {
    len: new Obj.BuiltIn((...args: Obj.Obj[]) => {
        if(args.length !== 1) {
            return new Obj.InterpretError(`wrong number of arguments. got=${args.length}, want=1`);
        }
        if(args[0] instanceof Obj.String) {
            return new Obj.Integer((args[0] as Obj.String).value.length);
        }
        if(args[0] instanceof Obj.ArrayLiteral) {
            return new Obj.Integer((args[0] as Obj.ArrayLiteral).elements.length);
        }
        return new Obj.InterpretError(`argument to \`len\` not supported, got ${args[0].type()}`);
    }),
    first: new Obj.BuiltIn((...args: Obj.Obj[]) => {
        if(args.length !== 1) {
            return new Obj.InterpretError(`wrong number of arguments. got=${args.length}, want=1`);
        }
        if(args[0] instanceof Obj.ArrayLiteral) {
            return (args[0] as Obj.ArrayLiteral).elements[0];
        }
        return new Obj.InterpretError(`argument to \`first\` must be ARRAY, got ${args[0].type()}`);
    }),
    last: new Obj.BuiltIn((...args: Obj.Obj[]) => {
        if(args.length !== 1) {
            return new Obj.InterpretError(`wrong number of arguments. got=${args.length}, want=1`);
        } 
        if(args[0] instanceof Obj.ArrayLiteral) {
            const arrayLit = (args[0] as Obj.ArrayLiteral)
            return arrayLit.elements[arrayLit.elements.length - 1];
        }
        return new Obj.InterpretError(`argument to \`last\` must be ARRAY, got ${args[0].type()}`)
    }),
    rest: new Obj.BuiltIn((...args: Obj.Obj[]) => {
        if(args.length !== 1) {
            return new Obj.InterpretError(`wrong number of arguments. got=${args.length}, want=1`);
        }
        if(args[0] instanceof Obj.ArrayLiteral) {
            return (args[0] as Obj.ArrayLiteral).elements.length > 0
                ? new Obj.ArrayLiteral((args[0] as Obj.ArrayLiteral).elements.slice(1))
                : undefined
        }
        return new Obj.InterpretError(`argument to \`last\` must be ARRAY, got ${args[0].type()}`)
    }),
    push: new Obj.BuiltIn((...args: Obj.Obj[]) => {
        if(args.length !== 2) {
            return new Obj.InterpretError(`wrong number of arguments. got=${args.length}, want=1`);
        }
        if(args[0] instanceof Obj.ArrayLiteral) {
            return new Obj.ArrayLiteral([...(args[0] as Obj.ArrayLiteral).elements, args[1]]);
        }
        return new Obj.InterpretError(`argument to \`push\` must be ARRAY, got ${args[0].type()}`)
    }),
    puts: new Obj.BuiltIn((...args: Obj.Obj[]) => {
        args.forEach((arg) => console.log(arg.inspect()));
        return undefined;
    })
} as Record<string, Obj.BuiltIn>

export default Builtins;
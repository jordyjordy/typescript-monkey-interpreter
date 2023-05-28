import { NULL } from "./evaluator";
import { BuiltIn, Integer, Obj, InterpretError, String, ArrayLiteral } from "./object";

export default {
    len: new BuiltIn((...args: Obj[]) => {
        if(args.length !== 1) {
            return new InterpretError(`wrong number of arguments. got=${args.length}, want=1`);
        }
        if(args[0] instanceof String) {
            return new Integer((args[0] as String).value.length);
        }
        if(args[0] instanceof ArrayLiteral) {
            return new Integer((args[0] as ArrayLiteral).elements.length);
        }
        return new InterpretError(`argument to \`len\` not supported, got ${args[0].type()}`);
    }),
    first: new BuiltIn((...args: Obj[]) => {
        if(args.length !== 1) {
            return new InterpretError(`wrong number of arguments. got=${args.length}, want=1`);
        }
        if(args[0] instanceof ArrayLiteral) {
            return (args[0] as ArrayLiteral).elements[0] ?? NULL;
        }
        return new InterpretError(`argument to \`first\` must be ARRAY, got ${args[0].type()}`);
    }),
    last: new BuiltIn((...args: Obj[]) => {
        if(args.length !== 1) {
            return new InterpretError(`wrong number of arguments. got=${args.length}, want=1`);
        } 
        if(args[0] instanceof ArrayLiteral) {
            return (args[0] as ArrayLiteral).elements[0] ?? NULL;
        }
        return new InterpretError(`argument to \`last\` must be ARRAY, got ${args[0].type()}`)
    }),
    rest: new BuiltIn((...args: Obj[]) => {
        if(args.length !== 1) {
            return new InterpretError(`wrong number of arguments. got=${args.length}, want=1`);
        }
        if(args[0] instanceof ArrayLiteral) {
            return (args[0] as ArrayLiteral).elements.length > 0
                ? new ArrayLiteral((args[0] as ArrayLiteral).elements.slice(1))
                : NULL
        }
        return new InterpretError(`argument to \`last\` must be ARRAY, got ${args[0].type()}`)
    }),
    push: new BuiltIn((...args: Obj[]) => {
        if(args.length !== 2) {
            return new InterpretError(`wrong number of arguments. got=${args.length}, want=1`);
        }
        if(args[0] instanceof ArrayLiteral) {
            return new ArrayLiteral([...(args[0] as ArrayLiteral).elements, args[1]]);
        }
        return new InterpretError(`argument to \`last\` must be ARRAY, got ${args[0].type()}`)
    }),
    puts: new BuiltIn((...args: Obj[]) => {
        args.forEach((arg) => console.log(arg.inspect()));
        return NULL;
    })
} as Record<string, BuiltIn>
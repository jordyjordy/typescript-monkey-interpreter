import { NULL } from "./evaluator";
import { BuiltIn, Integer, Obj, InterpretError, String } from "./object";

export default {
    len: new BuiltIn((...args: Obj[]) => {
        if(args.length !== 1) {
            return new InterpretError(`wrong number of arguments. got=${args.length}, want=1`);
        }
        if(args[0] instanceof String) {
            return new Integer((args[0] as String).value.length);
        }
        return new InterpretError(`argument to \`len\` not supported, got ${args[0].type()}`);
    })
} as Record<string, BuiltIn>
import { BlockStatement, Boolean, CallExpression, Expression, ExpressionStatement, FunctionLiteral, Identifier, IfExpression, InfixExpression, IntegerLiteral, LetStatement, Node, PrefixExpression, Program, ReturnStatement, Statement, StringLiteral, ArrayLiteral as AstArrayLiteral, IndexExpression, HashLiteral } from "./ast";
import builtins from "./builtins";
import Environment, { newEnclosedEnvironment } from "./environment";
import { ARRAY_OBJ, ArrayLiteral, Bool, BuiltIn, ERROR_OBJ, Function, HASH_OBJ, Hash, HashKey, HashPair, Hashable, IHashable, INTEGER_OBJ, Integer, InterpretError, Null, Obj, RETURN_VALUE_OBJ, ReturnValue, STRING_OBJ, String } from "./object";

export const TRUE = new Bool(true);
export const FALSE = new Bool(false);
export const NULL = new Null();

export function Eval(node: Node, env: Environment): Obj | undefined {
    switch(node.constructor) {
        case IntegerLiteral:
            return new Integer((node as IntegerLiteral).value as number);
        case Boolean:
            return nativeBoolToBooleanObject((node as Boolean).value);
        case ExpressionStatement:
            return Eval((node as ExpressionStatement).expression as Node, env);
        case Program:
            return evalProgram((node as Program), env);
        case PrefixExpression: {
            const right = Eval((node as PrefixExpression).right!, env);
            if(isError(right)) {
                return right;
            }
            return evalPrefixExpression((node as PrefixExpression).operator, right);
        }
        case InfixExpression: {
            const infix = node as InfixExpression;
            const left = Eval(infix.left, env);
            if(isError(left)) {
                return left;
            }
            const right = Eval(infix.right!, env);
            if(isError(right)) {
                return right;
            }
            return evalInfixExpression(infix.operator, left as Obj, right as Obj);
        }
        case BlockStatement: {
            return evalBlockStatement((node as BlockStatement), env);
        }
        case IfExpression: {
            return evalIfExpression(node as IfExpression, env);
        }
        case ReturnStatement: {
            const value = Eval((node as ReturnStatement).returnValue!, env);
            if(isError(value)) {
                return value;
            }
            return new ReturnValue(value!);
        }
        case LetStatement: {
            const letNode = (node as LetStatement)
            const value = Eval(letNode.value!, env);
            if(isError(value)) {
                return value;
            }
            env.set(letNode.name?.value!, value!);
            return undefined;
        }
        case Identifier: {
            return evalIdentifier(node as Identifier, env)
        }
        case FunctionLiteral: {
            const func = node as FunctionLiteral;
            const params = func.parameters;
            const body = func.body;
            return new Function(params!, body!, env);
        }
        case CallExpression: {
            const func = Eval((node as CallExpression).func!, env);
            if(isError(func)) {
                return func;
            }
            const args = evalExpressions((node as CallExpression).functionArguments!, env);
            if(args.length === 1 && (isError(args[0]) || args[0] === undefined)) {
                return args[0];
            }
            return applyFunction(func!, args as Obj[]);
        }
        case StringLiteral: {
            const str = node  as StringLiteral;
            return new String(str.value);
        }
        case AstArrayLiteral: {
            const arr = node as AstArrayLiteral;
            const values = evalExpressions(arr.elements, env);
            if(values.length === 1 && (isError(values[0]) || values[0] === undefined)) {
                return values[0];
            }
            return new ArrayLiteral(values as Obj[]);
        }
        case IndexExpression: {
            const index = node as IndexExpression;
            const left = Eval(index.left, env);

            const indexObj = Eval(index.index as Expression, env);
            if(!left || !indexObj) {
                return undefined;
            }
            return evalIndexExpression(left, indexObj);
        }
        case HashLiteral: {
            return evalHashLiteral(node as HashLiteral, env);
        }
        default:
            return NULL;
    }
}

function newError(message: string): InterpretError {
    return new InterpretError(message);
}

function isError(object: Obj | undefined) {
    return object
        ? object.type() === ERROR_OBJ
        : false;
}

function isTruthy(object?: Obj) {
    switch(object) {
        case NULL:
            return false;
        case FALSE:
            return false;
        case TRUE:
            return true;
        default:
            return true;
    }
}

function nativeBoolToBooleanObject(value: boolean) {
    return value ? TRUE : FALSE;
}

function evalProgram(program: Program, env: Environment): Obj | undefined {
    let result: (Obj | undefined);

    for(let i = 0; i < program.statements.length; i++) {
        const statement = program.statements[i]
        result = Eval(statement, env);
        if(result instanceof ReturnValue) {
            return (result as ReturnValue).value;
        } else if(result instanceof InterpretError) {
            return result;
        }
    }
    return result;
}

function evalBlockStatement(block: BlockStatement, env: Environment): Obj | undefined {
    let result: Obj | undefined;

    for(let i = 0; i < block.statements.length; i++) {
        const statement = block.statements[i];
        result = Eval(statement, env);
        if(result !== undefined && (result.type() == RETURN_VALUE_OBJ || result.type() == ERROR_OBJ)) {
            return result;
        } 
    }

    return result;
}

function evalPrefixExpression(operator: string, right?: Obj): Obj {
    switch(operator) {
        case '!':
            return evalBangOperatorExpression(right);
        case '-':
            return evalMinusPrefixOperatorExpression(right);
        default:
            return newError(`unknown operator: ${operator} ${right?.type() ?? '??'}`);
    }
}

function evalBangOperatorExpression(right?: Obj) {
    switch(right) {
        case TRUE:
            return FALSE;
        case FALSE:
            return TRUE;
        case NULL:
            return TRUE;
        default:
            return FALSE;
    }
}

function evalMinusPrefixOperatorExpression(right?: Obj): Obj {
    if(right?.type() !== INTEGER_OBJ) {
        return newError(`unknown operator: -${right?.type() ?? '??'}`);
    }
    const val = (right as Integer).value;
    return new Integer(-val);
}

function evalInfixExpression(operator: string, left: Obj, right: Obj) {
    switch (true) {
        case left.type() === INTEGER_OBJ && right.type() === INTEGER_OBJ:
            return  evalIntegerInfixExpression(operator, left as Integer, right as Integer);
        case left.type() === STRING_OBJ && right.type() === STRING_OBJ:
            return evalStringInfixExpression(operator, left as String, right as String);
        case operator === '==':
            return nativeBoolToBooleanObject(left == right);
        case operator === '!=':
            return nativeBoolToBooleanObject(left != right);
        case left.type() !== right.type():
            return newError(`type mismatch: ${left.type()} ${operator} ${right.type()}`);
        default:
            return newError(`unknown operator: ${left.type()} ${operator} ${right.type()}`);
    }
}

function evalIntegerInfixExpression(operator: string, left: Integer, right: Integer) {
    const leftVal = left.value;
    const rightVal = right.value;
    switch( operator) {
        case '+':
            return new Integer(leftVal + rightVal);
        case '-':
            return new Integer(leftVal - rightVal);
        case '*':
            return new Integer(leftVal * rightVal);
        case '/':
            return new Integer(Math.floor(leftVal / rightVal));
        case '<':
            return nativeBoolToBooleanObject(leftVal < rightVal);
        case '>':
            return nativeBoolToBooleanObject(leftVal > rightVal);
        case '==':
            return nativeBoolToBooleanObject(leftVal === rightVal);
        case '!=':
            return nativeBoolToBooleanObject(leftVal !== rightVal);
        default:
            return newError(`unknown operator: ${left.type()} ${operator} ${right.type()}`);
    }
}

function evalIfExpression(expr: IfExpression, env: Environment) {
    const condition = Eval(expr.condition!, env);
    if(!condition || isError(condition)) {
        return condition;
    }
    if(isTruthy(condition)) {
        return Eval(expr.consequence!, env);
    } else if (expr.alternative) {
        return Eval(expr.alternative, env);
    }
    return NULL;
}

function evalIdentifier(node: Identifier, env: Environment) {
    const val = env.get(node.value);
    if(val) {
        return val;
    }
    if(builtins[node.value]) {
        return builtins[node.value];
    }
    return newError(`identifier not found: ${node.value}`)
}

function evalExpressions(exps: (Expression | undefined)[], env: Environment): undefined[] | Obj[]  {
    let res: Obj[] = [];
    for(let i = 0; i < exps.length; i++) {
        const evaluated = Eval(exps[i]!, env);
        if(!evaluated || isError(evaluated)) {
            return [evaluated] as [undefined] | [Obj];
        }
        res.push(evaluated!);
    }
    return res;
}

function evalStringInfixExpression(operator: string, left: String, right: String) {
    if(operator === '+') {
        return new String(left.value + right.value);
    }
    return newError(`unknown operator: ${left.type()} ${operator} ${right.type()}`);
}

function evalIndexExpression(left: Obj, right: Obj) {
    switch(true) {
        case left.type() === ARRAY_OBJ && right.type() === INTEGER_OBJ:
            return evalArrayIndexExpression(left as ArrayLiteral, right as Integer);
        case left.type() === HASH_OBJ:
            return evalHashIndexExpression(left as Hash, right);
        default:
            return newError(`index operator not support: ${left.type()}`);
    }
}

function evalArrayIndexExpression(left: ArrayLiteral, index: Integer): Obj {
    if(index.value >= left.elements.length || index.value < 0) {
        return NULL;
    }
    return left.elements[index.value];
}

function evalHashIndexExpression(left: Hash, right: Obj) {
    if(!(right instanceof Hashable)) {
        return newError(`unusable as hash key: ${right.type()}`);
    }
    const hashKey = right as IHashable;
    const pair = left.pairs.get(hashKey.hashKey().value);
    return pair
        ? pair.value
        : NULL;
}

function evalHashLiteral(node: HashLiteral, env: Environment) {
    const pairs = new Map<string, HashPair>();
    for(const [keyNode, valueNode] of node.pairs) {
        const key = Eval(keyNode, env);
        if(!key || isError(key)) {
            return key;
        }
        
        if(!(key instanceof Hashable)) {
            return newError(`unusable as hash key: ${key.type()}`);
        }
        const hashKey = key as IHashable;
        const value = Eval(valueNode, env);
        if(!value || isError(value)) {
            return value;
        }
        const hashed = hashKey.hashKey();
        pairs.set(hashed.value, new HashPair(key, value));
    }
    return new Hash(pairs);
}

function applyFunction(fn: Obj, args: Obj[]) {
    switch(fn.constructor) {
        case Function:
            const extendedEnv = extendFunctionEnv(fn as Function, args);
            const evaluated = Eval((fn as Function).body, extendedEnv);
            return unwrapReturnValue(evaluated!);
        case BuiltIn:
            return (fn as BuiltIn).value(...args);
    }
    if(!(fn instanceof Function)) {
        return newError(`not a function: ${fn.type()}`)
    }
    return NULL;
}

function extendFunctionEnv(fn: Function, args: Obj[]) {
    const env = newEnclosedEnvironment(fn.env);
    fn.parameters.forEach((param, index) => {
        env.set(param.value, args[index]!);
    })
    return env;
}

function unwrapReturnValue(object: Obj): Obj {
    return object instanceof ReturnValue
        ? (object as ReturnValue).value
        : object;
}
import * as Ast from "../ast";
import builtins from "../object/builtins";
import Environment, { newEnclosedEnvironment } from "./environment";
import * as Obj from "../object";

export const TRUE = new Obj.Bool(true);
export const FALSE = new Obj.Bool(false);
export const NULL = new Obj.Null();

export function Eval(node: Ast.Node, env: Environment): Obj.Obj | undefined {
    switch(node.constructor) {
        case Ast.IntegerLiteral:
            return new Obj.Integer((node as Ast.IntegerLiteral).value as number);
        case Ast.Boolean:
            return nativeBoolToBooleanObject((node as Ast.Boolean).value);
        case Ast.ExpressionStatement:
            return Eval((node as Ast.ExpressionStatement).expression as Ast.Node, env);
        case Ast.Program:
            return evalProgram((node as Ast.Program), env);
        case Ast.PrefixExpression: {
            const right = Eval((node as Ast.PrefixExpression).right!, env);
            if(isError(right)) {
                return right;
            }
            return evalPrefixExpression((node as Ast.PrefixExpression).operator, right);
        }
        case Ast.InfixExpression: {
            const infix = node as Ast.InfixExpression;
            const left = Eval(infix.left, env);
            if(isError(left)) {
                return left;
            }
            const right = Eval(infix.right!, env);
            if(isError(right)) {
                return right;
            }
            return evalInfixExpression(infix.operator, left as Obj.Obj, right as Obj.Obj);
        }
        case Ast.BlockStatement: {
            return evalBlockStatement((node as Ast.BlockStatement), env);
        }
        case Ast.IfExpression: {
            return evalIfExpression(node as Ast.IfExpression, env);
        }
        case Ast.ReturnStatement: {
            const value = Eval((node as Ast.ReturnStatement).returnValue!, env);
            if(isError(value)) {
                return value;
            }
            return new Obj.ReturnValue(value!);
        }
        case Ast.LetStatement: {
            const letNode = (node as Ast.LetStatement)
            const value = Eval(letNode.value!, env);
            if(isError(value)) {
                return value;
            }
            env.set(letNode.name?.value!, value!);
            return undefined;
        }
        case Ast.Identifier: {
            return evalIdentifier(node as Ast.Identifier, env)
        }
        case Ast.FunctionLiteral: {
            const func = node as Ast.FunctionLiteral;
            const params = func.parameters;
            const body = func.body;
            return new Obj.Function(params!, body!, env);
        }
        case Ast.CallExpression: {
            const func = Eval((node as Ast.CallExpression).func!, env);
            if(isError(func)) {
                return func;
            }
            const args = evalExpressions((node as Ast.CallExpression).functionArguments!, env);
            if(args.length === 1 && (isError(args[0]) || args[0] === undefined)) {
                return args[0];
            }
            return applyFunction(func!, args as Obj.Obj[]);
        }
        case Ast.StringLiteral: {
            const str = node  as Ast.StringLiteral;
            return new Obj.String(str.value);
        }
        case Ast.ArrayLiteral: {
            const arr = node as Ast.ArrayLiteral;
            const values = evalExpressions(arr.elements, env);
            if(values.length === 1 && (isError(values[0]) || values[0] === undefined)) {
                return values[0];
            }
            return new Obj.ArrayLiteral(values as Obj.Obj[]);
        }
        case Ast.IndexExpression: {
            const index = node as Ast.IndexExpression;
            const left = Eval(index.left, env);

            const indexObj = Eval(index.index as Ast.Expression, env);
            if(!left || !indexObj) {
                return undefined;
            }
            return evalIndexExpression(left, indexObj);
        }
        case Ast.HashLiteral: {
            return evalHashLiteral(node as Ast.HashLiteral, env);
        }
        default:
            return NULL;
    }
}

function newError(message: string): Obj.InterpretError {
    return new Obj.InterpretError(message);
}

function isError(object: Obj.Obj | undefined) {
    return object
        ? object.type() === Obj.ERROR_OBJ
        : false;
}

function isTruthy(object?: Obj.Obj) {
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

function evalProgram(program: Ast.Program, env: Environment): Obj.Obj | undefined {
    let result: (Obj.Obj | undefined);

    for(let i = 0; i < program.statements.length; i++) {
        const statement = program.statements[i]
        result = Eval(statement, env);
        if(result instanceof Obj.ReturnValue) {
            return (result as Obj.ReturnValue).value;
        } else if(result instanceof Obj.InterpretError) {
            return result;
        }
    }
    return result;
}

function evalBlockStatement(block: Ast.BlockStatement, env: Environment): Obj.Obj | undefined {
    let result: Obj.Obj | undefined;

    for(let i = 0; i < block.statements.length; i++) {
        const statement = block.statements[i];
        result = Eval(statement, env);
        if(result !== undefined && (result.type() == Obj.RETURN_VALUE_OBJ || result.type() == Obj.ERROR_OBJ)) {
            return result;
        } 
    }

    return result;
}

function evalPrefixExpression(operator: string, right?: Obj.Obj): Obj.Obj {
    switch(operator) {
        case '!':
            return evalBangOperatorExpression(right);
        case '-':
            return evalMinusPrefixOperatorExpression(right);
        default:
            return newError(`unknown operator: ${operator} ${right?.type() ?? '??'}`);
    }
}

function evalBangOperatorExpression(right?: Obj.Obj) {
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

function evalMinusPrefixOperatorExpression(right?: Obj.Obj): Obj.Obj {
    if(right?.type() !== Obj.INTEGER_OBJ) {
        return newError(`unknown operator: -${right?.type() ?? '??'}`);
    }
    const val = (right as Obj.Integer).value;
    return new Obj.Integer(-val);
}

function evalInfixExpression(operator: string, left: Obj.Obj, right: Obj.Obj) {
    switch (true) {
        case left.type() === Obj.INTEGER_OBJ && right.type() === Obj.INTEGER_OBJ:
            return  evalIntegerInfixExpression(operator, left as Obj.Integer, right as Obj.Integer);
        case left.type() === Obj.STRING_OBJ && right.type() === Obj.STRING_OBJ:
            return evalStringInfixExpression(operator, left as Obj.String, right as Obj.String);
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

function evalIntegerInfixExpression(operator: string, left: Obj.Integer, right: Obj.Integer) {
    const leftVal = left.value;
    const rightVal = right.value;
    switch( operator) {
        case '+':
            return new Obj.Integer(leftVal + rightVal);
        case '-':
            return new Obj.Integer(leftVal - rightVal);
        case '*':
            return new Obj.Integer(leftVal * rightVal);
        case '/':
            return new Obj.Integer(Math.floor(leftVal / rightVal));
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

function evalIfExpression(expr: Ast.IfExpression, env: Environment) {
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

function evalIdentifier(node: Ast.Identifier, env: Environment) {
    const val = env.get(node.value);
    if(val) {
        return val;
    }
    if(builtins[node.value]) {
        return builtins[node.value];
    }
    return newError(`identifier not found: ${node.value}`)
}

function evalExpressions(exps: (Ast.Expression | undefined)[], env: Environment): undefined[] | Obj.Obj[]  {
    let res: Obj.Obj[] = [];
    for(let i = 0; i < exps.length; i++) {
        const evaluated = Eval(exps[i]!, env);
        if(!evaluated || isError(evaluated)) {
            return [evaluated] as [undefined] | [Obj.Obj];
        }
        res.push(evaluated!);
    }
    return res;
}

function evalStringInfixExpression(operator: string, left: Obj.String, right: Obj.String) {
    if(operator === '+') {
        return new Obj.String(left.value + right.value);
    }
    if(operator === '==') {
        return new Obj.Bool(left.value === right.value);
    }
    if(operator === '!=') {
        return new Obj.Bool(left.value !== right.value);
    }
    return newError(`unknown operator: ${left.type()} ${operator} ${right.type()}`);
}

function evalIndexExpression(left: Obj.Obj, right: Obj.Obj) {
    switch(true) {
        case left.type() === Obj.ARRAY_OBJ && right.type() === Obj.INTEGER_OBJ:
            return evalArrayIndexExpression(left as Obj.ArrayLiteral, right as Obj.Integer);
        case left.type() === Obj.HASH_OBJ:
            return evalHashIndexExpression(left as Obj.Hash, right);
        default:
            return newError(`index operator not support: ${left.type()}`);
    }
}

function evalArrayIndexExpression(left: Obj.ArrayLiteral, index: Obj.Integer): Obj.Obj {
    if(index.value >= left.elements.length || index.value < 0) {
        return NULL;
    }
    return left.elements[index.value];
}

function evalHashIndexExpression(left: Obj.Hash, right: Obj.Obj) {
    if(!(right instanceof Obj.Hashable)) {
        return newError(`unusable as hash key: ${right.type()}`);
    }
    const hashKey = right as Obj.IHashable;
    const pair = left.pairs.get(hashKey.hashKey().value);
    return pair
        ? pair.value
        : NULL;
}

function evalHashLiteral(node: Ast.HashLiteral, env: Environment) {
    const pairs = new Map<string, Obj.HashPair>();
    for(const [keyNode, valueNode] of node.pairs) {
        const key = Eval(keyNode, env);
        if(!key || isError(key)) {
            return key;
        }
        
        if(!(key instanceof Obj.Hashable)) {
            return newError(`unusable as hash key: ${key.type()}`);
        }
        const hashKey = key as Obj.IHashable;
        const value = Eval(valueNode, env);
        if(!value || isError(value)) {
            return value;
        }
        const hashed = hashKey.hashKey();
        pairs.set(hashed.value, new Obj.HashPair(key, value));
    }
    return new Obj.Hash(pairs);
}

function applyFunction(fn: Obj.Obj, args: Obj.Obj[]) {
    switch(fn.constructor) {
        case Obj.Function:
            const extendedEnv = extendFunctionEnv(fn as Obj.Function, args);
            const evaluated = Eval((fn as Obj.Function).body, extendedEnv);
            return unwrapReturnValue(evaluated!);
        case Obj.BuiltIn:
            return (fn as Obj.BuiltIn).value(...args);
    }
    if(!(fn instanceof Obj.Function)) {
        return newError(`not a function: ${fn.type()}`)
    }
    return NULL;
}

function extendFunctionEnv(fn: Obj.Function, args: Obj.Obj[]) {
    const env = newEnclosedEnvironment(fn.env);
    fn.parameters.forEach((param, index) => {
        env.set(param.value, args[index]!);
    })
    return env;
}

function unwrapReturnValue(object: Obj.Obj): Obj.Obj {
    return object instanceof Obj.ReturnValue
        ? (object as Obj.ReturnValue).value
        : object;
}
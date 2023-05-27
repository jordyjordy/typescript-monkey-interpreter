import { BlockStatement, Boolean, ExpressionStatement, Identifier, IfExpression, InfixExpression, IntegerLiteral, LetStatement, Node, PrefixExpression, Program, ReturnStatement, Statement } from "./ast";
import Environment from "./environment";
import { Bool, ERROR_OBJ, INTEGER_OBJ, Integer, InterpretError, Null, Obj, RETURN_VALUE_OBJ, ReturnValue } from "./object";

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
            break;
        }
        case Identifier: {
            return evalIdentifier(node as Identifier, env)
        }
        default:
            return undefined;
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
    let result: Obj | undefined;

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
    if(isError(condition)) {
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
    if(val === undefined) {
        return newError(`identifier not found: ${node.value}`);
    }
    return val;
}
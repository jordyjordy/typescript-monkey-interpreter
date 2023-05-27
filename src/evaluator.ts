import { BlockStatement, Boolean, ExpressionStatement, IfExpression, InfixExpression, IntegerLiteral, Node, PrefixExpression, Program, ReturnStatement, Statement } from "./ast";
import { Bool, INTEGER_OBJ, Integer, Null, Obj, RETURN_VALUE_OBJ, ReturnValue } from "./object";

export const TRUE = new Bool(true);
export const FALSE = new Bool(false);
export const NULL = new Null();

export function Eval(node: Node): Obj | undefined {
    switch(node.constructor) {
        case IntegerLiteral:
            return new Integer((node as IntegerLiteral).value as number);
        case Boolean:
            return nativeBoolToBooleanObject((node as Boolean).value);
        case ExpressionStatement:
            return Eval((node as ExpressionStatement).expression as Node);
        case Program:
            return evalProgram((node as Program));
        case PrefixExpression: {
            const right = Eval((node as PrefixExpression).right!);
            return evalPrefixExpression((node as PrefixExpression).operator, right);
        }
        case InfixExpression: {
            const infix = node as InfixExpression;
            const left = Eval(infix.left);
            const right = Eval(infix.right!);
            return evalInfixExpression(infix.operator, left as Obj, right as Obj);
        }
        case BlockStatement: {
            return evalBlockStatement((node as BlockStatement));
        }
        case IfExpression: {
            return evalIfExpression(node as IfExpression);
        }
        case ReturnStatement: {
            const value = Eval((node as ReturnStatement).returnValue!);
            return new ReturnValue(value!);
        }
        default:
            return undefined;
    }
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

function EvalStatements(statements: Statement[]): Obj | undefined {
    let result: Obj | undefined;

    for(let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        result = Eval(statement);
        if(result instanceof ReturnValue) {
            return (result as ReturnValue).value;
        }
    }
    return result;
}

function evalProgram(program: Program): Obj | undefined {
    let result: Obj | undefined;

    for(let i = 0; i < program.statements.length; i++) {
        const statement = program.statements[i]
        result = Eval(statement);
        if(result instanceof ReturnValue) {
            return (result as ReturnValue).value;
        }
    }
    return result;
}

function evalBlockStatement(block: BlockStatement): Obj | undefined {
    let result: Obj | undefined;

    for(let i = 0; i < block.statements.length; i++) {
        const statement = block.statements[i];
        result = Eval(statement);
        if(result !== undefined && result.type() == RETURN_VALUE_OBJ) {
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
            return NULL;
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
        return NULL;
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
        default:
            return NULL;
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
            return NULL;
    }
}

function evalIfExpression(expr: IfExpression) {
    const condition = Eval(expr.condition!);
    if(isTruthy(condition)) {
        return Eval(expr.consequence!);
    } else if (expr.alternative) {
        return Eval(expr.alternative);
    }
    return NULL;
}
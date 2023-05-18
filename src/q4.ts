import { map, reduce, slice } from 'ramda';
import { Exp, PrimOp, VarDecl, isBinding, isBoolExp, isStrExp, isVarRef, Program, Binding, isExp, isPrimOp, isNumExp, isAtomicExp, isCompoundExp, isAppExp, makeAppExp, AppExp, CExp, NumExp, isProgram, makeProgram, isCExp, isDefineExp, makeDefineExp, isLitExp, isIfExp, makeIfExp, isProcExp, makeProcExp, isLetExp, DefineExp} from '../imp/L3-ast';
import { SExpValue, Value } from '../imp/L3-value';
import { Result, makeFailure, makeOk } from '../shared/result';
// import { isAtomicExp } from './L31-ast';

/*
Purpose: Transform L2 AST to Python program string
Signature: l2ToPython(l2AST)
Type: [Parsed | Error] => Result<string>
*/
export const l2ToPython = (exp: Exp | Program): Result<string>  => 
    makeOk(`${rewriteAll(exp)}`);

export const rewriteAll = (exp: Program | Exp): string =>
    isExp(exp) ? rewriteExp(exp) :
    isProgram(exp) ? reduce((x,y) => x + "\n" + y, rewriteExp(exp.exps[0]),(map(rewriteExp, exp.exps.slice(1)))) :
    "Failed to rewrite";

const rewriteExp = (exp: Exp): string =>
    isCExp(exp) ? rewriteCExp(exp) :
    isDefineExp(exp) ? rewriteDefineExp(`${exp.var.var}`, rewriteCExp(exp.val)) :
    exp;

const rewriteCExp = (exp: CExp): string =>
    isAtomicExp(exp) ? rewriteAtomicExp(exp) :
    isIfExp(exp) ? rewriteIfExp(rewriteCExp(exp.test),
                             rewriteCExp(exp.then),
                             rewriteCExp(exp.alt)) :
    isProcExp(exp) ? rewriteProcExp(map((x) => `${x.var}`, exp.args), rewriteCExp(exp.body[0])) :
    isAppExp(exp) ? (
                    isPrimOp(exp.rator) ? 
                                        (["+", "-", "/", "*","=","eq?","<", ">","and", "or"].includes(exp.rator.op) ? `(${rewriteCExp(exp.rands[0])}${rewritePrimOpExp(exp.rator.op + "",map(rewriteCExp , exp.rands.slice(1)))}` :
                                        ["not"].includes(exp.rator.op) ? `(${rewritePrimOpExp("not", map(rewriteCExp , exp.rands))}` : 
                                        ["number?"].includes(exp.rator.op) ? `(${rewritePrimOpExp("number?", map(rewriteCExp , exp.rands))}` : 
                                        ["boolean?"].includes(exp.rator.op) ? `(${rewritePrimOpExp("boolean?", map(rewriteCExp , exp.rands))}` : 
                                        "couldn't recognize primOp"
                                        )  : 
                    handleAppExpNonPrimOp(exp.rator,exp.rands)
                    ) :
    exp + "";


const handleAppExpNonPrimOp = (rator: CExp, rands: CExp[]): string => {
    return isVarRef(rator) ? `${rator.var}(${rewriteCExp(rands[0])}${reduce((x,y) => x + "," + rewriteCExp(y), "", rands.slice(1))})` :
            isProcExp(rator) ? `${rewriteCExp(rator)}(${rewriteCExp(rands[0])}${reduce((x,y) => x + "," + rewriteCExp(y), "", rands.slice(1))})` :
            // ANYMORE????????
            `unrecognized CExp: ${rator.tag}`;
}

const rewriteDefineExp = (variable: string, value: string): string => {
    return `${variable} = ${value}`;
}

const rewriteAtomicExp = (cexp: CExp): string => {
    return isBoolExp(cexp) ? (cexp.val ? "True" : "False") :
            isNumExp(cexp) ? `${cexp.val}` :
            isVarRef(cexp) ? cexp.var :
            isStrExp(cexp) ? cexp.val :
            `unrecognized CExp: ${cexp}`;
}

const rewriteIfExp = (test: string, then: string, alt: string): string => {
    return `(${then} if ${test} else ${alt})`;
}

const rewriteProcExp = (args: string[], body: string): string => {
    return `(lambda ${reduce((x,y) => `${x},${y}`, args[0], args.slice(1))} : ${body})`;
}

const rewritePrimOpExp = (op: string, values: string[]): string => {
    return  ["+", "-", "/", "*"].includes(op) ? reduce((x,y) => x + " " + op + " " + y, "", values) + ")" :
            ["=","eq?"].includes(op) ? ` == ${values[0]})` :
            ["<", ">"].includes(op) ? ` ${op} ${values[0]})` :
            ["and", "or"].includes(op) ? reduce((x,y) => x + op + y, "", values) :
            ["not"].includes(op) ?  `${op} ${values[0]})` :
            ["number?"].includes(op) ? `lambda x : type(x) == int or type (x) == float)(${values[0]})` :
            ["boolean?"].includes(op) ? `lambda x : type(x) == bool)(${values[0]})` :
            `unrecognized prim op: ${op}`;
}

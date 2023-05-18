import {  AppExp, CExp, Exp, CondExp, IfExp, Program, isAppExp, isAtomicExp, isCExp, isCondExp, isDefineExp, isExp, isIfExp, isLitExp, isProcExp, isProgram, makeAppExp, makeDefineExp, makeIfExp, makeProcExp, makeProgram, CondClause } from "./L31-ast";
import { Result, makeFailure, makeOk } from "../shared/result";
import { map } from "ramda";


/*
Purpose: Transform L31 AST to L3 AST
Signature: l31ToL3(l31AST)
Type: [Exp | Program] => Result<Exp | Program>
*/
export const L31ToL3 = (exp: Exp | Program): Result<Exp | Program> =>
    makeOk(rewriteAllCond(exp));

/*
Purpose: rewrite a single CondExp as a lambda-application form
Signature: rewriteCond(cexp)
Type: [CondExp => AppExp]
*/
const rewriteCond = (e: CondExp): CExp => {
    return recursiveCondClauses(e.condclauses);
}

const recursiveCondClauses = (condClauses: CondClause[]): CExp => {
    if (condClauses.length == 1){
        return condClauses[0].then[0];
    }
    return makeIfExp(condClauses[0].test, condClauses[0].then[0], recursiveCondClauses(condClauses.slice(1)));
}

/*
Purpose: rewrite all occurrences of Cond in an expression to lambda-applications.
Signature: rewriteAllCond(exp)
Type: [Program | Exp -> Program | Exp]
*/
export const rewriteAllCond = (exp: Program | Exp): Program | Exp =>
    isExp(exp) ? rewriteAllCondExp(exp) :
    isProgram(exp) ? makeProgram(map(rewriteAllCondExp, exp.exps)) :
    exp;

const rewriteAllCondExp = (exp: Exp): Exp =>
    isCExp(exp) ? rewriteAllCondCExp(exp) :
    isDefineExp(exp) ? makeDefineExp(exp.var, rewriteAllCondCExp(exp.val)) :
    exp;

const rewriteAllCondCExp = (exp: CExp): CExp =>
    isAtomicExp(exp) ? exp :
    isLitExp(exp) ? exp :
    isIfExp(exp) ? makeIfExp(rewriteAllCondCExp(exp.test),
                             rewriteAllCondCExp(exp.then),
                             rewriteAllCondCExp(exp.alt)) :
    isAppExp(exp) ? makeAppExp(rewriteAllCondCExp(exp.rator),
                               map(rewriteAllCondCExp, exp.rands)) :
    isProcExp(exp) ? makeProcExp(exp.args, map(rewriteAllCondCExp, exp.body)) :
    isCondExp(exp) ? rewriteAllCondCExp(rewriteCond(exp)) :
    exp;


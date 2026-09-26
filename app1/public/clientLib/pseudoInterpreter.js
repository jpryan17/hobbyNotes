import { dyadicMachine } from './dyadicMachine.js';
const KEYWORDS = new Set([
    'function',
    'var',
    'begin',
    'end',
    'return',
    'for',
    'each',
    'in',
    'to',
    'do',
    'if',
    'then',
    'else',
    'while',
    'or',
    'and',
    'not',
]);
export function tokenize(source) {
    const tokens = [];
    const lines = source.split('\n');
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const lineNum = lineIdx + 1;
        let line = lines[lineIdx];
        // Strip comments
        const commentIdx = line.indexOf('//');
        if (commentIdx >= 0) {
            line = line.substring(0, commentIdx);
        }
        let col = 0;
        while (col < line.length) {
            const ch = line[col];
            // Skip whitespace
            if (/\s/.test(ch)) {
                col++;
                continue;
            }
            // Two-character operators
            const two = line.substring(col, col + 2);
            if ([':=', '<=', '>=', '++', '..'].includes(two)) {
                tokens.push({ type: 'OPERATOR', value: two, line: lineNum });
                col += 2;
                continue;
            }
            // Single character operators & special Unicode math
            if (['≫', '⊕', '+', '-', '*', '/', '<', '>', '='].includes(ch)) {
                tokens.push({ type: 'OPERATOR', value: ch, line: lineNum });
                col++;
                continue;
            }
            // Punctuation
            if (['(', ')', '[', ']', ';', ':', ',', '.'].includes(ch)) {
                // Special case for root node literal "[]"
                if (ch === '[' && col + 1 < line.length && line[col + 1] === ']') {
                    tokens.push({ type: 'IDENT', value: '[]', line: lineNum });
                    col += 2;
                    continue;
                }
                tokens.push({ type: 'PUNCT', value: ch, line: lineNum });
                col++;
                continue;
            }
            // String literals: '...'
            if (ch === "'") {
                let strVal = '';
                col++;
                while (col < line.length && line[col] !== "'") {
                    strVal += line[col];
                    col++;
                }
                if (col < line.length && line[col] === "'")
                    col++;
                tokens.push({ type: 'STRING', value: strVal, line: lineNum });
                continue;
            }
            // Numbers
            if (/\d/.test(ch)) {
                let numVal = '';
                while (col < line.length && /[\d.]/.test(line[col])) {
                    // Guard against parsing ".." as part of a decimal number
                    if (line[col] === '.' && col + 1 < line.length && line[col + 1] === '.') {
                        break;
                    }
                    numVal += line[col];
                    col++;
                }
                tokens.push({ type: 'NUMBER', value: numVal, line: lineNum });
                continue;
            }
            // Identifiers & Keywords
            if (/[a-zA-Z_]/.test(ch)) {
                let ident = '';
                while (col < line.length && /[a-zA-Z0-9_]/.test(line[col])) {
                    ident += line[col];
                    col++;
                }
                const lower = ident.toLowerCase();
                if (KEYWORDS.has(lower)) {
                    tokens.push({ type: 'KEYWORD', value: lower, line: lineNum });
                }
                else {
                    tokens.push({ type: 'IDENT', value: ident, line: lineNum });
                }
                continue;
            }
            // Unknown character, skip
            col++;
        }
    }
    tokens.push({ type: 'EOF', value: '', line: lines.length + 1 });
    return tokens;
}
// =====================================================================
// 3. Parser
// =====================================================================
export class PseudoParser {
    tokens;
    pos = 0;
    constructor(tokens) {
        this.tokens = tokens;
    }
    peek() {
        return this.tokens[this.pos];
    }
    peekNext() {
        return this.tokens[Math.min(this.pos + 1, this.tokens.length - 1)];
    }
    advance() {
        const tok = this.tokens[this.pos];
        if (this.pos < this.tokens.length - 1)
            this.pos++;
        return tok;
    }
    check(type, val) {
        const tok = this.peek();
        if (tok.type !== type)
            return false;
        if (val !== undefined && tok.value !== val)
            return false;
        return true;
    }
    match(type, val) {
        if (this.check(type, val)) {
            this.advance();
            return true;
        }
        return false;
    }
    expect(type, val) {
        const tok = this.peek();
        if (!this.check(type, val)) {
            throw new Error(`Parser Error at line ${tok.line}: Expected ${val || type}, got "${tok.value}"`);
        }
        return this.advance();
    }
    parseProgram() {
        const functions = new Map();
        while (!this.check('EOF')) {
            if (this.check('KEYWORD', 'function')) {
                const fn = this.parseFunction();
                functions.set(fn.name, fn);
            }
            else {
                // Skip unexpected tokens until next function
                this.advance();
            }
        }
        return { functions };
    }
    parseFunction() {
        const fnTok = this.expect('KEYWORD', 'function');
        const nameTok = this.expect('IDENT');
        const name = nameTok.value;
        this.expect('PUNCT', '(');
        const params = [];
        while (!this.check('PUNCT', ')') && !this.check('EOF')) {
            const pName = this.expect('IDENT').value;
            if (this.match('PUNCT', ':')) {
                // Skip type annotation (e.g. Node, Integer, etc.)
                this.skipType();
            }
            params.push(pName);
            if (this.match('PUNCT', ';'))
                continue;
            if (this.match('PUNCT', ','))
                continue;
        }
        this.expect('PUNCT', ')');
        // Skip return type if present: ": (Set of Node, Set of Node)" or ": Node"
        if (this.match('PUNCT', ':')) {
            this.skipType();
        }
        // Optional "var" section
        const localVars = [];
        if (this.match('KEYWORD', 'var')) {
            while (!this.check('KEYWORD', 'begin') && !this.check('EOF')) {
                // Names list: "XL, XR: Set of Node;"
                const varNames = [];
                do {
                    varNames.push(this.expect('IDENT').value);
                } while (this.match('PUNCT', ','));
                if (this.match('PUNCT', ':')) {
                    this.skipType();
                }
                this.match('PUNCT', ';');
                localVars.push(...varNames);
            }
        }
        this.expect('KEYWORD', 'begin');
        const body = [];
        while (!this.check('KEYWORD', 'end') && !this.check('EOF')) {
            body.push(this.parseStatement());
        }
        this.expect('KEYWORD', 'end');
        this.match('PUNCT', ';'); // Optional trailing semicolon after function end
        return {
            name,
            params,
            localVars,
            body,
            line: fnTok.line,
        };
    }
    skipType() {
        if (this.match('PUNCT', '(')) {
            while (!this.check('PUNCT', ')') && !this.check('EOF')) {
                this.advance();
            }
            this.expect('PUNCT', ')');
        }
        else {
            while (!this.check('PUNCT', ';') &&
                !this.check('PUNCT', ',') &&
                !this.check('PUNCT', ')') &&
                !this.check('KEYWORD', 'begin') &&
                !this.check('KEYWORD', 'var') &&
                !this.check('EOF')) {
                this.advance();
            }
        }
    }
    parseStatement() {
        const tok = this.peek();
        // 1. If statement
        if (this.match('KEYWORD', 'if')) {
            const cond = this.parseExpr();
            this.expect('KEYWORD', 'then');
            let thenBranch = [];
            if (this.match('KEYWORD', 'begin')) {
                while (!this.check('KEYWORD', 'end') && !this.check('EOF')) {
                    thenBranch.push(this.parseStatement());
                }
                this.expect('KEYWORD', 'end');
                this.match('PUNCT', ';');
            }
            else {
                thenBranch.push(this.parseStatement());
            }
            let elseBranch = undefined;
            if (this.match('KEYWORD', 'else')) {
                elseBranch = [];
                if (this.match('KEYWORD', 'begin')) {
                    while (!this.check('KEYWORD', 'end') && !this.check('EOF')) {
                        elseBranch.push(this.parseStatement());
                    }
                    this.expect('KEYWORD', 'end');
                    this.match('PUNCT', ';');
                }
                else {
                    elseBranch.push(this.parseStatement());
                }
            }
            return { type: 'IF', line: tok.line, cond, thenBranch, elseBranch };
        }
        // 2. While loop
        if (this.match('KEYWORD', 'while')) {
            const cond = this.parseExpr();
            this.expect('KEYWORD', 'do');
            const body = [];
            if (this.match('KEYWORD', 'begin')) {
                while (!this.check('KEYWORD', 'end') && !this.check('EOF')) {
                    body.push(this.parseStatement());
                }
                this.expect('KEYWORD', 'end');
                this.match('PUNCT', ';');
            }
            else {
                body.push(this.parseStatement());
            }
            return { type: 'WHILE', line: tok.line, cond, body };
        }
        // 3. For loop: "for i := start to end do" or "for each item in set do"
        if (this.match('KEYWORD', 'for')) {
            if (this.match('KEYWORD', 'each')) {
                const itemVar = this.expect('IDENT').value;
                this.expect('KEYWORD', 'in');
                const setExpr = this.parseExpr();
                this.expect('KEYWORD', 'do');
                const body = [];
                if (this.match('KEYWORD', 'begin')) {
                    while (!this.check('KEYWORD', 'end') && !this.check('EOF')) {
                        body.push(this.parseStatement());
                    }
                    this.expect('KEYWORD', 'end');
                    this.match('PUNCT', ';');
                }
                else {
                    body.push(this.parseStatement());
                }
                return { type: 'FOR_EACH', line: tok.line, itemVar, setExpr, body };
            }
            else {
                const varName = this.expect('IDENT').value;
                this.expect('OPERATOR', ':=');
                const start = this.parseExpr();
                this.expect('KEYWORD', 'to');
                const end = this.parseExpr();
                this.expect('KEYWORD', 'do');
                const body = [];
                if (this.match('KEYWORD', 'begin')) {
                    while (!this.check('KEYWORD', 'end') && !this.check('EOF')) {
                        body.push(this.parseStatement());
                    }
                    this.expect('KEYWORD', 'end');
                    this.match('PUNCT', ';');
                }
                else {
                    body.push(this.parseStatement());
                }
                return { type: 'FOR', line: tok.line, varName, start, end, body };
            }
        }
        // 4. Return statement
        if (this.match('KEYWORD', 'return')) {
            const expr = this.parseExpr();
            this.match('PUNCT', ';');
            return { type: 'RETURN', line: tok.line, expr };
        }
        // 5. Tuple assignment: (XL, XR) := ...
        if (this.check('PUNCT', '(') && this.peekNext().type === 'IDENT') {
            this.advance(); // consume '('
            const targets = [];
            do {
                targets.push(this.expect('IDENT').value);
            } while (this.match('PUNCT', ','));
            this.expect('PUNCT', ')');
            this.expect('OPERATOR', ':=');
            const expr = this.parseExpr();
            this.match('PUNCT', ';');
            return { type: 'ASSIGN', line: tok.line, target: targets, expr };
        }
        // 6. Identifier-led: assignment (x := ...) or procedure call (Insert(...))
        if (this.check('IDENT')) {
            const name = this.advance().value;
            if (this.match('OPERATOR', ':=')) {
                const expr = this.parseExpr();
                this.match('PUNCT', ';');
                return { type: 'ASSIGN', line: tok.line, target: name, expr };
            }
            if (this.match('PUNCT', '(')) {
                const args = [];
                while (!this.check('PUNCT', ')') && !this.check('EOF')) {
                    args.push(this.parseExpr());
                    this.match('PUNCT', ',');
                }
                this.expect('PUNCT', ')');
                this.match('PUNCT', ';');
                return {
                    type: 'CALL_STMT',
                    line: tok.line,
                    call: { type: 'CALL', callee: name, args, line: tok.line },
                };
            }
        }
        // Fallback: advance to prevent infinite loop
        this.advance();
        this.match('PUNCT', ';');
        return {
            type: 'CALL_STMT',
            line: tok.line,
            call: { type: 'LITERAL', value: null, line: tok.line },
        };
    }
    // --- Expression Parser with Precedence ---
    parseExpr() {
        return this.parseLogicalOr();
    }
    parseLogicalOr() {
        let expr = this.parseLogicalAnd();
        while (this.match('KEYWORD', 'or')) {
            const right = this.parseLogicalAnd();
            expr = { type: 'BINARY', op: 'or', left: expr, right, line: expr.line };
        }
        return expr;
    }
    parseLogicalAnd() {
        let expr = this.parseComparison();
        while (this.match('KEYWORD', 'and')) {
            const right = this.parseComparison();
            expr = { type: 'BINARY', op: 'and', left: expr, right, line: expr.line };
        }
        return expr;
    }
    parseComparison() {
        let expr = this.parseAdditive();
        while (['<', '<=', '>', '>=', '='].includes(this.peek().value)) {
            const op = this.advance().value;
            const right = this.parseAdditive();
            expr = { type: 'BINARY', op, left: expr, right, line: expr.line };
        }
        return expr;
    }
    parseAdditive() {
        let expr = this.parseMultiplicative();
        while (['+', '-', '++', '⊕'].includes(this.peek().value)) {
            const op = this.advance().value;
            const right = this.parseMultiplicative();
            expr = { type: 'BINARY', op, left: expr, right, line: expr.line };
        }
        return expr;
    }
    parseMultiplicative() {
        let expr = this.parsePrimary();
        while (['*', '/', '≫'].includes(this.peek().value)) {
            const op = this.advance().value;
            const right = this.parsePrimary();
            expr = { type: 'BINARY', op, left: expr, right, line: expr.line };
        }
        return expr;
    }
    parsePrimary() {
        const tok = this.peek();
        // String literal
        if (this.match('STRING')) {
            return { type: 'LITERAL', value: tok.value, line: tok.line };
        }
        // Number literal
        if (this.match('NUMBER')) {
            return { type: 'LITERAL', value: Number(tok.value), line: tok.line };
        }
        // Root node literal: "[]"
        if (tok.value === '[]') {
            this.advance();
            return { type: 'LITERAL', value: dyadicMachine.root(), line: tok.line };
        }
        // Parenthesized expression or tuple: (a, b)
        if (this.match('PUNCT', '(')) {
            const first = this.parseExpr();
            if (this.match('PUNCT', ',')) {
                const elements = [first];
                do {
                    elements.push(this.parseExpr());
                } while (this.match('PUNCT', ','));
                this.expect('PUNCT', ')');
                return { type: 'TUPLE', elements, line: tok.line };
            }
            this.expect('PUNCT', ')');
            return first;
        }
        // Function call or Slicing: X[0 .. i]
        if (this.check('IDENT')) {
            const name = this.advance().value;
            // Function Call: Func(a, b)
            if (this.match('PUNCT', '(')) {
                const args = [];
                while (!this.check('PUNCT', ')') && !this.check('EOF')) {
                    args.push(this.parseExpr());
                    this.match('PUNCT', ',');
                }
                this.expect('PUNCT', ')');
                return { type: 'CALL', callee: name, args, line: tok.line };
            }
            // Slicing: X[0 .. i]
            if (this.match('PUNCT', '[')) {
                const start = this.parseExpr();
                this.expect('OPERATOR', '..');
                const end = this.parseExpr();
                this.expect('PUNCT', ']');
                return {
                    type: 'SLICE',
                    target: { type: 'IDENT', name, line: tok.line },
                    start,
                    end,
                    line: tok.line,
                };
            }
            return { type: 'IDENT', name, line: tok.line };
        }
        // Fallback
        this.advance();
        return { type: 'LITERAL', value: null, line: tok.line };
    }
}
export class ExecutionScope {
    vars = new Map();
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    get(name) {
        if (this.vars.has(name))
            return this.vars.get(name);
        if (this.parent)
            return this.parent.get(name);
        return undefined;
    }
    set(name, val) {
        if (this.vars.has(name) || !this.parent) {
            this.vars.set(name, val);
        }
        else {
            this.parent.set(name, val);
        }
    }
    define(name, val) {
        this.vars.set(name, val);
    }
    formatVariables() {
        const res = {};
        for (const [k, v] of this.vars.entries()) {
            res[k] = formatRuntimeValue(v);
        }
        return res;
    }
}
export function formatRuntimeValue(val) {
    if (val === null || val === undefined)
        return 'nil';
    if (typeof val === 'number')
        return val.toString();
    if (typeof val === 'string')
        return `"${val}"`;
    if (val instanceof Set) {
        const items = [...val].map((v) => formatRuntimeValue(v)).join(', ');
        return `{ ${items} }`;
    }
    if (Array.isArray(val)) {
        return `( ${val.map((v) => formatRuntimeValue(v)).join(', ')} )`;
    }
    if (typeof val === 'object' && 'path' in val && typeof val.format === 'function') {
        const pStr = val.path === '' ? '[]' : `[${val.path}]`;
        return `${pStr} (${val.format()})`;
    }
    return String(val);
}
/**
 * Interactive Stepper Engine for Structured Pseudocode.
 */
export class PseudoInterpreter {
    program;
    callStack = [];
    constructor(source) {
        const tokens = tokenize(source);
        const parser = new PseudoParser(tokens);
        this.program = parser.parseProgram();
    }
    /**
     * Generator producing step-by-step states for interactive execution and line highlighting.
     */
    *runStepper(entryFunctionName, args) {
        const fn = this.program.functions.get(entryFunctionName);
        if (!fn) {
            const err = `Function "${entryFunctionName}" not found in program.`;
            return {
                currentLine: 1,
                callStack: [],
                variables: {},
                isDone: true,
                error: err,
            };
        }
        const globalScope = new ExecutionScope();
        this.callStack = [];
        try {
            const result = yield* this.executeFunction(fn, args, globalScope);
            return {
                currentLine: fn.line,
                callStack: [],
                variables: {},
                isDone: true,
                result,
            };
        }
        catch (e) {
            return {
                currentLine: 1,
                callStack: this.callStack,
                variables: {},
                isDone: true,
                error: e.message || String(e),
            };
        }
    }
    *executeFunction(fn, args, parentScope) {
        const scope = new ExecutionScope(parentScope);
        const callDesc = `${fn.name}(${args.map(formatRuntimeValue).join(', ')})`;
        this.callStack.push(callDesc);
        // Bind parameters
        for (let i = 0; i < fn.params.length; i++) {
            scope.define(fn.params[i], args[i]);
        }
        // Initialize local variables
        for (const v of fn.localVars) {
            scope.define(v, null);
        }
        // Yield function entry
        yield {
            currentLine: fn.line,
            callStack: [...this.callStack],
            variables: scope.formatVariables(),
            isDone: false,
        };
        // Execute body statements
        for (const stmt of fn.body) {
            const ret = yield* this.executeStatement(stmt, scope);
            if (ret !== undefined && ret !== null && typeof ret === 'object' && '__RETURN__' in ret) {
                this.callStack.pop();
                return ret.value;
            }
        }
        this.callStack.pop();
        return null;
    }
    *executeStatement(stmt, scope) {
        // Yield current statement execution state before running it
        yield {
            currentLine: stmt.line,
            callStack: [...this.callStack],
            variables: scope.formatVariables(),
            isDone: false,
        };
        switch (stmt.type) {
            case 'ASSIGN': {
                const val = this.evalExpr(stmt.expr, scope);
                if (Array.isArray(stmt.target)) {
                    // Tuple assignment: (XL, XR) := ...
                    if (Array.isArray(val)) {
                        for (let i = 0; i < stmt.target.length; i++) {
                            scope.set(stmt.target[i], val[i]);
                        }
                    }
                }
                else {
                    scope.set(stmt.target, val);
                }
                break;
            }
            case 'RETURN': {
                const retVal = this.evalExpr(stmt.expr, scope);
                return { __RETURN__: true, value: retVal };
            }
            case 'IF': {
                const cond = this.evalExpr(stmt.cond, scope);
                if (cond) {
                    for (const s of stmt.thenBranch) {
                        const res = yield* this.executeStatement(s, scope);
                        if (res && res.__RETURN__)
                            return res;
                    }
                }
                else if (stmt.elseBranch) {
                    for (const s of stmt.elseBranch) {
                        const res = yield* this.executeStatement(s, scope);
                        if (res && res.__RETURN__)
                            return res;
                    }
                }
                break;
            }
            case 'WHILE': {
                let maxIter = 1000;
                while (this.evalExpr(stmt.cond, scope) && maxIter-- > 0) {
                    for (const s of stmt.body) {
                        const res = yield* this.executeStatement(s, scope);
                        if (res && res.__RETURN__)
                            return res;
                    }
                }
                break;
            }
            case 'FOR': {
                const startVal = Number(this.evalExpr(stmt.start, scope));
                const endVal = Number(this.evalExpr(stmt.end, scope));
                for (let i = startVal; i <= endVal; i++) {
                    scope.set(stmt.varName, i);
                    for (const s of stmt.body) {
                        const res = yield* this.executeStatement(s, scope);
                        if (res && res.__RETURN__)
                            return res;
                    }
                }
                break;
            }
            case 'FOR_EACH': {
                const setVal = this.evalExpr(stmt.setExpr, scope);
                const items = setVal instanceof Set
                    ? [...setVal]
                    : Array.isArray(setVal)
                        ? setVal
                        : [];
                for (const item of items) {
                    scope.set(stmt.itemVar, item);
                    for (const s of stmt.body) {
                        const res = yield* this.executeStatement(s, scope);
                        if (res && res.__RETURN__)
                            return res;
                    }
                }
                break;
            }
            case 'CALL_STMT': {
                this.evalExpr(stmt.call, scope);
                break;
            }
        }
        return null;
    }
    evalExpr(expr, scope) {
        switch (expr.type) {
            case 'LITERAL':
                return expr.value;
            case 'IDENT': {
                if (expr.name === '[]')
                    return dyadicMachine.root();
                return scope.get(expr.name);
            }
            case 'TUPLE':
                return expr.elements.map((e) => this.evalExpr(e, scope));
            case 'UNARY': {
                const val = this.evalExpr(expr.expr, scope);
                if (expr.op === 'not')
                    return !val;
                if (expr.op === '-') {
                    if (val && typeof val === 'object' && 'path' in val) {
                        return dyadicMachine.conwayNeg(val);
                    }
                    return -val;
                }
                return val;
            }
            case 'BINARY': {
                const left = this.evalExpr(expr.left, scope);
                const right = this.evalExpr(expr.right, scope);
                // Logical
                if (expr.op === 'or')
                    return Boolean(left || right);
                if (expr.op === 'and')
                    return Boolean(left && right);
                // Tree concatenation: candidate ++ '+'
                if (expr.op === '++') {
                    if (left && typeof left === 'object' && 'path' in left) {
                        const nextSign = typeof right === 'string' ? right : '';
                        return dyadicMachine.fromPath(left.path + nextSign);
                    }
                    return String(left) + String(right);
                }
                // Comparison (<, <=, >, >=, =)
                if (['<', '<=', '>', '>=', '='].includes(expr.op)) {
                    if (left &&
                        right &&
                        typeof left === 'object' &&
                        typeof right === 'object' &&
                        'path' in left &&
                        'path' in right) {
                        const cmp = dyadicMachine.compare(left, right);
                        if (expr.op === '<')
                            return cmp === -1;
                        if (expr.op === '<=')
                            return cmp <= 0;
                        if (expr.op === '>')
                            return cmp === 1;
                        if (expr.op === '>=')
                            return cmp >= 0;
                        if (expr.op === '=')
                            return cmp === 0;
                    }
                    if (expr.op === '<')
                        return left < right;
                    if (expr.op === '<=')
                        return left <= right;
                    if (expr.op === '>')
                        return left > right;
                    if (expr.op === '>=')
                        return left >= right;
                    if (expr.op === '=')
                        return left === right;
                }
                // Math & Dyadic Ops
                if (expr.op === '+') {
                    if (left &&
                        right &&
                        typeof left === 'object' &&
                        typeof right === 'object' &&
                        'path' in left &&
                        'path' in right) {
                        return dyadicMachine.conwayAdd(left, right);
                    }
                    return left + right;
                }
                if (expr.op === '-')
                    return left - right;
                if (expr.op === '*')
                    return left * right;
                if (expr.op === '/')
                    return left / right;
                if (expr.op === '≫')
                    return dyadicMachine.shift(left, -right);
                if (expr.op === '⊕')
                    return dyadicMachine.add(left, right);
                return null;
            }
            case 'SLICE': {
                const target = this.evalExpr(expr.target, scope);
                const start = Number(this.evalExpr(expr.start, scope));
                const end = Number(this.evalExpr(expr.end, scope));
                if (target && typeof target === 'object' && 'path' in target) {
                    // Prefix of length end: proper prefix slice(0, end)
                    const p = target.path.slice(start, end);
                    return dyadicMachine.fromPath(p);
                }
                return null;
            }
            case 'CALL': {
                const name = expr.callee;
                const evaluatedArgs = expr.args.map((a) => this.evalExpr(a, scope));
                // Built-in Primitives
                if (name === 'EmptySet')
                    return new Set();
                if (name === 'Insert') {
                    const s = evaluatedArgs[0];
                    if (s instanceof Set)
                        s.add(evaluatedArgs[1]);
                    return null;
                }
                if (name === 'Maximum') {
                    const s = evaluatedArgs[0];
                    const arr = s instanceof Set ? [...s] : [];
                    return arr.length > 0 ? dyadicMachine.max(arr) : null;
                }
                if (name === 'Minimum') {
                    const s = evaluatedArgs[0];
                    const arr = s instanceof Set ? [...s] : [];
                    return arr.length > 0 ? dyadicMachine.min(arr) : null;
                }
                if (name === 'length') {
                    const item = evaluatedArgs[0];
                    if (item && typeof item === 'object' && 'path' in item) {
                        return item.path.length;
                    }
                    return typeof item === 'string' ? item.length : 0;
                }
                if (name === 'sqr')
                    return dyadicMachine.mul(evaluatedArgs[0], evaluatedArgs[0]);
                if (name === 'val')
                    return evaluatedArgs[0];
                if (name === 'node')
                    return dyadicMachine.node(evaluatedArgs[0]);
                // Built-in fallback to dyadicMachine if not defined as AST function
                if (name === 'SimplerOptions') {
                    const res = dyadicMachine.simplerOptions(evaluatedArgs[0]);
                    return [new Set(res.leftOptions), new Set(res.rightOptions)];
                }
                if (name === 'Cut') {
                    return dyadicMachine.cut(evaluatedArgs[0], evaluatedArgs[1]);
                }
                if (name === 'ConwayAdd') {
                    return dyadicMachine.conwayAdd(evaluatedArgs[0], evaluatedArgs[1]);
                }
                // User-defined AST function call
                const userFn = this.program.functions.get(name);
                if (userFn) {
                    // Synchronous invocation using dyadicMachine implementation for recursion efficiency
                    if (name === 'ConwayAdd')
                        return dyadicMachine.conwayAdd(evaluatedArgs[0], evaluatedArgs[1]);
                    if (name === 'Cut')
                        return dyadicMachine.cut(evaluatedArgs[0], evaluatedArgs[1]);
                    if (name === 'SimplerOptions') {
                        const res = dyadicMachine.simplerOptions(evaluatedArgs[0]);
                        return [new Set(res.leftOptions), new Set(res.rightOptions)];
                    }
                }
                throw new Error(`Unknown function call: ${name}`);
            }
        }
    }
}

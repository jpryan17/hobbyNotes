"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseScaffoldDeclarations = parseScaffoldDeclarations;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function findScaffoldPath() {
    let cur = __dirname;
    while (cur && path.dirname(cur) !== cur) {
        const candidate = path.join(cur, 'MiddleWayLean', 'Scaffold.lean');
        if (fs.existsSync(candidate)) {
            return candidate;
        }
        cur = path.dirname(cur);
    }
    const fallback = path.resolve(process.cwd(), 'MiddleWayLean', 'Scaffold.lean');
    return fallback;
}
/**
 * Parses all Lean declarations from Scaffold.lean and constructs their
 * bidirectional reference graph (upstream prerequisites `uses` and downstream usages `usedBy`).
 */
function parseScaffoldDeclarations(scaffoldPath) {
    const targetPath = scaffoldPath || findScaffoldPath();
    if (!fs.existsSync(targetPath)) {
        return { declarations: {}, names: [] };
    }
    const content = fs.readFileSync(targetPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const declRegex = /^(theorem|def|axiom|structure|inductive|class|instance)\s+([a-zA-Z0-9_'.]+)/;
    const rawDecls = [];
    let currentComments = [];
    let currentDecl = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        const m = line.match(declRegex);
        if (m) {
            if (currentDecl) {
                rawDecls.push(currentDecl);
            }
            currentDecl = {
                kind: m[1],
                name: m[2],
                lineNo: i + 1,
                lines: [line],
                comments: currentComments
            };
            currentComments = [];
        }
        else if (currentDecl) {
            // If we encounter a section header comment (e.g. -- ===================), reset comments
            if (trimmed.startsWith('-- =') || trimmed.startsWith('/-') || trimmed.startsWith('#check')) {
                // Declaration finished
                rawDecls.push(currentDecl);
                currentDecl = null;
                if (trimmed.startsWith('--') || trimmed.startsWith('/-')) {
                    currentComments = [trimmed];
                }
                else {
                    currentComments = [];
                }
            }
            else {
                currentDecl.lines.push(line);
            }
        }
        else {
            if (trimmed.startsWith('--') || trimmed.startsWith('/-') || trimmed.startsWith('*')) {
                currentComments.push(trimmed);
            }
            else if (trimmed === '') {
                // Keep comments if within 2 blank lines, otherwise reset
                if (currentComments.length > 3) {
                    currentComments = [];
                }
            }
            else {
                currentComments = [];
            }
        }
    }
    if (currentDecl) {
        rawDecls.push(currentDecl);
    }
    const declNames = new Set(rawDecls.map((d) => d.name));
    const declarations = {};
    for (const d of rawDecls) {
        // Extract signature: up to `:=` or `{` or end of first line if simple
        const fullBody = d.lines.join('\n').trim();
        let signature = d.lines[0].trim();
        if (fullBody.includes(':=') && !d.lines[0].includes(':=')) {
            // Multi-line signature
            const sigLines = [];
            for (const l of d.lines) {
                sigLines.push(l.trim());
                if (l.includes(':='))
                    break;
            }
            signature = sigLines.join(' ').replace(/\s*:=.*$/, '');
        }
        else if (d.lines[0].includes(':=')) {
            signature = d.lines[0].replace(/\s*:=.*$/, '').trim();
        }
        // Clean docComment
        let docComment = undefined;
        if (d.comments.length > 0) {
            docComment = d.comments
                .map((c) => c.replace(/^--\s?/, '').replace(/^\/\-\s?/, '').replace(/\-\/$/, '').trim())
                .filter((c) => c && !c.startsWith('='))
                .join(' ');
            if (!docComment)
                docComment = undefined;
        }
        declarations[d.name] = {
            name: d.name,
            kind: d.kind,
            lineNo: d.lineNo,
            signature,
            body: fullBody,
            docComment,
            uses: [],
            usedBy: []
        };
    }
    // Cross-reference dependencies
    // Sort names by length descending to match full compound names like Tree1.totalOrder before Tree1
    const sortedNames = Array.from(declNames).sort((a, b) => b.length - a.length);
    for (const [name, decl] of Object.entries(declarations)) {
        const bodyText = decl.body;
        const usesSet = new Set();
        for (const otherName of sortedNames) {
            if (otherName === name)
                continue;
            // Match exact token boundary (treating '.' as part of compound identifiers)
            const escaped = otherName.replace(/\./g, '\\.');
            const regex = new RegExp(`(^|[^a-zA-Z0-9_'\\.])${escaped}([^a-zA-Z0-9_'\\.]|$)`);
            if (regex.test(bodyText)) {
                usesSet.add(otherName);
            }
        }
        decl.uses = Array.from(usesSet);
    }
    // Compute usedBy
    for (const [name, decl] of Object.entries(declarations)) {
        for (const upstream of decl.uses) {
            if (declarations[upstream] && !declarations[upstream].usedBy.includes(name)) {
                declarations[upstream].usedBy.push(name);
            }
        }
    }
    return {
        declarations,
        names: Array.from(declNames)
    };
}

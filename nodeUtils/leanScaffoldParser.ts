import * as fs from 'fs';
import * as path from 'path';

export interface ScaffoldDeclaration {
  name: string;
  kind: 'theorem' | 'def' | 'axiom' | 'structure' | 'inductive' | 'class' | 'instance';
  lineNo: number;
  signature: string;
  body: string;
  docComment?: string;
  uses: string[];
  usedBy: string[];
}

export interface LeanScaffoldGraph {
  declarations: Record<string, ScaffoldDeclaration>;
  names: string[];
}

function findScaffoldPath(): string {
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
export function parseScaffoldDeclarations(scaffoldPath?: string): LeanScaffoldGraph {
  const targetPath = scaffoldPath || findScaffoldPath();
  if (!fs.existsSync(targetPath)) {
    return { declarations: {}, names: [] };
  }

  const content = fs.readFileSync(targetPath, 'utf8');
  const lines = content.split(/\r?\n/);

  const declRegex = /^(theorem|def|axiom|structure|inductive|class|instance)\s+([a-zA-Z0-9_'.]+)/;
  
  interface RawDecl {
    kind: ScaffoldDeclaration['kind'];
    name: string;
    lineNo: number;
    lines: string[];
    comments: string[];
  }

  const rawDecls: RawDecl[] = [];
  let currentComments: string[] = [];
  let currentDecl: RawDecl | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const m = line.match(declRegex);
    if (m) {
      if (currentDecl) {
        rawDecls.push(currentDecl);
      }
      currentDecl = {
        kind: m[1] as ScaffoldDeclaration['kind'],
        name: m[2],
        lineNo: i + 1,
        lines: [line],
        comments: currentComments
      };
      currentComments = [];
    } else if (currentDecl) {
      // If we encounter a section header comment (e.g. -- ===================), reset comments
      if (trimmed.startsWith('-- =') || trimmed.startsWith('/-') || trimmed.startsWith('#check')) {
        // Declaration finished
        rawDecls.push(currentDecl);
        currentDecl = null;
        if (trimmed.startsWith('--') || trimmed.startsWith('/-')) {
          currentComments = [trimmed];
        } else {
          currentComments = [];
        }
      } else {
        currentDecl.lines.push(line);
      }
    } else {
      if (trimmed.startsWith('--') || trimmed.startsWith('/-') || trimmed.startsWith('*')) {
        currentComments.push(trimmed);
      } else if (trimmed === '') {
        // Keep comments if within 2 blank lines, otherwise reset
        if (currentComments.length > 3) {
          currentComments = [];
        }
      } else {
        currentComments = [];
      }
    }
  }

  if (currentDecl) {
    rawDecls.push(currentDecl);
  }

  const declNames = new Set(rawDecls.map((d) => d.name));
  const declarations: Record<string, ScaffoldDeclaration> = {};

  for (const d of rawDecls) {
    // Extract signature: up to `:=` or `{` or end of first line if simple
    const fullBody = d.lines.join('\n').trim();
    let signature = d.lines[0].trim();
    if (fullBody.includes(':=') && !d.lines[0].includes(':=')) {
      // Multi-line signature
      const sigLines: string[] = [];
      for (const l of d.lines) {
        sigLines.push(l.trim());
        if (l.includes(':=')) break;
      }
      signature = sigLines.join(' ').replace(/\s*:=.*$/, '');
    } else if (d.lines[0].includes(':=')) {
      signature = d.lines[0].replace(/\s*:=.*$/, '').trim();
    }

    // Clean docComment
    let docComment: string | undefined = undefined;
    if (d.comments.length > 0) {
      docComment = d.comments
        .map((c) => c.replace(/^--\s?/, '').replace(/^\/\-\s?/, '').replace(/\-\/$/, '').trim())
        .filter((c) => c && !c.startsWith('='))
        .join(' ');
      if (!docComment) docComment = undefined;
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
    const usesSet = new Set<string>();

    for (const otherName of sortedNames) {
      if (otherName === name) continue;
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

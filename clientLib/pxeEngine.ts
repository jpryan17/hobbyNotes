// =============================================================================
// Middle Way Math Propositional Expression (PXE) Engine & Truth Table Evaluator
// Canonical shared implementation for clientLib, app1, CRUD studio, and editors
// =============================================================================

export interface TreeNode {
    nodeType: string;
    negations: number;
    tf?: boolean;
    val?: string;
    left?: TreeNode;
    right?: TreeNode;
}

export interface TruthTableRow {
    inputs: Record<string, boolean>;
    result: boolean;
}

export interface TruthTableEvaluation {
    variables: string[];
    rows: TruthTableRow[];
    isTautology: boolean;
    isContradiction: boolean;
    isContingent: boolean;
}

export interface TtdInitPacket {
    exp: string;
    fmt: string;
    variables: string[];
    status: 'taut' | 'cont' | 'unsat';
    isTautology: boolean;
}

export class PxeEngine {
    static readonly predicateChars = 'pqrs';
    static readonly negChar = 'n';
    static readonly andChar = 'a';
    static readonly orChar = 'o';
    static readonly implyChar = 'i';
    static readonly equivChar = 'e';
    static readonly connectorChars = 'ao';
    static readonly binChars = 'aoie';
    static readonly lb = '[';
    static readonly rb = ']';

    static readonly charDisplayMap: Record<string, string> = {
        'p': '𝑝',
        'q': '𝑞',
        'r': '𝑟',
        's': '𝑠',
        'm': '∈',
        'v': 'EVEN',
        'k': '=',
        'l': '≤',
        'u': '+1',
        'd': 'ODD',
        'b': '⊆',
        'w': '≈',
        'c': '∣',
        'j': '≔',
        '[': '(',
        ']': ')',
        'n': '¬',
        'a': '∧',
        'o': '∨',
        'i': '→',
        'e': '↔'
    };

    /**
     * Format raw internal expression (e.g. "n[paq]e[nponq]") to typography string.
     */
    static fmt(exp: string): string {
        if (!exp) return '';
        let displayExp = '';
        for (let i = 0; i < exp.length; i++) {
            const key = exp[i];
            const sym = this.charDisplayMap[key] || key;
            if (key === this.lb) {
                displayExp += sym + '\u2009';
            } else if (key === this.andChar || key === this.orChar) {
                displayExp += '\u2009' + sym + '\u2009';
            } else if (key === this.implyChar) {
                displayExp += '\u205f' + sym + '\u205f';
            } else if (key === this.equivChar) {
                displayExp += '\u205f\u205f' + sym + '\u205f\u205f';
            } else if (key === this.rb) {
                displayExp += '\u2009' + sym;
            } else if (key === this.negChar) {
                displayExp += sym + '\u200a';
            } else {
                displayExp += sym;
            }
        }
        return displayExp;
    }

    /**
     * Compute current grammar expectation:
     * - 'front': expects atom (p, q, r, s), opening bracket '[', or negation 'n'
     * - 'back': expects closing bracket ']' (if nl > 0) or binary operator (a, o, i, e)
     */
    static getExpectClass(exp: string): 'front' | 'back' {
        if (!exp || exp.length === 0) return 'front';
        const last = exp[exp.length - 1];
        return (this.predicateChars + this.rb).includes(last) ? 'back' : 'front';
    }

    /**
     * Compute bracket nesting level.
     */
    static getNestingLevel(exp: string): number {
        let nl = 0;
        for (const ch of exp) {
            if (ch === this.lb) nl++;
            if (ch === this.rb) nl--;
        }
        return nl;
    }

    /**
     * Check if expression is syntactically complete and valid.
     */
    static isValid(exp: string): boolean {
        if (!exp || exp.length === 0) return false;
        const expect = this.getExpectClass(exp);
        const nl = this.getNestingLevel(exp);
        return expect === 'back' && nl === 0;
    }

    /**
     * Extract unique variable names from expression in alphabetical order.
     */
    static extractVariables(exp: string): string[] {
        const found = new Set<string>();
        for (const ch of exp) {
            if (this.predicateChars.includes(ch)) {
                found.add(ch);
            }
        }
        return Array.from(found).sort();
    }

    /**
     * Try adding a character according to PXE grammar rules.
     */
    static canAddCharacter(exp: string, key: string): boolean {
        const expect = this.getExpectClass(exp);
        const nl = this.getNestingLevel(exp);

        if (expect === 'front') {
            return (this.predicateChars + this.lb + this.negChar).includes(key);
        } else {
            // expect === 'back'
            if (key === this.rb) {
                return nl > 0;
            }
            return this.binChars.includes(key);
        }
    }

    /**
     * Split expression at root operator or count top-level negations (PXE.splitOrCnt).
     */
    static splitOrCnt(exp: string): ['split' | 'cnt', number] {
        let best: [number, number] = [0, -1];
        let nl = 0;
        let negs = 0;
        for (let i = 0; i < exp.length; i++) {
            if (exp[i] === this.lb) nl++;
            if (exp[i] === this.rb) nl--;
            if (nl === 0) {
                if (exp[i] === this.negChar) negs++;
                if (this.connectorChars.includes(exp[i]) && best[0] === 0) {
                    best = [1, i];
                } else if (exp[i] === this.implyChar && best[0] < 2) {
                    best = [2, i];
                } else if (exp[i] === this.equivChar) {
                    return ['split', i];
                }
            }
        }
        if (best[0] === 0) {
            return ['cnt', negs];
        } else {
            return ['split', best[1]];
        }
    }

    /**
     * Build AST parse tree from internal expression (TTD.bldTree).
     */
    static bldTree(exp: string): TreeNode {
        const [returnType, posOrCnt] = this.splitOrCnt(exp);
        if (returnType === 'split') {
            const node: TreeNode = {
                nodeType: exp[posOrCnt],
                negations: 0,
                left: this.bldTree(exp.substring(0, posOrCnt)),
                right: this.bldTree(exp.substring(posOrCnt + 1))
            };
            return node;
        } else {
            const nn = exp.substring(posOrCnt);
            if (nn[0] === this.lb && nn[nn.length - 1] === this.rb) {
                const subNode = this.bldTree(nn.substring(1, nn.length - 1));
                subNode.negations = subNode.negations + posOrCnt;
                return subNode;
            } else {
                return {
                    nodeType: nn,
                    negations: posOrCnt
                };
            }
        }
    }

    /**
     * Recursively evaluate AST tree against boolean variable assignment.
     */
    static evalTree(node: TreeNode, env: Record<string, boolean>): boolean {
        let rawVal = false;
        if (this.binChars.includes(node.nodeType)) {
            const leftVal = node.left ? this.evalTree(node.left, env) : false;
            const rightVal = node.right ? this.evalTree(node.right, env) : false;

            if (node.nodeType === this.andChar) {
                rawVal = leftVal && rightVal;
            } else if (node.nodeType === this.orChar) {
                rawVal = leftVal || rightVal;
            } else if (node.nodeType === this.implyChar) {
                rawVal = !leftVal || rightVal;
            } else if (node.nodeType === this.equivChar) {
                rawVal = leftVal === rightVal;
            }
        } else {
            // Predicate atom
            rawVal = !!env[node.nodeType];
        }

        // Apply negations
        if (node.negations > 0) {
            const flips = node.negations % 2 !== 0;
            return flips ? !rawVal : rawVal;
        }
        return rawVal;
    }

    /**
     * Evaluate complete truth table over all 2^N variable assignments.
     */
    static evalTruthTable(exp: string): TruthTableEvaluation | null {
        if (!this.isValid(exp)) return null;
        try {
            const variables = this.extractVariables(exp);
            const tree = this.bldTree(exp);
            const totalRows = Math.pow(2, variables.length);
            const rows: TruthTableRow[] = [];

            let trueCount = 0;
            let falseCount = 0;

            for (let i = 0; i < totalRows; i++) {
                const env: Record<string, boolean> = {};
                for (let v = 0; v < variables.length; v++) {
                    const shift = variables.length - 1 - v;
                    // Standard truth table ordering (T then F)
                    const bit = (i >> shift) & 1;
                    env[variables[v]] = bit === 0;
                }

                const result = this.evalTree(tree, env);
                if (result) trueCount++; else falseCount++;
                rows.push({ inputs: env, result });
            }

            return {
                variables,
                rows,
                isTautology: trueCount === totalRows,
                isContradiction: falseCount === totalRows,
                isContingent: trueCount > 0 && falseCount > 0
            };
        } catch (err) {
            console.warn('[PxeEngine] Truth table evaluation error:', err);
            return null;
        }
    }

    /**
     * Create standard TTD initialization packet for PostgreSQL storage.
     */
    static createInitPacket(exp: string): TtdInitPacket | null {
        if (!this.isValid(exp)) return null;
        const evalRes = this.evalTruthTable(exp);
        const status = evalRes?.isTautology ? 'taut' : (evalRes?.isContradiction ? 'unsat' : 'cont');
        return {
            exp,
            fmt: this.fmt(exp),
            variables: evalRes ? evalRes.variables : this.extractVariables(exp),
            status,
            isTautology: evalRes ? evalRes.isTautology : false
        };
    }
}

/**
 * Mount the interactive Propositional Expression Builder into an HTML container.
 */
export function mountPxeBuilderComponent(
    container: HTMLElement,
    initialExp: string = '',
    onUpdate: (packet: TtdInitPacket | null, rawExp: string) => void
): { setExp: (exp: string) => void; getExp: () => string } {
    let currentExp = initialExp;

    container.innerHTML = `
        <div class="pxe-builder-card" style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 8px 0 16px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 13px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">
                        ⚖️ Propositional Expression Builder (PXE)
                    </span>
                    <span id="pxe-badge-valid" style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px; background: #fef3c7; color: #b45309;">
                        Building...
                    </span>
                    <span id="pxe-badge-tautology" style="display: none; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px; background: #ecfdf5; color: #047857;">
                        ✓ Tautology
                    </span>
                </div>
            </div>

            <!-- Live Formatted Display Screen -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; margin-bottom: 12px; text-align: center;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; letter-spacing: 0.5px;">
                    MATHEMATICAL TYPOGRAPHY (FMT)
                </div>
                <div id="pxe-display-fmt" style="font-size: 24px; font-weight: 700; color: firebrick; min-height: 36px; font-family: 'Cambria Math', 'Times New Roman', Georgia, serif; letter-spacing: 0.5px;">
                    —
                </div>
                <div style="margin-top: 6px; font-size: 11.5px; color: #64748b;">
                    Encoded Expression: <code id="pxe-code-display" style="font-family: monospace; font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">—</code>
                </div>
            </div>

            <!-- Expression Keypad Controls -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <!-- Row 1: Variables & Delimiters -->
                <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; width: 68px;">Variables:</span>
                    <button type="button" class="pxe-btn pxe-key" data-key="p" style="font-family: 'Cambria Math', serif; font-size: 16px; font-weight: 700; width: 36px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0f172a;">𝑝</button>
                    <button type="button" class="pxe-btn pxe-key" data-key="q" style="font-family: 'Cambria Math', serif; font-size: 16px; font-weight: 700; width: 36px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0f172a;">𝑞</button>
                    <button type="button" class="pxe-btn pxe-key" data-key="r" style="font-family: 'Cambria Math', serif; font-size: 16px; font-weight: 700; width: 36px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0f172a;">𝑟</button>
                    <button type="button" class="pxe-btn pxe-key" data-key="s" style="font-family: 'Cambria Math', serif; font-size: 16px; font-weight: 700; width: 36px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0f172a;">𝑠</button>
                    
                    <span style="width: 1px; height: 20px; background: #cbd5e1; margin: 0 4px;"></span>

                    <span style="font-size: 11px; font-weight: 700; color: #64748b;">Brackets:</span>
                    <button type="button" class="pxe-btn pxe-key" data-key="[" style="font-size: 14px; font-weight: 700; width: 36px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0f172a;">(</button>
                    <button type="button" class="pxe-btn pxe-key" data-key="]" style="font-size: 14px; font-weight: 700; width: 36px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0f172a;">)</button>
                    
                    <span style="width: 1px; height: 20px; background: #cbd5e1; margin: 0 4px;"></span>

                    <button type="button" class="pxe-btn" id="pxe-btn-backspace" style="font-size: 12px; font-weight: 600; padding: 0 10px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; cursor: pointer; color: #b91c1c;">⌫ Backspace</button>
                    <button type="button" class="pxe-btn" id="pxe-btn-clear" style="font-size: 12px; font-weight: 600; padding: 0 10px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; cursor: pointer; color: #64748b;">✕ Clear</button>
                </div>

                <!-- Row 2: Connectives & Operators -->
                <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; width: 68px;">Connectives:</span>
                    <button type="button" class="pxe-btn pxe-key" data-key="n" style="font-size: 14px; font-weight: 700; padding: 0 10px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0369a1;">¬ Not</button>
                    <button type="button" class="pxe-btn pxe-key" data-key="a" style="font-size: 14px; font-weight: 700; padding: 0 10px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0369a1;">∧ And</button>
                    <button type="button" class="pxe-btn pxe-key" data-key="o" style="font-size: 14px; font-weight: 700; padding: 0 10px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0369a1;">∨ Or</button>
                    <button type="button" class="pxe-btn pxe-key" data-key="i" style="font-size: 14px; font-weight: 700; padding: 0 10px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0369a1;">→ Implies</button>
                    <button type="button" class="pxe-btn pxe-key" data-key="e" style="font-size: 14px; font-weight: 700; padding: 0 10px; height: 32px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; cursor: pointer; color: #0369a1;">↔ Equiv</button>
                </div>
            </div>
        </div>
    `;

    const displayFmt = container.querySelector('#pxe-display-fmt') as HTMLElement;
    const codeDisplay = container.querySelector('#pxe-code-display') as HTMLElement;
    const badgeValid = container.querySelector('#pxe-badge-valid') as HTMLElement;
    const badgeTautology = container.querySelector('#pxe-badge-tautology') as HTMLElement;

    function updateUI() {
        const isValid = PxeEngine.isValid(currentExp);
        const nl = PxeEngine.getNestingLevel(currentExp);
        const formatted = PxeEngine.fmt(currentExp);

        displayFmt.textContent = formatted || '—';
        codeDisplay.textContent = currentExp || '—';

        // Badge updates
        if (isValid) {
            badgeValid.style.background = '#ecfdf5';
            badgeValid.style.color = '#047857';
            badgeValid.textContent = '✓ Valid Formula';
        } else {
            badgeValid.style.background = '#fef3c7';
            badgeValid.style.color = '#b45309';
            badgeValid.textContent = nl > 0 ? `Unclosed: ${nl}` : (currentExp.length > 0 ? 'Building...' : 'Empty');
        }

        // Keypad button state enable/disable
        container.querySelectorAll('.pxe-key').forEach(btn => {
            const key = btn.getAttribute('data-key');
            if (!key) return;
            const canAdd = PxeEngine.canAddCharacter(currentExp, key);
            (btn as HTMLButtonElement).disabled = !canAdd;
            if (canAdd) {
                btn.removeAttribute('style_disabled');
                (btn as HTMLElement).style.opacity = '1';
                (btn as HTMLElement).style.cursor = 'pointer';
            } else {
                (btn as HTMLElement).style.opacity = '0.35';
                (btn as HTMLElement).style.cursor = 'not-allowed';
            }
        });

        // Evaluation for status badge
        if (isValid) {
            const evalRes = PxeEngine.evalTruthTable(currentExp);
            if (evalRes) {
                badgeTautology.style.display = 'inline-block';
                if (evalRes.isTautology) {
                    badgeTautology.style.background = '#ecfdf5';
                    badgeTautology.style.color = '#047857';
                    badgeTautology.textContent = '⚖️ Tautology [taut]';
                } else if (evalRes.isContradiction) {
                    badgeTautology.style.background = '#fef2f2';
                    badgeTautology.style.color = '#dc2626';
                    badgeTautology.textContent = '⚠️ Contradiction [unsat]';
                } else {
                    badgeTautology.style.background = '#f1f5f9';
                    badgeTautology.style.color = '#475569';
                    badgeTautology.textContent = 'Contingent [cont]';
                }
            }
            const packet = PxeEngine.createInitPacket(currentExp);
            onUpdate(packet, currentExp);
        } else {
            badgeTautology.style.display = 'none';
            onUpdate(null, currentExp);
        }
    }

    // Keypad event listeners
    container.querySelectorAll('.pxe-key').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const key = btn.getAttribute('data-key');
            if (key && PxeEngine.canAddCharacter(currentExp, key)) {
                currentExp += key;
                updateUI();
            }
        });
    });

    container.querySelector('#pxe-btn-backspace')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentExp.length > 0) {
            currentExp = currentExp.substring(0, currentExp.length - 1);
            updateUI();
        }
    });

    container.querySelector('#pxe-btn-clear')?.addEventListener('click', (e) => {
        e.preventDefault();
        currentExp = '';
        updateUI();
    });

    updateUI();

    return {
        setExp: (exp: string) => {
            currentExp = exp;
            updateUI();
        },
        getExp: () => currentExp
    };
}

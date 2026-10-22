/**
 * MWM Grammar Schema & Validation State Machine
 *
 * Formalizes Middle Way Mathematics computation into a typed constructor scheme
 * populated by mwmGrammar.json, ensuring users and FSD argument slots can only
 * construct valid, type-safe expressions anchored directly to Scaffold.lean.
 */
import grammarData from './mwmGrammar.json';
export const MWM_GRAMMAR = grammarData;
/**
 * State Machine for Channeled MWM Construction
 */
export class MwmConstructorMachine {
    activeDomain = 'R_w';
    selectedConstructor = null;
    currentSlotValues = {};
    activeSlotIndex = 0;
    constructor(initialDomain = 'R_w') {
        this.setDomain(initialDomain);
    }
    setDomain(domain) {
        this.activeDomain = domain;
        // Default to first constructor available in this domain
        const available = this.getAvailableConstructors();
        if (available.length > 0) {
            this.selectConstructor(available[0].id);
        }
        else {
            this.selectedConstructor = null;
            this.currentSlotValues = {};
        }
    }
    getDomain() {
        return this.activeDomain;
    }
    getAvailableConstructors() {
        return MWM_GRAMMAR.constructors.filter(c => c.domain === this.activeDomain);
    }
    getConstructorsForOutputType(targetType) {
        return MWM_GRAMMAR.constructors.filter(c => c.outputType === targetType);
    }
    selectConstructor(constructorId) {
        const c = MWM_GRAMMAR.constructors.find(item => item.id === constructorId);
        if (!c)
            return false;
        this.selectedConstructor = c;
        this.activeDomain = c.domain;
        this.currentSlotValues = {};
        for (const slot of c.slots) {
            this.currentSlotValues[slot.name] = slot.default || '';
        }
        this.activeSlotIndex = 0;
        return true;
    }
    getSelectedConstructor() {
        return this.selectedConstructor;
    }
    getActiveSlot() {
        if (!this.selectedConstructor || !this.selectedConstructor.slots.length)
            return null;
        return this.selectedConstructor.slots[this.activeSlotIndex] || null;
    }
    setActiveSlot(index) {
        if (!this.selectedConstructor || index < 0 || index >= this.selectedConstructor.slots.length)
            return false;
        this.activeSlotIndex = index;
        return true;
    }
    setSlotValue(slotName, value) {
        if (!this.selectedConstructor)
            return false;
        const slot = this.selectedConstructor.slots.find(s => s.name === slotName);
        if (!slot)
            return false;
        // Validate if restricted to allowed tokens
        if (slot.allowedTokens && slot.allowedTokens.length > 0) {
            if (!slot.allowedTokens.includes(value.trim())) {
                return false;
            }
        }
        this.currentSlotValues[slotName] = value;
        return true;
    }
    getSlotValue(slotName) {
        return this.currentSlotValues[slotName] || '';
    }
    getAllSlotValues() {
        return { ...this.currentSlotValues };
    }
    /**
     * Evaluates if all slots of current constructor are validly populated.
     */
    isValid() {
        if (!this.selectedConstructor)
            return false;
        for (const slot of this.selectedConstructor.slots) {
            const val = this.currentSlotValues[slot.name];
            if (val === undefined || val === null || val.trim() === '') {
                return false;
            }
        }
        return true;
    }
    /**
     * Formats current expression according to constructor's displayTemplate
     */
    renderDisplay() {
        if (!this.selectedConstructor)
            return '';
        let tmpl = this.selectedConstructor.displayTemplate;
        for (const slot of this.selectedConstructor.slots) {
            const val = this.currentSlotValues[slot.name] || `[${slot.placeholder || slot.label}]`;
            tmpl = tmpl.replace(new RegExp(`\\$\\{${slot.name}\\}`, 'g'), val);
        }
        return tmpl;
    }
    /**
     * Generates exact Maxima command to send to CAS engine
     */
    renderMaximaCommand() {
        if (!this.selectedConstructor)
            return '';
        if (this.selectedConstructor.maximaCommand) {
            return this.selectedConstructor.maximaCommand;
        }
        let tmpl = this.selectedConstructor.maximaTemplate || '';
        for (const slot of this.selectedConstructor.slots) {
            const val = this.currentSlotValues[slot.name] || slot.default || '0';
            tmpl = tmpl.replace(new RegExp(`\\$\\{${slot.name}\\}`, 'g'), val);
        }
        return tmpl;
    }
    /**
     * Returns certified Lean 4 scaffold invariant theorem & snippet
     */
    getLeanInvariant() {
        if (!this.selectedConstructor)
            return { theorem: 'True', snippet: '-- No constructor selected' };
        return {
            theorem: this.selectedConstructor.leanTheorem,
            snippet: this.selectedConstructor.leanSnippet
        };
    }
    /**
     * Translates current expression into an exact Lean 4 AlgExpr AST term
     */
    renderLeanAlgExpr() {
        if (!this.selectedConstructor)
            return 'AlgExpr.constOmega';
        return renderMwmToLeanAlgExpr({
            constructorId: this.selectedConstructor.id,
            slotValues: this.currentSlotValues
        });
    }
}
/**
 * Universal AST bridge: converts an MWM UI expression node into an exact Lean 4 AlgExpr AST term.
 */
export function renderMwmToLeanAlgExpr(node) {
    const c = MWM_GRAMMAR.constructors.find(item => item.id === node.constructorId);
    const slots = node.slotValues || {};
    switch (node.constructorId) {
        case 'omega_inv':
            return 'AlgExpr.mul AlgExpr.constOmega AlgExpr.constDx';
        case 'diff_w': {
            const expr = slots['expr'] || 'x';
            return `AlgExpr.sub (AlgExpr.to_R_w ${expr}) AlgExpr.constDx`;
        }
        case 'rat': {
            const num = slots['num'] || '0';
            const den = slots['den'] || '1';
            return `AlgExpr.rat (${num}) (${den})`;
        }
        case 'dec': {
            const m = slots['mantissa'] || '0';
            const exp = slots['exp'] || '0';
            return `AlgExpr.dec (${m}) (${exp})`;
        }
        case 'sqrt': {
            const inner = slots['inner'] || '0';
            return `AlgExpr.sqrt (${inner})`;
        }
        case 'pi':
            return 'AlgExpr.piExpr';
        case 'e':
            return 'AlgExpr.eExpr';
        case 'add': {
            const a = slots['a'] || '0';
            const b = slots['b'] || '0';
            return `AlgExpr.add (${a}) (${b})`;
        }
        case 'mul': {
            const a = slots['a'] || '0';
            const b = slots['b'] || '0';
            return `AlgExpr.mul (${a}) (${b})`;
        }
        default: {
            if (c && c.leanTheorem) {
                return c.leanTheorem;
            }
            return `AlgExpr.constDyad D_zero`;
        }
    }
}

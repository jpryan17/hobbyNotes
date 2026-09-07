/**
 * MWM Grammar Schema & Validation State Machine
 * 
 * Formalizes Middle Way Mathematics computation into a typed constructor scheme
 * populated by mwmGrammar.json, ensuring users and FSD argument slots can only
 * construct valid, type-safe expressions anchored directly to Scaffold.lean.
 */

export type MwmDomainType = 'R_w' | 'C_w' | 'Matrix' | 'Real';

export interface MwmDomainDef {
  id: MwmDomainType;
  symbol: string;
  name: string;
  description: string;
}

export interface MwmSlotDef {
  name: string;
  label: string;
  type: MwmDomainType | 'variable' | 'number';
  placeholder?: string;
  allowedTokens?: string[];
  default?: string;
}

export interface MwmConstructorDef {
  id: string;
  symbol: string;
  label: string;
  domain: MwmDomainType;
  outputType: MwmDomainType;
  description: string;
  slots: MwmSlotDef[];
  displayTemplate: string;
  maximaTemplate?: string;
  maximaCommand?: string;
  maximaSimplified?: string;
  leanTheorem: string;
  leanSnippet: string;
}

export interface MwmGrammarPopulation {
  version: string;
  domains: MwmDomainDef[];
  constructors: MwmConstructorDef[];
}

import grammarData from './mwmGrammar.json';

export const MWM_GRAMMAR: MwmGrammarPopulation = grammarData as MwmGrammarPopulation;

/**
 * Expression Node for structured, channeled MWM constructor trees
 */
export interface MwmExprNode {
  constructorId: string;
  slotValues: Record<string, string>;
}

/**
 * State Machine for Channeled MWM Construction
 */
export class MwmConstructorMachine {
  private activeDomain: MwmDomainType = 'R_w';
  private selectedConstructor: MwmConstructorDef | null = null;
  private currentSlotValues: Record<string, string> = {};
  private activeSlotIndex: number = 0;

  constructor(initialDomain: MwmDomainType = 'R_w') {
    this.setDomain(initialDomain);
  }

  public setDomain(domain: MwmDomainType) {
    this.activeDomain = domain;
    // Default to first constructor available in this domain
    const available = this.getAvailableConstructors();
    if (available.length > 0) {
      this.selectConstructor(available[0].id);
    } else {
      this.selectedConstructor = null;
      this.currentSlotValues = {};
    }
  }

  public getDomain(): MwmDomainType {
    return this.activeDomain;
  }

  public getAvailableConstructors(): MwmConstructorDef[] {
    return MWM_GRAMMAR.constructors.filter(c => c.domain === this.activeDomain);
  }

  public getConstructorsForOutputType(targetType: MwmDomainType): MwmConstructorDef[] {
    return MWM_GRAMMAR.constructors.filter(c => c.outputType === targetType);
  }

  public selectConstructor(constructorId: string): boolean {
    const c = MWM_GRAMMAR.constructors.find(item => item.id === constructorId);
    if (!c) return false;
    this.selectedConstructor = c;
    this.activeDomain = c.domain;
    this.currentSlotValues = {};
    for (const slot of c.slots) {
      this.currentSlotValues[slot.name] = slot.default || '';
    }
    this.activeSlotIndex = 0;
    return true;
  }

  public getSelectedConstructor(): MwmConstructorDef | null {
    return this.selectedConstructor;
  }

  public getActiveSlot(): MwmSlotDef | null {
    if (!this.selectedConstructor || !this.selectedConstructor.slots.length) return null;
    return this.selectedConstructor.slots[this.activeSlotIndex] || null;
  }

  public setActiveSlot(index: number): boolean {
    if (!this.selectedConstructor || index < 0 || index >= this.selectedConstructor.slots.length) return false;
    this.activeSlotIndex = index;
    return true;
  }

  public setSlotValue(slotName: string, value: string): boolean {
    if (!this.selectedConstructor) return false;
    const slot = this.selectedConstructor.slots.find(s => s.name === slotName);
    if (!slot) return false;

    // Validate if restricted to allowed tokens
    if (slot.allowedTokens && slot.allowedTokens.length > 0) {
      if (!slot.allowedTokens.includes(value.trim())) {
        return false;
      }
    }

    this.currentSlotValues[slotName] = value;
    return true;
  }

  public getSlotValue(slotName: string): string {
    return this.currentSlotValues[slotName] || '';
  }

  public getAllSlotValues(): Record<string, string> {
    return { ...this.currentSlotValues };
  }

  /**
   * Evaluates if all slots of current constructor are validly populated.
   */
  public isValid(): boolean {
    if (!this.selectedConstructor) return false;
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
  public renderDisplay(): string {
    if (!this.selectedConstructor) return '';
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
  public renderMaximaCommand(): string {
    if (!this.selectedConstructor) return '';
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
  public getLeanInvariant(): { theorem: string; snippet: string } {
    if (!this.selectedConstructor) return { theorem: 'True', snippet: '-- No constructor selected' };
    return {
      theorem: this.selectedConstructor.leanTheorem,
      snippet: this.selectedConstructor.leanSnippet
    };
  }
}

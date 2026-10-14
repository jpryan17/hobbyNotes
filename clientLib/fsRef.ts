// clientLib/fsRef.ts
// FSRef: Custom Element for inline or block references to Middle Way Formal Statements & Theorems.
// Syntax: <fs-ref id="3" desc="Telescoping Fundamental Theorem of Calculus"></fs-ref>

import { FSDRef } from './fsdRef.js';

export class FSRef extends HTMLElement {
  static stdColor = '#0369a1';
  static overColor = '#0284c7';
  static stdBg = '#f0f9ff';
  static overBg = '#e0f2fe';
  static stdBorder = '#bae6fd';
  static overBorder = '#7dd3fc';

  constructor() {
    super();
  }

  connectedCallback(): void {
    const stmtId = this.getAttribute('id') || this.getAttribute('scaffold') || this.getAttribute('statement-id') || '';
    const desc = this.getAttribute('desc') || this.getAttribute('title') || '';
    const rawHtml = this.innerHTML.trim();

    if (!rawHtml) {
      const displayLabel = desc || (stmtId ? `Theorem #${stmtId}` : 'Formal Statement');
      this.innerHTML = `<span style="font-size:0.88em;opacity:0.9;margin-right:3px;">📜</span><span>${displayLabel}</span>`;
    }

    this.setAttribute(
      'style',
      `display:inline-flex;align-items:center;gap:4px;color:${FSRef.stdColor};background:${FSRef.stdBg};border:1px solid ${FSRef.stdBorder};font-weight:600;font-size:0.92em;cursor:pointer;padding:2px 8px;border-radius:6px;transition:all 0.15s ease;text-decoration:none;line-height:1.4;margin:1px 2px;`
    );

    this.addEventListener('mouseover', () => {
      this.setAttribute(
        'style',
        `display:inline-flex;align-items:center;gap:4px;color:${FSRef.overColor};background:${FSRef.overBg};border:1px solid ${FSRef.overBorder};font-weight:600;font-size:0.92em;cursor:pointer;padding:2px 8px;border-radius:6px;transition:all 0.15s ease;box-shadow:0 1px 3px rgba(3,105,161,0.12);text-decoration:none;line-height:1.4;margin:1px 2px;`
      );
    });

    this.addEventListener('mouseout', () => {
      this.setAttribute(
        'style',
        `display:inline-flex;align-items:center;gap:4px;color:${FSRef.stdColor};background:${FSRef.stdBg};border:1px solid ${FSRef.stdBorder};font-weight:600;font-size:0.92em;cursor:pointer;padding:2px 8px;border-radius:6px;transition:all 0.15s ease;text-decoration:none;line-height:1.4;margin:1px 2px;`
      );
    });

    this.addEventListener('click', (e) => {
      e.stopPropagation();
      FSDRef.openScaffoldCard(stmtId, desc, {
        disableCalculator: true
      });
    });
  }
}

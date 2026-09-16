"""
Catalog of known Maxima Common Lisp internal functions and algorithm classifications.
"""

from typing import Dict, Any

FUNCTION_CATALOG: Dict[str, Dict[str, Any]] = {
    "sinint": {
        "name": "Symbolic Integrator (Top-Level)",
        "source_file": "sin.lisp",
        "category": "Cascade Dispatcher",
        "description": "Joel Moses' classic symbolic integration heuristic dispatcher from Macsyma (1967).",
    },
    "integrator": {
        "name": "Integration Core Dispatcher",
        "source_file": "sin.lisp",
        "category": "Heuristic Dispatcher",
        "description": "Iterates through heuristic forms: derivative-divides, trigonometric substitutions, rational decomposition, or Risch.",
    },
    "diffdiv": {
        "name": "Derivative-Divides Heuristic",
        "source_file": "sin.lisp",
        "category": "Heuristic Substitution",
        "algorithm_code": "ALG-HEUR-DIFFDIV",
        "description": "Tests if integrand can be expressed as f(u(x)) * u'(x) using elementary quotient checks.",
    },
    "ratint": {
        "name": "Rational Function Integration",
        "source_file": "ratint.lisp",
        "category": "Algebraic Decision Procedure",
        "algorithm_code": "ALG-RATINT",
        "description": "Hermite reduction and partial fraction decomposition over polynomial rings Q[x].",
    },
    "trigint": {
        "name": "Trigonometric Substitution",
        "source_file": "sin.lisp",
        "category": "Algebraic Substitution",
        "algorithm_code": "ALG-TRIGINT",
        "description": "Substitutes sin/cos with fresh dummy variable (e.g., u = cos(x) or Weierstrass t = tan(x/2)) and re-enters integrator.",
    },
    "rischint": {
        "name": "Risch Algorithm Integration",
        "source_file": "risch.lisp",
        "category": "Differential Field Decision Procedure",
        "algorithm_code": "ALG-RISCH",
        "description": "Full algebraic Risch procedure on differential field extensions K(x)(theta_1, ..., theta_n). Proves elementary integrability.",
    },
    "defint": {
        "name": "Definite Integration Engine",
        "source_file": "defint.lisp",
        "category": "Complex Analysis & Contour Integration",
        "algorithm_code": "ALG-DEFINT",
        "description": "Evaluates definite integrals using residue calculus, Bromwich contours, symmetry, and table lookups.",
    },
    "limit": {
        "name": "Limit Evaluator",
        "source_file": "limit.lisp",
        "category": "Asymptotic Calculus",
        "algorithm_code": "ALG-LIMIT",
        "description": "Heuristic limit algorithm using Taylor expansions, L'Hopital's rule, and Gruntz-style asymptotic rankings.",
    },
    "gamma_incomplete": {
        "name": "Incomplete Gamma Special Function",
        "source_file": "specfn.lisp",
        "category": "Transcendental Special Function",
        "algorithm_code": "ALG-SPECIAL-GAMMA",
        "description": "Closed-form representation for non-elementary exponential/logarithmic integrals.",
    }
}

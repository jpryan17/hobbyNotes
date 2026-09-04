import sys
import json
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from MaximaMiner.core.tracer import MaximaMinerEngine

def main():
    engine = MaximaMinerEngine()

    cases = [
        ("x * exp(x^2)", "x", "Derivative-Divides Heuristic"),
        ("1 / (x^3 + 1)", "x", "Hermite Rational Decomposition"),
        ("sin(x)^3", "x", "Trigonometric Substitution"),
        ("exp(x) / x", "x", "Non-Elementary Risch Proof"),
        ("x / (x^2 + 1)", "x", "Logarithmic Integral"),
        ("1 / (x^4 + 1)", "x", "Quartic Partial Fractions"),
        ("1 / sqrt(x^2 + 1)", "x", "Radical / Hyperbolic Substitution"),
        ("cos(x)^4", "x", "Higher-Order Even Trig Reduction"),
    ]

    database = {}
    print(f"Mining {len(cases)} benchmark algorithms from Maxima...")

    for expr, var, desc in cases:
        print(f"  • Mining: ∫ {expr} d{var} ({desc})...")
        rep = engine.mine_integral(expr, var)
        rep["preset_label"] = desc
        key = expr.replace(" ", "").lower()
        database[key] = rep

    output_path = Path(__file__).resolve().parent.parent / "web" / "premined.js"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("// Pre-mined MaximaMiner Algorithm Database\n")
        f.write("window.PREMINED_DATABASE = " + json.dumps(database, indent=2) + ";\n")

    print(f"\n[gen_premined] Successfully exported {len(database)} algorithms to {output_path}")

if __name__ == "__main__":
    main()

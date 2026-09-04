import sys
from pathlib import Path

# Add project root to sys.path so MaximaMiner can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

# Configure standard output to utf-8 if possible
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from MaximaMiner.core.tracer import MaximaMinerEngine

def main():
    print("=" * 75)
    print("  [ MaximaMiner ] Autonomous CAS Tracing & Algorithm Identification")
    print("=" * 75)
    print()

    engine = MaximaMinerEngine()

    benchmarks = [
        ("x * exp(x^2)", "x", "Classic Derivative-Divides Heuristic (u-substitution)"),
        ("1 / (x^3 + 1)", "x", "Rational Function Integration (Hermite / Partial Fractions)"),
        ("sin(x)^3", "x", "Trigonometric Substitution (Variable Transformation)"),
        ("exp(x) / x", "x", "Non-Elementary Integral (Risch Failure -> Special Function)"),
    ]

    for i, (expr, var, description) in enumerate(benchmarks, 1):
        print(f"--- [Case {i}] {description} ---")
        print(f"Input: ∫ {expr} d{var}")
        
        try:
            report = engine.mine_integral(expr, var)
            algo = report["algorithm"]
            
            print(f"Result: {report['final_result']}")
            print(f"Identified Algorithm : [{algo['aic']}] {algo['name']}")
            print(f"Algorithm Description: {algo['description']}")
            
            if report["attempted_heuristics"]:
                print("Attempted & Failed  :")
                for att in report["attempted_heuristics"]:
                    print(f"  ✗ {att}")
            
            print("\nExecution Call Tree:")
            for line in report["call_tree_text"].splitlines():
                print(f"  {line}")
                
        except Exception as e:
            print(f"Error evaluating: {e}")
            
        print("\n" + "-" * 75 + "\n")

if __name__ == "__main__":
    main()

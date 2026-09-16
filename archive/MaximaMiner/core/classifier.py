from typing import List, Dict, Any, Optional
from MaximaMiner.core.parser import TraceNode
from MaximaMiner.catalog.rules import FUNCTION_CATALOG

class AlgorithmClassifier:
    @staticmethod
    def classify_integration(parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyzes the trace tree for an integration call and classifies the active algorithm.
        """
        roots: List[TraceNode] = parsed_data.get("roots", [])
        final_result: Optional[str] = parsed_data.get("final_result")

        attempted_heuristics = []
        resolving_algorithm = None
        details = []
        seen_algorithms = []

        def traverse(node: TraceNode):
            func_name = node.func
            res = node.result_raw or ""
            info = FUNCTION_CATALOG.get(func_name, {})

            if func_name == "diffdiv":
                if res.strip() == "false":
                    attempted_heuristics.append("diffdiv (Derivative-Divides: Failed)")
                else:
                    seen_algorithms.append({
                        "aic": "ALG-HEUR-DIFFDIV",
                        "name": "Derivative-Divides Heuristic",
                        "priority": 10,
                        "description": "Solved by detecting f(u(x)) * u'(x) pattern substitution directly."
                    })
                    details.append(f"diffdiv evaluated: {res}")

            elif func_name == "ratint":
                if res and res != "false":
                    seen_algorithms.append({
                        "aic": "ALG-RATINT",
                        "name": "Rational Function Integration (Hermite / Partial Fractions)",
                        "priority": 30,
                        "description": "Solved via exact algebraic decomposition over polynomial ring Q[x]."
                    })
                    details.append(f"ratint evaluated rational integrand to: {res}")

            elif func_name == "trigint":
                if res and res != "false":
                    seen_algorithms.append({
                        "aic": "ALG-TRIGINT",
                        "name": "Trigonometric Substitution",
                        "priority": 40,
                        "description": "Transformed trig powers into polynomial u-substitution and re-entered integrator."
                    })
                    details.append(f"trigint transformed trigonometric integrand to: {res}")

            elif func_name == "rischint":
                if "integrate" in res:
                    attempted_heuristics.append("rischint (Risch Algorithm: Non-Elementary Proved)")
                else:
                    seen_algorithms.append({
                        "aic": "ALG-RISCH",
                        "name": "Risch Algorithm",
                        "priority": 50,
                        "description": "Solved using algebraic differential field tower integration."
                    })
                    details.append(f"rischint produced elementary closed form: {res}")

            for child in node.children:
                traverse(child)

        for root in roots:
            traverse(root)

        # Pick algorithm with highest priority (e.g. trigint > diffdiv)
        if seen_algorithms:
            seen_algorithms.sort(key=lambda a: a["priority"], reverse=True)
            resolving_algorithm = seen_algorithms[0]

        # Check for special function fallback if Risch was non-elementary
        if final_result and "gamma_incomplete" in final_result:
            special_info = {
                "aic": "ALG-SPECIAL-GAMMA",
                "name": "Incomplete Gamma Special Function",
                "description": "Non-elementary integral represented in terms of incomplete gamma special function."
            }
            if resolving_algorithm is None:
                resolving_algorithm = special_info
            else:
                details.append(f"Fell back to special function: {special_info['name']}")

        # Fallback default if unresolved
        if resolving_algorithm is None:
            resolving_algorithm = {
                "aic": "ALG-CASCADE-GENERIC",
                "name": "Moses Integration Cascade (Generic)",
                "description": "Solved by general integration heuristics."
            }

        return {
            "primary_algorithm": resolving_algorithm,
            "attempted_heuristics": attempted_heuristics,
            "final_result": final_result,
            "details": details
        }

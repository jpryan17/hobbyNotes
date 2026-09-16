from typing import Dict, Any, Optional
from MaximaMiner.core.runner import MaximaRunner
from MaximaMiner.core.parser import TraceParser
from MaximaMiner.core.classifier import AlgorithmClassifier

class MaximaMinerEngine:
    def __init__(self, maxima_path: Optional[str] = None):
        self.runner = MaximaRunner(maxima_path=maxima_path)

    def mine_integral(self, integrand: str, var: str = "x") -> Dict[str, Any]:
        """
        Executes an indefinite integral in Maxima, captures Lisp execution trace,
        parses the call graph, and identifies the underlying mathematical algorithm.
        """
        command = f"integrate({integrand}, {var})"
        raw_output = self.runner.run_with_trace(command=command)
        parsed = TraceParser.parse(raw_output)
        classification = AlgorithmClassifier.classify_integration(parsed)

        call_trees = [root.print_tree() for root in parsed.get("roots", [])]
        tree_text = "\n".join(call_trees) if call_trees else "(No trace captured)"
        tree_dicts = [root.to_dict() for root in parsed.get("roots", [])]

        return {
            "input": integrand,
            "variable": var,
            "command": command,
            "final_result": classification.get("final_result"),
            "algorithm": classification.get("primary_algorithm"),
            "attempted_heuristics": classification.get("attempted_heuristics"),
            "details": classification.get("details"),
            "call_tree_text": tree_text,
            "call_tree": tree_dicts,
            "raw_output": raw_output
        }


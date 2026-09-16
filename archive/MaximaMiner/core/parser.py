import re
from typing import List, Optional, Dict, Any

TRACE_PATTERN = re.compile(r"^(\s*)(\d+)\s+(Enter|Exit)\s+([a-zA-Z0-9_%-]+)\s+(.*)$")

class TraceNode:
    def __init__(self, func: str, depth: int, args_raw: str):
        self.func: str = func
        self.depth: int = depth
        self.args_raw: str = args_raw.strip()
        self.result_raw: Optional[str] = None
        self.children: List['TraceNode'] = []
        self.parent: Optional['TraceNode'] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "func": self.func,
            "depth": self.depth,
            "args": self.args_raw,
            "result": self.result_raw,
            "children": [child.to_dict() for child in self.children]
        }

    def print_tree(self, indent: int = 0) -> str:
        pad = "  " * indent
        res_str = f" -> {self.result_raw}" if self.result_raw is not None else ""
        lines = [f"{pad}• [{self.func}] args: {self.args_raw}{res_str}"]
        for child in self.children:
            lines.append(child.print_tree(indent + 1))
        return "\n".join(lines)


class TraceParser:
    @staticmethod
    def parse(raw_output: str) -> Dict[str, Any]:
        """
        Parses Maxima stdout containing trace output into a structured call tree and final result.
        """
        lines = raw_output.splitlines()
        root_nodes: List[TraceNode] = []
        stack: List[TraceNode] = []
        final_result_line: Optional[str] = None

        for line in lines:
            line_str = line.rstrip()
            match = TRACE_PATTERN.match(line_str)
            if match:
                spaces, level_str, action, func, rest = match.groups()
                depth = len(spaces)

                if action == "Enter":
                    node = TraceNode(func=func, depth=depth, args_raw=rest)
                    if stack:
                        node.parent = stack[-1]
                        stack[-1].children.append(node)
                    else:
                        root_nodes.append(node)
                    stack.append(node)

                elif action == "Exit":
                    # Match with stack
                    if stack:
                        # Find matching node in stack from top down
                        idx = len(stack) - 1
                        while idx >= 0 and stack[idx].func != func:
                            idx -= 1
                        if idx >= 0:
                            stack[idx].result_raw = rest.strip()
                            stack = stack[:idx]  # Pop closed frames
            else:
                # Track last non-empty line as potential final result (excluding setup lines)
                cleaned = line_str.strip()
                if cleaned and not cleaned.startswith("display2d") and not cleaned.startswith("false") and not cleaned.startswith("trace") and not cleaned.startswith("[") and not cleaned.startswith("integrate"):
                    final_result_line = cleaned

        return {
            "roots": root_nodes,
            "final_result": final_result_line,
            "raw_output": raw_output
        }

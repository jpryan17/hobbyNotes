import subprocess
from typing import List, Optional
from MaximaMiner.config import get_maxima_executable

DEFAULT_INTEGRATION_TRACES = [
    "sinint",
    "integrator",
    "diffdiv",
    "ratint",
    "trigint",
    "rischint"
]

class MaximaRunner:
    def __init__(self, maxima_path: Optional[str] = None):
        self.maxima_path = maxima_path or get_maxima_executable()

    def run_with_trace(
        self,
        command: str,
        trace_funcs: Optional[List[str]] = None,
        extra_setup: Optional[str] = None
    ) -> str:
        """
        Executes a Maxima command with display2d:false and traces on specified Lisp functions.
        Returns the raw stdout string.
        """
        if trace_funcs is None:
            trace_funcs = DEFAULT_INTEGRATION_TRACES

        # Format trace call with '?' to target internal Lisp symbols
        trace_args = ", ".join([f"?{fn}" for fn in trace_funcs])
        
        # Build batch string
        batch_parts = ["display2d: false;"]
        if extra_setup:
            batch_parts.append(extra_setup)
        batch_parts.append(f"trace({trace_args});")
        batch_parts.append(f"{command};")
        batch_string = " ".join(batch_parts)

        cmd = [
            self.maxima_path,
            "--very-quiet",
            f"--batch-string={batch_string}"
        ]

        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace"
        )

        if result.returncode != 0:
            raise RuntimeError(f"Maxima execution failed with code {result.returncode}: {result.stderr}")

        return result.stdout

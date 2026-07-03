"""Pytest bootstrap for the reconcile_wards package.

Ensures the scripts directory (this file's dir) is on sys.path so that both
`import reconcile_wards` (the package) and `import ward_utils` (the sibling
prior-art module, imported via sys.path in audit-wards-against-inec.py) resolve
when tests are run from within packages/database/scripts.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

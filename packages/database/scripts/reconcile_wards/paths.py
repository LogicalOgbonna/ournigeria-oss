from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parents[1]          # packages/database/scripts
SEED_DIR = SCRIPTS_DIR.parent / "seed" / "structure"        # packages/database/seed/structure
SCRATCH_DIR = SCRIPTS_DIR / "reconcile_wards" / ".cache"    # gitignored workbook cache
SCRATCH_DIR.mkdir(exist_ok=True)

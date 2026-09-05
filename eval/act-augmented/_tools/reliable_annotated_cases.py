"""Load the reliable human-annotated synthetic cases used by benchmark runs.

This mirrors ``run-annotated-suite.js``: only pages present in annotations/*.json
are admitted, and ``needs-validation`` cases are excluded by default.
"""

import json
import re
from pathlib import Path


def _safe(value: str) -> str:
    return re.sub(r'[^a-z0-9_]+', '-', str(value), flags=re.IGNORECASE)[:80]


def load_reliable_annotated_cases(project_root: Path, scs=None, include_needs_validation=False):
    project_root = Path(project_root)
    aug_dir = project_root / 'eval' / 'act-augmented'
    irr_dir = aug_dir / '_annotator' / 'irr'
    wanted = set(scs or []) or None

    tags = {}
    tag_file = irr_dir / 'case-reliability-tags.json'
    if tag_file.exists():
        for case in json.loads(tag_file.read_text()).get('cases', []):
            tags[case['key']] = case['tag']

    annotated = set()
    for annotation_file in sorted((project_root / 'annotations').glob('*.json')):
        doc = json.loads(annotation_file.read_text())
        annotated.update((doc.get('annotations') or {}).keys())

    cases = []
    for sc_dir in sorted(aug_dir.iterdir()):
        if not sc_dir.is_dir():
            continue
        sc = sc_dir.name
        if wanted is not None and sc not in wanted:
            continue
        result_file = sc_dir / 'result.json'
        if not result_file.exists():
            continue
        result = json.loads(result_file.read_text())
        for aspect_result in result.get('aspectResults', []):
            built = aspect_result.get('built') or {}
            aspect = built.get('aspectSlug') or aspect_result.get('aspect') or 'aspect'
            for page in built.get('pages', []):
                key = f"{sc}::{aspect}::{page['id']}"
                if key not in annotated:
                    continue
                stratum = tags.get(key, 'unflagged')
                if stratum == 'needs-validation' and not include_needs_validation:
                    continue
                fixture = project_root / page['file']
                if not fixture.exists():
                    continue
                cases.append({
                    'file': str(fixture.relative_to(project_root)),
                    'abs_path': str(fixture.resolve()),
                    'sc': sc,
                    'all_scs': [sc],
                    'expected': page.get('expected', 'unknown'),
                    'ruleId': _safe(aspect),
                    'testcaseId': f"aug-{sc}-{_safe(aspect)}-{_safe(page['id'])}",
                    'key': key,
                    'stratum': stratum,
                    'reaches': False,
                })
    return cases

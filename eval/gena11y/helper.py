"""
Simplified port of GenA11y helper.py.
Drops the heavy GPT-2 tokenizer dependency; uses character-count approximation
(≈4 chars per token) which is accurate enough for chunking heuristics.
"""
import json
import re


def count_tokens_approx(text):
    return max(1, len(str(text)) // 4)


def chunk_data(data, threshold_tokens=80000, max_chunk_tokens=40000):
    """Chunk dict or list if total tokens exceed threshold."""

    def total_tokens(d):
        if isinstance(d, dict):
            return sum(count_tokens_approx(k) + count_tokens_approx(v) for k, v in d.items())
        return sum(count_tokens_approx(item) for item in d)

    def chunk_by_tokens(d, max_tok):
        items = list(d.items()) if isinstance(d, dict) else list(d)
        current, cur_tok = ({} if isinstance(d, dict) else []), 0
        for item in items:
            if isinstance(d, dict):
                k, v = item
                tok = count_tokens_approx(k) + count_tokens_approx(v)
            else:
                tok = count_tokens_approx(item)
            if cur_tok + tok > max_tok and current:
                yield current
                current = ({k: v} if isinstance(d, dict) else [item])
                cur_tok = tok
            else:
                if isinstance(d, dict):
                    current[k] = v
                else:
                    current.append(item)
                cur_tok += tok
        if current:
            yield current

    if total_tokens(data) > threshold_tokens:
        return list(chunk_by_tokens(data, max_chunk_tokens))
    return [data]


def aggregate_responses(responses):
    """
    Merge multiple JSON verdict responses into one.
    Any 'REPRODUCED' wins over 'PARTIAL', which wins over 'NOT REPRODUCED'.
    Violations lists are concatenated; confidence is the lowest of all.
    """
    verdicts, violations, summaries, confidences = [], [], [], []

    for r in responses:
        if not r:
            continue
        if isinstance(r, str):
            try:
                obj = json.loads(r)
            except Exception:
                # Try to extract JSON from prose
                m = re.search(r'\{[\s\S]*\}', r)
                if not m:
                    continue
                try:
                    obj = json.loads(m.group())
                except Exception:
                    continue
        else:
            obj = r

        verdicts.append(obj.get('verdict', 'NOT REPRODUCED'))
        violations.extend(obj.get('violations', []))
        summaries.append(obj.get('summary', ''))
        confidences.append(obj.get('confidence', 'low'))

    if not verdicts:
        return {
            'verdict': 'NOT REPRODUCED',
            'confidence': 'low',
            'violations': [],
            'summary': 'No analysis available.',
        }

    # Verdict precedence: REPRODUCED > PARTIAL > NOT REPRODUCED
    order = {'REPRODUCED': 2, 'PARTIAL': 1, 'NOT REPRODUCED': 0}
    final_verdict = max(verdicts, key=lambda v: order.get(v, 0))

    conf_order = {'high': 2, 'medium': 1, 'low': 0}
    final_conf = min(confidences, key=lambda c: conf_order.get(c, 0))

    return {
        'verdict': final_verdict,
        'confidence': final_conf,
        'violations': violations,
        'summary': ' '.join(s for s in summaries if s),
    }

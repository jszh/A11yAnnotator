import sys
import types
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import a11y_detector


class _Response:
    def model_dump(self):
        return {
            'status': 'completed',
            'output': [
                {'type': 'reasoning', 'summary': [{'type': 'summary_text', 'text': 'Checked the page.'}]},
                {'type': 'message', 'content': [{'type': 'output_text', 'text': '{"verdict":"NOT REPRODUCED"}'}]},
            ],
            'usage': {
                'input_tokens': 123,
                'output_tokens': 45,
                'output_tokens_details': {'reasoning_tokens': 12},
            },
        }


class _StreamingResponse:
    def __iter__(self):
        yield types.SimpleNamespace(model_dump=lambda: {
            'type': 'response.output_text.delta', 'delta': '{"verdict":'})
        yield types.SimpleNamespace(model_dump=lambda: {
            'type': 'response.output_text.delta', 'delta': '"NOT REPRODUCED"}'})
        yield types.SimpleNamespace(model_dump=lambda: {
            'type': 'response.completed',
            'response': {
                'status': 'completed',
                'output': [],
                'usage': {'input_tokens': 70, 'output_tokens': 8,
                          'output_tokens_details': {'reasoning_tokens': 2}},
            },
        })


class ChatGPTTransportTest(unittest.TestCase):
    def setUp(self):
        self.old_model = a11y_detector.MODEL
        self.old_effort = a11y_detector.EFFORT
        self.old_litellm = sys.modules.get('litellm')

    def tearDown(self):
        a11y_detector.MODEL = self.old_model
        a11y_detector.EFFORT = self.old_effort
        if self.old_litellm is None:
            sys.modules.pop('litellm', None)
        else:
            sys.modules['litellm'] = self.old_litellm

    def test_chatgpt_route_uses_litellm_responses_without_forbidden_fields(self):
        calls = []
        sys.modules['litellm'] = types.SimpleNamespace(
            responses=lambda **kwargs: calls.append(kwargs) or _Response())
        a11y_detector.configure(model='chatgpt/gpt-5.6-luna', effort='medium')

        raw, usage, reasoning = a11y_detector._litellm_chatgpt(
            'Judge this page.', [('image/png', 'aGVsbG8=')], system='System rule.', effort='medium')

        self.assertEqual(a11y_detector._provider(), 'chatgpt')
        self.assertEqual(raw, '{"verdict":"NOT REPRODUCED"}')
        self.assertEqual(usage['input_tokens'], 123)
        self.assertEqual(usage['output_tokens'], 45)
        self.assertEqual(usage['reasoning_tokens'], 12)
        self.assertEqual(reasoning, 'Checked the page.')
        self.assertEqual(calls[0]['model'], 'chatgpt/gpt-5.6-luna')
        self.assertEqual(calls[0]['reasoning'], {'effort': 'medium', 'summary': 'auto'})
        self.assertEqual(calls[0]['input'][0]['content'][1]['type'], 'input_image')
        self.assertNotIn('max_tokens', calls[0])
        self.assertNotIn('max_output_tokens', calls[0])
        self.assertNotIn('metadata', calls[0])

    def test_native_chatgpt_stream_is_aggregated_with_final_usage(self):
        sys.modules['litellm'] = types.SimpleNamespace(responses=lambda **kwargs: _StreamingResponse())
        a11y_detector.configure(model='chatgpt/gpt-5.6-luna', effort='low')

        raw, usage, reasoning = a11y_detector._litellm_chatgpt(
            'Judge.', [], system='System.', effort='low')

        self.assertEqual(raw, '{"verdict":"NOT REPRODUCED"}')
        self.assertEqual(usage['input_tokens'], 70)
        self.assertEqual(usage['output_tokens'], 8)
        self.assertEqual(usage['reasoning_tokens'], 2)
        self.assertIsNone(reasoning)


if __name__ == '__main__':
    unittest.main()

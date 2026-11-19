"""Run the documented Chat example offline with curl replaced by a capture stub."""
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class ChatSmokePayloadTest(unittest.TestCase):
    def test_exported_model_id_reaches_request_json(self):
        page = (ROOT / 'guides/api-testing/curl-openai-compatible-smoke-test.md').read_text()
        section = page.split('## 最小 Chat 请求', 1)[1].split('\n## ', 1)[0]
        blocks = re.findall(r'```bash\n(.*?)\n```', section, re.S)
        self.assertTrue(blocks)
        for model in ['offline-arbitrary-model', 'dummy/模型-"quoted"\\slash\nline']:
            with self.subTest(model=model), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                stub = root / 'curl'
                stub.write_text('''#!/usr/bin/env python3
import json, pathlib, sys
args = sys.argv[1:]
flag = '--data-binary' if '--data-binary' in args else '-d'
body = args[args.index(flag) + 1]
body = pathlib.Path(body[1:]).read_text() if body.startswith('@') else body
pathlib.Path('captured.json').write_text(json.dumps(json.loads(body)))
''')
                stub.chmod(0o755)
                env = {**os.environ, 'PATH': str(root) + os.pathsep + os.environ['PATH'],
                       'MODEL_ID': model, 'API_KEY': 'offline-dummy-key',
                       'BASE_URL': 'https://example.invalid/v1'}
                subprocess.run(['bash', '-e', '-c', '\n'.join(blocks)], cwd=root,
                               env=env, check=True, capture_output=True, text=True)
                payload = json.loads((root / 'captured.json').read_text())
                self.assertEqual(payload['model'], model)
                self.assertEqual(payload['messages'][0]['role'], 'user')
                self.assertNotIn('offline-dummy-key', json.dumps(payload))


if __name__ == '__main__':
    unittest.main()

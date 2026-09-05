import os
import tempfile
import time
import unittest
from concurrent.futures import ThreadPoolExecutor

from temp_isolation import ThreadLocalTempFolders


class ThreadLocalTempFoldersTest(unittest.TestCase):
    def test_fixed_filenames_are_isolated_across_workers(self):
        with tempfile.TemporaryDirectory() as root:
            folders = ThreadLocalTempFolders(root)

            def capture(index):
                def write_then_read():
                    folder = os.fspath(folders)
                    path = os.path.join(folder, 'fixed-screenshot.png')
                    with open(path, 'w', encoding='utf-8') as sink:
                        sink.write(str(index))
                    time.sleep(0.02)
                    with open(path, encoding='utf-8') as source:
                        self.assertEqual(source.read(), str(index))
                    return folder

                return folders.run('page-test-', write_then_read)

            with ThreadPoolExecutor(max_workers=12) as executor:
                used = list(executor.map(capture, range(24)))

            self.assertEqual(len(set(used)), 24)
            self.assertTrue(all(not os.path.exists(folder) for folder in used))
            self.assertEqual(os.fspath(folders), root)


if __name__ == '__main__':
    unittest.main()

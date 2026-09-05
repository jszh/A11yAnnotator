"""Runner-side isolation for third-party code that writes fixed temp filenames."""

import os
import tempfile
import threading


class ThreadLocalTempFolders(os.PathLike):
    """A path-like temp root whose active directory is local to each worker."""

    def __init__(self, root):
        self.root = os.fspath(root)
        self._local = threading.local()

    def __fspath__(self):
        return getattr(self._local, 'active', self.root)

    def run(self, prefix, callback):
        """Run callback with a unique directory for the calling worker."""
        with tempfile.TemporaryDirectory(prefix=prefix, dir=self.root) as page_tmp:
            previous = getattr(self._local, 'active', None)
            self._local.active = page_tmp
            try:
                return callback()
            finally:
                if previous is None:
                    del self._local.active
                else:
                    self._local.active = previous

'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { nsXPath } = require('../lib/xpath-ns.js');

test('nsXPath rewrites plain lowercase element steps to local-name() (with positional index)', () => {
  assert.strictEqual(
    nsXPath('/html/body/svg[1]/a[1]'),
    "/*[local-name()='html']/*[local-name()='body']/*[local-name()='svg'][1]/*[local-name()='a'][1]"
  );
  assert.strictEqual(
    nsXPath('/html[1]/body[1]/svg[1]/a[2]'),
    "/*[local-name()='html'][1]/*[local-name()='body'][1]/*[local-name()='svg'][1]/*[local-name()='a'][2]"
  );
});

test('nsXPath leaves non-element steps untouched (text(), axis::, already-rewritten, wildcard)', () => {
  // a synthetic page-level subject must NOT be mangled (it never reaches document.evaluate as an element)
  assert.strictEqual(nsXPath('/page-level::title'), '/page-level::title');
  // text() node-test is preserved
  assert.strictEqual(
    nsXPath('/html/body/svg[1]/a[1]/text()[1]'),
    "/*[local-name()='html']/*[local-name()='body']/*[local-name()='svg'][1]/*[local-name()='a'][1]/text()[1]"
  );
});

test('nsXPath is idempotent (a rewritten path rewrites to itself)', () => {
  const once = nsXPath('/html/body/p[1]/svg[1]/a[1]');
  assert.strictEqual(nsXPath(once), once);
});

test('nsXPath returns non-xpath / non-string inputs unchanged', () => {
  assert.strictEqual(nsXPath(''), '');
  assert.strictEqual(nsXPath('not-an-xpath'), 'not-an-xpath'); // no '/' → unchanged
  assert.strictEqual(nsXPath(null), null);
  assert.strictEqual(nsXPath(undefined), undefined);
});

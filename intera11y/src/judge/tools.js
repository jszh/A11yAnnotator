'use strict';
// The judge's live inspection tools. Handlers and their descriptions come from the v3 tool library (every
// tool returns measurements, never a verdict; every mutating tool runs on a fresh page). A criterion names the
// subset it offers; the registry binds them to one page session.
const { toolHandlers, toolDeclarations } = require('../lib/v3.js');

let DECLS = null;
function declarationsFor(names) {
  DECLS = DECLS || toolDeclarations();
  return names.filter((n) => DECLS[n] && toolHandlers[n]).map((n) => DECLS[n]);
}

function bindTools(session, names) {
  const declarations = declarationsFor(names || []);
  const allowed = new Set(declarations.map((d) => d.name));
  const ctx = { freshClone: () => session.freshPage() };
  return {
    declarations,
    async call(name, args) {
      if (!allowed.has(name)) return { error: `unknown tool ${name}` };
      return toolHandlers[name](session.page, args, ctx);
    },
  };
}

module.exports = { bindTools, declarationsFor };

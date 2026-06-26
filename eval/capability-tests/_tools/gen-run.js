'use strict';
// Build the full 3.3.2 + 3.3.3 corpus: requiring each case module emits the HTML files and
// populates the shared manifests map; then write one labels.json per aspect.
const { writeManifest, manifests } = require('./gen-332-333.js');
require('./cases-332-a.js');
require('./cases-332-b.js');
require('./cases-332-c.js');
require('./cases-333-a.js');
require('./cases-333-b.js');
require('./cases-333-c.js');

let total = 0;
for (const key of Object.keys(manifests).sort()) {
  const [sc, aspect] = key.split('/');
  const rows = manifests[key];
  writeManifest(sc, aspect, rows);
  total += rows.length;
  const pos = rows.filter((r) => r.polarity === 'positive').length;
  const neg = rows.filter((r) => r.polarity === 'negative').length;
  const abst = rows.filter((r) => r.runnerShould === 'abstain').length;
  console.log(`${key.padEnd(48)} ${rows.length} rows  (pos ${pos} / neg ${neg})  abstain ${abst}`);
}
console.log(`\nTOTAL rows: ${total}`);

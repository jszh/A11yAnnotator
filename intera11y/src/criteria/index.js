'use strict';
// The criteria InterA11y tests. Each module is one test specification: identify → probes → assess → evidence → tools.
const SCS = ['2.1.1', '2.1.2', '2.4.3', '2.4.7', '1.4.13', '4.1.3', '3.3.1', '4.1.2', '1.4.1', '2.4.4', '1.4.3', '1.1.1'];
const fs = require('fs');
const path = require('path');
const CRITERIA = {};
for (const sc of SCS) if (fs.existsSync(path.join(__dirname, `${sc}.js`))) CRITERIA[sc] = require(`./${sc}.js`);
module.exports = { CRITERIA, SCS };

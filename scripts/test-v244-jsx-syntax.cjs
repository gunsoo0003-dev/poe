// V244: Parse the actual TSX with TypeScript to catch invalid JSX attributes before ZIP delivery.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const tsPath = path.join(path.dirname(process.execPath), '../lib/node_modules/typescript');
let ts;
try { ts = require('typescript'); }
catch { try { ts = require(tsPath); }
catch { ts = require(cp.execFileSync('npm', ['root','-g'], {encoding:'utf8'}).trim() + '/typescript'); } }
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'src/app/page.tsx');
const source = fs.readFileSync(file,'utf8');
const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
assert.equal(parsed.parseDiagnostics.length, 0, parsed.parseDiagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n') + ' @' + d.start).join('\n'));
assert.match(source, /width=\{1577\}[\s\S]*height=\{1343\}/);
console.log('PASS V244 TSX parsed without syntax errors, numeric dimensions valid');

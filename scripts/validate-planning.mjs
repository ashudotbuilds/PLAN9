import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(resolve(root, path), 'utf8');
const matches = (text, pattern) => [...text.matchAll(pattern)].map(match => match[1]);
const unique = values => [...new Set(values)];

function orderTickets(tickets) {
  const byId = new Map(tickets.map(ticket => [ticket.id, ticket]));
  assert.equal(byId.size, tickets.length, 'Duplicate ticket ID');
  const visiting = new Set();
  const done = new Set();
  const order = [];
  function visit(id) {
    assert(byId.has(id), `Missing blocker ${id}`);
    assert(!visiting.has(id), `Dependency cycle at ${id}`);
    if (done.has(id)) return;
    visiting.add(id);
    byId.get(id).blockers.forEach(visit);
    visiting.delete(id);
    done.add(id);
    order.push(id);
  }
  tickets.forEach(ticket => visit(ticket.id));
  return order;
}

function checkRequirements(requirements, tickets) {
  for (const ticket of tickets) {
    ticket.requirements.forEach(id => assert(requirements.includes(id), `Unknown requirement ${id}`));
  }
  requirements.forEach(id => assert(tickets.some(ticket => ticket.requirements.includes(id)), `Unmapped ${id}`));
}

// shortcut: parse the repository's Markdown templates, upgrade if those templates change.
const prd = read('DRIFTGUARD_PRD.md');
const catalog = read('.scratch/driftguard/API_CATALOG.md');
const coverage = read('.scratch/driftguard/REQUIREMENT_COVERAGE.md');
const index = read('.scratch/driftguard/README.md');
const requirements = matches(prd, /^\| ((?:FR-[A-Z]+|NFR)-\d+) \|/gm);
assert.equal(unique(requirements).length, requirements.length, 'Duplicate PRD requirement');
const directory = '.scratch/driftguard/issues';
const tickets = readdirSync(resolve(root, directory)).filter(path => /^\d{2}-.+\.md$/.test(path)).sort().map(path => {
  const body = read(`${directory}/${path}`);
  const field = name => {
    const value = body.match(new RegExp(`\\*\\*${name}:\\*\\* (.*)`));
    assert(value, `${path}: missing ${name}`);
    return value[1];
  };
  const id = path.slice(0, 2);
  assert(body.startsWith(`# ${id} - `), `${path}: title/ID mismatch`);
  assert(body.includes('## Acceptance criteria') && body.includes('## Test scenarios'), `${path}: missing checks`);
  assert(/- \[ \]/.test(body), `${path}: no unchecked acceptance`);
  assert(field('GitHub issue').includes(`https://github.com/ashudotbuilds/PLAN9/issues/${Number(id)})`), `${path}: issue link`);
  assert(index.includes(`issues/${path}`), `${path}: absent from index`);
  return { id, path, body, owner: field('Owner').replaceAll('`', ''), priority: field('Priority'),
    blockers: unique(matches(field('Blocked by'), /(?:Ticket )?(\d{2})/g)),
    requirements: unique(matches(field('PRD traceability'), /((?:FR-[A-Z]+|NFR)-\d+)/g)) };
});
assert.deepEqual(tickets.map(ticket => ticket.id), Array.from({ length: 41 }, (_, i) => String(i + 1).padStart(2, '0')));
const order = orderTickets(tickets);
for (const ticket of tickets) {
  const row = index.split('\n').find(line => line.startsWith(`| [${ticket.id} — `));
  assert(row, `Index missing ${ticket.id}`);
  const columns = row.split('|').map(column => column.trim());
  assert.equal(columns[2], ticket.priority, `Index priority drift ${ticket.id}`);
  assert.equal(columns[3], `\`${ticket.owner}\``, `Index owner drift ${ticket.id}`);
  assert.deepEqual(matches(columns[4], /(\d{2})/g).sort(), [...ticket.blockers].sort(), `Index blocker drift ${ticket.id}`);
  assert(columns[5].includes(`/issues/${Number(ticket.id)})`), `Index issue drift ${ticket.id}`);
  assert(['P0', 'P1', 'P2'].includes(ticket.priority), `Invalid priority ${ticket.id}`);
}
assert.deepEqual(tickets.filter(ticket => !ticket.blockers.length).map(ticket => ticket.id), ['01']);
checkRequirements(requirements, tickets);
for (const requirement of requirements) {
  const row = coverage.split('\n').find(line => line.startsWith(`| ${requirement} |`));
  assert(row, `Coverage missing ${requirement}`);
  const actual = unique(matches(row, /\[(\d{2})\]\(issues\//g)).sort();
  assert.deepEqual(actual, tickets.filter(ticket => ticket.requirements.includes(requirement)).map(ticket => ticket.id).sort(), `Coverage drift ${requirement}`);
}
const counts = Object.fromEntries(['ashudotbuilds', 'saransh-sh', 'AnushkaBhardwaj15', 'chandrabhan-kushwaha'].map(owner => [owner, tickets.filter(ticket => ticket.owner === owner).length]));
assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), tickets.length, 'Unknown owner');
assert(Math.max(...Object.values(counts)) - Math.min(...Object.values(counts)) <= 1, 'Unbalanced assignment');
function gatedOnRelease(id) {
  return id === '13' || tickets.find(ticket => ticket.id === id).blockers.some(gatedOnRelease);
}
tickets.filter(ticket => ticket.priority !== 'P0').forEach(ticket => assert(gatedOnRelease(ticket.id), `Optional ticket ${ticket.id} bypasses release`));
const apiRows = [...catalog.matchAll(/^\| \[([AM]\d{2})\]\(#[am]\d{2}\) \| .*? \| (GET|POST) \| ([^|]+?) \| \[(\d{2})\]/gm)];
assert.equal(apiRows.length, 37);
assert.equal(unique(apiRows.map(row => row[1])).length, 37);
const prdRoutes = [
  ...[...prd.matchAll(/^\| `(GET|POST)` \| `([^`]+)` \|/gm)].map(([, method, route]) => `${method} ${route}`),
  ...[...prd.matchAll(/^\| `(GET|POST) ([^`]+)` \|/gm)].map(([, method, route]) => `${method} ${route}`),
];
assert.deepEqual(apiRows.map(([, , method, route]) => `${method} ${route}`).sort(), prdRoutes.sort(), 'PRD/API route mismatch');
for (const [, id, method, route, owner] of apiRows) {
  assert(catalog.includes(`### ${id}\n`), `Missing API detail ${id}`);
  assert(catalog.includes(`**${method} ${route}**`), `API detail route mismatch ${id}`);
  assert(tickets.some(ticket => ticket.id === owner), `API owner missing ${id}`);
}
const acceptance = matches(prd, /^\| (AT-SDK-\d+) \|/gm);
assert.equal(acceptance.length, 17);
acceptance.forEach(id => {
  const row = coverage.split('\n').find(line => line.startsWith(`| ${id} |`));
  assert(row, `Missing SDK gate ${id}`);
  const owners = matches(row, /\[(\d{2})\]\(issues\//g);
  assert(owners.includes('35') && owners.includes('13') && owners.length > 2, `Missing SDK ownership ${id}`);
  owners.forEach(owner => assert(tickets.some(ticket => ticket.id === owner), `Unknown SDK owner ${owner}`));
});
assert(tickets.find(ticket => ticket.id === '13').blockers.includes('35'), 'Combined release gate missing');
const files = ['README.md', 'CONTRIBUTING.md', 'AGENTS.md', 'agent.md', '.github/PULL_REQUEST_TEMPLATE.md', '.scratch/driftguard/README.md', '.scratch/driftguard/API_CATALOG.md', '.scratch/driftguard/REQUIREMENT_COVERAGE.md', ...tickets.map(ticket => `${directory}/${ticket.path}`)];
for (const path of files) {
  for (const target of matches(read(path), /\[[^\]]+\]\(([^)]+)\)/g)) {
    if (/^(?:https?:|#)/.test(target)) continue;
    const [relative, anchor] = target.split('#');
    const resolved = resolve(root, dirname(path), relative);
    assert(existsSync(resolved), `${path}: broken link ${target}`);
    if (anchor && relative.endsWith('API_CATALOG.md')) {
      assert(catalog.includes(`### ${anchor.toUpperCase()}\n`), `${path}: broken API anchor ${target}`);
    }
  }
}
// Negative cases make the graph and traceability checks prove their failure paths.
assert.deepEqual(orderTickets([{ id: 'b', blockers: ['a'] }, { id: 'a', blockers: [] }]), ['a', 'b']);
assert.throws(() => orderTickets([{ id: 'a', blockers: ['a'] }]), /cycle/);
assert.throws(() => orderTickets([{ id: 'a', blockers: ['missing'] }]), /Missing blocker/);
assert.throws(() => checkRequirements(['FR-A-01'], [{ requirements: ['FR-X-01'] }]), /Unknown requirement/);
assert.throws(() => checkRequirements(['FR-A-01'], [{ requirements: [] }]), /Unmapped/);
console.log(JSON.stringify({ tickets: tickets.length, requirements: requirements.length, apiRoutes: apiRows.length, sdkGates: acceptance.length, counts, topologicalOrder: order, selfChecks: 'passed', scope: 'planning only' }, null, 2));

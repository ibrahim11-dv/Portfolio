import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_FILES, ROOT } from '../../shared/filesystem/virtualFs.js';
import { completeShell, executeShell, parseShell } from './terminalShell.js';

const run = (command, state = {}) => executeShell(command, { files: INITIAL_FILES, cwd: ROOT, ...state });
const visitor = `${ROOT}/Desktop/Shell verification`;

test('quoted operators, adjacent quotes, empty words and escapes stay literal', () => {
  assert.equal(run(`echo '>' "a"'b' '' escaped\\ space \\|`).output, '> ab  escaped space |\n');
  assert.equal(run(String.raw`echo "a\qb" "a\"b"`).output, 'a\\qb a"b\n');
});

test('syntax errors are detected before any command changes files', () => {
  for (const command of [`touch Desktop/never-created ; echo 'broken`, 'touch Desktop/never-created |', 'touch Desktop/never-created &&', 'echo >']) {
    const result = run(command);
    assert.equal(result.status, 2, command);
    assert.equal(result.files, INITIAL_FILES);
  }
  assert.throws(() => parseShell('echo hello &'), /non disponible/);
});

test('comments and multiline commands preserve shell boundaries', () => {
  assert.equal(run('echo one # comment\necho two\n\necho "#three"').output, 'one\ntwo\n#three\n');
  assert.equal(run('echo one |\ncat').output, 'one\n');
});

test('mkdir -p, quoted paths and redirects share the latest filesystem', () => {
  const result = run(`mkdir -p '${visitor}/nested' && echo "Bonjour > Ubuntu" > '${visitor}/nested/note.txt' && cat '${visitor}/nested/note.txt'`);
  assert.equal(result.status, 0);
  assert.equal(result.output, 'Bonjour > Ubuntu\n');
  assert.equal(result.files[`${visitor}/nested`], null);
  assert.equal(result.files[`${visitor}/nested/note.txt`], 'Bonjour > Ubuntu\n');
});

test('commands require existing parents and preserve file-directory boundaries', () => {
  for (const command of ['touch Desktop/absent/child', 'mkdir Desktop/absent/child', 'echo hi > Desktop/absent/child', 'cp Documents/Compétences.md Desktop/absent/child']) {
    const result = run(command);
    assert.equal(result.status, 1, command);
    assert.equal(result.files, INITIAL_FILES);
  }
  const result = run('touch Desktop/blocker ; mkdir -p Desktop/blocker/child');
  assert.equal(result.status, 1);
  assert.equal(result.files[`${ROOT}/Desktop/blocker`], '');
  assert.equal(Object.hasOwn(result.files, `${ROOT}/Desktop/blocker/child`), false);
});

test('redirections work without spaces and with commands other than echo', () => {
  const result = run('echo one>Desktop/a.txt; echo two>>Desktop/a.txt; cat<Desktop/a.txt>Desktop/b.txt; cat Desktop/b.txt');
  assert.equal(result.status, 0);
  assert.equal(result.output, 'one\ntwo\n');
  assert.equal(result.files[`${ROOT}/Desktop/b.txt`], 'one\ntwo\n');
});

test('redirects are applied in order before executing the command', () => {
  const result = run('missing-command > Desktop/first.txt > Desktop/second.txt');
  assert.equal(result.status, 127);
  assert.equal(result.files[`${ROOT}/Desktop/first.txt`], '');
  assert.equal(result.files[`${ROOT}/Desktop/second.txt`], '');
  assert.equal(result.errors.length, 1);
});

test('originals and ancestor directories remain protected through every shell mutation', () => {
  for (const command of ['echo modified > Documents/Compétences.md', 'rm -rf Documents', 'mv Documents elsewhere', 'touch Documents/CV.pdf']) {
    const result = run(command);
    assert.equal(result.status, 1, command);
    assert.deepEqual(result.files, INITIAL_FILES);
  }
});

test('conditional lists use command status and skip mutations correctly', () => {
  const result = run('false && touch Desktop/skipped; true || touch Desktop/skipped; false || echo recovered; true && echo success');
  assert.equal(Object.hasOwn(result.files, `${ROOT}/Desktop/skipped`), false);
  assert.equal(result.output, 'recovered\nsuccess\n');
  assert.equal(run('LS').status, 127);
});

test('cd and home expansion update subsequent commands, cd - restores previous directory', () => {
  const result = run('cd ~/Documents && pwd ; cd - ; pwd');
  assert.equal(result.output, `${ROOT}/Documents\n${ROOT}\n${ROOT}\n`);
  assert.equal(result.cwd, ROOT);
  assert.equal(run("cd '~'").status, 1);
});

test('pipelines carry text without leaking child cd or exit to the session', () => {
  const result = run('echo Ubuntu | grep -i ubuntu | wc -l; cd Documents | cat; exit | cat; pwd');
  assert.equal(result.output, `1\n${ROOT}\n`);
  assert.equal(result.cwd, ROOT);
  assert.equal(result.exit, false);
});

test('grep, head, tail and wc handle no match, newline count and UTF-8 bytes', () => {
  const files = { ...INITIAL_FILES, [`${ROOT}/Desktop/text`]: 'été ubuntu\nother\nUbuntu final' };
  assert.equal(run('cat Desktop/text | grep -in ubuntu', { files }).output, '1:été ubuntu\n3:Ubuntu final\n');
  assert.equal(run('grep missing Desktop/text', { files }).status, 1);
  assert.equal(run('head -n 1 Desktop/text', { files }).output, 'été ubuntu\n');
  assert.equal(run('tail -n 1 Desktop/text', { files }).output, 'Ubuntu final');
  assert.equal(run('cat Desktop/text | wc -lc', { files }).output, '2 31\n');
});

test('copying originals creates visitor content, own folders can then move and delete', () => {
  const result = run('mkdir Desktop/copied ; cp Documents/Compétences.md Desktop/copied/skills.md ; mv Desktop/copied Desktop/moved ; rm -r Desktop/moved');
  assert.equal(result.status, 0);
  assert.ok(Object.hasOwn(result.files, `${ROOT}/Documents/Compétences.md`));
  assert.equal(Object.keys(result.files).some((path) => path.startsWith(`${ROOT}/Desktop/moved`)), false);
});

test('ls hides dot files by default, accepts -- and classifies folders', () => {
  const files = { ...INITIAL_FILES, [`${ROOT}/Desktop/.hidden`]: '', [`${ROOT}/Desktop/-note`]: '' };
  assert.equal(run('ls Desktop', { files }).output.includes('.hidden'), false);
  assert.equal(run('ls -a1 Desktop', { files }).output.includes('.hidden'), true);
  assert.equal(run('ls -F ~', { files }).output.includes('Documents/'), true);
  assert.equal(run('cat -- -note', { files, cwd: `${ROOT}/Desktop` }).status, 0);
});

test('completion handles commands, home paths, ambiguous prefixes and escaped names', () => {
  assert.equal(completeShell('mkd', 3, INITIAL_FILES, ROOT).value, 'mkdir ');
  const ambiguous = completeShell('cd ~/Do', 7, INITIAL_FILES, ROOT);
  assert.deepEqual(ambiguous.matches, ['~/Documents/', '~/Downloads/']);
  assert.equal(ambiguous.value, 'cd ~/Do');
  const files = { ...INITIAL_FILES, [`${ROOT}/Desktop/Space folder`]: null, [`${ROOT}/Desktop/Space folder/note.txt`]: '' };
  assert.equal(completeShell('cd Desktop/Sp', 13, files, ROOT).value, 'cd Desktop/Space\\ folder/');
  const quoted = 'cat "Desktop/Space folder/no';
  assert.equal(completeShell(quoted, quoted.length, files, ROOT).value, 'cat Desktop/Space\\ folder/note.txt ');
  assert.equal(completeShell(quoted + '"', quoted.length, files, ROOT).value, 'cat Desktop/Space\\ folder/note.txt ');
});

test('tree, find, du and df inspect the virtual filesystem accurately', () => {
  const treeResult = run('tree ~/Documents');
  assert.equal(treeResult.status, 0);
  assert.match(treeResult.output, /CV\.pdf/);
  assert.match(treeResult.output, /Compétences\.md/);

  const findResult = run('find ~/Projets -name README.md -type f');
  assert.equal(findResult.status, 0);
  assert.match(findResult.output, /~\/Projets\/ParcVision\/README\.md/);

  const duResult = run('du -sh ~/Documents/CV.pdf');
  assert.equal(duResult.status, 0);
  assert.match(duResult.output, /271,5 ko/);

  const dfResult = run('df -h');
  assert.equal(dfResult.status, 0);
  assert.match(dfResult.output, /ibrahimos-vfs/);
});

test('ps, kill, focus, sort, uniq, uname, uptime and history work in pipelines and emit window effects', () => {
  const windows = [
    { id: 'presentation', appId: 'presentation', workspace: 0, minimized: false },
    { id: 'terminal', appId: 'terminal', workspace: 1, minimized: true },
  ];
  const psResult = run('ps', { windows });
  assert.match(psResult.output, /presentation.*B1.*Active.*Présentation/);
  assert.match(psResult.output, /terminal.*B2.*Réduite.*Terminal/);

  const effectResult = run('focus presentation && kill terminal', { windows });
  assert.deepEqual(effectResult.effects, [
    { type: 'focus-window', target: 'presentation' },
    { type: 'close-window', target: 'terminal' },
  ]);

  const sortUniq = run('echo "b\na\nb\na\nc" | sort | uniq -c');
  assert.equal(sortUniq.output, '   2 a\n   2 b\n   1 c\n');

  assert.match(run('uname -a').output, /IbrahimOS.*GNOME 50/);
  assert.match(run('uptime', { sessionStart: 1000, now: 125000, windows }).output, /up 2 min 4 s.*2 fenêtres/);
  assert.equal(run('history', { history: ['ls', 'pwd'] }).output, '   1  pwd\n   2  ls\n');
});

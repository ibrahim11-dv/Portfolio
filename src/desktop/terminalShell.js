import { canDeletePath, canModifyPath, DIRECTORY_MARKER, isDirectory, listDirectory, normalizePath, removePath, ROOT } from './virtualFs.js';
import { CV_DOCUMENT, PROFILE, PROJECTS } from './portfolioData.js';

export const SHELL_COMMANDS = ['cat', 'cd', 'clear', 'contact', 'cp', 'cv', 'date', 'echo', 'exit', 'false', 'grep', 'head', 'help', 'ls', 'mkdir', 'mv', 'neofetch', 'open', 'portfolio', 'profile', 'projects', 'pwd', 'rm', 'rmdir', 'skills', 'tail', 'touch', 'true', 'wc', 'whoami'];
const operators = ['&&', '||', '>>', '<<', ';', '|', '>', '<', '&', '(', ')'];
const parentOf = (path) => path.slice(0, path.lastIndexOf('/')) || '/';
const exists = (files, path) => Object.hasOwn(files, path) || isDirectory(files, path);

// Keep quoted words distinct from shell operators. No host commands are executed.
export function shellTokens(source, incomplete = false) {
  const tokens = [];
  let value = '', start = 0, started = false, quote = null, home = false;
  const flush = (end) => {
    if (started) tokens.push({ type: 'word', value, start, end, home, quote });
    value = ''; started = false; home = false;
  };
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (!started && !/\s/.test(char)) { start = i; started = true; home = char === '~'; }
    if (quote === "'") {
      if (char === "'") quote = null; else value += char;
      continue;
    }
    if (char === '\\') {
      const next = source[i + 1];
      if (next === undefined) { if (incomplete) break; throw new Error('échappement incomplet'); }
      if (quote === '"' && !['$', '`', '"', '\\', '\n'].includes(next)) value += '\\';
      if (next !== '\n') value += next;
      i += 1; continue;
    }
    if (char === '`' || char === '$' && source[i + 1] === '(') throw new Error('la substitution de commandes n’est pas disponible');
    if (quote === '"') { if (char === '"') quote = null; else value += char; continue; }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (/\s/.test(char)) {
      flush(i);
      if (char === '\n' && tokens.at(-1)?.type === 'word') tokens.push({ type: 'operator', value: ';', start: i, end: i + 1 });
      continue;
    }
    if (char === '#' && value === '' && start === i) {
      started = false;
      const newline = source.indexOf('\n', i);
      if (newline < 0) break;
      i = newline - 1; continue;
    }
    const operator = operators.find((item) => source.startsWith(item, i));
    if (operator) {
      if (['>', '>>', '<'].includes(operator) && value && /^\d+$/.test(value)) throw new Error('les redirections de descripteurs ne sont pas disponibles');
      // An operator can begin the current token without creating an empty word.
      if (value === '' && start === i) started = false;
      flush(i);
      tokens.push({ type: 'operator', value: operator, start: i, end: i + operator.length });
      i += operator.length - 1; continue;
    }
    value += char;
  }
  if (quote && !incomplete) throw new Error(`guillemet ${quote} non fermé`);
  flush(source.length);
  return tokens;
}

export function parseShell(source) {
  const tokens = shellTokens(source);
  const lists = [];
  let pipeline = [], command = { words: [], redirects: [] }, condition = ';';
  const finishCommand = () => {
    if (!command.words.length && !command.redirects.length) throw new Error('commande manquante');
    pipeline.push(command); command = { words: [], redirects: [] };
  };
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.type === 'word') { command.words.push(token); continue; }
    if (['>', '>>', '<'].includes(token.value)) {
      const destination = tokens[++i];
      if (!destination || destination.type !== 'word') throw new Error('fichier de redirection manquant');
      command.redirects.push({ operator: token.value, destination }); continue;
    }
    if (token.value === '|') { finishCommand(); continue; }
    if (![';', '&&', '||'].includes(token.value)) throw new Error(`opérateur ${token.value} non disponible`);
    finishCommand(); lists.push({ condition, pipeline }); pipeline = []; condition = token.value;
    if (i === tokens.length - 1 && token.value !== ';') throw new Error('commande manquante');
  }
  if (command.words.length || command.redirects.length) { finishCommand(); lists.push({ condition, pipeline }); }
  else if (pipeline.length) throw new Error('commande manquante après |');
  return lists;
}

function wordValue(token) {
  return token.home && (token.value === '~' || token.value.startsWith('~/')) ? ROOT + token.value.slice(1) : token.value;
}

function operands(args, allowed = '') {
  const flags = new Set(), values = [];
  let options = true;
  for (const arg of args) {
    if (options && arg === '--') { options = false; continue; }
    if (options && arg.startsWith('-') && arg !== '-') {
      for (const flag of arg.slice(1)) {
        if (!allowed.includes(flag)) throw new Error(`option inconnue : -${flag}`);
        flags.add(flag);
      }
    } else values.push(arg);
  }
  return { flags, values };
}

function runCommand(words, context, stdin) {
  const [name, ...args] = words;
  const { files, cwd } = context;
  let output = '', status = 0;
  const errors = [];
  const print = (text) => { output += `${text}\n`; };
  const fail = (message) => { errors.push(`${name}: ${message}`); status = 1; };
  const path = (value) => normalizePath(value, cwd);
  const writable = (target) => {
    if (!isDirectory(context.files, parentOf(target))) { fail(`${target}: aucun dossier parent de ce nom`); return false; }
    if (!canModifyPath(context.files, target) || isDirectory(context.files, target)) { fail(`${target}: emplacement protégé ou non disponible`); return false; }
    return true;
  };
  const read = (values) => {
    if (!values.length) return stdin;
    return values.map((value) => {
      if (value === '-') return stdin;
      const target = path(value);
      if (!exists(files, target)) { fail(`${value}: aucun fichier de ce nom`); return ''; }
      if (isDirectory(files, target)) { fail(`${value}: est un dossier`); return ''; }
      if (files[target] === CV_DOCUMENT) { fail(`${value}: document PDF — utilisez open pour le lire`); return ''; }
      return files[target];
    }).join('');
  };
  try {
    switch (name) {
      case undefined: break;
      case 'help': print('Portfolio : profile, projects, skills, contact, cv, portfolio\nFichiers : ls [-aAF1], cd, pwd, cat, touch, mkdir [-p], cp [-r], mv, rm [-rf], rmdir, open\nTexte : echo [-n], grep [-Finv], head [-n N], tail [-n N], wc [-lwc]\nShell : guillemets, échappements, ~, >, >>, <, |, ;, &&, ||\nSession : whoami, date, clear, exit\nCe terminal utilise les fichiers du bureau. Seuls vos éléments sont modifiables.'); break;
      case 'profile': print(`${PROFILE.name}\n${PROFILE.role}\n${PROFILE.location}\n\n${PROFILE.bio}`); break;
      case 'projects': print(['main', 'other'].map((group) => `${group === 'main' ? 'PROJETS PRINCIPAUX' : 'AUTRES PROJETS'}\n\n${PROJECTS.filter((project) => project.group === group).map((project) => `${project.name}\n  ${project.description}${project.github ? `\n  ${project.github}` : ''}`).join('\n\n')}`).join('\n\n')); break;
      case 'skills': print(PROFILE.skills.map((group) => `${group.category}: ${group.items.join(', ')}`).join('\n')); break;
      case 'contact': print(`${PROFILE.email}\n${PROFILE.github}\n${PROFILE.location}`); break;
      case 'cv': context.effects.push({ type: 'cv' }); break;
      case 'portfolio': context.effects.push({ type: 'portfolio' }); break;
      case 'exit': context.exit = true; break;
      case 'clear': context.clear = true; break;
      case 'true': break;
      case 'false': status = 1; break;
      case 'pwd': print(cwd); break;
      case 'whoami': print('ibrahim'); break;
      case 'date': print(new Date().toString()); break;
      case 'echo': {
        let index = 0, newline = true;
        while (/^-n+$/.test(args[index] || '')) { newline = false; index += 1; }
        output = args.slice(index).join(' ') + (newline ? '\n' : ''); break;
      }
      case 'cd': {
        if (args.length > 1) { fail('trop d’arguments'); break; }
        const target = args[0] === '-' ? context.previousDirectory : path(args[0] || ROOT);
        if (!target) fail('aucun dossier précédent');
        else if (!isDirectory(files, target)) fail(`${args[0]}: aucun dossier de ce nom`);
        else { context.previousDirectory = cwd; context.cwd = target; if (args[0] === '-') print(target); }
        break;
      }
      case 'ls': {
        const { flags, values } = operands(args, 'aAF1');
        for (const value of values.length ? values : ['.']) {
          const target = path(value);
          if (!exists(files, target)) { fail(`${value}: aucun fichier ou dossier de ce nom`); continue; }
          if (values.length > 1) print(`${value}:`);
          const entries = isDirectory(files, target) ? listDirectory(files, target) : [[target.split('/').at(-1), 'file']];
          if (flags.has('a') && isDirectory(files, target)) entries.unshift(['.', 'dir'], ['..', 'dir']);
          print(entries.filter(([entry]) => flags.has('a') || flags.has('A') || !entry.startsWith('.')).map(([entry, type]) => entry + (flags.has('F') && type === 'dir' ? '/' : '')).join(flags.has('1') ? '\n' : '  '));
        } break;
      }
      case 'cat': { const { values } = operands(args); output = read(values); break; }
      case 'touch': {
        const { values } = operands(args);
        if (!values.length) fail('opérande manquant');
        for (const value of values) { const target = path(value); if (writable(target)) context.files = { ...context.files, [target]: context.files[target] ?? '' }; }
        break;
      }
      case 'mkdir': {
        const { flags, values } = operands(args, 'p');
        if (!values.length) fail('opérande manquant');
        for (const value of values) {
          const target = path(value);
          if (exists(context.files, target)) { if (!(flags.has('p') && isDirectory(context.files, target))) fail(`${value}: existe déjà`); continue; }
          const paths = flags.has('p') ? target.split('/').filter(Boolean).map((_, index, parts) => '/' + parts.slice(0, index + 1).join('/')) : [target];
          for (const entry of paths) {
            if (isDirectory(context.files, entry)) continue;
            if (Object.hasOwn(context.files, entry)) { fail(`${entry}: existe déjà et n’est pas un dossier`); break; }
            if (!writable(entry)) break;
            context.files = { ...context.files, [entry]: DIRECTORY_MARKER };
          }
        } break;
      }
      case 'rm': case 'rmdir': {
        const { flags, values } = operands(args, name === 'rm' ? 'rfR' : '');
        if (!values.length && !flags.has('f')) fail('opérande manquant');
        for (const value of values) {
          const target = path(value), directory = isDirectory(context.files, target);
          if (!exists(context.files, target)) { if (!flags.has('f')) fail(`${value}: introuvable`); continue; }
          if (!canDeletePath(context.files, target)) { fail(`${value}: élément du portfolio protégé`); continue; }
          if (name === 'rmdir' && (!directory || listDirectory(context.files, target).length)) { fail(`${value}: ${directory ? 'le dossier n’est pas vide' : 'n’est pas un dossier'}`); continue; }
          if (name === 'rm' && directory && !flags.has('r') && !flags.has('R')) { fail(`${value}: est un dossier (utilisez -r)`); continue; }
          context.files = removePath(context.files, target);
        } break;
      }
      case 'cp': case 'mv': {
        const { flags, values } = operands(args, name === 'cp' ? 'rR' : '');
        if (values.length !== 2) { fail('indiquez une source et une destination'); break; }
        const source = path(values[0]), requested = path(values[1]);
        const destination = isDirectory(files, requested) ? normalizePath(source.split('/').at(-1), requested) : requested;
        if (!exists(files, source)) { fail(`${values[0]}: introuvable`); break; }
        if (name === 'mv' && !canDeletePath(files, source)) { fail('document du portfolio protégé — utilisez cp pour en créer une copie'); break; }
        if (name === 'cp' && isDirectory(files, source) && !flags.has('r') && !flags.has('R')) { fail('utilisez -r pour copier un dossier'); break; }
        if (source === destination || destination.startsWith(`${source}/`)) { fail('la destination doit être différente de la source'); break; }
        if (exists(files, destination)) { fail('la destination existe déjà'); break; }
        if (!writable(destination)) break;
        const next = name === 'mv' ? { ...removePath(files, source) } : { ...files };
        if (isDirectory(files, source)) next[destination] = DIRECTORY_MARKER;
        Object.entries(files).filter(([entry]) => entry === source || entry.startsWith(`${source}/`)).forEach(([entry, content]) => { next[destination + entry.slice(source.length)] = content; });
        context.files = next; break;
      }
      case 'open': {
        const target = path(args[0] || '');
        if (args.length !== 1 || !exists(files, target) || isDirectory(files, target)) fail('indiquez un fichier existant');
        else context.effects.push({ type: 'open', path: target }); break;
      }
      case 'grep': {
        const { flags, values } = operands(args, 'Finv');
        if (!values.length) { fail('motif manquant'); status = 2; break; }
        const [pattern, ...sources] = values;
        const expression = flags.has('F') ? null : new RegExp(pattern, flags.has('i') ? 'i' : '');
        const groups = sources.length ? sources : ['-'];
        let matched = false;
        for (const source of groups) {
          const text = read([source]);
          const rows = text.split('\n'); if (rows.at(-1) === '') rows.pop();
          rows.forEach((row, index) => {
            const found = expression ? expression.test(row) : (flags.has('i') ? row.toLocaleLowerCase().includes(pattern.toLocaleLowerCase()) : row.includes(pattern));
            if (found === !flags.has('v')) { matched = true; print(`${groups.length > 1 ? source + ':' : ''}${flags.has('n') ? index + 1 + ':' : ''}${row}`); }
          });
        }
        if (status === 0 && !matched) status = 1; break;
      }
      case 'head': case 'tail': {
        let count = 10, values = args;
        if (args[0] === '-n') { count = Number(args[1]); values = args.slice(2); }
        if (!Number.isSafeInteger(count) || count < 0 || args[0] === '-n' && args[1] === undefined) { fail('nombre de lignes invalide'); break; }
        const text = read(values), rows = text.match(/[^\n]*\n|[^\n]+$/g) || [];
        output = (name === 'head' ? rows.slice(0, count) : count ? rows.slice(-count) : []).join(''); break;
      }
      case 'wc': {
        const { flags, values } = operands(args, 'lwc');
        const sources = values.length ? values : ['-'];
        const totals = [0, 0, 0];
        const format = (counts) => counts.filter((_, index) => !flags.size || flags.has('lwc'[index])).join(' ');
        for (const source of sources) {
          const before = errors.length, text = read([source]);
          if (errors.length > before) continue;
          const counts = [(text.match(/\n/g) || []).length, (text.match(/\S+/g) || []).length, new TextEncoder().encode(text).length];
          counts.forEach((value, index) => { totals[index] += value; });
          print(format(counts) + (source === '-' ? '' : ' ' + source));
        }
        if (sources.length > 1) print(format(totals) + ' total'); break;
      }
      case 'neofetch': print('Ubuntu 26.04 · Bureau portfolio\nInterface : GNOME 50 / Yaru\nTerminal : shell virtuel\nUtilisateur : ibrahim'); break;
      default: fail('commande introuvable'); status = 127;
    }
  } catch (error) { fail(error.message); if (name === 'grep') status = 2; }
  return { output, errors, status };
}

export function executeShell(source, { files, cwd = ROOT, previousDirectory = null, status = 0 }) {
  const result = { files, cwd, previousDirectory, status, output: '', errors: [], effects: [], clear: false, exit: false };
  let lists;
  try { lists = parseShell(source); }
  catch (error) { return { ...result, status: 2, errors: [`bash: ${error.message}`] }; }
  for (const { condition, pipeline } of lists) {
    if (condition === '&&' && result.status !== 0 || condition === '||' && result.status === 0) continue;
    let input = '';
    for (const command of pipeline) {
      const context = { ...result, effects: result.effects };
      let destination = null, prepared = true;
      for (const redirect of command.redirects) {
        const target = normalizePath(wordValue(redirect.destination), context.cwd);
        if (redirect.operator === '<') {
          if (!Object.hasOwn(context.files, target) || isDirectory(context.files, target) || context.files[target] === CV_DOCUMENT) { result.errors.push(`bash: ${target}: fichier texte non disponible`); prepared = false; break; }
          input = context.files[target];
        } else {
          if (!isDirectory(context.files, parentOf(target)) || !canModifyPath(context.files, target) || isDirectory(context.files, target)) { result.errors.push(`bash: ${target}: emplacement protégé ou non disponible`); prepared = false; break; }
          context.files = { ...context.files, [target]: redirect.operator === '>>' ? context.files[target] ?? '' : '' };
          destination = target;
        }
      }
      result.files = context.files;
      if (!prepared) { result.status = 1; input = ''; continue; }
      const response = runCommand(command.words.map(wordValue), context, input);
      if (destination) context.files = { ...context.files, [destination]: context.files[destination] + response.output };
      result.files = context.files;
      result.status = response.status;
      result.errors.push(...response.errors);
      input = destination ? '' : response.output;
      // A pipeline runs builtins in child shell contexts; cd/exit cannot alter the parent.
      if (pipeline.length === 1) {
        result.cwd = context.cwd; result.previousDirectory = context.previousDirectory;
        result.clear ||= context.clear; result.exit ||= context.exit;
      }
    }
    result.output += input;
    if (result.exit) break;
  }
  return result;
}

export function completeShell(source, cursor, files, cwd) {
  const before = source.slice(0, cursor);
  let tokens;
  try { tokens = shellTokens(before, true); } catch { return { value: source, cursor, matches: [] }; }
  const last = tokens.at(-1), token = last?.type === 'word' && last.end === cursor ? last : { value: '', start: cursor, end: cursor };
  const segment = tokens.slice(tokens.findLastIndex((item) => item.type === 'operator' && [';', '|', '&&', '||'].includes(item.value)) + 1);
  const commandPosition = !segment.length || segment.length === 1 && token === last;
  let matches;
  if (commandPosition && !token.value.includes('/')) matches = SHELL_COMMANDS.filter((name) => name.startsWith(token.value));
  else {
    const slash = token.value.lastIndexOf('/'), prefix = token.value.slice(0, slash + 1), partial = token.value.slice(slash + 1);
    const directory = normalizePath(prefix.startsWith('~/') ? ROOT + prefix.slice(1) : prefix || '.', cwd);
    matches = isDirectory(files, directory) ? listDirectory(files, directory).filter(([name, type]) => name.startsWith(partial) && (!name.startsWith('.') || partial.startsWith('.')) && (segment[0]?.value !== 'cd' || type === 'dir')).map(([name, type]) => prefix + name + (type === 'dir' ? '/' : '')) : [];
  }
  if (!matches.length) return { value: source, cursor, matches };
  let common = matches[0];
  for (const match of matches) while (!match.startsWith(common)) common = common.slice(0, -1);
  const escaped = common.replace(/([^a-zA-Z0-9_./~\-\p{L}\p{N}])/gu, '\\$1');
  const suffix = matches.length === 1 && !common.endsWith('/') ? ' ' : '';
  const replacement = escaped + suffix;
  const remainder = token.quote && source[cursor] === token.quote ? source.slice(cursor + 1) : source.slice(cursor);
  return { value: source.slice(0, token.start) + replacement + remainder, cursor: token.start + replacement.length, matches };
}

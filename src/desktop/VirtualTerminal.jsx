import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Menu, Plus, Search, X } from 'lucide-react';
import { DIRECTORY_MARKER, displayPath, isDirectory, listDirectory, normalizePath, ROOT, writeFiles } from './virtualFs';

function prompt(cwd) { return `guest@ubuntu:${displayPath(cwd)}$`; }

export default function VirtualTerminal(props) {
  const nextId = useRef(2);
  const [tabs, setTabs] = useState([{ id: 1, title: 'guest@ubuntu: ~' }]);
  const [activeId, setActiveId] = useState(1);
  const [menu, setMenu] = useState(null);
  const [fontSize, setFontSize] = useState(14);
  const [search, setSearch] = useState('');
  function addTab() { const id = nextId.current++; setTabs((current) => [...current, { id, title: 'guest@ubuntu: ~' }]); setActiveId(id); setMenu(null); }
  function closeTab(id) {
    if (tabs.length === 1) { props.onClose?.(); return; }
    const remaining = tabs.filter((tab) => tab.id !== id);
    setTabs(remaining);
    if (activeId === id) setActiveId(remaining.at(-1).id);
  }
  return <div className="ubuntu-terminal" style={{ '--terminal-font-size': `${fontSize}px` }} onKeyDown={(event) => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 't') { event.preventDefault(); addTab(); }
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'w') { event.preventDefault(); closeTab(activeId); }
    if (event.key === 'Escape') setMenu(null);
  }}>
    <div className="ubuntu-terminal__chrome">
      <button aria-label="Nouvel onglet" onClick={addTab}><Plus size={18} /></button>
      <div className="ubuntu-terminal__tabs" role="tablist" aria-label="Sessions du terminal">{tabs.map((tab) => <div key={tab.id} className={`ubuntu-terminal__tab ${tab.id === activeId ? 'is-active' : ''}`}><button role="tab" aria-selected={tab.id === activeId} onClick={() => setActiveId(tab.id)}><span className="ubuntu-terminal__tab-dot" />{tab.title}</button><button aria-label={`Fermer ${tab.title}`} onClick={() => closeTab(tab.id)}><X size={13} /></button></div>)}</div>
      <button aria-label="Liste des onglets" onClick={() => setMenu(menu === 'tabs' ? null : 'tabs')}><ChevronDown size={16} /></button>
      <button aria-label="Menu du terminal" onClick={() => setMenu(menu === 'main' ? null : 'main')}><Menu size={18} /></button>
    </div>
    {menu && <div className="ubuntu-app-popover ubuntu-terminal__menu">{menu === 'tabs' ? tabs.map((tab) => <button key={tab.id} onClick={() => { setActiveId(tab.id); setMenu(null); }}>{tab.title}{tab.id === activeId ? ' ✓' : ''}</button>) : <><button onClick={addTab}>Nouvel onglet <kbd>Ctrl+Maj+T</kbd></button><button onClick={() => setMenu('search')}><Search size={15} /> Rechercher</button><div className="ubuntu-terminal__zoom"><button aria-label="Réduire le texte" onClick={() => setFontSize(Math.max(10, fontSize - 1))}>−</button><button onClick={() => setFontSize(14)}>{Math.round(fontSize / 14 * 100)} %</button><button aria-label="Agrandir le texte" onClick={() => setFontSize(Math.min(24, fontSize + 1))}>+</button></div><button onClick={() => closeTab(activeId)}>Fermer l’onglet <kbd>Ctrl+Maj+W</kbd></button></>}{menu === 'search' && <input autoFocus aria-label="Rechercher dans le terminal" placeholder="Rechercher…" value={search} onChange={(event) => setSearch(event.target.value)} />}</div>}
    {tabs.map((tab) => <div key={tab.id} className="ubuntu-terminal__session" hidden={tab.id !== activeId}><TerminalSession {...props} active={tab.id === activeId} search={search} onExit={() => closeTab(tab.id)} onDirectoryChange={(cwd) => setTabs((current) => current.map((item) => item.id === tab.id ? { ...item, title: `guest@ubuntu: ${displayPath(cwd)}` } : item))} /></div>)}
  </div>;
}

function TerminalSession({ files, setFiles, onOpenFile, active, search, onExit, onDirectoryChange }) {
  const [cwd, setCwd] = useState(ROOT);
  const [lines, setLines] = useState([]);
  const [command, setCommand] = useState('');
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const historyRef = useRef([]);
  const historyIndex = useRef(-1);

  useEffect(() => { if (active) inputRef.current?.focus(); }, [active]);
  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [lines]);

  function print(value = '') { setLines((current) => [...current, ...String(value).split('\n')]); }

  function execute(raw) {
    const trimmed = raw.trim();
    setLines((current) => [...current, `${prompt(cwd)} ${raw}`]);
    if (!trimmed) return;
    historyRef.current = [trimmed, ...historyRef.current.filter((item) => item !== trimmed)].slice(0, 40);
    historyIndex.current = -1;
    const tokens = trimmed.match(/"[^"]*"|'[^']*'|\S+/g) || [];
    const [name, ...args] = tokens.map((token) => token.replace(/^(['"])(.*)\1$/, '$2'));
    const rest = args.join(' ');
    switch (name.toLowerCase()) {
      case 'help': print('help  ls  cd  pwd  cat  touch  mkdir  echo  clear  date  whoami  open  exit\nLes commandes travaillent dans les fichiers de ce bureau web.'); break;
      case 'exit': onExit(); break;
      case 'mkdir': {
        if (!args[0]) { print('mkdir: opérande manquant'); break; }
        const target = normalizePath(args[0], cwd);
        if (Object.hasOwn(files, target) || isDirectory(files, target)) print(`mkdir: ${args[0]}: existe déjà`);
        else { const next = { ...files, [target]: DIRECTORY_MARKER }; setFiles(next); writeFiles(next); }
        break;
      }
      case 'clear': setLines([]); break;
      case 'pwd': print(cwd); break;
      case 'whoami': print('guest'); break;
      case 'date': print(new Date().toString()); break;
      case 'ls': {
        const target = args[0] ? normalizePath(args[0], cwd) : cwd;
        print(listDirectory(files, target).map(([entry, type]) => type === 'dir' ? `${entry}/` : entry).join('  ') || '');
        break;
      }
      case 'cd': {
        const target = normalizePath(args[0] || ROOT, cwd);
        const isDir = isDirectory(files, target);
        if (isDir) { setCwd(target); onDirectoryChange(target); }
        else print(`cd: ${args[0]}: Aucun fichier ou dossier de ce type`);
        break;
      }
      case 'cat': {
        const target = normalizePath(args[0] || '', cwd);
        if (files[target] !== undefined && !isDirectory(files, target)) print(files[target]);
        else print(`cat: ${args[0] || ''}: Aucun fichier ou dossier de ce type`);
        break;
      }
      case 'touch': {
        const target = normalizePath(args[0] || '', cwd);
        if (!args[0]) print('touch: opérande manquant');
        else if (isDirectory(files, target)) print(`touch: ${args[0]}: est un dossier`);
        else { const next = { ...files, [target]: files[target] ?? '' }; setFiles(next); writeFiles(next); }
        break;
      }
      case 'echo': print(rest.replace(/^(['"])(.*)\1$/, '$2')); break;
      case 'open': {
        const target = normalizePath(args[0] || '', cwd);
        if (files[target] !== undefined && !isDirectory(files, target)) onOpenFile(target); else print(`open: ${args[0] || ''}: fichier introuvable`);
        break;
      }
      case 'neofetch': print('        .--.       OS: Ubuntu 26.04 LTS\n       |o_o |      Shell: GNOME 50\n       |:_/ |      Terminal: portfolio\n      //   \\ \\     Theme: Yaru'); break;
      default: print(`${name}: commande introuvable`);
    }
  }

  function handleKeyDown(event) {
    if (event.ctrlKey && event.key.toLowerCase() === 'l') { event.preventDefault(); setLines([]); }
    if (event.ctrlKey && event.key.toLowerCase() === 'c' && !event.shiftKey) { event.preventDefault(); print(`${prompt(cwd)} ${command}^C`); setCommand(''); }
    if (event.key === 'Enter') { execute(command); setCommand(''); }
    if (event.key === 'ArrowUp') { event.preventDefault(); const next = Math.min(historyIndex.current + 1, historyRef.current.length - 1); historyIndex.current = next; setCommand(historyRef.current[next] || ''); }
    if (event.key === 'ArrowDown') { event.preventDefault(); const next = Math.max(historyIndex.current - 1, -1); historyIndex.current = next; setCommand(historyIndex.current < 0 ? '' : historyRef.current[next]); }
    if (event.key === 'Tab') { event.preventDefault(); const words = command.split(' '); const partial = words.at(-1); const match = listDirectory(files, cwd).find(([entry]) => entry.startsWith(partial)); if (match) setCommand([...words.slice(0, -1), `${match[0]}${match[1] === 'dir' ? '/' : ''}`].join(' ')); }
  }

  return <div className="ubuntu-terminal__pane" onClick={() => { if (!window.getSelection()?.toString()) inputRef.current?.focus(); }}>
    <div className="ubuntu-terminal__output" ref={scrollRef} aria-live="polite">
      {lines.map((line, index) => <div key={`${index}-${line}`} className={`ubuntu-terminal__line ${search && line.toLocaleLowerCase().includes(search.toLocaleLowerCase()) ? 'is-match' : ''}`}>{line || '\u00a0'}</div>)}
      <div className="ubuntu-terminal__input-line"><span><b>guest@ubuntu</b>:<strong>{displayPath(cwd)}</strong>$</span><input ref={inputRef} value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={handleKeyDown} aria-label="Commande du terminal" spellCheck="false" autoComplete="off" /></div>
    </div>
  </div>;
}

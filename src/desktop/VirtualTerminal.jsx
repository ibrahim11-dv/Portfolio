import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import TerminalWindow from './TerminalWindow';
import { displayPath, isDirectory, ROOT, writeFiles } from './virtualFs';
import { completeShell, executeShell } from './terminalShell';
import { PROFILE } from './portfolioData';

function prompt(cwd) { return `ibrahim@ubuntu:${displayPath(cwd)}$`; }

export default function VirtualTerminal(props) {
  return <TerminalWindow {...props} Session={TerminalSession} />;
}

function TerminalSession({ ref, files, setFiles, onOpenFile, active, search, searchIndex = 0, onSearchCount, onExit, onDirectoryChange, onOpenPortfolio, onOpenCV, initialSession, initialDirectory = ROOT, navigationRequest = 0 }) {
  const [cwd, setCwd] = useState(initialSession?.cwd || initialDirectory);
  const [lines, setLines] = useState(initialSession?.lines || [`${PROFILE.name} — ${PROFILE.role}`, 'Bienvenue sur mon bureau. Tapez projects, skills, contact ou help.', '']);
  const [command, setCommand] = useState(initialSession?.command || '');
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const historyRef = useRef(initialSession?.history || []);
  const historyIndex = useRef(-1);
  const historyDraft = useRef('');
  const completionRef = useRef(null);
  const shellRef = useRef({ previousDirectory: initialSession?.previousDirectory || null, status: initialSession?.status || 0 });
  const matches = useMemo(() => {
    if (!search) return [];
    const needle = search.toLocaleLowerCase();
    return lines.flatMap((line, lineIndex) => {
      const found = [];
      const lowered = line.toLocaleLowerCase();
      let offset = lowered.indexOf(needle);
      while (offset >= 0) {
        found.push({ line: lineIndex, offset, length: search.length });
        offset = lowered.indexOf(needle, offset + needle.length);
      }
      return found;
    });
  }, [lines, search]);
  useImperativeHandle(ref, () => ({
    getSnapshot: () => ({ cwd, lines: [...lines], command, history: [...historyRef.current], ...shellRef.current }),
    focus: () => inputRef.current?.focus({ preventScroll: true }),
    reset: () => { setLines([]); setCommand(''); },
    paste: (text) => { setCommand((current) => current + text); inputRef.current?.focus(); },
  }), [cwd, lines, command]);
  useEffect(() => { if (active) onSearchCount?.(matches.length); }, [active, matches.length, onSearchCount]);
  useEffect(() => {
    if (active && search) scrollRef.current?.querySelector(`[data-line-index="${matches[searchIndex]?.line}"]`)?.scrollIntoView({ block: 'center' });
  }, [active, search, searchIndex, matches]);

  useEffect(() => {
    if (!active || initialSession && !navigationRequest || !isDirectory(files, initialDirectory)) return;
    // Synchronize explicit desktop navigation while preserving the cwd of other tabs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCwd(initialDirectory);
    onDirectoryChange(initialDirectory);
    // Switching tabs or writing a file must not replay the last navigation request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDirectory, navigationRequest]);
  useEffect(() => {
    const input = inputRef.current;
    if (active && input?.closest('.ubuntu-window')?.classList.contains('is-active-window') && !document.querySelector('dialog[open]') && !input.closest('.ubuntu-terminal')?.querySelector('.ptyxis-overview')) input.focus();
  }, [active]);
  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [lines]);

  function print(value = '') { setLines((current) => [...current, ...String(value).split('\n')]); }

  function execute(raw) {
    setLines((current) => [...current, `${prompt(cwd)} ${raw}`]);
    const trimmed = raw.trim();
    if (!trimmed) return;
    historyRef.current = [trimmed, ...historyRef.current.filter((item) => item !== trimmed)].slice(0, 100);
    historyIndex.current = -1;
    historyDraft.current = '';
    const result = executeShell(raw, { files, cwd, ...shellRef.current });
    shellRef.current = { previousDirectory: result.previousDirectory, status: result.status };
    if (result.files !== files) setFiles(writeFiles(result.files));
    if (result.cwd !== cwd) { setCwd(result.cwd); onDirectoryChange(result.cwd); }
    const output = result.output.replace(/\n$/, '');
    const rows = [...(result.output ? output.split('\n') : []), ...result.errors];
    setLines((current) => [...(result.clear ? [] : current), ...rows]);
    result.effects.forEach((effect) => {
      if (effect.type === 'open') onOpenFile(effect.path);
      if (effect.type === 'cv') onOpenCV?.();
      if (effect.type === 'portfolio') onOpenPortfolio?.('profile');
    });
    if (result.exit) onExit();
  }

  function handleKeyDown(event) {
    if (event.metaKey || event.altKey) return;
    if (event.key !== 'Tab') completionRef.current = null;
    if (event.ctrlKey && event.key.toLowerCase() === 'l') { event.preventDefault(); setLines([]); }
    if (event.ctrlKey && event.key.toLowerCase() === 'c' && !event.shiftKey) {
      event.preventDefault(); print(`${prompt(cwd)} ${command}^C`); setCommand('');
      historyIndex.current = -1; historyDraft.current = ''; shellRef.current.status = 130;
    }
    if (event.ctrlKey) return;
    if (event.key === 'Enter') { execute(command); setCommand(''); }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (historyIndex.current < 0) historyDraft.current = command;
      const next = Math.min(historyIndex.current + 1, historyRef.current.length - 1);
      historyIndex.current = next;
      if (next >= 0) setCommand(historyRef.current[next]);
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex.current < 0) return;
      const next = Math.max(historyIndex.current - 1, -1);
      historyIndex.current = next; setCommand(next < 0 ? historyDraft.current : historyRef.current[next]);
    }
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      const cursor = inputRef.current?.selectionStart ?? command.length;
      const completion = completeShell(command, cursor, files, cwd);
      if (completionRef.current === command && completion.matches.length > 1) print(completion.matches.join('  '));
      setCommand(completion.value); completionRef.current = completion.value;
      requestAnimationFrame(() => inputRef.current?.setSelectionRange(completion.cursor, completion.cursor));
    }
  }

  return <div className="ubuntu-terminal__pane" onClick={() => { if (!window.getSelection()?.toString()) inputRef.current?.focus(); }}>
    <div className="ubuntu-terminal__output" ref={scrollRef} aria-live="polite">
      {lines.map((line, index) => <div key={`${index}-${line}`} data-line-index={index} className="ubuntu-terminal__line">{highlightedLine(line, index, matches, searchIndex)}</div>)}
      <div className="ubuntu-terminal__input-line"><span><b>ibrahim@ubuntu</b>:<strong>{displayPath(cwd)}</strong>$</span><input ref={inputRef} value={command} onChange={(event) => { setCommand(event.target.value); historyIndex.current = -1; completionRef.current = null; }} onKeyDown={handleKeyDown} aria-label="Commande du terminal" spellCheck="false" autoComplete="off" /></div>
    </div>
  </div>;
}

function highlightedLine(line, lineIndex, matches, currentIndex) {
  const found = matches.filter((match) => match.line === lineIndex);
  if (!found.length) return line || '\u00a0';
  const parts = [];
  let cursor = 0;
  found.forEach((match) => {
    parts.push(line.slice(cursor, match.offset));
    parts.push(<mark key={match.offset} className={match === matches[currentIndex] ? 'is-current-match' : undefined}>{line.slice(match.offset, match.offset + match.length)}</mark>);
    cursor = match.offset + match.length;
  });
  parts.push(line.slice(cursor));
  return parts;
}

import { useId, useState } from 'react';
import { ChevronRight, File, Folder } from 'lucide-react';
import { locationCompletions } from './locationCompletion';

export default function LocationEntry({ inputRef, value, onChange, files, cwd, onCancel, onSubmit }) {
  const listId = useId();
  const [query, setQuery] = useState(null);
  const [choice, setChoice] = useState(-1);
  const completion = query === null ? { matches: [], prefix: '' } : locationCompletions(files, query, cwd);

  function selectSuffix(start, end) {
    requestAnimationFrame(() => inputRef.current?.setSelectionRange(start, end));
  }

  function change(event) {
    const typed = event.target.value;
    const atEnd = event.target.selectionEnd === typed.length;
    const result = locationCompletions(files, typed, cwd);
    const inserted = event.nativeEvent.inputType?.startsWith('insert');
    setQuery(atEnd ? typed : null);
    setChoice(-1);
    if (atEnd && inserted && result.prefix.length > typed.length) {
      onChange(result.prefix);
      selectSuffix(typed.length, result.prefix.length);
    } else onChange(typed);
  }

  function accept(match) {
    onChange(match.value);
    setQuery(null);
    setChoice(-1);
    inputRef.current?.focus({ preventScroll: true });
    selectSuffix(match.value.length, match.value.length);
  }

  function keyDown(event) {
    if (event.ctrlKey && event.key.toLowerCase() === 'l') { setQuery(null); return; }
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onCancel(); return; }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (['ArrowDown', 'ArrowUp'].includes(event.key) && completion.matches.length) {
      event.preventDefault(); event.stopPropagation();
      const next = choice < 0 ? event.key === 'ArrowDown' ? 0 : completion.matches.length - 1 : (choice + (event.key === 'ArrowDown' ? 1 : -1) + completion.matches.length) % completion.matches.length;
      setChoice(next);
      onChange(completion.matches[next].value);
      selectSuffix(query.length, completion.matches[next].value.length);
      return;
    }
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault(); event.stopPropagation();
      const input = inputRef.current;
      if (input.selectionStart !== input.selectionEnd) {
        input.setSelectionRange(value.length, value.length);
        setQuery(null);
      } else if (completion.prefix.length > value.length) {
        onChange(completion.prefix);
        selectSuffix(completion.prefix.length, completion.prefix.length);
        setQuery(null);
      }
    }
    if (event.key === 'Enter' && choice >= 0 && completion.matches[choice]) {
      event.preventDefault(); event.stopPropagation(); accept(completion.matches[choice]);
    }
  }

  return <form className="ubuntu-files__location" onSubmit={onSubmit}>
    <input ref={inputRef} value={value} onChange={change} onKeyDown={keyDown} onBlur={() => setQuery(null)} aria-label="Emplacement" role="combobox" aria-autocomplete="both" aria-expanded={Boolean(completion.matches.length)} aria-controls={listId} aria-activedescendant={choice >= 0 && completion.matches[choice] ? `${listId}-${choice}` : undefined} spellCheck={false} autoComplete="off" />
    <button type="submit" aria-label="Ouvrir l’emplacement"><ChevronRight size={17} /></button>
    {completion.matches.length > 0 && <div className="ubuntu-files__location-completions" role="listbox" id={listId} aria-label="Emplacements suggérés">
      {completion.matches.map((match, index) => <button key={match.value} type="button" role="option" id={`${listId}-${index}`} aria-selected={index === choice} tabIndex={-1} onPointerDown={(event) => event.preventDefault()} onClick={() => accept(match)}>{match.type === 'dir' ? <Folder size={16} /> : <File size={16} />}<span>{match.value}</span></button>)}
    </div>}
  </form>;
}

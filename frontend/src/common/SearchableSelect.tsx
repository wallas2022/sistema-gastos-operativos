import { useEffect, useId, useMemo, useState } from 'react';

export type SearchableOption = { value: string; label: string };

export function SearchableSelect({ options, value, onChange, placeholder, disabled, style }: { options: SearchableOption[]; value: string; onChange: (value: string) => void; placeholder?: string; disabled?: boolean; style?: React.CSSProperties }) {
  const listId = useId();
  const selectedLabel = useMemo(() => options.find((option) => option.value === value)?.label || '', [options, value]);
  const [query, setQuery] = useState(selectedLabel);
  useEffect(() => { setQuery(selectedLabel); }, [selectedLabel]);
  const visibleOptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    if (!normalized || selectedLabel === query) return options.slice(0, 5);
    return options.filter((option) => option.label.toLocaleLowerCase('es').includes(normalized)).slice(0, 5);
  }, [options, query, selectedLabel]);
  return <>
    <input list={listId} value={query} placeholder={placeholder} disabled={disabled} style={style} autoComplete="off" onChange={(event) => { const text = event.target.value; setQuery(text); const selected = options.find((option) => option.label === text); onChange(selected?.value || ''); }} />
    <datalist id={listId}>{visibleOptions.map((option) => <option key={option.value} value={option.label} />)}</datalist>
  </>;
}

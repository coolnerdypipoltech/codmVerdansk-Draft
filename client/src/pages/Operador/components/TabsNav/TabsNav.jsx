import './TabsNav.css';

const TABS = [
  { id: 'datos', label: '1 · Datos' },
  { id: 'draft', label: '2 · Draft en vivo' },
  { id: 'result', label: '3 · Resultados' },
];

export default function TabsNav({ active, onChange }) {
  return (
    <div className="tabsnav" role="tablist">
      {TABS.map((t) => (
        <button
          key={t.id}
          className="tabsnav__tab"
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';

const PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  '#ffffff', '#e5e7eb', '#9ca3af', '#6b7280', '#374151',
  '#fbbf24', '#34d399', '#60a5fa', '#c084fc', '#fb7185',
];

export default function ColorPicker({ color, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-3 h-3 rounded-full border border-white/20 cursor-pointer shrink-0"
        style={{ backgroundColor: color }}
        title="Change color"
      />
      {open && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-2 shadow-xl"
             style={{ width: 160 }}>
          <div className="grid grid-cols-5 gap-1">
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => { onChange(c); setOpen(false); }}
                className={`w-6 h-6 rounded-full cursor-pointer border-2 transition-transform hover:scale-110 ${
                  c === color ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1">
            <input
              type="color"
              value={color}
              onChange={(e) => { onChange(e.target.value); setOpen(false); }}
              className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
            />
            <span className="text-[9px] text-[var(--text-muted)]">Custom</span>
          </div>
        </div>
      )}
    </div>
  );
}

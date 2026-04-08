import { useState, useRef, useEffect } from 'react';

const FIXED_COLORS = [
  '#ffffff',  // White
  '#000000',  // Black
  '#1d428a',  // NBA Blue
  '#c8102e',  // NBA Red
];

export default function ColorPicker({ color, onChange, teamColors }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Build palette: primary, secondary, then fixed colors — deduplicated
  const seen = new Set();
  const palette = [];
  const add = (c) => {
    const key = c.toLowerCase();
    if (!seen.has(key)) { seen.add(key); palette.push(c); }
  };
  if (teamColors?.primary) add(teamColors.primary);
  if (teamColors?.secondary) add(teamColors.secondary);
  FIXED_COLORS.forEach(add);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-3 h-3 rounded-full border border-white/20 cursor-pointer shrink-0"
        style={{ backgroundColor: color }}
        title="Change color"
      />
      {open && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-2 shadow-xl">
          <div className="flex gap-1.5">
            {palette.map((c) => (
              <button
                key={c}
                onClick={() => { onChange(c); setOpen(false); }}
                className={`w-6 h-6 rounded-full cursor-pointer border-2 transition-transform hover:scale-110 ${
                  c.toLowerCase() === color.toLowerCase() ? 'border-white scale-110' : 'border-transparent'
                } ${c === '#000000' ? 'ring-1 ring-white/20' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

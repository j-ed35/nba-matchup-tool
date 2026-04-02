export default function ModeToggle({ mode, onModeChange }) {
  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex rounded-lg bg-[var(--bg-card)] p-1 border border-[var(--border-color)]">
        <button
          onClick={() => onModeChange('season')}
          className={`px-5 py-2 text-sm font-medium rounded-md transition-all ${
            mode === 'season'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Season
        </button>
        <button
          onClick={() => onModeChange('h2h')}
          className={`px-5 py-2 text-sm font-medium rounded-md transition-all ${
            mode === 'h2h'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Head-to-Head
        </button>
      </div>
    </div>
  );
}

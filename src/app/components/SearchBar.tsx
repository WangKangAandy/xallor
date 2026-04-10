import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ChevronRight, Plus, X, Check } from 'lucide-react';
import { loadSearchPayload, saveSearchPayload } from '../storage/repository';
import { FaviconIcon } from './shared/FaviconIcon';

interface SearchEngine {
  id: string;
  name: string;
  domain: string;
  searchUrl: string;
}

const DEFAULT_ENGINES: SearchEngine[] = [
  { id: 'google',     name: 'Google',     domain: 'google.com',       searchUrl: 'https://www.google.com/search?q=' },
  { id: 'bing',       name: 'Bing',       domain: 'bing.com',         searchUrl: 'https://www.bing.com/search?q=' },
  { id: 'duckduckgo', name: 'DuckDuckGo', domain: 'duckduckgo.com',   searchUrl: 'https://duckduckgo.com/?q=' },
  { id: 'baidu',      name: '百度',        domain: 'baidu.com',        searchUrl: 'https://www.baidu.com/s?wd=' },
  { id: 'brave',      name: 'Brave',      domain: 'search.brave.com', searchUrl: 'https://search.brave.com/search?q=' },
];

interface AddEngineFormProps {
  onAdd: (engine: SearchEngine) => void;
  onCancel: () => void;
}

function AddEngineForm({ onAdd, onCancel }: AddEngineFormProps) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !domain.trim() || !url.trim()) return;
    onAdd({
      id: `custom-${Date.now()}`,
      name: name.trim(),
      domain: domain.trim(),
      searchUrl: url.trim(),
    });
  };

  return (
    <div className="px-3 py-2 space-y-2">
      <p className="text-xs text-gray-500 mb-1">添加自定义搜索引擎</p>
      <input
        autoFocus
        placeholder="名称 (e.g. Bing)"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full text-xs bg-white/40 border border-white/50 rounded-lg px-2.5 py-1.5 outline-none placeholder-gray-400 text-gray-700"
      />
      <input
        placeholder="域名 (e.g. bing.com)"
        value={domain}
        onChange={e => setDomain(e.target.value)}
        className="w-full text-xs bg-white/40 border border-white/50 rounded-lg px-2.5 py-1.5 outline-none placeholder-gray-400 text-gray-700"
      />
      <input
        placeholder="搜索URL (以 %s 代替关键词)"
        value={url}
        onChange={e => setUrl(e.target.value)}
        className="w-full text-xs bg-white/40 border border-white/50 rounded-lg px-2.5 py-1.5 outline-none placeholder-gray-400 text-gray-700"
      />
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          className="flex-1 flex items-center justify-center gap-1 text-xs bg-white/50 hover:bg-white/70 rounded-lg py-1.5 text-gray-700 transition-all"
        >
          <Check className="w-3 h-3" /> 确认
        </button>
        <button
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1 text-xs bg-white/30 hover:bg-white/50 rounded-lg py-1.5 text-gray-500 transition-all"
        >
          <X className="w-3 h-3" /> 取消
        </button>
      </div>
    </div>
  );
}

export function SearchBar() {
  const [engines, setEngines] = useState<SearchEngine[]>(DEFAULT_ENGINES);
  const [selected, setSelected] = useState<SearchEngine>(DEFAULT_ENGINES[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const persisted = await loadSearchPayload({
        engines: DEFAULT_ENGINES,
        selectedEngineId: DEFAULT_ENGINES[0].id,
      });
      if (cancelled) return;
      setEngines(persisted.engines);
      const selectedEngine = persisted.engines.find((item) => item.id === persisted.selectedEngineId) ?? persisted.engines[0];
      if (selectedEngine) {
        setSelected(selectedEngine);
      }
      hydratedRef.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current || engines.length === 0) return;
    const timer = globalThis.setTimeout(() => {
      void saveSearchPayload({
        engines,
        selectedEngineId: selected.id,
      });
    }, 400);
    return () => globalThis.clearTimeout(timer);
  }, [engines, selected]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowAddForm(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      const url = selected.searchUrl.includes('%s')
        ? selected.searchUrl.replace('%s', encodeURIComponent(query.trim()))
        : selected.searchUrl + encodeURIComponent(query.trim());
      window.open(url, '_blank');
    }
  };

  const handleSelectEngine = (engine: SearchEngine) => {
    setSelected(engine);
    setIsOpen(false);
    setShowAddForm(false);
  };

  const handleAddEngine = (engine: SearchEngine) => {
    setEngines(prev => [...prev, engine]);
    setShowAddForm(false);
  };

  return (
    <div className="w-full max-w-2xl relative" ref={containerRef}>
      {/* Search Input Row */}
      <div className="backdrop-blur-md bg-white/40 rounded-full px-5 py-4 shadow-lg border border-white/50 flex items-center gap-3">
        {/* Engine Selector Trigger */}
        <button
          onClick={() => { setIsOpen(v => !v); setShowAddForm(false); }}
          className="flex items-center gap-1.5 rounded-full px-1.5 py-1 hover:bg-white/40 transition-all group shrink-0"
          aria-label="选择搜索引擎"
        >
          {/* Engine favicon – hollow/ghosted style */}
          <div
            className="relative"
            style={{
              filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.8))',
              opacity: 0.75,
            }}
          >
            <FaviconIcon
              domain={selected.domain}
              name={selected.name}
              size={20}
              className="rounded-sm object-contain"
              style={{ imageRendering: 'auto' }}
            />
          </div>
          {/* Right-pointing chevron rotates down when open */}
          <ChevronRight
            className="w-3.5 h-3.5 text-gray-500 transition-transform duration-300"
            style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
            strokeWidth={2.5}
          />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-400/40 shrink-0" />

        {/* Text Input */}
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleSearch}
          placeholder={`用 ${selected.name} 搜索…`}
          className="flex-1 bg-transparent outline-none placeholder-gray-400 text-gray-800 min-w-0"
        />
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-3 z-50 backdrop-blur-xl bg-white/50 border border-white/50 rounded-2xl shadow-2xl overflow-hidden min-w-[140px] max-w-[240px]"
        >
          {/* Engine List */}
          <div className="p-2 space-y-0.5">
            {engines.map(engine => (
              <button
                key={engine.id}
                onClick={() => handleSelectEngine(engine)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/60 text-left ${
                  selected.id === engine.id ? 'bg-white/60' : ''
                }`}
              >
                <FaviconIcon
                  domain={engine.domain}
                  name={engine.name}
                  size={18}
                  className="rounded-sm object-contain"
                  style={{ imageRendering: 'auto' }}
                />
                <span className="text-sm text-gray-700 flex-1 whitespace-nowrap">{engine.name}</span>
                {selected.id === engine.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-white/40" />

          {/* Add Custom / Form */}
          <div className="p-2">
            {showAddForm ? (
              <AddEngineForm
                onAdd={handleAddEngine}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                title="添加自定义搜索引擎"
                className="w-full flex items-center justify-center py-2 rounded-xl hover:bg-white/50 transition-all text-gray-500"
              >
                <div className="w-[20px] h-[20px] rounded-full border-[1.5px] border-dashed border-gray-400 flex items-center justify-center shrink-0">
                  <Plus className="w-3 h-3" strokeWidth={2.5} />
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
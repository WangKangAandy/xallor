import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useOpenExternalUrl } from '../navigation';
import { ChevronRight, Plus, X, Check } from 'lucide-react';
import { loadSearchPayload, saveSearchPayload } from '../storage/repository';
import { FaviconIcon } from './shared/FaviconIcon';
import { GlassSurface } from './shared/GlassSurface';
import { Z_SEARCH_BAR, Z_SEARCH_DROPDOWN } from './desktopGridLayers';
import { useDismissOnPointerDownOutside } from './useDismissOnPointerDownOutside';
import { useUiPreferences } from "../preferences";
import { useAppI18n } from "../i18n/AppI18n";
import {
  getAllSearchEngines,
  getSearchEngineDisplayName,
  getSearchEngineById,
  resolveSearchEngineId,
  type SearchEngine,
} from "../search/searchEngineRegistry";

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
        data-context-native="true"
        className="w-full text-xs glass-input-fill rounded-lg px-2.5 py-1.5 outline-none placeholder-gray-400 text-gray-700"
      />
      <input
        placeholder="域名 (e.g. bing.com)"
        value={domain}
        onChange={e => setDomain(e.target.value)}
        data-context-native="true"
        className="w-full text-xs glass-input-fill rounded-lg px-2.5 py-1.5 outline-none placeholder-gray-400 text-gray-700"
      />
      <input
        placeholder="搜索URL (以 %s 代替关键词)"
        value={url}
        onChange={e => setUrl(e.target.value)}
        data-context-native="true"
        className="w-full text-xs glass-input-fill rounded-lg px-2.5 py-1.5 outline-none placeholder-gray-400 text-gray-700"
      />
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          className="flex-1 flex items-center justify-center gap-1 text-xs glass-add-engine-btn-confirm rounded-lg py-1.5 text-gray-700"
        >
          <Check className="w-3 h-3" /> 确认
        </button>
        <button
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1 text-xs glass-add-engine-btn-cancel rounded-lg py-1.5 text-gray-500"
        >
          <X className="w-3 h-3" /> 取消
        </button>
      </div>
    </div>
  );
}

export function SearchBar() {
  const openUrl = useOpenExternalUrl();
  const { locale } = useAppI18n();
  const { selectedSearchEngineId, setSearchEngine } = useUiPreferences();
  const initialEngines = getAllSearchEngines();
  const [engines, setEngines] = useState<SearchEngine[]>(initialEngines);
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);
  const selected =
    getSearchEngineById(selectedSearchEngineId, engines) ??
    getSearchEngineById(resolveSearchEngineId(null, engines), engines) ??
    initialEngines[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const persisted = await loadSearchPayload({
        engines: getAllSearchEngines(),
        selectedEngineId: selectedSearchEngineId,
      });
      if (cancelled) return;
      setEngines(persisted.engines);
      hydratedRef.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (engines.length === 0) return;
    const resolved = resolveSearchEngineId(selectedSearchEngineId, engines);
    if (resolved !== selectedSearchEngineId) {
      setSearchEngine(resolved);
    }
  }, [engines, selectedSearchEngineId, setSearchEngine]);

  useEffect(() => {
    if (!hydratedRef.current || engines.length === 0) return;
    void saveSearchPayload({
      engines,
      selectedEngineId: selected.id,
    });
  }, [engines, selected.id]);

  useDismissOnPointerDownOutside(containerRef, isOpen || showAddForm, () => {
    setIsOpen(false);
    setShowAddForm(false);
  });

  const handleSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      const url = selected.searchUrl.includes('%s')
        ? selected.searchUrl.replace('%s', encodeURIComponent(query.trim()))
        : selected.searchUrl + encodeURIComponent(query.trim());
      openUrl(url, e);
    }
  };

  const handleSelectEngine = (engine: SearchEngine) => {
    setSearchEngine(engine.id);
    setIsOpen(false);
    setShowAddForm(false);
  };

  const handleAddEngine = (engine: SearchEngine) => {
    setEngines(prev => [...prev, engine]);
    setShowAddForm(false);
  };

  return (
    <div
      className="relative w-full max-w-2xl"
      style={{ zIndex: Z_SEARCH_BAR }}
      ref={containerRef}
      data-search-bar-root="true"
      data-context-entity="true"
      data-context-entity-type="search"
    >
      {/* Search Input Row */}
      <GlassSurface variant="bar" rounded="full" className="flex w-full items-center gap-3 px-5 py-4">
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
            className="h-3.5 w-3.5 text-gray-500 transition-transform duration-300 dark:text-slate-400"
            style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
            strokeWidth={2.5}
          />
        </button>

        {/* Divider */}
        <div className="h-5 w-px shrink-0 bg-gray-400/40 dark:bg-slate-500/50" />

        {/* Text Input */}
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleSearch}
          data-context-native="true"
          aria-label={locale === "en-US" ? "Search" : "搜索"}
          className="min-w-0 flex-1 bg-transparent text-gray-800 outline-none placeholder-gray-400 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </GlassSurface>

      {/* Dropdown Panel */}
      {isOpen && (
        <GlassSurface
          variant="default"
          rounded="2xl"
          className="absolute left-0 top-full mt-3 min-w-[140px] max-w-[240px] overflow-hidden shadow-[0_20px_52px_-18px_rgba(0,0,0,0.38)] border-white/70 dark:border-white/15 bg-[rgb(248_247_243_/_0.76)] dark:bg-[rgb(30_34_42_/_0.72)] backdrop-blur-[20px]"
          style={{ zIndex: Z_SEARCH_DROPDOWN }}
        >
          {/* Engine List */}
          <div className="p-2 space-y-0.5">
            {engines.map(engine => (
              <button
                key={engine.id}
                onClick={() => handleSelectEngine(engine)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-white/72 dark:hover:bg-white/12 ${
                  selected.id === engine.id ? "bg-white/78 dark:bg-white/18" : ""
                }`}
              >
                <FaviconIcon
                  domain={engine.domain}
                  name={engine.name}
                  size={18}
                  className="rounded-sm object-contain"
                  style={{ imageRendering: 'auto' }}
                />
                <span className="flex-1 whitespace-nowrap text-sm text-gray-700 dark:text-slate-200">
                  {getSearchEngineDisplayName(engine, locale)}
                </span>
                {selected.id === engine.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-white/55 dark:border-white/15" />

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
                className="w-full flex items-center justify-center py-2 rounded-xl hover:bg-white/65 dark:hover:bg-white/12 transition-all text-gray-500"
              >
                <div className="w-[20px] h-[20px] rounded-full border-[1.5px] border-dashed border-gray-400 flex items-center justify-center shrink-0">
                  <Plus className="w-3 h-3" strokeWidth={2.5} />
                </div>
              </button>
            )}
          </div>
        </GlassSurface>
      )}
    </div>
  );
}
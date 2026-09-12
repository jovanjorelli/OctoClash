import React, { useState, useEffect, useRef, memo } from 'react';
import { useAppStore } from '../../store/appStore';
import { useGitHubApi } from '../../hooks/useGitHubApi';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { RepoIcon, XIcon, ShieldLockIcon, StarIcon, FlameIcon } from '@primer/octicons-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PRESET_CATEGORIES = [
  {
    id: 'frontend',
    label: 'Frontend',
    presets: [
      { label: 'React vs Vue vs Svelte (3)', repos: ['facebook/react', 'vuejs/core', 'sveltejs/svelte'] },
      { label: 'React vs Vue (2)', repos: ['facebook/react', 'vuejs/core'] },
      { label: 'Top 5 Frameworks (5)', repos: ['facebook/react', 'vuejs/core', 'sveltejs/svelte', 'angular/angular', 'preactjs/preact'] },
      { label: 'Tailwind vs UnoCSS (2)', repos: ['tailwindlabs/tailwindcss', 'unocss/unocss'] },
    ],
  },
  {
    id: 'fullstack',
    label: 'Fullstack',
    presets: [
      { label: 'Next vs Nuxt vs SvelteKit (3)', repos: ['vercel/next.js', 'nuxt/nuxt', 'sveltejs/kit'] },
      { label: 'Vite vs Webpack vs esbuild (3)', repos: ['vitejs/vite', 'webpack/webpack', 'evanw/esbuild'] },
      { label: 'Zod vs Valibot vs Yup (3)', repos: ['colinhacks/zod', 'fabian-hiller/valibot', 'jquense/yup'] },
    ],
  },
  {
    id: 'runtimes',
    label: 'Runtimes',
    presets: [
      { label: 'Bun vs Deno vs Node (3)', repos: ['oven-sh/bun', 'denoland/deno', 'nodejs/node'] },
      { label: 'Rust CLI Titans (3)', repos: ['BurntSushi/ripgrep', 'sharkdp/bat', 'junegunn/fzf'] },
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    presets: [
      { label: 'FastAPI vs Express vs Nest (3)', repos: ['tiangolo/fastapi', 'expressjs/express', 'nestjs/nest'] },
      { label: 'Prisma vs Drizzle vs TypeORM (3)', repos: ['prisma/prisma', 'drizzle-team/drizzle-orm', 'typeorm/typeorm'] },
    ],
  },
  {
    id: 'mega',
    label: 'Mega Clash (10)',
    presets: [
      {
        label: 'Top 10 Web Titans (10 max)',
        repos: [
          'facebook/react',
          'vuejs/core',
          'sveltejs/svelte',
          'angular/angular',
          'nodejs/node',
          'denoland/deno',
          'oven-sh/bun',
          'vercel/next.js',
          'vitejs/vite',
          'tailwindlabs/tailwindcss',
        ],
      },
    ],
  },
];

function SortableRepoTag({ repo, onRemove, totalCount }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: repo });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isMany = totalCount > 5;
  const isMega = totalCount > 8;
  const shortName = repo.includes('/') ? repo.split('/')[1] : repo;
  const displayName = isMany ? shortName : repo;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...attributes} 
      {...listeners}
      title={repo}
      className={`flex items-center rounded-full bg-btn-bg border border-btn-border text-fg-default cursor-grab active:cursor-grabbing hover:bg-canvas-subtle select-none shrink-0 transition-all ${
        isMega
          ? 'gap-1 px-1.5 py-0.5 text-[11px]'
          : isMany
          ? 'gap-1.5 px-2 py-0.5 text-xs'
          : 'gap-2 px-2.5 py-0.5 text-xs'
      }`}
    >
      <RepoIcon size={isMega ? 11 : 12} className="text-fg-muted shrink-0" />
      <span className="font-semibold">{displayName}</span>
      <button 
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onRemove(repo)}
        aria-label={`Remove ${repo}`}
        className="text-fg-muted hover:text-fg-danger transition-colors cursor-pointer shrink-0"
      >
        <XIcon size={isMega ? 11 : 12} />
      </button>
    </div>
  );
}

export const RepoInput = memo(function RepoInput({ onFetchRepo }) {
  const repos = useAppStore((state) => state.repos);
  const setRepos = useAppStore((state) => state.setRepos);
  const removeRepo = useAppStore((state) => state.removeRepo);
  const reorderRepos = useAppStore((state) => state.reorderRepos);
  const infiniteMode = useAppStore((state) => state.infiniteMode);
  const setInfiniteMode = useAppStore((state) => state.setInfiniteMode);
  const { searchRepos } = useGitHubApi();

  const [activeCategory, setActiveCategory] = useState('frontend');
  const currentCategory = PRESET_CATEGORIES.find((c) => c.id === activeCategory) || PRESET_CATEGORIES[0];
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = repos.indexOf(active.id);
      const newIndex = repos.indexOf(over.id);
      reorderRepos(oldIndex, newIndex);
    }
  };
  
  const [inputValue, setInputValue] = useState('');
  const [inputWarning, setInputWarning] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const val = inputValue.trim();
    if (val.length < 3 || val.includes('/')) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    let active = true;
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchRepos(val);
        if (active) {
          setSearchResults(results);
          setSelectedIndex(-1);
          setShowDropdown(true);
          setIsSearching(false);
        }
      } catch {
        if (active) setIsSearching(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [inputValue, searchRepos]);

  const handleAdd = (e, overrideVal = null) => {
    if (e) e.preventDefault();
    const val = (overrideVal || inputValue).trim();
    if (!val || !val.includes('/')) return;
    
    if (!infiniteMode && repos.length >= 10) {
      setInputWarning('Maximum 10 repositories allowed. Enable infinite mode to add more.');
      return;
    }

    setInputWarning('');
    onFetchRepo(val);
    setInputValue('');
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      return;
    }
    
    if (!showDropdown || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        e.preventDefault();
        handleAdd(null, searchResults[selectedIndex].full_name);
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center mb-3">
      <form onSubmit={handleAdd} className="w-full flex items-center justify-center gap-2 sm:gap-3 mb-2">
        <div className="relative w-full max-w-xl" ref={dropdownRef}>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none">
            <RepoIcon />
          </span>
          <Input 
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setInputWarning('');
              setShowDropdown(true);
            }}
            onFocus={() => {
              if (searchResults.length > 0) setShowDropdown(true);
            }}
            onKeyDown={handleKeyDown}
            aria-label="Repository search"
            aria-expanded={showDropdown}
            aria-controls="autocomplete-dropdown"
            placeholder="owner/repo (e.g., facebook/react) — press '/' to focus"
            className="pl-9 pr-9 w-full"
          />
          
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin w-4 h-4 border-2 border-border-default border-t-fg-accent rounded-full" />
            </div>
          )}
          
          {showDropdown && (inputValue.length >= 3 && !inputValue.includes('/')) && (
            <div className="absolute z-50 w-full mt-1 bg-canvas-default border border-border-default rounded-md shadow-lg overflow-hidden text-left">
              {searchResults.length > 0 ? (
                <ul id="autocomplete-dropdown" role="listbox" className="max-h-64 overflow-y-auto">
                  {searchResults.map((repo, index) => (
                    <li 
                      key={repo.id}
                      role="option"
                      aria-selected={index === selectedIndex}
                      onClick={() => handleAdd(null, repo.full_name)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`px-3 py-2 hover:bg-canvas-subtle cursor-pointer border-b border-border-muted last:border-0 ${index === selectedIndex ? 'bg-canvas-subtle' : ''}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-fg-default truncate">{repo.full_name}</span>
                        <span className="flex items-center gap-1 text-xs text-fg-muted whitespace-nowrap">
                          {repo.stargazers_count.toLocaleString()} <StarIcon size={12} />
                        </span>
                      </div>
                      {repo.description && (
                        <p className="text-xs text-fg-muted truncate mt-0.5">{repo.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                !isSearching && <div className="p-3 text-sm text-fg-muted text-center">No results found</div>
              )}
            </div>
          )}
        </div>
        <Button type="submit" variant="primary">
          Add
        </Button>
        <Tooltip text="Enter repository name in 'owner/repo' format to compare their statistics, commit activity, and languages." />
      </form>

      {repos.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2 w-full max-w-6xl mx-auto px-2">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={repos} strategy={rectSortingStrategy}>
              {repos.map((repo) => (
                <SortableRepoTag
                  key={repo}
                  repo={repo}
                  onRemove={removeRepo}
                  totalCount={repos.length}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {inputWarning && (
        <div className="mb-3 text-xs font-semibold text-fg-danger text-center">
          {inputWarning}
        </div>
      )}

      {infiniteMode && (
        <div className="mb-3 flex items-center justify-center gap-2 text-xs text-fg-danger bg-canvas-subtle p-2 rounded border border-border-default max-w-xl text-center">
          <ShieldLockIcon size={14} className="shrink-0" />
          <span>Warning: Comparing an unlimited number of repositories is experimental. It may exhaust GitHub API rate limits quickly.</span>
        </div>
      )}

      <div className="flex flex-col items-center gap-2 text-xs text-fg-muted w-full max-w-6xl mx-auto pt-0.5">
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-fg-muted flex items-center gap-1 text-[11px] uppercase tracking-wide">
              <FlameIcon size={12} className="text-fg-warning" />
              Templates:
            </span>
            <div className="inline-flex rounded-md bg-canvas-subtle p-0.5 border border-border-default gap-0.5">
              {PRESET_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-0.5 rounded text-xs transition-colors cursor-pointer font-medium ${
                    activeCategory === cat.id
                      ? 'bg-canvas-default text-fg-default shadow-xs border border-border-default'
                      : 'text-fg-muted hover:text-fg-default border border-transparent'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={infiniteMode}
                onChange={(e) => setInfiniteMode(e.target.checked)}
                className="rounded border-border-default bg-canvas-default text-fg-accent focus:ring-fg-accent"
              />
              <span>Infinite Mode</span>
            </label>
            {repos.length > 0 && (
              <button
                type="button"
                onClick={() => setRepos([])}
                className="text-fg-muted hover:text-fg-danger transition-colors cursor-pointer font-medium"
              >
                Clear all ({repos.length})
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-start w-full">
          {currentCategory.presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setRepos(preset.repos)}
              className="px-2.5 py-1 rounded-md border border-border-default bg-canvas-subtle hover:bg-canvas-default hover:text-fg-default hover:border-fg-accent/50 transition-all text-xs font-medium cursor-pointer active:scale-[0.98]"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

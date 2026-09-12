import React, { useEffect, useState, useCallback, lazy, Suspense, startTransition } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { RepoInput } from './components/compare/RepoInput';
import { ComparisonTable } from './components/compare/ComparisonTable';
import { SharePanel } from './components/compare/SharePanel';
import { Alert } from './components/ui/Alert';
import { MonaOctocat } from './assets/MonaOctocat';
import { useGitHubApi } from './hooks/useGitHubApi';
import { useAppStore } from './store/appStore';
import { SettingsModal } from './components/settings/SettingsModal';

const Charts = lazy(() => import('./components/compare/Charts').then((m) => ({ default: m.Charts })));
const ReadmeModal = lazy(() => import('./components/compare/ReadmeModal').then((m) => ({ default: m.ReadmeModal })));

function App() {
  const repos = useAppStore((state) => state.repos);
  const setRepos = useAppStore((state) => state.setRepos);
  const addRepo = useAppStore((state) => state.addRepo);

  const { fetchRepoData, loading, error, setError } = useGitHubApi();

  const reposData = useAppStore((state) => state.reposData);
  const setReposData = useAppStore((state) => state.setReposData);
  const previewRepo = useAppStore((state) => state.previewRepo);
  
  const [activeTab, setActiveTab] = useState('table');
  const [isUrlInitialized, setIsUrlInitialized] = useState(false);

  useEffect(() => {
    if (!isUrlInitialized) {
      const params = new URLSearchParams(window.location.search);
      const reposParam = params.get('repos');
      if (reposParam) {
        setRepos(reposParam.split(',').filter(Boolean));
      }
      setIsUrlInitialized(true);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (repos.length > 0) {
      params.set('repos', repos.join(','));
    } else {
      params.delete('repos');
    }
    params.delete('ui');
    const nextSearch = params.toString();
    const nextUrl = nextSearch ? `${window.location.pathname}?${nextSearch}` : window.location.pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState({}, '', nextUrl);
    }
  }, [repos, isUrlInitialized, setRepos]);

  useEffect(() => {
    let isMounted = true;

    const loadMissing = async () => {
      if (repos.length === 0) {
        if (isMounted && reposData.length > 0) setReposData([]);
        return;
      }

      const missingRepos = repos.filter(
        (repo) => !reposData.some((rd) => rd?.info?.full_name?.toLowerCase() === repo.toLowerCase())
      );
      if (missingRepos.length === 0) return;

      try {
        const fetchPromises = missingRepos.map((repo) => fetchRepoData(repo));
        const newResults = await Promise.all(fetchPromises);
        
        if (isMounted) {
          const successfulResults = newResults.filter(Boolean);
          const failedRepos = missingRepos.filter((_, idx) => !newResults[idx]);
          
          const combined = [...reposData, ...successfulResults];
          
          let updatedRepos = [...repos];
          let reposChanged = false;

          const sorted = updatedRepos.map((repo, i) => {
            let found = combined.find((rd) => rd?.info?.full_name?.toLowerCase() === repo.toLowerCase());
            
            if (!found) {
              const fetchIdx = missingRepos.findIndex((mr) => mr.toLowerCase() === repo.toLowerCase());
              if (fetchIdx >= 0 && newResults[fetchIdx]) {
                found = newResults[fetchIdx];
                updatedRepos[i] = found.info.full_name;
                reposChanged = true;
              }
            }
            return found;
          }).filter(Boolean);
          
          const currentKeys = reposData.map((rd) => rd?.info?.full_name?.toLowerCase()).join('|');
          const nextKeys = sorted.map((rd) => rd?.info?.full_name?.toLowerCase()).join('|');
          if (currentKeys !== nextKeys) {
            setReposData(sorted);
          }

          if (failedRepos.length > 0) {
            updatedRepos = updatedRepos.filter((r) => !failedRepos.includes(r));
            reposChanged = true;
            setError(`Failed to fetch: ${failedRepos.join(', ')}`);
          }

          if (reposChanged) {
            setRepos(updatedRepos);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    loadMissing();

    return () => {
      isMounted = false;
    };
  }, [repos, reposData, fetchRepoData, setReposData, setRepos, setError]);

  const handleFetchRepo = useCallback(async (ownerRepo) => {
    if (repos.includes(ownerRepo)) return;
    try {
      const data = await fetchRepoData(ownerRepo);
      if (data) {
        addRepo(ownerRepo);
      }
    } catch (e) {
      console.error(e);
    }
  }, [repos, fetchRepoData, addRepo]);

  const getErrorMessage = useCallback((err) => {
    if (err === 'invalidRepo') return 'Use a valid repository name in owner/repo format.';
    if (err === 'notFound') return 'Repository not found.';
    if (err === 'rateLimit') return 'API Rate limit exceeded. Please add a Personal Access Token in the footer.';
    if (err === 'forbidden') return 'GitHub rejected this request. Check repository permissions or your token.';
    if (err === 'retryLater') return 'GitHub is still preparing these stats. Try again in a moment.';
    if (err === 'fetchUnavailable') return 'Network requests are unavailable in this environment.';
    return err;
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-canvas-default text-fg-default">
      <Header />
      
      <main className="flex-1 min-h-0 max-w-[1850px] mx-auto w-full px-3 sm:px-6 py-2 flex flex-col overflow-hidden">
        <div className="shrink-0">
          <RepoInput onFetchRepo={handleFetchRepo} />

          {error && (
            <div className="mb-2">
              <Alert 
                message={getErrorMessage(error)} 
                onClose={() => setError(null)} 
              />
            </div>
          )}
        </div>

        {loading && (
          <div className="flex-1 flex flex-col justify-center items-center py-6 gap-3">
            <MonaOctocat className="w-16 h-16" />
            <p className="text-fg-muted font-medium text-sm animate-pulse">Loading data from GitHub...</p>
          </div>
        )}

        {!loading && reposData.length > 0 && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden" id="compare-container">
            <div className="border-b border-border-default mb-2 shrink-0">
              <nav className="-mb-px flex space-x-6" role="tablist" aria-label="Compare Views">
                <button
                  role="tab"
                  aria-selected={activeTab === 'table'}
                  onClick={() => startTransition(() => setActiveTab('table'))}
                  className={`py-1 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors cursor-pointer ${
                    activeTab === 'table' 
                      ? 'border-fg-accent text-fg-default' 
                      : 'border-transparent text-fg-muted hover:text-fg-default hover:border-border-muted'
                  }`}
                >
                  Table View
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === 'charts'}
                  onClick={() => startTransition(() => setActiveTab('charts'))}
                  className={`py-1 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors cursor-pointer ${
                    activeTab === 'charts' 
                      ? 'border-fg-accent text-fg-default' 
                      : 'border-transparent text-fg-muted hover:text-fg-default hover:border-border-muted'
                  }`}
                >
                  Charts View
                </button>
              </nav>
            </div>

            {activeTab === 'table' ? (
              <div className="flex-1 min-h-0 flex flex-col justify-start overflow-hidden">
                <ComparisonTable />
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                <Suspense fallback={
                  <div className="py-24 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-fg-accent border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-fg-muted">Loading charts...</p>
                  </div>
                }>
                  <Charts />
                </Suspense>
              </div>
            )}
            
            <div className="shrink-0">
              <SharePanel />
            </div>
          </div>
        )}

        {!loading && reposData.length === 0 && repos.length === 0 && (
          <div className="flex-1 flex flex-col justify-center items-center py-12 text-center">
            <MonaOctocat className="w-24 h-24 mx-auto mb-4 opacity-20 grayscale" />
            <h2 className="text-lg font-semibold text-fg-default mb-1">No repositories added yet</h2>
            <p className="text-fg-muted max-w-md mx-auto text-xs sm:text-sm">
              Start by selecting a quick preset above or type a GitHub repository in the format <code>owner/repo</code> to compare stats, commit activity, and languages.
            </p>
          </div>
        )}
      </main>

      <Footer />
      {previewRepo && (
        <Suspense fallback={null}>
          <ReadmeModal />
        </Suspense>
      )}
      <SettingsModal />
    </div>
  );
}

export default App;

import React, { useMemo, memo, useState, useEffect } from 'react';
import { useGitHubApi } from '../../hooks/useGitHubApi';
import { useAppStore } from '../../store/appStore';
import { LeaderboardCards } from './charts/LeaderboardCards';
import { StarHistoryChart } from './charts/StarHistoryChart';
import { CommitActivityChart } from './charts/CommitActivityChart';
import { LanguageBreakdownTable } from './charts/LanguageBreakdownTable';
import { DataSummaryTable } from './charts/DataSummaryTable';
import { TopContributorsGrid } from './charts/TopContributorsGrid';

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

const GITHUB_LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  Svelte: '#ff3e00',
};

const CHART_PALETTE = ['#0969da', '#2da44e', '#cf222e', '#bf3989', '#8250df', '#d4a72c', '#0550ae', '#1a7f37', '#a40e26', '#8c2666'];

const tooltipStyle = {
  backgroundColor: 'var(--color-canvas-default)',
  borderColor: 'var(--color-border-default)',
  borderRadius: '6px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
};

export const Charts = memo(function Charts() {
  const reposData = useAppStore(state => state.reposData);
  const { fetchStarHistory } = useGitHubApi();
  const [starData, setStarData] = useState([]);
  const [loadingStars, setLoadingStars] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadStars = async () => {
      if (!reposData || reposData.length === 0) return;
      setLoadingStars(true);
      
      const allHistories = await Promise.all(
        reposData.map(repo => fetchStarHistory(repo.info.full_name, repo.info.stargazers_count, repo.info.created_at))
      );
      
      if (!isMounted) return;

      const combined = [];
      const datesSet = new Set();
      const todayStr = new Date().toISOString().split('T')[0];
      
      allHistories.forEach((history) => {
        datesSet.add(todayStr);
        history.forEach(point => {
          if (point.date) datesSet.add(point.date.split('T')[0]);
        });
      });

      const sortedDates = Array.from(datesSet).sort();
      
      const processedTimelines = reposData.map((repo, idx) => {
        const history = allHistories[idx] || [];
        const rawPoints = [];
        if (repo.info.created_at) {
          rawPoints.push({
            time: new Date(repo.info.created_at).getTime(),
            stars: 0,
          });
        }
        history.forEach((pt) => {
          if (pt && pt.date) {
            rawPoints.push({
              time: new Date(pt.date).getTime(),
              stars: Math.max(0, Number(pt.stars) || 0),
            });
          }
        });
        rawPoints.push({
          time: new Date().getTime(),
          stars: Math.max(0, Number(repo.info.stargazers_count) || 0),
        });
        rawPoints.sort((a, b) => a.time - b.time);
        const uniquePoints = [];
        rawPoints.forEach((pt) => {
          if (uniquePoints.length === 0 || uniquePoints[uniquePoints.length - 1].time !== pt.time) {
            uniquePoints.push(pt);
          } else {
            uniquePoints[uniquePoints.length - 1].stars = Math.max(uniquePoints[uniquePoints.length - 1].stars, pt.stars);
          }
        });
        return uniquePoints;
      });

      sortedDates.forEach(dateStr => {
        const targetTime = new Date(dateStr).getTime();
        const row = { name: dateFormatter.format(new Date(dateStr)), _rawDate: dateStr };
        reposData.forEach((repo, idx) => {
          const timeline = processedTimelines[idx];
          if (!timeline || timeline.length === 0) {
            row[repo.info.full_name] = 0;
            return;
          }
          if (targetTime < timeline[0].time) {
            row[repo.info.full_name] = 0;
            return;
          }
          if (targetTime >= timeline[timeline.length - 1].time) {
            row[repo.info.full_name] = timeline[timeline.length - 1].stars;
            return;
          }
          let calculatedStars = 0;
          for (let i = 0; i < timeline.length - 1; i += 1) {
            const p0 = timeline[i];
            const p1 = timeline[i + 1];
            if (targetTime >= p0.time && targetTime <= p1.time) {
              const span = p1.time - p0.time;
              const ratio = span > 0 ? (targetTime - p0.time) / span : 0;
              calculatedStars = Math.round(p0.stars + ratio * (p1.stars - p0.stars));
              break;
            }
          }
          row[repo.info.full_name] = calculatedStars;
        });
        combined.push(row);
      });
      
      const deduped = [];
      const seenNames = new Set();
      for (let i = combined.length - 1; i >= 0; i--) {
        if (!seenNames.has(combined[i].name)) {
          seenNames.add(combined[i].name);
          deduped.push(combined[i]);
        }
      }
      deduped.reverse();

      setStarData(deduped);
      setLoadingStars(false);
    };

    loadStars();
    return () => {
      isMounted = false;
    };
  }, [reposData, fetchStarHistory]);

  const commitData = useMemo(() => {
    if (!reposData || reposData.length === 0) return [];
    const weeksCount = 12;
    const finalData = [];
    const referenceActivity = reposData.find(r => r.commitActivity && r.commitActivity.length >= weeksCount)?.commitActivity;
    
    for (let i = 0; i < weeksCount; i++) {
      const point = {};
      const targetIndex = 52 - weeksCount + i; 
      let weekTimestamp;
      if (referenceActivity && referenceActivity[targetIndex]) {
        weekTimestamp = referenceActivity[targetIndex].week;
      } else {
        const currentTimestamp = Date.now() / 1000;
        weekTimestamp = currentTimestamp - (weeksCount - 1 - i) * 604800;
      }
      point.name = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(weekTimestamp * 1000));

      reposData.forEach(({ info, commitActivity }) => {
        if (commitActivity && commitActivity[targetIndex]) {
          point[info.full_name] = commitActivity[targetIndex].total;
        } else {
          point[info.full_name] = 0;
        }
      });
      finalData.push(point);
    }
    return finalData;
  }, [reposData]);

  const languageData = useMemo(() => {
    if (!reposData || reposData.length === 0) return [];
    const allLangs = new Set();
    reposData.forEach(r => {
      Object.keys(r.languages || {}).forEach(l => allLangs.add(l));
    });

    return Array.from(allLangs).map(lang => {
      const obj = { name: lang, _total: 0 };
      reposData.forEach(({ info, languages }) => {
        const bytes = (languages && languages[lang]) || 0;
        obj[info.full_name] = bytes;
        obj._total += bytes;
      });
      return obj;
    }).sort((a, b) => b._total - a._total).slice(0, 10);
  }, [reposData]);

  const globalLangColors = useMemo(() => {
    const map = {};
    let colorIdx = 0;
    languageData.forEach(l => {
      map[l.name] = GITHUB_LANG_COLORS[l.name] || CHART_PALETTE[colorIdx % CHART_PALETTE.length];
      if (!GITHUB_LANG_COLORS[l.name]) colorIdx++;
    });
    return map;
  }, [languageData]);

  const detailedLanguages = useMemo(() => {
    if (!reposData) return [];
    return reposData.map(repo => {
      const langs = Object.entries(repo.languages || {});
      const totalBytes = langs.reduce((acc, [_, bytes]) => acc + bytes, 0);
      
      const sortedLangs = langs.sort((a, b) => b[1] - a[1]).map(([name, bytes]) => ({
        name,
        bytes,
        percent: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
        color: globalLangColors[name] || '#57606a'
      }));

      const topLangs = sortedLangs.slice(0, 4);
      const otherLangs = sortedLangs.slice(4);
      if (otherLangs.length > 0) {
        const otherBytes = otherLangs.reduce((acc, l) => acc + l.bytes, 0);
        topLangs.push({
          name: 'Other',
          bytes: otherBytes,
          percent: totalBytes > 0 ? (otherBytes / totalBytes) * 100 : 0,
          color: '#57606a'
        });
      }

      return {
        repo: repo.info.full_name,
        html_url: repo.info.html_url,
        totalBytes,
        langs: topLangs
      };
    });
  }, [reposData, globalLangColors]);

  const leaderboards = useMemo(() => {
    if (!reposData || reposData.length === 0) return null;
    
    const byStars = [...reposData]
      .sort((a, b) => (b.info.stargazers_count || 0) - (a.info.stargazers_count || 0))
      .slice(0, 3);
      
    const byCommits = [...reposData]
      .sort((a, b) => (b.commitsLastYear || 0) - (a.commitsLastYear || 0))
      .slice(0, 3);
      
    const byForks = [...reposData]
      .sort((a, b) => (b.info.forks_count || 0) - (a.info.forks_count || 0))
      .slice(0, 3);
      
    const byFrequency = [...reposData].map(r => ({
      repo: r,
      commitsPerWeek: Math.round((r.commitsLastYear || 0) / 52)
    })).sort((a, b) => b.commitsPerWeek - a.commitsPerWeek).slice(0, 3);

    const byHealth = [...reposData]
      .sort((a, b) => (b.healthScore || 0) - (a.healthScore || 0))
      .slice(0, 3);

    return { byHealth, byStars, byCommits, byForks, byFrequency };
  }, [reposData]);

  if (!reposData || reposData.length === 0) return null;

  return (
    <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <LeaderboardCards leaderboards={leaderboards} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <StarHistoryChart
          starData={starData}
          reposData={reposData}
          loadingStars={loadingStars}
          colors={CHART_PALETTE}
          tooltipStyle={tooltipStyle}
        />

        <CommitActivityChart
          commitData={commitData}
          reposData={reposData}
          colors={CHART_PALETTE}
          tooltipStyle={tooltipStyle}
        />
      </div>

      <LanguageBreakdownTable detailedLanguages={detailedLanguages} />
      <DataSummaryTable reposData={reposData} />
      <TopContributorsGrid reposData={reposData} />
    </div>
  );
});

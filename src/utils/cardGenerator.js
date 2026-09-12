import { formatNpmDownloads } from '../services/npmApi';

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
  Zig: '#ec915c',
  Elixir: '#6e4a7e',
  Lua: '#000080',
};

const THEMES = {
  dark: {
    canvasBgStart: '#161b22',
    canvasBgEnd: '#0d1117',
    canvasBorder: '#30363d',
    cardBg: '#161b22',
    cardBorder: '#30363d',
    headerTitle: '#f0f6fc',
    headerSubtitle: '#8b949e',
    headerDate: '#6e7681',
    divider: '#21262d',
    avatarBorder: '#30363d',
    avatarFallbackBg: '#21262d',
    repoName: '#58a6ff',
    repoLang: '#8b949e',
    scoreBoxBg: '#0d1117',
    scoreBoxBorder: '#21262d',
    scoreBoxLabel: '#8b949e',
    statLabel: '#8b949e',
    statValue: '#f0f6fc',
    statDivider: '#21262d',
    footerText: '#484f58',
    scoreGood: '#3fb950',
    scoreMedium: '#d29922',
    scoreBad: '#f85149',
  },
  light: {
    canvasBgStart: '#ffffff',
    canvasBgEnd: '#f6f8fa',
    canvasBorder: '#d0d7de',
    cardBg: '#ffffff',
    cardBorder: '#d0d7de',
    headerTitle: '#1f2328',
    headerSubtitle: '#656d76',
    headerDate: '#656d76',
    divider: '#d0d7de',
    avatarBorder: '#d0d7de',
    avatarFallbackBg: '#eaeef2',
    repoName: '#0969da',
    repoLang: '#656d76',
    scoreBoxBg: '#f6f8fa',
    scoreBoxBorder: '#d0d7de',
    scoreBoxLabel: '#656d76',
    statLabel: '#656d76',
    statValue: '#1f2328',
    statDivider: '#eaeef2',
    footerText: '#8c959f',
    scoreGood: '#1a7f37',
    scoreMedium: '#9a6700',
    scoreBad: '#cf222e',
  },
};

function loadImage(src, timeoutMs = 1500) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, timeoutMs);

    img.onload = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(img);
      }
    };

    img.onerror = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(null);
      }
    };

    img.src = src;
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth) {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 0 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}…`;
}

export async function generateBattleCardBlob(reposData, npmDownloads = {}, themePreference = 'auto', pageIndex = 0, totalPages = 1) {
  if (!reposData || reposData.length === 0) return null;

  let themeKey = themePreference;
  if (themeKey !== 'dark' && themeKey !== 'light') {
    const isDark = typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : true;
    themeKey = isDark ? 'dark' : 'light';
  }
  const theme = THEMES[themeKey] || THEMES.dark;

  const displayRepos = reposData.slice(0, 10);
  const count = displayRepos.length;

  const isTwoRows = count > 5;
  const width = 1200;
  const height = isTwoRows ? 940 : 630;

  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(scale, scale);

  ctx.fillStyle = theme.canvasBgEnd;
  ctx.fillRect(0, 0, width, height);

  const radial = ctx.createRadialGradient(width / 2, -60, 20, width / 2, 220, 850);
  radial.addColorStop(0, theme.canvasBgStart);
  radial.addColorStop(1, theme.canvasBgEnd);
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = theme.canvasBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  ctx.fillStyle = theme.headerTitle;
  ctx.font = 'bold 28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('OctoClash', 48, 48);

  ctx.fillStyle = theme.headerSubtitle;
  ctx.font = '600 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const subtitleText = totalPages > 1
    ? `HEAD-TO-HEAD REPOSITORY CLASH • PART ${pageIndex + 1} OF ${totalPages}`
    : 'HEAD-TO-HEAD REPOSITORY CLASH';
  ctx.fillText(subtitleText, 48, 72);

  ctx.fillStyle = theme.headerDate;
  ctx.font = '13px monospace';
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const dateW = ctx.measureText(dateStr).width;
  ctx.fillText(dateStr, width - 48 - dateW, 52);

  ctx.strokeStyle = theme.divider;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(48, 92);
  ctx.lineTo(width - 48, 92);
  ctx.stroke();

  const startX = 40;
  const row1Count = isTwoRows ? Math.ceil(count / 2) : count;
  const row2Count = isTwoRows ? count - row1Count : 0;
  const maxCols = isTwoRows ? Math.max(row1Count, row2Count) : count;
  const gap = isTwoRows ? 14 : (count <= 3 ? 24 : 14);

  const cardWidth = count === 1
    ? 440
    : Math.floor((width - startX * 2 - (maxCols - 1) * gap) / maxCols);
  const cardHeight = isTwoRows ? 368 : 440;
  const isCompact = maxCols >= 4;

  const avatarImages = await Promise.all(
    displayRepos.map((r) => loadImage(r.info.owner?.avatar_url))
  );

  const rows = isTwoRows
    ? [
        { items: displayRepos.slice(0, row1Count), y: 112, offset: 0 },
        { items: displayRepos.slice(row1Count), y: 112 + cardHeight + 18, offset: row1Count },
      ]
    : [
        { items: displayRepos, y: 114, offset: 0 },
      ];

  rows.forEach((row) => {
    const rowStartX = count === 1
      ? Math.floor((width - cardWidth) / 2)
      : startX + Math.floor(((maxCols - row.items.length) * (cardWidth + gap)) / 2);

    row.items.forEach((repo, colIdx) => {
      const globalIdx = row.offset + colIdx;
      const x = rowStartX + colIdx * (cardWidth + gap);
      const cardY = row.y;
      const info = repo.info;
      const langColor = GITHUB_LANG_COLORS[info.language] || '#8b949e';

      roundRect(ctx, x, cardY, cardWidth, cardHeight, 14);
      ctx.fillStyle = theme.cardBg;
      ctx.fill();
      ctx.strokeStyle = theme.cardBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.save();
      roundRect(ctx, x, cardY, cardWidth, cardHeight, 14);
      ctx.clip();
      ctx.fillStyle = langColor;
      ctx.fillRect(x, cardY, cardWidth, 4);
      ctx.restore();

      const avatar = avatarImages[globalIdx];
      const avatarSize = isCompact ? 32 : 44;
      const avatarPad = isCompact ? 14 : 20;
      const avatarX = x + avatarPad;
      const avatarY = cardY + (isTwoRows ? 16 : 22);

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      if (avatar) {
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
      } else {
        ctx.fillStyle = theme.avatarFallbackBg;
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
      }
      ctx.restore();

      ctx.strokeStyle = theme.avatarBorder;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.stroke();

      const titleX = avatarX + avatarSize + (isCompact ? 10 : 14);
      const maxTitleW = cardWidth - (titleX - x) - (isCompact ? 10 : 16);

      ctx.fillStyle = theme.repoName;
      ctx.font = isCompact
        ? 'bold 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        : 'bold 17px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

      const preferredName = isCompact
        ? info.name
        : (ctx.measureText(info.full_name).width <= maxTitleW ? info.full_name : info.name);
      const displayName = fitText(ctx, preferredName, maxTitleW);
      ctx.fillText(displayName, titleX, avatarY + (isCompact ? 16 : 22));

      const langY = avatarY + (isCompact ? 30 : 38);
      const dotRadius = isCompact ? 3 : 4;
      ctx.beginPath();
      ctx.arc(titleX + dotRadius, langY - dotRadius, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = langColor;
      ctx.fill();

      ctx.fillStyle = theme.repoLang;
      ctx.font = isCompact
        ? '500 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        : '500 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const displayLang = fitText(ctx, info.language || 'Plain Text', maxTitleW - dotRadius * 2 - 8);
      ctx.fillText(displayLang, titleX + dotRadius * 2 + 6, langY);

      const scoreBoxPad = isCompact ? 14 : 20;
      const scoreBoxX = x + scoreBoxPad;
      const scoreBoxW = cardWidth - scoreBoxPad * 2;
      const scoreBoxY = avatarY + avatarSize + (isTwoRows ? 12 : 18);
      const scoreBoxH = isTwoRows ? 38 : 52;

      roundRect(ctx, scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 8);
      ctx.fillStyle = theme.scoreBoxBg;
      ctx.fill();
      ctx.strokeStyle = theme.scoreBoxBorder;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = theme.scoreBoxLabel;
      ctx.font = isCompact
        ? '11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        : '12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(isCompact ? 'Health' : 'Health Score', scoreBoxX + (isCompact ? 10 : 14), scoreBoxY + (isTwoRows ? 24 : 32));

      const score = repo.healthScore ?? 0;
      const grade = repo.healthGrade || 'F';
      ctx.fillStyle = score >= 80 ? theme.scoreGood : score >= 60 ? theme.scoreMedium : theme.scoreBad;
      ctx.font = isCompact
        ? 'bold 15px monospace'
        : 'bold 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const scoreStr = `${score} (${grade})`;
      const scoreWidth = ctx.measureText(scoreStr).width;
      ctx.fillText(scoreStr, scoreBoxX + scoreBoxW - (isCompact ? 10 : 14) - scoreWidth, scoreBoxY + (isTwoRows ? 25 : 33));

      const statsStartY = scoreBoxY + scoreBoxH + (isTwoRows ? 12 : 18);
      const rowHeight = isTwoRows ? 26 : 34;
      const npmCount = npmDownloads[info.full_name] ?? null;

      const stats = [
        { label: 'Stars', value: (info.stargazers_count || 0).toLocaleString() },
        { label: 'NPM / wk', value: formatNpmDownloads(npmCount) },
        { label: 'Commits (1y)', value: (repo.commitsLastYear || 0).toLocaleString() },
        { label: 'Forks', value: (info.forks_count || 0).toLocaleString() },
        { label: isCompact ? 'Issues' : 'Open Issues', value: (info.open_issues_count || 0).toLocaleString() },
        { label: 'License', value: info.license?.spdx_id || 'None' },
      ];

      stats.forEach((st, sIdx) => {
        const sy = statsStartY + sIdx * rowHeight;
        ctx.fillStyle = theme.statLabel;
        ctx.font = isCompact
          ? '11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          : '13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(st.label, scoreBoxX, sy);

        ctx.fillStyle = theme.statValue;
        ctx.font = isCompact ? '600 11px monospace' : '600 13px monospace';
        const maxValW = Math.max(30, scoreBoxW - ctx.measureText(st.label).width - 10);
        const fittedVal = fitText(ctx, st.value, maxValW);
        const valW = ctx.measureText(fittedVal).width;
        ctx.fillText(fittedVal, scoreBoxX + scoreBoxW - valW, sy);

        if (sIdx < stats.length - 1) {
          ctx.strokeStyle = theme.statDivider;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(scoreBoxX, sy + (isTwoRows ? 7 : 10));
          ctx.lineTo(scoreBoxX + scoreBoxW, sy + (isTwoRows ? 7 : 10));
          ctx.stroke();
        }
      });
    });
  });

  ctx.fillStyle = theme.footerText;
  ctx.font = '12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Exported from OctoClash • Open Source GitHub Clash Engine', 48, height - 24);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

export async function exportBattleCardPng(reposData, npmDownloads = {}, themePreference = 'auto', onProgress = null) {
  if (!reposData || reposData.length === 0) return;

  const totalPages = Math.ceil(reposData.length / 10);
  const activeTheme = themePreference === 'light' || themePreference === 'dark'
    ? themePreference
    : (typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light');

  const timestamp = Date.now();

  for (let page = 0; page < totalPages; page++) {
    if (typeof onProgress === 'function') {
      onProgress({ current: page + 1, total: totalPages });
    }
    const chunk = reposData.slice(page * 10, (page + 1) * 10);
    const blob = await generateBattleCardBlob(chunk, npmDownloads, activeTheme, page, totalPages);
    if (!blob) continue;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = totalPages > 1
      ? `octoclash-battle-card-${activeTheme}-part-${page + 1}-of-${totalPages}-${timestamp}.png`
      : `octoclash-battle-card-${activeTheme}-${timestamp}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);

    if (page < totalPages - 1) {
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }
}

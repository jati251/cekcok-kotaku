import type { LauncherGame, LauncherSortOrder } from '@/types';

export const SORT_OPTIONS: { id: LauncherSortOrder; label: string }[] = [
  { id: 'default', label: 'Featured' },
  { id: 'title-asc', label: 'Name (A-Z)' },
  { id: 'title-desc', label: 'Name (Z-A)' },
  { id: 'year-desc', label: 'Newest Year' },
  { id: 'year-asc', label: 'Classic / Oldest' },
  { id: 'playable', label: 'Playable First' },
];

export function sortLauncherGames(games: LauncherGame[], order: LauncherSortOrder): LauncherGame[] {
  const sorted = [...games];
  switch (order) {
    case 'title-asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case 'year-desc':
      return sorted.sort((a, b) => parseInt(b.releaseYear, 10) - parseInt(a.releaseYear, 10));
    case 'year-asc':
      return sorted.sort((a, b) => parseInt(a.releaseYear, 10) - parseInt(b.releaseYear, 10));
    case 'playable':
      return sorted.sort((a, b) => {
        if (a.status === 'playable' && b.status !== 'playable') return -1;
        if (a.status !== 'playable' && b.status === 'playable') return 1;
        return a.title.localeCompare(b.title);
      });
    case 'default':
    default:
      return sorted;
  }
}

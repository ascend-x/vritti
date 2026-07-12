import { useState } from 'react';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({
  columns, data = [], loading = false, onRowClick,
  emptyMessage = 'No records found', pageSize = 20,
  searchable = false, searchPlaceholder = 'Search...',
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  let filtered = data;
  if (search) {
    const q = search.toLowerCase();
    filtered = data.filter(row =>
      columns.some(col => String(row[col.key] ?? '').toLowerCase().includes(q))
    );
  }

  let sorted = [...filtered];
  if (sortKey) {
    sorted.sort((a, b) => {
      const va = a[sortKey] ?? '', vb = b[sortKey] ?? '';
      return sortDir === 'asc' ? String(va).localeCompare(String(vb), undefined, { numeric: true }) : String(vb).localeCompare(String(va), undefined, { numeric: true });
    });
  }

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {columns.map((_, i) => (
        <td key={i} className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" /></td>
      ))}
    </tr>
  );

  return (
    <div className="flex flex-col gap-3">
      {searchable && (
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={searchPlaceholder}
            className="input-field pl-9"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap
                    ${col.sortable !== false ? 'cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200' : ''}`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && (
                      <span className="ml-1">
                        {sortKey === col.key
                          ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          : <ChevronUp className="w-3 h-3 opacity-30" />
                        }
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : paged.length === 0
                ? (
                  <tr>
                    <td colSpan={columns.length} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Search className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium">{emptyMessage}</p>
                      </div>
                    </td>
                  </tr>
                )
                : paged.map((row, i) => (
                  <tr
                    key={row.id || i}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors duration-75 ${onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800' : ''}
                      ${i % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/20' : 'bg-white dark:bg-slate-900'}`}
                  >
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-3 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>Showing {(page-1)*pageSize+1}–{Math.min(page*pageSize, sorted.length)} of {sorted.length}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

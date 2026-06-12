import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, ChevronRight } from 'lucide-react';
import { searchItems } from '../api/items';
import type { ItemCondition } from '../types';
import { CONDITION_LABELS, CONDITION_COLORS } from '../types';
import Spinner from '../components/Spinner';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  const handleChange = (val: string) => {
    setQ(val);
    clearTimeout((window as unknown as { _searchTimer?: number })._searchTimer);
    (window as unknown as { _searchTimer?: number })._searchTimer = window.setTimeout(
      () => setDebouncedQ(val),
      300,
    );
  };

  const { data, isLoading } = useQuery({
    queryKey: ['items', 'search', debouncedQ],
    queryFn: () => searchItems(debouncedQ),
    enabled: debouncedQ.length >= 2,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Suche</h1>

      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          autoFocus
          value={q}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Name, Beschreibung, Seriennummer oder Barcode…"
          className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {debouncedQ.length < 2 && (
        <p className="text-center text-gray-400 text-sm py-12">
          Mindestens 2 Zeichen eingeben…
        </p>
      )}

      {isLoading && <Spinner />}

      {data && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            {data.length} Ergebnis{data.length !== 1 ? 'se' : ''} für „{debouncedQ}"
          </p>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {data.length === 0 ? (
              <p className="py-8 text-center text-gray-400 text-sm">Nichts gefunden.</p>
            ) : (
              data.map((item) => (
                <Link
                  key={item.id}
                  to={`/items/${item.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package size={18} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {item.location?.room?.name} › {item.location?.name}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 flex-shrink-0">
                    {item.quantity} {item.unit ?? 'Stück'}
                  </span>
                  {item.condition && (
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${CONDITION_COLORS[item.condition as ItemCondition]}`}>
                      {CONDITION_LABELS[item.condition as ItemCondition]}
                    </span>
                  )}
                  <ChevronRight size={14} className="text-gray-300" />
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

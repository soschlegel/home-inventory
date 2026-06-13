import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { searchInstances } from '../api/instances';
import type { ItemCondition } from '../types';
import { CONDITION_COLORS } from '../types';
import Spinner from '../components/Spinner';

export default function SearchPage() {
  const { t } = useTranslation();
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
    queryKey: ['instances', 'search', debouncedQ],
    queryFn: () => searchInstances(debouncedQ),
    enabled: debouncedQ.length >= 2,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('search.title')}</h1>

      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          autoFocus
          value={q}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={t('search.placeholder')}
          className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {debouncedQ.length < 2 && (
        <p className="text-center text-gray-400 text-sm py-12">
          {t('search.min_chars')}
        </p>
      )}

      {isLoading && <Spinner />}

      {data && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            {t('search.results', { count: data.length, query: debouncedQ })}
          </p>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {data.length === 0 ? (
              <p className="py-8 text-center text-gray-400 text-sm">{t('search.no_results')}</p>
            ) : (
              data.map((instance) => (
                <Link
                  key={instance.id}
                  to={`/instances/${instance.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                >
                  {instance.product.imageUrl ? (
                    <img src={instance.product.imageUrl} alt={instance.product.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package size={18} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{instance.product.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {instance.location?.room?.name} › {instance.location?.name}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 flex-shrink-0">
                    {instance.quantity} {instance.unit ? t(`unitNames.${instance.unit}`, { defaultValue: instance.unit }) : t('common.piece')}
                  </span>
                  {instance.condition && (
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${CONDITION_COLORS[instance.condition as ItemCondition]}`}>
                      {t(`condition.${instance.condition}`)}
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

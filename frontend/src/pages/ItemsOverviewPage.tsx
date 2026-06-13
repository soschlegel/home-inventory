import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAllItems, searchItemsOverview } from '../api/items';
import { getTags } from '../api/tags';
import { locTagName } from '../utils/localizedName';
import type { ItemOverview, ItemCondition } from '../types';
import { CONDITION_COLORS } from '../types';
import Spinner from '../components/Spinner';

interface ItemGroup {
  name: string;
  items: ItemOverview[];
}

function LocationPath({ item }: { item: ItemOverview }) {
  return (
    <Link
      to={`/locations/${item.locationId}`}
      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline text-sm"
    >
      <span className="text-gray-400">{item.location.room.name}</span>
      <ChevronRight size={12} className="text-gray-300" />
      {item.location.parent && (
        <>
          <span className="text-gray-400">{item.location.parent.name}</span>
          <ChevronRight size={12} className="text-gray-300" />
        </>
      )}
      <span>{item.location.name}</span>
    </Link>
  );
}

export default function ItemsOverviewPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilter(filter), 300);
    return () => clearTimeout(timer);
  }, [filter]);

  const isSearchMode = debouncedFilter.length >= 2;

  const { data: allItems, isLoading: allLoading } = useQuery({
    queryKey: ['items-overview'],
    queryFn: getAllItems,
    enabled: !isSearchMode,
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['items-search', debouncedFilter],
    queryFn: () => searchItemsOverview(debouncedFilter),
    enabled: isSearchMode,
  });

  const { data: allTags } = useQuery({ queryKey: ['tags'], queryFn: getTags });

  const items = isSearchMode ? searchResults : allItems;
  const isLoading = isSearchMode ? searchLoading : allLoading;

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const groups = useMemo<ItemGroup[]>(() => {
    if (!items) return [];

    let filtered = items;
    if (selectedTagIds.size > 0) {
      filtered = filtered.filter((i) =>
        i.tags?.some(({ tag }) => selectedTagIds.has(tag.id))
      );
    }

    const result: ItemGroup[] = [];
    for (const item of filtered) {
      const last = result[result.length - 1];
      if (last && last.name === item.name) {
        last.items.push(item);
      } else {
        result.push({ name: item.name, items: [item] });
      }
    }
    return result;
  }, [items, selectedTagIds]);

  const totalEntries = groups.reduce((s, g) => s + g.items.length, 0);

  if (isLoading && !items) return <Spinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('itemsOverview.title')}</h1>

      <div className="mb-4 space-y-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            aria-label={t('itemsOverview.filter_placeholder')}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('itemsOverview.filter_placeholder')}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {isLoading && items && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {filter.length === 1 && (
          <p className="text-xs text-gray-400 px-1">{t('itemsOverview.filter_min_chars')}</p>
        )}

        {allTags && allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const active = selectedTagIds.has(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {locTagName(t, tag)}
                  {active && ' ✕'}
                </button>
              );
            })}
          </div>
        )}

        {items && (
          <p className="text-xs text-gray-500">
            {isSearchMode
              ? t('itemsOverview.search_results', { count: totalEntries, query: debouncedFilter })
              : t('itemsOverview.summary', { total: totalEntries, unique: groups.length })}
          </p>
        )}
      </div>

      {groups.length === 0 && !isLoading ? (
        <div className="bg-white border border-gray-200 rounded-xl py-10 text-center text-gray-400 text-sm">
          {t('itemsOverview.no_items')}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-44">
                    {t('itemsOverview.col_name')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">
                    {t('itemsOverview.col_quantity')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    {t('itemsOverview.col_location')}
                  </th>
                  <th className="hidden sm:table-cell text-left px-4 py-3 font-medium text-gray-600 w-28">
                    {t('itemsOverview.col_condition')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groups.map((group) =>
                  group.items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 transition-colors ${idx === 0 && group.items.length > 1 ? 'border-t-2 border-gray-200' : ''}`}
                    >
                      {idx === 0 && (
                        <td
                          rowSpan={group.items.length}
                          className="px-4 py-3 align-top border-r border-gray-100"
                        >
                          <Link
                            to={`/items/${item.id}`}
                            className="font-medium text-gray-900 hover:text-indigo-600 hover:underline leading-snug block"
                          >
                            {group.name}
                          </Link>
                          {group.items.length > 1 && (
                            <span className="text-xs text-gray-400 mt-0.5 block">
                              {t('itemsOverview.locations_count', { count: group.items.length })}
                            </span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-gray-700 tabular-nums">
                        {item.quantity}
                        {item.unit && (
                          <span className="ml-1 text-gray-400">
                            {t(`unitNames.${item.unit}`, { defaultValue: item.unit })}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <LocationPath item={item} />
                        {item._count.lendings > 0 && (
                          <span className="ml-1 inline-block text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                            {t('itemsOverview.lent_badge')}
                          </span>
                        )}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3">
                        {item.condition ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${CONDITION_COLORS[item.condition as ItemCondition]}`}>
                            {t(`condition.${item.condition}`)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

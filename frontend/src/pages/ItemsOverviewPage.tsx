import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAllInstances, searchInstances } from '../api/instances';
import { getTags } from '../api/tags';
import { locTagName } from '../utils/localizedName';
import type { InstanceOverview, ItemCondition } from '../types';
import { CONDITION_COLORS } from '../types';
import Spinner from '../components/Spinner';

interface InstanceGroup {
  name: string;
  instances: InstanceOverview[];
}

function LocationPath({ instance }: { instance: InstanceOverview }) {
  if (!instance.locationId || !instance.location) {
    return <span className="text-gray-400 text-sm">—</span>;
  }
  return (
    <Link
      to={`/locations/${instance.locationId}`}
      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline text-sm"
    >
      <span className="text-gray-400">{instance.location.room?.name}</span>
      <ChevronRight size={12} className="text-gray-300" />
      {instance.location.parent && (
        <>
          <span className="text-gray-400">{instance.location.parent.name}</span>
          <ChevronRight size={12} className="text-gray-300" />
        </>
      )}
      <span>{instance.location.name}</span>
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

  const { data: allInstances, isLoading: allLoading } = useQuery({
    queryKey: ['instances'],
    queryFn: getAllInstances,
    enabled: !isSearchMode,
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['instances-search', debouncedFilter],
    queryFn: () => searchInstances(debouncedFilter),
    enabled: isSearchMode,
  });

  const { data: allTags } = useQuery({ queryKey: ['tags'], queryFn: getTags });

  const instances = isSearchMode ? searchResults : allInstances;
  const isLoading = isSearchMode ? searchLoading : allLoading;

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const groups = useMemo<InstanceGroup[]>(() => {
    if (!instances) return [];

    let filtered = instances;
    if (selectedTagIds.size > 0) {
      filtered = filtered.filter((i) =>
        i.product.tags?.some(({ tag }) => selectedTagIds.has(tag.id))
      );
    }

    const sorted = [...filtered].sort((a, b) =>
      a.product.name.localeCompare(b.product.name)
    );

    const result: InstanceGroup[] = [];
    for (const inst of sorted) {
      const last = result[result.length - 1];
      if (last && last.name === inst.product.name) {
        last.instances.push(inst);
      } else {
        result.push({ name: inst.product.name, instances: [inst] });
      }
    }
    return result;
  }, [instances, selectedTagIds]);

  const totalEntries = groups.reduce((s, g) => s + g.instances.length, 0);

  if (isLoading && !instances) return <Spinner />;

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
          {isLoading && instances && (
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

        {instances && (
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
                  group.instances.map((instance, idx) => (
                    <tr
                      key={instance.id}
                      className={`hover:bg-gray-50 transition-colors ${idx === 0 && group.instances.length > 1 ? 'border-t-2 border-gray-200' : ''}`}
                    >
                      {idx === 0 && (
                        <td
                          rowSpan={group.instances.length}
                          className="px-4 py-3 align-top border-r border-gray-100"
                        >
                          <Link
                            to={`/products/${instance.productId}`}
                            className="font-medium text-gray-900 hover:text-indigo-600 hover:underline leading-snug block"
                          >
                            {group.name}
                          </Link>
                          {group.instances.length > 1 && (
                            <span className="text-xs text-gray-400 mt-0.5 block">
                              {t('itemsOverview.locations_count', { count: group.instances.length })}
                            </span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-gray-700 tabular-nums">
                        <Link to={`/instances/${instance.id}`} className="hover:text-indigo-600">
                          {instance.quantity}
                          {instance.product.unit && (
                            <span className="ml-1 text-gray-400">
                              {t(`unitNames.${instance.product.unit}`, { defaultValue: instance.product.unit })}
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <LocationPath instance={instance} />
                        {instance._count && instance._count.lendings > 0 && (
                          <span className="ml-1 inline-block text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                            {t('itemsOverview.lent_badge')}
                          </span>
                        )}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3">
                        {instance.condition ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${CONDITION_COLORS[instance.condition as ItemCondition]}`}>
                            {t(`condition.${instance.condition}`)}
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

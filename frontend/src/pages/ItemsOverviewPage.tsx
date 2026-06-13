import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAllItems } from '../api/items';
import { getTags } from '../api/tags';
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
  const [selectedTagKey, setSelectedTagKey] = useState('');

  const { data: items, isLoading } = useQuery({
    queryKey: ['items-overview'],
    queryFn: getAllItems,
  });
  const { data: allTags } = useQuery({ queryKey: ['tags'], queryFn: getTags });

  const groups = useMemo<ItemGroup[]>(() => {
    if (!items) return [];
    const q = filter.trim().toLowerCase();

    let filtered = q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;

    if (selectedTagKey) {
      filtered = filtered.filter((i) =>
        i.tags?.some(({ tag }) => tag.key === selectedTagKey)
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
  }, [items, filter, selectedTagKey]);

  const totalEntries = groups.reduce((s, g) => s + g.items.length, 0);

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('itemsOverview.title')}</h1>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            aria-label={t('itemsOverview.filter_placeholder')}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('itemsOverview.filter_placeholder')}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {allTags && allTags.length > 0 && (
          <select
            value={selectedTagKey}
            onChange={(e) => setSelectedTagKey(e.target.value)}
            aria-label={t('itemsOverview.filter_tag_all')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{t('itemsOverview.filter_tag_all')}</option>
            {allTags.map((tag) => (
              <option key={tag.key} value={tag.key}>
                {t(`tagNames.${tag.key}`, { defaultValue: tag.name })}
              </option>
            ))}
          </select>
        )}
        {items && (
          <p className="text-sm text-gray-500 whitespace-nowrap">
            {t('itemsOverview.summary', { total: totalEntries, unique: groups.length })}
          </p>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-10 text-center text-gray-400 text-sm">
          {t('itemsOverview.no_items')}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-56">
                  {t('itemsOverview.col_name')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-32">
                  {t('itemsOverview.col_quantity')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  {t('itemsOverview.col_location')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-28">
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
                        <span className="ml-2 inline-block text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                          {t('itemsOverview.lent_badge')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
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
      )}
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { getRooms, updateRoom } from '../api/rooms';
import { getContainerTypes, updateContainerType } from '../api/containerTypes';
import { getTags, updateTag } from '../api/tags';
import { getUnits, updateUnit } from '../api/units';
import Spinner from '../components/Spinner';

type TabKey = 'rooms' | 'container_types' | 'tags' | 'units';

interface TranslationItem {
  id: string;
  name: string;
  translations?: Record<string, string> | null;
}

function TranslationRow({
  item,
  onSave,
}: {
  item: TranslationItem;
  onSave: (id: string, translations: Record<string, string> | null) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [de, setDe] = useState(item.translations?.de ?? '');
  const [en, setEn] = useState(item.translations?.en ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Merge DE/EN into existing translations to preserve other languages
      const merged: Record<string, string> = { ...item.translations };
      if (de) merged.de = de; else delete merged.de;
      if (en) merged.en = en; else delete merged.en;
      const payload = Object.keys(merged).length > 0 ? merged : null;
      await onSave(item.id, payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 flex-wrap sm:flex-nowrap">
      <span className="w-full sm:w-36 text-sm font-medium text-gray-700 flex-shrink-0 truncate">
        {item.name}
      </span>
      <div className="relative flex-1 min-w-32">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">🇩🇪</span>
        <input
          aria-label={t('translations.col_de')}
          value={de}
          onChange={(e) => { setDe(e.target.value); setSaved(false); }}
          placeholder={t('translations.col_de')}
          className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="relative flex-1 min-w-32">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">🇬🇧</span>
        <input
          aria-label={t('translations.col_en')}
          value={en}
          onChange={(e) => { setEn(e.target.value); setSaved(false); }}
          placeholder={t('translations.col_en')}
          className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
          saved
            ? 'bg-green-100 text-green-700'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
        }`}
      >
        <Check size={14} />
        {saved ? t('translations.saved') : t('common.save')}
      </button>
    </div>
  );
}

export default function TranslationsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('rooms');

  const { data: rooms, isLoading: roomsLoading } = useQuery({ queryKey: ['rooms'], queryFn: getRooms });
  const { data: containerTypes, isLoading: ctLoading } = useQuery({ queryKey: ['container-types'], queryFn: getContainerTypes });
  const { data: tags, isLoading: tagsLoading } = useQuery({ queryKey: ['tags'], queryFn: getTags });
  const { data: units, isLoading: unitsLoading } = useQuery({ queryKey: ['units'], queryFn: getUnits });

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'rooms', label: t('translations.rooms'), count: rooms?.length ?? 0 },
    { key: 'container_types', label: t('translations.container_types'), count: containerTypes?.length ?? 0 },
    { key: 'tags', label: t('translations.tags'), count: tags?.length ?? 0 },
    { key: 'units', label: t('translations.units'), count: units?.length ?? 0 },
  ];

  const isLoading = roomsLoading || ctLoading || tagsLoading || unitsLoading;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('translations.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('translations.subtitle')}</p>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-gray-400">({tab.count})</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide rounded-t-xl">
            <span className="w-36 flex-shrink-0">{t('translations.col_name')}</span>
            <span className="flex-1">{t('translations.col_de')}</span>
            <span className="flex-1">{t('translations.col_en')}</span>
            <span className="w-20 flex-shrink-0" />
          </div>

          {activeTab === 'rooms' && rooms?.map((room) => (
            <TranslationRow
              key={room.id}
              item={room}
              onSave={async (id, translations) => {
                await updateRoom(id, { translations });
                qc.invalidateQueries({ queryKey: ['rooms'] });
              }}
            />
          ))}

          {activeTab === 'container_types' && containerTypes?.map((ct) => (
            <TranslationRow
              key={ct.id}
              item={{ id: ct.id, name: ct.name, translations: ct.translations }}
              onSave={async (id, translations) => {
                await updateContainerType(id, { translations });
                qc.invalidateQueries({ queryKey: ['container-types'] });
              }}
            />
          ))}

          {activeTab === 'tags' && tags?.map((tag) => (
            <TranslationRow
              key={tag.id}
              item={{ id: tag.id, name: tag.name, translations: tag.translations }}
              onSave={async (id, translations) => {
                await updateTag(id, { translations });
                qc.invalidateQueries({ queryKey: ['tags'] });
              }}
            />
          ))}

          {activeTab === 'units' && units?.map((unit) => (
            <TranslationRow
              key={unit.id}
              item={{ id: unit.id, name: unit.name, translations: unit.translations }}
              onSave={async (id, translations) => {
                await updateUnit(id, { translations });
                qc.invalidateQueries({ queryKey: ['units'] });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

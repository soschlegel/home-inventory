import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getRoomsTree } from '../api/rooms';
import { locRoomName } from '../utils/localizedName';
import Spinner from '../components/Spinner';
import type { Location, Room } from '../types';

type RoomWithTree = Room & {
  locations: Location[];
  _count: { locations: number };
};

function LocationRow({ location, depth = 0 }: { location: Location; depth?: number }) {
  const { t } = useTranslation();
  const itemCount = location._count?.items ?? 0;
  const childCount = location.children?.length ?? 0;

  return (
    <>
      <Link
        to={`/locations/${location.id}`}
        className="flex items-center gap-2 px-4 py-2.5 hover:bg-indigo-50 transition-colors group"
        style={{ paddingLeft: `${16 + depth * 28}px` }}
      >
        {depth > 0 && (
          <span className="text-gray-300 text-sm flex-shrink-0">└</span>
        )}
        <span className="text-lg flex-shrink-0">
          {location.containerType?.icon ?? '📦'}
        </span>
        <span className="flex-1 text-sm text-gray-800 group-hover:text-indigo-700 font-medium">
          {location.name}
        </span>
        {location.containerType && (
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded hidden sm:inline">
            {location.containerType.name}
          </span>
        )}
        {itemCount > 0 && (
          <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded flex-shrink-0">
            {t('common.items_count', { count: itemCount })}
          </span>
        )}
        {childCount > 0 && (
          <span className="text-xs text-gray-400 flex-shrink-0">
            +{childCount}
          </span>
        )}
      </Link>
      {location.children?.map((child) => (
        <LocationRow key={child.id} location={child} depth={depth + 1} />
      ))}
    </>
  );
}

function RoomSection({ room }: { room: RoomWithTree }) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const locations = room.locations ?? [];
  const totalContainers = room._count?.locations ?? 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
      >
        <span className="text-2xl flex-shrink-0">{room.icon ?? '🏠'}</span>
        <Link
          to={`/rooms/${room.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-semibold text-gray-900 hover:text-indigo-600 flex-1 text-left"
        >
          {locRoomName(t, room)}
        </Link>
        <span className="text-xs text-gray-400 flex-shrink-0">
          {t('common.container_count', { count: totalContainers })}
        </span>
        {collapsed ? (
          <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
        )}
      </button>

      {!collapsed && (
        <>
          {locations.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">{t('containers.empty_room')}</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {locations.map((loc) => (
                <LocationRow key={loc.id} location={loc} depth={0} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ContainersPage() {
  const { t } = useTranslation();
  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms-tree'],
    queryFn: getRoomsTree,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('containers.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('containers.subtitle')}</p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !rooms?.length ? (
        <p className="text-sm text-gray-400 text-center py-12">{t('containers.no_rooms')}</p>
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => (
            <RoomSection key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}

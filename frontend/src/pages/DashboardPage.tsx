import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Home, ArrowRightLeft, AlertTriangle, Package, CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getRooms } from '../api/rooms';
import { getActiveLendings } from '../api/lendings';
import { getLowStockInstances, getExpiringSoonInstances } from '../api/instances';
import { locRoomName } from '../utils/localizedName';
import Spinner from '../components/Spinner';

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const rooms = useQuery({ queryKey: ['rooms'], queryFn: getRooms });
  const lendings = useQuery({ queryKey: ['lendings', 'active'], queryFn: getActiveLendings });
  const lowStock = useQuery({ queryKey: ['instances', 'low-stock'], queryFn: getLowStockInstances });
  const expiring = useQuery({ queryKey: ['instances', 'expiring-soon'], queryFn: getExpiringSoonInstances });

  const totalLocations = rooms.data?.reduce((s, r) => s + (r._count?.locations ?? 0), 0) ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('dashboard.title')}</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
        <StatCard icon={<Home size={20} />} label={t('dashboard.stat_rooms')} value={rooms.data?.length ?? '…'} color="indigo" href="/rooms" />
        <StatCard icon={<Package size={20} />} label={t('dashboard.stat_container')} value={totalLocations} color="blue" href="/containers" />
        <StatCard
          icon={<ArrowRightLeft size={20} />}
          label={t('dashboard.stat_lent')}
          value={lendings.data?.length ?? '…'}
          color="orange"
          href="/lendings"
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          label={t('dashboard.stat_low_stock')}
          value={lowStock.data?.length ?? '…'}
          color="red"
        />
        <StatCard
          icon={<CalendarClock size={20} />}
          label={t('dashboard.stat_expiring')}
          value={expiring.data?.length ?? '…'}
          color="amber"
        />
      </div>

      {/* Expiry warning */}
      {(expiring.data?.length ?? 0) > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h2 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
            <CalendarClock size={16} /> {t('dashboard.expiring_title')}
          </h2>
          <ul className="space-y-1">
            {expiring.data?.map((instance) => {
              const isExpired = instance.expiryDate && new Date(instance.expiryDate) < new Date();
              return (
                <li key={instance.id} className="text-sm text-amber-700">
                  <Link to={`/instances/${instance.id}`} className="hover:underline font-medium">
                    {instance.product.name}
                  </Link>{' '}
                  — <span className={isExpired ? 'text-red-600 font-medium' : ''}>
                    {isExpired ? t('dashboard.expiring_expired') : t('dashboard.expiring_on')}{' '}
                    {new Date(instance.expiryDate!).toLocaleDateString(i18n.language)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Low stock warning */}
      {(lowStock.data?.length ?? 0) > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="font-medium text-red-800 mb-2 flex items-center gap-2">
            <AlertTriangle size={16} /> {t('dashboard.low_stock_title')}
          </h2>
          <ul className="space-y-1">
            {lowStock.data?.map((instance) => (
              <li key={instance.id} className="text-sm text-red-700">
                <Link to={`/instances/${instance.id}`} className="hover:underline font-medium">
                  {instance.product.name}
                </Link>{' '}
                — {instance.quantity} {instance.unit ?? t('common.piece')} (min. {instance.minQuantity})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Active lendings */}
      {(lendings.data?.length ?? 0) > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h2 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
            <ArrowRightLeft size={16} /> {t('dashboard.lent_title')}
          </h2>
          <ul className="space-y-1">
            {lendings.data?.map((l) => (
              <li key={l.id} className="text-sm text-orange-700">
                <Link to={`/instances/${l.instanceId}`} className="hover:underline font-medium">
                  {l.instance?.product?.name ?? l.instanceId}
                </Link>{' '}
                → <span className="font-medium">{l.lentTo}</span>
                {' · '}
                {new Date(l.lentAt).toLocaleDateString(i18n.language)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rooms overview */}
      <h2 className="text-lg font-semibold text.gray-800 mb-3">{t('dashboard.rooms_section')}</h2>
      {rooms.isLoading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {rooms.data?.map((room) => (
            <Link
              key={room.id}
              to={`/rooms/${room.id}`}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-400 hover:shadow-sm transition-all"
            >
              <div className="text-2xl mb-1">{room.icon ?? '🏠'}</div>
              <div className="font-medium text-gray-900">{locRoomName(t, room)}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {t('common.container_count', { count: room._count?.locations ?? 0 })}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'indigo' | 'blue' | 'orange' | 'red' | 'amber';
  href?: string;
}) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  const card = (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className={`inline-flex p-2 rounded-lg mb-2 ${colors[color]}`}>{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
  return href ? <Link to={href}>{card}</Link> : card;
}

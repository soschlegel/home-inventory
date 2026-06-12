import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, CheckCircle } from 'lucide-react';
import { getActiveLendings, returnItem } from '../api/lendings';
import Spinner from '../components/Spinner';

export default function LendingsPage() {
  const qc = useQueryClient();
  const { data: lendings, isLoading } = useQuery({
    queryKey: ['lendings', 'active'],
    queryFn: getActiveLendings,
  });

  const returnMut = useMutation({
    mutationFn: returnItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lendings'] }),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Aktuell ausgeliehen</h1>

      {isLoading ? (
        <Spinner />
      ) : !lendings?.length ? (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
          <ArrowRightLeft size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nichts ausgeliehen.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {lendings.map((l) => (
            <div key={l.id} className="flex items-center gap-4 px-4 py-4">
              <div className="flex-1 min-w-0">
                <Link
                  to={`/items/${l.itemId}`}
                  className="font-medium text-gray-900 hover:text-indigo-600 text-sm"
                >
                  {l.item?.name}
                </Link>
                <div className="text-xs text-gray-500 mt-0.5">
                  {l.item?.location?.room?.name}
                </div>
              </div>
              <div className="text-sm text-gray-700 font-medium">{l.lentTo}</div>
              <div className="text-xs text-gray-400">
                seit {new Date(l.lentAt).toLocaleDateString('de-DE')}
              </div>
              {l.note && <div className="text-xs text-gray-400 italic truncate max-w-32">{l.note}</div>}
              <button
                onClick={() => returnMut.mutate(l.id)}
                disabled={returnMut.isPending}
                className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium"
              >
                <CheckCircle size={14} /> Zurück
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

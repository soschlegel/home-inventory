import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ExternalLink, Trash2, Upload, ArrowRightLeft } from 'lucide-react';
import { getItem, deleteItem, uploadItemImage } from '../api/items';
import { lendItem, returnItem } from '../api/lendings';
import type { ItemCondition } from '../types';
import { CONDITION_LABELS, CONDITION_COLORS } from '../types';
import Spinner from '../components/Spinner';

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: item, isLoading } = useQuery({
    queryKey: ['items', id],
    queryFn: () => getItem(id!),
  });

  const [showLendForm, setShowLendForm] = useState(false);
  const [lentTo, setLentTo] = useState('');
  const [lentNote, setLentNote] = useState('');

  const lendMut = useMutation({
    mutationFn: () => lendItem(id!, { lentTo, note: lentNote || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items', id] });
      qc.invalidateQueries({ queryKey: ['lendings'] });
      setLentTo('');
      setLentNote('');
      setShowLendForm(false);
    },
  });

  const returnMut = useMutation({
    mutationFn: (lendingId: string) => returnItem(lendingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items', id] });
      qc.invalidateQueries({ queryKey: ['lendings'] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteItem(id!),
    onSuccess: () => navigate(`/locations/${item?.locationId}`),
  });

  const uploadMut = useMutation({
    mutationFn: (file: File) => uploadItemImage(id!, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items', id] }),
  });

  if (isLoading) return <Spinner />;
  if (!item) return <p className="text-gray-500">Gegenstand nicht gefunden.</p>;

  const activeLending = item.lendings?.find((l) => !l.returnedAt);

  const fmt = (date?: string | null) =>
    date ? new Date(date).toLocaleDateString('de-DE') : '–';

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 flex-wrap">
        <Link to="/rooms" className="hover:text-indigo-600">Räume</Link>
        <ChevronRight size={14} />
        <Link to={`/rooms/${item.location?.room?.id}`} className="hover:text-indigo-600">
          {item.location?.room?.name}
        </Link>
        <ChevronRight size={14} />
        <Link to={`/locations/${item.locationId}`} className="hover:text-indigo-600">
          {item.location?.name}
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">{item.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: image */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full aspect-square object-cover" />
            ) : (
              <div className="aspect-square bg-gray-100 flex items-center justify-center text-5xl">
                📦
              </div>
            )}
            <label className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer border-t border-gray-200">
              <Upload size={15} />
              {item.imageUrl ? 'Bild ersetzen' : 'Bild hochladen'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadMut.mutate(e.target.files[0])}
              />
            </label>
          </div>
        </div>

        {/* Right: details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{item.name}</h1>
                {item.description && <p className="text-gray-600 text-sm mt-1">{item.description}</p>}
              </div>
              {item.condition && (
                <span className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 ${CONDITION_COLORS[item.condition as ItemCondition]}`}>
                  {CONDITION_LABELS[item.condition as ItemCondition]}
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Field label="Menge">{item.quantity} {item.unit ?? 'Stück'}</Field>
              {item.minQuantity !== null && (
                <Field label="Mindestbestand">
                  <span className={item.quantity < (item.minQuantity ?? Infinity) ? 'text-red-600 font-medium' : ''}>
                    {item.minQuantity} {item.unit ?? 'Stück'}
                  </span>
                </Field>
              )}
              {item.serialNumber && <Field label="Seriennummer">{item.serialNumber}</Field>}
              {item.barcode && <Field label="Barcode / EAN">{item.barcode}</Field>}
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.tags.map(({ tag }) => (
                  <span key={tag.id} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full">
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Kaufinfos */}
          {(item.purchaseUrl || item.purchasePrice || item.purchaseDate || item.warrantyUntil) && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-medium text-gray-800 mb-3">Kaufinformationen</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {item.purchasePrice && <Field label="Kaufpreis">{item.purchasePrice.toFixed(2)} €</Field>}
                {item.purchaseDate && <Field label="Kaufdatum">{fmt(item.purchaseDate)}</Field>}
                {item.warrantyUntil && (
                  <Field label="Garantie bis">
                    <span className={new Date(item.warrantyUntil) < new Date() ? 'text-red-500' : ''}>
                      {fmt(item.warrantyUntil)}
                    </span>
                  </Field>
                )}
              </div>
              {item.purchaseUrl && (
                <a
                  href={item.purchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"
                >
                  <ExternalLink size={14} /> Kauflink öffnen
                </a>
              )}
            </div>
          )}

          {/* Ausleihen */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-gray-800">Ausleihen</h2>
              {!activeLending && (
                <button
                  onClick={() => setShowLendForm(!showLendForm)}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <ArrowRightLeft size={14} /> Verleihen
                </button>
              )}
            </div>

            {activeLending && (
              <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                <div className="font-medium text-orange-800">
                  Ausgeliehen an {activeLending.lentTo}
                </div>
                <div className="text-orange-600 text-xs mt-0.5">
                  seit {fmt(activeLending.lentAt)}
                  {activeLending.note && ` · ${activeLending.note}`}
                </div>
                <button
                  onClick={() => returnMut.mutate(activeLending.id)}
                  disabled={returnMut.isPending}
                  className="mt-2 text-xs text-orange-700 hover:text-orange-900 underline"
                >
                  Als zurückgegeben markieren
                </button>
              </div>
            )}

            {showLendForm && (
              <div className="space-y-2 mb-3">
                <input
                  value={lentTo}
                  onChange={(e) => setLentTo(e.target.value)}
                  placeholder="Name der Person"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  value={lentNote}
                  onChange={(e) => setLentNote(e.target.value)}
                  placeholder="Notiz (optional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => lendMut.mutate()}
                  disabled={!lentTo || lendMut.isPending}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  Verleihen
                </button>
              </div>
            )}

            {/* Historie */}
            {item.lendings && item.lendings.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Historie</p>
                {item.lendings.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 text-sm py-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${l.returnedAt ? 'bg-green-400' : 'bg-orange-400'}`} />
                    <span className="text-gray-700">{l.lentTo}</span>
                    <span className="text-gray-400 text-xs">
                      {fmt(l.lentAt)} → {l.returnedAt ? fmt(l.returnedAt) : 'noch ausgeliehen'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (confirm(`"${item.name}" wirklich löschen?`)) deleteMut.mutate();
              }}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700"
            >
              <Trash2 size={15} /> Gegenstand löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-gray-400 uppercase tracking-wide">{label}</dt>
      <dd className="text-gray-800 mt-0.5">{children}</dd>
    </div>
  );
}

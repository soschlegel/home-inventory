import { useState, useRef, useEffect } from 'react';
import { Smile, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EMOJIS: { emoji: string; keywords: string[] }[] = [
  // Räume & Möbel
  { emoji: '🏠', keywords: ['haus', 'home', 'house', 'wohnung'] },
  { emoji: '🏡', keywords: ['haus', 'garten', 'home', 'garden'] },
  { emoji: '🛏', keywords: ['bett', 'schlafzimmer', 'bedroom', 'bed'] },
  { emoji: '🛁', keywords: ['bad', 'badewanne', 'bathroom', 'bath'] },
  { emoji: '🚿', keywords: ['dusche', 'bad', 'shower', 'bathroom'] },
  { emoji: '🪑', keywords: ['stuhl', 'sitz', 'chair', 'seat'] },
  { emoji: '🛋', keywords: ['sofa', 'couch', 'wohnzimmer', 'living'] },
  { emoji: '🚪', keywords: ['tür', 'door', 'eingang', 'entrance'] },
  { emoji: '🪟', keywords: ['fenster', 'window'] },
  { emoji: '🪞', keywords: ['spiegel', 'mirror'] },
  { emoji: '🪴', keywords: ['pflanze', 'plant', 'blume', 'flower'] },
  { emoji: '🌡', keywords: ['thermometer', 'temperatur', 'temperature'] },
  // Küche
  { emoji: '🍳', keywords: ['küche', 'kitchen', 'pfanne', 'kochen', 'pan', 'cook'] },
  { emoji: '🧊', keywords: ['eis', 'kühlschrank', 'fridge', 'ice', 'kühlen'] },
  { emoji: '🍽', keywords: ['teller', 'plate', 'geschirr', 'dishes', 'küche'] },
  { emoji: '☕', keywords: ['kaffee', 'coffee', 'tee', 'tea', 'becher'] },
  { emoji: '🫖', keywords: ['kanne', 'tee', 'tea', 'pot', 'teekanne'] },
  { emoji: '🥄', keywords: ['löffel', 'spoon', 'besteck', 'cutlery'] },
  { emoji: '🔪', keywords: ['messer', 'knife', 'küche', 'kitchen'] },
  { emoji: '🥢', keywords: ['stäbchen', 'chopsticks', 'küche'] },
  { emoji: '🧂', keywords: ['salz', 'salt', 'gewürz', 'spice'] },
  { emoji: '🍾', keywords: ['flasche', 'bottle', 'wein', 'wine'] },
  { emoji: '🥂', keywords: ['glas', 'glass', 'wein', 'wine', 'trinken'] },
  // Aufbewahrung & Container
  { emoji: '📦', keywords: ['box', 'karton', 'paket', 'package', 'kiste'] },
  { emoji: '🗃', keywords: ['ordner', 'ablage', 'archiv', 'file', 'box'] },
  { emoji: '🗄', keywords: ['schrank', 'ablage', 'cabinet', 'storage'] },
  { emoji: '📂', keywords: ['ordner', 'folder', 'ablage', 'file'] },
  { emoji: '🧺', keywords: ['korb', 'wäsche', 'basket', 'laundry'] },
  { emoji: '🪣', keywords: ['eimer', 'bucket', 'behälter'] },
  { emoji: '🏺', keywords: ['vase', 'krug', 'vase', 'pot', 'jar'] },
  { emoji: '🧴', keywords: ['flasche', 'creme', 'lotion', 'bottle'] },
  { emoji: '🧹', keywords: ['besen', 'reinigung', 'broom', 'clean'] },
  { emoji: '🧻', keywords: ['papier', 'rolle', 'paper', 'roll', 'klo'] },
  // Werkzeug
  { emoji: '🔧', keywords: ['schraubenschlüssel', 'werkzeug', 'wrench', 'tool', 'reparatur'] },
  { emoji: '🔨', keywords: ['hammer', 'werkzeug', 'tool', 'hämmern'] },
  { emoji: '🪛', keywords: ['schraubenzieher', 'screwdriver', 'werkzeug', 'tool'] },
  { emoji: '🪚', keywords: ['säge', 'saw', 'werkzeug', 'tool', 'holz'] },
  { emoji: '🔩', keywords: ['schraube', 'screw', 'mutter', 'bolt'] },
  { emoji: '🪝', keywords: ['haken', 'hook', 'aufhängen', 'hang'] },
  { emoji: '🧰', keywords: ['werkzeugkasten', 'toolbox', 'werkzeug', 'tool'] },
  { emoji: '🔦', keywords: ['taschenlampe', 'flashlight', 'licht', 'light'] },
  { emoji: '🪜', keywords: ['leiter', 'ladder', 'klettern', 'climb'] },
  { emoji: '🔑', keywords: ['schlüssel', 'key', 'schloss', 'lock'] },
  { emoji: '🪤', keywords: ['falle', 'trap', 'maus'] },
  // Elektronik & Technik
  { emoji: '💡', keywords: ['lampe', 'licht', 'light', 'lamp', 'idee', 'idea'] },
  { emoji: '🔌', keywords: ['stecker', 'strom', 'plug', 'power', 'elektro'] },
  { emoji: '📱', keywords: ['handy', 'phone', 'smartphone', 'mobile'] },
  { emoji: '💻', keywords: ['laptop', 'computer', 'notebook', 'pc'] },
  { emoji: '🖥', keywords: ['monitor', 'computer', 'desktop', 'bildschirm'] },
  { emoji: '📺', keywords: ['fernseher', 'tv', 'television', 'bildschirm'] },
  { emoji: '📷', keywords: ['kamera', 'camera', 'foto', 'photo'] },
  { emoji: '🎙', keywords: ['mikrofon', 'microphone', 'audio', 'musik'] },
  { emoji: '🖨', keywords: ['drucker', 'printer', 'büro', 'office'] },
  { emoji: '⌨️', keywords: ['tastatur', 'keyboard', 'computer', 'büro'] },
  { emoji: '🖱', keywords: ['maus', 'mouse', 'computer'] },
  { emoji: '🔋', keywords: ['batterie', 'battery', 'akku', 'energie'] },
  // Kleidung & Accessoires
  { emoji: '👕', keywords: ['shirt', 'hemd', 'kleidung', 'clothes', 'tshirt'] },
  { emoji: '👔', keywords: ['hemd', 'shirt', 'businesshemd', 'kleidung'] },
  { emoji: '👖', keywords: ['hose', 'jeans', 'pants', 'kleidung'] },
  { emoji: '🧥', keywords: ['jacke', 'mantel', 'jacket', 'coat', 'kleidung'] },
  { emoji: '👗', keywords: ['kleid', 'dress', 'kleidung', 'fashion'] },
  { emoji: '🧣', keywords: ['schal', 'scarf', 'winter', 'kleidung'] },
  { emoji: '🧤', keywords: ['handschuhe', 'gloves', 'winter', 'kleidung'] },
  { emoji: '🧢', keywords: ['kappe', 'mütze', 'cap', 'hat', 'kleidung'] },
  { emoji: '👒', keywords: ['hut', 'hat', 'kleidung'] },
  { emoji: '👟', keywords: ['schuhe', 'shoes', 'sneaker', 'sport'] },
  { emoji: '👠', keywords: ['schuhe', 'heels', 'pumps', 'kleidung'] },
  { emoji: '🧦', keywords: ['socken', 'socks', 'kleidung'] },
  // Sport & Freizeit
  { emoji: '⚽', keywords: ['fußball', 'soccer', 'ball', 'sport'] },
  { emoji: '🏀', keywords: ['basketball', 'ball', 'sport'] },
  { emoji: '🎾', keywords: ['tennis', 'ball', 'sport'] },
  { emoji: '🚲', keywords: ['fahrrad', 'bike', 'bicycle', 'sport', 'fahren'] },
  { emoji: '🏋', keywords: ['gewicht', 'fitness', 'gym', 'sport', 'hantel'] },
  { emoji: '🎿', keywords: ['ski', 'winter', 'sport', 'schnee', 'snow'] },
  { emoji: '⛷', keywords: ['ski', 'winter', 'sport', 'berg', 'mountain'] },
  { emoji: '🧘', keywords: ['yoga', 'meditation', 'sport', 'fitness'] },
  // Bücher & Büro
  { emoji: '📚', keywords: ['bücher', 'books', 'lesen', 'read', 'bibliothek'] },
  { emoji: '📖', keywords: ['buch', 'book', 'lesen', 'read'] },
  { emoji: '✏️', keywords: ['stift', 'pencil', 'schreiben', 'write', 'büro'] },
  { emoji: '🖊', keywords: ['stift', 'pen', 'schreiben', 'write'] },
  { emoji: '📝', keywords: ['notiz', 'note', 'schreiben', 'write', 'büro'] },
  { emoji: '📌', keywords: ['pin', 'nadel', 'büro', 'office', 'anheften'] },
  { emoji: '📎', keywords: ['büroklammer', 'paperclip', 'büro', 'office'] },
  { emoji: '🗑', keywords: ['papierkorb', 'trash', 'müll', 'bin', 'löschen'] },
  // Spielzeug & Hobby
  { emoji: '🧸', keywords: ['teddybär', 'teddy', 'spielzeug', 'toy', 'kind'] },
  { emoji: '🧩', keywords: ['puzzle', 'spielzeug', 'toy', 'spiel', 'game'] },
  { emoji: '🎮', keywords: ['controller', 'spiel', 'game', 'gaming', 'konsole'] },
  { emoji: '🎸', keywords: ['gitarre', 'guitar', 'musik', 'music'] },
  { emoji: '🎹', keywords: ['klavier', 'piano', 'keyboard', 'musik', 'music'] },
  { emoji: '🎨', keywords: ['farbe', 'malen', 'art', 'paint', 'kunst'] },
  { emoji: '🪆', keywords: ['puppe', 'doll', 'spielzeug', 'toy'] },
  // Natur & Garten
  { emoji: '🌿', keywords: ['pflanze', 'plant', 'grün', 'green', 'natur', 'nature'] },
  { emoji: '🌸', keywords: ['blume', 'flower', 'frühling', 'spring', 'pink'] },
  { emoji: '🌻', keywords: ['sonnenblume', 'sunflower', 'blume', 'flower', 'gelb'] },
  { emoji: '🌲', keywords: ['baum', 'tree', 'wald', 'forest', 'natur'] },
  { emoji: '🪵', keywords: ['holz', 'wood', 'stamm', 'log', 'brennholz'] },
  { emoji: '🌱', keywords: ['samen', 'seed', 'pflanze', 'plant', 'sprössling'] },
  // Medizin & Haushalt
  { emoji: '💊', keywords: ['tablette', 'pill', 'medizin', 'medicine', 'apotheke'] },
  { emoji: '🩺', keywords: ['arzt', 'doctor', 'medizin', 'health', 'stethoskop'] },
  { emoji: '🧯', keywords: ['feuerlöscher', 'fire extinguisher', 'sicherheit', 'safety'] },
  { emoji: '🔐', keywords: ['schloss', 'lock', 'sicherheit', 'safe', 'security'] },
  { emoji: '🛡', keywords: ['schild', 'schutz', 'shield', 'protection', 'sicherheit'] },
  // Sonstiges
  { emoji: '🎁', keywords: ['geschenk', 'present', 'gift', 'geburtstag', 'birthday'] },
  { emoji: '🎀', keywords: ['schleife', 'ribbon', 'geschenk', 'dekoration'] },
  { emoji: '⭐', keywords: ['stern', 'star', 'favorit', 'favorite'] },
  { emoji: '❤️', keywords: ['herz', 'heart', 'liebe', 'love'] },
  { emoji: '🏷', keywords: ['etikett', 'label', 'tag', 'preis', 'price'] },
  { emoji: '🔍', keywords: ['suche', 'search', 'lupe', 'magnifier'] },
];

interface Props {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}

export default function EmojiPickerInput({ value, onChange, className = '' }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPopupPos({
        top: rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 296),
      });
    }
    setOpen((o) => !o);
    if (open) setSearch('');
  };

  const filtered = search.trim()
    ? EMOJIS.filter((e) =>
        e.keywords.some((k) => k.includes(search.toLowerCase().trim())),
      )
    : EMOJIS;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className="h-10 w-12 border border-gray-300 rounded-lg text-xl flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        title={t('emojiPicker.open')}
      >
        {value ? (
          <span>{value}</span>
        ) : (
          <Smile size={18} className="text-gray-400" />
        )}
      </button>

      {open && (
        <div
          className="fixed z-[200] bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-72"
          style={{ top: popupPos.top, left: popupPos.left }}
        >
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('emojiPicker.search_placeholder')}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">{t('emojiPicker.no_results')}</p>
          ) : (
            <div className="grid grid-cols-8 gap-0.5 max-h-52 overflow-y-auto">
              {filtered.map(({ emoji }) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onChange(emoji);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="text-xl p-1.5 rounded hover:bg-gray-100 transition-colors leading-none"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
                setSearch('');
              }}
              className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors py-1"
            >
              <X size={12} /> {t('emojiPicker.remove')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

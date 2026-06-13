import { useState, useRef, useEffect } from 'react';
import { Smile, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EMOJIS: { emoji: string; keywords: string[] }[] = [
  // Räume
  { emoji: '🏠', keywords: ['haus', 'home', 'house', 'wohnung', 'gebäude'] },
  { emoji: '🏡', keywords: ['haus', 'garten', 'home', 'garden', 'draußen'] },
  { emoji: '🛋', keywords: ['sofa', 'couch', 'wohnzimmer', 'living', 'lounge'] },
  { emoji: '🛏', keywords: ['bett', 'schlafzimmer', 'bedroom', 'bed', 'schlafen'] },
  { emoji: '🛁', keywords: ['bad', 'badewanne', 'badezimmer', 'bathroom', 'bath'] },
  { emoji: '🚿', keywords: ['dusche', 'bad', 'badezimmer', 'shower', 'bathroom'] },
  { emoji: '🍳', keywords: ['küche', 'kitchen', 'pfanne', 'kochen', 'pan', 'cook'] },
  { emoji: '🏢', keywords: ['büro', 'office', 'arbeit', 'work', 'gebäude', 'building'] },
  { emoji: '💼', keywords: ['büro', 'office', 'arbeit', 'work', 'aktenkoffer'] },
  { emoji: '🚗', keywords: ['garage', 'auto', 'car', 'fahrzeug', 'pkw'] },
  { emoji: '🌳', keywords: ['garten', 'garden', 'baum', 'tree', 'draußen', 'outdoor', 'terrasse'] },
  { emoji: '🌿', keywords: ['garten', 'terrasse', 'balkon', 'pflanze', 'plant', 'grün', 'natur'] },
  { emoji: '🚪', keywords: ['flur', 'korridor', 'eingang', 'tür', 'door', 'hallway', 'diele'] },
  { emoji: '🪜', keywords: ['keller', 'dachboden', 'basement', 'attic', 'leiter', 'ladder'] },
  { emoji: '🧹', keywords: ['hauswirtschaft', 'abstellraum', 'keller', 'besen', 'broom', 'clean'] },
  { emoji: '🪑', keywords: ['stuhl', 'sitz', 'chair', 'seat', 'esszimmer', 'dining'] },
  { emoji: '🪟', keywords: ['fenster', 'window', 'wohnzimmer', 'zimmer'] },
  { emoji: '🪞', keywords: ['spiegel', 'mirror', 'schlafzimmer', 'bad', 'flur'] },
  { emoji: '🌡', keywords: ['thermometer', 'temperatur', 'temperature', 'heizung'] },
  { emoji: '🪴', keywords: ['pflanze', 'plant', 'blume', 'flower', 'wohnzimmer', 'balkon'] },
  // Aufbewahrung & Container
  { emoji: '📦', keywords: ['box', 'karton', 'paket', 'kiste', 'package', 'container'] },
  { emoji: '🗃', keywords: ['schublade', 'drawer', 'ablage', 'archiv', 'ordner', 'file'] },
  { emoji: '🗄', keywords: ['schrank', 'aktenschrank', 'cabinet', 'storage', 'regal'] },
  { emoji: '🧳', keywords: ['koffer', 'suitcase', 'reise', 'travel', 'gepäck', 'abstellraum'] },
  { emoji: '🧺', keywords: ['korb', 'wäschekorb', 'basket', 'laundry', 'wäsche'] },
  { emoji: '🪣', keywords: ['eimer', 'bucket', 'behälter', 'keller'] },
  { emoji: '🏺', keywords: ['krug', 'vase', 'pot', 'jar', 'vorratsglas'] },
  { emoji: '📂', keywords: ['ordner', 'folder', 'ablage', 'büro', 'file'] },
  { emoji: '🧊', keywords: ['kühlschrank', 'fridge', 'tiefkühler', 'freezer', 'eis', 'ice'] },
  { emoji: '🧴', keywords: ['flasche', 'creme', 'lotion', 'bad', 'bottle'] },
  { emoji: '🧻', keywords: ['papier', 'rolle', 'paper', 'roll', 'bad', 'klo'] },
  // Küche
  { emoji: '🍽', keywords: ['teller', 'plate', 'geschirr', 'dishes', 'küche', 'esszimmer'] },
  { emoji: '☕', keywords: ['kaffee', 'coffee', 'tee', 'tea', 'becher', 'küche'] },
  { emoji: '🫖', keywords: ['kanne', 'tee', 'tea', 'teekanne', 'küche'] },
  { emoji: '🥄', keywords: ['löffel', 'spoon', 'besteck', 'cutlery', 'küche'] },
  { emoji: '🔪', keywords: ['messer', 'knife', 'küche', 'kitchen', 'besteck'] },
  { emoji: '🧂', keywords: ['salz', 'salt', 'gewürz', 'spice', 'vorrat'] },
  { emoji: '🍾', keywords: ['flasche', 'bottle', 'wein', 'wine', 'keller'] },
  { emoji: '🥂', keywords: ['glas', 'glass', 'wein', 'wine', 'trinken', 'küche'] },
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
  const [alignRight, setAlignRight] = useState(false);
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
      setAlignRight(rect.left + 288 > window.innerWidth);
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
          className={`absolute z-[200] bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-72 top-full mt-1 ${alignRight ? 'right-0' : 'left-0'}`}
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

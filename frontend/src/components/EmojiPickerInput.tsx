import { useState, useRef, useEffect } from 'react';
import { Smile, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EMOJIS: { emoji: string; keywords: string[] }[] = [
  // Räume – Wohnen
  { emoji: '🏠', keywords: ['haus', 'home', 'house', 'wohnung', 'gebäude'] },
  { emoji: '🏡', keywords: ['haus', 'garten', 'home', 'garden', 'draußen', 'gartenhaus'] },
  { emoji: '🛋', keywords: ['sofa', 'couch', 'wohnzimmer', 'living', 'lounge', 'sessel'] },
  { emoji: '🛏', keywords: ['bett', 'schlafzimmer', 'bedroom', 'bed', 'schlafen'] },
  { emoji: '🛁', keywords: ['bad', 'badewanne', 'badezimmer', 'bathroom', 'bath'] },
  { emoji: '🚿', keywords: ['dusche', 'bad', 'badezimmer', 'shower', 'bathroom'] },
  { emoji: '🍳', keywords: ['küche', 'kitchen', 'pfanne', 'kochen', 'pan', 'cook', 'herd'] },
  { emoji: '🚪', keywords: ['flur', 'korridor', 'eingang', 'tür', 'door', 'hallway', 'diele', 'garderobe'] },
  { emoji: '🪑', keywords: ['stuhl', 'sitz', 'chair', 'seat', 'esszimmer', 'dining'] },
  { emoji: '🪟', keywords: ['fenster', 'window', 'wohnzimmer', 'zimmer', 'wintergarten'] },
  { emoji: '🪞', keywords: ['spiegel', 'mirror', 'schlafzimmer', 'bad', 'flur', 'ankleidezimmer'] },
  { emoji: '🪴', keywords: ['pflanze', 'plant', 'blume', 'flower', 'wohnzimmer', 'balkon', 'gewächshaus'] },
  // Räume – Büro & Hobby
  { emoji: '🏢', keywords: ['büro', 'office', 'arbeit', 'work', 'homeoffice', 'arbeitszimmer'] },
  { emoji: '💼', keywords: ['büro', 'office', 'arbeit', 'work', 'aktenkoffer', 'arbeitszimmer'] },
  { emoji: '📚', keywords: ['bücher', 'books', 'lesen', 'read', 'bibliothek', 'bücherzimmer', 'lesezimmer'] },
  { emoji: '🎨', keywords: ['farbe', 'malen', 'art', 'paint', 'kunst', 'bastelzimmer', 'atelier', 'hobby'] },
  { emoji: '🎮', keywords: ['controller', 'spiel', 'game', 'gaming', 'konsole', 'spielzimmer', 'gamerraum'] },
  { emoji: '🎵', keywords: ['musik', 'music', 'musikzimmer', 'musikraum', 'instrument', 'studio'] },
  { emoji: '🎬', keywords: ['kino', 'heimkino', 'cinema', 'film', 'movie', 'vorführraum', 'beamer'] },
  { emoji: '📽', keywords: ['projektor', 'beamer', 'kino', 'heimkino', 'cinema'] },
  { emoji: '🎯', keywords: ['darts', 'spielzimmer', 'game', 'hobby', 'freizeitraum', 'billiard'] },
  { emoji: '🎳', keywords: ['bowling', 'freizeitraum', 'spielzimmer', 'kegeln', 'game'] },
  { emoji: '🔬', keywords: ['labor', 'bastelraum', 'hobby', 'modellbau', 'werkraum', 'science'] },
  // Räume – Sport & Fitness
  { emoji: '🏋', keywords: ['fitness', 'gym', 'sport', 'hantel', 'fitnessraum', 'kraftraum'] },
  { emoji: '🧘', keywords: ['yoga', 'meditation', 'sport', 'fitness', 'yogaraum', 'ruhezimmer'] },
  { emoji: '🥊', keywords: ['boxen', 'sport', 'fitness', 'gym', 'kampfsport', 'kickboxen'] },
  { emoji: '🥋', keywords: ['kampfsport', 'sport', 'fitness', 'judo', 'karate', 'dojo'] },
  { emoji: '🏊', keywords: ['pool', 'schwimmbad', 'swim', 'wasser', 'poolraum', 'sauna'] },
  // Räume – Kinder
  { emoji: '👶', keywords: ['kinderzimmer', 'baby', 'nursery', 'babyzimmer', 'kinder'] },
  { emoji: '🧸', keywords: ['kinderzimmer', 'spielzimmer', 'teddy', 'spielzeug', 'toy', 'kind'] },
  // Räume – Außen & Natur
  { emoji: '🚗', keywords: ['garage', 'auto', 'car', 'fahrzeug', 'pkw', 'carport'] },
  { emoji: '🌳', keywords: ['garten', 'garden', 'baum', 'tree', 'draußen', 'outdoor', 'terrasse', 'gartenhaus'] },
  { emoji: '🌿', keywords: ['garten', 'terrasse', 'balkon', 'gewächshaus', 'pflanze', 'grün', 'natur'] },
  { emoji: '🌅', keywords: ['terrasse', 'balkon', 'draußen', 'outdoor', 'dachterrasse', 'garten'] },
  { emoji: '🌱', keywords: ['gewächshaus', 'garten', 'anzucht', 'pflanze', 'samen', 'sprössling'] },
  // Räume – Keller & Technik
  { emoji: '🪜', keywords: ['keller', 'dachboden', 'basement', 'attic', 'leiter', 'ladder', 'abstellraum'] },
  { emoji: '🧹', keywords: ['abstellraum', 'hauswirtschaft', 'keller', 'besen', 'putzraum', 'clean'] },
  { emoji: '🔧', keywords: ['werkstatt', 'werkzeug', 'wrench', 'tool', 'reparatur', 'hobbyraum'] },
  { emoji: '🌡', keywords: ['heizung', 'heizungskeller', 'thermometer', 'temperatur', 'technik'] },
  // Räume – Bar & Genuss
  { emoji: '🍷', keywords: ['weinkeller', 'wein', 'wine', 'bar', 'hausbar', 'keller', 'weinregal'] },
  { emoji: '🍺', keywords: ['bar', 'hausbar', 'bier', 'beer', 'getränke', 'partyraum', 'keller'] },
  { emoji: '☕', keywords: ['kaffee', 'coffee', 'küche', 'tee', 'tea', 'frühstücksecke'] },
  // Räume – Haustiere
  { emoji: '🐾', keywords: ['haustier', 'pet', 'tierraum', 'katze', 'hund', 'tierecke'] },
  { emoji: '🐕', keywords: ['hund', 'dog', 'haustier', 'pet', 'tierraum', 'dogroom'] },
  { emoji: '🐈', keywords: ['katze', 'cat', 'haustier', 'pet', 'tierraum'] },
  // Aufbewahrung & Container
  { emoji: '📦', keywords: ['box', 'karton', 'paket', 'kiste', 'package', 'container', 'lager'] },
  { emoji: '🗃', keywords: ['schublade', 'drawer', 'ablage', 'archiv', 'kartei', 'file'] },
  { emoji: '🗄', keywords: ['schrank', 'aktenschrank', 'cabinet', 'storage', 'regal', 'sideboard'] },
  { emoji: '🧳', keywords: ['koffer', 'suitcase', 'reise', 'travel', 'gepäck', 'abstellraum', 'dachboden'] },
  { emoji: '🧺', keywords: ['korb', 'wäschekorb', 'basket', 'laundry', 'wäsche', 'wäschekeller'] },
  { emoji: '🪣', keywords: ['eimer', 'bucket', 'behälter', 'keller', 'putzraum'] },
  { emoji: '🏺', keywords: ['krug', 'vase', 'pot', 'jar', 'vorratsglas', 'dekoration'] },
  { emoji: '📂', keywords: ['ordner', 'folder', 'ablage', 'büro', 'file', 'archiv'] },
  { emoji: '🧊', keywords: ['kühlschrank', 'fridge', 'tiefkühler', 'freezer', 'gefriergerät', 'eis'] },
  { emoji: '🛒', keywords: ['vorratskammer', 'pantry', 'einkauf', 'vorrat', 'regal', 'lager'] },
  { emoji: '🧲', keywords: ['werkzeugwand', 'pegboard', 'magnet', 'werkstatt', 'magnetleiste', 'werkzeug'] },
  { emoji: '🗑', keywords: ['papierkorb', 'trash', 'müll', 'bin', 'abfall', 'tonne'] },
  { emoji: '📫', keywords: ['briefkasten', 'mailbox', 'eingang', 'flur', 'post', 'eingangsbereich'] },
  { emoji: '🔐', keywords: ['tresor', 'safe', 'sicherheit', 'schloss', 'wertgegenstand', 'security'] },
  // Küche & Haushalt
  { emoji: '🍽', keywords: ['teller', 'plate', 'geschirr', 'dishes', 'küche', 'esszimmer', 'geschirrschrank'] },
  { emoji: '🫖', keywords: ['kanne', 'tee', 'tea', 'teekanne', 'küche', 'teeschrank'] },
  { emoji: '🥄', keywords: ['löffel', 'spoon', 'besteck', 'cutlery', 'küche', 'besteckschublade'] },
  { emoji: '🔪', keywords: ['messer', 'knife', 'küche', 'kitchen', 'besteck', 'messerblock'] },
  { emoji: '🧂', keywords: ['salz', 'salt', 'gewürz', 'spice', 'vorrat', 'gewürzregal'] },
  { emoji: '🍾', keywords: ['flasche', 'bottle', 'wein', 'wine', 'weinkeller', 'bar'] },
  { emoji: '🥂', keywords: ['glas', 'glass', 'wein', 'wine', 'trinken', 'küche', 'bar'] },
  { emoji: '🧴', keywords: ['flasche', 'creme', 'lotion', 'bad', 'hygiene', 'badezimmerschrank'] },
  { emoji: '🧻', keywords: ['papier', 'rolle', 'paper', 'roll', 'bad', 'klo', 'vorrat'] },
  // Werkzeug & Technik
  { emoji: '🔨', keywords: ['hammer', 'werkzeug', 'tool', 'werkstatt', 'hämmern'] },
  { emoji: '🪛', keywords: ['schraubenzieher', 'screwdriver', 'werkzeug', 'tool', 'werkstatt'] },
  { emoji: '🪚', keywords: ['säge', 'saw', 'werkzeug', 'tool', 'holz', 'werkstatt'] },
  { emoji: '🔩', keywords: ['schraube', 'screw', 'mutter', 'bolt', 'werkzeug', 'kleinteile'] },
  { emoji: '🪝', keywords: ['haken', 'hook', 'aufhängen', 'hang', 'wandhaken', 'garderobe'] },
  { emoji: '🧰', keywords: ['werkzeugkasten', 'toolbox', 'werkzeug', 'tool', 'werkstatt'] },
  { emoji: '🔦', keywords: ['taschenlampe', 'flashlight', 'licht', 'keller', 'notfall'] },
  { emoji: '🔑', keywords: ['schlüssel', 'key', 'schlüsselkasten', 'eingang', 'schloss'] },
  { emoji: '🪤', keywords: ['falle', 'trap', 'maus', 'garage', 'keller'] },
  // Elektronik
  { emoji: '💡', keywords: ['lampe', 'licht', 'light', 'lamp', 'leuchtmittel', 'stehlampe'] },
  { emoji: '🔌', keywords: ['stecker', 'strom', 'plug', 'power', 'elektro', 'kabel', 'ladekabel'] },
  { emoji: '📱', keywords: ['handy', 'phone', 'smartphone', 'mobile', 'elektronik'] },
  { emoji: '💻', keywords: ['laptop', 'computer', 'notebook', 'pc', 'büro', 'homeoffice'] },
  { emoji: '🖥', keywords: ['monitor', 'computer', 'desktop', 'bildschirm', 'büro'] },
  { emoji: '📺', keywords: ['fernseher', 'tv', 'television', 'wohnzimmer', 'bildschirm'] },
  { emoji: '📷', keywords: ['kamera', 'camera', 'foto', 'photo', 'kameratasche', 'elektronik'] },
  { emoji: '🎙', keywords: ['mikrofon', 'microphone', 'audio', 'musik', 'studio', 'podcast'] },
  { emoji: '🖨', keywords: ['drucker', 'printer', 'büro', 'office', 'homeoffice'] },
  { emoji: '🔋', keywords: ['batterie', 'battery', 'akku', 'energie', 'ladestation', 'elektronik'] },
  // Kleidung & Accessoires
  { emoji: '👕', keywords: ['shirt', 'hemd', 'kleidung', 'clothes', 'kleiderschrank'] },
  { emoji: '👔', keywords: ['hemd', 'businesshemd', 'kleidung', 'anzug', 'garderobe'] },
  { emoji: '👖', keywords: ['hose', 'jeans', 'pants', 'kleidung', 'kleiderschrank'] },
  { emoji: '🧥', keywords: ['jacke', 'mantel', 'jacket', 'coat', 'kleidung', 'garderobe', 'ankleidezimmer'] },
  { emoji: '👗', keywords: ['kleid', 'dress', 'kleidung', 'fashion', 'ankleidezimmer'] },
  { emoji: '🧣', keywords: ['schal', 'scarf', 'winter', 'kleidung', 'garderobe'] },
  { emoji: '🧤', keywords: ['handschuhe', 'gloves', 'winter', 'kleidung', 'garderobe'] },
  { emoji: '🧢', keywords: ['kappe', 'mütze', 'cap', 'hat', 'kleidung', 'garderobe'] },
  { emoji: '👟', keywords: ['schuhe', 'shoes', 'sneaker', 'sport', 'schuhregal'] },
  { emoji: '👠', keywords: ['schuhe', 'heels', 'pumps', 'kleidung', 'ankleidezimmer'] },
  { emoji: '🧦', keywords: ['socken', 'socks', 'kleidung', 'wäscheschublade'] },
  { emoji: '🎒', keywords: ['rucksack', 'backpack', 'schule', 'sport', 'abstellraum'] },
  // Sport & Freizeit
  { emoji: '⚽', keywords: ['fußball', 'soccer', 'ball', 'sport', 'sportraum', 'keller'] },
  { emoji: '🏀', keywords: ['basketball', 'ball', 'sport', 'sportraum'] },
  { emoji: '🎾', keywords: ['tennis', 'ball', 'sport', 'sportraum'] },
  { emoji: '🚲', keywords: ['fahrrad', 'bike', 'bicycle', 'sport', 'garage', 'keller'] },
  { emoji: '🎿', keywords: ['ski', 'winter', 'sport', 'schnee', 'keller', 'dachboden'] },
  { emoji: '⛷', keywords: ['ski', 'winter', 'sport', 'berg', 'wintersport'] },
  { emoji: '🏂', keywords: ['snowboard', 'winter', 'sport', 'keller', 'dachboden'] },
  { emoji: '🤿', keywords: ['tauchen', 'pool', 'wasser', 'sport', 'sportraum'] },
  { emoji: '🏆', keywords: ['trophäe', 'trophy', 'vitrine', 'auszeichnung', 'pokale', 'ehrung'] },
  // Büro & Schreibwaren
  { emoji: '📖', keywords: ['buch', 'book', 'lesen', 'regal', 'bibliothek'] },
  { emoji: '✏️', keywords: ['stift', 'pencil', 'schreiben', 'büro', 'schreibtisch', 'stifteschale'] },
  { emoji: '🖊', keywords: ['stift', 'pen', 'schreiben', 'büro', 'stifteschale'] },
  { emoji: '📝', keywords: ['notiz', 'note', 'schreiben', 'büro', 'notizbuch'] },
  { emoji: '📌', keywords: ['pin', 'nadel', 'büro', 'office', 'pinnwand'] },
  { emoji: '📎', keywords: ['büroklammer', 'paperclip', 'büro', 'schreibtisch'] },
  // Spielzeug & Hobby
  { emoji: '🧩', keywords: ['puzzle', 'spielzeug', 'toy', 'spiel', 'spielschrank', 'kinderzimmer'] },
  { emoji: '🎸', keywords: ['gitarre', 'guitar', 'musik', 'musikzimmer', 'instrument', 'musikschrank'] },
  { emoji: '🎹', keywords: ['klavier', 'piano', 'keyboard', 'musik', 'musikzimmer'] },
  { emoji: '🎻', keywords: ['geige', 'violin', 'instrument', 'musik', 'musikzimmer', 'klassik'] },
  { emoji: '🪆', keywords: ['puppe', 'doll', 'spielzeug', 'toy', 'kinderzimmer', 'dekoration'] },
  // Natur & Garten
  { emoji: '🌸', keywords: ['blume', 'flower', 'frühling', 'spring', 'garten', 'balkon'] },
  { emoji: '🌻', keywords: ['sonnenblume', 'sunflower', 'blume', 'garten', 'terrasse'] },
  { emoji: '🌲', keywords: ['baum', 'tree', 'wald', 'forest', 'garten', 'draußen'] },
  { emoji: '🪵', keywords: ['holz', 'wood', 'stamm', 'log', 'brennholz', 'kaminholz', 'keller'] },
  // Medizin & Sicherheit
  { emoji: '💊', keywords: ['tablette', 'pill', 'medizin', 'medicine', 'hausapotheke', 'apotheke'] },
  { emoji: '🩺', keywords: ['arzt', 'doctor', 'medizin', 'health', 'erste-hilfe', 'verbandkasten'] },
  { emoji: '🧯', keywords: ['feuerlöscher', 'fire extinguisher', 'sicherheit', 'keller', 'garage'] },
  { emoji: '🛡', keywords: ['schild', 'schutz', 'shield', 'sicherheit', 'tresorzimmer'] },
  { emoji: '🩹', keywords: ['pflaster', 'bandage', 'erste-hilfe', 'medizin', 'bad', 'hausapotheke'] },
  // Sonstiges & Dekoration
  { emoji: '🎁', keywords: ['geschenk', 'present', 'gift', 'geburtstag', 'keller', 'dachboden', 'saisonales'] },
  { emoji: '🎀', keywords: ['schleife', 'ribbon', 'geschenk', 'dekoration', 'bastelschrank'] },
  { emoji: '⭐', keywords: ['stern', 'star', 'favorit', 'favorite', 'besonders'] },
  { emoji: '❤️', keywords: ['herz', 'heart', 'liebe', 'love', 'dekoration'] },
  { emoji: '🏷', keywords: ['etikett', 'label', 'tag', 'preis', 'beschriftung'] },
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

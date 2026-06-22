import '../src/lib/prisma'; // lädt .env + .env.local bevor alles andere
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  await prisma.lending.deleteMany();
  await prisma.instanceDocument.deleteMany();
  await prisma.instance.deleteMany();
  await prisma.productDocument.deleteMany();
  await prisma.productTag.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productGroup.deleteMany();
  await prisma.location.updateMany({ data: { parentId: null } });
  await prisma.location.deleteMany();
  await prisma.room.deleteMany();
  await prisma.containerType.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  // ── Nutzer ────────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      email: 'test@home.local',
      passwordHash: await bcrypt.hash('test1234', 12),
      name: 'Max Mustermann',
      role: 'EDITOR',
    },
  });
  await prisma.user.create({
    data: {
      email: 'viewer@home.local',
      passwordHash: await bcrypt.hash('test1234', 12),
      name: 'Erika Mustermann',
      role: 'VIEWER',
    },
  });

  // ── Einheiten ─────────────────────────────────────────────────────────
  await prisma.unit.createMany({
    data: [
      { key: 'piece', name: 'Stück' },
      { key: 'pack', name: 'Packung' },
      { key: 'pair', name: 'Paar' },
      { key: 'set', name: 'Set' },
      { key: 'box', name: 'Box' },
      { key: 'can', name: 'Dose' },
      { key: 'bottle', name: 'Flasche' },
      { key: 'roll', name: 'Rollen' },
      { key: 'carton', name: 'Karton' },
      { key: 'kg', name: 'kg' },
      { key: 'g', name: 'g' },
      { key: 'mg', name: 'mg' },
      { key: 'liter', name: 'L' },
      { key: 'ml', name: 'ml' },
      { key: 'meter', name: 'm' },
      { key: 'cm', name: 'cm' },
      { key: 'tablet', name: 'Tabletten' },
    ],
  });

  // ── Container-Typen ───────────────────────────────────────────────────
  const [schublade, schrank, regal, box, karton] = await Promise.all([
    prisma.containerType.create({ data: { key: 'drawer', name: 'Schublade', icon: '🗄️' } }),
    prisma.containerType.create({ data: { key: 'cabinet', name: 'Schrank', icon: '🚪' } }),
    prisma.containerType.create({ data: { key: 'shelf', name: 'Regal', icon: '📚' } }),
    prisma.containerType.create({ data: { key: 'box', name: 'Box', icon: '📦' } }),
    prisma.containerType.create({ data: { key: 'carton', name: 'Karton', icon: '🗃️' } }),
  ]);

  // ── Tags ──────────────────────────────────────────────────────────────
  const [lebensmittel, werkzeug, elektronik, kleidung, saisonal, medizin] = await Promise.all([
    prisma.tag.create({ data: { key: 'food', name: 'Lebensmittel' } }),
    prisma.tag.create({ data: { key: 'tool', name: 'Werkzeug' } }),
    prisma.tag.create({ data: { key: 'electronics', name: 'Elektronik' } }),
    prisma.tag.create({ data: { key: 'clothing', name: 'Kleidung' } }),
    prisma.tag.create({ data: { key: 'seasonal', name: 'Saisonal' } }),
    prisma.tag.create({ data: { key: 'medicine', name: 'Medizin' } }),
  ]);

  // ── Räume ─────────────────────────────────────────────────────────────
  const [kueche, wohnzimmer, keller, bad, schlafzimmer] = await Promise.all([
    prisma.room.create({ data: { key: 'kitchen', name: 'Küche', icon: '🍳' } }),
    prisma.room.create({ data: { key: 'living_room', name: 'Wohnzimmer', icon: '🛋️' } }),
    prisma.room.create({ data: { key: 'basement', name: 'Keller', icon: '🏚️' } }),
    prisma.room.create({ data: { key: 'bathroom', name: 'Badezimmer', icon: '🚿' } }),
    prisma.room.create({ data: { key: 'bedroom', name: 'Schlafzimmer', icon: '🛏️' } }),
  ]);

  // ── Locations ─────────────────────────────────────────────────────────
  const kuehlschrank = await prisma.location.create({ data: { name: 'Kühlschrank', containerTypeId: schrank.id, roomId: kueche.id } });
  const vorratsschrank = await prisma.location.create({ data: { name: 'Vorratsschrank', containerTypeId: schrank.id, roomId: kueche.id } });
  const tvSchrank = await prisma.location.create({ data: { name: 'TV-Schrank', containerTypeId: schrank.id, roomId: wohnzimmer.id } });
  const buecherregal = await prisma.location.create({ data: { name: 'Bücherregal', containerTypeId: regal.id, roomId: wohnzimmer.id } });
  const kellerRegal = await prisma.location.create({ data: { name: 'Lagerregal', containerTypeId: regal.id, roomId: keller.id } });
  const werkzeugSchrank = await prisma.location.create({ data: { name: 'Werkzeugschrank', containerTypeId: schrank.id, roomId: keller.id } });
  const winterKarton = await prisma.location.create({ data: { name: 'Winterkleidung Karton', containerTypeId: karton.id, roomId: keller.id, parentId: kellerRegal.id } });
  const weihnachtenBox = await prisma.location.create({ data: { name: 'Weihnachtsdeko Box', containerTypeId: box.id, roomId: keller.id, parentId: kellerRegal.id } });
  const medizinSchrank = await prisma.location.create({ data: { name: 'Medizinschrank', containerTypeId: schrank.id, roomId: bad.id } });
  const unterWaschbecken = await prisma.location.create({ data: { name: 'Unter dem Waschbecken', containerTypeId: schrank.id, roomId: bad.id } });
  const nachttisch = await prisma.location.create({ data: { name: 'Nachttisch Schublade', containerTypeId: schublade.id, roomId: schlafzimmer.id } });

  // ── Artikel-Gruppen ───────────────────────────────────────────────────
  const gruppeLebensmittel = await prisma.productGroup.create({
    data: { name: 'Milch (alle Sorten)', minQuantity: 2 },
  });

  // ── Produkte ──────────────────────────────────────────────────────────
  const [
    pTomatendosen, pSpaghetti, pOlivenoel, pMilchVoll, pMilchLaktosefrei,
    pHdmi, pLotR, pSchrauber, pWinterjacke, pWeihnacht,
    pIbu, pPflaster, pKlopapier,
    pMacBook, pBohrmaschine, pKopfhoerer,
  ] = await Promise.all([
    prisma.product.create({ data: { name: 'Tomatendosen', unit: 'can', minQuantity: 3, tags: { create: [{ tagId: lebensmittel.id }] } } }),
    prisma.product.create({ data: { name: 'Spaghetti', unit: 'pack', minQuantity: 2, tags: { create: [{ tagId: lebensmittel.id }] } } }),
    prisma.product.create({ data: { name: 'Olivenöl extra vergine', description: 'Kaltgepresst, 500ml', unit: 'bottle', minQuantity: 1, tags: { create: [{ tagId: lebensmittel.id }] } } }),
    prisma.product.create({ data: { name: 'Milch (Vollmilch)', unit: 'liter', productGroupId: gruppeLebensmittel.id, tags: { create: [{ tagId: lebensmittel.id }] } } }),
    prisma.product.create({ data: { name: 'Milch (Laktosefrei)', unit: 'liter', productGroupId: gruppeLebensmittel.id, tags: { create: [{ tagId: lebensmittel.id }] } } }),
    prisma.product.create({ data: { name: 'HDMI-Kabel 2m', tags: { create: [{ tagId: elektronik.id }] } } }),
    prisma.product.create({ data: { name: 'Der Herr der Ringe (Trilogie)' } }),
    prisma.product.create({ data: { name: 'Schraubendreher-Set (10-teilig)', tags: { create: [{ tagId: werkzeug.id }] } } }),
    prisma.product.create({ data: { name: 'Winterjacke schwarz', tags: { create: [{ tagId: kleidung.id }, { tagId: saisonal.id }] } } }),
    prisma.product.create({ data: { name: 'Weihnachtsbaumschmuck', description: 'Kugeln rot/gold + LED-Lichterkette 10m', tags: { create: [{ tagId: saisonal.id }] } } }),
    prisma.product.create({ data: { name: 'Ibuprofen 400 mg', unit: 'tablet', minQuantity: 10, tags: { create: [{ tagId: medizin.id }] } } }),
    prisma.product.create({ data: { name: 'Pflaster-Sortiment', unit: 'pack', minQuantity: 1, tags: { create: [{ tagId: medizin.id }] } } }),
    prisma.product.create({ data: { name: 'Toilettenpapier', unit: 'roll', minQuantity: 6 } }),
    prisma.product.create({ data: { name: 'MacBook Pro 14"', description: 'M3 Pro, 16 GB RAM, 512 GB SSD', tags: { create: [{ tagId: elektronik.id }] } } }),
    prisma.product.create({ data: { name: 'Bosch PSB 1800 Akku-Bohrschrauber', description: '18V, inkl. 2 Akkus und Koffer', tags: { create: [{ tagId: werkzeug.id }] } } }),
    prisma.product.create({ data: { name: 'Kopfhörer Sony WH-1000XM5', tags: { create: [{ tagId: elektronik.id }] } } }),
  ]);

  // ── Instanzen ─────────────────────────────────────────────────────────
  await prisma.instance.createMany({
    data: [
      { productId: pTomatendosen.id, quantity: 6, locationId: vorratsschrank.id },
      { productId: pSpaghetti.id, quantity: 2, locationId: vorratsschrank.id },
      { productId: pOlivenoel.id, quantity: 1, purchaseUrl: 'https://www.amazon.de', locationId: vorratsschrank.id },
      { productId: pMilchVoll.id, quantity: 1, locationId: kuehlschrank.id },
      { productId: pMilchLaktosefrei.id, quantity: 1, locationId: kuehlschrank.id },
      { productId: pHdmi.id, quantity: 3, condition: 'GOOD', locationId: tvSchrank.id },
      { productId: pLotR.id, quantity: 1, condition: 'GOOD', locationId: buecherregal.id },
      { productId: pSchrauber.id, quantity: 1, condition: 'GOOD', locationId: werkzeugSchrank.id },
      { productId: pWinterjacke.id, quantity: 1, condition: 'GOOD', locationId: winterKarton.id },
      { productId: pWeihnacht.id, quantity: 1, locationId: weihnachtenBox.id },
      { productId: pIbu.id, quantity: 8, locationId: medizinSchrank.id },
      { productId: pPflaster.id, quantity: 1, locationId: medizinSchrank.id },
      { productId: pKlopapier.id, quantity: 4, locationId: unterWaschbecken.id },
    ],
  });

  const laptop = await prisma.instance.create({
    data: {
      productId: pMacBook.id,
      quantity: 1, condition: 'GOOD', serialNumber: 'FVFXC2XXXXX',
      purchasePrice: 1999.00, purchaseDate: new Date('2024-01-15'), warrantyUntil: new Date('2027-01-15'),
      purchaseUrl: 'https://www.apple.com/de/shop',
      locationId: tvSchrank.id,
    },
  });

  const bohrmaschine = await prisma.instance.create({
    data: {
      productId: pBohrmaschine.id,
      quantity: 1, condition: 'GOOD',
      purchasePrice: 129.99, purchaseDate: new Date('2022-03-10'),
      locationId: werkzeugSchrank.id,
    },
  });

  await prisma.instance.create({
    data: {
      productId: pKopfhoerer.id,
      quantity: 1, condition: 'GOOD',
      purchasePrice: 349.00, purchaseDate: new Date('2023-11-24'), warrantyUntil: new Date('2025-11-24'),
      serialNumber: 'SN-WH1000XM5-001',
      locationId: nachttisch.id,
    },
  });

  // ── Ausleihen ─────────────────────────────────────────────────────────
  await prisma.lending.create({
    data: { instanceId: bohrmaschine.id, lentTo: 'Peter Müller', lentAt: new Date('2026-05-20'), note: 'Für Badezimmer-Renovierung' },
  });
  await prisma.lending.create({
    data: { instanceId: laptop.id, lentTo: 'Anna Schmidt', lentAt: new Date('2026-04-01'), returnedAt: new Date('2026-04-10'), note: 'Für Präsentation geliehen' },
  });

  console.log('✅ Seed abgeschlossen');
  console.log('   EDITOR:  test@home.local / test1234');
  console.log('   VIEWER:  viewer@home.local / test1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

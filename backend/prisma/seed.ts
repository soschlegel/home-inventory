import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.itemTag.deleteMany();
  await prisma.lending.deleteMany();
  await prisma.item.deleteMany();
  await prisma.$executeRaw`UPDATE "Location" SET "parentId" = NULL`;
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

  // ── Container-Typen (geteilt, ohne userId) ────────────────────────────
  const [schublade, schrank, regal, box, karton] = await Promise.all([
    prisma.containerType.create({ data: { name: 'Schublade', icon: '🗄️' } }),
    prisma.containerType.create({ data: { name: 'Schrank', icon: '🚪' } }),
    prisma.containerType.create({ data: { name: 'Regal', icon: '📚' } }),
    prisma.containerType.create({ data: { name: 'Box', icon: '📦' } }),
    prisma.containerType.create({ data: { name: 'Karton', icon: '🗃️' } }),
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

  // ── Räume (geteilt, ohne userId) ──────────────────────────────────────
  const [kueche, wohnzimmer, keller, bad, schlafzimmer] = await Promise.all([
    prisma.room.create({ data: { name: 'Küche', icon: '🍳' } }),
    prisma.room.create({ data: { name: 'Wohnzimmer', icon: '🛋️' } }),
    prisma.room.create({ data: { name: 'Keller', icon: '🏚️' } }),
    prisma.room.create({ data: { name: 'Badezimmer', icon: '🚿' } }),
    prisma.room.create({ data: { name: 'Schlafzimmer', icon: '🛏️' } }),
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

  // ── Items ─────────────────────────────────────────────────────────────
  await prisma.item.createMany({ data: [
    { name: 'Tomatendosen', quantity: 6, unit: 'can', minQuantity: 3, locationId: vorratsschrank.id },
    { name: 'Spaghetti', quantity: 2, unit: 'pack', minQuantity: 2, locationId: vorratsschrank.id },
    { name: 'Olivenöl extra vergine', description: 'Kaltgepresst, 500ml', quantity: 1, unit: 'bottle', minQuantity: 1, purchaseUrl: 'https://www.amazon.de', locationId: vorratsschrank.id },
    { name: 'Milch', quantity: 1, unit: 'liter', minQuantity: 2, locationId: kuehlschrank.id },
    { name: 'HDMI-Kabel 2m', quantity: 3, condition: 'GOOD', locationId: tvSchrank.id },
    { name: 'Der Herr der Ringe (Trilogie)', quantity: 1, condition: 'GOOD', locationId: buecherregal.id },
    { name: 'Schraubendreher-Set (10-teilig)', quantity: 1, condition: 'GOOD', locationId: werkzeugSchrank.id },
    { name: 'Winterjacke schwarz', quantity: 1, condition: 'GOOD', locationId: winterKarton.id },
    { name: 'Weihnachtsbaumschmuck', description: 'Kugeln rot/gold + LED-Lichterkette 10m', quantity: 1, locationId: weihnachtenBox.id },
    { name: 'Ibuprofen 400 mg', quantity: 8, unit: 'tablet', minQuantity: 10, locationId: medizinSchrank.id },
    { name: 'Pflaster-Sortiment', quantity: 1, unit: 'pack', minQuantity: 1, locationId: medizinSchrank.id },
    { name: 'Toilettenpapier', quantity: 4, unit: 'roll', minQuantity: 6, locationId: unterWaschbecken.id },
  ]});

  const laptop = await prisma.item.create({ data: {
    name: 'MacBook Pro 14"', description: 'M3 Pro, 16 GB RAM, 512 GB SSD',
    quantity: 1, condition: 'GOOD', serialNumber: 'FVFXC2XXXXX',
    purchasePrice: 1999.00, purchaseDate: new Date('2024-01-15'), warrantyUntil: new Date('2027-01-15'),
    purchaseUrl: 'https://www.apple.com/de/shop', locationId: tvSchrank.id,
    tags: { create: [{ tagId: elektronik.id }] },
  }});
  const bohrmaschine = await prisma.item.create({ data: {
    name: 'Bosch PSB 1800 Akku-Bohrschrauber', description: '18V, inkl. 2 Akkus und Koffer',
    quantity: 1, condition: 'GOOD', purchasePrice: 129.99, purchaseDate: new Date('2022-03-10'),
    locationId: werkzeugSchrank.id, tags: { create: [{ tagId: werkzeug.id }] },
  }});
  await prisma.item.create({ data: {
    name: 'Kopfhörer Sony WH-1000XM5', quantity: 1, condition: 'GOOD',
    purchasePrice: 349.00, purchaseDate: new Date('2023-11-24'), warrantyUntil: new Date('2025-11-24'),
    serialNumber: 'SN-WH1000XM5-001', locationId: nachttisch.id,
    tags: { create: [{ tagId: elektronik.id }] },
  }});

  // Tags für createMany-Items nachträglich verknüpfen
  const tagItems = await prisma.item.findMany({ where: { name: { in: ['Tomatendosen', 'Spaghetti', 'Olivenöl extra vergine', 'Milch'] } } });
  const werkzeugItems = await prisma.item.findMany({ where: { name: { in: ['Schraubendreher-Set (10-teilig)'] } } });
  const kleidungItems = await prisma.item.findMany({ where: { name: 'Winterjacke schwarz' } });
  const saisonalItems = await prisma.item.findMany({ where: { name: { in: ['Winterjacke schwarz', 'Weihnachtsbaumschmuck'] } } });
  const medizinItems = await prisma.item.findMany({ where: { name: { in: ['Ibuprofen 400 mg', 'Pflaster-Sortiment'] } } });
  const hdmiItem = await prisma.item.findFirst({ where: { name: 'HDMI-Kabel 2m' } });

  await prisma.itemTag.createMany({ data: [
    ...tagItems.map((i) => ({ itemId: i.id, tagId: lebensmittel.id })),
    ...werkzeugItems.map((i) => ({ itemId: i.id, tagId: werkzeug.id })),
    ...kleidungItems.map((i) => ({ itemId: i.id, tagId: kleidung.id })),
    ...saisonalItems.map((i) => ({ itemId: i.id, tagId: saisonal.id })),
    ...medizinItems.map((i) => ({ itemId: i.id, tagId: medizin.id })),
    ...(hdmiItem ? [{ itemId: hdmiItem.id, tagId: elektronik.id }] : []),
  ]});

  // ── Ausleihen ─────────────────────────────────────────────────────────
  await prisma.lending.create({ data: { itemId: bohrmaschine.id, lentTo: 'Peter Müller', lentAt: new Date('2026-05-20'), note: 'Für Badezimmer-Renovierung' } });
  await prisma.lending.create({ data: { itemId: laptop.id, lentTo: 'Anna Schmidt', lentAt: new Date('2026-04-01'), returnedAt: new Date('2026-04-10'), note: 'Für Präsentation geliehen' } });

  console.log('✅ Seed abgeschlossen');
  console.log('   EDITOR:  test@home.local / test1234');
  console.log('   VIEWER:  viewer@home.local / test1234');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

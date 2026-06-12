import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Daten in richtiger Reihenfolge löschen
  await prisma.itemTag.deleteMany();
  await prisma.lending.deleteMany();
  await prisma.item.deleteMany();
  await prisma.$executeRaw`UPDATE "Location" SET "parentId" = NULL`;
  await prisma.location.deleteMany();
  await prisma.room.deleteMany();
  await prisma.containerType.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  // ── User ──────────────────────────────────────────────────────────────
  const user = await prisma.user.create({
    data: {
      email: 'test@home.local',
      passwordHash: await bcrypt.hash('test1234', 12),
      name: 'Max Mustermann',
    },
  });

  // ── Container-Typen (benutzerdefiniert) ───────────────────────────────
  const [schublade, schrank, regal, box, karton] = await Promise.all([
    prisma.containerType.create({ data: { name: 'Schublade', icon: '🗄️', userId: user.id } }),
    prisma.containerType.create({ data: { name: 'Schrank', icon: '🚪', userId: user.id } }),
    prisma.containerType.create({ data: { name: 'Regal', icon: '📚', userId: user.id } }),
    prisma.containerType.create({ data: { name: 'Box', icon: '📦', userId: user.id } }),
    prisma.containerType.create({ data: { name: 'Karton', icon: '🗃️', userId: user.id } }),
  ]);

  // ── Tags ──────────────────────────────────────────────────────────────
  const [lebensmittel, werkzeug, elektronik, kleidung, saisonal, medizin] = await Promise.all([
    prisma.tag.create({ data: { name: 'Lebensmittel' } }),
    prisma.tag.create({ data: { name: 'Werkzeug' } }),
    prisma.tag.create({ data: { name: 'Elektronik' } }),
    prisma.tag.create({ data: { name: 'Kleidung' } }),
    prisma.tag.create({ data: { name: 'Saisonal' } }),
    prisma.tag.create({ data: { name: 'Medizin' } }),
  ]);

  // ── Räume ─────────────────────────────────────────────────────────────
  const [kueche, wohnzimmer, keller, bad, schlafzimmer] = await Promise.all([
    prisma.room.create({ data: { name: 'Küche', icon: '🍳', userId: user.id } }),
    prisma.room.create({ data: { name: 'Wohnzimmer', icon: '🛋️', userId: user.id } }),
    prisma.room.create({ data: { name: 'Keller', icon: '🏚️', userId: user.id } }),
    prisma.room.create({ data: { name: 'Badezimmer', icon: '🚿', userId: user.id } }),
    prisma.room.create({ data: { name: 'Schlafzimmer', icon: '🛏️', userId: user.id } }),
  ]);

  // ── Locations: Küche ──────────────────────────────────────────────────
  const kuehlschrank = await prisma.location.create({
    data: { name: 'Kühlschrank', containerTypeId: schrank.id, roomId: kueche.id },
  });
  const vorratsschrank = await prisma.location.create({
    data: { name: 'Vorratsschrank', containerTypeId: schrank.id, roomId: kueche.id },
  });

  // ── Locations: Wohnzimmer ─────────────────────────────────────────────
  const tvSchrank = await prisma.location.create({
    data: { name: 'TV-Schrank', containerTypeId: schrank.id, roomId: wohnzimmer.id },
  });
  const buecherregal = await prisma.location.create({
    data: { name: 'Bücherregal', containerTypeId: regal.id, roomId: wohnzimmer.id },
  });

  // ── Locations: Keller (mit Verschachtelung) ────────────────────────────
  const kellerRegal = await prisma.location.create({
    data: { name: 'Lagerregal', containerTypeId: regal.id, roomId: keller.id },
  });
  const werkzeugSchrank = await prisma.location.create({
    data: { name: 'Werkzeugschrank', containerTypeId: schrank.id, roomId: keller.id },
  });
  const winterKarton = await prisma.location.create({
    data: {
      name: 'Winterkleidung Karton',
      containerTypeId: karton.id,
      roomId: keller.id,
      parentId: kellerRegal.id,
    },
  });
  const weihnachtenBox = await prisma.location.create({
    data: {
      name: 'Weihnachtsdeko Box',
      containerTypeId: box.id,
      roomId: keller.id,
      parentId: kellerRegal.id,
    },
  });

  // ── Locations: Bad ────────────────────────────────────────────────────
  const medizinSchrank = await prisma.location.create({
    data: { name: 'Medizinschrank', containerTypeId: schrank.id, roomId: bad.id },
  });
  const unterWaschbecken = await prisma.location.create({
    data: { name: 'Unter dem Waschbecken', containerTypeId: schrank.id, roomId: bad.id },
  });

  // ── Locations: Schlafzimmer ────────────────────────────────────────────
  const kleiderschrank = await prisma.location.create({
    data: { name: 'Kleiderschrank', containerTypeId: schrank.id, roomId: schlafzimmer.id },
  });
  const nachttisch = await prisma.location.create({
    data: { name: 'Nachttisch Schublade', containerTypeId: schublade.id, roomId: schlafzimmer.id },
  });

  // ── Items: Küche ──────────────────────────────────────────────────────
  await prisma.item.create({
    data: {
      name: 'Tomatendosen',
      quantity: 6, unit: 'Dose', minQuantity: 3,
      locationId: vorratsschrank.id,
      tags: { create: [{ tagId: lebensmittel.id }] },
    },
  });
  await prisma.item.create({
    data: {
      name: 'Spaghetti',
      quantity: 2, unit: 'Packung', minQuantity: 2,
      locationId: vorratsschrank.id,
      tags: { create: [{ tagId: lebensmittel.id }] },
    },
  });
  await prisma.item.create({
    data: {
      name: 'Olivenöl extra vergine',
      description: 'Kaltgepresst, 500ml',
      quantity: 1, unit: 'Flasche', minQuantity: 1,
      purchaseUrl: 'https://www.amazon.de',
      locationId: vorratsschrank.id,
      tags: { create: [{ tagId: lebensmittel.id }] },
    },
  });
  await prisma.item.create({
    data: {
      name: 'Milch',
      quantity: 1, unit: 'Liter', minQuantity: 2,
      locationId: kuehlschrank.id,
      tags: { create: [{ tagId: lebensmittel.id }] },
    },
  });

  // ── Items: Wohnzimmer ─────────────────────────────────────────────────
  const laptop = await prisma.item.create({
    data: {
      name: 'MacBook Pro 14"',
      description: 'M3 Pro, 16 GB RAM, 512 GB SSD',
      quantity: 1, condition: 'GOOD',
      serialNumber: 'FVFXC2XXXXX',
      purchasePrice: 1999.00,
      purchaseDate: new Date('2024-01-15'),
      warrantyUntil: new Date('2027-01-15'),
      purchaseUrl: 'https://www.apple.com/de/shop',
      locationId: tvSchrank.id,
      tags: { create: [{ tagId: elektronik.id }] },
    },
  });
  await prisma.item.create({
    data: {
      name: 'HDMI-Kabel 2m',
      quantity: 3, condition: 'GOOD',
      locationId: tvSchrank.id,
      tags: { create: [{ tagId: elektronik.id }] },
    },
  });
  await prisma.item.create({
    data: {
      name: 'Der Herr der Ringe (Trilogie)',
      quantity: 1, condition: 'GOOD',
      locationId: buecherregal.id,
    },
  });

  // ── Items: Keller ─────────────────────────────────────────────────────
  const bohrmaschine = await prisma.item.create({
    data: {
      name: 'Bosch PSB 1800 Akku-Bohrschrauber',
      description: '18V, inkl. 2 Akkus und Koffer',
      quantity: 1, condition: 'GOOD',
      purchasePrice: 129.99,
      purchaseDate: new Date('2022-03-10'),
      locationId: werkzeugSchrank.id,
      tags: { create: [{ tagId: werkzeug.id }] },
    },
  });
  await prisma.item.create({
    data: {
      name: 'Schraubendreher-Set (10-teilig)',
      quantity: 1, condition: 'GOOD',
      locationId: werkzeugSchrank.id,
      tags: { create: [{ tagId: werkzeug.id }] },
    },
  });
  await prisma.item.create({
    data: {
      name: 'Winterjacke schwarz',
      quantity: 1, condition: 'GOOD',
      locationId: winterKarton.id,
      tags: { create: [{ tagId: kleidung.id }, { tagId: saisonal.id }] },
    },
  });
  await prisma.item.create({
    data: {
      name: 'Weihnachtsbaumschmuck',
      description: 'Kugeln rot/gold + LED-Lichterkette 10m',
      quantity: 1,
      locationId: weihnachtenBox.id,
      tags: { create: [{ tagId: saisonal.id }] },
    },
  });

  // ── Items: Bad ────────────────────────────────────────────────────────
  await prisma.item.create({
    data: {
      name: 'Ibuprofen 400 mg',
      quantity: 8, unit: 'Tabletten', minQuantity: 10,
      locationId: medizinSchrank.id,
      tags: { create: [{ tagId: medizin.id }] },
    },
  });
  await prisma.item.create({
    data: {
      name: 'Pflaster-Sortiment',
      quantity: 1, unit: 'Packung', minQuantity: 1,
      locationId: medizinSchrank.id,
      tags: { create: [{ tagId: medizin.id }] },
    },
  });
  await prisma.item.create({
    data: {
      name: 'Toilettenpapier',
      quantity: 4, unit: 'Rollen', minQuantity: 6,
      locationId: unterWaschbecken.id,
    },
  });

  // ── Items: Schlafzimmer ────────────────────────────────────────────────
  await prisma.item.create({
    data: {
      name: 'Kopfhörer Sony WH-1000XM5',
      quantity: 1, condition: 'GOOD',
      purchasePrice: 349.00,
      purchaseDate: new Date('2023-11-24'),
      warrantyUntil: new Date('2025-11-24'),
      serialNumber: 'SN-WH1000XM5-001',
      locationId: nachttisch.id,
      tags: { create: [{ tagId: elektronik.id }] },
    },
  });

  // ── Lendings ──────────────────────────────────────────────────────────
  // Aktive Ausleihe
  await prisma.lending.create({
    data: {
      itemId: bohrmaschine.id,
      lentTo: 'Peter Müller',
      lentAt: new Date('2026-05-20'),
      note: 'Für Badezimmer-Renovierung, kommt Mitte Juni zurück',
    },
  });
  // Abgeschlossene Ausleihe
  await prisma.lending.create({
    data: {
      itemId: laptop.id,
      lentTo: 'Anna Schmidt',
      lentAt: new Date('2026-04-01'),
      returnedAt: new Date('2026-04-10'),
      note: 'Für Präsentation geliehen',
    },
  });

  console.log('✅ Seed abgeschlossen');
  console.log('   Login: test@home.local / test1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

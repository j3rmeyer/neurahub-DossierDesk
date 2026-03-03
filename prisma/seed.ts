import { PrismaClient } from "@prisma/client";
import { expandTemplate, DEFAULT_TEMPLATES } from "../src/lib/task-templates";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: "MeyerIT Administratie",
      slug: "meyerit-administratie",
    },
  });
  console.log("Created tenant:", tenant.name);

  // 2. Create test user
  await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: "test-user-001",
      name: "Test Gebruiker",
      email: "test@dossierdesk.nl",
      role: "owner",
    },
  });

  // 3. Create default task templates
  for (const [key, tmpl] of Object.entries(DEFAULT_TEMPLATES)) {
    await prisma.taskTemplate.create({
      data: {
        tenantId: tenant.id,
        name: tmpl.name,
        entityType: tmpl.entityType as "BV" | "HOLDING" | "PARTICULIER" | "EENMANSZAAK" | "VOF" | "STICHTING" | "MAATSCHAP" | "NV",
        isDefault: true,
        items: {
          create: tmpl.tasks.map((t, i) => ({
            title: t.title,
            category: t.category as "BTW" | "JAARREKENING" | "IB" | "VPB" | "LONEN" | "OVERIG",
            recurrence: t.recurrence as "MAANDELIJKS" | "PER_KWARTAAL" | "JAARLIJKS" | "EENMALIG" | null,
            deadlineOffset: t.deadlineOffset,
            sortOrder: i,
          })),
        },
      },
    });
    console.log(`Created template: ${tmpl.name}`);
  }

  // 4. Create client: Jerry Meyer
  const client = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: "Jerry Meyer",
      type: "ZAKELIJK",
      email: "jerry@meyerit.nl",
      phone: "06-12345678",
      address: "Techweg 42",
      zipCode: "1234 AB",
      city: "Amsterdam",
      status: "ACTIEF",
      notes: "Eigenaar MeyerIT. Holding + werkmaatschappij structuur.",
    },
  });
  console.log("Created client:", client.name);

  // 5. Create entities
  const holding = await prisma.entity.create({
    data: {
      clientId: client.id,
      name: "MeyerIT Holding B.V.",
      type: "HOLDING",
      kvkNumber: "12345678",
      btwNumber: "NL001234567B01",
      fiscalYearEnd: "31-12",
    },
  });

  const werkmaatschappij = await prisma.entity.create({
    data: {
      clientId: client.id,
      name: "MeyerIT B.V.",
      type: "BV",
      parentEntityId: holding.id,
      kvkNumber: "87654321",
      btwNumber: "NL009876543B01",
      fiscalYearEnd: "31-12",
    },
  });

  const familie = await prisma.entity.create({
    data: {
      clientId: client.id,
      name: "Familie Meyer",
      type: "FAMILIE",
      fiscalYearEnd: "31-12",
      notes: "IB-aangiftes voor Jerry en Sanne Meyer",
    },
  });

  console.log("Created entities:", holding.name, "&", werkmaatschappij.name, "&", familie.name);

  // 6. Create contacts
  const jerry = await prisma.contact.create({
    data: {
      clientId: client.id,
      firstName: "Jerry",
      lastName: "Meyer",
      email: "jerry@meyerit.nl",
      phone: "06-12345678",
      role: "Eigenaar / Directeur",
      bsn: "123456789",
      dateOfBirth: new Date("1990-03-15"),
    },
  });

  const partner = await prisma.contact.create({
    data: {
      clientId: client.id,
      firstName: "Sanne",
      lastName: "Meyer",
      email: "sanne@meyerit.nl",
      role: "Partner",
      bsn: "987654321",
      dateOfBirth: new Date("1992-07-22"),
    },
  });

  console.log("Created contacts:", `${jerry.firstName} ${jerry.lastName}`, "&", `${partner.firstName} ${partner.lastName}`);

  // 7. Generate tasks from templates
  const year = 2026;

  // Holding tasks
  const holdingTasks = expandTemplate(DEFAULT_TEMPLATES.HOLDING.tasks, year);
  for (const [i, task] of holdingTasks.entries()) {
    await prisma.task.create({
      data: {
        entityId: holding.id,
        title: task.title,
        category: task.category as "BTW" | "JAARREKENING" | "IB" | "VPB" | "LONEN" | "OVERIG",
        recurrence: task.recurrence as "MAANDELIJKS" | "PER_KWARTAAL" | "JAARLIJKS" | "EENMALIG" | null,
        deadline: task.deadline,
        year: task.year,
        period: task.period,
        status: i === 0 ? "IN_BEHANDELING" : "NIET_GESTART", // First task in progress
        sortOrder: i,
      },
    });
  }
  console.log(`Created ${holdingTasks.length} tasks for ${holding.name}`);

  // BV tasks
  const bvTasks = expandTemplate(DEFAULT_TEMPLATES.BV.tasks, year);
  for (const [i, task] of bvTasks.entries()) {
    let status: "NIET_GESTART" | "IN_BEHANDELING" | "WACHT_OP_KLANT" | "AFGEROND" = "NIET_GESTART";
    // Set varied statuses for demo
    if (i === 0) status = "AFGEROND"; // BTW Q1 done
    if (i === 1) status = "IN_BEHANDELING"; // BTW Q2 in progress
    if (i === 7) status = "WACHT_OP_KLANT"; // First lonen waiting

    await prisma.task.create({
      data: {
        entityId: werkmaatschappij.id,
        title: task.title,
        category: task.category as "BTW" | "JAARREKENING" | "IB" | "VPB" | "LONEN" | "OVERIG",
        recurrence: task.recurrence as "MAANDELIJKS" | "PER_KWARTAAL" | "JAARLIJKS" | "EENMALIG" | null,
        deadline: task.deadline,
        year: task.year,
        period: task.period,
        status,
        completedAt: status === "AFGEROND" ? new Date() : null,
        sortOrder: i,
      },
    });
  }
  console.log(`Created ${bvTasks.length} tasks for ${werkmaatschappij.name}`);

  // Familie entity tasks (IB-aangiftes)
  const familieTasks = expandTemplate(DEFAULT_TEMPLATES.FAMILIE.tasks, year);
  for (const [i, task] of familieTasks.entries()) {
    await prisma.task.create({
      data: {
        entityId: familie.id,
        contactId: i === 0 ? jerry.id : partner.id,
        title: `${task.title} - ${i === 0 ? "Jerry" : "Sanne"} Meyer`,
        category: task.category as "BTW" | "JAARREKENING" | "IB" | "VPB" | "LONEN" | "OVERIG",
        recurrence: task.recurrence as "MAANDELIJKS" | "PER_KWARTAAL" | "JAARLIJKS" | "EENMALIG" | null,
        deadline: task.deadline,
        year: task.year,
        period: task.period,
        sortOrder: i,
      },
    });
  }
  console.log(`Created ${familieTasks.length} tasks for ${familie.name}`);

  // ========================================
  // Extra test clients
  // ========================================

  // --- Client 2: Bakkerij De Gouden Krakeling ---
  const bakkerij = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: "Bakkerij De Gouden Krakeling",
      type: "ZAKELIJK",
      email: "info@goudenkrakeling.nl",
      phone: "020-5551234",
      address: "Bakkerstraat 7",
      zipCode: "1012 AA",
      city: "Amsterdam",
      status: "ACTIEF",
      notes: "Familiebakkerij, 3 filialen. Eenmanszaak van Piet Bakker.",
    },
  });

  const bakkerijEntity = await prisma.entity.create({
    data: {
      clientId: bakkerij.id,
      name: "Bakkerij De Gouden Krakeling",
      type: "EENMANSZAAK",
      kvkNumber: "34567890",
      btwNumber: "NL003456789B01",
      fiscalYearEnd: "31-12",
    },
  });

  await prisma.contact.create({
    data: {
      clientId: bakkerij.id,
      firstName: "Piet",
      lastName: "Bakker",
      email: "piet@goudenkrakeling.nl",
      phone: "06-98765432",
      role: "Eigenaar",
    },
  });

  const bakkerijTasks = expandTemplate(DEFAULT_TEMPLATES.EENMANSZAAK.tasks, year);
  for (const [i, task] of bakkerijTasks.entries()) {
    let status: "NIET_GESTART" | "IN_BEHANDELING" | "WACHT_OP_KLANT" | "AFGEROND" = "NIET_GESTART";
    if (i === 0) status = "AFGEROND";
    if (i === 1) status = "IN_BEHANDELING";
    if (i === 4) status = "WACHT_OP_KLANT";

    await prisma.task.create({
      data: {
        entityId: bakkerijEntity.id,
        title: task.title,
        category: task.category as "BTW" | "JAARREKENING" | "IB" | "VPB" | "LONEN" | "OVERIG",
        recurrence: task.recurrence as "MAANDELIJKS" | "PER_KWARTAAL" | "JAARLIJKS" | "EENMALIG" | null,
        deadline: task.deadline,
        year: task.year,
        period: task.period,
        status,
        completedAt: status === "AFGEROND" ? new Date() : null,
        sortOrder: i,
      },
    });
  }
  console.log(`Created client: ${bakkerij.name} (${bakkerijTasks.length} tasks)`);

  // --- Client 3: Van der Berg Advocaten ---
  const advocaten = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: "Van der Berg Advocaten",
      type: "ZAKELIJK",
      email: "kantoor@vdbergadvocaten.nl",
      phone: "010-4441234",
      address: "Coolsingel 100",
      zipCode: "3011 AG",
      city: "Rotterdam",
      status: "ACTIEF",
      notes: "Advocatenkantoor met holding structuur. 12 medewerkers.",
    },
  });

  const vdbHolding = await prisma.entity.create({
    data: {
      clientId: advocaten.id,
      name: "VdB Holding B.V.",
      type: "HOLDING",
      kvkNumber: "45678901",
      btwNumber: "NL004567890B01",
      fiscalYearEnd: "31-12",
    },
  });

  const vdbWerk = await prisma.entity.create({
    data: {
      clientId: advocaten.id,
      name: "Van der Berg Advocaten B.V.",
      type: "BV",
      parentEntityId: vdbHolding.id,
      kvkNumber: "56789012",
      btwNumber: "NL005678901B01",
      fiscalYearEnd: "31-12",
    },
  });

  await prisma.contact.create({
    data: {
      clientId: advocaten.id,
      firstName: "Lisa",
      lastName: "van der Berg",
      email: "lisa@vdbergadvocaten.nl",
      phone: "06-11223344",
      role: "Managing Partner",
    },
  });

  await prisma.contact.create({
    data: {
      clientId: advocaten.id,
      firstName: "Mark",
      lastName: "Jansen",
      email: "mark@vdbergadvocaten.nl",
      phone: "06-55667788",
      role: "CFO",
    },
  });

  const vdbHoldingTasks = expandTemplate(DEFAULT_TEMPLATES.HOLDING.tasks, year);
  for (const [i, task] of vdbHoldingTasks.entries()) {
    await prisma.task.create({
      data: {
        entityId: vdbHolding.id,
        title: task.title,
        category: task.category as "BTW" | "JAARREKENING" | "IB" | "VPB" | "LONEN" | "OVERIG",
        recurrence: task.recurrence as "MAANDELIJKS" | "PER_KWARTAAL" | "JAARLIJKS" | "EENMALIG" | null,
        deadline: task.deadline,
        year: task.year,
        period: task.period,
        status: i < 2 ? "AFGEROND" : "NIET_GESTART",
        completedAt: i < 2 ? new Date() : null,
        sortOrder: i,
      },
    });
  }

  const vdbBvTasks = expandTemplate(DEFAULT_TEMPLATES.BV.tasks, year);
  for (const [i, task] of vdbBvTasks.entries()) {
    let status: "NIET_GESTART" | "IN_BEHANDELING" | "WACHT_OP_KLANT" | "AFGEROND" = "NIET_GESTART";
    if (i < 2) status = "AFGEROND";
    if (i === 2) status = "IN_BEHANDELING";
    if (i === 4) status = "WACHT_OP_KLANT";

    await prisma.task.create({
      data: {
        entityId: vdbWerk.id,
        title: task.title,
        category: task.category as "BTW" | "JAARREKENING" | "IB" | "VPB" | "LONEN" | "OVERIG",
        recurrence: task.recurrence as "MAANDELIJKS" | "PER_KWARTAAL" | "JAARLIJKS" | "EENMALIG" | null,
        deadline: task.deadline,
        year: task.year,
        period: task.period,
        status,
        completedAt: status === "AFGEROND" ? new Date() : null,
        sortOrder: i,
      },
    });
  }
  console.log(`Created client: ${advocaten.name} (${vdbHoldingTasks.length + vdbBvTasks.length} tasks)`);

  // --- Client 4: Kapsalon Mooi ---
  const kapsalon = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: "Kapsalon Mooi",
      type: "ZAKELIJK",
      email: "info@kapsalonmooi.nl",
      phone: "030-2345678",
      address: "Voorstraat 22",
      zipCode: "3512 AP",
      city: "Utrecht",
      status: "ACTIEF",
      notes: "Eenmanszaak, 2 medewerkers in loondienst.",
    },
  });

  const kapsalonEntity = await prisma.entity.create({
    data: {
      clientId: kapsalon.id,
      name: "Kapsalon Mooi",
      type: "EENMANSZAAK",
      kvkNumber: "67890123",
      btwNumber: "NL006789012B01",
      fiscalYearEnd: "31-12",
    },
  });

  await prisma.contact.create({
    data: {
      clientId: kapsalon.id,
      firstName: "Fatima",
      lastName: "El Amrani",
      email: "fatima@kapsalonmooi.nl",
      phone: "06-33445566",
      role: "Eigenaar",
    },
  });

  const kapsalonTasks = expandTemplate(DEFAULT_TEMPLATES.EENMANSZAAK.tasks, year);
  for (const [i, task] of kapsalonTasks.entries()) {
    await prisma.task.create({
      data: {
        entityId: kapsalonEntity.id,
        title: task.title,
        category: task.category as "BTW" | "JAARREKENING" | "IB" | "VPB" | "LONEN" | "OVERIG",
        recurrence: task.recurrence as "MAANDELIJKS" | "PER_KWARTAAL" | "JAARLIJKS" | "EENMALIG" | null,
        deadline: task.deadline,
        year: task.year,
        period: task.period,
        status: i === 0 ? "AFGEROND" : "NIET_GESTART",
        completedAt: i === 0 ? new Date() : null,
        sortOrder: i,
      },
    });
  }
  console.log(`Created client: ${kapsalon.name} (${kapsalonTasks.length} tasks)`);

  // --- Client 5: TechNova Group ---
  const technova = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: "TechNova Group",
      type: "ZAKELIJK",
      email: "finance@technovagroup.nl",
      phone: "040-7654321",
      address: "High Tech Campus 5",
      zipCode: "5656 AE",
      city: "Eindhoven",
      status: "ACTIEF",
      notes: "IT-bedrijf met holding en 2 werkmaatschappijen. Grote klant.",
    },
  });

  const tnHolding = await prisma.entity.create({
    data: {
      clientId: technova.id,
      name: "TechNova Holding B.V.",
      type: "HOLDING",
      kvkNumber: "78901234",
      btwNumber: "NL007890123B01",
      fiscalYearEnd: "31-12",
    },
  });

  const tnSoftware = await prisma.entity.create({
    data: {
      clientId: technova.id,
      name: "TechNova Software B.V.",
      type: "BV",
      parentEntityId: tnHolding.id,
      kvkNumber: "89012345",
      btwNumber: "NL008901234B01",
      fiscalYearEnd: "31-12",
    },
  });

  const tnConsulting = await prisma.entity.create({
    data: {
      clientId: technova.id,
      name: "TechNova Consulting B.V.",
      type: "BV",
      parentEntityId: tnHolding.id,
      kvkNumber: "90123456",
      btwNumber: "NL009012345B01",
      fiscalYearEnd: "31-12",
    },
  });

  await prisma.contact.create({
    data: {
      clientId: technova.id,
      firstName: "David",
      lastName: "Chen",
      email: "david@technovagroup.nl",
      phone: "06-77889900",
      role: "CEO / DGA",
    },
  });

  await prisma.contact.create({
    data: {
      clientId: technova.id,
      firstName: "Sophie",
      lastName: "de Vries",
      email: "sophie@technovagroup.nl",
      phone: "06-11002233",
      role: "Financial Controller",
    },
  });

  const tnHoldingTasks = expandTemplate(DEFAULT_TEMPLATES.HOLDING.tasks, year);
  for (const [i, task] of tnHoldingTasks.entries()) {
    await prisma.task.create({
      data: {
        entityId: tnHolding.id,
        title: task.title,
        category: task.category as "BTW" | "JAARREKENING" | "IB" | "VPB" | "LONEN" | "OVERIG",
        recurrence: task.recurrence as "MAANDELIJKS" | "PER_KWARTAAL" | "JAARLIJKS" | "EENMALIG" | null,
        deadline: task.deadline,
        year: task.year,
        period: task.period,
        status: i === 0 ? "AFGEROND" : i === 1 ? "IN_BEHANDELING" : "NIET_GESTART",
        completedAt: i === 0 ? new Date() : null,
        sortOrder: i,
      },
    });
  }

  const tnSoftwareTasks = expandTemplate(DEFAULT_TEMPLATES.BV.tasks, year);
  for (const [i, task] of tnSoftwareTasks.entries()) {
    let status: "NIET_GESTART" | "IN_BEHANDELING" | "WACHT_OP_KLANT" | "AFGEROND" = "NIET_GESTART";
    if (i === 0) status = "AFGEROND";
    if (i === 1) status = "IN_BEHANDELING";
    if (i === 5) status = "WACHT_OP_KLANT";

    await prisma.task.create({
      data: {
        entityId: tnSoftware.id,
        title: task.title,
        category: task.category as "BTW" | "JAARREKENING" | "IB" | "VPB" | "LONEN" | "OVERIG",
        recurrence: task.recurrence as "MAANDELIJKS" | "PER_KWARTAAL" | "JAARLIJKS" | "EENMALIG" | null,
        deadline: task.deadline,
        year: task.year,
        period: task.period,
        status,
        completedAt: status === "AFGEROND" ? new Date() : null,
        sortOrder: i,
      },
    });
  }

  const tnConsultingTasks = expandTemplate(DEFAULT_TEMPLATES.BV.tasks, year);
  for (const [i, task] of tnConsultingTasks.entries()) {
    let status: "NIET_GESTART" | "IN_BEHANDELING" | "WACHT_OP_KLANT" | "AFGEROND" = "NIET_GESTART";
    if (i < 2) status = "AFGEROND";
    if (i === 2) status = "IN_BEHANDELING";

    await prisma.task.create({
      data: {
        entityId: tnConsulting.id,
        title: task.title,
        category: task.category as "BTW" | "JAARREKENING" | "IB" | "VPB" | "LONEN" | "OVERIG",
        recurrence: task.recurrence as "MAANDELIJKS" | "PER_KWARTAAL" | "JAARLIJKS" | "EENMALIG" | null,
        deadline: task.deadline,
        year: task.year,
        period: task.period,
        status,
        completedAt: status === "AFGEROND" ? new Date() : null,
        sortOrder: i,
      },
    });
  }
  console.log(`Created client: ${technova.name} (${tnHoldingTasks.length + tnSoftwareTasks.length + tnConsultingTasks.length} tasks)`);

  // --- Client 6: Familie de Groot (particulier) ---
  const deGroot = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: "Familie de Groot",
      type: "PARTICULIER",
      email: "jan@degroot.nl",
      phone: "06-44556677",
      address: "Lindelaan 15",
      zipCode: "2341 BC",
      city: "Den Haag",
      status: "ACTIEF",
      notes: "Particuliere klant. Beide partners IB-aangifte.",
    },
  });

  const deGrootFamilie = await prisma.entity.create({
    data: {
      clientId: deGroot.id,
      name: "Familie de Groot",
      type: "FAMILIE",
      fiscalYearEnd: "31-12",
    },
  });

  const janDeGroot = await prisma.contact.create({
    data: {
      clientId: deGroot.id,
      firstName: "Jan",
      lastName: "de Groot",
      email: "jan@degroot.nl",
      phone: "06-44556677",
      role: "Aanvrager",
      bsn: "112233445",
      dateOfBirth: new Date("1975-11-08"),
    },
  });

  await prisma.contact.create({
    data: {
      clientId: deGroot.id,
      firstName: "Maria",
      lastName: "de Groot-Smit",
      email: "maria@degroot.nl",
      phone: "06-99887766",
      role: "Partner",
      bsn: "556677889",
      dateOfBirth: new Date("1978-04-21"),
    },
  });

  const deGrootTasks = expandTemplate(DEFAULT_TEMPLATES.FAMILIE.tasks, year);
  for (const [i, task] of deGrootTasks.entries()) {
    await prisma.task.create({
      data: {
        entityId: deGrootFamilie.id,
        contactId: i === 0 ? janDeGroot.id : undefined,
        title: `${task.title} - ${i === 0 ? "Jan" : "Maria"} de Groot`,
        category: task.category as "BTW" | "JAARREKENING" | "IB" | "VPB" | "LONEN" | "OVERIG",
        recurrence: task.recurrence as "MAANDELIJKS" | "PER_KWARTAAL" | "JAARLIJKS" | "EENMALIG" | null,
        deadline: task.deadline,
        year: task.year,
        period: task.period,
        status: i === 0 ? "IN_BEHANDELING" : "NIET_GESTART",
        sortOrder: i,
      },
    });
  }
  console.log(`Created client: ${deGroot.name} (${deGrootTasks.length} tasks)`);

  // --- Client 7: Restaurant Het Pakhuis (inactief) ---
  const pakhuis = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: "Restaurant Het Pakhuis",
      type: "ZAKELIJK",
      email: "info@hetpakhuis.nl",
      phone: "050-3456789",
      address: "Vismarkt 3",
      zipCode: "9711 KS",
      city: "Groningen",
      status: "INACTIEF",
      notes: "Gestopt per 2025. Alleen nog jaarstukken afronden.",
    },
  });

  const pakhuisEntity = await prisma.entity.create({
    data: {
      clientId: pakhuis.id,
      name: "Het Pakhuis B.V.",
      type: "BV",
      kvkNumber: "23456789",
      fiscalYearEnd: "31-12",
    },
  });

  await prisma.contact.create({
    data: {
      clientId: pakhuis.id,
      firstName: "Thomas",
      lastName: "Mulder",
      email: "thomas@hetpakhuis.nl",
      phone: "06-22334455",
      role: "Voormalig eigenaar",
    },
  });

  await prisma.task.create({
    data: {
      entityId: pakhuisEntity.id,
      title: "Jaarrekening 2025 (afronding)",
      category: "JAARREKENING",
      recurrence: "JAARLIJKS",
      deadline: new Date(2026, 5, 30),
      year: 2025,
      period: null,
      status: "WACHT_OP_KLANT",
      sortOrder: 0,
    },
  });

  await prisma.task.create({
    data: {
      entityId: pakhuisEntity.id,
      title: "VPB-aangifte 2025 (afronding)",
      category: "VPB",
      recurrence: "JAARLIJKS",
      deadline: new Date(2026, 5, 1),
      year: 2025,
      period: null,
      status: "IN_BEHANDELING",
      sortOrder: 1,
    },
  });
  console.log(`Created client: ${pakhuis.name} (2 tasks, INACTIEF)`);

  console.log("\nSeeding complete! 7 clients created.");
  console.log("Login: test@dossierdesk.nl / test123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

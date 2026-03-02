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

  console.log("Created entities:", holding.name, "&", werkmaatschappij.name);

  // 6. Create contacts
  const jerry = await prisma.contact.create({
    data: {
      clientId: client.id,
      firstName: "Jerry",
      lastName: "Meyer",
      email: "jerry@meyerit.nl",
      phone: "06-12345678",
      role: "Eigenaar / Directeur",
    },
  });

  const partner = await prisma.contact.create({
    data: {
      clientId: client.id,
      firstName: "Sanne",
      lastName: "Meyer",
      email: "sanne@meyerit.nl",
      role: "Partner",
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

  // IB tasks for contacts
  const ibTasks = expandTemplate(DEFAULT_TEMPLATES.PARTICULIER.tasks, year);
  for (const contact of [jerry, partner]) {
    for (const [i, task] of ibTasks.entries()) {
      await prisma.task.create({
        data: {
          contactId: contact.id,
          title: `${task.title} - ${contact.firstName} ${contact.lastName}`,
          category: task.category as "BTW" | "JAARREKENING" | "IB" | "VPB" | "LONEN" | "OVERIG",
          recurrence: task.recurrence as "MAANDELIJKS" | "PER_KWARTAAL" | "JAARLIJKS" | "EENMALIG" | null,
          deadline: task.deadline,
          year: task.year,
          period: task.period,
          sortOrder: i,
        },
      });
    }
    console.log(`Created IB task for ${contact.firstName} ${contact.lastName}`);
  }

  console.log("\nSeeding complete!");
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

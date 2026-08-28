import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync('dataset.json', 'utf-8'));
  
  // Clear existing
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.customer.deleteMany();

  console.log('Cleared existing data.');

  let count = 0;
  for (const record of data) {
    // Upsert Customer
    const customer = await prisma.customer.upsert({
      where: { id: record.customer.id },
      update: {},
      create: record.customer
    });

    // Upsert Payment
    await prisma.payment.upsert({
      where: { id: record.payment.id },
      update: {},
      create: {
        ...record.payment,
        customerId: customer.id
      }
    });
    count++;
  }
  
  console.log(`Seeded ${count} records successfully from dataset.json.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync('dataset.json', 'utf-8'));


  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.customer.deleteMany();

  console.log('Cleared existing data.');

  console.log('Cleared existing data. Seeding in parallel...');
  let count = 0;

  const chunkSize = 50;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    
    await Promise.all(chunk.map(async (record: any) => {
      const customer = await prisma.customer.upsert({
        where: { id: record.customer.id },
        update: {},
        create: record.customer
      });

      await prisma.payment.upsert({
        where: { id: record.payment.id },
        update: {},
        create: {
          ...record.payment,
          customerId: customer.id
        }
      });
    }));
    
    count += chunk.length;
    console.log(`Seeded ${count}/${data.length} records...`);
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

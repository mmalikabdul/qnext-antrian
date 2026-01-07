import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seeding...');

  // 0. Buat User Admin Default
  const adminEmail = 'admin@qnext.com';
  // Password default: "admin123"
  // Bun.password.hash adalah async, tapi di script seed kita pakai plain text hash untuk demo atau gunakan bcrypt jika Bun runtime context.
  // Karena seed.ts dijalankan oleh Bun, kita bisa pakai Bun.password
  const hashedPassword = await Bun.password.hash('admin123');

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Super Admin',
      password: hashedPassword,
      role: Role.ADMIN,
      counters: [] // Admin akses semua
    }
  });
  console.log(`Created Admin: ${admin.email} (Password: admin123)`);

  // 1. Buat Layanan (Services)
  const services = [
    { name: 'Customer Service', code: 'A', description: 'Layanan keluhan dan informasi' },
    { name: 'Teller', code: 'B', description: 'Setor dan tarik tunai' },
    { name: 'Poli Umum', code: 'C', description: 'Layanan kesehatan umum' },
  ];

  for (const service of services) {
    const upsertedService = await prisma.service.upsert({
      where: { code: service.code },
      update: {}, 
      create: service,
    });
    console.log(`Created Service: ${upsertedService.name} (${upsertedService.code})`);
  }

  // 2. Buat Loket (Counters)
  const counters = [
    { name: 'Loket 1', label: 'L1' },
    { name: 'Loket 2', label: 'L2' },
    { name: 'Loket 3', label: 'L3' },
  ];

  for (const counter of counters) {
    const count = await prisma.counter.count();
    if (count === 0) {
      await prisma.counter.createMany({ data: counters });
      console.log('Created Counters');
      break; 
    }
  }

  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
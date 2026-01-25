import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, MenuType, TableStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  // Check if already seeded
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('Database already seeded. Skipping...');
    return;
  }

  // Create users
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      name: 'Administrator',
      role: UserRole.ADMIN,
    },
  });

  const staffPassword = await bcrypt.hash('staff123', 10);
  await prisma.user.create({
    data: {
      username: 'staff',
      password: staffPassword,
      name: 'Staff User',
      role: UserRole.STAFF,
    },
  });

  const chefPassword = await bcrypt.hash('chef123', 10);
  await prisma.user.create({
    data: {
      username: 'chef',
      password: chefPassword,
      name: 'Chef User',
      role: UserRole.CHEF,
    },
  });
  console.log('Created 3 users');

  // Create Add-ons
  const addOnsData = [
    { name: 'Extra Egg', price: 15, category: 'topping' },
    { name: 'Extra Meat', price: 30, category: 'topping' },
    { name: 'Extra Vegetables', price: 10, category: 'topping' },
    { name: 'Spicy Sauce', price: 5, category: 'sauce' },
    { name: 'Sweet Sauce', price: 5, category: 'sauce' },
    { name: 'French Fries', price: 35, category: 'side' },
    { name: 'Coleslaw', price: 25, category: 'side' },
  ];
  await prisma.addOn.createMany({ data: addOnsData });
  console.log('Created', addOnsData.length, 'add-ons');

  // Create Add-on Groups
  await prisma.addOnGroup.createMany({
    data: [
      { name: 'Beverage Set', description: 'Choose your drink', price: 29, category: 'beverage-set' },
      { name: 'Dessert Set', description: 'Sweet treat', price: 39, category: 'dessert-set' },
    ],
  });
  console.log('Created 2 add-on groups');

  // Create Menu Items
  const menuItemsData = [
    { name: 'Pad Thai', category: 'Thai Food', price: 120, description: 'Classic Thai stir-fried noodles with shrimp', image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e', rating: 4.8, reviewCount: 150, type: MenuType.SINGLE },
    { name: 'Tom Yum Soup', category: 'Thai Food', price: 150, description: 'Spicy and sour Thai soup with prawns', image: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853', rating: 4.7, reviewCount: 120, type: MenuType.SINGLE },
    { name: 'Green Curry', category: 'Thai Food', price: 140, description: 'Thai green curry with chicken and vegetables', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd', rating: 4.6, reviewCount: 100, type: MenuType.SINGLE },
    { name: 'Fried Rice', category: 'Rice', price: 100, description: 'Thai-style fried rice with egg', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b', rating: 4.5, reviewCount: 200, type: MenuType.SINGLE },
    { name: 'Basil Chicken Rice', category: 'Rice', price: 110, description: 'Stir-fried basil chicken with rice', image: 'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6', rating: 4.9, reviewCount: 180, type: MenuType.SINGLE },
    { name: 'Grilled Pork Set', category: 'Set Menu', price: 199, description: 'Grilled pork with rice, soup, and side dish', image: 'https://images.unsplash.com/photo-1544025162-d76694265947', rating: 4.7, reviewCount: 90, type: MenuType.SET },
    { name: 'Spring Rolls', category: 'Appetizer', price: 80, description: 'Crispy Thai spring rolls', image: 'https://images.unsplash.com/photo-1544025162-d76694265947', rating: 4.4, reviewCount: 75, type: MenuType.SINGLE },
    { name: 'Mango Sticky Rice', category: 'Dessert', price: 90, description: 'Sweet sticky rice with fresh mango', image: 'https://images.unsplash.com/photo-1621293954908-907159247fc8', rating: 4.8, reviewCount: 130, type: MenuType.SINGLE },
    { name: 'Thai Iced Tea', category: 'Beverage', price: 50, description: 'Classic Thai iced tea with milk', image: 'https://images.unsplash.com/photo-1558857563-b371033873b8', rating: 4.6, reviewCount: 95, type: MenuType.SINGLE },
    { name: 'Coconut Water', category: 'Beverage', price: 45, description: 'Fresh young coconut water', image: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e', rating: 4.5, reviewCount: 60, type: MenuType.SINGLE },
  ];
  await prisma.menuItem.createMany({ data: menuItemsData });
  console.log('Created', menuItemsData.length, 'menu items');

  // Create Tables
  const tablesData = [
    { number: 'T01', capacity: 2, size: 'small', status: TableStatus.AVAILABLE, positionX: 100, positionY: 100 },
    { number: 'T02', capacity: 2, size: 'small', status: TableStatus.AVAILABLE, positionX: 200, positionY: 100 },
    { number: 'T03', capacity: 4, size: 'medium', status: TableStatus.AVAILABLE, positionX: 300, positionY: 100 },
    { number: 'T04', capacity: 4, size: 'medium', status: TableStatus.AVAILABLE, positionX: 100, positionY: 200 },
    { number: 'T05', capacity: 6, size: 'large', status: TableStatus.AVAILABLE, positionX: 200, positionY: 200 },
    { number: 'T06', capacity: 8, size: 'large', status: TableStatus.AVAILABLE, positionX: 300, positionY: 200 },
  ];
  await prisma.table.createMany({ data: tablesData });
  console.log('Created', tablesData.length, 'tables');

  // Create Members
  const membersData = [
    { memberId: 'M001', name: 'John Doe', phone: '0812345678', email: 'john@example.com', points: 500, tier: 'silver' },
    { memberId: 'M002', name: 'Jane Smith', phone: '0823456789', email: 'jane@example.com', points: 1200, tier: 'gold' },
    { memberId: 'M003', name: 'Bob Wilson', phone: '0834567890', email: 'bob@example.com', points: 100, tier: 'bronze' },
  ];
  await prisma.member.createMany({ data: membersData });
  console.log('Created', membersData.length, 'members');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

import { PrismaClient, MenuType, TableStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Administrator',
      role: UserRole.ADMIN,
    },
  });
  console.log('Created admin user:', admin.username);

  // Create staff user
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staff = await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      username: 'staff',
      password: staffPassword,
      name: 'Staff User',
      role: UserRole.STAFF,
    },
  });
  console.log('Created staff user:', staff.username);

  // Create chef user
  const chefPassword = await bcrypt.hash('chef123', 10);
  const chef = await prisma.user.upsert({
    where: { username: 'chef' },
    update: {},
    create: {
      username: 'chef',
      password: chefPassword,
      name: 'Chef User',
      role: UserRole.CHEF,
    },
  });
  console.log('Created chef user:', chef.username);

  // Create Add-ons
  const addOns = await Promise.all([
    prisma.addOn.create({
      data: { name: 'Extra Egg', price: 15, category: 'topping' },
    }),
    prisma.addOn.create({
      data: { name: 'Extra Meat', price: 30, category: 'topping' },
    }),
    prisma.addOn.create({
      data: { name: 'Extra Vegetables', price: 10, category: 'topping' },
    }),
    prisma.addOn.create({
      data: { name: 'Spicy Sauce', price: 5, category: 'sauce' },
    }),
    prisma.addOn.create({
      data: { name: 'Sweet Sauce', price: 5, category: 'sauce' },
    }),
    prisma.addOn.create({
      data: { name: 'French Fries', price: 35, category: 'side' },
    }),
    prisma.addOn.create({
      data: { name: 'Coleslaw', price: 25, category: 'side' },
    }),
  ]);
  console.log('Created', addOns.length, 'add-ons');

  // Create Add-on Groups
  const beverageGroup = await prisma.addOnGroup.create({
    data: {
      name: 'Beverage Set',
      description: 'Choose your drink',
      price: 29,
      category: 'beverage-set',
    },
  });

  const dessertGroup = await prisma.addOnGroup.create({
    data: {
      name: 'Dessert Set',
      description: 'Sweet treat',
      price: 39,
      category: 'dessert-set',
    },
  });
  console.log('Created add-on groups');

  // Create Menu Items
  const menuItems = await Promise.all([
    prisma.menuItem.create({
      data: {
        name: 'Pad Thai',
        category: 'Thai Food',
        price: 120,
        description: 'Classic Thai stir-fried noodles with shrimp',
        image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e',
        rating: 4.8,
        reviewCount: 150,
        type: MenuType.SINGLE,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Tom Yum Soup',
        category: 'Thai Food',
        price: 150,
        description: 'Spicy and sour Thai soup with prawns',
        image: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853',
        rating: 4.7,
        reviewCount: 120,
        type: MenuType.SINGLE,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Green Curry',
        category: 'Thai Food',
        price: 140,
        description: 'Thai green curry with chicken and vegetables',
        image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd',
        rating: 4.6,
        reviewCount: 100,
        type: MenuType.SINGLE,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Fried Rice',
        category: 'Rice',
        price: 100,
        description: 'Thai-style fried rice with egg',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b',
        rating: 4.5,
        reviewCount: 200,
        type: MenuType.SINGLE,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Basil Chicken Rice',
        category: 'Rice',
        price: 110,
        description: 'Stir-fried basil chicken with rice',
        image: 'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6',
        rating: 4.9,
        reviewCount: 180,
        type: MenuType.SINGLE,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Grilled Pork Set',
        category: 'Set Menu',
        price: 199,
        description: 'Grilled pork with rice, soup, and side dish',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947',
        rating: 4.7,
        reviewCount: 90,
        type: MenuType.SET,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Spring Rolls',
        category: 'Appetizer',
        price: 80,
        description: 'Crispy Thai spring rolls',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947',
        rating: 4.4,
        reviewCount: 75,
        type: MenuType.SINGLE,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Mango Sticky Rice',
        category: 'Dessert',
        price: 90,
        description: 'Sweet sticky rice with fresh mango',
        image: 'https://images.unsplash.com/photo-1621293954908-907159247fc8',
        rating: 4.8,
        reviewCount: 130,
        type: MenuType.SINGLE,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Thai Iced Tea',
        category: 'Beverage',
        price: 50,
        description: 'Classic Thai iced tea with milk',
        image: 'https://images.unsplash.com/photo-1558857563-b371033873b8',
        rating: 4.6,
        reviewCount: 95,
        type: MenuType.SINGLE,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Coconut Water',
        category: 'Beverage',
        price: 45,
        description: 'Fresh young coconut water',
        image: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e',
        rating: 4.5,
        reviewCount: 60,
        type: MenuType.SINGLE,
      },
    }),
  ]);
  console.log('Created', menuItems.length, 'menu items');

  // Create Tables
  const tables = await Promise.all([
    prisma.table.create({
      data: {
        number: 'T01',
        capacity: 2,
        size: 'small',
        status: TableStatus.AVAILABLE,
        positionX: 100,
        positionY: 100,
      },
    }),
    prisma.table.create({
      data: {
        number: 'T02',
        capacity: 2,
        size: 'small',
        status: TableStatus.AVAILABLE,
        positionX: 200,
        positionY: 100,
      },
    }),
    prisma.table.create({
      data: {
        number: 'T03',
        capacity: 4,
        size: 'medium',
        status: TableStatus.AVAILABLE,
        positionX: 300,
        positionY: 100,
      },
    }),
    prisma.table.create({
      data: {
        number: 'T04',
        capacity: 4,
        size: 'medium',
        status: TableStatus.AVAILABLE,
        positionX: 100,
        positionY: 200,
      },
    }),
    prisma.table.create({
      data: {
        number: 'T05',
        capacity: 6,
        size: 'large',
        status: TableStatus.AVAILABLE,
        positionX: 200,
        positionY: 200,
      },
    }),
    prisma.table.create({
      data: {
        number: 'T06',
        capacity: 8,
        size: 'large',
        status: TableStatus.AVAILABLE,
        positionX: 300,
        positionY: 200,
      },
    }),
  ]);
  console.log('Created', tables.length, 'tables');

  // Create sample members
  const members = await Promise.all([
    prisma.member.create({
      data: {
        memberId: 'M001',
        name: 'John Doe',
        phone: '0812345678',
        email: 'john@example.com',
        points: 500,
        tier: 'silver',
      },
    }),
    prisma.member.create({
      data: {
        memberId: 'M002',
        name: 'Jane Smith',
        phone: '0823456789',
        email: 'jane@example.com',
        points: 1200,
        tier: 'gold',
      },
    }),
    prisma.member.create({
      data: {
        memberId: 'M003',
        name: 'Bob Wilson',
        phone: '0834567890',
        email: 'bob@example.com',
        points: 100,
        tier: 'bronze',
      },
    }),
  ]);
  console.log('Created', members.length, 'members');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

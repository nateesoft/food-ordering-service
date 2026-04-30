import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, MenuType, TableStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { schema: 'food_ordering' });
const prisma = new PrismaClient({ adapter });

// Function to add nested menu items (Steak and Pizza)
async function addNestedMenuItems() {
  // 1. Create Steak menu item
  const steakMenu = await prisma.menuItem.create({
    data: {
      code: 'WF001',
      name: 'Premium Steak',
      category: 'Western Food',
      price: 299,
      description: 'เนื้อสเต็กคุณภาพพรีเมียม เลือกประเภทเนื้อ ขนาด และระดับความสุกได้',
      image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=800',
      rating: 4.9,
      reviewCount: 250,
      type: MenuType.SINGLE,
    },
  });
  console.log('Created Steak menu item');

  // 2. Create Pizza menu item
  const pizzaMenu = await prisma.menuItem.create({
    data: {
      code: 'WF002',
      name: 'Custom Pizza',
      category: 'Western Food',
      price: 199,
      description: 'พิซซ่าหน้าพิเศษ เลือกหน้าได้ตามใจชอบ 2-4 อย่าง',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
      rating: 4.7,
      reviewCount: 180,
      type: MenuType.SINGLE,
    },
  });
  console.log('Created Pizza menu item');

  // 3. Create Nested Menu Options for Steak
  // Level 1: Meat types
  const beefOption = await prisma.nestedMenuOption.create({
    data: {
      name: 'เนื้อวัว (Beef)',
      description: 'เนื้อวัวคุณภาพพรีเมี่ยม นุ่ม ฉ่ำ',
      price: 50,
      type: 'single',
      image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400',
      requireChildSelection: true,
      minChildSelections: 1,
      maxChildSelections: 1,
    },
  });

  const porkOption = await prisma.nestedMenuOption.create({
    data: {
      name: 'เนื้อหมู (Pork)',
      description: 'เนื้อหมูสันนอก นุ่ม หวาน',
      price: 30,
      type: 'single',
      requireChildSelection: true,
      minChildSelections: 1,
      maxChildSelections: 1,
    },
  });

  const chickenOption = await prisma.nestedMenuOption.create({
    data: {
      name: 'เนื้อไก่ (Chicken)',
      description: 'เนื้ออกไก่ หนังกรอบ เนื้อนุ่ม',
      price: 20,
      type: 'single',
      requireChildSelection: false,
      minChildSelections: 0,
      maxChildSelections: 2,
    },
  });

  // Level 2: Beef sizes
  const beef200g = await prisma.nestedMenuOption.create({
    data: {
      name: '200 กรัม',
      description: 'ขนาดมาตรฐาน เหมาะสำหรับ 1 ท่าน',
      price: 0,
      type: 'single',
      parentId: beefOption.id,
      requireChildSelection: true,
      minChildSelections: 1,
      maxChildSelections: 1,
    },
  });

  const beef300g = await prisma.nestedMenuOption.create({
    data: {
      name: '300 กรัม',
      description: 'ขนาดใหญ่ เหมาะสำหรับคนชอบทานเนื้อ',
      price: 100,
      type: 'single',
      parentId: beefOption.id,
      requireChildSelection: true,
      minChildSelections: 1,
      maxChildSelections: 1,
    },
  });

  // Level 3: Doneness for 200g beef
  await prisma.nestedMenuOption.createMany({
    data: [
      { name: 'Rare (สุกนิดหน่อย)', description: 'เนื้อสุกนอก ชมพูข้างใน', price: 0, type: 'single', parentId: beef200g.id },
      { name: 'Medium (สุกปานกลาง)', description: 'เนื้อสุกพอดี นุ่ม ฉ่ำ', price: 0, type: 'single', parentId: beef200g.id },
      { name: 'Well Done (สุกทั่ว)', description: 'เนื้อสุกทั้งชิ้น แน่น กรอบนอก', price: 0, type: 'single', parentId: beef200g.id },
    ],
  });

  // Level 3: Doneness for 300g beef
  await prisma.nestedMenuOption.createMany({
    data: [
      { name: 'Rare (สุกนิดหน่อย)', description: 'เนื้อสุกนอก ชมพูข้างใน', price: 0, type: 'single', parentId: beef300g.id },
      { name: 'Medium (สุกปานกลาง)', description: 'เนื้อสุกพอดี นุ่ม ฉ่ำ', price: 0, type: 'single', parentId: beef300g.id },
      { name: 'Well Done (สุกทั่ว)', description: 'เนื้อสุกทั้งชิ้น แน่น กรอบนอก', price: 0, type: 'single', parentId: beef300g.id },
    ],
  });

  // Level 2: Pork sizes
  const pork150g = await prisma.nestedMenuOption.create({
    data: {
      name: '150 กรัม',
      description: 'ขนาดพอดีคำ',
      price: 0,
      type: 'single',
      parentId: porkOption.id,
      requireChildSelection: true,
      minChildSelections: 1,
      maxChildSelections: 1,
    },
  });

  const pork250g = await prisma.nestedMenuOption.create({
    data: {
      name: '250 กรัม',
      description: 'ขนาดใหญ่',
      price: 50,
      type: 'single',
      parentId: porkOption.id,
      requireChildSelection: true,
      minChildSelections: 1,
      maxChildSelections: 1,
    },
  });

  // Level 3: Doneness for pork
  await prisma.nestedMenuOption.createMany({
    data: [
      { name: 'Medium (สุกปานกลาง)', description: 'เนื้อสุกพอดี นุ่ม ฉ่ำ', price: 0, type: 'single', parentId: pork150g.id },
      { name: 'Well Done (สุกทั่ว)', description: 'เนื้อสุกทั้งชิ้น', price: 0, type: 'single', parentId: pork150g.id },
      { name: 'Medium (สุกปานกลาง)', description: 'เนื้อสุกพอดี นุ่ม ฉ่ำ', price: 0, type: 'single', parentId: pork250g.id },
      { name: 'Well Done (สุกทั่ว)', description: 'เนื้อสุกทั้งชิ้น', price: 0, type: 'single', parentId: pork250g.id },
    ],
  });

  // Level 2: Chicken extras (optional)
  await prisma.nestedMenuOption.createMany({
    data: [
      { name: 'หนังกรอบพิเศษ', description: 'ทอดหนังให้กรอบพิเศษ', price: 15, type: 'single', parentId: chickenOption.id },
      { name: 'ราดซอสพริกไทยดำ', description: 'ซอสพริกไทยดำรสเด็ด', price: 20, type: 'single', parentId: chickenOption.id },
      { name: 'เพิ่มเห็ด', description: 'เห็ดผัดเนย หอมกรุ่น', price: 25, type: 'single', parentId: chickenOption.id },
    ],
  });

  console.log('Created Steak nested options');

  // 4. Create Nested Menu Options for Pizza (toppings)
  const pepperoniTopping = await prisma.nestedMenuOption.create({
    data: {
      name: 'หน้าเปปเปอโรนี',
      description: 'เนื้อเปปเปอโรนี รสชาติจัดจ้าน',
      price: 50,
      type: 'single',
    },
  });

  const hawaiianTopping = await prisma.nestedMenuOption.create({
    data: {
      name: 'หน้าฮาวายเอี้ยน',
      description: 'แฮม สับปะรด รสชาติหวานมัน',
      price: 45,
      type: 'single',
    },
  });

  const seafoodTopping = await prisma.nestedMenuOption.create({
    data: {
      name: 'หน้าซีฟู้ด',
      description: 'กุ้ง ปู หอย สดใหม่',
      price: 80,
      type: 'single',
    },
  });

  const veggieTopping = await prisma.nestedMenuOption.create({
    data: {
      name: 'หน้าผักรวม',
      description: 'ผักสดๆ มากมาย',
      price: 40,
      type: 'single',
    },
  });

  const fourCheeseTopping = await prisma.nestedMenuOption.create({
    data: {
      name: 'หน้า 4 ชีส',
      description: 'ชีส 4 ชนิด เข้มข้น หอมหวาน',
      price: 60,
      type: 'single',
    },
  });

  console.log('Created Pizza nested options');

  // 5. Create Nested Menu Config for Steak
  const steakConfig = await prisma.nestedMenuConfig.create({
    data: {
      menuItemId: steakMenu.id,
      enabled: true,
      requireSelection: true,
      minSelections: 1,
      maxSelections: 1,
    },
  });

  // Link root options to steak config
  await prisma.nestedMenuConfigOption.createMany({
    data: [
      { configId: steakConfig.id, nestedOptionId: beefOption.id },
      { configId: steakConfig.id, nestedOptionId: porkOption.id },
      { configId: steakConfig.id, nestedOptionId: chickenOption.id },
    ],
  });

  console.log('Created Steak nested menu config');

  // 6. Create Nested Menu Config for Pizza
  const pizzaConfig = await prisma.nestedMenuConfig.create({
    data: {
      menuItemId: pizzaMenu.id,
      enabled: true,
      requireSelection: true,
      minSelections: 2,
      maxSelections: 4,
    },
  });

  // Link root options to pizza config
  await prisma.nestedMenuConfigOption.createMany({
    data: [
      { configId: pizzaConfig.id, nestedOptionId: pepperoniTopping.id },
      { configId: pizzaConfig.id, nestedOptionId: hawaiianTopping.id },
      { configId: pizzaConfig.id, nestedOptionId: seafoodTopping.id },
      { configId: pizzaConfig.id, nestedOptionId: veggieTopping.id },
      { configId: pizzaConfig.id, nestedOptionId: fourCheeseTopping.id },
    ],
  });

  console.log('Created Pizza nested menu config');
}

async function main() {
  console.log('Start seeding...');

  // ── Users ──────────────────────────────────────────────────────────────────
  const existingUsers = await prisma.user.count();
  if (existingUsers === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({ data: { username: 'admin', password: hashedPassword, name: 'Administrator', role: UserRole.ADMIN } });
    const staffPassword = await bcrypt.hash('staff123', 10);
    await prisma.user.create({ data: { username: 'staff', password: staffPassword, name: 'Staff User', role: UserRole.STAFF } });
    const chefPassword = await bcrypt.hash('chef123', 10);
    await prisma.user.create({ data: { username: 'chef', password: chefPassword, name: 'Chef User', role: UserRole.CHEF } });
    console.log('Created 3 users');
  } else {
    console.log(`Skipped users (${existingUsers} already exist)`);
  }

  // ── Add-ons ────────────────────────────────────────────────────────────────
  const existingAddOns = await prisma.addOn.count();
  if (existingAddOns === 0) {
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
    console.log(`Created ${addOnsData.length} add-ons`);
  } else {
    console.log(`Skipped add-ons (${existingAddOns} already exist)`);
  }

  // ── Add-on Groups ──────────────────────────────────────────────────────────
  const existingAddOnGroups = await prisma.addOnGroup.count();
  if (existingAddOnGroups === 0) {
    await prisma.addOnGroup.createMany({
      data: [
        { name: 'Beverage Set', description: 'Choose your drink', price: 29, category: 'beverage-set' },
        { name: 'Dessert Set', description: 'Sweet treat', price: 39, category: 'dessert-set' },
      ],
    });
    console.log('Created 2 add-on groups');
  } else {
    console.log(`Skipped add-on groups (${existingAddOnGroups} already exist)`);
  }

  // ── Menu Items ─────────────────────────────────────────────────────────────
  const existingMenuItems = await prisma.menuItem.count();
  if (existingMenuItems === 0) {
    const menuItemsData = [
      { code: 'TF001', name: 'Pad Thai', category: 'Thai Food', price: 120, description: 'Classic Thai stir-fried noodles with shrimp', image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e', rating: 4.8, reviewCount: 150, type: MenuType.SINGLE },
      { code: 'TF002', name: 'Tom Yum Soup', category: 'Thai Food', price: 150, description: 'Spicy and sour Thai soup with prawns', image: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853', rating: 4.7, reviewCount: 120, type: MenuType.SINGLE },
      { code: 'TF003', name: 'Green Curry', category: 'Thai Food', price: 140, description: 'Thai green curry with chicken and vegetables', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd', rating: 4.6, reviewCount: 100, type: MenuType.SINGLE },
      { code: 'RC001', name: 'Fried Rice', category: 'Rice', price: 100, description: 'Thai-style fried rice with egg', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b', rating: 4.5, reviewCount: 200, type: MenuType.SINGLE },
      { code: 'RC002', name: 'Basil Chicken Rice', category: 'Rice', price: 110, description: 'Stir-fried basil chicken with rice', image: 'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6', rating: 4.9, reviewCount: 180, type: MenuType.SINGLE },
      { code: 'SM001', name: 'Grilled Pork Set', category: 'Set Menu', price: 199, description: 'Grilled pork with rice, soup, and side dish', image: 'https://images.unsplash.com/photo-1544025162-d76694265947', rating: 4.7, reviewCount: 90, type: MenuType.SET },
      { code: 'AP001', name: 'Spring Rolls', category: 'Appetizer', price: 80, description: 'Crispy Thai spring rolls', image: 'https://images.unsplash.com/photo-1544025162-d76694265947', rating: 4.4, reviewCount: 75, type: MenuType.SINGLE },
      { code: 'DS001', name: 'Mango Sticky Rice', category: 'Dessert', price: 90, description: 'Sweet sticky rice with fresh mango', image: 'https://images.unsplash.com/photo-1621293954908-907159247fc8', rating: 4.8, reviewCount: 130, type: MenuType.SINGLE },
      { code: 'BV001', name: 'Thai Iced Tea', category: 'Beverage', price: 50, description: 'Classic Thai iced tea with milk', image: 'https://images.unsplash.com/photo-1558857563-b371033873b8', rating: 4.6, reviewCount: 95, type: MenuType.SINGLE },
      { code: 'BV002', name: 'Coconut Water', category: 'Beverage', price: 45, description: 'Fresh young coconut water', image: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e', rating: 4.5, reviewCount: 60, type: MenuType.SINGLE },
    ];
    await prisma.menuItem.createMany({ data: menuItemsData });
    console.log(`Created ${menuItemsData.length} menu items`);
  } else {
    console.log(`Skipped menu items (${existingMenuItems} already exist)`);
  }

  // ── Nested Menu Items (Steak & Pizza) ──────────────────────────────────────
  const steakExists = await prisma.menuItem.findFirst({ where: { name: 'Premium Steak' } });
  if (!steakExists) {
    await addNestedMenuItems();
    console.log('Created nested menu items (Steak & Pizza)');
  } else {
    console.log('Skipped nested menu items (already exist)');
  }

  // ── Tables ─────────────────────────────────────────────────────────────────
  const existingTables = await prisma.table.count();
  if (existingTables === 0) {
    const tablesData = [
      { number: 'T01', capacity: 2, size: 'small', status: TableStatus.AVAILABLE, positionX: 100, positionY: 100 },
      { number: 'T02', capacity: 2, size: 'small', status: TableStatus.AVAILABLE, positionX: 200, positionY: 100 },
      { number: 'T03', capacity: 4, size: 'medium', status: TableStatus.AVAILABLE, positionX: 300, positionY: 100 },
      { number: 'T04', capacity: 4, size: 'medium', status: TableStatus.AVAILABLE, positionX: 100, positionY: 200 },
      { number: 'T05', capacity: 6, size: 'large', status: TableStatus.AVAILABLE, positionX: 200, positionY: 200 },
      { number: 'T06', capacity: 8, size: 'large', status: TableStatus.AVAILABLE, positionX: 300, positionY: 200 },
    ];
    await prisma.table.createMany({ data: tablesData });
    console.log(`Created ${tablesData.length} tables`);
  } else {
    console.log(`Skipped tables (${existingTables} already exist)`);
  }

  // ── Members ────────────────────────────────────────────────────────────────
  const existingMembers = await prisma.member.count();
  if (existingMembers === 0) {
    const membersData = [
      { memberId: 'M001', name: 'John Doe', phone: '0812345678', email: 'john@example.com', points: 500, tier: 'silver' },
      { memberId: 'M002', name: 'Jane Smith', phone: '0823456789', email: 'jane@example.com', points: 1200, tier: 'gold' },
      { memberId: 'M003', name: 'Bob Wilson', phone: '0834567890', email: 'bob@example.com', points: 100, tier: 'bronze' },
    ];
    await prisma.member.createMany({ data: membersData });
    console.log(`Created ${membersData.length} members`);
  } else {
    console.log(`Skipped members (${existingMembers} already exist)`);
  }

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

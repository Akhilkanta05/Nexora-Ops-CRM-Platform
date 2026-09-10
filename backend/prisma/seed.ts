import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with initial data and test accounts...');

  // 1. Clean existing records in reverse dependency order
  await prisma.challanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.followUpNote.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users for all 4 roles
  const salt = await bcrypt.genSalt(10);
  const users = [
    {
      name: 'System Administrator',
      email: 'admin@company.com',
      passwordHash: await bcrypt.hash('Admin@123', salt),
      role: 'ADMIN',
    },
    {
      name: 'Sarah Jenkins (Sales)',
      email: 'sales@company.com',
      passwordHash: await bcrypt.hash('Sales@123', salt),
      role: 'SALES',
    },
    {
      name: 'Wayne Miller (Warehouse)',
      email: 'warehouse@company.com',
      passwordHash: await bcrypt.hash('Warehouse@123', salt),
      role: 'WAREHOUSE',
    },
    {
      name: 'Alice Cooper (Accounts)',
      email: 'accounts@company.com',
      passwordHash: await bcrypt.hash('Accounts@123', salt),
      role: 'ACCOUNTS',
    },
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }
  console.log('✅ Created test users for all 4 roles: ADMIN, SALES, WAREHOUSE, ACCOUNTS');

  // 3. Create Products with varied stock levels
  const productsData = [
    {
      name: 'Industrial Heavy Duty Drill 850W',
      sku: 'TOOL-DRL-001',
      category: 'Power Tools',
      unitPrice: 12500,
      currentStock: 45,
      minStockAlert: 10,
      warehouseLocation: 'Bay A-03',
    },
    {
      name: 'Stainless Steel Fasteners Box (1000pc)',
      sku: 'FAST-SS-002',
      category: 'Fasteners',
      unitPrice: 3400,
      currentStock: 120,
      minStockAlert: 25,
      warehouseLocation: 'Bay B-11',
    },
    {
      name: 'Rotary Hammer SDS Plus 26mm',
      sku: 'TOOL-HMR-003',
      category: 'Power Tools',
      unitPrice: 18900,
      currentStock: 4, // Trigger low stock alert!
      minStockAlert: 8,
      warehouseLocation: 'Bay A-05',
    },
    {
      name: 'Safety Helmet High-Visibility Yellow',
      sku: 'SAFE-HLM-004',
      category: 'Safety Equipment',
      unitPrice: 850,
      currentStock: 350,
      minStockAlert: 50,
      warehouseLocation: 'Rack C-01',
    },
    {
      name: 'Heavy Duty Extension Cable 25m',
      sku: 'ELEC-CBL-005',
      category: 'Electrical',
      unitPrice: 2200,
      currentStock: 2, // Trigger low stock alert!
      minStockAlert: 10,
      warehouseLocation: 'Bay D-07',
    },
    {
      name: 'Precision Laser Distance Meter 60m',
      sku: 'MEAS-LSR-006',
      category: 'Measuring Instruments',
      unitPrice: 6500,
      currentStock: 18,
      minStockAlert: 5,
      warehouseLocation: 'Cabinet E-02',
    },
  ];

  const createdProducts: any[] = [];
  for (const p of productsData) {
    const prod = await prisma.product.create({ data: p });
    createdProducts.push(prod);

    // Initial stock movement log (IN)
    await prisma.stockMovement.create({
      data: {
        productId: prod.id,
        quantity: prod.currentStock,
        movementType: 'IN',
        reason: 'Initial Opening Inventory Intake',
        createdBy: 'Wayne Miller (Warehouse)',
      },
    });
  }
  console.log(`✅ Created ${createdProducts.length} initial products and stock movement audit records.`);

  // 4. Create Customers with rich B2B wholesale context
  const customersData = [
    {
      name: 'Rajesh Sharma',
      mobile: '+91 98201 12345',
      email: 'rajesh@sharmatraders.in',
      businessName: 'Sharma Building Supplies & Traders',
      gstNumber: '27AAAAA0000A1Z5',
      customerType: 'Distributor',
      address: 'Plot 45, GIDC Industrial Estate, Mumbai, MH 400072',
      status: 'Active',
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // in 3 days
      notes: 'Key distributor for Western region. High volume buyer of power tools and fasteners.',
    },
    {
      name: 'Priya Sundaram',
      mobile: '+91 94440 98765',
      email: 'priya@apexinfra.com',
      businessName: 'Apex Infrastructure & Contracting',
      gstNumber: '33BBBBB1111B2Z8',
      customerType: 'Wholesale',
      address: 'Suite 204, Anna Salai Commercial Hub, Chennai, TN 600002',
      status: 'Active',
      followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      notes: 'Procures quarterly for metro line construction contracts. Always requests GST invoice with challan.',
    },
    {
      name: 'Anil Deshmukh',
      mobile: '+91 97123 45678',
      email: 'anil@deshmukhhdw.com',
      businessName: 'Deshmukh Hardware Retail Outlet',
      gstNumber: '27CCCC2222C1Z2',
      customerType: 'Retail',
      address: 'Shop 12, Market Yard, Pune, MH 411037',
      status: 'Lead',
      followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
      notes: 'Interested in becoming an authorized reseller for safety equipment.',
    },
    {
      name: 'Vikram Mehta',
      mobile: '+91 98989 01234',
      email: 'vikram@mehtatools.com',
      businessName: 'Mehta Industrial Tools Corp',
      gstNumber: '24DDDDD3333D1Z9',
      customerType: 'Wholesale',
      address: 'GIDC Phase II, Vatva, Ahmedabad, GJ 382445',
      status: 'Active',
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: 'Regular orders placed on the 1st of every month.',
    },
  ];

  const createdCustomers: any[] = [];
  for (const c of customersData) {
    const cust = await prisma.customer.create({ data: c });
    createdCustomers.push(cust);

    // Add initial follow-up note
    await prisma.followUpNote.create({
      data: {
        customerId: cust.id,
        note: `Account initialized and categorized as ${cust.customerType}. Initial credit check verified.`,
        createdBy: 'Sarah Jenkins (Sales)',
      },
    });
  }
  console.log(`✅ Created ${createdCustomers.length} initial customers and follow-up timeline notes.`);

  // 5. Create Sample Sales Challans
  // Challan 1: Confirmed Challan for Rajesh Sharma
  const cust1 = createdCustomers[0];
  const prod1 = createdProducts[0]; // Drill (12500)
  const prod2 = createdProducts[1]; // Fasteners (3400)

  const qty1 = 2;
  const qty2 = 5;
  const totalAmount1 = qty1 * prod1.unitPrice + qty2 * prod2.unitPrice;
  const totalQty1 = qty1 + qty2;

  const confirmedChallan = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-0001',
      customerId: cust1.id,
      customerSnapshot: JSON.stringify({
        name: cust1.name,
        businessName: cust1.businessName,
        mobile: cust1.mobile,
        email: cust1.email,
        address: cust1.address,
        gstNumber: cust1.gstNumber,
      }),
      totalQuantity: totalQty1,
      totalAmount: totalAmount1,
      status: 'Confirmed',
      createdByName: 'Sarah Jenkins (Sales)',
      confirmedAt: new Date(),
      notes: 'Dispatched via Express Freight. Tracking #EXP-99214.',
      items: {
        create: [
          {
            productId: prod1.id,
            productName: prod1.name,
            sku: prod1.sku,
            unitPrice: prod1.unitPrice,
            quantity: qty1,
            totalPrice: qty1 * prod1.unitPrice,
          },
          {
            productId: prod2.id,
            productName: prod2.name,
            sku: prod2.sku,
            unitPrice: prod2.unitPrice,
            quantity: qty2,
            totalPrice: qty2 * prod2.unitPrice,
          },
        ],
      },
    },
  });

  // Record stock deduction for the confirmed challan
  await prisma.product.update({
    where: { id: prod1.id },
    data: { currentStock: { decrement: qty1 } },
  });
  await prisma.stockMovement.create({
    data: {
      productId: prod1.id,
      quantity: qty1,
      movementType: 'OUT',
      reason: `Sales Challan ${confirmedChallan.challanNumber}`,
      referenceId: confirmedChallan.id,
      createdBy: 'Sarah Jenkins (Sales)',
    },
  });

  await prisma.product.update({
    where: { id: prod2.id },
    data: { currentStock: { decrement: qty2 } },
  });
  await prisma.stockMovement.create({
    data: {
      productId: prod2.id,
      quantity: qty2,
      movementType: 'OUT',
      reason: `Sales Challan ${confirmedChallan.challanNumber}`,
      referenceId: confirmedChallan.id,
      createdBy: 'Sarah Jenkins (Sales)',
    },
  });

  // Challan 2: Draft Challan for Priya Sundaram
  const cust2 = createdCustomers[1];
  const prod4 = createdProducts[3]; // Safety Helmet (850)
  const draftQty = 20;

  await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-0002',
      customerId: cust2.id,
      customerSnapshot: JSON.stringify({
        name: cust2.name,
        businessName: cust2.businessName,
        mobile: cust2.mobile,
        email: cust2.email,
        address: cust2.address,
        gstNumber: cust2.gstNumber,
      }),
      totalQuantity: draftQty,
      totalAmount: draftQty * prod4.unitPrice,
      status: 'Draft',
      createdByName: 'Sarah Jenkins (Sales)',
      notes: 'Draft awaiting site engineer final quantity confirmation.',
      items: {
        create: [
          {
            productId: prod4.id,
            productName: prod4.name,
            sku: prod4.sku,
            unitPrice: prod4.unitPrice,
            quantity: draftQty,
            totalPrice: draftQty * prod4.unitPrice,
          },
        ],
      },
    },
  });

  console.log('✅ Created sample Sales Challans (1 Confirmed with stock deduction + 1 Draft).');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

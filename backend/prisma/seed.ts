import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeding...');

  // Clean existing tables
  await prisma.challanItem.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.customerNote.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Users for all 4 roles
  const users = [
    { name: 'System Admin', email: 'admin@erp.com', password: hashedPassword, role: 'ADMIN' },
    { name: 'Sarah Sales', email: 'sales@erp.com', password: hashedPassword, role: 'SALES' },
    { name: 'Will Warehouse', email: 'warehouse@erp.com', password: hashedPassword, role: 'WAREHOUSE' },
    { name: 'Alex Accounts', email: 'accounts@erp.com', password: hashedPassword, role: 'ACCOUNTS' }
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }
  console.log('✅ Created Default Users for 4 Roles (Admin, Sales, Warehouse, Accounts)');

  // 2. Create Products
  const productsData = [
    { name: 'Industrial Hydraulic Pump 5HP', sku: 'HYD-PUMP-5HP', category: 'Machinery', unitPrice: 1450.0, currentStock: 25, minStockAlert: 5, location: 'Rack A-12' },
    { name: 'Heavy Duty Copper Wire Roll 100m', sku: 'COP-WIRE-100M', category: 'Electrical', unitPrice: 180.0, currentStock: 80, minStockAlert: 15, location: 'Rack B-04' },
    { name: 'Stainless Steel Flange 4-inch', sku: 'SS-FLANGE-4IN', category: 'Hardware', unitPrice: 45.5, currentStock: 3, minStockAlert: 10, location: 'Bin C-01' },
    { name: 'Pneumatic Control Valve 24V', sku: 'PNU-VALVE-24V', category: 'Automation', unitPrice: 320.0, currentStock: 18, minStockAlert: 5, location: 'Rack A-08' },
    { name: 'Digital Pressure Gauge 0-100 PSI', sku: 'GAUGE-100PSI', category: 'Instruments', unitPrice: 95.0, currentStock: 4, minStockAlert: 8, location: 'Bin D-05' },
    { name: 'High Temp Silicone Gasket Set', sku: 'GSK-SIL-HT', category: 'Consumables', unitPrice: 22.0, currentStock: 150, minStockAlert: 20, location: 'Bin D-12' }
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const prod = await prisma.product.create({ data: p });
    createdProducts.push(prod);

    // Add initial stock movement log
    await prisma.stockMovement.create({
      data: {
        productId: prod.id,
        quantity: prod.currentStock,
        type: 'IN',
        reason: 'Initial Inventory Setup Stock',
        createdBy: 'Will Warehouse (WAREHOUSE)'
      }
    });
  }
  console.log('✅ Created Products & Initial Stock Movement Logs');

  // 3. Create Customers
  const customersData = [
    {
      name: 'Rajesh Kumar',
      mobile: '+91 9876543210',
      email: 'rajesh@apexindustries.com',
      businessName: 'Apex Heavy Engineering Pvt Ltd',
      gstNumber: '27AAACA12341Z5',
      type: 'Distributor',
      status: 'Active',
      address: 'Plot 42, Industrial Area Phase II, Mumbai',
      followUpDate: '2026-08-01',
      notes: 'Key distributor for West region. Negotiating Q3 bulk discount.'
    },
    {
      name: 'Anita Sharma',
      mobile: '+91 9811223344',
      email: 'anita@metrobuilders.co',
      businessName: 'Metro Infrastructure & Builders',
      gstNumber: '07BBBCB98761Z2',
      type: 'Wholesale',
      status: 'Active',
      address: 'Sector 62, Technology Park, Noida',
      followUpDate: '2026-07-30',
      notes: 'Requires monthly supply of copper wires & pressure gauges.'
    },
    {
      name: 'Vikram Patel',
      mobile: '+91 9723456789',
      email: 'vikram@pateltraders.in',
      businessName: 'Patel Hardware & Electricals',
      gstNumber: null,
      type: 'Retail',
      status: 'Lead',
      address: 'GIDC Industrial Estate, Ahmedabad',
      followUpDate: '2026-07-28',
      notes: 'New inquiry for pneumatic valves. Sent product catalog PDF.'
    }
  ];

  const createdCustomers = [];
  for (const c of customersData) {
    const cust = await prisma.customer.create({ data: c });
    createdCustomers.push(cust);

    // Initial follow-up note log
    await prisma.customerNote.create({
      data: {
        customerId: cust.id,
        note: `Initial CRM Onboarding Note: ${cust.notes}`,
        createdBy: 'Sarah Sales (SALES)'
      }
    });
  }
  console.log('✅ Created Demo Customers & CRM Follow-up Log History');

  // 4. Create Initial Sample Challan
  const sampleCustomer = createdCustomers[0];
  const sampleProduct1 = createdProducts[0]; // Hydraulic Pump
  const sampleProduct2 = createdProducts[1]; // Copper Wire

  const qty1 = 2;
  const qty2 = 5;
  const item1Subtotal = qty1 * sampleProduct1.unitPrice;
  const item2Subtotal = qty2 * sampleProduct2.unitPrice;
  const totalQty = qty1 + qty2;
  const totalAmt = item1Subtotal + item2Subtotal;

  const snapshot = [
    { productId: sampleProduct1.id, productName: sampleProduct1.name, sku: sampleProduct1.sku, unitPrice: sampleProduct1.unitPrice, quantity: qty1, subtotal: item1Subtotal },
    { productId: sampleProduct2.id, productName: sampleProduct2.name, sku: sampleProduct2.sku, unitPrice: sampleProduct2.unitPrice, quantity: qty2, subtotal: item2Subtotal }
  ];

  const sampleChallan = await prisma.challan.create({
    data: {
      challanNumber: 'CH-20260724-0101',
      customerId: sampleCustomer.id,
      totalQuantity: totalQty,
      totalAmount: totalAmt,
      status: 'Confirmed',
      productSnapshot: JSON.stringify(snapshot),
      createdBy: 'Sarah Sales (SALES)',
      items: {
        create: [
          { productId: sampleProduct1.id, productName: sampleProduct1.name, sku: sampleProduct1.sku, unitPrice: sampleProduct1.unitPrice, quantity: qty1, subtotal: item1Subtotal },
          { productId: sampleProduct2.id, productName: sampleProduct2.name, sku: sampleProduct2.sku, unitPrice: sampleProduct2.unitPrice, quantity: qty2, subtotal: item2Subtotal }
        ]
      }
    }
  });

  // Log stock reduction movement for confirmed sample challan
  await prisma.stockMovement.create({
    data: {
      productId: sampleProduct1.id,
      quantity: qty1,
      type: 'OUT',
      reason: `Sales Challan Confirmation #${sampleChallan.challanNumber}`,
      createdBy: 'Sarah Sales (SALES)'
    }
  });

  await prisma.stockMovement.create({
    data: {
      productId: sampleProduct2.id,
      quantity: qty2,
      type: 'OUT',
      reason: `Sales Challan Confirmation #${sampleChallan.challanNumber}`,
      createdBy: 'Sarah Sales (SALES)'
    }
  });

  console.log('✅ Created Initial Confirmed Sales Challan & Stock Reduction Logs');
  console.log('🎉 Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

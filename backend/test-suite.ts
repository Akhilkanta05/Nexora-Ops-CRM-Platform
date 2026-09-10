import { prisma } from './src/utils/prisma';
import { StockService } from './src/services/stock.service';
import { S3Service } from './src/services/s3.service';
import bcrypt from 'bcryptjs';

async function runTests() {
  console.log('🧪 Starting Core Business Logic & API Tests...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    // 1. Test Users & Role Check
    const users = await prisma.user.findMany();
    assert(users.length === 4, `All 4 test user roles exist in DB (found: ${users.length})`);
    const adminUser = users.find((u) => u.role === 'ADMIN');
    assert(!!adminUser, 'Admin user account exists');
    const isPasswordMatch = await bcrypt.compare('Admin@123', adminUser!.passwordHash);
    assert(isPasswordMatch, 'Password hashing and verification with bcrypt works correctly');

    // 2. Test Customer CRM & Notes
    const customer = await prisma.customer.findFirst({
      include: { followUpLogs: true },
    });
    assert(!!customer, 'Customer records exist');
    assert(customer!.followUpLogs.length > 0, 'Customer has follow-up timeline logs');

    // 3. Test Products & Low Stock Logic
    const products = await prisma.product.findMany();
    assert(products.length >= 6, `Products catalog populated (found: ${products.length})`);
    const lowStockProducts = products.filter((p) => p.currentStock <= p.minStockAlert);
    assert(lowStockProducts.length >= 1, `Low stock alert correctly identifies products below threshold (found: ${lowStockProducts.length})`);

    // 4. Test Stock Adjustment IN and OUT
    const testProduct = await prisma.product.create({
      data: {
        name: 'Unit Test Product Widget',
        sku: 'TEST-SKU-999',
        category: 'Testing',
        unitPrice: 500,
        currentStock: 10,
        minStockAlert: 5,
        warehouseLocation: 'Test Bay',
      },
    });

    const adjustedIn = await StockService.adjustStock({
      productId: testProduct.id,
      quantity: 5,
      movementType: 'IN',
      reason: 'Test Stock Intake',
      createdBy: 'Test Runner',
    });
    assert(adjustedIn.product.currentStock === 15, 'Stock adjustment IN incremented currentStock correctly to 15');

    const adjustedOut = await StockService.adjustStock({
      productId: testProduct.id,
      quantity: 3,
      movementType: 'OUT',
      reason: 'Test Stock Deduction',
      createdBy: 'Test Runner',
    });
    assert(adjustedOut.product.currentStock === 12, 'Stock adjustment OUT decremented currentStock correctly to 12');

    // 5. Test Negative Stock Prevention
    let threwNegativeError = false;
    try {
      await StockService.adjustStock({
        productId: testProduct.id,
        quantity: 9999, // Exceeds 12
        movementType: 'OUT',
        reason: 'Attempt invalid deduction',
        createdBy: 'Test Runner',
      });
    } catch (e: any) {
      threwNegativeError = true;
      assert(e.statusCode === 400, 'Rejecting excessive stock deduction returns 400 Bad Request');
    }
    assert(threwNegativeError, 'Stock Service prevents stock from going negative');

    // 6. Test Sales Challan Atomic Deduction & Snapshot
    const draftChallan = await prisma.salesChallan.create({
      data: {
        challanNumber: `CH-TEST-${Date.now()}`,
        customerId: customer!.id,
        customerSnapshot: JSON.stringify({ name: customer!.name }),
        totalQuantity: 4,
        totalAmount: 4 * testProduct.unitPrice,
        status: 'Draft',
        createdByName: 'Test Sales',
        items: {
          create: [
            {
              productId: testProduct.id,
              productName: testProduct.name,
              sku: testProduct.sku,
              unitPrice: testProduct.unitPrice,
              quantity: 4,
              totalPrice: 4 * testProduct.unitPrice,
            },
          ],
        },
      },
    });

    const confirmedChallan = await StockService.confirmChallan(draftChallan.id, {
      id: 'test-user',
      name: 'Test Sales',
    });
    assert(confirmedChallan.status === 'Confirmed', 'Challan transitioned to Confirmed');

    const updatedProdAfterChallan = await prisma.product.findUnique({
      where: { id: testProduct.id },
    });
    assert(
      updatedProdAfterChallan!.currentStock === 8,
      `Stock was deducted from 12 to 8 upon challan confirmation (actual: ${updatedProdAfterChallan!.currentStock})`
    );

    // 7. Bonus: AWS S3 Product Image Upload
    const s3Result = await S3Service.getPresignedUploadUrl('test_drill.png', 'image/png');
    assert(
      s3Result && s3Result.uploadUrl.includes('test_drill.png'),
      `AWS S3 product image upload service generates valid upload URL (Bonus Point)`
    );

    // 8. Clean up test record
    await prisma.challanItem.deleteMany({ where: { challanId: draftChallan.id } });
    await prisma.salesChallan.delete({ where: { id: draftChallan.id } });
    await prisma.stockMovement.deleteMany({ where: { productId: testProduct.id } });
    await prisma.product.delete({ where: { id: testProduct.id } });
    assert(true, 'Test cleanup completed successfully');

    console.log(`\n📊 Test Results: ${passed} Passed, ${failed} Failed\n`);
  } catch (err) {
    console.error('Test execution exception:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

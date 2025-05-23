/**
 * Automated Test for Payment Form Submission
 * Tests the complete booking flow from service page to payment completion
 */

const { chromium } = require('playwright');

async function testPaymentForm() {
  console.log('🚀 Starting Payment Form Test...\n');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless testing
    slowMo: 1000 // Slow down for better visibility
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Navigate to the service page
    console.log('📄 Step 1: Navigating to service page...');
    await page.goto('http://localhost:3000/services/cma4d5o25000dmlcqt66dat5d');
    await page.waitForLoadState('networkidle');
    
    // Wait for the service to load
    await page.waitForSelector('h1', { timeout: 10000 });
    const serviceName = await page.textContent('h1');
    console.log(`✅ Service loaded: ${serviceName}\n`);

    // Step 2: Click "Book Now" button
    console.log('🎯 Step 2: Clicking Book Now button...');
    await page.click('button:has-text("Book Now")');
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    console.log('✅ Booking modal opened\n');

    // Step 3: Fill booking details
    console.log('📝 Step 3: Filling booking details...');
    
    // Select a date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await page.fill('input[type="date"]', dateString);
    console.log(`✅ Date selected: ${dateString}`);
    
    // Select time
    await page.selectOption('select:has(option:text("10:00"))', '10:00');
    console.log('✅ Time selected: 10:00');
    
    // Fill address
    await page.fill('input[placeholder*="address"], textarea[placeholder*="address"]', '123 Test Street, Test City, TC 12345');
    console.log('✅ Address filled');
    
    // Fill comments (if available)
    const commentField = page.locator('textarea[placeholder*="comment"], input[placeholder*="comment"]').first();
    if (await commentField.count() > 0) {
      await commentField.fill('Automated test booking - please ignore');
      console.log('✅ Comments filled');
    }

    // Step 4: Continue to payment
    console.log('\n💳 Step 4: Proceeding to payment...');
    await page.click('button:has-text("Continue to Payment")');
    await page.waitForSelector('text=Complete Your Payment', { timeout: 10000 });
    console.log('✅ Payment form loaded\n');

    // Step 5: Wait for PayPal form to initialize
    console.log('⏳ Step 5: Waiting for PayPal form to initialize...');
    await page.waitForSelector('iframe', { timeout: 15000 });
    
    // Wait a bit more for all PayPal fields to load
    await page.waitForTimeout(3000);
    
    const iframes = await page.locator('iframe').count();
    console.log(`✅ PayPal form initialized with ${iframes} iframes\n`);

    // Step 6: Fill credit card details
    console.log('💳 Step 6: Filling credit card details...');
    
    // Fill cardholder name
    const nameFrame = page.frameLocator('iframe').first();
    if (await nameFrame.locator('input').count() > 0) {
      await nameFrame.locator('input').fill('John Doe');
      console.log('✅ Cardholder name filled');
    }
    
    // Fill card number (use PayPal test card)
    const cardFrames = page.frameLocator('iframe');
    let cardNumberFilled = false;
    
    for (let i = 0; i < await cardFrames.count(); i++) {
      try {
        const frame = cardFrames.nth(i);
        const input = frame.locator('input[name="cardnumber"], input[placeholder*="card"], input[type="text"]').first();
        if (await input.count() > 0) {
          await input.fill('4032035728288280'); // PayPal test Visa
          console.log('✅ Card number filled');
          cardNumberFilled = true;
          break;
        }
      } catch (e) {
        // Continue to next frame
      }
    }
    
    // Fill expiry date
    let expiryFilled = false;
    for (let i = 0; i < await cardFrames.count(); i++) {
      try {
        const frame = cardFrames.nth(i);
        const input = frame.locator('input[placeholder*="MM"], input[placeholder*="expir"], input[name="expiry"]').first();
        if (await input.count() > 0) {
          await input.fill('12/2030');
          console.log('✅ Expiry date filled');
          expiryFilled = true;
          break;
        }
      } catch (e) {
        // Continue to next frame
      }
    }
    
    // Fill CVV
    let cvvFilled = false;
    for (let i = 0; i < await cardFrames.count(); i++) {
      try {
        const frame = cardFrames.nth(i);
        const input = frame.locator('input[placeholder*="CVV"], input[placeholder*="CVC"], input[name="cvv"]').first();
        if (await input.count() > 0) {
          await input.fill('123');
          console.log('✅ CVV filled');
          cvvFilled = true;
          break;
        }
      } catch (e) {
        // Continue to next frame
      }
    }

    console.log(`\n📊 Form filling status:`);
    console.log(`- Card Number: ${cardNumberFilled ? '✅' : '❌'}`);
    console.log(`- Expiry: ${expiryFilled ? '✅' : '❌'}`);
    console.log(`- CVV: ${cvvFilled ? '✅' : '❌'}\n`);

    // Step 7: Submit payment
    console.log('🚀 Step 7: Submitting payment...');
    
    // Look for the pay button
    const payButton = page.locator('button:has-text("Pay"), button:has-text("Complete Payment"), button:has-text("Submit")').first();
    
    if (await payButton.count() > 0) {
      await payButton.click();
      console.log('✅ Payment submission initiated');
      
      // Step 8: Wait for payment result
      console.log('\n⏳ Step 8: Waiting for payment processing...');
      
      try {
        // Wait for either success or error
        await Promise.race([
          page.waitForSelector('text=Payment Successful', { timeout: 30000 }),
          page.waitForSelector('text=Payment Failed', { timeout: 30000 }),
          page.waitForSelector('[role="alert"]', { timeout: 30000 })
        ]);
        
        // Check for success message
        if (await page.locator('text=Payment Successful').count() > 0) {
          console.log('🎉 SUCCESS: Payment completed successfully!');
          
          // Wait a bit to see the success state
          await page.waitForTimeout(2000);
          
        } else if (await page.locator('text=Payment Failed').count() > 0) {
          console.log('❌ FAILED: Payment failed');
          const errorMsg = await page.locator('[role="alert"], .error, .alert-error').first().textContent();
          console.log(`Error details: ${errorMsg}`);
          
        } else {
          console.log('⚠️  UNKNOWN: Payment result unclear');
        }
        
      } catch (timeoutError) {
        console.log('⏰ TIMEOUT: Payment processing took too long (30s)');
        
        // Check for any error messages
        const errorElements = await page.locator('[role="alert"], .error, .alert-error').count();
        if (errorElements > 0) {
          const errorMsg = await page.locator('[role="alert"], .error, .alert-error').first().textContent();
          console.log(`Error found: ${errorMsg}`);
        }
      }
      
    } else {
      console.log('❌ ERROR: Could not find payment submit button');
    }

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'payment-test-error.png', fullPage: true });
    console.log('📸 Screenshot saved as payment-test-error.png');
    
  } finally {
    console.log('\n🏁 Test completed. Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testPaymentForm().catch(console.error);
}

module.exports = { testPaymentForm }; 
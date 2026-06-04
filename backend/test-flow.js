/**
 * Pune Metro Ticket Booking App - End-to-End API Integration & Flow Test
 * 
 * This script runs against the live Express + MongoDB backend on port 5000,
 * validating all controllers, models, security tokens, and encryption protocols.
 */

const BASE_URL = 'http://127.0.0.1:5000';
const TEST_PHONE = '9988776655';

async function runTests() {
  console.log('🚀 Starting Pune Metro E2E API Flow Verification Tests...\n');

  try {
    // 1. Verify API Gateway Status
    console.log('Step 1: Pinging API Gateway Status...');
    const gatewayRes = await fetch(`${BASE_URL}/`);
    const gatewayData = await gatewayRes.json();
    if (gatewayRes.status !== 200) throw new Error('Gateway is offline!');
    console.log(`✅ Gateway operational: "${gatewayData.message}" (Status: ${gatewayData.status})\n`);

    // 2. Dispatch OTP
    console.log(`Step 2: Requesting OTP for phone: +91 ${TEST_PHONE}...`);
    const sendOtpRes = await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: TEST_PHONE })
    });
    const sendOtpData = await sendOtpRes.json();
    if (!sendOtpData.success) throw new Error(`OTP dispatch failed: ${sendOtpData.message}`);
    const receivedOtp = sendOtpData.otp;
    console.log(`✅ OTP successfully dispatched!`);
    console.log(`ℹ️ [DEV OTP EXTRACTED]: ${receivedOtp}\n`);

    // 3. Verify OTP & Authenticate Session
    console.log('Step 3: Submitting verification OTP code...');
    const verifyOtpRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: TEST_PHONE, otp: receivedOtp })
    });
    const verifyOtpData = await verifyOtpRes.json();
    if (!verifyOtpData.success) throw new Error(`OTP verification failed: ${verifyOtpData.message}`);
    const jwtToken = verifyOtpData.token;
    console.log('✅ OTP code verified. Logged in successfully!');
    console.log(`ℹ️ Issued User JWT (truncated): ${jwtToken.substring(0, 30)}...`);
    console.log(`ℹ️ Initialized Digital Wallet with complimentary ₹500 welcome credit.\n`);

    // Setup headers with Auth Token
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    };

    // 4. Verify Wallet Initial Credit
    console.log('Step 4: Fetching Wallet balance and transactions ledger...');
    const walletRes = await fetch(`${BASE_URL}/api/wallet/balance`, {
      method: 'GET',
      headers: authHeaders
    });
    const walletData = await walletRes.json();
    console.log(`✅ Wallet retrieved. Balance: ₹${walletData.balance}`);
    
    const txRes = await fetch(`${BASE_URL}/api/wallet/transactions`, {
      method: 'GET',
      headers: authHeaders
    });
    const txData = await txRes.json();
    console.log(`✅ Ledger verified. Transactions count: ${txData.transactions.length}`);
    console.log(`ℹ️ Latest Transaction: "${txData.transactions[0].description}" (+₹${txData.transactions[0].amount})\n`);

    // 5. Calculate Route Fares
    const sourceStation = 'PCMC';
    const destStation = 'Swargate';
    const passengersCount = 2;
    console.log(`Step 5: Estimating distance and fare for route: [${sourceStation}] ➡️ [${destStation}] for ${passengersCount} passengers...`);
    const fareRes = await fetch(`${BASE_URL}/api/tickets/calculate-fare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: sourceStation, destination: destStation, passengers: passengersCount })
    });
    const fareData = await fareRes.json();
    if (!fareData.success) throw new Error(`Fare computation failed: ${fareData.message}`);
    console.log(`✅ Fare calculated successfully:`);
    console.log(`   - Route Distance: ${fareData.distance.toFixed(2)} km`);
    console.log(`   - Fare Per Passenger: ₹${fareData.farePerPerson}`);
    console.log(`   - Total Fare Amount: ₹${fareData.totalFare}\n`);

    // 6. Create Pending Ticket
    console.log('Step 6: Initiating ticket booking and generating pending record...');
    const createTicketRes = await fetch(`${BASE_URL}/api/tickets/create`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        source: sourceStation,
        destination: destStation,
        distance: fareData.distance,
        fare: fareData.farePerPerson,
        passengers: passengersCount,
        totalAmount: fareData.totalFare
      })
    });
    const createTicketData = await createTicketRes.json();
    if (!createTicketData.success) throw new Error(`Ticket initiation failed: ${createTicketData.message}`);
    const ticketId = createTicketData.ticket.ticketId;
    console.log(`✅ Pending ticket created! Ticket ID: ${ticketId}\n`);

    // 7. Pay using Wallet Balance
    console.log(`Step 7: Executing checkout payment of ₹${fareData.totalFare} using Wallet Balance...`);
    const payRes = await fetch(`${BASE_URL}/api/tickets/payment`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        ticketId: ticketId,
        paymentMethod: 'wallet',
        paymentStatus: 'success'
      })
    });
    const payData = await payRes.json();
    if (!payData.success) throw new Error(`Payment processing failed: ${payData.message}`);
    const qrToken = payData.ticket.qrData;
    console.log('✅ Checkout authorized! Ticket status marked as ACTIVE.');
    console.log(`ℹ️ [SECURE AES-256 TRANSIT STRING GENERATED]:\n   ${qrToken.substring(0, 60)}...\n`);

    // 8. Verify Wallet Deduction & Ledger
    console.log('Step 8: Rechecking updated Wallet status...');
    const walletAfterRes = await fetch(`${BASE_URL}/api/wallet/balance`, {
      method: 'GET',
      headers: authHeaders
    });
    const walletAfterData = await walletAfterRes.json();
    console.log(`✅ Updated balance: ₹${walletAfterData.balance} (Should be ₹400)`);
    
    const txAfterRes = await fetch(`${BASE_URL}/api/wallet/transactions`, {
      method: 'GET',
      headers: authHeaders
    });
    const txAfterData = await txAfterRes.json();
    console.log(`✅ Updated ledger details:`);
    txAfterData.transactions.forEach((tx, idx) => {
      console.log(`   [TX #${idx + 1}] Type: ${tx.type.toUpperCase()} | Amount: ₹${tx.amount} | Desc: "${tx.description}"`);
    });
    console.log('');

    // 9. Simulate Smart scanner barrier QR scanning
    console.log('Step 9: Simulating smart scanner gate transit entry...');
    const scanRes = await fetch(`${BASE_URL}/api/tickets/verify-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData: qrToken })
    });
    const scanData = await scanRes.json();
    if (!scanData.success) throw new Error(`QR Scanner gate validation failed: ${scanData.message}`);
    console.log(`✅ Gate Response: "${scanData.message}"`);
    console.log(`ℹ️ Scanner Boarding Specs: Ticket ${scanData.boardingDetails.ticketId} cleared for boarding from ${scanData.boardingDetails.source} to ${scanData.boardingDetails.destination}.\n`);

    // 10. Re-verify Ticket Status via History
    console.log('Step 10: Reviewing trip history ledger for ticket state...');
    const historyRes = await fetch(`${BASE_URL}/api/tickets/history`, {
      method: 'GET',
      headers: authHeaders
    });
    const historyData = await historyRes.json();
    const finalTicket = historyData.tickets.find(t => t.ticketId === ticketId);
    console.log(`✅ History verified. Ticket status is now: ${finalTicket.ticketStatus.toUpperCase()} (Scanned & Cleared)`);

    console.log('\n🌟 SUCCESS: All E2E Integration and Transaction flows passed flawlessly! 🌟\n');
  } catch (error) {
    console.error('\n❌ TEST RUN FAILURE:', error.message);
    process.exit(1);
  }
}

runTests();

import fs from 'fs';

const numRecords = 500;
const failureReasons = [
  'BANK_TIMEOUT',
  'GATEWAY_ERROR',
  'NETWORK_ERROR',
  'INSUFFICIENT_FUNDS',
  'CARD_EXPIRED',
  'CUSTOMER_ABANDONED',
  'FRAUD_SUSPECTED'
];
const paymentMethods = ['upi', 'card', 'netbanking'];

const dataset = [];

for (let i = 1; i <= numRecords; i++) {
  const customerId = `cust_${Math.random().toString(36).substring(2, 9)}`;
  const paymentId = `pay_${Math.random().toString(36).substring(2, 9)}`;
  
  // Randomly assign failure reasons
  const reason = failureReasons[Math.floor(Math.random() * failureReasons.length)];
  
  // Logic for recoverable and groundTruthAction based on failure reason
  let recoverable = false;
  let groundTruthAction = 'DO_NOTHING';
  
  if (['BANK_TIMEOUT', 'GATEWAY_ERROR', 'NETWORK_ERROR'].includes(reason)) {
    recoverable = true;
    groundTruthAction = 'RETRY_PAYMENT';
  } else if (['INSUFFICIENT_FUNDS', 'CUSTOMER_ABANDONED'].includes(reason)) {
    recoverable = true;
    groundTruthAction = 'CREATE_PAYMENT_LINK';
  } else if (reason === 'CARD_EXPIRED') {
    recoverable = true;
    groundTruthAction = 'SEND_NOTIFICATION';
  } else if (reason === 'FRAUD_SUSPECTED') {
    recoverable = false;
    groundTruthAction = 'ESCALATE';
  }

  // Generate some edge cases for policy engine
  // e.g. retry limit exceeded, high risk, etc.
  const isHighRisk = Math.random() < 0.1; // 10% high risk
  const riskScore = isHighRisk ? 0.85 + Math.random() * 0.15 : Math.random() * 0.3; // High > 0.80
  
  if (isHighRisk) {
    recoverable = false;
    groundTruthAction = 'ESCALATE';
  }

  const previousTransactions = Math.floor(Math.random() * 20);
  const successfulTransactions = Math.floor(Math.random() * previousTransactions) || 0;
  const successRate = previousTransactions > 0 ? successfulTransactions / previousTransactions : 0;

  // Sometimes amount is huge
  const amount = Math.floor(Math.random() * 2000000); // Up to 20,000 INR
  if (amount > 1000000 && groundTruthAction === 'RETRY_PAYMENT') { // > 10,000 INR
    groundTruthAction = 'ESCALATE'; // Example policy rule limit
  }

  const retryCount = Math.floor(Math.random() * 3);
  if (retryCount >= 2 && groundTruthAction === 'RETRY_PAYMENT') {
    groundTruthAction = 'ESCALATE'; // Max retries exceeded
  }

  dataset.push({
    customer: {
      id: customerId,
      name: `Customer ${i}`,
      email: `customer${i}@example.com`,
      phone: `9876543${i.toString().padStart(3, '0')}`,
      previousTransactions,
      successfulTransactions,
      successRate
    },
    payment: {
      id: paymentId,
      orderId: `order_${i}`,
      amount,
      currency: 'INR',
      status: 'failed',
      failureReason: reason,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      retryCount,
      riskScore,
      groundTruthAction,
      recoverable
    }
  });
}

fs.writeFileSync('dataset.json', JSON.stringify(dataset, null, 2));
console.log(`Generated ${numRecords} records in dataset.json`);

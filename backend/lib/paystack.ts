// Paystack Integration - Nigerian Payments
import axios from 'axios';
import { generateTransactionRef } from './auth';
import prisma from './prisma';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Initialize payment (for subscriptions, points purchase)
 */
export async function initializePayment(params: {
  email: string;
  amount: number; // In kobo (₦1 = 100 kobo)
  reference?: string;
  metadata?: any;
  callback_url?: string;
}) {
  try {
    const response = await paystackClient.post('/transaction/initialize', {
      email: params.email,
      amount: Math.round(params.amount * 100), // Convert to kobo
      reference: params.reference || generateTransactionRef(),
      metadata: params.metadata,
      callback_url: params.callback_url,
    });

    return {
      success: true,
      authorization_url: response.data.data.authorization_url,
      access_code: response.data.data.access_code,
      reference: response.data.data.reference,
    };
  } catch (error: any) {
    console.error('Paystack initialization error:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || 'Payment initialization failed',
    };
  }
}

/**
 * Verify payment
 */
export async function verifyPayment(reference: string) {
  try {
    const response = await paystackClient.get(`/transaction/verify/${reference}`);
    const data = response.data.data;

    return {
      success: data.status === 'success',
      amount: data.amount / 100, // Convert from kobo to naira
      reference: data.reference,
      metadata: data.metadata,
      paidAt: data.paid_at,
      channel: data.channel,
    };
  } catch (error: any) {
    console.error('Paystack verification error:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || 'Payment verification failed',
    };
  }
}

/**
 * Create transfer recipient (for withdrawals)
 */
export async function createTransferRecipient(params: {
  name: string;
  accountNumber: string;
  bankCode: string;
  currency?: string;
}) {
  try {
    const response = await paystackClient.post('/transferrecipient', {
      type: 'nuban',
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: params.currency || 'NGN',
    });

    return {
      success: true,
      recipientCode: response.data.data.recipient_code,
      details: response.data.data,
    };
  } catch (error: any) {
    console.error('Create recipient error:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create recipient',
    };
  }
}

/**
 * Initiate transfer (withdrawal)
 */
export async function initiateTransfer(params: {
  amount: number; // In Naira
  recipientCode: string;
  reason?: string;
  reference?: string;
}) {
  try {
    const response = await paystackClient.post('/transfer', {
      source: 'balance',
      amount: Math.round(params.amount * 100), // Convert to kobo
      recipient: params.recipientCode,
      reason: params.reason || 'Fiple withdrawal',
      reference: params.reference || generateTransactionRef(),
    });

    return {
      success: true,
      transferCode: response.data.data.transfer_code,
      reference: response.data.data.reference,
      status: response.data.data.status,
    };
  } catch (error: any) {
    console.error('Transfer error:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || 'Transfer failed',
    };
  }
}

/**
 * Verify transfer status
 */
export async function verifyTransfer(reference: string) {
  try {
    const response = await paystackClient.get(`/transfer/verify/${reference}`);
    const data = response.data.data;

    return {
      success: data.status === 'success',
      status: data.status,
      amount: data.amount / 100,
      reference: data.reference,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || 'Transfer verification failed',
    };
  }
}

/**
 * Get list of Nigerian banks
 */
export async function getBanks(country: string = 'nigeria') {
  try {
    const response = await paystackClient.get(`/bank?country=${country}`);
    return {
      success: true,
      banks: response.data.data.map((bank: any) => ({
        name: bank.name,
        code: bank.code,
        slug: bank.slug,
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'Failed to fetch banks',
      banks: [],
    };
  }
}

/**
 * Resolve account number (verify bank account)
 */
export async function resolveAccountNumber(
  accountNumber: string,
  bankCode: string
) {
  try {
    const response = await paystackClient.get(
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
    );

    return {
      success: true,
      accountName: response.data.data.account_name,
      accountNumber: response.data.data.account_number,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to resolve account',
    };
  }
}

/**
 * Process withdrawal request
 */
export async function processWithdrawal(
  userId: string,
  amount: number,
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankCode: string;
    bankName: string;
  }
) {
  // Check wallet balance
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet || wallet.balanceNGN < amount) {
    return {
      success: false,
      error: 'Insufficient balance',
    };
  }

  // Minimum withdrawal amount
  const MIN_WITHDRAWAL = 1000; // ₦1,000
  if (amount < MIN_WITHDRAWAL) {
    return {
      success: false,
      error: `Minimum withdrawal is ₦${MIN_WITHDRAWAL}`,
    };
  }

  // Create transfer recipient
  const recipient = await createTransferRecipient({
    name: bankDetails.accountName,
    accountNumber: bankDetails.accountNumber,
    bankCode: bankDetails.bankCode,
  });

  if (!recipient.success) {
    return recipient;
  }

  // Calculate fee (2.5% capped at ₦100)
  const fee = Math.min(amount * 0.025, 100);
  const netAmount = amount - fee;

  // Initiate transfer
  const reference = generateTransactionRef();
  const transfer = await initiateTransfer({
    amount: netAmount,
    recipientCode: recipient.recipientCode!,
    reason: 'Fiple wallet withdrawal',
    reference,
  });

  if (!transfer.success) {
    return transfer;
  }

  // Create transaction record
  await prisma.transaction.create({
    data: {
      userId,
      type: 'WITHDRAWAL',
      status: 'PROCESSING',
      amount,
      currency: 'NGN',
      fee,
      netAmount,
      description: `Withdrawal to ${bankDetails.bankName}`,
      reference,
      gateway: 'paystack',
      gatewayRef: transfer.transferCode,
      balanceBefore: wallet.balanceNGN,
      balanceAfter: wallet.balanceNGN - amount,
    },
  });

  // Update wallet
  await prisma.wallet.update({
    where: { userId },
    data: {
      balanceNGN: { decrement: amount },
      totalWithdrawn: { increment: amount },
    },
  });

  return {
    success: true,
    reference,
    amount,
    fee,
    netAmount,
  };
}

/**
 * Handle Paystack webhook
 */
export async function handlePaystackWebhook(event: any) {
  const { event: eventType, data } = event;

  switch (eventType) {
    case 'charge.success':
      // Payment successful - update subscription or wallet
      await handleSuccessfulPayment(data);
      break;

    case 'transfer.success':
      // Withdrawal successful
      await handleSuccessfulTransfer(data);
      break;

    case 'transfer.failed':
      // Withdrawal failed - refund to wallet
      await handleFailedTransfer(data);
      break;

    default:
      console.log('Unhandled webhook event:', eventType);
  }
}

async function handleSuccessfulPayment(data: any) {
  const reference = data.reference;
  const amount = data.amount / 100; // Convert from kobo

  // Find and update transaction
  const transaction = await prisma.transaction.findUnique({
    where: { reference },
  });

  if (transaction) {
    await prisma.transaction.update({
      where: { reference },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // If subscription payment, activate subscription
    if (data.metadata?.type === 'subscription') {
      // Handle subscription activation
    }

    // If points purchase, add points to wallet
    if (data.metadata?.type === 'points') {
      const points = data.metadata.points;
      await prisma.wallet.update({
        where: { userId: transaction.userId },
        data: {
          fipplePoints: { increment: points },
        },
      });
    }
  }
}

async function handleSuccessfulTransfer(data: any) {
  const reference = data.reference;

  await prisma.transaction.updateMany({
    where: { reference },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });
}

async function handleFailedTransfer(data: any) {
  const reference = data.reference;

  const transaction = await prisma.transaction.findUnique({
    where: { reference },
  });

  if (transaction) {
    // Refund to wallet
    await prisma.wallet.update({
      where: { userId: transaction.userId },
      data: {
        balanceNGN: { increment: transaction.amount },
      },
    });

    await prisma.transaction.update({
      where: { reference },
      data: {
        status: 'FAILED',
        failureReason: data.reason || 'Transfer failed',
      },
    });
  }
}

/**
 * Create subscription plan on Paystack
 */
export async function createSubscriptionPlan(params: {
  name: string;
  amount: number;
  interval: 'monthly' | 'annually';
}) {
  try {
    const response = await paystackClient.post('/plan', {
      name: params.name,
      amount: Math.round(params.amount * 100),
      interval: params.interval,
      currency: 'NGN',
    });

    return {
      success: true,
      planCode: response.data.data.plan_code,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create plan',
    };
  }
}

/**
 * Subscribe user to plan
 */
export async function subscribeUserToPlan(
  email: string,
  planCode: string,
  authorizationCode?: string
) {
  try {
    const response = await paystackClient.post('/subscription', {
      customer: email,
      plan: planCode,
      authorization: authorizationCode,
    });

    return {
      success: true,
      subscriptionCode: response.data.data.subscription_code,
      emailToken: response.data.data.email_token,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to subscribe',
    };
  }
}

import { prisma } from "../db/prisma"

export async function simulateRetryPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId }
  })
  
  if (!payment) {
    throw new Error("Payment not found")
  }

  const newRetryCount = payment.retryCount + 1

  if (!payment.recoverable) {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { retryCount: newRetryCount }
    })
    return { success: false, status: "failed", reason: payment.failureReason }
  }

  if (newRetryCount >= 2) {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "success", retryCount: newRetryCount }
    })
    return { success: true, status: "success", reason: null }
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: { retryCount: newRetryCount }
  })
  return { success: false, status: "failed", reason: payment.failureReason }
}

export async function simulateCreatePaymentLink(orderId: string) {
  return { success: true, link: `https://razorpay.com/link/sim_${orderId}` }
}

export async function simulateSendNotification(customerId: string, paymentId: string) {
  return { success: true, delivered: true, timestamp: new Date().toISOString() }
}

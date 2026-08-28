import { z } from "zod"
import { prisma } from "../db/prisma"
import { simulateRetryPayment, simulateCreatePaymentLink, simulateSendNotification } from "../payment-simulator"

export const getPaymentDetailsSchema = z.object({
  paymentId: z.string()
})

export const getCustomerHistorySchema = z.object({
  customerId: z.string()
})

export const retryPaymentSchema = z.object({
  paymentId: z.string()
})

export const createPaymentLinkSchema = z.object({
  orderId: z.string()
})

export const sendRecoveryNotificationSchema = z.object({
  customerId: z.string(),
  paymentId: z.string()
})

export const escalateCaseSchema = z.object({
  paymentId: z.string(),
  reason: z.string()
})

export async function getPaymentDetails(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId }
  })
  if (!payment) throw new Error("Payment not found")
  return payment
}

export async function getCustomerHistory(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  })
  if (!customer) throw new Error("Customer not found")
  return customer
}

export async function retryPayment(paymentId: string) {
  return await simulateRetryPayment(paymentId)
}

export async function createPaymentLink(orderId: string) {
  return await simulateCreatePaymentLink(orderId)
}

export async function sendRecoveryNotification(customerId: string, paymentId: string) {
  return await simulateSendNotification(customerId, paymentId)
}

export async function escalateCase(paymentId: string, reason: string) {
  return { success: true, status: "escalated", reason }
}

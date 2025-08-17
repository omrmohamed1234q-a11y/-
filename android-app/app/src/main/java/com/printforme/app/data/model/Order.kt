package com.printforme.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Order(
    val orderId: String = "",
    val userId: String = "",
    val items: List<CartItem> = emptyList(),
    val totals: CartTotals = CartTotals(),
    val delivery: DeliveryInfo = DeliveryInfo(),
    val payment: PaymentInfo = PaymentInfo(),
    val status: OrderStatus = OrderStatus.CREATED,
    val timeline: List<TimelineEvent> = emptyList(),
    val voucher: VoucherInfo? = null,
    val bounty: BountyUsage = BountyUsage(),
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

@Serializable
enum class OrderStatus {
    CREATED,
    PROCESSING,
    PRINTING,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED
}

@Serializable
data class DeliveryInfo(
    val type: DeliveryType = DeliveryType.DELIVERY,
    val addressRef: String? = null,
    val address: Address? = null,
    val slot: DeliverySlot? = null,
    val eta: String = "",
    val fees: Double = 0.0,
    val instructions: String = ""
)

@Serializable
enum class DeliveryType {
    DELIVERY,
    PICKUP
}

@Serializable
data class DeliverySlot(
    val date: String = "", // yyyy-MM-dd
    val timeRange: String = "", // "09:00-12:00"
    val available: Boolean = true,
    val fee: Double = 0.0
)

@Serializable
data class PaymentInfo(
    val method: PaymentMethod = PaymentMethod.COD,
    val status: PaymentStatus = PaymentStatus.PENDING,
    val transactionId: String = "",
    val gateway: String = "",
    val amount: Double = 0.0,
    val currency: String = "EGP"
)

@Serializable
enum class PaymentMethod {
    PLAY_BILLING,
    GATEWAY,
    COD
}

@Serializable
enum class PaymentStatus {
    PENDING,
    PAID,
    FAILED,
    REFUNDED
}

@Serializable
data class TimelineEvent(
    val event: String = "",
    val status: OrderStatus = OrderStatus.CREATED,
    val timestamp: Long = System.currentTimeMillis(),
    val metadata: Map<String, String> = emptyMap(),
    val description: String = "",
    val descriptionAr: String = ""
)

@Serializable
data class VoucherInfo(
    val code: String = "",
    val value: Double = 0.0,
    val type: VoucherType = VoucherType.FIXED
)

@Serializable
enum class VoucherType {
    FIXED,
    PERCENTAGE
}

@Serializable
data class BountyUsage(
    val pointsSpent: Int = 0,
    val pointsEarned: Int = 0,
    val conversionRate: Double = 0.01 // 1 point = 0.01 EGP
)
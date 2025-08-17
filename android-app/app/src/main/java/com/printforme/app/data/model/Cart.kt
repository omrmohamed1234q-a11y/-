package com.printforme.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class CartItem(
    val itemId: String = "",
    val productId: String = "",
    val title: String = "",
    val titleAr: String = "",
    val image: String = "",
    val variant: ProductVariant? = null,
    val quantity: Int = 1,
    val price: Double = 0.0,
    val isDigital: Boolean = false,
    val addedAt: Long = System.currentTimeMillis()
)

@Serializable
data class Cart(
    val userId: String = "",
    val items: List<CartItem> = emptyList(),
    val updatedAt: Long = System.currentTimeMillis()
) {
    val itemCount: Int get() = items.sumOf { it.quantity }
    val subtotal: Double get() = items.sumOf { it.price * it.quantity }
    val hasDigitalItems: Boolean get() = items.any { it.isDigital }
    val hasPhysicalItems: Boolean get() = items.any { !it.isDigital }
}

@Serializable
data class CartTotals(
    val subtotal: Double = 0.0,
    val shipping: Double = 0.0,
    val discount: Double = 0.0,
    val tax: Double = 0.0,
    val grandTotal: Double = 0.0,
    val bountyPointsUsed: Int = 0,
    val bountyPointsEarned: Int = 0
)
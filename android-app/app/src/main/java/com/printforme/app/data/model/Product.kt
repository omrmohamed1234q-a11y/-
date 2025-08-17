package com.printforme.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Product(
    val productId: String = "",
    val title: String = "",
    val titleAr: String = "",
    val description: String = "",
    val descriptionAr: String = "",
    val images: List<String> = emptyList(),
    val price: Double = 0.0,
    val variants: List<ProductVariant> = emptyList(),
    val stock: Int = 0,
    val isDigital: Boolean = false,
    val category: String = "",
    val flags: ProductFlags = ProductFlags(),
    val rating: Float = 0f,
    val reviewCount: Int = 0,
    val tags: List<String> = emptyList(),
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

@Serializable
data class ProductVariant(
    val id: String = "",
    val name: String = "",
    val nameAr: String = "",
    val price: Double = 0.0,
    val stock: Int = 0,
    val attributes: Map<String, String> = emptyMap(), // color, size, etc.
    val image: String = ""
)

@Serializable
data class ProductFlags(
    val teacherOnly: Boolean = false,
    val vipOnly: Boolean = false,
    val featured: Boolean = false,
    val newArrival: Boolean = false,
    val bestSeller: Boolean = false,
    val onSale: Boolean = false
)

@Serializable
data class TeacherMaterial(
    val id: String = "",
    val title: String = "",
    val titleAr: String = "",
    val subject: String = "",
    val grade: String = "",
    val region: String = "",
    val fileRef: String = "",
    val thumbnailUrl: String = "",
    val access: AccessType = AccessType.SUBSCRIPTION,
    val downloadCount: Int = 0,
    val rating: Float = 0f,
    val createdAt: Long = System.currentTimeMillis()
)

@Serializable
enum class AccessType {
    FREE,
    SUBSCRIPTION,
    PURCHASE
}
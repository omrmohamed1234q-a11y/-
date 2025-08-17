package com.printforme.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class User(
    val uid: String = "",
    val email: String = "",
    val displayName: String = "",
    val photoUrl: String? = null,
    val profile: UserProfile = UserProfile(),
    val addresses: List<Address> = emptyList(),
    val bounty: BountyInfo = BountyInfo()
)

@Serializable
data class UserProfile(
    val firstName: String = "",
    val lastName: String = "",
    val phone: String = "",
    val isTeacher: Boolean = false,
    val isVip: Boolean = false,
    val teacherSubject: String? = null,
    val teacherGrade: String? = null
)

@Serializable
data class Address(
    val id: String = "",
    val title: String = "",
    val street: String = "",
    val building: String = "",
    val apartment: String = "",
    val area: String = "",
    val city: String = "",
    val governorate: String = "",
    val coordinates: GeoPoint? = null,
    val isDefault: Boolean = false
)

@Serializable
data class GeoPoint(
    val latitude: Double = 0.0,
    val longitude: Double = 0.0
)

@Serializable
data class BountyInfo(
    val points: Int = 0,
    val totalEarned: Int = 0,
    val totalSpent: Int = 0,
    val level: String = "Bronze"
)
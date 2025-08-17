package com.printforme.app.ui.cart

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.printforme.app.data.model.Cart
import com.printforme.app.data.model.CartTotals
import com.printforme.app.data.repository.CartRepository
import com.printforme.app.data.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class CartViewModel @Inject constructor(
    private val cartRepository: CartRepository,
    private val userRepository: UserRepository
) : ViewModel() {
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading = _isLoading.asStateFlow()
    
    val cart = cartRepository.getCart()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = Cart()
        )
    
    val totals = cart.map { calculateTotals(it) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = CartTotals()
        )
    
    val availableBountyPoints = userRepository.getCurrentUser()
        .map { it?.bounty?.points ?: 0 }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0
        )
    
    private var voucherCode: String = ""
    private var useRewardPoints: Boolean = false
    
    fun updateQuantity(itemId: String, newQuantity: Int) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                cartRepository.updateItemQuantity(itemId, newQuantity)
            } catch (e: Exception) {
                // Handle error
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun removeItem(itemId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                cartRepository.removeItem(itemId)
            } catch (e: Exception) {
                // Handle error
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun clearCart() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                cartRepository.clearCart()
            } catch (e: Exception) {
                // Handle error
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun applyVoucher(code: String) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                // Validate voucher code
                voucherCode = code
                // Refresh totals calculation
            } catch (e: Exception) {
                // Handle error
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun toggleRewardPoints(use: Boolean) {
        useRewardPoints = use
    }
    
    private fun calculateTotals(cart: Cart): CartTotals {
        val subtotal = cart.subtotal
        val shipping = calculateShipping(cart)
        val discount = calculateDiscount(subtotal, voucherCode)
        val bountyDiscount = if (useRewardPoints) 
            minOf(availableBountyPoints.value * 0.01, subtotal * 0.3) else 0.0
        val tax = (subtotal - discount) * 0.14 // 14% VAT
        val grandTotal = subtotal + shipping - discount - bountyDiscount + tax
        val bountyPointsUsed = if (useRewardPoints) (bountyDiscount / 0.01).toInt() else 0
        val bountyPointsEarned = (grandTotal * 0.02).toInt() // 2% back in points
        
        return CartTotals(
            subtotal = subtotal,
            shipping = shipping,
            discount = discount + bountyDiscount,
            tax = tax,
            grandTotal = grandTotal,
            bountyPointsUsed = bountyPointsUsed,
            bountyPointsEarned = bountyPointsEarned
        )
    }
    
    private fun calculateShipping(cart: Cart): Double {
        return if (cart.hasPhysicalItems) {
            when {
                cart.subtotal >= 200 -> 0.0 // Free shipping over 200 EGP
                cart.subtotal >= 100 -> 15.0
                else -> 25.0
            }
        } else 0.0
    }
    
    private fun calculateDiscount(subtotal: Double, voucherCode: String): Double {
        // Mock voucher validation - replace with actual implementation
        return when (voucherCode.uppercase()) {
            "WELCOME10" -> subtotal * 0.1
            "SAVE20" -> minOf(subtotal * 0.2, 50.0)
            else -> 0.0
        }
    }
}
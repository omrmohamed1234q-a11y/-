package com.printforme.app.ui.checkout

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.printforme.app.data.model.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CheckoutScreen(
    cart: Cart,
    onNavigateBack: () -> Unit,
    onOrderCompleted: (String) -> Unit, // orderId
    viewModel: CheckoutViewModel = hiltViewModel()
) {
    var currentStep by remember { mutableIntStateOf(0) }
    val steps = listOf("العنوان", "الموعد", "الدفع", "المراجعة")
    
    val uiState by viewModel.uiState.collectAsState()
    
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { 
                        Text(
                            text = "إتمام الطلب",
                            fontWeight = FontWeight.Bold
                        ) 
                    },
                    navigationIcon = {
                        IconButton(onClick = onNavigateBack) {
                            Icon(Icons.Default.ArrowForward, contentDescription = "العودة")
                        }
                    }
                )
            }
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                // Stepper Header
                CheckoutStepper(
                    steps = steps,
                    currentStep = currentStep,
                    modifier = Modifier.padding(16.dp)
                )
                
                // Content
                when (currentStep) {
                    0 -> AddressStep(
                        addresses = uiState.addresses,
                        selectedAddress = uiState.selectedAddress,
                        onAddressSelected = viewModel::selectAddress,
                        onAddNewAddress = viewModel::addNewAddress,
                        onNext = { currentStep = 1 }
                    )
                    1 -> DeliveryStep(
                        deliveryType = uiState.deliveryType,
                        onDeliveryTypeChanged = viewModel::setDeliveryType,
                        selectedSlot = uiState.selectedSlot,
                        onSlotSelected = viewModel::selectDeliverySlot,
                        onNext = { currentStep = 2 },
                        onBack = { currentStep = 0 }
                    )
                    2 -> PaymentStep(
                        cart = cart,
                        paymentMethod = uiState.paymentMethod,
                        onPaymentMethodChanged = viewModel::setPaymentMethod,
                        onNext = { currentStep = 3 },
                        onBack = { currentStep = 1 }
                    )
                    3 -> ReviewStep(
                        cart = cart,
                        totals = uiState.totals,
                        deliveryInfo = uiState.deliveryInfo,
                        paymentMethod = uiState.paymentMethod,
                        onPlaceOrder = { 
                            viewModel.placeOrder(cart) { orderId ->
                                onOrderCompleted(orderId)
                            }
                        },
                        onBack = { currentStep = 2 },
                        isLoading = uiState.isLoading
                    )
                }
            }
        }
    }
}

@Composable
private fun CheckoutStepper(
    steps: List<String>,
    currentStep: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        steps.forEachIndexed { index, step ->
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Step Circle
                Surface(
                    modifier = Modifier.size(32.dp),
                    shape = androidx.compose.foundation.shape.CircleShape,
                    color = when {
                        index < currentStep -> MaterialTheme.colorScheme.primary
                        index == currentStep -> MaterialTheme.colorScheme.primary
                        else -> MaterialTheme.colorScheme.outlineVariant
                    }
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        if (index < currentStep) {
                            Icon(
                                Icons.Default.Check,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onPrimary,
                                modifier = Modifier.size(16.dp)
                            )
                        } else {
                            Text(
                                text = (index + 1).toString(),
                                color = if (index <= currentStep) 
                                    MaterialTheme.colorScheme.onPrimary
                                else 
                                    MaterialTheme.colorScheme.onSurfaceVariant,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Text(
                    text = step,
                    fontSize = 12.sp,
                    color = if (index <= currentStep)
                        MaterialTheme.colorScheme.primary
                    else
                        MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            if (index < steps.size - 1) {
                HorizontalDivider(
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 8.dp),
                    color = if (index < currentStep)
                        MaterialTheme.colorScheme.primary
                    else
                        MaterialTheme.colorScheme.outlineVariant
                )
            }
        }
    }
}

@Composable
private fun AddressStep(
    addresses: List<Address>,
    selectedAddress: Address?,
    onAddressSelected: (Address) -> Unit,
    onAddNewAddress: () -> Unit,
    onNext: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text(
            text = "اختر عنوان التسليم",
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        addresses.forEach { address ->
            AddressCard(
                address = address,
                isSelected = address.id == selectedAddress?.id,
                onSelect = { onAddressSelected(address) }
            )
            Spacer(modifier = Modifier.height(8.dp))
        }
        
        OutlinedButton(
            onClick = onAddNewAddress,
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(Icons.Default.Add, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("إضافة عنوان جديد")
        }
        
        Spacer(modifier = Modifier.weight(1f))
        
        Button(
            onClick = onNext,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            enabled = selectedAddress != null
        ) {
            Text("التالي")
        }
    }
}

@Composable
private fun AddressCard(
    address: Address,
    isSelected: Boolean,
    onSelect: () -> Unit
) {
    Card(
        onClick = onSelect,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected)
                MaterialTheme.colorScheme.primaryContainer
            else
                MaterialTheme.colorScheme.surface
        ),
        border = if (isSelected) 
            androidx.compose.foundation.BorderStroke(
                2.dp, 
                MaterialTheme.colorScheme.primary
            ) 
        else null
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = address.title,
                    fontWeight = FontWeight.Medium,
                    fontSize = 16.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${address.street}, ${address.area}",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "${address.city}, ${address.governorate}",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            if (isSelected) {
                Icon(
                    Icons.Default.CheckCircle,
                    contentDescription = "مختار",
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

// Similar implementations for DeliveryStep, PaymentStep, and ReviewStep...
@Composable
private fun DeliveryStep(
    deliveryType: DeliveryType,
    onDeliveryTypeChanged: (DeliveryType) -> Unit,
    selectedSlot: DeliverySlot?,
    onSlotSelected: (DeliverySlot) -> Unit,
    onNext: () -> Unit,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "اختر طريقة الاستلام",
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Delivery type selection
        Row {
            FilterChip(
                onClick = { onDeliveryTypeChanged(DeliveryType.DELIVERY) },
                label = { Text("توصيل للمنزل") },
                selected = deliveryType == DeliveryType.DELIVERY,
                leadingIcon = if (deliveryType == DeliveryType.DELIVERY) {
                    { Icon(Icons.Default.Check, contentDescription = null) }
                } else null
            )
            Spacer(modifier = Modifier.width(8.dp))
            FilterChip(
                onClick = { onDeliveryTypeChanged(DeliveryType.PICKUP) },
                label = { Text("استلام من الفرع") },
                selected = deliveryType == DeliveryType.PICKUP,
                leadingIcon = if (deliveryType == DeliveryType.PICKUP) {
                    { Icon(Icons.Default.Check, contentDescription = null) }
                } else null
            )
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Text(
            text = "اختر الموعد المناسب",
            fontSize = 16.sp,
            fontWeight = FontWeight.Medium
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        // Mock delivery slots
        val slots = listOf(
            DeliverySlot("2024-01-20", "09:00-12:00", true, 0.0),
            DeliverySlot("2024-01-20", "14:00-17:00", true, 5.0),
            DeliverySlot("2024-01-21", "09:00-12:00", true, 0.0),
            DeliverySlot("2024-01-21", "14:00-17:00", false, 5.0)
        )
        
        slots.forEach { slot ->
            DeliverySlotCard(
                slot = slot,
                isSelected = slot == selectedSlot,
                onSelect = { onSlotSelected(slot) }
            )
            Spacer(modifier = Modifier.height(8.dp))
        }
        
        Spacer(modifier = Modifier.weight(1f))
        
        Row {
            OutlinedButton(
                onClick = onBack,
                modifier = Modifier.weight(1f)
            ) {
                Text("السابق")
            }
            Spacer(modifier = Modifier.width(8.dp))
            Button(
                onClick = onNext,
                modifier = Modifier.weight(1f),
                enabled = selectedSlot != null
            ) {
                Text("التالي")
            }
        }
    }
}

@Composable
private fun DeliverySlotCard(
    slot: DeliverySlot,
    isSelected: Boolean,
    onSelect: () -> Unit
) {
    Card(
        onClick = if (slot.available) onSelect else { },
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = when {
                !slot.available -> MaterialTheme.colorScheme.surfaceVariant
                isSelected -> MaterialTheme.colorScheme.primaryContainer
                else -> MaterialTheme.colorScheme.surface
            }
        ),
        border = if (isSelected) 
            androidx.compose.foundation.BorderStroke(2.dp, MaterialTheme.colorScheme.primary) 
        else null
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = slot.date,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = slot.timeRange,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (slot.fee > 0) {
                    Text(
                        text = "رسوم إضافية: ${slot.fee} ج.م",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
            
            when {
                !slot.available -> Text(
                    text = "غير متاح",
                    color = MaterialTheme.colorScheme.error,
                    fontSize = 12.sp
                )
                isSelected -> Icon(
                    Icons.Default.CheckCircle,
                    contentDescription = "مختار",
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

// PaymentStep and ReviewStep implementations would follow similar patterns...
package com.printforme.app.ui.cart

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.printforme.app.data.model.Cart
import com.printforme.app.data.model.CartItem

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CartScreen(
    onNavigateToCheckout: (Cart) -> Unit,
    onNavigateBack: () -> Unit,
    viewModel: CartViewModel = hiltViewModel()
) {
    val cart by viewModel.cart.collectAsState()
    val totals by viewModel.totals.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    
    var voucherCode by remember { mutableStateOf("") }
    var useRewardPoints by remember { mutableStateOf(false) }
    
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { 
                        Text(
                            text = "سلة التسوق",
                            fontWeight = FontWeight.Bold
                        ) 
                    },
                    navigationIcon = {
                        IconButton(onClick = onNavigateBack) {
                            Icon(Icons.Default.ArrowForward, contentDescription = "العودة")
                        }
                    },
                    actions = {
                        if (cart.items.isNotEmpty()) {
                            TextButton(onClick = { viewModel.clearCart() }) {
                                Text("مسح الكل", color = MaterialTheme.colorScheme.error)
                            }
                        }
                    }
                )
            }
        ) { paddingValues ->
            if (isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (cart.items.isEmpty()) {
                EmptyCartScreen(modifier = Modifier.padding(paddingValues))
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Cart Items
                    items(cart.items) { item ->
                        CartItemCard(
                            item = item,
                            onQuantityChange = { newQuantity ->
                                viewModel.updateQuantity(item.itemId, newQuantity)
                            },
                            onRemove = {
                                viewModel.removeItem(item.itemId)
                            }
                        )
                    }
                    
                    // Voucher Section
                    item {
                        VoucherSection(
                            voucherCode = voucherCode,
                            onVoucherCodeChange = { voucherCode = it },
                            onApplyVoucher = { viewModel.applyVoucher(voucherCode) }
                        )
                    }
                    
                    // Reward Points Section
                    item {
                        RewardPointsSection(
                            useRewardPoints = useRewardPoints,
                            onToggleRewardPoints = { 
                                useRewardPoints = it
                                viewModel.toggleRewardPoints(it)
                            },
                            availablePoints = viewModel.availableBountyPoints,
                            pointsValue = totals.bountyPointsUsed * 0.01
                        )
                    }
                    
                    // Totals Section
                    item {
                        TotalsSection(totals = totals)
                    }
                    
                    // Checkout Button
                    item {
                        Button(
                            onClick = { onNavigateToCheckout(cart) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(56.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                text = "تابع إلى الدفع - ${String.format("%.2f", totals.grandTotal)} ج.م",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    
                    // Estimated Delivery
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.Default.LocalShipping,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = "التسليم المتوقع",
                                        fontWeight = FontWeight.Medium
                                    )
                                    Text(
                                        text = "1-2 أيام عمل",
                                        fontSize = 14.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CartItemCard(
    item: CartItem,
    onQuantityChange: (Int) -> Unit,
    onRemove: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Product Image
            AsyncImage(
                model = item.image,
                contentDescription = item.title,
                modifier = Modifier
                    .size(80.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentScale = ContentScale.Crop,
                placeholder = painterResource(id = android.R.drawable.ic_menu_gallery),
                error = painterResource(id = android.R.drawable.ic_menu_gallery)
            )
            
            // Product Details
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = item.titleAr.ifEmpty { item.title },
                    fontWeight = FontWeight.Medium,
                    fontSize = 16.sp
                )
                
                if (item.variant != null) {
                    Text(
                        text = item.variant.nameAr.ifEmpty { item.variant.name },
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = "${String.format("%.2f", item.price)} ج.م",
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                    fontSize = 16.sp
                )
                
                if (item.isDigital) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            Icons.Default.CloudDownload,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = "رقمي",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
            
            // Quantity and Remove Controls
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                IconButton(onClick = onRemove) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "إزالة",
                        tint = MaterialTheme.colorScheme.error
                    )
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Quantity Controls
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = { onQuantityChange(item.quantity + 1) },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "زيادة")
                    }
                    
                    Text(
                        text = item.quantity.toString(),
                        modifier = Modifier.widthIn(min = 32.dp),
                        textAlign = TextAlign.Center,
                        fontWeight = FontWeight.Medium
                    )
                    
                    IconButton(
                        onClick = { 
                            if (item.quantity > 1) onQuantityChange(item.quantity - 1)
                        },
                        modifier = Modifier.size(32.dp),
                        enabled = item.quantity > 1
                    ) {
                        Icon(Icons.Default.Remove, contentDescription = "تقليل")
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun VoucherSection(
    voucherCode: String,
    onVoucherCodeChange: (String) -> Unit,
    onApplyVoucher: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "كود الخصم",
                fontWeight = FontWeight.Medium,
                fontSize = 16.sp
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = voucherCode,
                    onValueChange = onVoucherCodeChange,
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("أدخل كود الخصم") },
                    singleLine = true
                )
                
                Button(
                    onClick = onApplyVoucher,
                    enabled = voucherCode.isNotBlank()
                ) {
                    Text("تطبيق")
                }
            }
        }
    }
}

@Composable
private fun RewardPointsSection(
    useRewardPoints: Boolean,
    onToggleRewardPoints: (Boolean) -> Unit,
    availablePoints: Int,
    pointsValue: Double
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "استخدام نقاط المكافآت",
                    fontWeight = FontWeight.Medium,
                    fontSize = 16.sp
                )
                Text(
                    text = "متاح: $availablePoints نقطة (${String.format("%.2f", availablePoints * 0.01)} ج.م)",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (useRewardPoints && pointsValue > 0) {
                    Text(
                        text = "سيتم خصم ${String.format("%.2f", pointsValue)} ج.م",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
            
            Switch(
                checked = useRewardPoints,
                onCheckedChange = onToggleRewardPoints,
                enabled = availablePoints > 0
            )
        }
    }
}

@Composable
private fun TotalsSection(totals: com.printforme.app.data.model.CartTotals) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "ملخص الطلب",
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            TotalRow("المجموع الفرعي", totals.subtotal)
            TotalRow("الشحن", totals.shipping)
            if (totals.discount > 0) {
                TotalRow("الخصم", -totals.discount, isDiscount = true)
            }
            if (totals.bountyPointsUsed > 0) {
                TotalRow("نقاط المكافآت", -totals.bountyPointsUsed * 0.01, isDiscount = true)
            }
            TotalRow("الضريبة", totals.tax)
            
            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "الإجمالي",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
                Text(
                    text = "${String.format("%.2f", totals.grandTotal)} ج.م",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            
            if (totals.bountyPointsEarned > 0) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "ستحصل على ${totals.bountyPointsEarned} نقطة مكافآت",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@Composable
private fun TotalRow(
    label: String,
    amount: Double,
    isDiscount: Boolean = false
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            fontSize = 14.sp,
            color = if (isDiscount) MaterialTheme.colorScheme.error 
                   else MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = "${if (amount >= 0) "" else "-"}${String.format("%.2f", kotlin.math.abs(amount))} ج.م",
            fontSize = 14.sp,
            color = if (isDiscount) MaterialTheme.colorScheme.error 
                   else MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun EmptyCartScreen(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            Icons.Default.ShoppingCart,
            contentDescription = null,
            modifier = Modifier.size(80.dp),
            tint = MaterialTheme.colorScheme.outlineVariant
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "سلة التسوق فارغة",
            fontSize = 20.sp,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "ابدأ بإضافة منتجات إلى السلة",
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}
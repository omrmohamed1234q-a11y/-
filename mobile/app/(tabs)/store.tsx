import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

export default function StoreScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', title: 'الكل', icon: '🛍️' },
    { id: 'books', title: 'كتب', icon: '📚' },
    { id: 'stationery', title: 'قرطاسية', icon: '✏️' },
    { id: 'tech', title: 'تقنية', icon: '💻' },
    { id: 'supplies', title: 'أدوات', icon: '📝' },
  ]

  const products = [
    {
      id: 1,
      title: 'كتاب الرياضيات المتقدمة',
      price: 45.99,
      rating: 4.8,
      image: '📘',
      category: 'books',
      featured: true,
    },
    {
      id: 2,
      title: 'قلم حبر جاف أزرق',
      price: 5.50,
      rating: 4.5,
      image: '🖊️',
      category: 'stationery',
      featured: false,
    },
    {
      id: 3,
      title: 'آلة حاسبة علمية',
      price: 89.99,
      rating: 4.9,
      image: '🔢',
      category: 'tech',
      featured: true,
    },
    {
      id: 4,
      title: 'دفتر ملاحظات A4',
      price: 12.75,
      rating: 4.6,
      image: '📓',
      category: 'stationery',
      featured: false,
    },
    {
      id: 5,
      title: 'مجموعة أقلام ملونة',
      price: 25.00,
      rating: 4.7,
      image: '🎨',
      category: 'supplies',
      featured: true,
    },
    {
      id: 6,
      title: 'كتاب الفيزياء التطبيقية',
      price: 38.50,
      rating: 4.4,
      image: '📗',
      category: 'books',
      featured: false,
    },
  ]

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const featuredProducts = products.filter(product => product.featured)

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#EF2D50', '#DC2626']} style={styles.header}>
        <Text style={styles.headerTitle}>المتجر الرقمي</Text>
        <Text style={styles.headerSubtitle}>كل ما تحتاجه للدراسة والعمل</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="ابحث عن المنتجات..."
            placeholderTextColor="#9CA3AF"
            textAlign="right"
          />
          <View style={styles.searchIcon}>
            <Text style={styles.searchIconText}>🔍</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الفئات</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                selectedCategory === category.id && styles.selectedCategoryCard
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[
                styles.categoryTitle,
                selectedCategory === category.id && styles.selectedCategoryTitle
              ]}>
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured Products */}
      {selectedCategory === 'all' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المنتجات المميزة</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredProducts.map((product) => (
              <TouchableOpacity key={product.id} style={styles.featuredCard}>
                <View style={styles.featuredImage}>
                  <Text style={styles.featuredImageText}>{product.image}</Text>
                </View>
                <View style={styles.featuredContent}>
                  <Text style={styles.featuredTitle} numberOfLines={2}>
                    {product.title}
                  </Text>
                  <View style={styles.featuredRating}>
                    <Text style={styles.ratingText}>⭐ {product.rating}</Text>
                  </View>
                  <Text style={styles.featuredPrice}>{product.price} ريال</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Products Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === 'all' ? 'جميع المنتجات' : 
           categories.find(c => c.id === selectedCategory)?.title || 'المنتجات'}
        </Text>
        <View style={styles.productsGrid}>
          {filteredProducts.map((product) => (
            <TouchableOpacity key={product.id} style={styles.productCard}>
              <View style={styles.productImage}>
                <Text style={styles.productImageText}>{product.image}</Text>
                {product.featured && (
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>مميز</Text>
                  </View>
                )}
              </View>
              <View style={styles.productContent}>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {product.title}
                </Text>
                <View style={styles.productRating}>
                  <Text style={styles.ratingText}>⭐ {product.rating}</Text>
                </View>
                <View style={styles.productFooter}>
                  <Text style={styles.productPrice}>{product.price} ريال</Text>
                  <TouchableOpacity style={styles.addToCartButton}>
                    <Text style={styles.addToCartText}>إضافة</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'right',
    paddingVertical: 8,
  },
  searchIcon: {
    marginLeft: 8,
  },
  searchIconText: {
    fontSize: 16,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'right',
  },
  categoriesContainer: {
    flexDirection: 'row',
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginLeft: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCategoryCard: {
    backgroundColor: '#EF2D50',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  selectedCategoryTitle: {
    color: '#ffffff',
  },
  featuredCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginLeft: 16,
    width: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredImage: {
    height: 120,
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredImageText: {
    fontSize: 48,
  },
  featuredContent: {
    padding: 16,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 22,
  },
  featuredRating: {
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
  },
  featuredPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF2D50',
    textAlign: 'right',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: (width - 60) / 2,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    height: 120,
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  productImageText: {
    fontSize: 40,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF2D50',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  productContent: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 6,
    lineHeight: 18,
    minHeight: 36,
  },
  productRating: {
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF2D50',
  },
  addToCartButton: {
    backgroundColor: '#EF2D50',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  bottomSpacer: {
    height: 20,
  },
})
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';

/**
 * SARATHI - DRIVER RENTAL BOOKING APP (ACROSS INDIA)
 * React Native & Expo Mobile Client Entrypoint
 * Compatible with iOS, Android & Expo Go
 */
export default function App() {
  const [selectedCategory, setSelectedCategory] = useState('hourly');
  const [selectedCity, setSelectedCity] = useState('Delhi NCR');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={styles.cityPill}>
              <Text style={styles.cityText}>📍 {selectedCity}</Text>
            </View>
            <View style={styles.verifiedPill}>
              <Text style={styles.verifiedText}>🛡️ 100% Police Verified</Text>
            </View>
          </View>
          
          <Text style={styles.title}>SARATHI</Text>
          <Text style={styles.tagline}>Apni Gaadi, Bharosemand Sarathi 🇮🇳</Text>
          <Text style={styles.subtitle}>Rent Verified Drivers for Your Personal Car</Text>
        </View>

        {/* Quick Booking Action Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Instant Chauffeur Dispatch</Text>
          <Text style={styles.cardDesc}>Connect with verified drivers across India for hourly, daily and outstation journeys.</Text>

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => Alert.alert('Sarathi Driver Rental', 'Searching nearest verified chauffeurs in ' + selectedCity)}
          >
            <Text style={styles.ctaText}>⚡ Find Drivers Nearby</Text>
          </TouchableOpacity>
        </View>

        {/* Categories Grid */}
        <Text style={styles.sectionTitle}>Rental Categories</Text>
        <View style={styles.grid}>
          {[
            { id: 'hourly', name: 'Hourly Rental', price: '₹299', desc: 'Min 2 hours' },
            { id: 'full_day', name: 'Full Day (8h)', price: '₹1,199', desc: '8 hours city ride' },
            { id: 'outstation', name: 'Outstation Trip', price: '₹1,599', desc: 'Highway & Intercity' },
            { id: 'airport', name: 'Airport Safe', price: '₹699', desc: 'T3, BOM, BLR drop' }
          ].map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catCard, selectedCategory === cat.id && styles.catCardActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={styles.catName}>{cat.name}</Text>
              <Text style={styles.catPrice}>{cat.price}</Text>
              <Text style={styles.catDesc}>{cat.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120'
  },
  scroll: {
    padding: 16
  },
  header: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    marginBottom: 16
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  cityPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  cityText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: 'bold'
  },
  verifiedPill: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  verifiedText: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: 'bold'
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  tagline: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
    marginTop: 2
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6
  },
  cardDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 16
  },
  ctaButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center'
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },
  catCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155'
  },
  catCardActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#0F172A'
  },
  catName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4
  },
  catPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#38BDF8',
    fontFamily: 'monospace',
    marginBottom: 2
  },
  catDesc: {
    fontSize: 10,
    color: '#64748B'
  }
});

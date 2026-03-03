import React from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ProfileWidget from './ProfileWidget';

export default function TopBar({ query, setQuery, onLogout }) {
  return (
    <View style={styles.headerBackground}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="menu" size={24} color="#444746" style={{ marginRight: 12 }} />
        
        <TextInput
          placeholder="Search in Drive"
          placeholderTextColor="#444746"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          autoCapitalize="none"
        />

        {!!(query && query.trim()) && (
          <Pressable onPress={() => setQuery("")} style={{ padding: 4, marginRight: 8 }}>
            <MaterialIcons name="close" size={20} color="#444746" />
          </Pressable>
        )}

        <View style={{ marginLeft: 8 }}>
          <ProfileWidget onLogout={onLogout} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBackground: {
    backgroundColor: '#f0f4f9', 
    paddingTop: 50, 
    paddingBottom: 28, 
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4dff1', 
    borderRadius: 28,
    paddingHorizontal: 16,
    height: 56,
    marginHorizontal: 16,
    elevation: 3, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f1f1f',
    marginRight: 10, 
  },
});
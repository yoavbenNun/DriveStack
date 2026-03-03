import React, { useState, useEffect } from 'react';
import { View, Text, Image, Modal, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { getUserById, updateUserImage, deleteUserImage } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';


const DEFAULT_AVATAR = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';

export default function ProfileWidget({ onLogout }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        
        if (storedUserId) {
          const userData = await getUserById(storedUserId);
          setUser(userData);
        } else {
          console.warn("No userId found in AsyncStorage!");
        }
      } catch (e) {
        console.log("Failed to load user info", e?.message);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
    }, []);

  const avatarSrc = user?.image && user.image.trim() !== '' ? { uri: user.image } : { uri: DEFAULT_AVATAR };

  const handleChangePicture = async () => {
    if (!user?.id && !user?._id) return;
    const userId = user.id || user._id;

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true, 
      });

      if (!result.canceled && result.assets[0].base64) {
        setLoading(true);
        const updatedUser = await updateUserImage(userId, result.assets[0].base64);
        setUser(prev => ({ ...prev, image: updatedUser.image }));
        Alert.alert("Success", "Profile picture updated!");
      }
    } catch (error) {
      console.error('Error updating image:', error);
      Alert.alert('Error', 'Failed to update image.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePicture = () => {
    if (!user?.id && !user?._id) return;
    const userId = user.id || user._id;

    Alert.alert('Delete Picture', 'Are you sure you want to delete your profile picture?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await deleteUserImage(userId);
            setUser(prev => ({ ...prev, image: null }));
            setModalVisible(false);
          } catch (error) {
            console.error('Error deleting image:', error);
            Alert.alert('Error', 'Failed to delete image.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  if (loading && !user) {
    return <ActivityIndicator size="small" color="#1a73e8" style={{ marginRight: 16 }} />;
  }

  return (
    <View>
      <Pressable onPress={() => setModalVisible(true)} style={styles.headerAvatarContainer}>
        <Image source={avatarSrc} style={styles.headerAvatar} />
      </Pressable>

      
      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.popoverCard} onPress={() => {}}>
            
            <Text style={styles.emailText}>{user?.email || 'user@example.com'}</Text>

            <View style={styles.largeAvatarContainer}>
              <Image source={avatarSrc} style={styles.largeAvatar} />
              
              <Pressable style={styles.cameraButton} onPress={handleChangePicture}>
                <MaterialIcons name="photo-camera" size={20} color="#444" />
              </Pressable>
            </View>

            <Text style={styles.greetingText}>
              Hello, {user?.name || user?.username || 'User'}!
            </Text>

            <Pressable style={styles.deleteButton} onPress={handleDeletePicture}>
              <MaterialIcons name="delete-outline" size={22} color="#ff4d4f" />
              <Text style={styles.deleteButtonText}>Delete Profile Picture</Text>
            </Pressable>

            <Pressable 
              style={styles.logoutButton} 
              onPress={() => {
                setModalVisible(false);
                if (onLogout) onLogout();
              }}
            >
              <MaterialIcons name="logout" size={22} color="#333" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>

            {loading && <ActivityIndicator size="small" color="#1a73e8" style={{ marginTop: 10 }} />}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerAvatarContainer: {
    marginRight: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1120ec',
    overflow: 'hidden',
  },
  headerAvatar: {
    width: 36,
    height: 36,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 90,
    paddingRight: 10,
  },
  popoverCard: {
    width: 320,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  largeAvatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  largeAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '400',
    marginBottom: 24,
    color: '#333',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: '#ff4d4f',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#f1f3f4',
    gap: 8,
  },
  logoutButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
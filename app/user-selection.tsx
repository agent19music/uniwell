import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  ImageBackground, 
  Alert,
  ScrollView,
  useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function UserSelectionScreen() {
  const { storedUsers, removeStoredUser } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    setPassword('');
  };

  const handleLogin = async () => {
    if (!selectedUser) {
      Alert.alert(
        'Error',
        'Please select a user first'
      );
      return;
    }

    if (!password) {
      Alert.alert(
        'Error',
        'Please enter your password'
      );
      return;
    }

    setLoading(true);
    try {
      // Find the selected user's email
      const user = storedUsers.find(u => u.id === selectedUser);
      if (!user) {
        throw new Error('User not found');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (error) throw error;
      
      router.push('/routines');
    } catch (error) {
      console.error('Error signing in:', (error as Error).message);
      Alert.alert(
        'Login Failed',
        'Invalid password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = (userId: string) => {
    Alert.alert(
      'Remove User',
      'Are you sure you want to remove this user from the device? You can still log in with your email and password.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeStoredUser(userId);
            if (selectedUser === userId) {
              setSelectedUser(null);
              setPassword('');
            }
          },
        },
      ]
    );
  };

  const handleNewLogin = () => {
    router.push('/loginscreen');
  };

  const handleSignUp = () => {
    router.push('/signupscreen');
  };

  const getSelectedUser = () => {
    return storedUsers.find(user => user.id === selectedUser);
  };

  return (
    <ImageBackground
      source={isDark ? require('../assets/mesh-99dark.png') : require('../assets/mesh-99.png')}
      style={styles.container}
    >
      <LinearGradient
        colors={['rgba(255, 127, 80, 0.2)', 'rgba(255, 127, 80, 0.05)']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.content}>
          <BlurView intensity={20} style={styles.glassCard}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Choose an account to continue</Text>

            <ScrollView style={styles.userList}>
              {storedUsers.length > 0 ? (
                storedUsers.map(user => (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.userCard,
                      selectedUser === user.id && styles.selectedUserCard
                    ]}
                    onPress={() => handleUserSelect(user.id)}
                  >
                    <View style={styles.userCardContent}>
                      <Image
                        source={{ uri: user.avatar_url || 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/default-avatar.png' }}
                        style={styles.avatar}
                      />
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.full_name}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveUser(user.id)}
                    >
                      <Ionicons name="close-circle" size={22} color="rgba(255, 255, 255, 0.6)" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="person-circle-outline" size={64} color="rgba(255, 255, 255, 0.6)" />
                  <Text style={styles.emptyStateText}>No saved accounts</Text>
                  <Text style={styles.emptyStateSubtext}>Sign in to add an account</Text>
                </View>
              )}
            </ScrollView>

            {selectedUser && (
              <View style={styles.passwordSection}>
                <View style={styles.selectedUserInfo}>
                  <Image
                    source={{ 
                      uri: getSelectedUser()?.avatar_url || 
                      'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/default-avatar.png' 
                    }}
                    style={styles.selectedAvatar}
                  />
                  <Text style={styles.selectedUserName}>{getSelectedUser()?.full_name}</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={24} color="rgba(255, 255, 255, 0.6)" />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={24} 
                      color="rgba(255, 255, 255, 0.6)" 
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#FF7F50', '#FF6B45']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    {loading ? (
                      <Text style={styles.buttonText}>Signing in...</Text>
                    ) : (
                      <Text style={styles.buttonText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={handleNewLogin}
              >
                <Ionicons name="log-in-outline" size={20} color="#FF7F50" />
                <Text style={styles.footerButtonText}>Use another account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.footerButton}
                onPress={handleSignUp}
              >
                <Ionicons name="person-add-outline" size={20} color="#FF7F50" />
                <Text style={styles.footerButtonText}>Create new account</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    overflow: 'hidden',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'SF-Regular',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'SF-Regular',
  },
  userList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'space-between',
  },
  selectedUserCard: {
    borderColor: '#FF7F50',
    backgroundColor: 'rgba(255, 127, 80, 0.2)',
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'SF-Regular',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'SF-Regular',
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    marginTop: 16,
    fontFamily: 'SF-Regular',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    fontFamily: 'SF-Regular',
  },
  passwordSection: {
    marginTop: 20,
  },
  selectedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
  },
  selectedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  selectedUserName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: 'SF-Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    height: '100%',
    paddingVertical: 8,
    marginLeft: 12,
    fontFamily: 'SF-Regular',
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF-Regular',
  },
  footer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  footerButtonText: {
    color: '#FF7F50',
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'SF-Regular',
  },
}); 
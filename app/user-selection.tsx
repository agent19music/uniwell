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
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LockSimple, Eye, EyeSlash, ArrowLeft, UserCircle, SignIn, UserPlus, XCircle } from 'phosphor-react-native';
import { useTheme } from '../hooks/useTheme';
import { toast } from '@/lib/toast';

export default function UserSelectionScreen() {
  const { storedUsers, removeStoredUser } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useTheme();
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
      toast.error('Please select a user first');
      return;
    }

    if (!password) {
      toast.error('Please enter your password');
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
      
      toast.success('Welcome back!');
    } catch (error) {
      console.error('Error signing in:', (error as Error).message);
      toast.error('Invalid password. Please try again.');
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ImageBackground
        source={isDark ? require('../assets/mesh-99dark.png') : require('../assets/mesh-99.png')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[styles.overlay, { 
          backgroundColor: isDark ? 'rgba(28, 24, 21, 0.85)' : 'rgba(254, 253, 251, 0.85)' 
        }]} />
      </ImageBackground>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.surface }]} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>You're Back !</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Glad to see you. Let's get you signed in 
          </Text>
        </View>

        {/* User List */}
        <View style={styles.userListContainer}>
          {storedUsers.length > 0 ? (
            storedUsers.map(user => (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.userCard,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: selectedUser === user.id ? colors.primary : colors.border
                  },
                  selectedUser === user.id && { borderWidth: 2 }
                ]}
                onPress={() => handleUserSelect(user.id)}
              >
                <View style={styles.userCardContent}>
                  <Image
                    source={{ uri: user.avatar_url || 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/default-avatar.png' }}
                    style={styles.avatar}
                  />
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.full_name}</Text>
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveUser(user.id)}
                >
                  <XCircle size={24} color={colors.textTertiary} weight="fill" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <UserCircle size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyStateText, { color: colors.textPrimary }]}>No saved accounts</Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>Sign in to add an account</Text>
            </View>
          )}
        </View>

        {/* Password Section */}
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
              <Text style={[styles.selectedUserName, { color: colors.textPrimary }]}>
                {getSelectedUser()?.full_name}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Password</Text>
              <View style={[styles.inputContainer, { 
                backgroundColor: colors.surface,
                borderColor: colors.border 
              }]}>
                <LockSimple size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeSlash size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: isDark ? colors.background : '#FFFFFF' }]}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerButton, { 
              backgroundColor: colors.surface,
              borderColor: colors.border
            }]}
            onPress={handleNewLogin}
          >
            <SignIn size={20} color={colors.primary} />
            <Text style={[styles.footerButtonText, { color: colors.textPrimary }]}>
              Use another account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerButton, { 
              backgroundColor: colors.surface,
              borderColor: colors.border
            }]}
            onPress={handleSignUp}
          >
            <UserPlus size={20} color={colors.primary} />
            <Text style={[styles.footerButtonText, { color: colors.textPrimary }]}>
              Create new account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  backButtonContainer: {
    marginBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.5,
    fontFamily: 'Vercetti-Regular',
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: 'SF-Regular',
  },
  userListContainer: {
    gap: 12,
    marginBottom: 24,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'SF-Regular',
  },
  userEmail: {
    fontSize: 15,
    fontFamily: 'SF-Regular',
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    fontFamily: 'SF-Regular',
  },
  emptyStateSubtext: {
    fontSize: 15,
    marginTop: 8,
    fontFamily: 'SF-Regular',
  },
  passwordSection: {
    gap: 24,
    marginBottom: 32,
  },
  selectedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  selectedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  selectedUserName: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'SF-Regular',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'SF-Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'SF-Regular',
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF-Regular',
  },
  footer: {
    gap: 12,
    marginTop: 16,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'SF-Regular',
  },
}); 
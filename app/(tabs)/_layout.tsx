import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import FluidTabBar from '../../components/FluidTabBar';
import { TherapistProvider } from '../therapist/context/TherapistContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TherapistProvider>
      <Tabs
        tabBar={(props) => <FluidTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: isDark ? '#FF7F50' : '#FF7F50',
          tabBarInactiveTintColor: isDark ? '#888888' : '#666666',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            fontFamily: 'SF-Regular',
          },
        }}>
        <Tabs.Screen
          name="home"
          options={{    
            title: 'Home' ,
            tabBarIcon: ({ size, color }) => (
              <Feather name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sessions"
          options={{
            title: 'Sessions',
            tabBarIcon: ({ size, color }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
       
        <Tabs.Screen
          name="community"
          options={{
            title: 'Community',
            tabBarIcon: ({ size, color }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="routines"
          options={{
            title: 'Routines',
            tabBarIcon: ({ size, color }) => (
              <Ionicons name="repeat-sharp" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="games"
          options={{
            title: 'Games',
            tabBarIcon: ({ size, color }) => (
              <Ionicons name="game-controller-outline" size={size} color={color} />
            ),
          }}
        />
       
      </Tabs>
    </TherapistProvider>
  );
}
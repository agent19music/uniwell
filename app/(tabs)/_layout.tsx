import { Tabs } from 'expo-router';
import { HouseSimpleIcon, UsersThreeIcon, CalendarDotsIcon, GameControllerIcon, RepeatIcon } from 'phosphor-react-native';
import FluidTabBar from '@/components/FluidTabBar';
import { useTheme } from '@/hooks/useTheme';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <FluidTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.navigation.background },
        tabBarActiveTintColor: colors.navigation.tabActive,
        tabBarInactiveTintColor: colors.navigation.tabInactive,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          fontFamily: 'SF-Regular',
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home tab',
          tabBarIcon: ({ focused, size, color }) => (
            <HouseSimpleIcon size={size} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
          tabBarAccessibilityLabel: 'Sessions tab',
          tabBarIcon: ({ focused, size, color }) => (
            <CalendarDotsIcon size={size} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarLabel: 'Social',
          tabBarAccessibilityLabel: 'Community tab',
          tabBarIcon: ({ focused, size, color }) => (
            <UsersThreeIcon size={size} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Routines',
          tabBarAccessibilityLabel: 'Routines tab',
          tabBarIcon: ({ focused, size, color }) => (
            <RepeatIcon size={size} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: 'Games',
          tabBarAccessibilityLabel: 'Games tab',
          tabBarIcon: ({ focused, size, color }) => (
            <GameControllerIcon size={size} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />

    </Tabs>
  );
}
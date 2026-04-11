import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { HomeScreen } from './src/screens/HomeScreen';
import { AddWorkoutScreen } from './src/screens/AddWorkoutScreen';
import { PerformanceDashboardScreen } from './src/screens/PerformanceDashboardScreen';
import { EditWorkoutScreen } from './src/screens/EditWorkoutScreen';
import { MuscleDetailScreen } from './src/screens/MuscleDetailScreen';
import { ExerciseManagerScreen } from './src/screens/ExerciseManagerScreen';
import { WeightHistoryScreen } from './src/screens/WeightHistoryScreen';
import BackupScreen from './src/screens/BackupScreen';

import { COLORS } from './src/styles/theme';
import { MuscleGroup } from './src/types';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

export type RootStackParamList = {
  Backup: undefined;
  Weight: undefined;
  HomeMain: undefined;
  Add: {
    date?: string;
    existingWorkouts?: any[];
  };
  Performance: undefined;
  ExerciseManager: undefined;

  MuscleDetail: {
    muscle: MuscleGroup;
  };

  EditWorkout: {
    workout: {
      id: string;
      workoutId: string;
      date: string;
      muscleGroup: string;
      exercise: string;
      sets: { reps: number; weight: number }[];
    };
  };
};

function HomeStack({ onRefreshApp }: { onRefreshApp: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain">
        {(props) => <HomeScreen {...props} onRefreshApp={onRefreshApp} />}
      </Stack.Screen>
      <Stack.Screen name="MuscleDetail" component={MuscleDetailScreen} />
      <Stack.Screen name="EditWorkout" component={EditWorkoutScreen} />
      <Stack.Screen name="ExerciseManager" component={ExerciseManagerScreen} />
      <Stack.Screen name="Backup" component={BackupScreen} />
    </Stack.Navigator>
  );
}

function Tabs({ onRefreshApp }: { onRefreshApp: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
        },

        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: '#888',

        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') {
            return <MaterialCommunityIcons name="home" size={size} color={color} />;
          }

          if (route.name === 'Performance') {
            return <MaterialCommunityIcons name="chart-bar" size={size} color={color} />;
          }

          if (route.name === 'Add') {
            return <MaterialCommunityIcons name="plus-circle" size={36} color={COLORS.accent} />;
          }

          if (route.name === 'Exercises') {
            return <MaterialCommunityIcons name="dumbbell" size={size} color={color} />;
          }

          if (route.name === 'Weight') {
            return <MaterialCommunityIcons name="scale-bathroom" size={size} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen name="Home">
        {() => <HomeStack onRefreshApp={onRefreshApp} />}
      </Tab.Screen>

      <Tab.Screen name="Exercises" component={ExerciseManagerScreen} />

      <Tab.Screen name="Add" component={AddWorkoutScreen} />

      <Tab.Screen name="Performance" component={PerformanceDashboardScreen} />

      <Tab.Screen name="Weight" component={WeightHistoryScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [appKey, setAppKey] = useState(0);

  const handleRefreshApp = () => {
    setAppKey(prev => prev + 1); // 🔥 forces full app remount
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer key={appKey}>
        <Tabs onRefreshApp={handleRefreshApp} />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { HomeScreen } from './src/screens/HomeScreen';
import { AddWorkoutScreen } from './src/screens/AddWorkoutScreen';
import { MuscleProgressScreen } from './src/screens/MuscleProgressScreen';
import { EditWorkoutScreen } from './src/screens/EditWorkoutScreen';
import { COLORS } from './src/styles/theme';
import { MuscleGroup } from './src/types';
import { MuscleDetailScreen } from './src/screens/MuscleDetailScreen';
import { ExerciseManagerScreen } from './src/screens/ExerciseManagerScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

export type RootStackParamList = {
  Weight: undefined;
  HomeMain: undefined;
  Add: undefined;
  Progress: undefined;
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

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="MuscleDetail" component={MuscleDetailScreen} />
      <Stack.Screen name="EditWorkout" component={EditWorkoutScreen} />
      <Stack.Screen name="ExerciseManager" component={ExerciseManagerScreen} />
    </Stack.Navigator>
  );
}



function Tabs() {
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

          if (route.name === 'Progress') {
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
      <Tab.Screen name="Home" component={HomeStack} />

      <Tab.Screen name="Exercises" component={ExerciseManagerScreen} />

      <Tab.Screen name="Add" component={AddWorkoutScreen} />

      <Tab.Screen name="Progress" component={MuscleProgressScreen} />

      <Tab.Screen name="Weight" component={WeightHistoryScreen} />

    </Tab.Navigator>
  );
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WeightHistoryScreen } from './src/screens/WeightHistoryScreen';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Tabs />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
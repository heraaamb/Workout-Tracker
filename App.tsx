import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { AddWorkoutScreen } from './src/screens/AddWorkoutScreen';
import { MuscleProgressScreen } from './src/screens/MuscleProgressScreen';
import { MuscleDetailScreen } from './src/screens/MuscleDetailScreen';
import { COLORS } from './src/styles/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Workout } from './src/types';
import { EditWorkoutScreen } from './src/screens/EditWorkoutScreen';


export type RootStackParamList = {
  Home: undefined;
  AddWorkout: undefined;
  MuscleProgress: undefined;
  MuscleDetail: { muscle: string };
  EditWorkout: { workout: Workout };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
    primary: COLORS.accent,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={DarkTheme}>
        <StatusBar style="light" />
        <Stack.Navigator 
          screenOptions={{ 
            headerStyle: { backgroundColor: COLORS.background },
            headerTintColor: COLORS.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: COLORS.background },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="AddWorkout" 
            component={AddWorkoutScreen} 
            options={{ 
              title: '',
              headerBackTitleVisible: false,
              headerTransparent: true,
            }} 
          />
          <Stack.Screen 
            name="MuscleProgress" 
            component={MuscleProgressScreen} 
            options={{ title: 'Muscle Progress', headerBackTitleVisible: false }} 
          />
          <Stack.Screen 
            name="MuscleDetail" 
            component={MuscleDetailScreen} 
            options={({ route }) => ({ title: route.params.muscle, headerBackTitleVisible: false })} 
          />
          <Stack.Screen 
            name="EditWorkout"
            component={EditWorkoutScreen} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

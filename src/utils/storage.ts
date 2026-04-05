import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Workout } from '../types';

const WORKOUTS_KEY = '@workout_tracker_workouts';
const EXERCISES_KEY = '@workout_tracker_exercises';

// 📥 Load workouts
export const loadWorkouts = async (): Promise<Workout[]> => {
  try {
    const data = await AsyncStorage.getItem(WORKOUTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error loading workouts:', e);
    return [];
  }
};

// 💾 Save workouts
export const saveWorkouts = async (workouts: Workout[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
  } catch (e) {
    console.error('Error saving workouts:', e);
  }
};

// ➕ Add workout
export const addWorkout = async (workout: Omit<Workout, 'id'>): Promise<Workout[]> => {
  try {
    const workouts = await loadWorkouts();

    const newWorkout: Workout = {
      ...workout,
      id: Date.now().toString(),
    };

    const updated = [newWorkout, ...workouts];
    await saveWorkouts(updated);

    return updated;
  } catch (e) {
    console.error('Error adding workout:', e);
    return [];
  }
};

// ✏️ Update workout
export const updateWorkout = async (updatedWorkout: Workout): Promise<Workout[]> => {
  try {
    const workouts = await loadWorkouts();

    const updated = workouts.map(w =>
      w.id === updatedWorkout.id ? updatedWorkout : w
    );

    await saveWorkouts(updated);
    return updated;
  } catch (e) {
    console.error('Error updating workout:', e);
    return [];
  }
};

// 🗑️ Delete workout
export const deleteWorkout = async (id: string): Promise<Workout[]> => {
  try {
    const workouts = await loadWorkouts();

    const updated = workouts.filter(w => w.id !== id);

    await saveWorkouts(updated);
    return updated;
  } catch (e) {
    console.error('Error deleting workout:', e);
    return [];
  }
};

// ❌ Clear all workouts (optional)
export const clearWorkouts = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(WORKOUTS_KEY);
  } catch (e) {
    console.error('Error clearing workouts:', e);
  }
};

export const getExercises = async (): Promise<string[]> => {
  const data = await AsyncStorage.getItem(EXERCISES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveExercise = async (exercise: string) => {
  const existing = await getExercises();

  const updated = Array.from(
    new Set([...existing, exercise.trim()])
  );

  await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(updated));
};
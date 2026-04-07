import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BodyweightEntry, DayLog, Workout } from '../types';
import type { StoredExercise } from '../types';

const WORKOUTS_KEY = '@workout_tracker_workouts';
const EXERCISES_KEY = '@workout_tracker_exercises';
const BODYWEIGHT_KEY = '@bodyweight_logs';
const DAYLOG_KEY = '@day_logs';

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

export const getExercises = async (): Promise<StoredExercise[]> => {
  const data = await AsyncStorage.getItem(EXERCISES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveExercise = async (name: string, muscleGroup: string) => {
  const existing = await getExercises();

  const updated = [
    ...existing,
    { name: name.trim(), muscleGroup }
  ];

  const unique = updated.filter(
    (v, i, arr) =>
      arr.findIndex(
        e => e.name === v.name && e.muscleGroup === v.muscleGroup
      ) === i
  );

  await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(unique));
};

export const deleteExercise = async (name: string, muscleGroup: string) => {
  const existing = await getExercises();

  const updated = existing.filter(
    ex => !(ex.name === name && ex.muscleGroup === muscleGroup)
  );

  await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(updated));
};

export const loadBodyweight = async (): Promise<BodyweightEntry[]> => {
  const data = await AsyncStorage.getItem(BODYWEIGHT_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveBodyweight = async (entries: BodyweightEntry[]) => {
  await AsyncStorage.setItem(BODYWEIGHT_KEY, JSON.stringify(entries));
};

export const addBodyweight = async (weight: number) => {
  const existing = await loadBodyweight();

  const newEntry: BodyweightEntry = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    weight,
  };

  const updated = [newEntry, ...existing];
  await saveBodyweight(updated);

  return updated;
};

export const loadDayLogs = async (): Promise<DayLog[]> => {
  const data = await AsyncStorage.getItem(DAYLOG_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveDayLogs = async (logs: DayLog[]) => {
  await AsyncStorage.setItem(DAYLOG_KEY, JSON.stringify(logs));
};
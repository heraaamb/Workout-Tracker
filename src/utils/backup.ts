import * as FileSystem from 'expo-file-system/legacy';
import { loadWorkouts, getExercises } from './storage';

const BACKUP_FILE = FileSystem.documentDirectory + 'auto-backup.json';

export const autoBackup = async () => {
  try {
    const workouts = await loadWorkouts();
    const exercises = await getExercises();

    const data = {
      workouts,
      exercises,
      lastBackup: new Date().toISOString(),
    };

    await FileSystem.writeAsStringAsync(
      BACKUP_FILE,
      JSON.stringify(data)
    );

  } catch (err) {
    console.log('Auto backup failed', err);
  }
};
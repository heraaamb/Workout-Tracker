export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Biceps' | 'Triceps' | 'Core';

export type WorkoutSet = {
  reps: number;
  weight: number;
};

export type WorkoutExercise = {
  name: string;
  muscleGroup: MuscleGroup;
  sets: WorkoutSet[];
};

export type Workout = {
  id: string;
  date: string;
  exercises: WorkoutExercise[];
};

export type EditableExercise = {
  id: string; // exercise id
  workoutId: string; // parent workout id
  date: string;
  muscleGroup: MuscleGroup;
  exercise: string;
  sets: WorkoutSet[];
};

export type BodyweightEntry = {
  id: string;
  date: string;
  weight: number;
};

export type DayLog = {
  date: string;
  type: 'workout' | 'rest';
  workoutId?: string;
  muscleGroups?: MuscleGroup[];
};

export type StoredExercise = {
  name: string;
  muscleGroup: MuscleGroup;
};

export const EXERCISES_BY_MUSCLE: Record<MuscleGroup, string[]> = {
  Chest: ['Barbell Bench Press', 'Incline Dumbbell Press', 'Push-ups', 'Pec Deck', 'Cable Flyes', 'Dips', 'Chest Press Machine'],
  Back: ['Pull-ups', 'Lat Pulldown', 'Barbell Row', 'Deadlift', 'Seated Row', 'Face Pulls', 'T-Bar Row', 'Dumbbell Row',],
  Legs: ['Squats', 'Leg Press', 'Lunges', 'Leg Extensions', 'Calf Raises', 'Hamstring Curls', 'Glute Bridges', 'Bulgarian Split Squats'],
  Shoulders: ['Dumbbell Overhead Press', 'Lateral Raises', 'Front Raises', 'Face Pulls', 'Reverse Pec Deck', 'Upright Row'],
  Biceps: ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curls', 'Preacher Curl', 'Cable Curls', 'Concentration Curls', 'Chin-ups', 'Incline Dumbbell Curl'],
  Triceps: ['Tricep Pushdown', 'Dumbbell Overhead Tricep Extension', 'Skull Crushers', 'Dips', 'Close-Grip Bench Press', 'Diamond Push-ups', 'Tricep Kickbacks', 'Cable Overhead Tricep Extension'],
  Core: ['Crunches', 'Plank', 'Russian Twists', 'Leg Raises', 'Bicycle Crunches', 'Mountain Climbers', 'Hanging Leg Raises', 'Ab Wheel Rollouts', 'Side Plank', 'Flutter Kicks'],
};

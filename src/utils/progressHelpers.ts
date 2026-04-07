import { Workout, MuscleGroup } from '../types';

/* ---------------- BASIC STATS ---------------- */

export const getLastTrained = (workouts: Workout[], muscle: MuscleGroup): string | null => {
  const dates = workouts
    .filter(w => w.exercises.some(ex => ex.muscleGroup === muscle))
    .map(w => new Date(w.date).getTime())
    .sort((a, b) => b - a);

  return dates.length > 0 ? new Date(dates[0]).toISOString() : null;
};

export const getTotalSessions = (workouts: Workout[], muscle: MuscleGroup): number => {
  const uniqueDates = new Set(
    workouts
      .filter(w => w.exercises.some(ex => ex.muscleGroup === muscle))
      .map(w => new Date(w.date).toDateString())
  );

  return uniqueDates.size;
};

export const getTotalVolume = (workouts: Workout[], muscle: MuscleGroup): number => {
  return workouts
    .filter(w => w.exercises.some(ex => ex.muscleGroup === muscle))
    .reduce((totalVol, w) => {
      const wVol = w.exercises
        .filter(ex => ex.muscleGroup === muscle)
        .reduce((exVol, ex) => {
          return exVol + ex.sets.reduce((sum, set) => sum + (set.reps * set.weight), 0);
        }, 0);
      return totalVol + wVol;
    }, 0);
};

/* ---------------- HISTORY ---------------- */

export type DayHistory = {
  date: string;
  volume: number;
  maxWeight: number; // ✅ ADD THIS (important)
  exercises: {
    name: string;
    sets: {
      reps: number;
      weight: number;
    }[];
    totalReps: number;
    id: string;
  }[];
};

export const getMuscleHistory = (workouts: Workout[], muscle: MuscleGroup) => {
  return workouts
    .map(w => {
      const exercises = w.exercises.filter(ex => ex.muscleGroup === muscle);

      if (exercises.length === 0) return null;

      return {
        workoutId: w.id, // ✅ KEEP THIS
        date: w.date,
        exercises: exercises.map(ex => ({
          id: ex.name, // ✅ stable id
          name: ex.name,
          muscleGroup: ex.muscleGroup, // ✅ keep this
          sets: ex.sets,
        })),
        maxWeight: Math.max(
          ...exercises.flatMap(ex => ex.sets.map(s => s.weight))
        ),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/* ---------------- VOLUME GRAPH (OLD) ---------------- */

export const getChartData = (workouts: Workout[], muscle: MuscleGroup) => {
  const history = getMuscleHistory(workouts, muscle);
  const ascHistory = [...history].reverse();

  const dates = ascHistory.map(h => {
    const d = new Date(h.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  return {
    labels: dates.length > 0 ? dates : ['N/A'],
  };
};

/* ---------------- ✅ STRENGTH GRAPH (NEW) ---------------- */

export const getStrengthChartData = (workouts: Workout[], muscle: MuscleGroup) => {
  const history = getMuscleHistory(workouts, muscle);
  const ascHistory = [...history].reverse();

  const weights = ascHistory.map(h => h.maxWeight); // ✅ THIS is strength
  const dates = ascHistory.map(h => {
    const d = new Date(h.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  return {
    labels: dates.length > 0 ? dates : ['N/A'],
    data: weights.length > 0 ? weights : [0]
  };
};

export const getExercisePRs = (workouts: Workout[], muscle: MuscleGroup) => {
  const prs: Record<string, number> = {};

  workouts.forEach(w => {
    w.exercises
      .filter(ex => ex.muscleGroup === muscle)
      .forEach(ex => {
        ex.sets.forEach(set => {
          if (!prs[ex.name] || set.weight > prs[ex.name]) {
            prs[ex.name] = set.weight;
          }
        });
      });
  });

  return prs;
};

export const getExerciseCount = (workouts: Workout[], muscle: MuscleGroup) => {
  const set = new Set<string>();

  workouts.forEach(w => {
    w.exercises
      .filter(ex => ex.muscleGroup === muscle)
      .forEach(ex => set.add(ex.name));
  });

  return set.size;
};

export const getMaxWeight = (workouts: Workout[], muscle: MuscleGroup) => {
  let max = 0;

  workouts.forEach(w => {
    w.exercises
      .filter(ex => ex.muscleGroup === muscle)
      .forEach(ex => {
        ex.sets.forEach(set => {
          if (set.weight > max) max = set.weight;
        });
      });
  });

  return max;
};


export const getAvgWeight = (workouts: Workout[], muscle: MuscleGroup) => {
  let total = 0;
  let count = 0;

  workouts.forEach(w => {
    w.exercises
      .filter(ex => ex.muscleGroup === muscle)
      .forEach(ex => {
        ex.sets.forEach(set => {
          total += set.weight;
          count++;
        });
      });
  });

  return count === 0 ? 0 : Math.round(total / count);
};

export const getExerciseHistory = (
  workouts: Workout[],
  muscle: MuscleGroup,
  exercise: string
) => {
  return workouts
    .filter(w => w.exercises.some(ex => ex.muscleGroup === muscle && ex.name === exercise))
    .map(w => {
      const ex = w.exercises.find(ex => ex.muscleGroup === muscle && ex.name === exercise)!;
      const maxWeight = Math.max(...ex.sets.map(s => s.weight));

      return {
        date: w.date,
        weight: maxWeight,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getExercisesForMuscle = (workouts: Workout[], muscle: MuscleGroup) => {
  return Array.from(
    new Set(
      workouts.flatMap(w => w.exercises
        .filter(ex => ex.muscleGroup === muscle)
        .map(ex => ex.name)
      )
    )
  );
};

export const getExercises = (w: any) => {
  return w.exercises ?? [
    {
      id: w.id, // fallback
      name: w.exercise,
      muscleGroup: w.muscleGroup,
      sets: w.sets,
    },
  ];
};
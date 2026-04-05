import { Workout, MuscleGroup } from '../types';

/* ---------------- BASIC STATS ---------------- */

export const getLastTrained = (workouts: Workout[], muscle: MuscleGroup): string | null => {
  const dates = workouts
    .filter(w => w.muscleGroup === muscle)
    .map(w => new Date(w.date).getTime())
    .sort((a, b) => b - a);

  return dates.length > 0 ? new Date(dates[0]).toISOString() : null;
};

export const getTotalSessions = (workouts: Workout[], muscle: MuscleGroup): number => {
  const uniqueDates = new Set(
    workouts
      .filter(w => w.muscleGroup === muscle)
      .map(w => new Date(w.date).toDateString())
  );

  return uniqueDates.size;
};

export const getTotalVolume = (workouts: Workout[], muscle: MuscleGroup): number => {
  return workouts
    .filter(w => w.muscleGroup === muscle)
    .reduce((totalVol, w) => {
      const wVol = w.sets.reduce((sum, set) => sum + (set.reps * set.weight), 0);
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

export const getMuscleHistory = (workouts: Workout[], muscle: MuscleGroup): DayHistory[] => {
  const filtered = workouts.filter(w => w.muscleGroup === muscle);
  const byDate: Record<string, Workout[]> = {};

  filtered.forEach(w => {
    const dStr = new Date(w.date).toDateString();
    if (!byDate[dStr]) byDate[dStr] = [];
    byDate[dStr].push(w);
  });

  const history: DayHistory[] = Object.keys(byDate).map(dateStr => {
    const dayWorkouts = byDate[dateStr];
    let dayVol = 0;
    let maxWeight = 0; // ✅ track strongest lift that day

    const exercises = dayWorkouts.map(w => {
      const totalReps = w.sets.reduce((sum, s) => sum + s.reps, 0);

      const vol = w.sets.reduce(
        (sum, s) => sum + (s.reps * s.weight),
        0
      );

      // ✅ find max weight in this workout
      w.sets.forEach(s => {
        if (s.weight > maxWeight) {
          maxWeight = s.weight;
        }
      });

      dayVol += vol;

      return {
        name: w.exercise,
        sets: w.sets,
        totalReps,
        id: w.id
      };
    });

    return {
      date: dayWorkouts[0].date,
      volume: dayVol,
      maxWeight, // ✅ key for strength graph
      exercises
    };
  });

  return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/* ---------------- VOLUME GRAPH (OLD) ---------------- */

export const getChartData = (workouts: Workout[], muscle: MuscleGroup) => {
  const history = getMuscleHistory(workouts, muscle);
  const ascHistory = [...history].reverse();

  const volumes = ascHistory.map(h => h.volume);
  const dates = ascHistory.map(h => {
    const d = new Date(h.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  return {
    labels: dates.length > 0 ? dates : ['N/A'],
    data: volumes.length > 0 ? volumes : [0]
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

  workouts
    .filter(w => w.muscleGroup === muscle)
    .forEach(w => {
      const exName = w.exercise;

      w.sets.forEach(set => {
        if (!prs[exName] || set.weight > prs[exName]) {
          prs[exName] = set.weight;
        }
      });
    });

  return prs;
};

export const getExerciseCount = (workouts: Workout[], muscle: MuscleGroup) => {
  const set = new Set(
    workouts
      .filter(w => w.muscleGroup === muscle)
      .map(w => w.exercise)
  );

  return set.size;
};

export const getMaxWeight = (workouts: Workout[], muscle: MuscleGroup) => {
  let max = 0;

  workouts
    .filter(w => w.muscleGroup === muscle)
    .forEach(w => {
      w.sets.forEach(set => {
        if (set.weight > max) max = set.weight;
      });
    });

  return max;
};


export const getAvgWeight = (workouts: Workout[], muscle: MuscleGroup) => {
  let total = 0;
  let count = 0;

  workouts
    .filter(w => w.muscleGroup === muscle)
    .forEach(w => {
      w.sets.forEach(set => {
        total += set.weight;
        count++;
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
    .filter(w => w.muscleGroup === muscle && w.exercise === exercise)
    .map(w => {
      const maxWeight = Math.max(...w.sets.map(s => s.weight));

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
      workouts
        .filter(w => w.muscleGroup === muscle)
        .map(w => w.exercise)
    )
  );
};
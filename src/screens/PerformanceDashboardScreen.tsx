import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, RefreshControl
} from 'react-native';

import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

import { loadWorkouts } from '../utils/storage';
import { COLORS, SPACING, RADIUS } from '../styles/theme';
import { useFocusEffect } from '@react-navigation/native';
import type { Workout, WorkoutExercise, MuscleGroup } from '../types';
import { WeekStats } from '../types';

const screenWidth = Dimensions.get('window').width;
const WEEKLY_GOAL = 5;



function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getDateKey(date: Date) {
  return date.toLocaleDateString('en-CA');
}

function getWeekRange(referenceDate = new Date()) {
  const current = new Date(referenceDate);
  const day = current.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(current);
  start.setHours(0, 0, 0, 0);
  start.setDate(current.getDate() + diffToMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function isDateWithinRange(dateString: string, range: { start: Date; end: Date }) {
  const date = new Date(`${dateString}T00:00:00`);
  return date >= range.start && date <= range.end;
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getWorkoutDurationMinutes(workout: Workout & Record<string, any>) {
  const candidates = [
    workout.durationMinutes,
    workout.duration,
    workout.workoutDuration,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  if (workout.startedAt && workout.endedAt) {
    const start = new Date(workout.startedAt).getTime();
    const end = new Date(workout.endedAt).getTime();
    const diff = Math.round((end - start) / 60000);
    if (Number.isFinite(diff) && diff > 0) {
      return diff;
    }
  }

  return null;
}

function getExerciseVolume(exercise: WorkoutExercise) {
  return exercise.sets.reduce((total, set) => {
    const reps = toNumber(set.reps);
    const weight = toNumber(set.weight);
    return total + reps * weight;
  }, 0);
}

function getAllTimePRs(workouts: (Workout & Record<string, any>)[]) {
  const prMap: Record<
    string,
    { value: number; reps: number; date: string; isBodyweight: boolean }
  > = {};

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      // 🔥 BODYWEIGHT CHECK
      const hasWeight = exercise.sets.some(
        (s: any) => (parseFloat(s.weight) || 0) > 0
      );

      // =========================
      // 🟢 BODYWEIGHT PR (REPS)
      // =========================
      if (!hasWeight) {
        const bestSet = exercise.sets.reduce((best: any, current: any) => {
          const reps = Number(current.reps) || 0;

          if (!best || reps > best.reps) {
            return { reps };
          }
          return best;
        }, null);

        if (!bestSet || bestSet.reps === 0) return;

        if (
          !prMap[exercise.name] ||
          bestSet.reps > prMap[exercise.name].value
        ) {
          prMap[exercise.name] = {
            value: bestSet.reps,
            reps: bestSet.reps,
            date: workout.date,
            isBodyweight: true,
          };
        }
      }

      // =========================
      // 🔴 WEIGHTED PR (TOP SET)
      // =========================
      else {
        const bestSet = exercise.sets.reduce((best: any, current: any) => {
          const weight = parseFloat(current.weight) || 0;
          const reps = Number(current.reps) || 0;

          if (!best) return { weight, reps };

          // Higher weight wins
          if (weight > best.weight) return { weight, reps };

          // Same weight → higher reps wins
          if (weight === best.weight && reps > best.reps) {
            return { weight, reps };
          }

          return best;
        }, null);

        if (!bestSet || bestSet.weight === 0) return;

        const { weight: maxWeight, reps } = bestSet;

        if (
          !prMap[exercise.name] ||
          maxWeight > prMap[exercise.name].value
        ) {
          prMap[exercise.name] = {
            value: maxWeight,
            reps: reps,
            date: workout.date,
            isBodyweight: false,
          };
        }
      }
    });
  });

  return Object.entries(prMap).map(([exercise, data]) => ({
    exercise,
    value: data.value,
    reps: data.reps,
    date: data.date,
    isBodyweight: data.isBodyweight,
    muscle:
      workouts
        .flatMap(w => w.exercises)
        .find(ex => ex.name === exercise)?.muscleGroup || 'Other',
  }));
}


function calculateWeekStats(
  workouts: (Workout & Record<string, any>)[],
  currentWeek: { start: Date; end: Date }
) {
  const previousWeekStart = new Date(currentWeek.start);
  previousWeekStart.setDate(currentWeek.start.getDate() - 7);
  const previousWeekEnd = new Date(currentWeek.end);
  previousWeekEnd.setDate(currentWeek.end.getDate() - 7);

  const previousWeek = {
    start: previousWeekStart,
    end: previousWeekEnd,
  };

  const currentWeekWorkouts = workouts.filter(workout =>
    isDateWithinRange(workout.date, currentWeek)
  );
  const previousWeekWorkouts = workouts.filter(workout =>
    isDateWithinRange(workout.date, previousWeek)
  );

  const buildWeekStats = (weekWorkouts: (Workout & Record<string, any>)[]): WeekStats => {
    const muscleFrequency: Record<string, number> = {};
    const durationEntries: number[] = [];
    let totalSets = 0;
    let totalReps = 0;
    let totalVolume = 0;

    weekWorkouts.forEach(workout => {
      const duration = getWorkoutDurationMinutes(workout);
      if (duration !== null) {
        durationEntries.push(duration);
      }

      // track muscles trained in THIS workout
      const musclesTrainedInWorkout = new Set<string>();

      workout.exercises.forEach(exercise => {
        musclesTrainedInWorkout.add(exercise.muscleGroup);
      });

      // count each muscle only ONCE per workout
      musclesTrainedInWorkout.forEach(muscle => {
        muscleFrequency[muscle] = (muscleFrequency[muscle] || 0) + 1;
      });
    });

    const prsThisWeek: { exercise: string; value: number }[] = [];

    weekWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const exerciseMax = Math.max(...exercise.sets.map(set => toNumber(set.weight)), 0);
        if (exerciseMax <= 0) return;

        const previousBest = workouts
          .filter(entry => new Date(`${entry.date}T00:00:00`) < new Date(`${workout.date}T00:00:00`))
          .flatMap(entry => entry.exercises)
          .filter(entry => entry.name === exercise.name)
          .reduce((best, entry) => {
            const entryMax = Math.max(...entry.sets.map(set => toNumber(set.weight)), 0);
            return Math.max(best, entryMax);
          }, 0);

        if (exerciseMax > previousBest) {
          const existing = prsThisWeek.find(pr => pr.exercise === exercise.name);
          if (!existing || exerciseMax > existing.value) {
            if (existing) {
              existing.value = exerciseMax;
            } else {
              prsThisWeek.push({ exercise: exercise.name, value: exerciseMax });
            }
          }
        }
      });
    });

    return {
      workoutsCompleted: weekWorkouts.length,
      totalSets,
      totalReps,
      totalVolume,
      averageDuration:
        durationEntries.length > 0
          ? Math.round(durationEntries.reduce((sum, value) => sum + value, 0) / durationEntries.length)
          : null,
      muscleFrequency,
      prsThisWeek,
    };
  };

  return {
    current: buildWeekStats(currentWeekWorkouts),
    previous: buildWeekStats(previousWeekWorkouts),
  };
}

function calculateWorkoutStreak(workouts: Workout[]) {
  const uniqueDates = Array.from(
    new Set(workouts.map(workout => workout.date))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (uniqueDates.length === 0) return 0;

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const dateString of uniqueDates) {
    const workoutDate = new Date(`${dateString}T00:00:00`);
    const diffDays = Math.round((cursor.getTime() - workoutDate.getTime()) / 86400000);

    if (diffDays === 0) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (diffDays === 1 && streak === 0) {
      streak += 1;
      cursor = workoutDate;
      cursor.setDate(cursor.getDate() - 1);
    } else if (diffDays === 1) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function PerformanceDashboardScreen() {

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState('Chest');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPRMuscle, setSelectedPRMuscle] = useState<string | null>(null);
  const [selectedPRExercise, setSelectedPRExercise] = useState<string | null>(null);

  const allTimePRs = useMemo(() => getAllTimePRs(workouts as any), [workouts]);

  const prMuscles = useMemo(() => {
    return Array.from(new Set(allTimePRs.map(pr => pr.muscle)));
  }, [allTimePRs]);

  const prExercises = useMemo(() => {
    if (!selectedPRMuscle) return [];
    return allTimePRs.filter(pr => pr.muscle === selectedPRMuscle);
  }, [allTimePRs, selectedPRMuscle]);

  const selectedPR = useMemo(() => {
    return allTimePRs.find(pr => pr.exercise === selectedPRExercise);
  }, [allTimePRs, selectedPRExercise]);

  const [activeTab, setActiveTab] = useState<'exercise' | 'overview'>('exercise');

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await loadWorkouts();
    setWorkouts(res);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const groupedPRs = useMemo(() => {
    const map: Record<string, typeof allTimePRs> = {};

    allTimePRs.forEach(pr => {
      if (!map[pr.muscle]) map[pr.muscle] = [];
      map[pr.muscle].push(pr);
    });

    return map;
  }, [allTimePRs]);

  const muscleGroups = useMemo(() => {
    const set = new Set<string>();
    workouts.forEach(w =>
      w.exercises.forEach((ex: any) => set.add(ex.muscleGroup))
    );
    return Array.from(set);
  }, [workouts]);

  const exercisesByMuscle = useMemo(() => {
    const set = new Set<string>();
    workouts.forEach(w =>
      w.exercises.forEach((ex: any) => {
        if (ex.muscleGroup === selectedMuscle) set.add(ex.name);
      })
    );
    return Array.from(set);
  }, [workouts, selectedMuscle]);

  useEffect(() => {
    if (exercisesByMuscle.length > 0) {
      setSelectedExercise(exercisesByMuscle[0]);
    }
  }, [exercisesByMuscle]);

  // 🔥 FIXED PROGRESS LOGIC
  const getProgress = (exercise: string) => {
    const map: Record<string, any> = {};

    workouts.forEach(w => {
      const dateKey = new Date(w.date).toISOString().split('T')[0];

      w.exercises.forEach((ex: any) => {
        if (ex.name !== exercise) return;

        const weights = ex.sets.map((s: any) => Number(s.weight) || 0);
        const repsArr = ex.sets.map((s: any) => Number(s.reps) || 0);

        const maxWeight = Math.max(...weights, 0);

        let value = 0;
        let isBodyweight = false;

        if (maxWeight === 0) {
          value = Math.max(...repsArr, 0);
          isBodyweight = true;
        } else {
          const idx = weights.indexOf(maxWeight);
          const reps = repsArr[idx] || 1;
          value = maxWeight; // track weight for weighted exercises
        }

        // ✅ keep best value per day
        if (!map[dateKey] || value > map[dateKey].value) {
          map[dateKey] = {
            date: dateKey,
            value,
            isBodyweight,
          };
        }
      });
    });

    // ✅ sort by date
    const sorted = Object.values(map).sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // ✅ format labels nicely
    return sorted.slice(-10).map((d: any) => ({
      ...d,
      label: new Date(d.date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
      }),
    }));
  };

  const mainData = useMemo(() => getProgress(selectedExercise), [workouts, selectedExercise]);

  const exercisePR = useMemo(() => {
    let best = 0;

    workouts.forEach(w => {
      w.exercises.forEach(ex => {
        if (ex.name === selectedExercise) {
          const max = Math.max(...ex.sets.map(s => Number(s.weight) || 0));
          if (max > best) best = max;
        }
      });
    });

    return best;
  }, [workouts, selectedExercise]);

  const current = mainData[mainData.length - 1]?.value || 0;
  const isNewPR = current === exercisePR && mainData.length > 0;

  const isBodyweight = mainData[0]?.isBodyweight;

  const progressionRate = useMemo(() => {
    if (mainData.length < 2) return null;
    const first = mainData[0].value;
    const last = mainData[mainData.length - 1].value;
    return (last - first) / (mainData.length / 2);
  }, [mainData]);

  const datasets = [
    { data: mainData.map(d => d.value), color: () => COLORS.accent },
  ];

  const frequency = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    workouts.forEach(w => {
      const date = new Date(w.date);
      const week = `${date.getFullYear()}-${getWeekNumber(date)}`;
      if (!map[week]) map[week] = {};

      w.exercises.forEach((ex: any) => {
        map[week][ex.muscleGroup] = (map[week][ex.muscleGroup] || 0) + 1;
      });
    });
    return map;
  }, [workouts]);

  const consistencyScore = useMemo(() => {
    const weeks = Object.keys(frequency).length;
    if (weeks === 0) return 0;
    return Math.min(workouts.length / weeks, 7);
  }, [frequency, workouts]);

  const currentWeekKey = `${new Date().getFullYear()}-${getWeekNumber(new Date())}`;
  const weeklyFrequency = frequency[currentWeekKey] || {};
  const weekRange = useMemo(() => getWeekRange(new Date()), []);
  const weekStats = useMemo(
    () => calculateWeekStats(workouts as (Workout & Record<string, any>)[], weekRange),
    [workouts, weekRange]
  );
  const workoutStreak = useMemo(() => calculateWorkoutStreak(workouts), [workouts]);
  const weeklyGoalProgress = Math.min(weekStats.current.workoutsCompleted / WEEKLY_GOAL, 1);
  const volumeDelta = weekStats.current.totalVolume - weekStats.previous.totalVolume;
  const muscleFrequencyEntries = Object.entries(weekStats.current.muscleFrequency).sort(
    (a, b) => b[1] - a[1]
  );
  const mostTrainedMuscle = muscleFrequencyEntries[0] ?? null;
  const leastTrainedMuscle = muscleFrequencyEntries[muscleFrequencyEntries.length - 1] ?? null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={async () => {
              setActiveTab('exercise');
              setSelectedMuscle('Chest');
              setSelectedExercise('');
              await loadData();
            }}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
            progressBackgroundColor={COLORS.surface}
          />
        }
      >

        <Text style={styles.title}>Performance</Text>

        {/* TABS */}
        <View style={styles.tabs}>
          <Pressable onPress={() => setActiveTab('exercise')} style={[styles.tabBtn, activeTab === 'exercise' && styles.tabActive]}>
            <Text style={styles.tabText}>Exercise</Text>
          </Pressable>

          <Pressable onPress={() => setActiveTab('overview')} style={[styles.tabBtn, activeTab === 'overview' && styles.tabActive]}>
            <Text style={styles.tabText}>Overview</Text>
          </Pressable>
        </View>

        {/* EXERCISE TAB */}
        {activeTab === 'exercise' && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
              {muscleGroups.map((m, i) => (
                <Pressable key={i} onPress={() => setSelectedMuscle(m)} style={[styles.btn, selectedMuscle === m && styles.active]}>
                  <Text style={styles.btnText}>{m}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>{selectedMuscle} Exercises</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
              {exercisesByMuscle.map((ex, i) => (
                <Pressable key={i} onPress={() => setSelectedExercise(ex)} style={[styles.btn, selectedExercise === ex && styles.active]}>
                  <Text style={styles.btnText}>{ex}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* HEADER */}
            <View style={styles.card}>
              <Text style={styles.label}>{selectedExercise}</Text>

              <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.text }}>
                {current.toFixed(0)} {isBodyweight ? 'reps' : 'kg'}
              </Text>

              <Text style={{ color: '#888' }}>
                Best: {exercisePR.toFixed(0)} {isBodyweight ? 'reps' : 'kg'}
              </Text>

              {isNewPR && <Text style={{ color: '#FFD700' }}>🏆 New PR</Text>}
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>Green line = your progress for the selected exercise.</Text>
            </View>

            {/* CHART */}
            <View style={styles.card}>
              <Text style={styles.label}>Trend</Text>

              {mainData.length > 0 ? (
                <LineChart
                  data={{ labels: mainData.map(d => d.label), datasets }}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={{
                    backgroundColor: COLORS.surface,
                    backgroundGradientFrom: COLORS.surface,
                    backgroundGradientTo: COLORS.surface,
                    color: () => COLORS.accent,
                    labelColor: () => '#888',
                  }}
                  bezier
                />
              ) : (
                <Text style={styles.sub}>No data</Text>
              )}
            </View>

            {/* STATS */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.card, { flex: 1 }]}>
                <Text style={styles.label}>Progress</Text>
                <Text style={styles.text}>
                  {progressionRate !== null ? `${progressionRate > 0 ? '+' : ''}${progressionRate.toFixed(1)}` : '--'}
                </Text>
                <Text style={styles.sub}>
                  {isBodyweight ? 'reps/session' : 'kg/week'}
                </Text>
              </View>

              <View style={[styles.card, { flex: 1 }]}>
                <Text style={styles.label}>Sessions</Text>
                <Text style={styles.text}>{mainData.length}</Text>
              </View>
            </View>
          </>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            <Text style={styles.sectionTitle}>Weekly snapshot</Text>
            <View style={styles.metricsGrid}>
              <View style={[styles.card, styles.metricCard]}>
                <Text style={styles.label}>Workouts this week</Text>
                <Text style={styles.metricValue}>{weekStats.current.workoutsCompleted}</Text>
                <Text style={styles.sub}>goal: {WEEKLY_GOAL} workouts</Text>
              </View>

              <View style={[styles.card, styles.metricCard]}>
                <Text style={styles.label}>Total volume</Text>
                <Text style={styles.metricValue}>{weekStats.current.totalVolume}</Text>
                <Text style={styles.sub}>kg lifted this week</Text>
              </View>

              <View style={[styles.card, styles.metricCard]}>
                <Text style={styles.label}>Volume change</Text>
                <Text style={[
                  styles.metricValue,
                  volumeDelta > 0 ? styles.deltaPositive :
                    volumeDelta < 0 ? styles.deltaNegative :
                      styles.deltaNeutral
                ]}>
                  {volumeDelta > 0 ? '+' : ''}{volumeDelta}
                </Text>
                <Text style={styles.sub}>vs last week</Text>
              </View>

              <View style={[styles.card, styles.metricCard]}>
                <Text style={styles.label}>Avg workout duration</Text>
                <Text style={styles.metricValue}>
                  {weekStats.current.averageDuration !== null
                    ? `${weekStats.current.averageDuration}m`
                    : '--'}
                </Text>
                <Text style={styles.sub}>shown when duration exists</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Consistency</Text>
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.label}>Workout streak</Text>
                  <Text style={styles.metricValue}>{workoutStreak} days</Text>
                </View>

                <View style={styles.goalWrap}>
                  <Text style={styles.goalValue}>
                    {weekStats.current.workoutsCompleted}/{WEEKLY_GOAL}
                  </Text>
                  <Text style={styles.sub}>weekly goal</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${weeklyGoalProgress * 100}%` },
                  ]}
                />
              </View>
            </View>

            {/* 🔥 PR SECTION */}
            <View style={styles.prSection}>
              <Text style={styles.label}>All-time PRs</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {prMuscles.map(muscle => (
                  <Pressable
                    key={muscle}
                    onPress={() => { setSelectedPRMuscle(muscle); setSelectedPRExercise(null); }}
                    style={[styles.btn, selectedPRMuscle === muscle && styles.active]}
                  >
                    <Text style={styles.btnText}>{muscle}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {selectedPRMuscle && (
                <>
                  <Text style={styles.sectionTitle}>Exercises</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {prExercises.map(pr => (
                      <Pressable
                        key={pr.exercise}
                        onPress={() => setSelectedPRExercise(pr.exercise)}
                        style={[styles.btn, selectedPRExercise === pr.exercise && styles.active]}
                      >
                        <Text style={styles.btnText}>{pr.exercise}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              )}

              {selectedPR && (
                <View style={styles.prCardLarge}>
                  <Text style={styles.prExercise}>{selectedPR.exercise}</Text>
                  <Text style={styles.prMainLarge}>
                    {selectedPR.isBodyweight ? `${selectedPR.reps} reps` : `${selectedPR.value} kg × ${selectedPR.reps}`}
                  </Text>
                  <Text style={styles.prDate}>
                    {new Date(selectedPR.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.sectionTitle}>Muscle group analytics</Text>
            <View style={styles.card}>
              {muscleFrequencyEntries.length === 0 ? (
                <Text style={styles.sub}>No muscle groups trained this week.</Text>
              ) : (
                <>
                  <View style={styles.highlightRow}>
                    <View style={styles.highlightCard}>
                      <Text style={styles.label}>Most trained</Text>
                      <Text style={styles.highlightTitle}>{mostTrainedMuscle?.[0]}</Text>
                      <Text style={styles.sub}>{mostTrainedMuscle?.[1]} sessions</Text>
                    </View>

                    <View style={styles.highlightCard}>
                      <Text style={styles.label}>Least trained</Text>
                      <Text style={styles.highlightTitle}>{leastTrainedMuscle?.[0]}</Text>
                      <Text style={styles.sub}>{leastTrainedMuscle?.[1]} sessions</Text>
                    </View>
                  </View>

                  {muscleFrequencyEntries.map(([muscle, count]) => (
                    <View key={muscle} style={styles.analyticsRow}>
                      <View style={styles.analyticsLabelRow}>
                        <View
                          style={[
                            styles.analyticsDot,
                            { backgroundColor: COLORS.muscleGroups[muscle as MuscleGroup] || COLORS.accent },
                          ]}
                        />
                        <Text style={styles.text}>{muscle}</Text>
                      </View>

                      <View style={styles.analyticsCountWrap}>
                        <Text style={styles.analyticsCount}>{count}</Text>
                        <Text style={styles.sub}>times</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  chart: { borderRadius: 12, marginBottom: 20 },

  card: { backgroundColor: COLORS.surface, padding: 14, borderRadius: 12, marginBottom: 12 },
  label: { color: COLORS.textSecondary },
  text: { color: COLORS.text, fontSize: 16 },

  prCardLarge: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },

  prMainLarge: {
    color: COLORS.accent,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },

  prCard: {
    width: 140,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  prExercise: {
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 6,
  },

  prMain: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '700',
  },

  prDate: {
    color: '#888',
    fontSize: 12,
    marginTop: 6,
  },

  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 4,
  },

  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },

  tabActive: {
    backgroundColor: COLORS.accent,
  },

  tabText: {
    color: '#fff',
    fontWeight: '600',
  },

  btn: {
    padding: 10,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 10,
  },
  active: { backgroundColor: COLORS.accent },
  btnText: { color: '#fff', fontWeight: '600' },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  metricCard: {
    width: '48%',
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  goalWrap: {
    alignItems: 'flex-end',
  },
  goalValue: {
    color: COLORS.accent,
    fontSize: 22,
    fontWeight: '700',
  },
  progressTrack: {
    marginTop: SPACING.md,
    height: 10,
    borderRadius: RADIUS.round,
    backgroundColor: '#222',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.accent,
  },
  deltaText: {
    fontSize: 20,
    fontWeight: '700',
  },
  deltaPositive: {
    color: COLORS.success,
  },
  deltaNegative: {
    color: COLORS.danger,
  },
  deltaNeutral: {
    color: COLORS.textSecondary,
  },
  prSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  prValue: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  highlightRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  highlightTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  analyticsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  analyticsDot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.round,
  },
  analyticsCountWrap: {
    alignItems: 'flex-end',
  },
  analyticsCount: {
    color: COLORS.text,
    fontWeight: '700',
  },

  barRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  bar: {
    height: 6,
    backgroundColor: COLORS.accent,
    marginLeft: 10,
    borderRadius: 4,
    flex: 1
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { fontSize: 20, color: COLORS.text },
  sub: { color: '#888', marginTop: 6 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  legendDot: {
    width: 14,
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },
  legendText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },

  stopCompareBtn: {
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },

  stopCompareText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 4,
  },
});

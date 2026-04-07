import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable
} from 'react-native';

import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

import { loadWorkouts } from '../utils/storage';
import { COLORS, SPACING } from '../styles/theme';

const screenWidth = Dimensions.get('window').width;
  // 🔥 WEEK NUMBER HELPER
  function getWeekNumber(date: Date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

export function PerformanceDashboardScreen() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState('Chest');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [compareExercise, setCompareExercise] = useState('');

  useEffect(() => {
    loadWorkouts().then(setWorkouts);
  }, []);

  // 🔥 MUSCLE GROUPS
  const muscleGroups = useMemo(() => {
    const set = new Set<string>();
    workouts.forEach(w => {
      w.exercises.forEach((ex: any) => set.add(ex.muscleGroup));
    });
    return Array.from(set);
  }, [workouts]);

  // 🔥 EXERCISES BY MUSCLE
  const exercisesByMuscle = useMemo(() => {
    const set = new Set<string>();
    workouts.forEach(w => {
      w.exercises.forEach((ex: any) => {
        if (ex.muscleGroup === selectedMuscle) {
          set.add(ex.name);
        }
      });
    });
    return Array.from(set);
  }, [workouts, selectedMuscle]);

  useEffect(() => {
    if (exercisesByMuscle.length > 0) {
      setSelectedExercise(exercisesByMuscle[0]);
      setCompareExercise(exercisesByMuscle[1] || '');
    }
  }, [exercisesByMuscle]);

  // 🔥 PROGRESS DATA
  const getProgress = (exercise: string) => {
    const data: any[] = [];

    workouts.forEach(w => {
      w.exercises.forEach((ex: any) => {
        if (ex.name === exercise) {
          const max = Math.max(...ex.sets.map((s: any) => s.weight));
          const reps = ex.sets.find((s: any) => s.weight === max)?.reps || 1;

          // 🔥 1RM (Epley)
          const oneRM = max * (1 + reps / 30);

          data.push({
            date: new Date(w.date).getDate().toString(),
            weight: oneRM,
          });
        }
      });
    });

    return data.slice(-10);
  };

  const mainData = useMemo(() => getProgress(selectedExercise), [workouts, selectedExercise]);
  const compareData = useMemo(() => getProgress(compareExercise), [workouts, compareExercise]);

  // 🔥 PR HISTORY
  const prHistory = useMemo(() => {
    return mainData
      .map((d, i, arr) => {
        if (i === 0 || d.weight > Math.max(...arr.slice(0, i).map(x => x.weight))) {
          return d;
        }
        return null;
      })
      .filter(Boolean)
      .slice(-5);
  }, [mainData]);

  // 🔥 FREQUENCY
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

  // 🔥 MUSCLE DISTRIBUTION
  const muscleStats = useMemo(() => {
    const map: any = {};
    workouts.forEach(w => {
      w.exercises.forEach((ex: any) => {
        map[ex.muscleGroup] = (map[ex.muscleGroup] || 0) + 1;
      });
    });

    const values = Object.values(map) as number[];
    const max = Math.max(...values, 1);
    
    return Object.entries(map).map(([m, c]: any) => ({
      muscle: m,
      count: c,
      ratio: c / max,
    }));
  }, [workouts]);

  const handleStopCompare = () => {
    setCompareExercise('');
  };

  const datasets = useMemo(() => {
    const ds = [
      { data: mainData.map(d => d.weight), color: () => COLORS.accent }
    ];

    if (compareExercise && compareData.length > 0) {
      ds.push({
        data: compareData.map(d => d.weight),
        color: () => '#FF6B6B'
      });
    }

    return ds;
  }, [mainData, compareData, compareExercise]);

    // 🔥 EMPTY STATE
  if (workouts.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No workouts yet</Text>
        <Text style={styles.sub}>Start training to see performance</Text>
      </View>
    );
  }

  const currentWeekKey = `${new Date().getFullYear()}-${getWeekNumber(new Date())}`;
  const weeklyFrequency = frequency[currentWeekKey] || {};

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>Performance</Text>

      {/* MUSCLE */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {muscleGroups.map((m, i) => (
          <Pressable key={i}
            onPress={() => setSelectedMuscle(m)}
            style={[styles.btn, selectedMuscle === m && styles.active]}>
            <Text style={styles.btnText}>{m}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* EXERCISES */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {exercisesByMuscle.map((ex, i) => (
          <Pressable key={i}
            onPress={() => setSelectedExercise(ex)}
            style={[styles.btn, selectedExercise === ex && styles.active]}>
            <Text style={styles.btnText}>{ex}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* COMPARE */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {exercisesByMuscle.map((ex, i) => (
          <Pressable key={i}
            onPress={() => setCompareExercise(ex)}
            style={[styles.btn, compareExercise === ex && styles.active]}>
            <Text style={styles.btnText}>vs {ex}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {compareExercise !== '' && (
        <Pressable
          style={styles.stopCompareBtn}
          onPress={handleStopCompare}
        >
          <Text style={styles.stopCompareText}>
            Stop Comparing
          </Text>
        </Pressable>
      )}

      {/* CHART */}
        {mainData.length > 0 && (
          <LineChart
            data={{
              labels: mainData.map(d => d.date),
              datasets: datasets
            }}
            width={screenWidth - 20}
            height={220}
            chartConfig={{
              backgroundColor: COLORS.surface,
              backgroundGradientFrom: COLORS.surface,
              backgroundGradientTo: COLORS.surface,
              decimalPlaces: 0,
              color: () => COLORS.accent,
              labelColor: () => '#888',
              propsForDots: { r: "4" }
            }}
            bezier
            style={styles.chart}
          />
        )}

      {/* PR HISTORY */}
      <View style={styles.card}>
        <Text style={styles.label}>PR History</Text>
        {prHistory.map((p, i) => (
          <Text key={i} style={styles.text}>
            {p.weight.toFixed(0)} kg
          </Text>
        ))}
      </View>

      {/* FREQUENCY */}
      <View style={styles.card}>
        <Text style={styles.label}>This Week</Text>

        {Object.entries(weeklyFrequency).length === 0 ? (
          <Text style={styles.sub}>No workouts this week</Text>
        ) : (
          Object.entries(weeklyFrequency).map(([m, c]) => (
            <Text key={m} style={styles.text}>
              {m}: {c}
            </Text>
          ))
        )}
      </View>

      {/* MUSCLE DISTRIBUTION */}
      <View style={styles.card}>
        <Text style={styles.label}>Muscle Balance</Text>
        {muscleStats.map((m: any, i) => (
          <View key={i} style={styles.barRow}>
            <Text style={styles.text}>{m.muscle}</Text>
            <View style={[styles.bar, { flex: m.ratio }]} />
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.lg, backgroundColor: COLORS.background },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  chart: { borderRadius: 12, marginBottom: 20 },

  card: { backgroundColor: COLORS.surface, padding: 14, borderRadius: 12, marginBottom: 12 },
  label: { color: COLORS.textSecondary },
  text: { color: COLORS.text, fontSize: 16 },

  btn: {
    padding: 10,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 10,
  },
  active: { backgroundColor: COLORS.accent },
  btnText: { color: '#fff', fontWeight: '600' },

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
});
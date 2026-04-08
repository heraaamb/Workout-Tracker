import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable
} from 'react-native';

import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

import { loadWorkouts } from '../utils/storage';
import { COLORS, SPACING } from '../styles/theme';
import { useFocusEffect } from '@react-navigation/native';
import { PanGestureHandler } from 'react-native-gesture-handler';

const screenWidth = Dimensions.get('window').width;

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
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'exercise' | 'overview'>('exercise');

  const handleSwipe = (event: any) => {
    const { translationX } = event.nativeEvent;
    if (translationX < -50) setActiveTab('overview');
    if (translationX > 50) setActiveTab('exercise');
  };

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        const res = await loadWorkouts();
        setWorkouts(res);
        setLoading(false);
      };
      loadData();
    }, [])
  );

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
      setCompareExercise(exercisesByMuscle[1] || '');
    }
  }, [exercisesByMuscle]);

  // 🔥 FIXED PROGRESS LOGIC
  const getProgress = (exercise: string) => {
    const data: any[] = [];

    workouts.forEach(w => {
      w.exercises.forEach((ex: any) => {
        if (ex.name === exercise) {

          const weights = ex.sets.map((s: any) => Number(s.weight) || 0);
          const maxWeight = Math.max(...weights);

          // ✅ BODYWEIGHT
          if (maxWeight === 0) {
            const maxReps = Math.max(...ex.sets.map((s: any) => Number(s.reps) || 0));

            data.push({
              date: new Date(w.date).getDate().toString(),
              value: maxReps,
              isBodyweight: true,
            });

          } else {
            // ✅ WEIGHTED
            const reps = ex.sets.find((s: any) => Number(s.weight) === maxWeight)?.reps || 1;
            const oneRM = maxWeight * (1 + reps / 30);

            data.push({
              date: new Date(w.date).getDate().toString(),
              value: oneRM,
              isBodyweight: false,
            });
          }
        }
      });
    });

    return data.slice(-10);
  };

  const mainData = useMemo(() => getProgress(selectedExercise), [workouts, selectedExercise]);
  const compareData = useMemo(() => getProgress(compareExercise), [workouts, compareExercise]);

  const best = Math.max(...mainData.map(d => d.value), 0);
  const current = mainData[mainData.length - 1]?.value || 0;
  const isNewPR = current === best && mainData.length > 0;

  const isBodyweight = mainData[0]?.isBodyweight;

  const progressionRate = useMemo(() => {
    if (mainData.length < 2) return null;
    const first = mainData[0].value;
    const last = mainData[mainData.length - 1].value;
    return (last - first) / (mainData.length / 2);
  }, [mainData]);

  const datasets = [
    { data: mainData.map(d => d.value), color: () => COLORS.accent },
    ...(compareExercise ? [{ data: compareData.map(d => d.value), color: () => '#FF6B6B' }] : [])
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

  return (
    <PanGestureHandler onEnded={handleSwipe}>
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.container}>

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
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {muscleGroups.map((m, i) => (
                  <Pressable key={i} onPress={() => setSelectedMuscle(m)} style={[styles.btn, selectedMuscle === m && styles.active]}>
                    <Text style={styles.btnText}>{m}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.sectionTitle}>{selectedMuscle} Exercises</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                  Best: {best.toFixed(0)} {isBodyweight ? 'reps' : 'kg'}
                </Text>

                {isNewPR && <Text style={{ color: '#FFD700' }}>🏆 New PR</Text>}
              </View>

              {/* CHART */}
              <View style={styles.card}>
                <Text style={styles.label}>Trend</Text>

                {mainData.length > 0 ? (
                  <LineChart
                    data={{ labels: mainData.map(d => d.date), datasets }}
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
              <View style={styles.card}>
                <Text style={styles.label}>Consistency</Text>
                <Text style={styles.text}>{consistencyScore.toFixed(1)} / week</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.label}>This Week</Text>
                {Object.keys(weeklyFrequency).length === 0
                  ? <Text style={styles.sub}>No workouts</Text>
                  : Object.entries(weeklyFrequency).map(([m, c]) => (
                      <Text key={m}>{m}: {c as number}</Text>
                    ))
                }
              </View>
            </>
          )}

        </ScrollView>
      </View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.lg, backgroundColor: COLORS.background },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  chart: { borderRadius: 12, marginBottom: 20 },

  card: { backgroundColor: COLORS.surface, padding: 14, borderRadius: 12, marginBottom: 12 },
  label: { color: COLORS.textSecondary },
  text: { color: COLORS.text, fontSize: 16 },

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

sectionTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: COLORS.text,
  marginBottom: 6,
  marginTop: 4,
},
});
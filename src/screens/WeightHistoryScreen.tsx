import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TextInput, Alert,
  Pressable
} from 'react-native';

import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadBodyweight } from '../utils/storage';
import { COLORS, SPACING } from '../styles/theme';

import { useFocusEffect } from '@react-navigation/native';

export function WeightHistoryScreen() {
  
  const screenWidth = Dimensions.get('window').width;

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [targetWeight, setTargetWeight] = useState<number | null>(null);

  // 🔥 LOAD DATA
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);

        const res = await loadBodyweight();

        const sorted = res.sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setData(sorted);

        // ✅ LOAD TARGET
        const savedTarget = await AsyncStorage.getItem('targetWeight');
        if (savedTarget) {
          setTargetWeight(Number(savedTarget));
        }

        setLoading(false);
      };

      loadData();
    }, [])
  );

  // 🔥 SMART REMINDER (no spam)
  const checkWeightReminder = async () => {
    const data = await loadBodyweight();
    if (!data || data.length === 0) return;

    const latest = new Date(data[0].date);
    const now = new Date();

    const diffDays = Math.floor(
      (now.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 7) return;

    const lastShown = await AsyncStorage.getItem('weightReminderShown');
    const today = now.toDateString();

    if (lastShown === today) return;

    Alert.alert(
      'Log your weight ⚖️',
      `You haven't logged your weight in ${diffDays} days`
    );

    await AsyncStorage.setItem('weightReminderShown', today);
  };

  useFocusEffect(
    useCallback(() => {
      checkWeightReminder();
    }, [])
  );

  // 🔥 SMOOTHING FUNCTION
  const smoothData = (arr: number[], windowSize = 3) => {
    return arr.map((_, i) => {
      const start = Math.max(0, i - windowSize + 1);
      const subset = arr.slice(start, i + 1);
      const avg = subset.reduce((a, b) => a + b, 0) / subset.length;
      return Number(avg.toFixed(1));
    });
  };

  // 🔥 CHART DATA
  const rawWeights = data
    .slice(0, 7)
    .reverse()
    .map(d => Number(d.weight));

  const smoothedWeights = smoothData(rawWeights);

  const chartData = {
    labels: data
      .slice(0, 7)
      .reverse()
      .map(d =>
        new Date(d.date).getDate().toString()
      ),

    datasets: [
      {
        data: smoothedWeights,
      },
    ],
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Weight Progress</Text>

      {/* 🎯 TARGET */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: '#888', marginBottom: 6 }}>Target Weight</Text>

        <TextInput
          placeholder="Enter target (kg)"
          keyboardType="decimal-pad"
          placeholderTextColor="#888"
          value={targetWeight ? String(targetWeight) : ''}
          onChangeText={async (v) => {
            if (v === '') {
              setTargetWeight(null);
              await AsyncStorage.removeItem('targetWeight');
              return;
            }

            const val = Number(v);
            setTargetWeight(val);
            await AsyncStorage.setItem('targetWeight', v);
          }}
          style={{
            backgroundColor: '#1E1E1E',
            padding: 10,
            borderRadius: 8,
            color: '#fff',
          }}
        />

        

        {targetWeight && data.length > 0 && (() => {
          const latest = Number(data[0].weight);
          const startWeight = Number(data[data.length - 1].weight);

          const totalChangeNeeded = startWeight - targetWeight;
          const currentChange = startWeight - latest;

          const progress =
            totalChangeNeeded !== 0
              ? Math.min(Math.max(currentChange / totalChangeNeeded, 0), 1)
              : 0;

          const remaining = latest - targetWeight;
          const isCut = startWeight > targetWeight;

          return (
            <View style={{ marginTop: 10 }}>
              <Text style={{
                fontWeight: '600',
                color: remaining > 0 ? '#FF5252' : '#4CAF50'
              }}>
                {remaining > 0
                  ? `${remaining.toFixed(1)} kg to lose`
                  : `${Math.abs(remaining).toFixed(1)} kg to gain`}
              </Text>

              <View style={{
                height: 8,
                backgroundColor: '#333',
                borderRadius: 10,
                marginTop: 8,
                overflow: 'hidden'
              }}>
                <View style={{
                  width: `${progress * 100}%`,
                  height: '100%',
                  backgroundColor: COLORS.accent,
                }} />
              </View>

              <Text style={{
                marginTop: 4,
                color: '#888',
                fontSize: 12
              }}>
                {(progress * 100).toFixed(0)}% complete • {isCut ? 'Cutting' : 'Bulking'}
              </Text>
            </View>
          );
        })()}
      </View>

      <Pressable onPress={async () => {
        setTargetWeight(null);
        await AsyncStorage.removeItem('targetWeight');
      }}>
        <Text style={{ color: 'red', marginTop: 6 }}>Clear Target</Text>
      </Pressable>

      {/* LOADING */}
      {loading && (
        <Text style={{ color: '#888', marginBottom: 10 }}>
          Loading...
        </Text>
      )}



      {/* 📈 CHART */}
      {data.length > 0 && (
        <LineChart
          data={chartData}
          width={screenWidth - 20}
          height={220}
          chartConfig={{
            backgroundColor: COLORS.surface,
            backgroundGradientFrom: COLORS.surface,
            backgroundGradientTo: COLORS.surface,
            decimalPlaces: 1,
            color: () => COLORS.accent,
            labelColor: () => '#888',
          }}
          style={styles.chart}
        />
      )}

      {/* 📜 HISTORY */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const current = Number(item.weight);
          const prev = data[index + 1]
            ? Number(data[index + 1].weight)
            : null;

          let change = null;
          if (prev !== null) {
            change = current - prev;
          }

          return (
            <View style={styles.card}>
              <Text style={styles.weight}>{item.weight} kg</Text>

              {change !== null && (
                <Text
                  style={{
                    marginTop: 4,
                    fontWeight: '600',
                    color:
                      change > 0 ? '#FF5252'
                      : change < 0 ? '#4CAF50'
                      : '#888',
                  }}
                >
                  {change > 0 ? '+' : ''}
                  {change.toFixed(1)} kg
                  {change > 0 ? ' ↑' : change < 0 ? ' ↓' : ' →'}
                </Text>
              )}

              <Text style={styles.date}>
                {new Date(item.date).toDateString()}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },

  chart: {
    borderRadius: 12,
    marginBottom: 20,
  },

  card: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  weight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },

  date: {
    color: COLORS.textSecondary,
  },
});
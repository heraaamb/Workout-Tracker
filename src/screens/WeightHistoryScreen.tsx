import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList
} from 'react-native';

import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

import { loadBodyweight } from '../utils/storage';
import { COLORS, SPACING } from '../styles/theme';

const screenWidth = Dimensions.get('window').width;

export function WeightHistoryScreen() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    loadBodyweight().then(setData);
  }, []);

  const chartData = {
    labels: data
      .slice(0, 7)
      .reverse()
      .map(d =>
        new Date(d.date).getDate().toString()
      ),

    datasets: [
      {
        data: data
          .slice(0, 7)
          .reverse()
          .map(d => d.weight),
      },
    ],
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Weight Progress</Text>

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

      {/* HISTORY LIST */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.weight}>{item.weight} kg</Text>
            <Text style={styles.date}>
              {new Date(item.date).toDateString()}
            </Text>
          </View>
        )}
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
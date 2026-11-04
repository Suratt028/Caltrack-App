import React from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import styles from '../style/components/TrendDataTableStyles';

const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

const formatNumber = (value) => Math.round(Number(value) || 0).toLocaleString('th-TH');

const shortDate = (key, withYear) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(key || ''))) return String(key || '');
  const [y, m, d] = String(key).split('-').map(Number);
  const month = THAI_MONTHS_SHORT[(m || 1) - 1] || '';
  return `${d} ${month}${withYear ? ` ${y + 543}` : ''}`;
};

/**
 * Accessible data table — the text alternative to the trend charts.
 * One row per day with tabular, right-aligned values; the header row is
 * separated by a border and today's row is labelled "· วันนี้".
 */
export default function TrendDataTable({ title = '', meta = '', rows = [], showYear = false }) {
  if (!rows.length) return null;

  return (
    <View style={styles.wrap}>
      {(!!title || !!meta) && (
        <View style={styles.titleRow}>
          {!!title && <Text style={styles.title} accessibilityRole="header">{title}</Text>}
          {!!meta && <Text style={styles.meta}>{meta}</Text>}
        </View>
      )}

      <View style={styles.table}>
        <View style={[styles.row, styles.headRow]}>
          <Text style={[styles.headCell, styles.dateHead]}>วันที่</Text>
          <Text style={[styles.headCell, styles.numCell]}>พลังงาน (kcal)</Text>
          <Text style={[styles.headCell, styles.numCell]}>โปรตีน (กรัม)</Text>
          <Text style={[styles.headCell, styles.numCell]}>คาร์บ (กรัม)</Text>
          <Text style={[styles.headCell, styles.numCellLast]}>ไขมัน (กรัม)</Text>
        </View>

        {rows.map((row, index) => {
          const dateLabel = `${shortDate(row.date, showYear)}${row.isToday ? ' · วันนี้' : ''}`;
          const rowLabel = [
            `วันที่ ${shortDate(row.date, showYear)}${row.isToday ? ' วันนี้' : ''}`,
            `พลังงาน ${formatNumber(row.kcal)} กิโลแคลอรี`,
            `โปรตีน ${formatNumber(row.protein)} กรัม`,
            `คาร์บ ${formatNumber(row.carbs)} กรัม`,
            `ไขมัน ${formatNumber(row.fat)} กรัม`,
          ].join('. ');
          const isLast = index === rows.length - 1;
          return (
            <View
              key={row.date}
              style={[styles.row, styles.bodyRow, isLast && styles.lastRow]}
              accessible
              accessibilityLabel={rowLabel}
            >
              <Text style={[styles.cell, styles.dateCell]} numberOfLines={1}>
                {dateLabel}
              </Text>
              <Text style={[styles.cell, styles.strong, styles.numCell]}>{formatNumber(row.kcal)}</Text>
              <Text style={[styles.cell, styles.numCell]}>{formatNumber(row.protein)}</Text>
              <Text style={[styles.cell, styles.numCell]}>{formatNumber(row.carbs)}</Text>
              <Text style={[styles.cell, styles.numCellLast]}>{formatNumber(row.fat)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

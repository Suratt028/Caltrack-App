import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, Pressable, Platform } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { Text } from './AppText';
import { colors } from '../theme/colors';
import useDeviceLayout from '../utils/useDeviceLayout';
import styles from '../style/components/MacroGroupedChartStyles';

const PAD = { top: 10, right: 8, bottom: 24, left: 34 };
const MIN_CHART_WIDTH = 240;
const TOOLTIP_WIDTH = 210;
// Moving from one day to the next fires hover-out then hover-in; waiting this
// long before hiding keeps the popup from blinking in between.
const HOVER_OUT_DELAY_MS = 120;
const SLIDE = { speed: 22, bounciness: 0, useNativeDriver: false };

const SERIES = [
  { key: 'protein', label: 'โปรตีน', color: colors.protein },
  { key: 'carbs', label: 'คาร์บ', color: colors.carbs },
  { key: 'fat', label: 'ไขมัน', color: colors.fat },
];

const THAI_WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

const valueOf = (day, key) => Number(day?.macros?.[key] ?? day?.[key]) || 0;
const formatNumber = (value) => Math.round(Number(value) || 0).toLocaleString('th-TH');
const dayNumber = (date) => String(Number(String(date).slice(8, 10)) || '');
const longDate = (key) => {
  const [y, m, d] = String(key).split('-').map(Number);
  const date = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  return `${THAI_WEEKDAYS[date.getUTCDay()]} ${d} ${THAI_MONTHS_SHORT[(m || 1) - 1]}`;
};

/** Popup for one day, same layout as the web dashboard's daily calorie tooltip. */
function DayTooltip({ day, goalKcal, macroGoals }) {
  const kcal = Number(day.kcal) || 0;
  const diff = goalKcal ? kcal - goalKcal : null;
  let status = null;
  if (diff != null) {
    if (day.partial && diff <= 0) status = { text: `เหลืออีก ${formatNumber(-diff)} kcal`, over: false };
    else if (diff > 0) status = { text: `เกินเป้าหมาย ${formatNumber(diff)} kcal`, over: true };
    else status = { text: `ต่ำกว่าเป้า ${formatNumber(-diff)} kcal`, over: false };
  }

  return (
    <View style={styles.tooltip} pointerEvents="none">
      <Text style={styles.tooltipDate}>
        {longDate(day.date)}
        {day.partial ? <Text style={styles.tooltipMuted}> · ยังไม่ครบวัน</Text> : null}
      </Text>
      <Text style={styles.tooltipKcal}>{`${formatNumber(kcal)} kcal`}</Text>
      {status && (
        <Text style={[styles.tooltipStatus, status.over && styles.tooltipStatusOver]}>{status.text}</Text>
      )}
      <View style={styles.tooltipMacros}>
        {SERIES.map((series) => (
          <View key={series.key} style={styles.tooltipMacro}>
            <View style={styles.tooltipMacroLabelRow}>
              <View style={[styles.tooltipDot, { backgroundColor: series.color }]} />
              <Text style={styles.tooltipMuted}>{series.label}</Text>
            </View>
            <Text style={styles.tooltipMacroValue}>
              {`${formatNumber(valueOf(day, series.key))} ก.`}
            </Text>
            {macroGoals?.[series.key] ? (
              <Text style={styles.tooltipMacroGoal}>{`/ ${formatNumber(macroGoals[series.key])}`}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function MacroGroupedChart({ data = [], selectedDate, onSelectDay, goalKcal = null, macroGoals = null }) {
  const [width, setWidth] = useState(0);
  // Fixed height per device class (mobile / tablet / desktop).
  const CHART_HEIGHT = useDeviceLayout().chartHeight('macro');
  const [hoveredDate, setHoveredDate] = useState(null);
  const maxValue = Math.max(0, ...data.flatMap((day) => SERIES.map((series) => valueOf(day, series.key))));
  const maxY = Math.max(50, Math.ceil(maxValue / 50) * 50);
  const ticks = [0, maxY / 2, maxY];
  const chartWidth = Math.max(width, MIN_CHART_WIDTH);
  const plotWidth = chartWidth - PAD.left - PAD.right;
  const plotHeight = CHART_HEIGHT - PAD.top - PAD.bottom;
  const baseY = PAD.top + plotHeight;
  const slot = plotWidth / Math.max(data.length, 1);
  const barWidth = Math.min((slot * 0.8) / SERIES.length, 12);
  const groupWidth = barWidth * SERIES.length + 2 * (SERIES.length - 1);
  const y = (value) => baseY - (Math.min(value, maxY) / maxY) * plotHeight;

  // Mouse: popup follows hover. Touch (no hover): popup shows for the tapped day.
  const activeDate = hoveredDate || (Platform.OS !== 'web' ? selectedDate : null);
  const activeIndex = data.findIndex((day) => day.date === activeDate);
  const activeDay = activeIndex >= 0 ? data[activeIndex] : null;
  const highlightDate = activeDate || selectedDate;

  // Popup sits beside the hovered group (right of it, or left near the edge).
  const slotCenter = PAD.left + slot * activeIndex + slot / 2;
  const tooltipLeft = slotCenter + slot / 2 + TOOLTIP_WIDTH + 4 <= chartWidth
    ? slotCenter + slot / 2 + 4
    : Math.max(0, slotCenter - slot / 2 - TOOLTIP_WIDTH - 4);

  const onLayout = (event) => {
    const next = Math.round(event?.nativeEvent?.layout?.width || 0);
    if (next > 0 && Math.abs(next - width) > 1) setWidth(Math.max(next, MIN_CHART_WIDTH));
  };

  // --- Smooth hover ---------------------------------------------------------
  const hoverOutTimer = useRef(null);
  useEffect(() => () => clearTimeout(hoverOutTimer.current), []);
  const hoverIn = (date) => {
    clearTimeout(hoverOutTimer.current);
    setHoveredDate(date);
  };
  const hoverOut = (date) => {
    clearTimeout(hoverOutTimer.current);
    hoverOutTimer.current = setTimeout(
      () => setHoveredDate((current) => (current === date ? null : current)),
      HOVER_OUT_DELAY_MS
    );
  };

  // Popup and highlight band glide between days and fade in/out. The last day
  // stays rendered while fading out so the content doesn't vanish mid-fade.
  const fade = useRef(new Animated.Value(0)).current;
  const tooltipX = useRef(new Animated.Value(0)).current;
  const bandX = useRef(new Animated.Value(0)).current;
  const [shownDay, setShownDay] = useState(null);
  const visible = useRef(false);
  const bandLeft = PAD.left + slot * activeIndex + 2;

  useEffect(() => {
    if (activeDay) {
      setShownDay(activeDay);
      if (!visible.current) {
        // Appearing: jump into place, then fade in.
        tooltipX.setValue(tooltipLeft);
        bandX.setValue(bandLeft);
        visible.current = true;
      } else {
        Animated.spring(tooltipX, { toValue: tooltipLeft, ...SLIDE }).start();
        Animated.spring(bandX, { toValue: bandLeft, ...SLIDE }).start();
      }
      Animated.timing(fade, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
    } else if (visible.current) {
      visible.current = false;
      Animated.timing(fade, { toValue: 0, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: false }).start(
        ({ finished }) => {
          if (finished && !visible.current) setShownDay(null);
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDay?.date, tooltipLeft, bandLeft]);

  return (
    <View>
      <View style={styles.legend}>
        {SERIES.map((series) => (
          <View key={series.key} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: series.color }]} />
            <Text style={styles.legendText}>{series.label}</Text>
          </View>
        ))}
        <Text style={styles.legendText}>กรัม</Text>
      </View>

      <View onLayout={onLayout} style={[styles.canvas, { minHeight: CHART_HEIGHT }]}>
        {width > 0 && (
          <>
            {/* Highlight band behind the bars (the SVG has no background). */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.band,
                { top: PAD.top, height: plotHeight, width: Math.max(slot - 4, 0), left: bandX, opacity: fade },
              ]}
            />
            <View style={styles.svgLayer} pointerEvents="none">
            <Svg width={chartWidth} height={CHART_HEIGHT}>

              {ticks.map((tick) => (
                <React.Fragment key={`tick-${tick}`}>
                  <Line
                    x1={PAD.left}
                    x2={chartWidth - PAD.right}
                    y1={y(tick)}
                    y2={y(tick)}
                    stroke={colors.border}
                    strokeWidth={1}
                  />
                  <SvgText
                    x={PAD.left - 6}
                    y={y(tick) + 4}
                    fontSize={10}
                    fill={colors.inkMuted}
                    textAnchor="end"
                  >
                    {formatNumber(tick)}
                  </SvgText>
                </React.Fragment>
              ))}

              {data.map((day, index) => {
                const groupX = PAD.left + slot * index + slot / 2 - groupWidth / 2;
                const highlighted = day.date === highlightDate;
                return (
                  <React.Fragment key={day.date}>
                    {SERIES.map((series, seriesIndex) => {
                      const value = valueOf(day, series.key);
                      return (
                        <Rect
                          key={series.key}
                          x={groupX + seriesIndex * (barWidth + 2)}
                          y={y(value)}
                          width={barWidth}
                          height={Math.max(baseY - y(value), value > 0 ? 2 : 0)}
                          rx={2}
                          fill={series.color}
                          opacity={highlightDate && !highlighted ? 0.45 : 1}
                        />
                      );
                    })}
                    <SvgText
                      x={PAD.left + slot * index + slot / 2}
                      y={CHART_HEIGHT - 6}
                      fontSize={11}
                      fontWeight={highlighted ? '700' : '400'}
                      fill={highlighted ? colors.ink : colors.inkMuted}
                      textAnchor="middle"
                    >
                      {dayNumber(day.date)}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
            </View>

            <View style={[styles.hitTargets, { width: plotWidth, height: CHART_HEIGHT }]}>
              {data.map((day) => (
                <Pressable
                  key={day.date}
                  style={styles.hitTarget}
                  onPress={() => onSelectDay?.(day.date)}
                  onHoverIn={() => hoverIn(day.date)}
                  onHoverOut={() => hoverOut(day.date)}
                  onFocus={() => hoverIn(day.date)}
                  onBlur={() => hoverOut(day.date)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: day.date === selectedDate }}
                  accessibilityLabel={`${longDate(day.date)} ${formatNumber(day.kcal)} กิโลแคลอรี่ โปรตีน ${formatNumber(valueOf(day, 'protein'))} คาร์บ ${formatNumber(valueOf(day, 'carbs'))} ไขมัน ${formatNumber(valueOf(day, 'fat'))} กรัม`}
                />
              ))}
            </View>

            {shownDay && (
              <Animated.View
                style={[
                  styles.tooltipWrap,
                  {
                    left: tooltipX,
                    width: TOOLTIP_WIDTH,
                    opacity: fade,
                    transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }],
                  },
                ]}
                pointerEvents="none"
              >
                <DayTooltip day={activeDay || shownDay} goalKcal={goalKcal} macroGoals={macroGoals} />
              </Animated.View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

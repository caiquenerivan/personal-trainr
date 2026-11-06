import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, {
  scrollTo,
  useAnimatedStyle,
  useFrameCallback,
  useScrollOffset,
  useSharedValue,
  withTiming,
  type AnimatedRef,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { GripVertical } from 'lucide-react-native';
import { colors, radius } from '../theme';

// Distância (px) da borda da tela em que o arraste rola a página sozinho.
const EDGE = 96;
const AUTO_SCROLL_STEP = 8;

type Props<T> = {
  items: T[];
  keyOf: (item: T) => string;
  renderItem: (item: T, index: number, handle: ReactNode) => ReactNode;
  onReorder: (from: number, to: number) => void;
  gap?: number;
  // ScrollView da tela: permite rolar ao arrastar perto da borda.
  scrollRef?: AnimatedRef<Animated.ScrollView>;
};

function slotTop(heights: number[], gap: number, index: number) {
  'worklet';
  let top = 0;
  for (let i = 0; i < index; i++) top += heights[i] + gap;
  return top;
}

// Índice final do item arrastado: quantos outros itens têm o centro acima do
// centro dele.
function targetIndex(heights: number[], gap: number, from: number, dy: number) {
  'worklet';
  const center = slotTop(heights, gap, from) + dy + heights[from] / 2;
  let to = 0;
  let top = 0;
  for (let i = 0; i < heights.length; i++) {
    if (i !== from && center > top + heights[i] / 2) to++;
    top += heights[i] + gap;
  }
  return to;
}

// Lista reordenável por arraste: segurar a alça (⋮⋮) e arrastar.
export function SortableList<T>({ items, keyOf, renderItem, onReorder, gap = 12, scrollRef }: Props<T>) {
  const { height: screenHeight } = useWindowDimensions();
  const scrollOffset = useScrollOffset(scrollRef);
  const active = useSharedValue(-1);
  const dragY = useSharedValue(0);
  const startScroll = useSharedValue(0);
  const edge = useSharedValue(0);
  const heights = useSharedValue<number[]>([]);
  const measured = useRef<number[]>([]);
  const pendingReset = useRef(false);

  const order = items.map(keyOf).join('|');
  useLayoutEffect(() => {
    if (!pendingReset.current) return;
    pendingReset.current = false;
    active.set(-1);
    dragY.set(0);
  }, [order, active, dragY]);

  useFrameCallback(() => {
    if (active.get() < 0 || edge.get() === 0 || !scrollRef) return;
    scrollTo(scrollRef, 0, Math.max(0, scrollOffset.get() + edge.get() * AUTO_SCROLL_STEP), false);
  });

  function commit(from: number, to: number) {
    pendingReset.current = true;
    onReorder(from, to);
  }

  function setHeight(index: number, height: number) {
    measured.current[index] = height;
    measured.current.length = items.length;
    heights.set([...measured.current]);
  }

  return (
    <View style={{ gap }}>
      {items.map((item, index) => (
        <SortableRow
          key={keyOf(item)}
          index={index}
          gap={gap}
          screenHeight={screenHeight}
          active={active}
          dragY={dragY}
          startScroll={startScroll}
          scrollOffset={scrollOffset}
          edge={edge}
          heights={heights}
          onLayout={setHeight}
          onCommit={commit}
          renderItem={(handle) => renderItem(item, index, handle)}
        />
      ))}
    </View>
  );
}

type RowProps = {
  index: number;
  gap: number;
  screenHeight: number;
  active: SharedValue<number>;
  dragY: SharedValue<number>;
  startScroll: SharedValue<number>;
  scrollOffset: SharedValue<number>;
  edge: SharedValue<number>;
  heights: SharedValue<number[]>;
  onLayout: (index: number, height: number) => void;
  onCommit: (from: number, to: number) => void;
  renderItem: (handle: ReactNode) => ReactNode;
};

function SortableRow({
  index,
  gap,
  screenHeight,
  active,
  dragY,
  startScroll,
  scrollOffset,
  edge,
  heights,
  onLayout,
  onCommit,
  renderItem,
}: RowProps) {
  const pan = Gesture.Pan()
    .activateAfterLongPress(150)
    .onStart(() => {
      active.set(index);
      dragY.set(0);
      startScroll.set(scrollOffset.get());
      scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Medium);
    })
    .onUpdate((e) => {
      dragY.set(e.translationY);
      edge.set(e.absoluteY < EDGE ? -1 : e.absoluteY > screenHeight - EDGE ? 1 : 0);
    })
    .onFinalize(() => {
      if (active.get() !== index) return;
      edge.set(0);
      const dy = dragY.get() + scrollOffset.get() - startScroll.get();
      const to = targetIndex(heights.get(), gap, index, dy);
      if (to === index) {
        dragY.set(withTiming(startScroll.get() - scrollOffset.get(), { duration: 150 }, () => {
          active.set(-1);
          dragY.set(0);
        }));
        return;
      }
      // assenta o cartão na vaga nova antes de reordenar de fato
      const slotDelta = slotTop(heights.get(), gap, to) - slotTop(heights.get(), gap, index)
        + (to > index ? heights.get()[to] - heights.get()[index] : 0);
      dragY.set(withTiming(slotDelta - (scrollOffset.get() - startScroll.get()), { duration: 150 }, () => {
        scheduleOnRN(onCommit, index, to);
      }));
    });

  const style = useAnimatedStyle(() => {
    const from = active.get();
    if (from < 0) return { transform: [{ translateY: 0 }], zIndex: 0 };
    if (from === index) {
      return {
        transform: [{ translateY: dragY.get() + scrollOffset.get() - startScroll.get() }, { scale: 1.02 }],
        zIndex: 10,
        shadowOpacity: 0.5,
        elevation: 12,
      };
    }
    const to = targetIndex(heights.get(), gap, from, dragY.get() + scrollOffset.get() - startScroll.get());
    const size = (heights.get()[from] ?? 0) + gap;
    let shift = 0;
    if (from < to && index > from && index <= to) shift = -size;
    else if (from > to && index >= to && index < from) shift = size;
    return { transform: [{ translateY: withTiming(shift, { duration: 150 }) }], zIndex: 0 };
  });

  const handle = (
    <GestureDetector gesture={pan}>
      <View
        style={styles.handle}
        hitSlop={8}
        accessibilityRole="adjustable"
        accessibilityLabel="Segure e arraste para mudar a ordem"
      >
        <GripVertical size={20} color={colors.textSecondary} />
      </View>
    </GestureDetector>
  );

  return (
    <Animated.View
      style={[styles.row, style]}
      onLayout={(e) => onLayout(index, e.nativeEvent.layout.height)}
    >
      {renderItem(handle)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, shadowOpacity: 0, borderRadius: radius.xl },
  handle: { width: 28, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
});

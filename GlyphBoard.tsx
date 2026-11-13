import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Direction } from './engine';
import { COLORS, GLYPHS } from './theme';

type Hint = { row: number; col: number; dir: Direction } | null;

type Props = {
  board: number[];
  size: number;
  width: number;
  interactive?: boolean;
  direction?: Direction;
  onRotate?: (row: number, col: number) => void;
  hint?: Hint;
  compact?: boolean;
};

export function GlyphBoard({
  board,
  size,
  width,
  interactive = false,
  direction = 1,
  onRotate,
  hint = null,
  compact = false,
}: Props) {
  const gap = compact ? 3 : 6;
  const tileSize = (width - gap * (size - 1)) / size;
  const controlSize = compact ? 0 : Math.max(32, tileSize * 0.36);

  return (
    <View style={[styles.board, { width, height: width }]}> 
      {board.map((glyphIndex, index) => {
        const row = Math.floor(index / size);
        const col = index % size;
        const glyph = GLYPHS[glyphIndex]!;
        return (
          <View
            key={`${index}-${glyphIndex}`}
            accessibilityLabel={`${glyph.label} tile, row ${row + 1}, column ${col + 1}`}
            style={[
              styles.tile,
              {
                width: tileSize,
                height: tileSize,
                left: col * (tileSize + gap),
                top: row * (tileSize + gap),
                borderColor: `${glyph.color}AA`,
                backgroundColor: `${glyph.color}22`,
              },
            ]}
          >
            <Text style={[styles.symbol, { color: glyph.color, fontSize: tileSize * 0.48 }]}>{glyph.symbol}</Text>
          </View>
        );
      })}

      {interactive &&
        Array.from({ length: (size - 1) * (size - 1) }).map((_, index) => {
          const row = Math.floor(index / (size - 1));
          const col = index % (size - 1);
          const left = (col + 1) * tileSize + col * gap - controlSize / 2 + gap / 2;
          const top = (row + 1) * tileSize + row * gap - controlSize / 2 + gap / 2;
          const isHint = hint?.row === row && hint?.col === col;
          const arrow = isHint ? (hint?.dir === 1 ? '↻' : '↺') : direction === 1 ? '↻' : '↺';
          return (
            <Pressable
              key={`control-${row}-${col}`}
              accessibilityRole="button"
              accessibilityLabel={`Rotate tiles around row ${row + 1}, column ${col + 1} ${direction === 1 ? 'clockwise' : 'counterclockwise'}`}
              onPress={() => onRotate?.(row, col)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.control,
                {
                  width: controlSize,
                  height: controlSize,
                  borderRadius: controlSize / 2,
                  left,
                  top,
                },
                isHint && styles.hintControl,
                pressed && styles.controlPressed,
              ]}
            >
              <Text style={[styles.arrow, isHint && styles.hintArrow]}>{arrow}</Text>
            </Pressable>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { position: 'relative' },
  tile: {
    position: 'absolute',
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: { fontWeight: '800', includeFontPadding: false },
  control: {
    position: 'absolute',
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  hintControl: { backgroundColor: COLORS.warning, borderColor: '#FFF4C7', transform: [{ scale: 1.18 }] },
  controlPressed: { transform: [{ scale: 0.9 }] },
  arrow: { color: COLORS.accent, fontWeight: '900', fontSize: 21, lineHeight: 23 },
  hintArrow: { color: COLORS.bg },
});

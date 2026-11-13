import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { GlyphBoard } from './GlyphBoard';
import { PrimaryButton } from './PrimaryButton';
import {
  bestHint,
  boardsEqual,
  dailyLevel,
  Direction,
  generateLevel,
  Level,
  rotateBlock,
  Rotation,
  starsFor,
} from './engine';
import { COLORS } from './theme';

type Screen = 'home' | 'levels' | 'game' | 'how';
type Progress = Record<string, number>;
const TOTAL_LEVELS = 40;
const STORAGE_KEY = 'glyphgrid-progress-v1';

export default function App() {
  const { width } = useWindowDimensions();
  const [screen, setScreen] = useState<Screen>('home');
  const [level, setLevel] = useState<Level>(() => generateLevel(1));
  const [board, setBoard] = useState(level.start);
  const [direction, setDirection] = useState<Direction>(1);
  const [moves, setMoves] = useState(0);
  const [history, setHistory] = useState<number[][]>([]);
  const [hints, setHints] = useState(0);
  const [hint, setHint] = useState<Rotation | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [won, setWon] = useState(false);

  const boardWidth = Math.min(width - 34, 430);
  const completed = Object.keys(progress).filter((key) => key !== 'daily' && progress[key]! > 0).length;
  const totalStars = Object.values(progress).reduce((sum, stars) => sum + stars, 0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => value && setProgress(JSON.parse(value) as Progress))
      .catch(() => undefined);
  }, []);

  const startLevel = (nextLevel: Level) => {
    setLevel(nextLevel);
    setBoard(nextLevel.start);
    setMoves(0);
    setHistory([]);
    setHints(0);
    setHint(null);
    setWon(false);
    setScreen('game');
  };

  const persistProgress = async (key: string, stars: number) => {
    const next = { ...progress, [key]: Math.max(progress[key] ?? 0, stars) };
    setProgress(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const rotate = (row: number, col: number) => {
    if (won) return;
    const previous = board;
    const next = rotateBlock(previous, level.size, row, col, direction);
    setHistory((items) => [...items, previous]);
    setBoard(next);
    setMoves((value) => value + 1);
    setHint(null);
    Haptics.selectionAsync().catch(() => undefined);

    if (boardsEqual(next, level.goal)) {
      const finalMoves = moves + 1;
      const stars = starsFor(finalMoves, level, hints);
      setWon(true);
      persistProgress(level.id === 0 ? 'daily' : String(level.id), stars).catch(() => undefined);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }
  };

  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous || won) return;
    setBoard(previous);
    setHistory((items) => items.slice(0, -1));
    setMoves((value) => Math.max(0, value - 1));
    setHint(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  const showHint = () => {
    setHint(bestHint(board, level.goal, level.size));
    setHints((value) => value + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
  };

  const resetProgress = () => {
    Alert.alert('Reset progress?', 'This removes all saved stars and unlocked levels.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setProgress({});
          AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
        },
      },
    ]);
  };

  const nextLevel = () => {
    if (level.id === 0 || level.id >= TOTAL_LEVELS) {
      setScreen('levels');
      setWon(false);
    } else {
      startLevel(generateLevel(level.id + 1));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      {screen === 'home' && (
        <HomeScreen
          completed={completed}
          totalStars={totalStars}
          onPlay={() => setScreen('levels')}
          onDaily={() => startLevel(dailyLevel())}
          onHow={() => setScreen('how')}
        />
      )}
      {screen === 'levels' && (
        <LevelScreen
          progress={progress}
          completed={completed}
          onBack={() => setScreen('home')}
          onStart={(id) => startLevel(generateLevel(id))}
          onReset={resetProgress}
        />
      )}
      {screen === 'how' && <HowScreen onBack={() => setScreen('home')} width={boardWidth} />}
      {screen === 'game' && (
        <GameScreen
          level={level}
          board={board}
          direction={direction}
          moves={moves}
          hints={hints}
          historyLength={history.length}
          hint={hint}
          width={boardWidth}
          onBack={() => setScreen(level.id === 0 ? 'home' : 'levels')}
          onRotate={rotate}
          onDirection={() => setDirection((value) => (value === 1 ? -1 : 1))}
          onUndo={undo}
          onHint={showHint}
          onRestart={() => startLevel(level)}
        />
      )}
      <WinModal
        visible={won}
        level={level}
        moves={moves}
        hints={hints}
        onNext={nextLevel}
        onReplay={() => startLevel(level)}
      />
    </SafeAreaView>
  );
}

function HomeScreen({
  completed,
  totalStars,
  onPlay,
  onDaily,
  onHow,
}: {
  completed: number;
  totalStars: number;
  onPlay: () => void;
  onDaily: () => void;
  onHow: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.home}>
      <View style={styles.logoMark}>
        <Text style={styles.logoSymbol}>✦</Text>
      </View>
      <Text style={styles.title}>GlyphGrid</Text>
      <Text style={styles.subtitle}>Twist the tiles. Rebuild the pattern. Train your spatial thinking.</Text>
      <View style={styles.statRow}>
        <Stat value={`${completed}/${TOTAL_LEVELS}`} label="Levels" />
        <Stat value={`${totalStars}`} label="Stars" />
        <Stat value="10+" label="Ages" />
      </View>
      <PrimaryButton label="Play levels" onPress={onPlay} style={styles.fullButton} />
      <PrimaryButton label="Today’s puzzle" onPress={onDaily} secondary style={styles.fullButton} />
      <Pressable onPress={onHow} style={styles.textButton}>
        <Text style={styles.textButtonLabel}>How to play</Text>
      </Pressable>
      <Text style={styles.footer}>No ads • No account • Offline-friendly</Text>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LevelScreen({
  progress,
  completed,
  onBack,
  onStart,
  onReset,
}: {
  progress: Progress;
  completed: number;
  onBack: () => void;
  onStart: (id: number) => void;
  onReset: () => void;
}) {
  const unlocked = Math.min(TOTAL_LEVELS, Math.max(1, completed + 1));
  return (
    <View style={styles.flex}>
      <Header title="Choose a level" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.levelGrid}>
        {Array.from({ length: TOTAL_LEVELS }, (_, index) => index + 1).map((id) => {
          const stars = progress[String(id)] ?? 0;
          const locked = id > unlocked;
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityLabel={locked ? `Level ${id}, locked` : `Level ${id}, ${stars} stars`}
              disabled={locked}
              onPress={() => onStart(id)}
              style={({ pressed }) => [
                styles.levelCard,
                locked && styles.levelLocked,
                pressed && !locked && styles.levelPressed,
              ]}
            >
              <Text style={styles.levelNumber}>{locked ? '⌁' : id}</Text>
              <Text style={[styles.levelStars, stars === 0 && styles.emptyStars]}>
                {stars > 0 ? '★'.repeat(stars) : locked ? 'LOCKED' : 'PLAY'}
              </Text>
            </Pressable>
          );
        })}
        <Pressable onPress={onReset} style={styles.resetButton}>
          <Text style={styles.resetLabel}>Reset saved progress</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.iconButton}>
        <Text style={styles.iconButtonText}>‹</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function GameScreen({
  level,
  board,
  direction,
  moves,
  hints,
  historyLength,
  hint,
  width,
  onBack,
  onRotate,
  onDirection,
  onUndo,
  onHint,
  onRestart,
}: {
  level: Level;
  board: number[];
  direction: Direction;
  moves: number;
  hints: number;
  historyLength: number;
  hint: Rotation | null;
  width: number;
  onBack: () => void;
  onRotate: (row: number, col: number) => void;
  onDirection: () => void;
  onUndo: () => void;
  onHint: () => void;
  onRestart: () => void;
}) {
  const goalWidth = Math.min(142, width * 0.38);
  const remaining = Math.max(0, level.moveBudget - moves);
  return (
    <View style={styles.flex}>
      <Header title={level.id === 0 ? level.title : `Level ${level.id} · ${level.title}`} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.gameContent}>
        <View style={styles.gameMeta}>
          <View>
            <Text style={styles.eyebrow}>TARGET GLYPH</Text>
            <GlyphBoard board={level.goal} size={level.size} width={goalWidth} compact />
          </View>
          <View style={styles.movePanel}>
            <Text style={styles.moveNumber}>{moves}</Text>
            <Text style={styles.moveLabel}>MOVES</Text>
            <View style={styles.divider} />
            <Text style={[styles.remaining, remaining === 0 && styles.remainingLow]}>{remaining}</Text>
            <Text style={styles.moveLabel}>BONUS LEFT</Text>
          </View>
        </View>

        <Text style={styles.instruction}>Tap an arrow to rotate its four surrounding tiles.</Text>
        <GlyphBoard
          board={board}
          size={level.size}
          width={width}
          interactive
          direction={direction}
          onRotate={onRotate}
          hint={hint}
        />

        <View style={styles.gameControls}>
          <MiniButton label={direction === 1 ? '↻ Clockwise' : '↺ Counter'} onPress={onDirection} />
          <MiniButton label="Undo" onPress={onUndo} disabled={historyLength === 0} />
          <MiniButton label={hint ? 'Hint shown' : 'Hint'} onPress={onHint} />
        </View>
        <Pressable onPress={onRestart} style={styles.restartButton}>
          <Text style={styles.restartLabel}>Restart puzzle</Text>
        </Pressable>
        {hints > 0 && <Text style={styles.hintCost}>{hints} hint{hints === 1 ? '' : 's'} used • each hint affects the star rating</Text>}
      </ScrollView>
    </View>
  );
}

function MiniButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.miniButton, disabled && styles.miniDisabled, pressed && !disabled && styles.miniPressed]}
    >
      <Text style={styles.miniLabel}>{label}</Text>
    </Pressable>
  );
}

function HowScreen({ onBack, width }: { onBack: () => void; width: number }) {
  const demo = useMemo(() => generateLevel(1), []);
  return (
    <View style={styles.flex}>
      <Header title="How to play" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.howContent}>
        <Text style={styles.howHeadline}>One move rotates four tiles.</Text>
        <Text style={styles.howBody}>
          Match the large board to the small target pattern. Choose clockwise or counterclockwise, then tap an arrow where four tiles meet.
        </Text>
        <View style={styles.demoWrap}>
          <GlyphBoard board={demo.start} size={demo.size} width={Math.min(width, 320)} compact />
        </View>
        <View style={styles.ruleCard}>
          <Text style={styles.ruleNumber}>1</Text>
          <View style={styles.ruleCopy}>
            <Text style={styles.ruleTitle}>Study the target</Text>
            <Text style={styles.ruleText}>Notice each color and symbol’s exact position.</Text>
          </View>
        </View>
        <View style={styles.ruleCard}>
          <Text style={styles.ruleNumber}>2</Text>
          <View style={styles.ruleCopy}>
            <Text style={styles.ruleTitle}>Plan overlapping turns</Text>
            <Text style={styles.ruleText}>A tile can belong to several different 2×2 clusters.</Text>
          </View>
        </View>
        <View style={styles.ruleCard}>
          <Text style={styles.ruleNumber}>3</Text>
          <View style={styles.ruleCopy}>
            <Text style={styles.ruleTitle}>Earn three stars</Text>
            <Text style={styles.ruleText}>Solve near par and use as few hints as possible.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function WinModal({
  visible,
  level,
  moves,
  hints,
  onNext,
  onReplay,
}: {
  visible: boolean;
  level: Level;
  moves: number;
  hints: number;
  onNext: () => void;
  onReplay: () => void;
}) {
  const stars = starsFor(moves, level, hints);
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalEyebrow}>GLYPH COMPLETE</Text>
          <Text style={styles.modalTitle}>Brilliant turn!</Text>
          <Text style={styles.bigStars}>{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</Text>
          <Text style={styles.modalBody}>Solved in {moves} moves{hints > 0 ? ` with ${hints} hint${hints === 1 ? '' : 's'}` : ''}.</Text>
          <PrimaryButton label={level.id === 0 || level.id >= TOTAL_LEVELS ? 'Back to levels' : 'Next level'} onPress={onNext} style={styles.fullButton} />
          <PrimaryButton label="Play again" onPress={onReplay} secondary style={styles.fullButton} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  home: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 42, alignItems: 'center', justifyContent: 'center' },
  logoMark: { width: 84, height: 84, borderRadius: 26, backgroundColor: COLORS.panel2, borderWidth: 1, borderColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] },
  logoSymbol: { color: COLORS.accent, fontSize: 48, fontWeight: '900', transform: [{ rotate: '-8deg' }] },
  title: { color: COLORS.text, fontSize: 43, fontWeight: '900', letterSpacing: -1.3, marginTop: 22 },
  subtitle: { color: COLORS.muted, fontSize: 17, lineHeight: 25, textAlign: 'center', maxWidth: 390, marginTop: 10 },
  statRow: { flexDirection: 'row', gap: 9, marginVertical: 28, width: '100%', maxWidth: 420 },
  statCard: { flex: 1, backgroundColor: COLORS.panel, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', paddingVertical: 14 },
  statValue: { color: COLORS.text, fontSize: 19, fontWeight: '900' },
  statLabel: { color: COLORS.muted, fontSize: 11, marginTop: 3, fontWeight: '700', textTransform: 'uppercase' },
  fullButton: { width: '100%', maxWidth: 420, marginTop: 10 },
  textButton: { padding: 15 },
  textButtonLabel: { color: COLORS.accent, fontWeight: '800', fontSize: 15 },
  footer: { color: COLORS.muted, fontSize: 12, marginTop: 20 },
  header: { height: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  iconButtonText: { color: COLORS.text, fontSize: 40, lineHeight: 42, fontWeight: '300' },
  headerTitle: { flex: 1, color: COLORS.text, textAlign: 'center', fontSize: 18, fontWeight: '900' },
  headerSpacer: { width: 44 },
  levelGrid: { padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingBottom: 40 },
  levelCard: { width: 78, height: 84, borderRadius: 18, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  levelLocked: { opacity: 0.35 },
  levelPressed: { transform: [{ scale: 0.95 }], borderColor: COLORS.accent },
  levelNumber: { color: COLORS.text, fontSize: 23, fontWeight: '900' },
  levelStars: { color: COLORS.warning, fontSize: 11, marginTop: 7, fontWeight: '900', letterSpacing: 1 },
  emptyStars: { color: COLORS.accent, fontSize: 10 },
  resetButton: { width: '100%', alignItems: 'center', padding: 20, marginTop: 8 },
  resetLabel: { color: COLORS.danger, fontWeight: '700' },
  gameContent: { padding: 17, alignItems: 'center', paddingBottom: 45 },
  gameMeta: { width: '100%', maxWidth: 430, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 },
  eyebrow: { color: COLORS.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginBottom: 8 },
  movePanel: { minWidth: 112, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 13, alignItems: 'center' },
  moveNumber: { color: COLORS.text, fontSize: 32, fontWeight: '900', lineHeight: 34 },
  moveLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: COLORS.border, alignSelf: 'stretch', marginVertical: 9 },
  remaining: { color: COLORS.success, fontSize: 21, fontWeight: '900' },
  remainingLow: { color: COLORS.danger },
  instruction: { color: COLORS.muted, fontSize: 13, marginBottom: 14, textAlign: 'center' },
  gameControls: { flexDirection: 'row', gap: 8, width: '100%', maxWidth: 430, marginTop: 22 },
  miniButton: { flex: 1, minHeight: 46, paddingHorizontal: 8, backgroundColor: COLORS.panel2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  miniDisabled: { opacity: 0.35 },
  miniPressed: { transform: [{ scale: 0.96 }], borderColor: COLORS.accent },
  miniLabel: { color: COLORS.text, fontWeight: '800', fontSize: 12, textAlign: 'center' },
  restartButton: { padding: 15, marginTop: 5 },
  restartLabel: { color: COLORS.muted, fontWeight: '700', fontSize: 13 },
  hintCost: { color: COLORS.warning, fontSize: 11, textAlign: 'center' },
  howContent: { padding: 22, paddingBottom: 50, alignItems: 'center' },
  howHeadline: { color: COLORS.text, fontSize: 29, fontWeight: '900', textAlign: 'center' },
  howBody: { color: COLORS.muted, fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 500, marginTop: 10 },
  demoWrap: { marginVertical: 28, padding: 12, backgroundColor: COLORS.panel, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  ruleCard: { width: '100%', maxWidth: 500, flexDirection: 'row', padding: 17, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, marginBottom: 11 },
  ruleNumber: { width: 37, height: 37, borderRadius: 12, textAlign: 'center', textAlignVertical: 'center', lineHeight: 37, color: COLORS.bg, backgroundColor: COLORS.accent, fontWeight: '900', fontSize: 17 },
  ruleCopy: { flex: 1, marginLeft: 14 },
  ruleTitle: { color: COLORS.text, fontWeight: '900', fontSize: 16 },
  ruleText: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  modalBackdrop: { flex: 1, backgroundColor: '#050817DD', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 410, backgroundColor: COLORS.panel, borderRadius: 26, borderWidth: 1, borderColor: COLORS.accent, padding: 24, alignItems: 'center' },
  modalEyebrow: { color: COLORS.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  modalTitle: { color: COLORS.text, fontSize: 31, fontWeight: '900', marginTop: 8 },
  bigStars: { color: COLORS.warning, fontSize: 44, letterSpacing: 5, marginVertical: 13 },
  modalBody: { color: COLORS.muted, fontSize: 15, marginBottom: 7 },
});

import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoutine } from '@/contexts/RoutineContext';
import { useTheme } from '@/hooks/useTheme';

type SupportAction =
  | 'Breathe for 60s'
  | 'Delay 10 minutes'
  | 'Leave the room'
  | 'Message someone'
  | 'Drink water';

const TRIGGER_OPTIONS = ['stress', 'boredom', 'lonely', 'tired', 'social', 'other'] as const;
const SUPPORT_ACTIONS: SupportAction[] = [
  'Breathe for 60s',
  'Delay 10 minutes',
  'Leave the room',
  'Message someone',
  'Drink water',
];

type Step = 'pause' | 'log' | 'support' | 'saved';

interface UrgeSupportModalProps {
  visible: boolean;
  streakId: string;
  onClose: () => void;
  onRelapseRequested: () => Promise<void> | void;
}

export default function UrgeSupportModal({
  visible,
  streakId,
  onClose,
  onRelapseRequested,
}: UrgeSupportModalProps) {
  const { colors } = useTheme();
  const { logUrge, updateUrgeOutcome } = useRoutine();
  const [step, setStep] = useState<Step>('pause');
  const [intensity, setIntensity] = useState(5);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [supportAction, setSupportAction] = useState<SupportAction | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedUrgeId, setSavedUrgeId] = useState<string | null>(null);

  const intensityOptions = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 1), []);

  const resetState = () => {
    setStep('pause');
    setIntensity(5);
    setSelectedTriggers([]);
    setNote('');
    setSupportAction(null);
    setSaving(false);
    setSavedUrgeId(null);
  };

  const closeAndReset = () => {
    onClose();
    resetState();
  };

  const toggleTrigger = (value: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleSave = async () => {
    if (!supportAction || saving) return;
    setSaving(true);
    try {
      const inserted = await logUrge(streakId, {
        intensity,
        triggerTags: selectedTriggers,
        supportAction,
        note: note.trim() || null,
      });
      if (inserted?.id) {
        setSavedUrgeId(inserted.id);
        setStep('saved');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleOutcome = async (outcome: 'rode_out' | 'relapsed') => {
    if (savedUrgeId) {
      await updateUrgeOutcome(savedUrgeId, outcome);
    }
    if (outcome === 'relapsed') {
      await onRelapseRequested();
    }
    closeAndReset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={closeAndReset}>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
        <Pressable style={styles.backdrop} onPress={closeAndReset} />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {step === 'pause' && (
              <View style={styles.stepContainer}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Pause with yourself</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Take 60 seconds. You do not have to act on this urge.
                </Text>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.warning }]}
                  onPress={() => setStep('log')}
                >
                  <Text style={styles.primaryButtonText}>Start quick reset</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 'log' && (
              <View style={styles.stepContainer}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>How strong is it?</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Rate this urge from 1 to 10.
                </Text>
                <View style={styles.intensityGrid}>
                  {intensityOptions.map((value) => {
                    const selected = intensity === value;
                    return (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.intensityChip,
                          {
                            borderColor: selected ? colors.warning : colors.border,
                            backgroundColor: selected ? `${colors.warning}20` : colors.background,
                          },
                        ]}
                        onPress={() => setIntensity(value)}
                      >
                        <Text style={[styles.chipText, { color: colors.textPrimary }]}>{value}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>What triggered it?</Text>
                <View style={styles.triggerWrap}>
                  {TRIGGER_OPTIONS.map((trigger) => {
                    const selected = selectedTriggers.includes(trigger);
                    return (
                      <TouchableOpacity
                        key={trigger}
                        style={[
                          styles.triggerChip,
                          {
                            borderColor: selected ? colors.warning : colors.border,
                            backgroundColor: selected ? `${colors.warning}20` : colors.background,
                          },
                        ]}
                        onPress={() => toggleTrigger(trigger)}
                      >
                        <Text style={[styles.chipText, { color: colors.textPrimary }]}>{trigger}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TextInput
                  style={[
                    styles.noteInput,
                    {
                      color: colors.textPrimary,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  multiline
                  value={note}
                  onChangeText={setNote}
                  placeholder="Optional note"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.warning }]}
                  onPress={() => setStep('support')}
                >
                  <Text style={styles.primaryButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 'support' && (
              <View style={styles.stepContainer}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Pick one next step</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Small action now, decision later.
                </Text>
                <View style={styles.actionList}>
                  {SUPPORT_ACTIONS.map((action) => {
                    const selected = supportAction === action;
                    return (
                      <TouchableOpacity
                        key={action}
                        style={[
                          styles.actionButton,
                          {
                            borderColor: selected ? colors.warning : colors.border,
                            backgroundColor: selected ? `${colors.warning}20` : colors.background,
                          },
                        ]}
                        onPress={() => setSupportAction(action)}
                      >
                        <Text style={[styles.actionText, { color: colors.textPrimary }]}>{action}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: supportAction ? colors.warning : colors.border,
                    },
                  ]}
                  disabled={!supportAction || saving}
                  onPress={handleSave}
                >
                  <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Log urge'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 'saved' && (
              <View style={styles.stepContainer}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Urge logged</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Your streak is still active. What happened after your reset?
                </Text>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.success }]}
                  onPress={() => handleOutcome('rode_out')}
                >
                  <Text style={styles.primaryButtonText}>I made it through</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.error }]}
                  onPress={() => handleOutcome('relapsed')}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.error }]}>I relapsed</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    maxHeight: '88%',
  },
  scrollContent: {
    paddingBottom: 8,
  },
  stepContainer: {
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Vercetti-Regular',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Vercetti-Regular',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
    fontFamily: 'Vercetti-Regular',
  },
  intensityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intensityChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
  noteInput: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
  actionList: {
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  actionText: {
    fontSize: 15,
    fontFamily: 'Vercetti-Regular',
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
});

/**
 * BuckeyeGrub Cross-Platform Safe Haptics Utility
 * Provides responsive sensory feedback for mobile (iOS & Android) with graceful no-op on Web.
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export async function hapticSuccess(enabled = true): Promise<void> {
  if (!enabled || Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Ignore unsupported hardware or environment
  }
}

export async function hapticWarning(enabled = true): Promise<void> {
  if (!enabled || Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Ignore
  }
}

export async function hapticLight(enabled = true): Promise<void> {
  if (!enabled || Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Ignore
  }
}

export async function hapticMedium(enabled = true): Promise<void> {
  if (!enabled || Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Ignore
  }
}

export async function hapticHeavy(enabled = true): Promise<void> {
  if (!enabled || Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    // Ignore
  }
}

export async function hapticSelection(enabled = true): Promise<void> {
  if (!enabled || Platform.OS === 'web') return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Ignore
  }
}

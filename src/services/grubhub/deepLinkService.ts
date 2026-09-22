/**
 * BuckeyeGrub Grubhub Deep-Link Service
 * Builds Grubhub ordering URLs and launches the native Grubhub app with a
 * graceful web-browser fallback. Follows the AGENTS.md linking protocol:
 * every launch is wrapped in try/catch and never throws or crashes the app.
 */

import { DiningVenue } from '../../types/dining';

const GRUBHUB_WEB_BASE = 'https://www.grubhub.com/restaurant';
const GRUBHUB_APP_BASE = 'grubhub://restaurant';

/**
 * Shared resolver for Grubhub web and app targets.
 * Supports passing either a DiningVenue domain model or a standalone slug string.
 */
function resolveGrubhubTarget(
  target: DiningVenue | string,
  base: string,
  curatedOverride?: (venue: DiningVenue) => string | undefined
): string | null {
  if (typeof target === 'string') {
    const trimmed = target.trim();
    return trimmed.length > 0 ? `${base}/${trimmed}` : null;
  }
  const override = curatedOverride ? curatedOverride(target) : undefined;
  if (override && override.trim().length > 0) {
    return override;
  }
  if (target.grubhubSlug && target.grubhubSlug.trim().length > 0) {
    return `${base}/${target.grubhubSlug}`;
  }
  return null;
}

/**
 * Builds the Grubhub web ordering URL for a venue or slug string.
 * Prefers the curated `grubhubUrl`, else derives from `grubhubSlug` or the slug string.
 * Returns null when the venue or slug is empty/unmapped.
 */
export function buildGrubhubWebUrl(venueOrSlug: DiningVenue | string): string | null {
  return resolveGrubhubTarget(
    venueOrSlug,
    GRUBHUB_WEB_BASE,
    (venue) => venue.grubhubUrl
  );
}

/**
 * Builds the Grubhub native app URI (deep link) for a venue or slug string.
 * Prefers the curated `grubhubUri`, else derives from `grubhubSlug` or the slug string.
 * Returns null when the venue or slug is empty/unmapped.
 */
export function buildGrubhubAppUri(venueOrSlug: DiningVenue | string): string | null {
  return resolveGrubhubTarget(
    venueOrSlug,
    GRUBHUB_APP_BASE,
    (venue) => venue.grubhubUri
  );
}

/**
 * Result of an order-launch attempt. Never a thrown error — failures are
 * reported via `opened: false` with an optional `error` message so callers
 * can surface a friendly notice.
 */
export interface OpenOrderResult {
  opened: boolean;
  usedFallback: boolean;
  target: string | null;
  error?: string;
}

/**
 * Launches a Grubhub order for the given venue.
 * Strategy: attempt the native app scheme via Linking.canOpenURL; if the app
 * is unavailable (or the check throws), fall back to opening the web URL in
 * the browser. All failures are caught — this function never throws.
 */
export async function openVenueOrder(venue: DiningVenue): Promise<OpenOrderResult> {
  const appUri = buildGrubhubAppUri(venue);
  const webUrl = buildGrubhubWebUrl(venue);

  if (!appUri && !webUrl) {
    return {
      opened: false,
      usedFallback: false,
      target: null,
      error: `${venue.name} does not have a Grubhub ordering link.`,
    };
  }

  try {
    // Lazy-load expo-linking so the pure URL builders above can be imported in
    // non-native contexts (e.g. verification scripts) without pulling in
    // react-native at module-evaluation time.
    const Linking = await import('expo-linking');

    // 1. Attempt native Grubhub app deep link.
    if (appUri) {
      try {
        const canOpenApp = await Linking.canOpenURL(appUri);
        if (canOpenApp) {
          await Linking.openURL(appUri);
          return { opened: true, usedFallback: false, target: appUri };
        }
      } catch {
        // Ignore and fall through to the web fallback.
      }
    }

    // 2. Fall back to the Grubhub web URL.
    if (webUrl) {
      try {
        await Linking.openURL(webUrl);
        return { opened: true, usedFallback: true, target: webUrl };
      } catch (error) {
        return {
          opened: false,
          usedFallback: true,
          target: webUrl,
          error: error instanceof Error ? error.message : 'Failed to open Grubhub link.',
        };
      }
    }

    // 3. Only an app URI existed but the app is not installed.
    return {
      opened: false,
      usedFallback: false,
      target: appUri,
      error: `Grubhub app is not available and no web link exists for ${venue.name}.`,
    };
  } catch (error) {
    return {
      opened: false,
      usedFallback: false,
      target: null,
      error: error instanceof Error ? error.message : 'Failed to initialize linking service.',
    };
  }
}

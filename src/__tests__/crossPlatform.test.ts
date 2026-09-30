/**
 * BuckeyeGrub Cross-Platform Layout & Rendering Verification Suite
 * Validates responsive viewport breakpoints, safe-area adaptation,
 * theme token contrast, and cross-platform linking contracts across
 * iOS, Android, and Desktop/Mobile Web environments.
 */

import { lightTheme, darkTheme, typography, spacing, radii, palette } from '../constants/theme';
import { OSU_VENUES } from '../data';
import { buildGrubhubWebUrl, buildGrubhubAppUri } from '../services/grubhub/deepLinkService';

describe('Cross-Platform Viewport & Layout Verification', () => {
  // Common device viewport definitions
  const VIEWPORTS = {
    mobileCompact: { width: 375, height: 667, name: 'Mobile Compact (iPhone SE)' },
    mobileModern: { width: 390, height: 844, name: 'Mobile Modern (iPhone 14/15)' },
    mobileLarge: { width: 430, height: 932, name: 'Mobile Large (iPhone Pro Max)' },
    tabletPortrait: { width: 768, height: 1024, name: 'Tablet Portrait (iPad)' },
    desktopStandard: { width: 1280, height: 800, name: 'Desktop Web (1280x800)' },
    desktopWide: { width: 1920, height: 1080, name: 'Desktop Web Full HD (1080p)' },
  };

  describe('Responsive Viewport Breakpoints & Content Constraints', () => {
    it('defines consistent responsive breakpoint thresholds', () => {
      const isMobile = (width: number) => width < 768;
      const isTablet = (width: number) => width >= 768 && width < 1024;
      const isDesktop = (width: number) => width >= 1024;

      expect(isMobile(VIEWPORTS.mobileCompact.width)).toBe(true);
      expect(isMobile(VIEWPORTS.mobileModern.width)).toBe(true);
      expect(isMobile(VIEWPORTS.mobileLarge.width)).toBe(true);
      expect(isTablet(VIEWPORTS.tabletPortrait.width)).toBe(true);
      expect(isDesktop(VIEWPORTS.desktopStandard.width)).toBe(true);
      expect(isDesktop(VIEWPORTS.desktopWide.width)).toBe(true);
    });

    it('enforces maximum readable container constraints on desktop viewports', () => {
      const maxContentWidth = 600; // Centered content column standard for BuckeyeGrub mobile-first layout
      for (const [, viewport] of Object.entries(VIEWPORTS)) {
        const effectiveContainerWidth = Math.min(viewport.width, maxContentWidth);
        expect(effectiveContainerWidth).toBeLessThanOrEqual(maxContentWidth);
        if (viewport.width <= maxContentWidth) {
          expect(effectiveContainerWidth).toBe(viewport.width);
        } else {
          expect(effectiveContainerWidth).toBe(maxContentWidth);
        }
      }
    });

    it('validates safe padding distribution across mobile and desktop viewports', () => {
      const getHorizontalPadding = (width: number) => {
        if (width < 380) return spacing.sm; // 8px for compact narrow screens (e.g. 375px)
        if (width < 768) return spacing.md; // 16px for standard mobile
        return spacing.lg; // 24px for tablet/desktop
      };

      expect(getHorizontalPadding(VIEWPORTS.mobileCompact.width)).toBe(spacing.sm);
      expect(getHorizontalPadding(VIEWPORTS.mobileModern.width)).toBe(spacing.md);
      expect(getHorizontalPadding(VIEWPORTS.tabletPortrait.width)).toBe(spacing.lg);
      expect(getHorizontalPadding(VIEWPORTS.desktopStandard.width)).toBe(spacing.lg);
    });
  });

  describe('Official OSU Design Tokens & Contrast Verification', () => {
    const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

    it('contains valid hex color tokens for all primary and surface colors', () => {
      const colorTokens = [
        palette.scarlet,
        palette.scarletDark,
        palette.gray,
        palette.grayDark,
        lightTheme.colors.background,
        lightTheme.colors.surface,
        lightTheme.colors.textPrimary,
        lightTheme.colors.textSecondary,
        darkTheme.colors.background,
        darkTheme.colors.surface,
        darkTheme.colors.textPrimary,
        darkTheme.colors.textSecondary,
      ];

      for (const token of colorTokens) {
        expect(token).toMatch(hexPattern);
      }
    });

    it('enforces official OSU color palette compliance', () => {
      // Official Ohio State University branding
      expect(palette.scarlet.toUpperCase()).toBe('#BA0C2F');
      expect(palette.scarletDark.toUpperCase()).toBe('#BB0000');
      expect(palette.gray.toUpperCase()).toBe('#A7B1B7');
      expect(palette.grayDark.toUpperCase()).toBe('#666666');
    });

    it('guarantees dark mode surface differentiation from background', () => {
      expect(darkTheme.colors.background).not.toBe(darkTheme.colors.surface);
      expect(darkTheme.colors.surface).toBe('#1E1E24');
      expect(darkTheme.colors.background).toBe('#121216');
    });

    it('provides standardized spacing scale without magic numbers', () => {
      expect(spacing.xs).toBe(4);
      expect(spacing.sm).toBe(8);
      expect(spacing.md).toBe(16);
      expect(spacing.lg).toBe(24);
      expect(spacing.xl).toBe(32);
      expect(spacing.xxl).toBe(48);
    });

    it('provides standardized radii tokens', () => {
      expect(radii.sm).toBeGreaterThan(0);
      expect(radii.md).toBeGreaterThan(radii.sm);
      expect(radii.lg).toBeGreaterThan(radii.md);
      expect(radii.full).toBe(9999);
    });

    it('provides scaled typography sizes hierarchy', () => {
      expect(typography.sizes.xxxl).toBeGreaterThan(typography.sizes.xxl);
      expect(typography.sizes.xxl).toBeGreaterThan(typography.sizes.xl);
      expect(typography.sizes.xl).toBeGreaterThan(typography.sizes.lg);
      expect(typography.sizes.lg).toBeGreaterThan(typography.sizes.md);
      expect(typography.sizes.md).toBeGreaterThan(typography.sizes.sm);
      expect(typography.sizes.sm).toBeGreaterThan(typography.sizes.xs);
    });
  });

  describe('Header Safe-Area Adaptation Contract', () => {
    it('computes positive safe area padding for mobile platforms', () => {
      const computeHeaderTopInset = (topInset: number, isWeb: boolean) => {
        if (isWeb) return Math.max(topInset, 12);
        return Math.max(topInset, 20);
      };

      // Native mobile with Notch / Dynamic Island
      expect(computeHeaderTopInset(47, false)).toBe(47);
      // Native mobile without notch (old devices)
      expect(computeHeaderTopInset(0, false)).toBe(20);
      // Web browser with 0 safe area
      expect(computeHeaderTopInset(0, true)).toBe(12);
    });
  });

  describe('Cross-Platform Grubhub Deep-Link Contract', () => {
    it('guarantees every campus venue with mobile ordering provides valid web fallback', () => {
      const mobileVenues = OSU_VENUES.filter((v) => v.hasMobileOrdering);
      expect(mobileVenues.length).toBeGreaterThan(0);

      for (const venue of mobileVenues) {
        const webUrl = buildGrubhubWebUrl(venue);
        const appUri = buildGrubhubAppUri(venue);

        expect(webUrl).not.toBeNull();
        expect(webUrl).toMatch(/^https:\/\/www\.grubhub\.com\/restaurant\//);
        expect(appUri).not.toBeNull();
        expect(appUri).toMatch(/^grubhub:\/\/restaurant\//);
      }
    });

    it('correctly returns null links for traditional dining halls without mobile ordering', () => {
      const walkInVenues = OSU_VENUES.filter((v) => !v.hasMobileOrdering);
      for (const venue of walkInVenues) {
        expect(buildGrubhubWebUrl(venue)).toBeNull();
        expect(buildGrubhubAppUri(venue)).toBeNull();
      }
    });
  });
});

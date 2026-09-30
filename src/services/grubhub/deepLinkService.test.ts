import {
  buildGrubhubWebUrl,
  buildGrubhubAppUri,
  openVenueOrder,
} from './deepLinkService';
import { OSU_VENUES } from '../../data';
import { DiningVenue } from '../../types/dining';

const mockCanOpenURL = jest.fn();
const mockOpenURL = jest.fn();

jest.mock('expo-linking', () => ({
  __esModule: true,
  canOpenURL: (...args: unknown[]) => mockCanOpenURL(...args),
  openURL: (...args: unknown[]) => mockOpenURL(...args),
}));

describe('Grubhub Deep-Link Service', () => {
  const mockVenueWithCuratedUrls: DiningVenue = {
    id: 'test-curl',
    name: 'Curl Market',
    shortName: 'Curl',
    slug: 'curl-market',
    description: 'Premier north campus marketplace',
    zone: 'North',
    venueType: 'cafe',
    acceptedPayments: ['dining_dollars', 'buckid_cash'],
    hasMobileOrdering: true,
    grubhubSlug: 'curl-market-test',
    grubhubUrl: 'https://www.grubhub.com/restaurant/curl-market-columbus/12345',
    grubhubUri: 'grubhub://restaurant/curl-market-columbus/12345',
    address: '80 W Woodruff Ave',
    operatingHours: {},
    coordinates: { latitude: 40.005, longitude: -83.013 },
  };

  const mockVenueSlugOnly: DiningVenue = {
    id: 'test-woody',
    name: "Woody's Tavern",
    shortName: "Woody's",
    slug: 'woodys-tavern',
    description: 'Casual campus dining and pub classics',
    zone: 'South',
    venueType: 'retail',
    acceptedPayments: ['dining_dollars', 'buckid_cash'],
    hasMobileOrdering: true,
    grubhubSlug: 'woodys-tavern-ohio-union',
    address: '1739 N High St',
    operatingHours: {},
    coordinates: { latitude: 39.998, longitude: -83.008 },
  };

  const mockVenueUnmapped: DiningVenue = {
    id: 'test-unmapped',
    name: 'Unmapped Venue',
    shortName: 'Unmapped',
    slug: 'unmapped-venue',
    description: 'Venue without mobile ordering',
    zone: 'West',
    venueType: 'traditions',
    acceptedPayments: ['swipe', 'dining_dollars', 'buckid_cash'],
    hasMobileOrdering: false,
    address: '123 Campus Way',
    operatingHours: {},
    coordinates: { latitude: 40.001, longitude: -83.02 },
  };

  describe('buildGrubhubWebUrl', () => {
    it('returns curated grubhubUrl when present on venue', () => {
      const url = buildGrubhubWebUrl(mockVenueWithCuratedUrls);
      expect(url).toBe('https://www.grubhub.com/restaurant/curl-market-columbus/12345');
    });

    it('derives URL from grubhubSlug when curated URL is absent', () => {
      const url = buildGrubhubWebUrl(mockVenueSlugOnly);
      expect(url).toBe('https://www.grubhub.com/restaurant/woodys-tavern-ohio-union');
    });

    it('builds URL from standalone slug string', () => {
      const url = buildGrubhubWebUrl('traditions-at-scott');
      expect(url).toBe('https://www.grubhub.com/restaurant/traditions-at-scott');
    });

    it('trims whitespace from standalone slug string', () => {
      const url = buildGrubhubWebUrl('   curl-market   ');
      expect(url).toBe('https://www.grubhub.com/restaurant/curl-market');
    });

    it('returns null when venue has no Grubhub mapping', () => {
      expect(buildGrubhubWebUrl(mockVenueUnmapped)).toBeNull();
    });

    it('returns null for empty or whitespace-only slug strings', () => {
      expect(buildGrubhubWebUrl('')).toBeNull();
      expect(buildGrubhubWebUrl('   ')).toBeNull();
    });
  });

  describe('buildGrubhubAppUri', () => {
    it('returns curated grubhubUri when present on venue', () => {
      const uri = buildGrubhubAppUri(mockVenueWithCuratedUrls);
      expect(uri).toBe('grubhub://restaurant/curl-market-columbus/12345');
    });

    it('derives app URI from grubhubSlug when curated URI is absent', () => {
      const uri = buildGrubhubAppUri(mockVenueSlugOnly);
      expect(uri).toBe('grubhub://restaurant/woodys-tavern-ohio-union');
    });

    it('builds app URI from standalone slug string', () => {
      const uri = buildGrubhubAppUri('union-market');
      expect(uri).toBe('grubhub://restaurant/union-market');
    });

    it('returns null for unmapped venues or blank slugs', () => {
      expect(buildGrubhubAppUri(mockVenueUnmapped)).toBeNull();
      expect(buildGrubhubAppUri('')).toBeNull();
      expect(buildGrubhubAppUri('   ')).toBeNull();
    });
  });

  describe('openVenueOrder (contract & fallback verification)', () => {
    beforeEach(() => {
      mockCanOpenURL.mockReset();
      mockOpenURL.mockReset();
    });

    it('returns graceful error result for unmapped venues without throwing', async () => {
      const result = await openVenueOrder(mockVenueUnmapped);
      expect(result.opened).toBe(false);
      expect(result.usedFallback).toBe(false);
      expect(result.target).toBeNull();
      expect(result.error).toContain('does not have a Grubhub ordering link');
    });

    it('launches native deep link when canOpenURL returns true', async () => {
      mockCanOpenURL.mockResolvedValueOnce(true);
      mockOpenURL.mockResolvedValueOnce(true);

      const result = await openVenueOrder(mockVenueWithCuratedUrls);

      expect(mockCanOpenURL).toHaveBeenCalledWith(mockVenueWithCuratedUrls.grubhubUri);
      expect(mockOpenURL).toHaveBeenCalledWith(mockVenueWithCuratedUrls.grubhubUri);
      expect(result.opened).toBe(true);
      expect(result.usedFallback).toBe(false);
      expect(result.target).toBe(mockVenueWithCuratedUrls.grubhubUri);
    });

    it('falls back to web URL when canOpenURL returns false', async () => {
      mockCanOpenURL.mockResolvedValueOnce(false);
      mockOpenURL.mockResolvedValueOnce(true);

      const result = await openVenueOrder(mockVenueWithCuratedUrls);

      expect(mockCanOpenURL).toHaveBeenCalledWith(mockVenueWithCuratedUrls.grubhubUri);
      expect(mockOpenURL).toHaveBeenCalledWith(mockVenueWithCuratedUrls.grubhubUrl);
      expect(result.opened).toBe(true);
      expect(result.usedFallback).toBe(true);
      expect(result.target).toBe(mockVenueWithCuratedUrls.grubhubUrl);
    });

    it('falls back to web URL when canOpenURL throws an error', async () => {
      mockCanOpenURL.mockRejectedValueOnce(new Error('Simulated platform linking failure'));
      mockOpenURL.mockResolvedValueOnce(true);

      const result = await openVenueOrder(mockVenueSlugOnly);

      expect(mockOpenURL).toHaveBeenCalledWith(
        'https://www.grubhub.com/restaurant/woodys-tavern-ohio-union'
      );
      expect(result.opened).toBe(true);
      expect(result.usedFallback).toBe(true);
      expect(result.target).toBe(
        'https://www.grubhub.com/restaurant/woodys-tavern-ohio-union'
      );
    });

    it('catches and reports failure gracefully when both app and web launches throw', async () => {
      mockCanOpenURL.mockRejectedValueOnce(new Error('Native scheme unsupported'));
      mockOpenURL.mockRejectedValueOnce(new Error('Browser blocked popup'));

      const result = await openVenueOrder(mockVenueSlugOnly);

      expect(result.opened).toBe(false);
      expect(result.usedFallback).toBe(true);
      expect(result.target).toBe(
        'https://www.grubhub.com/restaurant/woodys-tavern-ohio-union'
      );
      expect(result.error).toBe('Browser blocked popup');
    });
  });

  describe('OSU Venues Catalog Grubhub Integration', () => {
    it('ensures all 12 OSU venues have predictable Grubhub URL/URI handling', () => {
      expect(OSU_VENUES.length).toBeGreaterThanOrEqual(10);

      for (const venue of OSU_VENUES) {
        const webUrl = buildGrubhubWebUrl(venue);
        const appUri = buildGrubhubAppUri(venue);

        if (venue.grubhubSlug || venue.grubhubUrl) {
          expect(webUrl).not.toBeNull();
          expect(webUrl).toMatch(/^https:\/\/www\.grubhub\.com\/restaurant\//);
          expect(appUri).not.toBeNull();
          expect(appUri).toMatch(/^grubhub:\/\/restaurant\//);
        } else {
          expect(webUrl).toBeNull();
          expect(appUri).toBeNull();
        }
      }
    });
  });
});

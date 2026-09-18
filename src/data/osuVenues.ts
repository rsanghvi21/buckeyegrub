/**
 * BuckeyeGrub Master Dining Venues Dataset
 * 12 verified Ohio State University dining locations across North, South, and West campus.
 * Integrated with OSU Nutrislice identifiers and Grubhub ordering links.
 */

import { CampusZone, DiningVenue } from '../types/dining';
import { palette } from '../constants/theme';

export const OSU_VENUES: DiningVenue[] = [
  {
    id: 'traditions-at-scott',
    name: 'Traditions at Scott',
    shortName: 'Scott',
    slug: 'traditions-at-scott',
    nutrisliceSchoolId: 58232,
    zone: 'North',
    address: '160 W Woodruff Ave, Columbus, OH 43210',
    description:
      'Premier 2-story North Campus dining center featuring all-you-care-to-eat stations, Mongolian BBQ, breakfast diner, custom stir-fry, and allergen-friendly Solutions station.',
    venueType: 'traditions',
    acceptedPayments: ['swipe', 'dining_dollars', 'buckid_cash'],
    hasMobileOrdering: true,
    grubhubSlug: 'traditions-at-scott-160-w-woodruff-ave',
    grubhubUrl: 'https://www.grubhub.com/restaurant/traditions-at-scott-160-w-woodruff-ave-columbus/2693892',
    grubhubUri: 'grubhub://restaurant/traditions-at-scott-160-w-woodruff-ave',
    coordinates: {
      latitude: 40.00452,
      longitude: -83.013241,
    },
    operatingHours: {
      monday: { open: '07:00', close: '22:00' },
      tuesday: { open: '07:00', close: '22:00' },
      wednesday: { open: '07:00', close: '22:00' },
      thursday: { open: '07:00', close: '22:00' },
      friday: { open: '07:00', close: '21:00' },
      saturday: { open: '09:00', close: '21:00' },
      sunday: { open: '09:00', close: '22:00' },
    },
    bannerColor: palette.scarlet,
  },
  {
    id: 'traditions-at-kennedy',
    name: 'Traditions at Kennedy',
    shortName: 'Kennedy',
    slug: 'traditions-at-kennedy',
    nutrisliceSchoolId: 55656,
    zone: 'South',
    address: '251 W 12th Ave, Columbus, OH 43210',
    description:
      'Historic South Campus dining hall serving home-cooked comfort foods, rotisserie carvings, artisan pizza, vegan specialties, and full salad bars.',
    venueType: 'traditions',
    acceptedPayments: ['swipe', 'dining_dollars', 'buckid_cash'],
    hasMobileOrdering: true,
    grubhubSlug: 'traditions-at-kennedy-251-w-12th-ave',
    grubhubUrl: 'https://www.grubhub.com/restaurant/traditions-at-kennedy-251-w-12th-ave-columbus/2693893',
    grubhubUri: 'grubhub://restaurant/traditions-at-kennedy-251-w-12th-ave',
    coordinates: {
      latitude: 39.99849,
      longitude: -83.01353,
    },
    operatingHours: {
      monday: { open: '07:00', close: '21:00' },
      tuesday: { open: '07:00', close: '21:00' },
      wednesday: { open: '07:00', close: '21:00' },
      thursday: { open: '07:00', close: '21:00' },
      friday: { open: '07:00', close: '20:00' },
      saturday: { open: '09:00', close: '20:00' },
      sunday: { open: '09:00', close: '21:00' },
    },
    bannerColor: palette.scarletDark,
  },
  {
    id: 'traditions-at-morrill',
    name: 'Traditions at Morrill',
    shortName: 'Morrill',
    slug: 'traditions-at-morrill',
    nutrisliceSchoolId: 58231,
    zone: 'West',
    address: '1900 Cannon Dr, Columbus, OH 43210',
    description:
      'West Campus dining hub adjacent to Morrill & Lincoln Towers, featuring build-your-own bowls, international entrees, fresh grill, and bakery goods.',
    venueType: 'traditions',
    acceptedPayments: ['swipe', 'dining_dollars', 'buckid_cash'],
    hasMobileOrdering: true,
    grubhubSlug: 'traditions-at-morrill-1900-cannon-dr',
    grubhubUrl: 'https://www.grubhub.com/restaurant/traditions-at-morrill-1900-cannon-dr-columbus/2693894',
    grubhubUri: 'grubhub://restaurant/traditions-at-morrill-1900-cannon-dr',
    coordinates: {
      latitude: 40.00192,
      longitude: -83.02422,
    },
    operatingHours: {
      monday: { open: '07:00', close: '21:00' },
      tuesday: { open: '07:00', close: '21:00' },
      wednesday: { open: '07:00', close: '21:00' },
      thursday: { open: '07:00', close: '21:00' },
      friday: { open: '07:00', close: '20:00' },
      saturday: { open: '10:00', close: '19:00' },
      sunday: { open: '10:00', close: '21:00' },
    },
    bannerColor: palette.scarletDeep,
  },
  {
    id: 'curl-market',
    name: 'Curl Market',
    shortName: 'Curl',
    slug: 'curl-market',
    nutrisliceSchoolId: 58211,
    zone: 'North',
    address: '80 W Woodruff Ave, Columbus, OH 43210',
    description:
      'Dynamic North Campus retail marketplace featuring handmade sushi, noodle & grain bowls, artisan deli sandwiches, chopped salads, and grab-and-go snacks.',
    venueType: 'retail',
    acceptedPayments: ['dining_dollars', 'buckid_cash'],
    hasMobileOrdering: true,
    grubhubSlug: 'curl-market-80-w-woodruff-ave',
    grubhubUrl: 'https://www.grubhub.com/restaurant/curl-market-80-w-woodruff-ave-columbus/2693888',
    grubhubUri: 'grubhub://restaurant/curl-market-80-w-woodruff-ave',
    coordinates: {
      latitude: 40.00424,
      longitude: -83.01015,
    },
    operatingHours: {
      monday: { open: '07:30', close: '21:00' },
      tuesday: { open: '07:30', close: '21:00' },
      wednesday: { open: '07:30', close: '21:00' },
      thursday: { open: '07:30', close: '21:00' },
      friday: { open: '07:30', close: '20:00' },
      saturday: { open: '11:00', close: '20:00' },
      sunday: { open: '11:00', close: '21:00' },
    },
    bannerColor: palette.goldDark,
  },
  {
    id: 'union-market',
    name: 'Union Market',
    shortName: 'Union Market',
    slug: 'union-market',
    nutrisliceSchoolId: 58233,
    zone: 'South',
    address: '1739 N High St, Columbus, OH 43210',
    description:
      'Central hub inside the Ohio Union featuring fresh grill burgers, signature chicken tenders, hand-tossed personal pizzas, Mexican burrito bowls, and sushi.',
    venueType: 'retail',
    acceptedPayments: ['dining_dollars', 'buckid_cash'],
    hasMobileOrdering: true,
    grubhubSlug: 'union-market-1739-n-high-st',
    grubhubUrl: 'https://www.grubhub.com/restaurant/union-market-1739-n-high-st-columbus/2693895',
    grubhubUri: 'grubhub://restaurant/union-market-1739-n-high-st',
    coordinates: {
      latitude: 39.99786,
      longitude: -83.00866,
    },
    operatingHours: {
      monday: { open: '07:00', close: '21:00' },
      tuesday: { open: '07:00', close: '21:00' },
      wednesday: { open: '07:00', close: '21:00' },
      thursday: { open: '07:00', close: '21:00' },
      friday: { open: '07:00', close: '21:00' },
      saturday: { open: '10:00', close: '20:00' },
      sunday: { open: '10:00', close: '21:00' },
    },
    bannerColor: palette.macros.protein,
  },
  {
    id: '12th-avenue-bread-company',
    name: '12th Avenue Bread Company',
    shortName: '12th Ave Bread',
    slug: '12th-avenue-bread-company',
    nutrisliceSchoolId: 58204,
    zone: 'South',
    address: '251 W 12th Ave, Columbus, OH 43210',
    description:
      'Artisan bakery and sandwich cafe located by Kennedy Commons, offering gourmet paninis, hearty soups in sourdough bread bowls, fresh salads, and espresso drinks.',
    venueType: 'cafe',
    acceptedPayments: ['dining_dollars', 'buckid_cash'],
    hasMobileOrdering: true,
    grubhubSlug: '12th-avenue-bread-company-251-w-12th-ave',
    grubhubUrl: 'https://www.grubhub.com/restaurant/12th-avenue-bread-company-251-w-12th-ave-columbus/2693880',
    grubhubUri: 'grubhub://restaurant/12th-avenue-bread-company-251-w-12th-ave',
    coordinates: {
      latitude: 39.99834,
      longitude: -83.01362,
    },
    operatingHours: {
      monday: { open: '07:30', close: '19:00' },
      tuesday: { open: '07:30', close: '19:00' },
      wednesday: { open: '07:30', close: '19:00' },
      thursday: { open: '07:30', close: '19:00' },
      friday: { open: '07:30', close: '17:00' },
      saturday: { open: '00:00', close: '00:00', isClosed: true },
      sunday: { open: '11:00', close: '19:00' },
    },
    bannerColor: palette.gold,
  },
  {
    id: 'marketplace-on-neil',
    name: 'Marketplace on Neil',
    shortName: 'Neil Market',
    slug: 'marketplace',
    aliases: ['neil-avenue-cafe', 'neil-cafe', 'neil-avenue'],
    nutrisliceSchoolId: 58218,
    zone: 'South',
    address: '1578 Neil Ave, Columbus, OH 43210',
    description:
      'Upscale South Campus dining destination featuring personal hearth pizzas, gourmet sandwiches, pasta, gluten-free pantry items, and convenience groceries.',
    venueType: 'retail',
    acceptedPayments: ['dining_dollars', 'buckid_cash'],
    hasMobileOrdering: true,
    grubhubSlug: 'marketplace-on-neil-1578-neil-ave',
    grubhubUrl: 'https://www.grubhub.com/restaurant/marketplace-on-neil-1578-neil-ave-columbus/2693889',
    grubhubUri: 'grubhub://restaurant/marketplace-on-neil-1578-neil-ave',
    coordinates: {
      latitude: 39.99498,
      longitude: -83.01633,
    },
    operatingHours: {
      monday: { open: '07:00', close: '22:00' },
      tuesday: { open: '07:00', close: '22:00' },
      wednesday: { open: '07:00', close: '22:00' },
      thursday: { open: '07:00', close: '22:00' },
      friday: { open: '07:00', close: '21:00' },
      saturday: { open: '10:00', close: '21:00' },
      sunday: { open: '10:00', close: '22:00' },
    },
    bannerColor: palette.neutralCharcoal,
  },
  {
    id: 'pad-pizza-delivery',
    name: 'PAD - Pizza & Delivery',
    shortName: 'PAD',
    slug: 'pad-pizza-delivery',
    zone: 'North',
    address: '160 W Woodruff Ave (Scott Lower Level), Columbus, OH 43210',
    description:
      'Campus-famous late-night pizza kitchen providing hot fresh whole pizzas, oven-baked wings, cheesy breadsticks, and dorm delivery service.',
    venueType: 'grab_and_go',
    acceptedPayments: ['dining_dollars', 'buckid_cash'],
    hasMobileOrdering: true,
    grubhubSlug: 'pad-pizza-delivery-160-w-woodruff-ave',
    grubhubUrl: 'https://www.grubhub.com/restaurant/pad-pizza-delivery-160-w-woodruff-ave-columbus/2693891',
    grubhubUri: 'grubhub://restaurant/pad-pizza-delivery-160-w-woodruff-ave',
    coordinates: {
      latitude: 40.00445,
      longitude: -83.01318,
    },
    operatingHours: {
      monday: { open: '17:00', close: '23:30' },
      tuesday: { open: '17:00', close: '23:30' },
      wednesday: { open: '17:00', close: '23:30' },
      thursday: { open: '17:00', close: '00:30' },
      friday: { open: '17:00', close: '01:00' },
      saturday: { open: '17:00', close: '01:00' },
      sunday: { open: '17:00', close: '23:30' },
    },
    bannerColor: palette.scarlet,
  },
  {
    id: 'woodys-tavern',
    name: "Woody's Tavern",
    shortName: "Woody's",
    slug: 'woodys-tavern',
    nutrisliceSchoolId: 58234,
    zone: 'South',
    address: '1739 N High St (Ohio Union), Columbus, OH 43210',
    description:
      'Buckeye sports pub atmosphere inside the Ohio Union serving hand-spun wings, pub burgers, loaded tots, plant-based entrees, and craft beverages.',
    venueType: 'retail',
    acceptedPayments: ['dining_dollars', 'buckid_cash'],
    hasMobileOrdering: true,
    grubhubSlug: 'woodys-tavern-1739-n-high-st',
    grubhubUrl: 'https://www.grubhub.com/restaurant/woodys-tavern-1739-n-high-st-columbus/2693896',
    grubhubUri: 'grubhub://restaurant/woodys-tavern-1739-n-high-st',
    coordinates: {
      latitude: 39.99786,
      longitude: -83.00866,
    },
    operatingHours: {
      monday: { open: '11:00', close: '21:00' },
      tuesday: { open: '11:00', close: '21:00' },
      wednesday: { open: '11:00', close: '21:00' },
      thursday: { open: '11:00', close: '22:00' },
      friday: { open: '11:00', close: '22:00' },
      saturday: { open: '12:00', close: '21:00' },
      sunday: { open: '12:00', close: '20:00' },
    },
    bannerColor: palette.scarletDark,
  },
  {
    id: 'berry-cafe',
    name: 'Berry Café',
    shortName: 'Berry',
    slug: 'berry-cafe',
    nutrisliceSchoolId: 58200,
    zone: 'South',
    address: '1858 Neil Ave (Thompson Library Ground Floor), Columbus, OH 43210',
    description:
      'Premier campus study cafe in Thompson Memorial Library providing specialty espresso drinks, teas, bakery croissants, wraps, and grab-and-go protein boxes.',
    venueType: 'cafe',
    acceptedPayments: ['dining_dollars', 'buckid_cash'],
    hasMobileOrdering: true,
    grubhubSlug: 'berry-cafe-1858-neil-ave',
    grubhubUrl: 'https://www.grubhub.com/restaurant/berry-cafe-1858-neil-ave-columbus/2693881',
    grubhubUri: 'grubhub://restaurant/berry-cafe-1858-neil-ave',
    coordinates: {
      latitude: 39.99898,
      longitude: -83.01485,
    },
    operatingHours: {
      monday: { open: '08:00', close: '20:00' },
      tuesday: { open: '08:00', close: '20:00' },
      wednesday: { open: '08:00', close: '20:00' },
      thursday: { open: '08:00', close: '20:00' },
      friday: { open: '08:00', close: '17:00' },
      saturday: { open: '11:00', close: '16:00' },
      sunday: { open: '12:00', close: '20:00' },
    },
    bannerColor: palette.neutralCharcoal,
  },
  {
    id: 'courtside-cafe',
    name: 'Courtside Cafe / Juice @ RPAC',
    shortName: 'RPAC Courtside',
    slug: 'courtside-cafe',
    nutrisliceSchoolId: 58209,
    zone: 'West',
    address: '337 Annie & John Glenn Ave (RPAC), Columbus, OH 43210',
    description:
      'Fitness nutrition center located inside the RPAC, offering custom post-workout whey protein smoothies, nutrient-dense salads, energy bowls, and recovery snacks.',
    venueType: 'cafe',
    acceptedPayments: ['dining_dollars', 'buckid_cash'],
    hasMobileOrdering: true,
    grubhubSlug: 'courtside-cafe-337-annie-and-john-glenn-ave',
    grubhubUrl: 'https://www.grubhub.com/restaurant/courtside-cafe-337-annie-and-john-glenn-ave-columbus/2693887',
    grubhubUri: 'grubhub://restaurant/courtside-cafe-337-annie-and-john-glenn-ave',
    coordinates: {
      latitude: 39.99961,
      longitude: -83.01832,
    },
    operatingHours: {
      monday: { open: '07:00', close: '21:00' },
      tuesday: { open: '07:00', close: '21:00' },
      wednesday: { open: '07:00', close: '21:00' },
      thursday: { open: '07:00', close: '21:00' },
      friday: { open: '07:00', close: '19:00' },
      saturday: { open: '09:00', close: '18:00' },
      sunday: { open: '10:00', close: '19:00' },
    },
    bannerColor: palette.macros.fat,
  },
  {
    id: 'connecting-grounds',
    name: 'Connecting Grounds',
    shortName: 'Connecting Grounds',
    slug: 'connecting-grounds',
    nutrisliceSchoolId: 58208,
    zone: 'North',
    address: '160 W Woodruff Ave (Scott House), Columbus, OH 43210',
    description:
      'Welcoming North Campus coffee shop offering craft coffee, cold brew, matcha, artisanal sandwiches, breakfast bakery items, and quick study fuel.',
    venueType: 'cafe',
    acceptedPayments: ['dining_dollars', 'buckid_cash'],
    hasMobileOrdering: true,
    grubhubSlug: 'connecting-grounds-160-w-woodruff-ave',
    grubhubUrl: 'https://www.grubhub.com/restaurant/connecting-grounds-160-w-woodruff-ave-columbus/2693886',
    grubhubUri: 'grubhub://restaurant/connecting-grounds-160-w-woodruff-ave',
    coordinates: {
      latitude: 40.00451,
      longitude: -83.01319,
    },
    operatingHours: {
      monday: { open: '07:30', close: '18:00' },
      tuesday: { open: '07:30', close: '18:00' },
      wednesday: { open: '07:30', close: '18:00' },
      thursday: { open: '07:30', close: '18:00' },
      friday: { open: '07:30', close: '16:00' },
      saturday: { open: '00:00', close: '00:00', isClosed: true },
      sunday: { open: '11:00', close: '18:00' },
    },
    bannerColor: palette.grayMuted,
  },
];

export const OSU_VENUES_MAP: Record<string, DiningVenue> = OSU_VENUES.reduce(
  (acc, venue) => {
    acc[venue.id] = venue;
    if (venue.aliases) {
      for (const alias of venue.aliases) {
        acc[alias] = venue;
      }
    }
    return acc;
  },
  {} as Record<string, DiningVenue>
);

export const OSU_VENUES_BY_SLUG: Record<string, DiningVenue> = OSU_VENUES.reduce(
  (acc, venue) => {
    acc[venue.slug] = venue;
    return acc;
  },
  {} as Record<string, DiningVenue>
);

export const OSU_VENUES_BY_ZONE: Record<CampusZone, DiningVenue[]> = {
  North: OSU_VENUES.filter((v) => v.zone === 'North'),
  South: OSU_VENUES.filter((v) => v.zone === 'South'),
  West: OSU_VENUES.filter((v) => v.zone === 'West'),
};

export const OSU_TRADITIONS_VENUES: DiningVenue[] = OSU_VENUES.filter(
  (v) => v.venueType === 'traditions'
);

export const OSU_RETAIL_VENUES: DiningVenue[] = OSU_VENUES.filter(
  (v) => v.venueType !== 'traditions'
);

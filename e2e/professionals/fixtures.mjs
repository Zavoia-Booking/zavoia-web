export const PERSON = 'Mara Share';
export const UUID = 'share-professional-fixture';
export const BUSINESS = 'Atelier Share Studio';
export const ABOUT = 'Thoughtful hair care and styling in Bucharest.';
export const IMAGE = '/__professionals-fixtures__/portrait.svg';

export function profileFixture(memberId = 301) {
  const index = memberId - 301;
  const firstName = ['Mara', 'Lily', 'Sofia'][index] ?? 'Mara';
  const uuid = [UUID, 'share-professional-lily', 'share-professional-sofia'][index] ?? UUID;
  return {
    id: memberId, uuid, publicProfileAvailable: true, firstName, lastName: 'Share',
    profileImage: IMAGE, yearsOfExperience: 5, visitsCompleted: 10,
    memberSince: '2024-01-01T10:00:00Z',
    about: {
      displayName: `${firstName} Share`, professionalTitle: 'Stylist', aboutMe: ABOUT,
      interests: ['Hair care'], languages: ['Română', 'English'], socialLinks: {},
    },
    services: [], portfolio: [
      '/__professionals-fixtures__/portfolio-one.svg',
      '/__professionals-fixtures__/portfolio-two.svg',
    ], reviews: [], reviewStats: { totalCount: 0, averageRating: null },
  };
}

export function favoritesFixture() {
  return {
    locations: [],
    professionals: [{
      id: 1001,
      professional: {
        id: 301, uuid: UUID, firstName: 'Mara', lastName: 'Share',
        displayName: PERSON, professionalTitle: 'Stylist', profileImage: IMAGE,
        averageRating: null, totalReviews: 0,
      },
      createdAt: '2026-10-10T10:00:00Z',
    }],
  };
}

export function contextFixture(count = 1, showPricing = true) {
  return {
    teamMember: { id: 301, firstName: 'Mara', lastName: 'Share', profileImage: IMAGE },
    businesses: count ? [{
      id: 101, name: BUSINESS, listingId: 11, businessCurrency: 'RON', logo: null,
      locations: Array.from({ length: count }, (_, index) => ({
        id: 201 + index, slug: index === 0 ? 'share-old-town' : `share-north-${index}`,
        name: index === 0 ? 'Old Town venue' : 'North venue',
        address: index === 0 ? 'Strada Centrului 3, Bucharest' : 'Strada Nordului 5, Bucharest',
        latitude: 44.43, longitude: 26.10, timezone: 'Europe/Bucharest',
        featuredImage: null, averageRating: 4.8, totalReviews: 5,
        allowOnlineBooking: true, showPricing,
        services: [{
          id: 401, uuid: 'share-service-fixture', name: 'Fixture haircut', description: null,
          priceAmountMinor: index === 0 ? 12000 : 18000,
          duration: index === 0 ? 30 : 45, categoryId: null, category: null, displayOrder: 0,
        }],
      })),
    }] : [],
  };
}

export function listingFixture() {
  const context = contextFixture();
  const business = context.businesses[0];
  const venue = business.locations[0];
  const profile = profileFixture();
  return {
    id: venue.id, locationId: venue.id, businessId: business.id,
    businessSlug: 'share-studio', listingId: business.listingId, slug: venue.slug,
    name: business.name, description: ABOUT, email: null, phone: null, logo: null,
    country: 'RO', businessCurrency: 'RON', timezone: venue.timezone,
    instagramUrl: null, facebookUrl: null, tiktokUrl: null, websiteUrl: null, pinterestUrl: null,
    industry: null,
    location: {
      id: venue.id, uuid: 'share-location-fixture', slug: venue.slug, name: venue.name,
      description: null, phone: null, email: null, address: venue.address,
      addressComponents: null, city: 'Bucharest', latitude: venue.latitude, longitude: venue.longitude,
      timezone: venue.timezone, workingHours: null, open247: false, allowOnlineBooking: true,
    },
    featuredImage: IMAGE, portfolioImages: [], serviceCategories: [],
    services: venue.services.map((service) => ({
      ...service, priceFromMinor: service.priceAmountMinor, priceToMinor: service.priceAmountMinor,
      priceVariesByStaff: false, durationMinMinutes: service.duration, durationMaxMinutes: service.duration,
      durationVariesByStaff: false, bookableStaffCount: 3, locationIds: [venue.id],
    })), bundles: [],
    teamMembers: [profile, profileFixture(302), profileFixture(303)].map((member) => ({
      id: member.id, uuid: member.uuid, publicProfileAvailable: member.publicProfileAvailable,
      firstName: member.firstName, lastName: member.lastName,
      profileImage: member.profileImage, displayName: member.about.displayName, professionalTitle: 'Stylist',
      averageRating: null, totalReviews: 0, locationIds: [venue.id],
    })),
    reviews: [], reviewStats: { totalCount: 0, averageRating: null, ratingDistribution: {} },
    averageRating: venue.averageRating, totalReviews: venue.totalReviews, allowOnlineBooking: true,
    additionalSettings: { showPricing: true }, bookingPolicy: null, otherLocations: [],
    createdAt: '2026-10-01T10:00:00Z', updatedAt: '2026-10-01T10:00:00Z',
  };
}

export function websiteFixture(variant = 'portraits') {
  const listing = listingFixture();
  return {
    businessId: listing.businessId, slug: `share-team-${variant}`,
    identity: {
      name: BUSINESS, logo: null, businessCurrency: 'RON', timezone: listing.timezone,
      email: null, phone: null, description: ABOUT, instagramUrl: null, facebookUrl: null,
      tiktokUrl: null, pinterestUrl: null, websiteUrl: null,
    },
    website: {
      heroImageUrl: null, heroImageKey: null, tagline: null, aboutContent: null,
      brandColorHex: null, pageTheme: null, faq: [], announcement: null, layoutVersion: 1,
      pageLayout: [
        { type: 'nav', visible: false, variant: 'default' },
        { type: 'team', visible: true, variant },
        { type: 'footer', visible: false, variant: 'directory' },
      ],
    },
    publishedVersion: 1, publishedAt: '2026-10-01T10:00:00Z',
    locations: [{
      ...listing.location, averageRating: 4.8, totalReviews: 5, featuredImage: IMAGE,
      amenityTagIds: [], paymentMethodTagIds: [], languageTagIds: [], bundles: [],
      // The live Studio showcase intentionally meets the existing richness bar.
      portfolioImages: Array.from({ length: 6 }, (_, index) => ({ url: IMAGE, key: `fixture-${index}` })),
      services: Array.from({ length: 6 }, (_, index) => ({
        id: 401 + index, name: `Fixture service ${index + 1}`, description: null,
        duration: 30, price_amount_minor: 12000, categoryId: null, category: null,
      })),
      teamMembers: listing.teamMembers.map((member) => ({
        id: member.id, uuid: member.uuid, publicProfileAvailable: true,
        firstName: member.firstName, lastName: member.lastName, profileImage: member.profileImage,
      })),
    }],
    reviews: [], reviewStats: { ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, teamMembers: [] },
    tagDictionaries: null,
  };
}

export function availabilityFixture(locationId = 201, date = '2030-10-22') {
  const north = locationId === 202;
  const duration = north ? 45 : 30;
  const price = north ? 18000 : 12000;
  const items = [{
    type: 'service', serviceId: 401, serviceName: 'Fixture haircut',
    durationMinutes: duration, priceAmountMinor: price, staffCount: 1,
  }];
  return {
    calendar: {
      businessId: 101, businessName: BUSINESS, locationId,
      locationName: north ? 'North venue' : 'Old Town venue',
      timezone: 'Europe/Bucharest', items, totalDuration: duration, totalPrice: price,
      bookingSettings: {
        minAdvanceBookingMinutes: 0, maxAdvanceBookingMinutes: null, slotIntervalMinutes: 15,
        bufferTimeMinutes: 0, cancellationWindowHours: 24, rescheduleWindowHours: 24,
      },
      calendar: [{ date, dayOfWeek: 'Tuesday', status: 'available', slotsCount: 1 }],
      nextAvailableDate: date,
    },
    slots: {
      businessId: 101, locationId, date, dayOfWeek: 'Tuesday', items,
      totalDuration: duration, totalPrice: price,
      staffDirectory: { 301: { name: PERSON, image: IMAGE } },
      staffPricing: { 401: { 301: { price, duration } } },
      slots: [{
        startTime: '10:00', endTime: north ? '10:45' : '10:30', totalPriceAmountMinor: price,
        items: [{
          type: 'service', serviceId: 401, serviceName: 'Fixture haircut',
          startTime: '10:00', endTime: north ? '10:45' : '10:30',
          durationMinutes: duration, priceAmountMinor: price,
          availableStaffIds: [301], defaultStaffId: 301,
        }],
      }],
    },
  };
}

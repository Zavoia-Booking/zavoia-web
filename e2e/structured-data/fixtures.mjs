import { listingFixture, websiteFixture, UUID } from '../professionals/fixtures.mjs';

// Only selected by the structured-data harness; existing fixture consumers keep
// their original empty taxonomy and publication inventory.
export const HOSTILE_COPY = 'Care </script><script id="schema-injection">alert("fixture")</script> & styling';

export function structuredDataFixtures() {
  const industries = [{
    id: 1, slug: 'hair-salon', name: 'Hair Salon', nameRo: 'Salon de coafură',
    tags: [{ id: 10, slug: 'haircut', name: 'Haircut', nameRo: 'Tuns', icon: 'scissors' }],
  }];
  const listing = listingFixture();
  listing.industry = industries[0];
  listing.location.description = HOSTILE_COPY;
  listing.location.addressComponents = {
    street: 'Strada Centrului', streetNumber: '3', city: 'Bucharest',
    postalCode: '030167', country: 'Romania',
  };
  listing.location.workingHours = {
    monday: { open: '09:00', close: '18:00', isOpen: true },
    tuesday: { open: '09:00', close: '18:00', isOpen: true },
  };
  const locations = [0, 1].map(index => ({
    id: listing.locationId + index, businessId: listing.businessId, listingId: listing.listingId,
    slug: index ? 'share-north' : listing.slug,
    name: listing.name, locationName: index ? 'North venue' : listing.location.name,
    businessName: listing.name, address: listing.location.address, city: 'Bucharest',
    latitude: listing.location.latitude, longitude: listing.location.longitude,
    workingHours: null, open247: false, featuredImage: null, industry: industries[0],
    averageRating: null, totalReviews: 0,
  }));
  const brand = {
    businessId: listing.businessId, slug: 'share-studio', listingId: listing.listingId,
    name: listing.name, description: HOSTILE_COPY, logo: null, country: 'RO',
    industry: industries[0], averageRating: 4.8, totalReviews: 5,
    tagline: null, aboutContent: null, establishedYear: null, heroImageUrl: null,
    locations: locations.map(location => ({
      id: location.id, slug: location.slug, name: location.locationName,
      address: location.address, city: location.city, featuredImage: null,
      averageRating: null, totalReviews: 0,
    })),
    locationsCount: locations.length, teamMembers: [], teamMembersCount: 0,
  };
  const website = websiteFixture();
  website.slug = 'schema-merchant';
  website.website.pageLayout = [
    { type: 'nav', visible: false, variant: 'default' },
    { type: 'about', visible: true, variant: 'editorial' },
    { type: 'faq', visible: true, variant: 'default' },
    { type: 'footer', visible: false, variant: 'directory' },
  ];
  website.website.aboutContent = HOSTILE_COPY;
  website.website.faq = [{
    q: { en: 'Can I book online?', ro: 'Pot rezerva online?' },
    a: { en: 'Choose a published service.', ro: 'Alege un serviciu publicat.' },
  }];
  return {
    listing, industries, brand, schemaWebsite: website,
    searchResult: {
      businesses: [], locations, total: locations.length, limit: 24, offset: 0,
      fallback: { applied: false, reason: null },
    },
    sitemap: {
      locations: locations.map(location => ({
        slug: location.slug,
        category: { city: 'Bucharest', industryId: 1, tagIds: [10] },
      })),
      brands: [{ slug: brand.slug }], websites: [{ slug: website.slug }],
      professionals: [{ uuid: UUID }],
    },
  };
}

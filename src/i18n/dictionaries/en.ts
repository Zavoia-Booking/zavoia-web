import type { Locale } from "../locales";
import { locationPageEn } from "./location-page";
import { appointmentPageEn } from "./appointment-page";
import { textareaEn } from "./textarea";

// English dictionary — the source of truth for the `Dictionary` type
// (`type Dictionary = typeof en`). Add new keys here first, then mirror
// them in ./ro.ts (TypeScript enforces that ro matches this shape).
// Note: no `as const` — values stay `string` so ro can hold different text.
export const en: {
  locationPage: typeof locationPageEn;
  appointmentPage: typeof appointmentPageEn;
  textarea: typeof textareaEn;
  imageViewer: { unavailable: string };
  marketingExamples: { websites: string; product: string; improveMap: string };
  preposition: string;
  home: {
    title: string;
    description: string;
    heading: string;
    intro: string;
    heroTagline: string;
  };
  homeSections: {
    hero: {
      headlineLead: string;
      headlineAccent: string;
      subcopy: string;
      searchTryPrefix: string;
      searchAria: string;
      prompts: string[];
    };
    categories: {
      kicker: string;
      title: string;
    };
    inCity: {
      kicker: string;
      title: string;
      action: string;
      showMore: string;
      locating: string;
      empty: string;
    };
    brands: {
      kicker: string;
      title: string;
      action: string;
      empty: string;
    };
    nearYou: {
      kicker: string;
      title: string;
      action: string;
      showMore: string;
      locating: string;
    };
    recentlyViewed: {
      loading: string;
      kicker: string;
      title: string;
    };
    websiteShowcase: {
      title: string;
      sub: string;
      cta: string;
      viewWebsite: string;
      prev: string;
      next: string;
    };
    trust: {
      title: string;
      items: {
        title: string;
        sub: string;
      }[];
    };
    app: {
      titleFirst: string;
      titleSecond: string;
      titleAccent: string;
      sub: string;
      appStore: string;
      googlePlay: string;
      ios: string;
      android: string;
      scheduleAlt: string;
      mapAlt: string;
      downloadsLabel: string;
    };
    webStudio: {
      titleFirst: string;
      titleSecond: string;
      titleAccent: string;
      sub: string;
      cta: string;
      phoneAlt: string;
      desktopAlt: string;
    };
    bizStrip: {
      titleFirst: string;
      titleSecond: string;
      titleAccent: string;
      sub: string;
      commission: string;
      cta: string;
      pricing: string;
    };
    favorites: {
      saved: string;
      removed: string;
      savePrompt: string;
    };
  };
  header: {
    home: string;
    authentication: string;
    account: string;
    accountAriaLabel: string;
  };
  industryDirectory: {
    breadcrumbLabel: string;
    filterLabel: string;
    filterPlaceholder: string;
    clearSearch: string;
    resultsOne: string;
    resultsMany: string;
    noResultsTitle: string;
    noResultsBody: string;
    pageTitle: string;
    pageDescription: string;
    heading: string;
    intro: string;
    indexLabel: string;
    viewIndustryLabel: string;
    emptyTitle: string;
    emptyBody: string;
    byCityHeading: string;
  };
  category: {
    titleTemplate: string;
    descriptionTemplate: string;
    heading: string;
    intro: string;
    resultsHeading: { one: string; few: string; other: string };
    resultsShowing: string;
    viewAllResults: string;
    emptyTitle: string;
    emptyBody: string;
    exploreCity: string;
    seeAll: string;
    servicesHeading: string;
    otherCitiesHeading: string;
    otherCitiesIntro: string;
    otherIndustriesHeading: string;
    exploreIndustriesHeading: string;
    relatedServicesHeading: string;
  };
  blog: {
    listTitle: string;
    listDescription: string;
    listHeading: string;
    listIntro: string;
    empty: string;
    readMore: string;
    backToList: string;
    kicker: string;
    heading: string;
    intro: string;
    updatedWeekly: string;
    storiesLabel: string;
    latestStory: string;
    readStory: string;
    catAll: string;
    catGuides: string;
    catBusiness: string;
    catProduct: string;
    breadcrumbJournal: string;
    pageLabel: string;
    ofLabel: string;
    prev: string;
    next: string;
    inThisArticle: string;
    faqTitle: string;
    keepReading: string;
    relatedStories: string;
    allStories: string;
    moreFromJournal: string;
    nothingHere: string;
    copyLink: string;
    linkCopied: string;
    shareLabel: string;
    backToTop: string;
  };
  auth: {
    pageTitle: string;
    pageDescription: string;
    tabLogin: string;
    tabRegister: string;
    loginTitle: string;
    loginHeading: string;
    loginSubtitle: string;
    loginSubmit: string;
    loginSubmitting: string;
    noAccountPrompt: string;
    goToRegister: string;
    registerTitle: string;
    registerHeading: string;
    registerSubtitle: string;
    registerSubmit: string;
    registerSubmitting: string;
    haveAccountPrompt: string;
    goToLogin: string;
    googleDivider: string;
    businessSignIn: {
      title: string;
      description: string;
      cta: string;
    };
    terms: {
      agreementPrefix: string;
      termsLink: string;
      cookiesLink: string;
      and: string;
      privacyLink: string;
      required: string;
      continueNotice: string;
    };
    fields: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string;
      phoneOptional: string;
      showPassword: string;
      hidePassword: string;
    };
    errors: {
      generic: string;
      invalidCredentials: string;
      googleAccountHint: string;
      emailInvalid: string;
      emailRequired: string;
      passwordRequired: string;
      passwordTooShort: string;
      passwordWeak: string;
      firstNameRequired: string;
      lastNameRequired: string;
      nameTooShort: string;
      nameTooLong: string;
      nameNeedsLetter: string;
      phoneInvalid: string;
      emailAlreadyRegistered: string;
      googleEmailMismatch: string;
      googleNotLinked: string;
      googleUnlinkNoPassword: string;
      incorrectPassword: string;
      emailTaken: string;
      currentEmailMismatch: string;
      sameEmail: string;
      resetLinkInvalid: string;
      resetLinkExpired: string;
      userNotFound: string;
      googleLinkExpired: string;
      googleLinkVerifyAgain: string;
      googleEmailUnverified: string;
      linkCheckFailedHeading: string;
      linkCheckFailedBody: string;
    };
    passwordStrength: {
      label: string;
      met: string;
      unmet: string;
      ratings: {
        veryWeak: string;
        weak: string;
        fair: string;
        strong: string;
        veryStrong: string;
        excellent: string;
      };
      rules: {
        minLength: string;
        lowercase: string;
        uppercase: string;
        number: string;
        special: string;
      };
    };
    enableAccess: {
      heading: string;
      emailLabel: string;
      explanation: string;
      nextStep: string;
      sendLink: string;
      sending: string;
      sentHeading: string;
      sentBody: string;
      spamHint: string;
      alreadyRequestedHeading: string;
      alreadyRequestedBody: string;
      error: string;
      cancel: string;
    };
    googleLink: {
      heading: string;
      explanation: string;
      explanationNoEmail: string;
      submit: string;
      submitting: string;
      cancel: string;
      error: string;
    };
    googleCallback: {
      pageTitle: string;
      completing: string;
      invalid: string;
      errorHeading: string;
      backToSignIn: string;
      backToAccount: string;
    };
    confirmAccess: {
      heading: string;
      greeting: string;
      explanation: string;
      confirm: string;
      confirming: string;
      cancel: string;
      error: string;
    };
    verifyLink: {
      pageTitle: string;
      pageDescription: string;
      verifying: string;
      confirmHeading: string;
      accountLabel: string;
      confirmBody: string;
      googleOnlyBody: string;
      passwordLabel: string;
      passwordRequired: string;
      wrongPassword: string;
      confirm: string;
      confirming: string;
      orDivider: string;
      successHeading: string;
      successBody: string;
      continueCta: string;
      errorHeading: string;
      errorBody: string;
      backToLogin: string;
    };
    forgotPasswordLink: string;
    verifyEmail: {
      pageTitle: string;
      pageDescription: string;
      verifying: string;
      successHeading: string;
      successBody: string;
      goToLogin: string;
      errorHeading: string;
      errorBody: string;
      backToLogin: string;
    };
    resendVerification: {
      action: string;
      sent: string;
      failed: string;
      retryIn: string;
      limitReached: string;
      unverifiedTitle: string;
      unverifiedBody: string;
    };
    forgotPassword: {
      pageTitle: string;
      pageDescription: string;
      heading: string;
      subtitle: string;
      submit: string;
      submitting: string;
      sentHeading: string;
      sentBody: string;
      backToLogin: string;
    };
    resetPassword: {
      pageTitle: string;
      pageDescription: string;
      heading: string;
      subtitle: string;
      newPassword: string;
      confirmPassword: string;
      submit: string;
      submitting: string;
      successHeading: string;
      successBody: string;
      goToLogin: string;
      missingTokenHeading: string;
      missingTokenBody: string;
      backToLogin: string;
      mismatch: string;
      confirmRequired: string;
      requestNewLink: string;
    };
  };
  account: {
    title: string;
    heading: string;
    loading: string;
    fields: {
      email: string;
      firstName: string;
      lastName: string;
      phone: string;
      phoneEmpty: string;
      dateOfBirth: string;
      address: string;
      addressCountry: string;
      addressCity: string;
      addressStreet: string;
      addressNumber: string;
      addressMentions: string;
      addressMentionsPlaceholder: string;
      addressEmpty: string;
    };
    // Client-side validation copy for the personal-info / address forms —
    // separate from `fields` because these are messages, not labels.
    errors: {
      addressTooLong: string;
    };
    logout: string;
    loggingOut: string;
    sections: {
      profile: string;
      personalDetails: string;
      notifications: string;
      security: string;
      dangerZone: string;
      password: string;
      support: string;
    };
    sectionNav: {
      personal: string;
      preferences: string;
      security: string;
      support: string;
    };
    sectionTitles: {
      personal: string;
      preferences: string;
      security: string;
      support: string;
    };
    preferencesSub: string;
    hubGroupLabel: string;
    backAria: string;
    buttons: {
      edit: string;
      save: string;
      cancel: string;
      changePassword: string;
      changePhoto: string;
      deleteAccount: string;
    };
    stats: {
      unavailable: string;
      loadError: string;
      appointments: string;
      reviews: string;
      saved: string;
      memberSince: string;
    };
    verifiedPill: string;
    unverifiedPill: string;
    notif: {
      marketing: string;
      marketingCaption: string;
      reminders: string;
      remindersCaption: string;
      push: string;
      sms: string;
      email: string;
    };
    password: {
      current: string;
      new: string;
      confirm: string;
      rules: string;
      tooShort: string;
      weak: string;
      mismatch: string;
      manageHint: string;
    };
    googleConnection: {
      title: string;
      connected: string;
      notConnected: string;
      connectCaption: string;
      connectedCaption: string;
      connect: string;
      disconnect: string;
      disconnecting: string;
      passwordPrompt: string;
      passwordLabel: string;
      confirmDisconnect: string;
      cancel: string;
      connectedToast: string;
      disconnectedToast: string;
    };
    changeEmail: {
      title: string;
      caption: string;
      currentValueLabel: string;
      currentLabel: string;
      currentPlaceholder: string;
      newLabel: string;
      newPlaceholder: string;
      submit: string;
      submitting: string;
      cancel: string;
      manageHint: string;
      invalidEmail: string;
      verifiedLabel: string;
      changedToast: string;
    };
    danger: {
      caption: string;
      confirmTitle: string;
      confirmBody: string;
      confirm: string;
      cancel: string;
    };
    toasts: {
      profileSaved: string;
      photoUpdated: string;
      prefsUpdated: string;
      passwordChanged: string;
      accountDeleted: string;
      genericError: string;
    };
    gate: {
      title: string;
      body: string;
      secondary: string;
    };
    loadError: {
      profile: { title: string; body: string };
      preferences: { title: string; body: string };
    };
    support: {
      intro: string;
      report: {
        title: string;
        sub: string;
        myTickets: string;
        openCount: string;
        openCountOne: string;
        noneOpen: string;
        nothingYet: string;
      };
      newTicket: string;
      backToTickets: string;
      loading: string;
      loadError: string;
      empty: {
        title: string;
        body: string;
      };
      category: {
        bug: string;
        question: string;
      };
      status: {
        open: string;
        inProgress: string;
        closed: string;
        reopened: string;
      };
      unreadAria: string;
      updated: string;
      new: {
        title: string;
        categoryLabel: string;
        messageLabel: string;
        messagePlaceholder: string;
        submit: string;
        submitting: string;
        cancel: string;
      };
      thread: {
        you: string;
        support: string;
        empty: string;
      };
      composer: {
        placeholder: string;
        send: string;
        sending: string;
        closedNote: string;
      };
      close: {
        action: string;
        confirmTitle: string;
        confirmBody: string;
        confirm: string;
        cancel: string;
      };
      toasts: {
        created: string;
        replySent: string;
        closed: string;
        error: string;
        ticketClosed: string;
      };
    };
  };
  saved: {
    title: string;
    heading: string;
    countSuffix: string;
    filtersLabel: string;
    unnamedPerson: string;
    refreshError: string;
    offline: string;
    offlineEmpty: string;
    tabs: {
      all: string;
      locations: string;
      people: string;
    };
    empty: {
      title: string;
      body: string;
      cta: string;
    };
    filteredEmpty: {
      location: string;
      person: string;
    };
    removed: string;
    undo: string;
    removeError: string;
    removeAria: string;
    gate: {
      title: string;
      body: string;
      cta: string;
      secondary: string;
    };
    loading: string;
    sectionError: string;
  };
  business: {
    back: string;
    showAllPhotos: string;
    tabServices: string;
    tabTeam: string;
    tabReviews: string;
    tabAbout: string;
    services: string;
    team: string;
    reviews: string;
    about: string;
    bundles: string;
    bundleSave: string;
    bundleTag: string;
    hours: string;
    location: string;
    address: string;
    otherLocations: string;
    priceFrom: string;
    add: string;
    remove: string;
    book: string;
    bookNow: string;
    bookN: string;
    bookNOne: string;
    bookHeading: string;
    bookRailEmpty: string;
    totalLabel: string;
    loadMoreReviews: string;
    loadMoreReviewsError: string;
    reviewsCount: string;
    reviewsCountOne: string;
    reviewsCountMany: string;
    onlineBookingUnavailable: string;
    closed: string;
    call: string;
    directions: string;
    seeOnMap: string;
    share: string;
    shareCopied: string;
    memberCopyLink: string;
    memberShareError: string;
    memberCopyError: string;
    close: string;
    continue: string;
    comingSoon: string;
    notFoundKicker: string;
    notFoundTitle: string;
    notFoundBody: string;
    backToExplore: string;
    browseBusinesses: string;
    memberStatYears: string;
    memberStatYearsOne: string;
    memberStatYearsMany: string;
    memberStatYearsLabel: string;
    memberStatVisitsLabel: string;
    memberStatSinceLabel: string;
    memberStatSince: string;
    memberSpeaks: string;
    memberSpecialties: string;
    memberPortfolio: string;
    memberShowAllReviews: string;
    memberSelectPrompt: string;
    memberBookWith: string;
    memberLoadError: string;
    memberUnavailable: string;
    memberContextLoadError: string;
    memberLocation: string;
    memberViewLocation: string;
    memberViewLocationAria: string;
    memberReviewsEmptyTitle: string;
    memberBookingDetailsUnavailable: string;
    memberRetry: string;
    memberPhotoAria: string;
    memberPhotoAlt: string;
    memberMetaDescription: string;
    memberClosePhotoAria: string;
    memberChooseVenue: string;
    memberNoBooking: string;
    memberNoBookingAtLocation: string;
    memberNoServicesHere: string;
    memberChecking: string;
    reviewsEmptyTitle: string;
    reviewsEmptyBody: string;
    servicesEmptyTitle: string;
    servicesEmptyBody: string;
    aboutBrand: string;
  };
  brandPage: {
    locationsTitle: string;
    locationsTitleOne: string;
    locationsCount: string;
    locationsCountOne: string;
    locationsCountMany: string;
    teamTitle: string;
    aboutTitle: string;
    since: string;
    viewLocation: string;
    worksAt: string;
  };
  booking: {
    stepServicesTitle: string;
    stepDateTimeTitle: string;
    stepReviewTitle: string;
    stepProgress: string;
    backToProfile: string;
    previousDates: string;
    nextDates: string;
    chooseDate: string;
    selectServicesEmpty: string;
    noAvailability: string;
    nextAvailable: string;
    jumpToNext: string;
    slotsCountLabel: string;
    slotsCountOne: string;
    dayClosed: string;
    dayFull: string;
    dayUnavailable: string;
    morning: string;
    afternoon: string;
    evening: string;
    fullyBookedDay: string;
    chooseTime: string;
    anyAvailable: string;
    staffChoiceRequired: string;
    staffLabel: string;
    staffAnyAt: string;
    staffAnyEach: string;
    staffAnyThis: string;
    staffOrChoose: string;
    staffPerService: string;
    staffSameForAll: string;
    staffSharedHint: string;
    serviceCount: string;
    serviceCountOne: string;
    dateLabel: string;
    todayLabel: string;
    confirmBooking: string;
    booking: string;
    signInToBook: string;
    successTitle: string;
    successBody: string;
    pendingTitle: string;
    pendingBody: string;
    viewAppointment: string;
    done: string;
    close: string;
    quoteChanged: string;
    cancellationUnavailable: string;
    reschedulingUnavailable: string;
    payAtVenueTitle: string;
    payAtVenueNote: string;
    reviewChange: string;
    reviewChangeVisit: string;
    reviewServicesTitle: string;
    reviewEditServices: string;
    staffAssigned: string;
    blockedScreen: {
      businessTitle: string;
      businessBody: string;
      bookingOffTitle: string;
      bookingOffBody: string;
      locationTitle: string;
      locationBody: string;
      serviceTitle: string;
      serviceBody: string;
      serviceBodyGeneric: string;
      noStaffTitle: string;
      noStaffBody: string;
      staffPinTitle: string;
      staffPinBody: string;
      anyProfessional: string;
      browseServices: string;
    };
    back: string;
    retry: string;
    loading: string;
    loadError: string;
    catalogLoadError: string;
    rebookError: string;
    rebookServiceGone: string;
    rebookServicesGone: string;
    rebookPartialGone: string;
    errors: {
      tooSoon: string;
      tooFar: string;
      slotConflict: string;
      outsideHours: string;
      calendarBlock: string;
      staffUnavailable: string;
      generic: string;
    };
  };
  common: {
    save: string;
    removeSaved: string;
    savedStatusLoading: string;
    savedStatusUnavailable: string;
    signIn: string;
    reviews: string;
    open: string;
    closed: string;
    open247: string;
    closesAt: string;
    photo: string;
  };
  errors: {
    generic: string;
    offline: string;
    offlineShort: string;
    timeout: string;
    server: string;
    rateLimit: string;
    rateLimitNoTime: string;
    sessionExpired: string;
    retry: string;
    signIn: string;
    pageKicker: string;
    pageTitle: string;
    pageBody: string;
    backHome: string;
    pageRecovery: {
      body: string;
      retrying: string;
      home: string;
    };
    sectionFailed: string;
    reload: string;
    dismiss: string;
    customer: {
      accountMissing: string;
      incorrectPassword: string;
      passwordGoogleLinked: string;
      imageTooLarge: string;
      imageType: string;
      favoriteGone: string;
      reviewNotCompleted: string;
      reviewAlreadyExists: string;
      reviewNoRating: string;
      reviewProfessional: string;
    };
  };
  nav: {
    explore: string;
    webStudio: string;
    forBusiness: string;
    signIn: string;
    search: string;
    account: string;
    notifications: string;
    homeAria: string;
  };
  searchPill: {
    what: string;
    where: string;
    when: string;
    anything: string;
    anyTime: string;
    defaultWhere: string;
    searchAria: string;
  };
  serviceCatalog: {
    title: string;
    close: string;
    description: string;
    industries: string;
    allIndustries: string;
    services: string;
    emptyTitle: string;
    emptyBody: string;
    loadError: string;
  };
  searchOverlay: {
    previewError: string;
    industriesError: string;
    citySearchError: string;
    overlayTitle: string;
    what: string;
    where: string;
    when: string;
    whatSummary: string;
    whatPlaceholder: string;
    browseByIndustry: string;
    seeAllIndustries: string;
    allInCategory: string;
    seeMoreTags: string;
    seeLessTags: string;
    useCurrentLocation: string;
    locationHint: string;
    locationEnabled: string;
    locationDenied: string;
    locationUnavailable: string;
    locationApproximate: string;
    searchCityPlaceholder: string;
    popularCities: string;
    recentSearches: string;
    clearRecents: string;
    recentLocations: string;
    searchingCities: string;
    noCityMatches: string;
    resolvingLocation: string;
    currentLocationFallback: string;
    whereSummaryCurrent: string;
    whereSummaryAny: string;
    dateAny: string;
    dateToday: string;
    dateTomorrow: string;
    pickDate: string;
    clearAll: string;
    searchAction: string;
    close: string;
    clearInput: string;
    prevMonth: string;
    nextMonth: string;
    resultsBusinesses: string;
    resultsPlaces: string;
    searching: string;
    noResults: string;
    keepTyping: string;
  };
  search: {
    inThisArea: string;
    resultCount: string;
    resultCountOne: string;
    updating: string;
    allServices: string;
    clearSelection: string;
    selectedServices: string;
    sortLabel: string;
    sortTopRated: string;
    sortNearest: string;
    filterAll: string;
    filterOpenNow: string;
    filterAvailableToday: string;
    emptyTitle: string;
    emptyBody: string;
    clearFilters: string;
    showOnMap: string;
    showList: string;
    loadMore: string;
    useMyLocation: string;
    recenterAria: string;
    searchThisArea: string;
    locationModalTitle: string;
    locationModalBody: string;
    locationModalAllow: string;
    locationModalSkip: string;
    retry: string;
    retryError: string;
    locationDenied: string;
    centeredOnLocation: string;
    closePinCard: string;
    mapUnavailable: string;
    pinListLabel: string;
    browseMore: string;
    sheetHandleAria: string;
    matchingBusinesses: string;
    resultsLimited: string;
    filters: {
      loadError: string;
      title: string;
      activeLabel: string;
      close: string;
      sortBy: string;
      minRating: string;
      any: string;
      distance: string;
      availability: string;
      openNow: string;
      open247: string;
      open247Help: string;
      features: string;
      showAllFeatures: string;
      showLess: string;
      reset: string;
      noMatchesCta: string;
      showPlaces: string;
      showPlacesOne: string;
      sections: {
        amenities: string;
        payment: string;
        languages: string;
      };
      sort: {
        closest: string;
        topRated: string;
        newest: string;
      };
    };
    editSearch: string;
  };
  // Industry / industry-tag display names, keyed by the stable API slug.
  // Backend `industry.name` / `industry_tag.name` are English; consumers look
  // up `dict.industries[slug] ?? industry.name` so an unmapped slug still
  // renders (the backend name) instead of breaking.
  /** Venue-tag display names, keyed by the stable API slug (see `venue-tags`). */
  venueTags: {
    amenities: Record<string, string>;
    paymentMethods: Record<string, string>;
    languages: Record<string, string>;
  };
  industries: Record<string, string>;
  industryTags: Record<string, string>;
  footer: {
    tagline: string;
    navigationLabel: string;
    explore: string;
    findBusiness: string;
    browseIndustries: string;
    support: string;
    journal: string;
    forBusiness: string;
    businessOverview: string;
    webStudio: string;
    pricing: string;
    businessSignIn: string;
    helpCentre: string;
    myAppointments: string;
    cancellation: string;
    privacy: string;
    terms: string;
    rights: string;
    cookieSettings: string;
    consumerProtection: string;
    alternativeDisputeResolution: string;
  };
  consent: {
    title: string;
    body: string;
    policyLink: string;
    accept: string;
    reject: string;
    close: string;
  };
  legal: {
    hubTitle: string;
    hubDescription: string;
    hubKicker: string;
    hubHeading: string;
    hubIntro: string;
    hubHelp: string;
    audienceGeneral: string;
    audienceCustomer: string;
    audienceBusiness: string;
    draftNotice: string;
    onThisPage: string;
    backToLegal: string;
    lastUpdated: string;
    readDocument: string;
    statusDraft: string;
    printDocument: string;
    relatedTitle: string;
  };
  accountMenu: {
    sessionError: string;
    appointments: string;
    saved: string;
    profileSettings: string;
    journal: string;
    helpSupport: string;
    forBusiness: string;
    webStudio: string;
    pricing: string;
    logout: string;
    loggedOut: string;
    login: string;
    welcome: string;
    loginOrSignUp: string;
  };
  notifications: {
    loading: string;
    refreshError: string;
    loadMoreError: string;
    title: string;
    markAllRead: string;
    loadMore: string;
    unreadLabel: string;
    unreadAria: string;
    errorTitle: string;
    errorBody: string;
    emptyTitle: string;
    emptyBody: string;
  };
  mobileTabs: {
    explore: string;
    search: string;
    appointments: string;
    saved: string;
    help: string;
  };
  toast: {
    signedOut: string;
  };
  breadcrumbHome: string;
  localeNames: Record<Locale, string>;
  language: { label: string; loading: string; unavailable: string };
  tryStudio: {
    pageTitle: string;
    pageDescription: string;
    demo: string;
    back: string;
    customize: string;
    closeCustomization: string;
    shuffle: string;
    cta: string;
    previous: string;
    reset: string;
    copyLink: string;
    copied: string;
    copyError: string;
    allLocked: string;
    locksLabel: string;
    dimension: { layout: string; colour: string; type: string };
    lock: { layout: string; colour: string; type: string };
    locked: { layout: string; colour: string; type: string };
    section: string;
    showSection: string;
    noExampleReviews: string;
    style: string;
    font: string;
    colour: string;
    example: string;
    stylesNote: string;
    trialNote: string;
    demoFeedback: string;
    previewLabel: string;
    fontNames: Record<string, string>;
    accentNames: Record<string, string>;
  };
  webStudio: {
    pageTitle: string;
    pageDescription: string;
    hero: {
      titleLead: string;
      titleBridge: string;
      titleAccent: string;
      lead: string;
      demoCta: string;
    };
    showcase: {
      title: string;
      previewLink: string;
      stylesNote: string;
      examples: Record<"fitness" | "pets" | "music" | "wellness" | "automotive", { body: string; previewAlt: string }>;
    };
    connected: {
      title: string;
      features: { title: string; body: string }[];
      artwork: {
        business: string;
        service: string;
        price: string;
        duration: string;
        member: string;
        location: string;
        team: string;
        services: string;
        book: string;
        calendar: string;
        day: string;
        time: string;
      };
    };
    setup: {
      title: string;
      lead: string;
      editorAlt: string;
      phoneAlt: string;
      steps: { title: string; body: string }[];
      note: string;
      demoLink: string;
    };
    publishing: {
      title: string;
      lead: string;
      planName: string;
      perMonth: string;
      owner: string;
      features: string[];
      cta: string;
      trialNote: string;
      stylesTitle: string;
      stylesBody: string;
      stylePrice: string;
      pricingLink: string;
      demoLink: string;
      signInLink: string;
    };
    faq: {
      title: string;
      lead: string;
      helpPrompt: string;
      helpLink: string;
      items: { q: string; a: string; helpLink?: string }[];
    };
  };
  businessMarketing: {
    signIn: string;
    signInPrompt: string;
    trialCta: string;
    trialDays: string;
    noCard: string;
    helpLink: string;
    counts: {
      days: { one: string; few: string; other: string };
      locations: { one: string; few: string; other: string };
      teamMembers: { one: string; few: string; other: string };
    };
    plans: {
      perMonth: string;
      upTo: string;
      teamLimit: string;
      unlimitedTeam: string;
      unavailable: string;
      baseLimitNotice: string;
      subscription: string;
      memberPrice: string;
      totalFor: string;
      justYou: string;
      youAnd: string;
      announcement: string;
      base: {
        name: string;
        line: string;
        note: string;
        features: string[];
      };
      plus: {
        name: string;
        tag: string;
        line: string;
        note: string;
        features: string[];
      };
    };
    fine: {
      currency: string;
      currencyNames: { RON: string; EUR: string };
      noSetup: string;
      sms: string;
      compare: string;
      bigger: string;
    };
  };
  forBusiness: {
    pageTitle: string;
    pageDescription: string;
    hero: {
      titleLead: string;
      titlePre: string;
      titleAccent: string;
      lead: string;
      trialCta: string;
      pricingLink: string;
      noCommission: string;
      streetLabel: string;
      support: string;
    };
    benefits: {
      label: string;
      trial: string;
      noCard: string;
      noCommission: string;
    };
    found: {
      title: string;
      lead: string;
      cta: string;
      points: { title: string; body: string }[];
      artwork: {
        desktopAlt: string;
        mobileAlt: string;
      };
    };
    run: {
      title: string;
      lead: string;
      features: { title: string; body: string }[];
      artwork: {
        desktopAlt: string;
        mobileAlt: string;
      };
    };
    app: {
      titleLead: string;
      titlePre: string;
      titleAccent: string;
      lead: string;
      features: { title: string; body: string }[];
      webLink: string;
      platformsLabel: string;
      downloadTitle: string;
      downloadDescription: string;
      assignmentsAlt: string;
      marketplaceAlt: string;
    };
    life: {
      title: string;
      lead: string;
      scheduleAlt: string;
      steps: { title: string; body: string }[];
    };
    studio: {
      planLabel: string;
      title: string;
      lead: string;
      features: { title: string; body: string }[];
      link: string;
      note: string;
      desktopAlt: string;
      phoneAlt: string;
    };
    plans: {
      title: string;
      lead: string;
      ownerIncluded: string;
      additionalTeamMembers: { one: string; few: string; other: string };
      memberPrice: string;
      baseDescription: string;
      plusDescription: string;
      plusBenefitsTitle: string;
      baseBenefits: { title: string; body: string; studioLink?: string }[];
      plusBenefits: { title: string; body: string; studioLink?: string }[];
      trialCta: { base: string; plus: string };
      trialNotes: { base: string; plus: string };
    };
    faq: {
      title: string;
      aside: string;
      helpPrompt: string;
      helpLink: string;
      items: { q: string; a: string }[];
    };
    close: {
      titleLead: string;
      titlePre: string;
      titleAccent: string;
      lead: string;
    };
  };
  pricing: {
    pageTitle: string;
    pageDescription: string;
    hero: {
      titleLead: string;
      titlePre: string;
      titleAccent: string;
      lead: string;
      memberPrice: string;
    };
    billing: {
      currencyNote: string;
      terms: string;
      larger: string;
      helpLink: string;
    };
    compare: {
      title: string;
      lead: string;
      baseSummary: string;
      plusSummary: string;
      upTo: string;
      unlimited: string;
      paidMemberNote: string;
      caption: string;
      feature: string;
      locations: string;
      teamMembers: string;
      website: string;
      websiteBase: string;
      websitePlus: string;
    };
    included: {
      title: string;
      lead: string;
      groups: {
        title: string;
        items: string[];
      }[];
    };
    addons: {
      title: string;
      lead: string;
      studioLink: string;
      items: {
        title: string;
        body: string;
        availability: string;
      }[];
    };
    faq: {
      title: string;
      lead: string;
      helpPrompt: string;
      helpLink: string;
      items: {
        q: string;
        a: string;
      }[];
    };
    plansLabel: string;
  };
  appointments: {
    title: string;
    upcomingWord: string;
    pastWord: string;
    filters: {
      all: string;
      upcoming: string;
      past: string;
      cancelled: string;
      noShow: string;
    };
    sectionUpcoming: string;
    finishedLabels: {
      cancelled: string;
      noShow: string;
      completed: string;
      past: string;
    };
    stamps: {
      cancelled: string;
      noShow: string;
      pending: string;
      live: string;
    };
    timeUntil: {
      live: string;
      awaiting: string;
      starting: string;
      tomorrow: string;
      inMinutes: string;
      inHours: string;
      inDaysOne: string;
      inDaysMany: string;
      inWeeksOne: string;
      inWeeksMany: string;
      inMonthsOne: string;
      inMonthsMany: string;
    };
    free: string;
    loadMore: string;
    loadMoreError: string;
    loading: string;
    errorLoading: string;
    retry: string;
    notes: {
      upcomingEmpty: string;
      pastEmpty: string;
      cancelledEmpty: string;
      noShowEmpty: string;
    };
    empty: {
      title: string;
      body: string;
      cta: string;
    };
    gate: {
      title: string;
      body: string;
      cta: string;
      secondary: string;
    };
  };
  appointmentDetail: {
    back: string;
    atBusiness: string;
    sections: {
      where: string;
      service: string;
      services: string;
      note: string;
      with: string;
      yourReview: string;
      about: string;
    };
    bundleTag: string;
    subtotal: string;
    bundleDiscount: string;
    totalAtVenue: string;
    payDirectly: string;
    free: string;
    awaitingConfirmation: string;
    awaitingConfirmationBody: string;
    inProgress: string;
    endingNow: string;
    oneMinLeft: string;
    minsLeft: string;
    visitOfTotal: string;
    finalVisit: string;
    nextOn: string;
    viewVenue: string;
    viewProfile: string;
    viewBrand: string;
    edit: string;
    viewMap: string;
    callVenue: string;
    leaveReview: string;
    openApp: string;
    bookAgain: string;
    reschedule: string;
    rescheduleUnavailable: string;
    rescheduleWindowPassed: string;
    contactBusinessDirectly: string;
    cancelAppointment: string;
    cancelUnavailable: string;
    cancelWindowPassed: string;
    youMissedAppointment: string;
    cancelledTitle: string;
    bookedOn: string;
    relative: {
      inProgress: string;
      today: string;
      tomorrow: string;
      inDays: string;
    };
    bookedVia: {
      zavoia: string;
      direct: string;
      admin: string;
    };
    recurringPlan: string;
    status: {
      inProgress: string;
      cancelled: string;
      noShow: string;
      completed: string;
      pending: string;
      confirmed: string;
    };
    signedOutTitle: string;
    signedOutBody: string;
    explorePlaces: string;
    notFound: string;
    backToAppointments: string;
    loading: string;
    errorLoading: string;
  };
  help: {
    pageTitle: string;
    pageDescription: string;
    head: {
      kicker: string;
      title: string;
      sub: string;
    };
    searchPlaceholder: string;
    allLabel: string;
    resultsLabel: string;
    noResults: string;
    topics: {
      id: string;
      icon: string;
      label: string;
      items: { q: string; a: string }[];
    }[];
    goodToKnow: {
      title: string;
      items: { label: string; href: string[] }[];
    };
    report: {
      title: string;
      sub: string;
      cta: string;
      modal: {
        title: string;
        intro: string;
        titleLabel: string;
        titlePlaceholder: string;
        emailLabel: string;
        emailPlaceholder: string;
        messageLabel: string;
        messagePlaceholder: string;
        submit: string;
        cancel: string;
        error: string;
        errorRateLimit: string;
        success: {
          title: string;
          body: string;
          reference: string;
          done: string;
        };
      };
    };
  };
  appointmentActions: {
    cancel: {
      title: string;
      keep: string;
      confirm: string;
      successToast: string;
      error: string;
      windowPassed: string;
      notAllowed: string;
      alreadyCancelled: string;
      noLongerCancellable: string;
    };
    reschedule: {
      title: string;
      sub: string;
      currentNote: string;
      dateLabel: string;
      pickSlot: string;
      newTimeLabel: string;
      confirm: string;
      successToast: string;
      error: string;
      windowPassed: string;
      notAllowed: string;
      alreadyStarted: string;
      noLongerReschedulable: string;
      unsupported: string;
    };
    review: {
      titleNew: string;
      titleEdit: string;
      sub: string;
      publicNote: string;
      submitNew: string;
      submitEdit: string;
      noteLabel: string;
      includeEveryone: string;
      back: string;
      continue: string;
      skip: string;
      stepAria: string;
      labelPoor: string;
      labelFair: string;
      labelGood: string;
      labelGreat: string;
      labelExceptional: string;
      successNew: string;
      successEdit: string;
      businessLabel: string;
      professionalLabel: string;
      starsAria: string;
      error: string;
    };
  };
  notFound: {
    page: {
      skip: string;
      navigation: string;
      language: string;
      signIn: string;
      signInShort: string;
      businessTitle: string;
      businessTitleLead: string;
      businessTitlePre: string;
      businessTitleWord: string;
      businessTitlePost: string;
      createAccount: string;
      offerFirst: string;
      offerSecond: string;
      businessDescription: string;
      trialDetail: string;
      websiteDetail: string;
      how: string;
      lost: string;
      title: string;
      description: string;
      explore: string;
    };

  };
} = {
  locationPage: locationPageEn,
  appointmentPage: appointmentPageEn,
  textarea: textareaEn,
  imageViewer: { unavailable: "This photo couldn't be loaded." },
  marketingExamples: {
    websites: "The businesses in these website examples are fictional.",
    product: "Product previews use fictional businesses and sample data.",
    improveMap: "Improve this map",
  },
  preposition: "in",
  home: {
    title: "Zavoia — Discover Local Services & Book Online",
    description:
      "Discover local businesses across beauty, wellness, automotive and more. Compare services, see available times and book your next appointment online with Zavoia.",
    heading: "Zavoia — Discover Local Services & Book Online",
    intro:
      "Discover local businesses across industries, compare services and book your next appointment online.",
    heroTagline: "Local appointments, made simple.",
  },
  homeSections: {
    hero: {
      headlineLead: "Local services.",
      headlineAccent: "On your schedule.",
      subcopy:
        "Zavoia brings local businesses and online booking together. From haircuts to car inspections, find a service and choose your time.",
      searchTryPrefix: "Try",
      searchAria: "Search",
      prompts: [
        "balayage near me",
        "a deep-tissue massage tonight",
        "the best barber in town",
        "gel nails this weekend",
        "a dental check-up near me",
      ],
    },
    categories: {
      kicker: "Browse",
      title: "What are you looking for?",
    },
    inCity: {
      kicker: "Around town",
      title: "In your city",
      action: "See all",
      showMore: "Show more places",
      locating: "Finding your city…",
      empty: "New places are joining all the time — check back soon.",
    },
    brands: {
      kicker: "Discover",
      title: "Brands",
      action: "See all",
      empty: "Brands will show up here soon — check back.",
    },
    nearYou: {
      kicker: "Near you",
      title: "Nearby",
      action: "See on map",
      showMore: "Show more places",
      locating: "Finding places near you…",
    },
    recentlyViewed: {
      loading: "Loading recently viewed places…",
      kicker: "Pick up where you left off",
      title: "Recently viewed",
    },
    websiteShowcase: {
      title: "Made with Web Studio",
      sub: "See what your business could look like online.",
      cta: "Explore Web Studio",
      viewWebsite: "View website",
      prev: "Previous",
      next: "Next",
    },
    trust: {
      title: "Booking with Zavoia",
      items: [
        {
          title: "Find local services",
          sub: "Browse businesses and choose the service you need.",
        },
        {
          title: "Book online",
          sub: "See available times and choose one that works for you.",
        },
        {
          title: "Pay at the venue",
          sub: "Pay the business directly when you visit.",
        },
      ],
    },
    app: {
      titleFirst: "Your appointments,",
      titleSecond: "always with ",
      titleAccent: "you.",
      sub: "Book on the go and keep track of your appointments in the Zavoia app.",
      appStore: "App Store",
      googlePlay: "Google Play",
      ios: "For iOS",
      android: "For Android",
      scheduleAlt: "The Zavoia app showing upcoming and past example appointments, with services, times, prices and businesses.",
      mapAlt: "The Zavoia app’s map with industry pins for example businesses in Bucharest.",
      downloadsLabel: "Zavoia app",
    },
    webStudio: {
      titleFirst: "Your business.",
      titleSecond: "Your ",
      titleAccent: "website.",
      sub: "Choose your design. Your services, prices and team details come directly from Zavoia.",
      cta: "Explore Web Studio",
      phoneAlt: "The Paw & Co pet-care website, built with Zavoia Web Studio, displayed on an angled iPhone.",
      desktopAlt: "Lumi Beauty’s salon gallery, using Web Studio’s native Carousel layout.",
    },
    bizStrip: {
      titleFirst: "Get found.",
      titleSecond: "Get",
      titleAccent: "booked.",
      sub: "Reach local clients. Manage appointments and your team in one place.",
      commission: "No booking commission.",
      cta: "Zavoia for business",
      pricing: "View pricing",
    },
    favorites: {
      saved: "Saved",
      removed: "Removed from Saved",
      savePrompt: "Sign in to save",
    },
  },
  header: {
    home: "Home",
    authentication: "Authentication",
    account: "My account",
    accountAriaLabel: "Go to my account",
  },
  industryDirectory: {
    breadcrumbLabel: "Breadcrumb",
    filterLabel: "Find an industry or service",
    filterPlaceholder: "Try hair, massage or car wash",
    clearSearch: "Clear search",
    resultsOne: "{count} industry",
    resultsMany: "{count} industries",
    noResultsTitle: "No matching industries or services",
    noResultsBody: "Try a different word, or clear your search to explore all industries.",
    pageTitle: "Explore all industries",
    pageDescription: "Browse industries and services on Zavoia. Find local businesses and book your next appointment.",
    heading: "All industries",
    intro: "Choose an industry or service for your next appointment.",
    indexLabel: "Industries",
    viewIndustryLabel: "Explore {industry}",
    emptyTitle: "No industries to show yet",
    emptyBody: "You can still explore businesses on Zavoia.",
    byCityHeading: "Industries by city",
  },
  category: {
    titleTemplate: "{industry} in {city}",
    descriptionTemplate:
      "Explore {industryLower} in {city}. View businesses, compare services and prices, and book an appointment on Zavoia.",
    heading: "{industry} in {city}",
    intro: "Check reviews and opening hours, then explore services, prices and appointment options.",
    resultsHeading: {
      one: "{count} location in {city}",
      few: "{count} locations in {city}",
      other: "{count} locations in {city}",
    },
    resultsShowing: "Showing {count} of {total}",
    viewAllResults: "View all results on the map",
    emptyTitle: "No matching businesses",
    emptyBody: "Try another industry or service below, or explore other businesses in {city}.",
    exploreCity: "Explore {city}",
    seeAll: "View on map",
    servicesHeading: "Explore services in {city}",
    otherCitiesHeading: "{industry} in other cities",
    otherCitiesIntro: "Search for {industry} in another city. Results depend on the businesses listed there.",
    otherIndustriesHeading: "Other industries in {city}",
    exploreIndustriesHeading: "Explore industries in {city}",
    relatedServicesHeading: "More to explore in {city}",
  },
  blog: {
    listTitle: "Blog — Zavoia",
    listDescription:
      "Guides, tips and news about local services across Romania.",
    listHeading: "Blog",
    listIntro:
      "Guides, tips and news about local services across Romania.",
    empty: "No posts published yet. Check back soon.",
    readMore: "Read more",
    backToList: "Back to blog",
    kicker: "The Journal",
    heading: "Notes from the neighbourhood",
    intro:
      "Guides for booking well, playbooks for the businesses being booked, and what's new on Zavoia.",
    updatedWeekly: "Updated weekly",
    storiesLabel: "stories",
    latestStory: "Latest story",
    readStory: "Read story",
    catAll: "All",
    catGuides: "Guides",
    catBusiness: "For business",
    catProduct: "Product news",
    breadcrumbJournal: "Journal",
    pageLabel: "Page",
    ofLabel: "of",
    prev: "Prev",
    next: "Next",
    inThisArticle: "In this article",
    faqTitle: "Frequently asked questions",
    keepReading: "Keep reading",
    relatedStories: "Related stories",
    allStories: "All stories",
    moreFromJournal: "More from the Journal",
    nothingHere: "Nothing here yet.",
    copyLink: "Copy link",
    linkCopied: "Link copied to clipboard",
    shareLabel: "Share",
    backToTop: "Back to top",
  },
  auth: {
    pageTitle: "Sign in or create an account — Zavoia",
    pageDescription:
      "Sign in to your Zavoia account or create a new one to book services.",
    tabLogin: "Sign in",
    tabRegister: "Create account",
    loginTitle: "Sign in — Zavoia",
    loginHeading: "Welcome back",
    loginSubtitle: "Sign in with your email and password.",
    loginSubmit: "Sign in",
    loginSubmitting: "Signing in...",
    noAccountPrompt: "Don't have an account?",
    goToRegister: "Create one",
    registerTitle: "Create account — Zavoia",
    registerHeading: "Create your Zavoia account",
    registerSubtitle:
      "Register to book services and manage your account.",
    registerSubmit: "Create account",
    registerSubmitting: "Creating account...",
    haveAccountPrompt: "Already have an account?",
    goToLogin: "Sign in",
    googleDivider: "or",
    businessSignIn: {
      title: "Zavoia Business",
      description: "Manage your appointments, clients and team.",
      cta: "Business sign in",
    },
    terms: {
      agreementPrefix: "I agree to the",
      termsLink: "Terms and Conditions",
      cookiesLink: "Cookie Policy",
      and: "and",
      privacyLink: "Privacy Policy",
      required: "You must accept the terms to continue.",
      continueNotice: "By continuing, you agree to our",
    },
    fields: {
      email: "Email",
      password: "Password",
      firstName: "First name",
      lastName: "Last name",
      phone: "Phone",
      phoneOptional: "Phone (optional)",
      showPassword: "Show password",
      hidePassword: "Hide password",
    },
    errors: {
      generic: "Something went wrong. Please try again.",
      invalidCredentials: "Incorrect email or password.",
      googleAccountHint:
        'Signed up with Google? Use "Google" below.',
      emailInvalid: "Enter a valid email address.",
      emailRequired: "Email is required.",
      passwordRequired: "Password is required.",
      passwordTooShort: "Password must be at least 8 characters.",
      passwordWeak:
        "Password must include lowercase, uppercase, digit and a special character.",
      firstNameRequired: "First name is required.",
      lastNameRequired: "Last name is required.",
      nameTooShort: "Must be at least 2 characters.",
      nameTooLong: "Must be 32 characters or fewer.",
      nameNeedsLetter: "Must include at least one letter.",
      phoneInvalid: "Phone number is not valid.",
      emailAlreadyRegistered: "Email already in use.",
      googleEmailMismatch:
        "That Google account's email doesn't match your account email.",
      googleNotLinked: "No Google account is linked to your account.",
      googleUnlinkNoPassword:
        "Set a password before disconnecting Google, so you can still sign in.",
      incorrectPassword: "Incorrect password.",
      emailTaken: "That email is already in use.",
      currentEmailMismatch: "Your current email doesn't match.",
      sameEmail: "New email must be different from your current one.",
      resetLinkInvalid: "This link is invalid or has already been used.",
      resetLinkExpired: "This link has expired.",
      userNotFound: "We couldn't find this account.",
      googleLinkExpired:
        "This Google sign-in has expired. Go back and continue with Google again.",
      googleLinkVerifyAgain:
        "We couldn't confirm your password in time. Enter it again to continue.",
      googleEmailUnverified:
        "Your Google account's email isn't verified. Verify it with Google, or create an account with your email and a password.",
      linkCheckFailedHeading: "We couldn't check this link",
      linkCheckFailedBody:
        "That's a problem on our side, not with your link — it may still be perfectly good. Please try again.",
    },
    passwordStrength: {
      label: "Password strength",
      met: "Met",
      unmet: "Not met",
      ratings: {
        veryWeak: "Very weak",
        weak: "Weak",
        fair: "Fair",
        strong: "Strong",
        veryStrong: "Very strong",
        excellent: "Excellent",
      },
      rules: {
        minLength: "At least 8 characters",
        lowercase: "At least one lowercase letter (a–z)",
        uppercase: "At least one uppercase letter (A–Z)",
        number: "At least one number (0–9)",
        special: "At least one special character (e.g. #, @, !, %)",
      },
    },
    enableAccess: {
      heading: "Use your existing Zavoia account",
      emailLabel: "Account email",
      explanation:
        "Book services with the Zavoia account you already use for business.",
      nextStep:
        "Request a confirmation link by email, then open it to confirm it’s you.",
      sendLink: "Send confirmation link",
      sending: "Sending link…",
      sentHeading: "Check your email",
      sentBody:
        "If this email belongs to a business account that needs confirmation, look for a link in your inbox. Open it to confirm it’s you and start booking.",
      spamHint: "Check your spam folder too.",
      alreadyRequestedHeading: "A link was already requested",
      alreadyRequestedBody:
        "A confirmation link is still active for this account. Check your inbox. You can request another after it expires.",
      error: "We couldn't send the link. Please try again.",
      cancel: "Return to sign in",
    },
    googleLink: {
      heading: "Link your Google account",
      explanation:
        "An account with {email} already exists. Enter your password to link Google sign-in to it.",
      explanationNoEmail:
        "An account with this email already exists. Enter your password to link Google sign-in to it.",
      submit: "Link account",
      submitting: "Linking...",
      cancel: "Back to sign in",
      error: "We couldn't link your account. Check your password and try again.",
    },
    googleCallback: {
      pageTitle: "Signing you in with Google — Zavoia",
      completing: "Completing Google sign-in...",
      invalid:
        "This sign-in attempt is invalid or has expired. Please try again.",
      errorHeading: "Google sign-in failed",
      backToSignIn: "Back to sign in",
      backToAccount: "Back to account settings",
    },
    confirmAccess: {
      heading: "Enable marketplace access?",
      greeting: "Hi {name},",
      explanation:
        "Your Google account is already connected to a Zavoia business account ({email}). Enable marketplace access to also browse and book services with this account — no new account needed.",
      confirm: "Enable marketplace access",
      confirming: "Enabling...",
      cancel: "Back to sign in",
      error:
        "We couldn't enable marketplace access — the confirmation may have expired. Please sign in with Google again.",
    },
    verifyLink: {
      pageTitle: "Enable marketplace access — Zavoia",
      pageDescription: "Confirm marketplace access for your Zavoia account.",
      verifying: "Checking your link...",
      confirmHeading: "Confirm it's you",
      accountLabel: "Your account",
      confirmBody:
        "Enter your account password to enable marketplace access.",
      googleOnlyBody:
        "This account uses Google sign-in. Continue with Google to enable marketplace access.",
      passwordLabel: "Password",
      passwordRequired: "Please enter your password.",
      wrongPassword: "Incorrect password. Please try again.",
      confirm: "Enable marketplace access",
      confirming: "Confirming...",
      orDivider: "or",
      successHeading: "Marketplace access enabled",
      successBody:
        "You're signed in and ready to book services on Zavoia.",
      continueCta: "Start exploring",
      errorHeading: "This link can't be used",
      errorBody:
        "The link is invalid or has expired. Please request a new one from the sign-in page.",
      backToLogin: "Back to sign in",
    },
    forgotPasswordLink: "Forgot password?",
    verifyEmail: {
      pageTitle: "Verify your email — Zavoia",
      pageDescription: "Confirm your email address for your Zavoia account.",
      verifying: "Verifying your email...",
      successHeading: "Email verified",
      successBody:
        "Your email address has been confirmed. Sign in to start booking services.",
      goToLogin: "Sign in",
      errorHeading: "This link can't be used",
      errorBody:
        "The link is invalid or has expired. Please request a new one from the sign-in page.",
      backToLogin: "Back to sign in",
    },
    resendVerification: {
      action: "Send a new link",
      sent: "If that account exists and isn't verified yet, a new verification link is on its way.",
      failed: "Couldn't send the link. Please try again.",
      retryIn: "Try again in {seconds}s",
      limitReached: "You've reached the limit for new links. Try again later.",
      unverifiedTitle: "Verify your email",
      unverifiedBody:
        "We sent a link to your inbox. Verify your email to receive appointment updates and reminders.",
    },
    forgotPassword: {
      pageTitle: "Reset your password — Zavoia",
      pageDescription: "Request a link to reset your Zavoia account password.",
      heading: "Forgot your password?",
      subtitle:
        "Enter your email and we'll send you a link to reset your password.",
      submit: "Send reset link",
      submitting: "Sending...",
      sentHeading: "Check your email",
      sentBody:
        "If an account exists for that email, we've sent a link to reset your password.",
      backToLogin: "Back to sign in",
    },
    resetPassword: {
      pageTitle: "Set a new password — Zavoia",
      pageDescription: "Choose a new password for your Zavoia account.",
      heading: "Set a new password",
      subtitle: "Choose a strong new password for your account.",
      newPassword: "New password",
      confirmPassword: "Confirm password",
      submit: "Reset password",
      submitting: "Resetting...",
      successHeading: "Password updated",
      successBody:
        "Your password has been changed. Sign in with your new password.",
      goToLogin: "Sign in",
      missingTokenHeading: "This link can't be used",
      missingTokenBody:
        "The link is invalid or has expired. Please request a new one from the sign-in page.",
      backToLogin: "Back to sign in",
      mismatch: "Passwords do not match.",
      confirmRequired: "Please confirm your password.",
      requestNewLink: "Request a new link",
    },
  },
  account: {
    title: "My account — Zavoia",
    heading: "My account",
    loading: "Loading...",
    fields: {
      email: "Email address",
      firstName: "First name",
      lastName: "Last name",
      phone: "Phone number",
      phoneEmpty: "Not provided",
      dateOfBirth: "Date of birth",
      address: "Address",
      addressCountry: "Country",
      addressCity: "City",
      addressStreet: "Street",
      addressNumber: "Number",
      addressMentions: "Mentions",
      addressMentionsPlaceholder: "Building, floor, apartment…",
      addressEmpty: "Not provided",
    },
    errors: {
      addressTooLong: "Must be fewer than {max} characters.",
    },
    logout: "Log out",
    loggingOut: "Logging out...",
    sections: {
      profile: "Profile",
      personalDetails: "Personal details",
      notifications: "Notifications",
      security: "Login & security",
      dangerZone: "Danger zone",
      password: "Password",
      support: "Support",
    },
    sectionNav: {
      personal: "Personal info",
      preferences: "Preferences",
      security: "Login & security",
      support: "Support",
    },
    sectionTitles: {
      personal: "Personal information",
      preferences: "Preferences",
      security: "Login & security",
      support: "Support",
    },
    preferencesSub: "Choose how you want to be notified.",
    hubGroupLabel: "Profile & account",
    backAria: "Back",
    buttons: {
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",
      changePassword: "Change password",
      changePhoto: "Change photo",
      deleteAccount: "Delete account",
    },
    stats: {
      unavailable: "Unavailable",
      loadError: "We couldn’t load your account statistics.",
      appointments: "Appointments",
      reviews: "Reviews",
      saved: "Saved",
      memberSince: "Member since {date}",
    },
    verifiedPill: "Email verified",
    unverifiedPill: "Email not verified",
    notif: {
      marketing: "Marketing",
      marketingCaption:
        "Receive updates about promotions, offers, and new features.",
      reminders: "Reminders",
      remindersCaption: "Get reminded about your upcoming appointments.",
      push: "Push",
      sms: "SMS",
      email: "Email",
    },
    password: {
      current: "Current password",
      new: "New password",
      confirm: "Confirm new password",
      rules:
        "At least 8 characters, with a lowercase and an uppercase letter, a number and a special character.",
      tooShort: "Password must be at least 8 characters.",
      weak:
        "Password must include lowercase, uppercase, digit and a special character.",
      mismatch: "Passwords do not match.",
      manageHint: "Click here to manage your password",
    },
    googleConnection: {
      title: "Google",
      connected: "Connected",
      notConnected: "Not connected",
      connectCaption: "Connect your Google account for faster sign-in.",
      connectedCaption: "You can sign in with Google.",
      connect: "Connect",
      disconnect: "Disconnect",
      disconnecting: "Disconnecting…",
      passwordPrompt: "Enter your password to disconnect Google.",
      passwordLabel: "Password",
      confirmDisconnect: "Disconnect",
      cancel: "Cancel",
      connectedToast: "Google connected",
      disconnectedToast: "Google disconnected",
    },
    changeEmail: {
      title: "Email address",
      caption:
        "Update the email you use to sign in. We'll notify both your old and new address when you confirm the change.",
      currentValueLabel: "Current",
      currentLabel: "Current email",
      currentPlaceholder: "Enter your current email",
      newLabel: "New email",
      newPlaceholder: "Enter your new email",
      submit: "Update email",
      submitting: "Updating…",
      cancel: "Cancel",
      manageHint: "Click here to change your email",
      invalidEmail: "Enter a valid email address.",
      verifiedLabel: "Verified",
      changedToast: "Email updated",
    },
    danger: {
      caption: "Permanently delete your account and all of its data.",
      confirmTitle: "Delete your account?",
      confirmBody:
        "This permanently deletes your account and all of your data. This action cannot be undone.",
      confirm: "Delete account",
      cancel: "Cancel",
    },
    toasts: {
      profileSaved: "Profile updated",
      photoUpdated: "Photo updated",
      prefsUpdated: "Preferences updated",
      passwordChanged: "Password changed",
      accountDeleted: "Account deleted",
      genericError: "Something went wrong. Please try again.",
    },
    gate: {
      title: "Your profile lives here.",
      body: "Sign in to manage your details, notifications and security.",
      secondary: "Explore places",
    },
    loadError: {
      profile: {
        title: "We couldn't load your details",
        body: "Try again to load your account information, or choose another account section.",
      },
      preferences: {
        title: "We couldn't load your preferences",
        body: "Try again to view and update your notification preferences.",
      },
    },
    support: {
      intro:
        "Issues you've reported to our team. Track replies and reply back here.",
      report: {
        title: "Report an issue",
        sub: "We look into every report, usually within a few hours",
        myTickets: "My tickets",
        openCount: "{count} open",
        openCountOne: "1 open",
        noneOpen:
          "Nothing open right now — your past tickets are saved in your inbox.",
        nothingYet:
          "Nothing to report? All good. If something goes wrong, open a ticket and we'll sort it.",
      },
      newTicket: "Report an issue",
      backToTickets: "All tickets",
      loading: "Loading your tickets...",
      loadError: "Couldn't load your tickets. Please try again.",
      empty: {
        title: "No tickets yet",
        body: "Run into a problem or have a question? Let us know and we'll get back to you here.",
      },
      category: {
        bug: "Bug",
        question: "Question",
      },
      status: {
        open: "Open",
        inProgress: "In progress",
        closed: "Closed",
        reopened: "Reopened",
      },
      unreadAria: "Unread reply",
      updated: "Updated {date}",
      new: {
        title: "Report an issue",
        categoryLabel: "What's this about?",
        messageLabel: "Tell us what happened",
        messagePlaceholder: "Describe the issue or question in a few sentences…",
        submit: "Submit ticket",
        submitting: "Submitting…",
        cancel: "Cancel",
      },
      thread: {
        you: "You",
        support: "Zavoia Support",
        empty: "No messages yet.",
      },
      composer: {
        placeholder: "Write a reply…",
        send: "Send",
        sending: "Sending…",
        closedNote: "This ticket is closed. Report a new issue if you need further help.",
      },
      close: {
        action: "Close ticket",
        confirmTitle: "Close this ticket?",
        confirmBody:
          "You can still view this conversation afterwards, but you won't be able to reply unless you open a new ticket.",
        confirm: "Close ticket",
        cancel: "Cancel",
      },
      toasts: {
        created: "Ticket submitted",
        replySent: "Reply sent",
        closed: "Ticket closed",
        error: "Something went wrong. Please try again.",
        ticketClosed:
          "This ticket is closed. Open a new one to continue.",
      },
    },
  },
  saved: {
    title: "Saved",
    heading: "Saved",
    countSuffix: "saved",
    filtersLabel: "Filter saved items",
    unnamedPerson: "Professional",
    refreshError: "Couldn't refresh your saved items. Your last saved list is still shown.",
    offline: "You’re offline. Your saved items will refresh when you reconnect.",
    offlineEmpty: "Connect to the internet to see your saved items.",
    tabs: {
      all: "All",
      locations: "Locations",
      people: "People",
    },
    empty: {
      title: "Nothing saved yet",
      body: "Save any place or professional with the heart and it stays here for your next booking.",
      cta: "Explore places",
    },
    filteredEmpty: {
      location: "No locations saved yet.",
      person: "No people saved yet.",
    },
    removed: "Removed · {name}",
    undo: "Undo",
    removeError: "Something went wrong. Please try again.",
    removeAria: "Remove {name} from saved",
    gate: {
      title: "Saved",
      body: "Sign in to see what you’ve saved.",
      cta: "Sign in",
      secondary: "Explore",
    },
    loading: "Loading your saved items…",
    sectionError: "Couldn't load your saved items.",
  },
  business: {
    back: "Back",
    showAllPhotos: "Show all photos",
    tabServices: "Services",
    tabTeam: "Team",
    tabReviews: "Reviews",
    tabAbout: "About",
    services: "Services",
    team: "Team",
    reviews: "Reviews",
    about: "About",
    bundles: "Bundles",
    bundleSave: "Save",
    bundleTag: "Bundle",
    hours: "Opening hours",
    location: "Location",
    address: "Address",
    otherLocations: "Other locations",
    priceFrom: "from",
    add: "Add",
    remove: "Remove",
    book: "Book",
    bookNow: "Book now",
    bookN: "Book {count} services",
    bookNOne: "Book {count} service",
    bookHeading: "Book an appointment",
    bookRailEmpty:
      "Pick one or more services from the list — or jump straight in and choose during booking.",
    totalLabel: "total",
    loadMoreReviews: "Show more reviews",
    loadMoreReviewsError: "We couldn't load more reviews.",
    reviewsCount: "{count} reviews",
    reviewsCountOne: "{count} review",
    reviewsCountMany: "{count} reviews",
    onlineBookingUnavailable:
      "This business doesn’t accept appointments online. Call them to book or ask about availability.",
    closed: "Closed",
    call: "Call",
    directions: "Directions",
    seeOnMap: "See on map",
    share: "Share",
    shareCopied: "Link copied",
    memberCopyLink: "Copy link",
    memberShareError: "Couldn't share this profile. Please try again.",
    memberCopyError: "Couldn't copy the link. Please try again.",
    close: "Close",
    continue: "Continue",
    comingSoon: "Booking is coming soon.",
    notFoundKicker: "NOT FOUND",
    notFoundTitle: "This place isn't on Zavoia.",
    notFoundBody:
      "It may have closed or moved. Plenty of other trusted pros are a click away.",
    backToExplore: "Back to Explore",
    browseBusinesses: "Browse businesses",
    memberStatYears: "{count} years",
    memberStatYearsOne: "1 year",
    memberStatYearsMany: "{count} years",
    memberStatYearsLabel: "experience",
    memberStatVisitsLabel: "visits",
    memberStatSinceLabel: "on Zavoia",
    memberStatSince: "Since {year}",
    memberSpeaks: "Languages",
    memberSpecialties: "Specialties",
    memberPortfolio: "Portfolio",
    memberShowAllReviews: "Show all {count} reviews",
    memberSelectPrompt: "Choose a service",
    memberBookWith: "Book with {name}",
    memberLoadError: "Couldn't load the full profile.",
    memberUnavailable: "This profile is no longer available.",
    memberContextLoadError: "Couldn't load booking options.",
    memberLocation: "Location",
    memberViewLocation: "View location",
    memberViewLocationAria: "View location: {name}",
    memberReviewsEmptyTitle: "No reviews yet",
    memberBookingDetailsUnavailable: "Booking details are unavailable for this location.",
    memberRetry: "Try again",
    memberPhotoAria: "View portfolio photo {index} ({name})",
    memberPhotoAlt: "{name}, portfolio photo {index}",
    memberMetaDescription: "{name}. View their professional profile and reviews on Zavoia.",
    memberClosePhotoAria: "Close photo",
    memberChooseVenue: "Choose a location",
    memberNoBooking: "Online booking isn't available for this professional yet.",
    memberNoBookingAtLocation: "Online booking isn't available for this professional at this location.",
    memberNoServicesHere:
      "{name} doesn’t offer any bookable services at this location yet.",
    memberChecking: "Checking availability…",
    reviewsEmptyTitle: "No reviews yet",
    reviewsEmptyBody: "Be the first to book and share your experience.",
    servicesEmptyTitle: "No services yet",
    servicesEmptyBody:
      "This location hasn't published its menu. Try calling them directly.",
    aboutBrand: "Brand",
  },
  brandPage: {
    locationsTitle: "Choose a location",
    locationsTitleOne: "The location",
    locationsCount: "{count} locations",
    locationsCountOne: "1 location",
    locationsCountMany: "{count} locations",
    teamTitle: "The people",
    aboutTitle: "About {name}",
    since: "Since {year}",
    viewLocation: "View & book",
    worksAt: "at {location}",
  },
  booking: {
    stepServicesTitle: "Choose services",
    stepDateTimeTitle: "Pick a date & time",
    stepReviewTitle: "Review & confirm",
    stepProgress: "Step {n} of {total}",
    backToProfile: "Back to profile",
    previousDates: "Previous dates",
    nextDates: "Next dates",
    chooseDate: "Choose a date to see available times.",
    selectServicesEmpty: "Select at least one service to continue.",
    noAvailability: "No availability in this date range.",
    nextAvailable: "Next available: {date}",
    jumpToNext: "Jump to next available",
    slotsCountLabel: "{count} slots",
    slotsCountOne: "{count} slot",
    dayClosed: "Closed",
    dayFull: "Full",
    dayUnavailable: "Unavailable",
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    fullyBookedDay: "Fully booked this day — try another date.",
    chooseTime: "Choose a time to continue.",
    anyAvailable: "Any available",
    staffChoiceRequired:
      "Price and time differ by professional — choose who you’d like.",
    staffLabel: "Professional",
    staffAnyAt: "Whoever is free at {time}",
    staffAnyEach: "Whoever is free for each service",
    staffAnyThis: "Whoever is free for this service",
    staffOrChoose: "Or choose someone",
    staffPerService: "Choose per service",
    staffSameForAll: "Same for all services",
    staffSharedHint: "Applies to all your services.",
    serviceCount: "{count} services · {duration}",
    serviceCountOne: "{count} service · {duration}",
    dateLabel: "Date",
    todayLabel: "Today",
    confirmBooking: "Confirm appointment",
    booking: "Booking…",
    signInToBook: "Sign in to book",
    successTitle: "You're booked",
    successBody: "See you at {business}.",
    pendingTitle: "Appointment requested",
    pendingBody: "{business} confirms each booking manually. We'll let you know as soon as they reply.",
    viewAppointment: "View appointment",
    done: "Done",
    close: "Close",
    quoteChanged: "The price or duration has changed. Review the updated details before confirming.",
    cancellationUnavailable: "This appointment cannot be cancelled online.",
    reschedulingUnavailable: "This appointment cannot be rescheduled online.",
    payAtVenueTitle: "Pay at the venue",
    payAtVenueNote: "Nothing to pay now — settle directly with {business} after your visit.",
    reviewChange: "Change",
    reviewChangeVisit: "Change date, time or professional",
    reviewServicesTitle: "Your services",
    reviewEditServices: "Edit services",
    staffAssigned: "Assigned for you",
    blockedScreen: {
      businessTitle: "Online booking unavailable",
      businessBody:
        "This venue can no longer be booked online. Its listing may have changed since your last visit.",
      bookingOffTitle: "This business books by phone",
      bookingOffBody:
        "They’ve turned off online booking for now — everything else here is up to date. Call the venue to book or ask about availability.",
      locationTitle: "Location unavailable",
      locationBody:
        "This location can no longer be booked online. It may have been removed from the marketplace.",
      serviceTitle: "Service no longer offered",
      serviceBody:
        "Looks like “{service}” isn't offered at this venue anymore. You can browse its current services instead.",
      serviceBodyGeneric:
        "One of the selected services isn't offered at this venue anymore. You can browse its current services instead.",
      noStaffTitle: "No professionals available",
      noStaffBody:
        "No professional currently offers the selected services at this venue.",
      staffPinTitle: "Professional unavailable",
      staffPinBody:
        "The professional you picked no longer offers this service at this venue.",
      anyProfessional: "Book with any professional",
      browseServices: "Browse services",
    },
    back: "Back",
    retry: "Try again",
    loading: "Loading…",
    loadError: "We couldn’t load available times.",
    catalogLoadError: "We couldn't load the services. Please try again.",
    rebookError: "Some services may have changed. Check the service list before booking again.",
    rebookServiceGone:
      "“{service}” is no longer offered here. Choose another service.",
    rebookServicesGone:
      "The services from your previous appointment couldn’t be added. Check the current service list.",
    rebookPartialGone:
      "“{service}” is no longer offered here and was left out.",
    errors: {
      tooSoon: "That time is too soon to book. Choose a later time.",
      tooFar: "Bookings aren’t open for that date yet. Choose an earlier date.",
      slotConflict: "That time is no longer available. Choose another time.",
      outsideHours: "That time is outside opening hours. Choose another time.",
      calendarBlock: "That time is no longer available. Please choose another.",
      staffUnavailable: "That professional isn't available then. Please choose another time.",
      generic: "Something went wrong. Please try again.",
    },
  },
  common: {
    save: "Save",
    removeSaved: "Remove from saved",
    savedStatusLoading: "Checking saved status",
    savedStatusUnavailable: "Saved status unavailable",
    signIn: "Sign in",
    reviews: "reviews",
    open: "Open",
    closed: "Closed",
    open247: "Open 24/7",
    closesAt: "Closes {time}",
    photo: "photo",
  },
  errors: {
    generic: "Something went wrong. Please try again.",
    offline: "We couldn’t connect. Check your internet connection and try again.",
    offlineShort: "No connection.",
    timeout:
      "We didn’t receive a response in time. Try again.",
    server: "We’re having a technical problem. Try again in a moment.",
    rateLimit: "Too many attempts. Try again in {seconds} s.",
    rateLimitNoTime: "Too many attempts. Wait a moment and try again.",
    sessionExpired: "Your session expired.",
    retry: "Try again",
    signIn: "Sign in",
    pageKicker: "Something broke",
    pageTitle: "We couldn't load this page",
    pageBody:
      "It's a problem on our side, not something you did. Try again — it usually clears right up.",
    backHome: "Back home",
    pageRecovery: {
      body: "Please try loading it again in a moment.",
      retrying: "Loading…",
      home: "Go to homepage",
    },
    sectionFailed: "This section didn't load.",
    reload: "Reload",
    dismiss: "Dismiss",
    customer: {
      accountMissing: "We couldn’t find your account. Try signing in again.",
      incorrectPassword: "That current password isn't right.",
      passwordGoogleLinked:
        "This account signs in with Google, so it has no password to change.",
      imageTooLarge: "That image is too large. Pick one under 5 MB.",
      imageType: "That file type isn't supported. Use a JPG, PNG or WebP.",
      favoriteGone: "This place is no longer available.",
      reviewNotCompleted: "You can leave a review after the appointment is completed.",
      reviewAlreadyExists: "You've already reviewed this appointment.",
      reviewNoRating: "Add at least one rating before sending.",
      reviewProfessional:
        "This professional isn’t listed on this appointment.",
    },
  },
  nav: {
    explore: "Explore",
    webStudio: "Web Studio",
    forBusiness: "For business",
    signIn: "Sign in",
    search: "Search",
    account: "Account",
    notifications: "Notifications",
    homeAria: "Zavoia home",
  },
  searchPill: {
    what: "What",
    where: "Where",
    when: "When",
    anything: "Anything",
    anyTime: "Any time",
    defaultWhere: "Anywhere",
    searchAria: "Search",
  },
  serviceCatalog: {
    title: "Explore services",
    close: "Close catalog",
    description: "Choose an industry, then select a service to explore.",
    industries: "Industries",
    allIndustries: "All industries",
    services: "Services",
    emptyTitle: "No services to show",
    emptyBody: "Try another industry or come back later.",
    loadError: "We couldn’t load the services. Try again.",
  },
  searchOverlay: {
    previewError: "We couldn’t load suggestions.",
    industriesError: "We couldn’t load service categories.",
    citySearchError: "We couldn’t search for cities. Try again.",
    overlayTitle: "What can we help you find?",
    what: "What?",
    where: "Where?",
    when: "When?",
    whatSummary: "All services",
    whatPlaceholder: "All services and businesses",
    browseByIndustry: "Browse by industry",
    seeAllIndustries: "See all industries",
    allInCategory: "All",
    seeMoreTags: "See more",
    seeLessTags: "See less",
    useCurrentLocation: "Use my current location",
    locationHint: "Tap to enable",
    locationEnabled: "Using your location",
    locationDenied: "Location access denied.",
    locationUnavailable: "Location is not available.",
    locationApproximate: "Using your approximate location",
    searchCityPlaceholder: "Search a city",
    popularCities: "Popular",
    recentSearches: "Recent searches",
    clearRecents: "Clear",
    recentLocations: "Recent",
    searchingCities: "Searching…",
    noCityMatches: "No matching places",
    resolvingLocation: "Finding your location…",
    currentLocationFallback: "Current location",
    whereSummaryCurrent: "Current location",
    whereSummaryAny: "Anywhere",
    dateAny: "Any time",
    dateToday: "Today",
    dateTomorrow: "Tomorrow",
    pickDate: "Pick a date",
    clearAll: "Clear all",
    searchAction: "Search",
    close: "Close search",
    clearInput: "Clear",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    resultsBusinesses: "Businesses",
    resultsPlaces: "Places",
    searching: "Searching…",
    noResults: "No results",
    keepTyping: "Keep typing to search…",
  },
  search: {
    inThisArea: "In this area",
    resultCount: "{count} places",
    resultCountOne: "{count} place",
    updating: "Updating…",
    allServices: "All services",
    clearSelection: "Clear {selection}",
    selectedServices: "Selected services",
    sortLabel: "Sort",
    sortTopRated: "Top rated",
    sortNearest: "Nearest",
    filterAll: "All",
    filterOpenNow: "Open now",
    filterAvailableToday: "Available today",
    emptyTitle: "No places match those filters",
    emptyBody: "Try changing or clearing your filters.",
    clearFilters: "Clear filters",
    showOnMap: "Map",
    showList: "List",
    loadMore: "Show more places",
    useMyLocation: "Use my location",
    recenterAria: "Recenter",
    searchThisArea: "Search this area",
    locationModalTitle: "Find businesses near you",
    locationModalBody:
      "Allow location access to see what's available around you — or search a city instead.",
    locationModalAllow: "Use my location",
    locationModalSkip: "Not now",
    retry: "Retry",
    retryError: "Couldn't load results.",
    locationDenied: "Location access denied. Showing your current search.",
    centeredOnLocation: "Centred on your location",
    closePinCard: "Close",
    mapUnavailable: "Map unavailable",
    pinListLabel: "Places on the map",
    browseMore: "More",
    sheetHandleAria: "Resize the results panel. Use Up and Down arrows, Home or End.",
    matchingBusinesses: "Matching businesses",
    resultsLimited: "Results are limited to {count} of {total} places. Narrow your search for more relevant results.",
    filters: {
      loadError: "We couldn’t load the available features.",
      title: "Filters",
      activeLabel: "Filters, {count} active",
      close: "Close",
      sortBy: "Sort by",
      minRating: "Min rating",
      any: "Any",
      distance: "Distance",
      availability: "Availability",
      openNow: "Open now",
      open247: "Open 24/7",
      open247Help: "Always-open services, like locksmiths and emergency vets.",
      features: "Features",
      showAllFeatures: "Show all features",
      showLess: "Show less",
      reset: "Reset",
      noMatchesCta: "No places match",
      showPlaces: "Show {count} places",
      showPlacesOne: "Show {count} place",
      sections: {
        amenities: "Amenities",
        payment: "Payment",
        languages: "Languages",
      },
      sort: {
        closest: "Closest",
        topRated: "Top rated",
        newest: "Newest",
      },
    },
    editSearch: "Edit search",
  },
  // Venue-tag display names, keyed by the stable API slug. `venue-tags` returns
  // canonical English names, so an unmapped slug still renders via the
  // fallback `dict.venueTags[group][slug] ?? tag.name`.
  venueTags: {
    amenities: {
      wifi: "Free Wi-Fi",
      "parking-onsite": "On-site parking",
      "parking-street": "Street parking nearby",
      "air-conditioning": "Air conditioning",
      "pet-friendly": "Pets allowed",
      "kid-friendly": "Kids welcome",
      "bike-parking": "Bike parking",
      "outdoor-seating": "Outdoor seating",
      "private-treatment-room": "Private treatment room",
      showers: "Showers",
      lockers: "Lockers",
    },
    paymentMethods: {
      cash: "Cash",
      card: "Cards accepted",
      "apple-pay": "Apple Pay",
      "google-pay": "Google Pay",
      "bank-transfer": "Bank transfer",
      "corporate-invoice": "Corporate invoice",
    },
    languages: {
      en: "English",
      ro: "Romanian",
      de: "German",
      fr: "French",
      it: "Italian",
      es: "Spanish",
      pt: "Portuguese",
      nl: "Dutch",
      sv: "Swedish",
      da: "Danish",
      no: "Norwegian",
      fi: "Finnish",
      pl: "Polish",
      hu: "Hungarian",
      cs: "Czech",
      sk: "Slovak",
      el: "Greek",
      bg: "Bulgarian",
      hr: "Croatian",
      sl: "Slovenian",
      sr: "Serbian",
      et: "Estonian",
      lv: "Latvian",
      lt: "Lithuanian",
      tr: "Turkish",
      ru: "Russian",
      uk: "Ukrainian",
      zh: "Chinese",
      ja: "Japanese",
      ko: "Korean",
      ar: "Arabic",
      hi: "Hindi",
    },
  },
  industries: {
    beauty: "Beauty",
    "spa-wellness": "Spa & Wellness",
    "skin-aesthetics": "Skin & Aesthetics",
    "tattoo-piercing": "Tattoo & Piercing",
    "health-medical": "Health & Medical",
    "fitness-sports": "Fitness & Sports",
    pets: "Pets",
    automotive: "Automotive",
    "home-services": "Home Services",
    "professional-services": "Professional Services",
    "education-coaching": "Education & Coaching",
    "events-creative": "Events & Creative",
    "tailoring-repairs": "Tailoring & Repairs",
    other: "Other",
  },
  industryTags: {
    "hair-salon": "Hair Salon",
    barbershop: "Barbershop",
    "nail-salon": "Nail Salon",
    "beauty-salon": "Beauty Salon",
    "brows-lashes": "Brows & Lashes",
    "makeup-artist": "Makeup Artist",
    "waxing-hair-removal": "Waxing & Hair Removal",
    "tanning-studio": "Tanning Studio",
    "day-spa": "Day Spa",
    "massage-studio": "Massage Studio",
    "sauna-steam": "Sauna & Steam",
    "wellness-center": "Wellness Center",
    "holistic-therapy": "Holistic & Alternative Therapy",
    "skincare-facial": "Skincare & Facial Studio",
    "medical-aesthetics": "Medical Aesthetics & Injectables",
    "laser-ipl-clinic": "Laser & IPL Clinic",
    "med-spa": "Med Spa",
    micropigmentation: "Permanent Makeup & Micropigmentation",
    "body-contouring": "Body Contouring",
    "tattoo-studio": "Tattoo Studio",
    "piercing-studio": "Piercing Studio",
    "tattoo-removal": "Tattoo Removal",
    "dental-clinic": "Dental Clinic",
    "medical-clinic": "Medical Clinic & Specialists",
    physiotherapy: "Physiotherapy & Recovery",
    "psychology-therapy": "Psychology & Therapy",
    "nutrition-dietetics": "Nutrition & Dietetics",
    "chiropractic-osteopathy": "Chiropractic & Osteopathy",
    "optometry-optics": "Optometry & Optics",
    "medical-laboratory": "Medical Laboratory",
    "personal-training": "Personal Training",
    "gym-fitness-studio": "Gym & Fitness Studio",
    "yoga-pilates": "Yoga & Pilates",
    "martial-arts": "Martial Arts",
    "dance-studio": "Dance Studio",
    "sports-coaching": "Sports Coaching",
    "swimming-lessons": "Swimming Lessons",
    "pet-grooming": "Pet Grooming",
    "veterinary-clinic": "Veterinary Clinic",
    "pet-training": "Pet Training",
    "pet-boarding-sitting": "Pet Boarding & Sitting",
    "auto-repair-garage": "Auto Repair & Garage",
    "vehicle-inspection-itp": "Vehicle Inspection (ITP)",
    "car-wash-detailing": "Car Wash & Detailing",
    "tire-service": "Tire Service",
    "auto-body-paint": "Auto Body & Paint",
    "auto-glass": "Auto Glass",
    cleaning: "Cleaning",
    plumbing: "Plumbing",
    electrical: "Electrical",
    hvac: "HVAC",
    "handyman-repairs": "Handyman & Repairs",
    "painting-decorating": "Painting & Decorating",
    "landscaping-gardening": "Landscaping & Gardening",
    "pest-control": "Pest Control",
    "appliance-repair": "Appliance Repair",
    moving: "Moving",
    "accounting-tax": "Accounting & Tax",
    "law-office": "Law Office",
    "notary-office": "Notary Office",
    "business-consulting": "Business Consulting",
    "financial-insurance": "Financial Advisory & Insurance",
    "translation-interpreting": "Translation & Interpreting",
    tutoring: "Tutoring",
    "language-lessons": "Language Lessons",
    "music-lessons": "Music Lessons",
    "driving-school": "Driving School",
    "life-career-coaching": "Life & Career Coaching",
    "art-craft-classes": "Art & Craft Classes",
    "photography-studio": "Photography Studio",
    videography: "Videography",
    "event-planning": "Event Planning",
    "wedding-services": "Wedding Services",
    "tailoring-alterations": "Tailoring & Alterations",
    "shoe-repair": "Shoe Repair",
    "watch-jewelry-repair": "Watch & Jewelry Repair",
    "phone-electronics-repair": "Phone & Electronics Repair",
  },
  footer: {
    tagline: "Find local services. Book your next appointment online.",
    navigationLabel: "Footer",
    explore: "Explore",
    findBusiness: "Find a business",
    browseIndustries: "Browse all industries",
    support: "Help & support",
    journal: "Journal",
    forBusiness: "For business",
    businessOverview: "Zavoia for business",
    webStudio: "Web Studio",
    pricing: "Pricing",
    businessSignIn: "Business sign in",
    helpCentre: "Help centre",
    myAppointments: "My appointments",
    cancellation: "Cancellation policy",
    privacy: "Privacy",
    terms: "Terms & policies",
    rights: "© 2026 ZAVOIA",
    cookieSettings: "Cookie settings",
    consumerProtection: "Consumer protection (ANPC)",
    alternativeDisputeResolution: "Alternative dispute resolution (SAL) with ANPC",
  },
  consent: {
    title: "Cookie consent",
    body: "We use cookies to help us deliver and improve our services. By using this website, you agree to our",
    policyLink: "cookie policy",
    accept: "Accept",
    reject: "Reject",
    close: "Close",
  },
  legal: {
    hubTitle: "Legal — Terms & Policies",
    hubDescription:
      "Zavoia's legal documents: terms of use, customer and business terms, booking, privacy and cookie policies.",
    hubKicker: "Legal",
    hubHeading: "Terms & policies",
    hubIntro:
      "Everything that governs how Zavoia works — for visitors, customers and the businesses on our platform. Documents marked as drafts are outlines under legal review and not yet binding.",
    hubHelp: "Can't find what you're looking for?",
    audienceGeneral: "For everyone",
    audienceCustomer: "For customers",
    audienceBusiness: "For businesses",
    draftNotice:
      "This document is a draft outline under legal review. It describes the structure of the final document and is not yet a binding agreement.",
    onThisPage: "On this page",
    backToLegal: "All terms & policies",
    lastUpdated: "Last updated",
    readDocument: "Read document",
    statusDraft: "Draft",
    printDocument: "Print",
    relatedTitle: "Related documents",
  },
  accountMenu: {
    sessionError: "We couldn’t verify your session. Try again.",
    appointments: "Appointments",
    saved: "Saved",
    profileSettings: "Profile & settings",
    journal: "The Journal",
    helpSupport: "Help & support",
    forBusiness: "For business",
    webStudio: "Web Studio",
    pricing: "Pricing",
    logout: "Log out",
    loggedOut: "Signed out",
    login: "Log in",
    welcome: "Welcome",
    loginOrSignUp: "Log in or sign up",
  },
  notifications: {
    loading: "Loading notifications",
    refreshError: "We couldn’t update your notifications. Your previous notifications are still shown.",
    loadMoreError: "We couldn’t load more notifications. Try again.",
    title: "Notifications",
    markAllRead: "Mark all read",
    loadMore: "Load more",
    unreadLabel: "Unread",
    unreadAria: "Notifications, {count} unread",
    errorTitle: "Couldn't load notifications",
    errorBody: "Check your connection and try again.",
    emptyTitle: "You're all caught up",
    emptyBody: "New appointments, reminders and updates will show up here.",
  },
  mobileTabs: {
    explore: "Explore",
    search: "Search",
    appointments: "Appointments",
    saved: "Saved",
    help: "Help",
  },
  toast: {
    signedOut: "Signed out",
  },
  breadcrumbHome: "Home",
  localeNames: { ro: "Română", en: "English" },
  language: { label: "Language", loading: "Loading…", unavailable: "Not available" },
  tryStudio: {
    "pageTitle": "Web Studio demo: explore website designs",
    "pageDescription": "Explore a complete sample website. Choose section styles, fonts and colours, or try another design. No account needed.",
    "demo": "Fictional business",
    "back": "Back to Web Studio",
    "customize": "Customize",
    "closeCustomization": "Close customization",
    "shuffle": "Try another design",
    "cta": "Start free trial",
    "previous": "Previous design",
    "reset": "Reset design",
    "copyLink": "Copy design link",
    "copied": "Design link copied",
    "copyError": "Could not copy the link. You can copy it from your address bar.",
    "allLocked": "Unlock a choice in Customize to try another design.",
    "locksLabel": "Keep when trying another design",
    "dimension": {
      "layout": "Layouts",
      "colour": "Colour",
      "type": "Font"
    },
    "lock": {
      "layout": "Keep these layouts",
      "colour": "Keep this colour",
      "type": "Keep this font"
    },
    "locked": {
      "layout": "Layouts kept. Select to unlock.",
      "colour": "Colour kept. Select to unlock.",
      "type": "Font kept. Select to unlock."
    },
    "section": "Section",
    "showSection": "Show this section",
    "noExampleReviews": "This fictional business has no customer reviews.",
    "style": "Style",
    "font": "Font",
    "colour": "Colour",
    "example": "Example business",
    "stylesNote": "This demo includes standard and optional premium styles. Premium styles are purchased separately, once.",
    "trialNote": "Your {days}-day trial starts on Base. Publishing your website requires Plus.",
    "demoFeedback": "This is a sample business. Bookings and contact actions are unavailable in the demo.",
    "previewLabel": "Sample website preview",
    "fontNames": {
      "modern": "Modern",
      "classic": "Classic",
      "elegant": "Elegant",
      "friendly": "Friendly"
    },
    "accentNames": {
      "terracotta": "Terracotta",
      "jade": "Jade",
      "mulberry": "Mulberry",
      "forest": "Forest",
      "marine": "Marine",
      "ink": "Ink",
      "espresso": "Espresso",
      "ochre": "Ochre",
      "olive": "Olive",
      "moss": "Moss",
      "pine": "Pine",
      "petrol": "Petrol",
      "slate": "Slate",
      "indigo": "Indigo",
      "violet": "Violet",
      "orchid": "Orchid",
      "plum": "Plum",
      "rosewood": "Rosewood",
      "blush": "Blush",
      "copper": "Copper",
      "brick": "Brick",
      "rust": "Rust",
      "amber": "Amber",
      "caramel": "Caramel",
      "greige": "Greige",
      "teal": "Teal",
      "peacock": "Peacock",
      "navy": "Navy",
      "burgundy": "Burgundy",
      "graphite": "Graphite"
    }
  },
  webStudio: {
    "pageTitle": "Web Studio: your own website, connected to Zavoia",
    "pageDescription": "Create a website with your Zavoia services, prices, team and photos. Explore designs, prepare your draft during the trial and publish with Plus.",
    "hero": {
      "titleLead": "A website that feels",
      "titleBridge": "like your",
      "titleAccent": "business.",
      "lead": "Create a website with the services, team and photos in Zavoia. Choose its look and manage bookings in your Zavoia calendar.",
      "demoCta": "Try the demo"
    },
    "showcase": {
      "title": "Different businesses. Websites of their own.",
      "previewLink": "Explore the {business} website",
      "examples": {
        "fitness": {
          "body": "Introduce your trainers, explain your one-to-one sessions and let clients choose an available time.",
          "previewAlt": "Example personal training website for {business}."
        },
        "pets": {
          "body": "A little reassurance before the first visit. Show your space, introduce the groomers and explain each service.",
          "previewAlt": "Example pet care website for {business}."
        },
        "music": {
          "body": "Give future students a feel for your studio. Introduce your teachers and help them choose their first individual lesson.",
          "previewAlt": "Example music lessons website for {business}."
        },
        "wellness": {
          "body": "Let the atmosphere speak. Pair photographs of your space with treatments, durations and a clear way to book.",
          "previewAlt": "Example massage and wellness website for {business}."
        },
        "automotive": {
          "body": "Make the next garage visit easier. Explain maintenance, diagnostics and tyre services, with a clear way to book.",
          "previewAlt": "Example auto repair website for {business}."
        }
      },
      "stylesNote": "Examples combine included and optional premium section designs."
    },
    "connected": {
      "title": "Your website, connected to your business.",
      "features": [
        {
          "title": "Your business details",
          "body": "Update your services, prices and team in Zavoia. The changes appear on your website."
        },
        {
          "title": "Choose what clients see",
          "body": "Select your locations and photos, then choose your design."
        },
        {
          "title": "Bookings in one calendar",
          "body": "Enable online booking for your locations. Website bookings appear in your Zavoia calendar."
        }
      ],
      "artwork": {
        "business": "Forma Studio",
        "service": "Personal training",
        "price": "150 RON",
        "duration": "60 min",
        "member": "Mara",
        "location": "City centre",
        "team": "Your team",
        "services": "Services",
        "book": "Book a session",
        "calendar": "Your calendar",
        "day": "Tuesday, 10 Nov",
        "time": "10:00 – 11:00"
      }
    },
    "setup": {
      "title": "Make it yours, section by section.",
      "lead": "Arrange ready-made sections and preview your website before publishing. No coding required.",
      "editorAlt": "The real Zavoia Web Studio editor, showing the Masonry gallery design for Mira Spa.",
      "phoneAlt": "Mira Spa’s Masonry gallery of spa interiors and still-life images, previewed on a phone.",
      "steps": [
        {
          "title": "Arrange your content",
          "body": "Choose what to show and arrange your main sections."
        },
        {
          "title": "Choose your look",
          "body": "Choose section designs, a font and a colour from the available options."
        },
        {
          "title": "Preview on desktop and mobile",
          "body": "Check your layout before publishing."
        }
      ],
      "note": "Design and website content changes stay in your draft until you publish.",
      "demoLink": "Try the demo"
    },
    "publishing": {
      "title": "Ready to go live? Publish with Plus.",
      "lead": "Website publishing is included in Zavoia Plus, alongside your calendar, online booking and tools for running your business.",
      "planName": "Zavoia Plus",
      "perMonth": "per month",
      "owner": "Your account is included. Additional team seats cost {price} each per month.",
      "features": [
        "Your website at its own Zavoia address",
        "Online booking for locations where you enable it",
        "A website link and QR code to share"
      ],
      "cta": "Start a {days}-day Base trial",
      "trialNote": "No card required. Prepare your draft, then subscribe to Plus to publish.",
      "stylesTitle": "Your style, your choice.",
      "stylesBody": "Build with the included designs or choose optional premium section styles. All {fonts} fonts and {colours} colours are included.",
      "stylePrice": "Premium section styles from {price} each, paid once. Available with Plus.",
      "pricingLink": "See plans and full pricing",
      "demoLink": "Try the demo",
      "signInLink": "Already using Zavoia? Sign in"
    },
    "faq": {
      "title": "Before your website goes live.",
      "lead": "Answers about designs, publishing and the information on your website.",
      "helpPrompt": "Have another question?",
      "helpLink": "Visit the help centre",
      "items": [
        {
          "q": "Do I need to know how to build a website?",
          "a": "No coding is required. Arrange ready-made sections, add your content and choose from the available fonts and colours. Preview your website before publishing."
        },
        {
          "q": "What can I do during the free trial?",
          "a": "Your {days}-day Base trial starts when you create your business in Zavoia. You can prepare, preview and save a website draft.\n\nPublishing your website and purchasing optional premium styles require Plus."
        },
        {
          "q": "What information comes from my Zavoia account?",
          "a": "Your website uses your Zavoia business details, services, prices, team and reviews. You choose the locations, photos and sections to show, and can write your introduction and FAQs.\n\nUpdates to services, prices and team details appear on your published website. Design changes, website content and photo selections stay in your draft until you publish again."
        },
        {
          "q": "Can clients book from my website?",
          "a": "Yes, for locations with online booking enabled. Clients choose a service and an available time, then complete their booking through Zavoia. The booking appears in your Zavoia calendar."
        },
        {
          "q": "Do I have to buy premium styles?",
          "a": "No. You can build your website with the included section designs. Optional premium section styles are one-time purchases for your business and require Plus.\n\nAll available fonts and brand colours are included."
        },
        {
          "q": "What address will my website have?",
          "a": "Your website has its own Zavoia address, such as zavoia.com/your-business. Copy its link or download a QR code from your business account.\n\nAlready have a domain? Contact us through the help centre to arrange using it for your website.",
          "helpLink": "Ask about your domain"
        },
        {
          "q": "What happens if my Plus subscription ends?",
          "a": "When your Plus access ends, your published website becomes unavailable to visitors. Your saved design and purchases are retained.\n\nWith an active Base plan, you can work on drafts. Active Plus is required to make the website available again."
        }
      ]
    }
  },
  businessMarketing: {
    signIn: "Sign in",
    signInPrompt: "Already on Zavoia?",
    trialCta: "Start your free trial",
    trialDays: "{days} free",
    noCard: "No card required",
    helpLink: "Ask us in the help centre",
    counts: {
      days: { one: "{count} day", few: "{count} days", other: "{count} days" },
      locations: { one: "{count} location", few: "{count} locations", other: "{count} locations" },
      teamMembers: { one: "{count} team member", few: "{count} team members", other: "{count} team members" },
    },
    plans: {
      perMonth: "per month",
      upTo: "Up to {count}",
      teamLimit: "Up to {count} besides you",
      unlimitedTeam: "Unlimited additional team members",
      unavailable: "Not available for this team size",
      baseLimitNotice: "Base supports up to {count} besides you. Choose Plus for a larger team.",
      subscription: "{price} plan per month, including you",
      memberPrice: "+ {price} per extra team member each month",
      totalFor: "For {who}",
      justYou: "just you",
      youAnd: "you + {members}",
      announcement: "For {who}: Base {base}, Plus {plus} per month.",
      base: {
        name: "Base",
        line: "Everything you need to get booked",
        note: "{days} free, no card needed",
        features: [
          "A Zavoia page for every location",
          "Online booking with real availability",
          "Calendars, team logins and team rules",
          "Email reminders and verified reviews",
          "Client history and your day at a glance",
          "Web Studio drafts",
        ],
      },
      plus: {
        name: "Plus",
        tag: "Includes your website",
        line: "Your own website and unlimited team size",
        note: "Your trial starts on Base. Choose Plus when you subscribe.",
        features: [
          "Everything in Base",
          "Unlimited additional team members",
          "Publish your Web Studio website",
          "Share your site with a link or a QR code",
          "Unlock premium website styles, paid once",
          "Room for up to {locations}",
        ],
      },
    },
    fine: {
      currency: "Prices shown in {currency}, per month. Billing currency follows your business country.",
      currencyNames: { RON: "lei (RON)", EUR: "euros (EUR)" },
      noSetup: "No setup fee. Cancel anytime.",
      sms: "SMS credits and premium Web Studio styles are optional extras.",
      compare: "Compare plans in detail",
      bigger: "Need more than {locations}?",
    },
  },
  forBusiness: {
    pageTitle: "For business: get found and booked online",
    pageDescription:
      "List your business on Zavoia and take online bookings from clients nearby. One calendar for your locations and team, email reminders, and no commission on bookings. Try it free for {days}.",
    hero: {
      titleLead: "Get found.",
      titlePre: "Get ",
      titleAccent: "booked.",
      lead: "Local clients can find you on Zavoia and book online.",
      support: "Manage appointments, your team and your day in one place.",
      trialCta: "Try it free for {days}",
      pricingLink: "View pricing",
      noCommission: "No booking commission",
      streetLabel: "Businesses on Zavoia",
    },
    benefits: {
      label: "Start with confidence",
      trial: "See how Zavoia helps you organize appointments and manage your team.",
      noCard: "Start your trial without entering payment details.",
      noCommission: "You pay for your plan. We take no share of your bookings.",
    },
    found: {
      title: "Where clients find you",
      lead: "Each location has a Zavoia page where clients can explore services and book online.",
      cta: "Explore the marketplace",
      points: [
        {
          title: "Services at a glance",
          body: "Show your services, durations and prices.",
        },
        {
          title: "Available booking times",
          body: "Enable online booking so clients can choose an available time.",
        },
        {
          title: "Reviews from clients",
          body: "Only clients with completed appointments can leave a review.",
        },
        {
          title: "Your booking link",
          body: "Share your Zavoia page on Instagram, WhatsApp or your Google Business Profile.",
        },
      ],
      artwork: {
        desktopAlt: "Atelier Nova’s example Zavoia page, showing the salon, a selected haircut, its price and the booking summary.",
        mobileAlt: "The Zavoia app’s map showing industry pins for example businesses in Bucharest.",
      },
    },
    run: {
      title: "Your day, in one calendar",
      lead: "Online bookings appear in your calendar. Add appointments made by phone or in person in the same place.",
      features: [
        {
          title: "Your schedule and your team’s",
          body: "Switch between team members and locations. View by day or month, with a week view on desktop.",
        },
        {
          title: "Booking times and breaks",
          body: "Choose when clients can book, allow time between appointments, and add one-off or recurring breaks.",
        },
        {
          title: "Cancellations and rescheduling",
          body: "Get notified when a client cancels or reschedules online.",
        },
        {
          title: "Team access",
          body: "Invite your team and choose who can cancel, reschedule or block time in the calendar.",
        },
        {
          title: "Services and bundles",
          body: "Group services into bundles. Set service prices and durations for each team member.",
        },
        {
          title: "Client history",
          body: "View each client’s appointment history and download it as a PDF.",
        },
      ],
      artwork: {
        desktopAlt: "Zavoia’s business calendar at the example Atelier Nova salon, showing three team schedules with appointments and a reserved lunch break.",
        mobileAlt: "Zavoia’s business calendar on mobile at the example Atelier Nova salon, showing location controls, the day summary and an appointment list with clients and assigned staff.",
      },
    },
    app: {
      titleLead: "Your business,",
      titlePre: "on your ",
      titleAccent: "phone.",
      lead: "Manage bookings, services and your team in the Zavoia business app.",
      features: [
        {
          title: "Manage your services",
          body: "Choose services for each location, set prices and durations, and assign team members to each service.",
        },
        {
          title: "Manage your Zavoia pages",
          body: "Add photos, choose which locations are visible on Zavoia and enable online booking for each.",
        },
        {
          title: "Booking updates on your phone",
          body: "Enable notifications for new bookings, cancellations and rescheduling.",
        },
      ],
      webLink: "Sign in on the web",
      platformsLabel: "Zavoia business app platforms",
      downloadTitle: "Download the business app",
      downloadDescription: "The business app is for you and your team. Clients can book on the Zavoia website or in the separate client app.",
      assignmentsAlt: "The Assignments services page in the Zavoia business app on Android, in English: hair, nail, facial and massage services at Atelier Nova, with prices and durations.",
      marketplaceAlt: "The Zavoia business app on Android, in English: Atelier Nova’s marketplace portfolio with a salon photo and photo management controls.",
    },
    life: {
      title: "From booking to the next visit",
      lead: "Manage confirmations and reminders, and let clients start a new booking from their history.",
      scheduleAlt:
        "A client’s Schedule in the Zavoia app: an upcoming haircut and personal training, and a past guitar lesson, each with time, price and the business.",
      steps: [
        {
          title: "Booking",
          body: "Clients book online through Zavoia, or you add their appointments.",
        },
        {
          title: "Confirmation",
          body: "Confirm online bookings automatically, or review requests before confirming.",
        },
        {
          title: "Reminders",
          body: "Choose when email reminders are sent for confirmed appointments. SMS reminders use credits purchased separately.",
        },
        {
          title: "Visit and payment",
          body: "Clients pay your business directly, using the payment methods you accept.",
        },
        {
          title: "Reviews and rebooking",
          body: "After a completed appointment, clients can leave a review and start a new booking from their history.",
        },
      ],
    },
    studio: {
      planLabel: "Publish with Plus",
      title: "Your own website, built with Zavoia",
      lead: "Use the details you’ve already added to Zavoia to create a website clients can book from.",
      features: [
        { title: "Your content, ready to use", body: "Start with your existing services, prices, team details and photos." },
        { title: "Choose your design", body: "Personalise layouts, fonts and colours. Create and save your draft on either plan." },
        { title: "Publish with Plus", body: "Publish your website with Plus, then share its Zavoia link or QR code." },
      ],
      link: "Explore Web Studio",
      note: "Premium styles are optional and sold separately as a one-time purchase.",
      desktopAlt: "Lumi Beauty’s website made with Web Studio, showing its salon gallery.",
      phoneAlt: "The Paw & Co pet-care website made with Web Studio, on a phone.",
    },
    plans: {
      title: "Two plans. No booking commission.",
      lead: "Both plans include a Zavoia business page for each location, online booking and your business calendar. Plus adds website publishing, more locations and unlimited team size.",
      ownerIncluded: "Your account is included",
      additionalTeamMembers: {
        one: "{count} additional team member",
        few: "{count} additional team members",
        other: "{count} additional team members",
      },
      memberPrice: "Each additional team seat costs {price}/month on either plan.",
      baseDescription: "Manage your bookings and your team.",
      plusDescription: "Publish your website and manage more locations.",
      plusBenefitsTitle: "Everything in Base",
      baseBenefits: [
        { title: "Up to {locations}", body: "Each location gets a Zavoia business page, with online booking from your availability." },
        { title: "Up to {members}", body: "Add professionals and staff who don’t take appointments, with their own access and permissions." },
        { title: "Reminders and client reviews", body: "Set email reminders for confirmed appointments. Clients can leave reviews after completed visits." },
        { title: "Prepare your website", body: "Create and save a website draft in Web Studio. Publish it with Plus." },
      ],
      plusBenefits: [
        { title: "Publish your own website", body: "Publish your Web Studio website so clients can explore your business and book online. Share its Zavoia link or QR code.", studioLink: "Explore Web Studio" },
        { title: "No team-size limit", body: "Grow your team across locations. Each additional member needs a paid team seat." },
        { title: "Up to {locations}", body: "Each location has its own Zavoia business page, calendar and team." },
      ],
      trialCta: { base: "Try free for {days}", plus: "Get started" },
      trialNotes: {
        base: "No card required. Your trial includes Base features.",
        plus: "Your trial includes Base features and limits. Choose Plus for website publishing and more capacity.",
      },
    },
    faq: {
      title: "Before you get started",
      aside: "Answers about your trial, pricing and bookings.",
      helpPrompt: "Need more details?",
      helpLink: "Visit the help centre",
      items: [
        {
          q: "How does the free trial work?",
          a: "Your free trial starts when you create your business in Zavoia and includes Base features for {days}. No card is required. Set up your services and team, publish your locations’ Zavoia pages and enable online booking.\n\nIf you don’t subscribe when the trial ends, your public Zavoia pages are hidden and scheduled client reminders stop. Existing appointments aren’t automatically cancelled. You can still view your calendar, but need an active subscription to add or change appointments.",
        },
        {
          q: "Do you charge commission on bookings?",
          a: "No. Zavoia does not charge commission on bookings, including those from clients who discover your business on Zavoia.\n\nYou pay for your subscription and any additional team seats. SMS credits and premium Web Studio styles are optional paid extras.",
        },
        {
          q: "How much does it cost to add team members?",
          a: "Your account is included. Each additional team seat costs {seat}/month and covers one member across your business’s locations, including staff who don’t take appointments.\n\nBase supports up to {baseTeamMembers} besides you. Plus has no team-size limit. You pay for the seats in your subscription, including unused seats. Removing a member does not automatically reduce your bill. Reduce unused seats in billing settings; the change applies at your next renewal.",
        },
        {
          q: "Can I publish my own website?",
          a: "Yes, with Plus. You can create and save a website draft in Web Studio on either plan, but publishing requires Plus.\n\nYour website is separate from your locations’ public pages on Zavoia, which are included in both plans. Premium Web Studio styles are optional and sold separately as a one-time purchase.",
        },
        {
          q: "Can I cancel my subscription at any time?",
          a: "Yes. Subscriptions are monthly, and you can cancel in your billing settings. Your plan remains active until the end of the period you’ve paid for.",
        },
        {
          q: "Do clients need the Zavoia app to book?",
          a: "No. Clients can book on zavoia.com in their browser or use the Zavoia app. To complete a booking, they sign in or create a Zavoia account.",
        },
        {
          q: "How do clients pay for appointments?",
          a: "Clients pay your business directly, using the payment methods you accept. Zavoia does not process payments for appointments.",
        },
        {
          q: "Can I manage multiple locations?",
          a: "Yes. Base includes up to {baseLocations}, and Plus includes up to {plusLocations}.\n\nYou can manage each location’s Zavoia page, calendar, team, services and opening hours.",
        },
        {
          q: "Can I add phone bookings and walk-in visits?",
          a: "Yes. Add them manually to the same business calendar as your online bookings, so you can manage all appointments in one place.",
        },
        {
          q: "Is Zavoia right for my business?",
          a: "Zavoia is designed for businesses where clients book an appointment with you or someone on your team, such as salons, clinics, garages, personal trainers or tutors.\n\nZavoia does not support group classes or bookings for rooms or service bays.",
        },
      ],
    },
    close: {
      titleLead: "Make room for",
      titlePre: "your next ",
      titleAccent: "client.",
      lead: "Set up your business, location, services and team. Publish your page and enable online booking when you’re ready.",
    },
  },
  pricing: {
    pageTitle: "Pricing: two plans, no booking commission",
    pageDescription:
      "Base is {base} and Plus is {plus} a month, plus {seat} per additional team seat. Your account is included. No booking commission or setup fee. Try it free for {days}, no card needed.",
    hero: {
      titleLead: "Simple plans.",
      titlePre: "No booking ",
      titleAccent: "commission.",
      lead: "Online booking and team management, with your own website on Plus.",
      memberPrice: "Your account is included. Each additional team seat costs {price}/month and covers one member across your business’s locations."
    },
    billing: {
      currencyNote: "Prices shown in {currency}. Your billing currency depends on your business country.",
      terms: "Billed monthly. No setup fee. Cancel anytime.",
      larger: "Need more than {locations} locations?",
      helpLink: "Visit the help centre"
    },
    compare: {
      title: "Compare the plans",
      lead: "See where Base and Plus differ, and what you get with either plan.",
      baseSummary: "For your bookings and team",
      plusSummary: "Your website and more capacity",
      upTo: "Up to",
      unlimited: "Unlimited",
      paidMemberNote: "Each additional team seat costs {price}/month on either plan. Your account is included.",
      caption: "Compare the features and limits of Base and Plus",
      feature: "Feature",
      locations: "Locations",
      teamMembers: "Additional team seats",
      website: "Your Web Studio website",
      websiteBase: "Create and save a draft",
      websitePlus: "Create, publish and share"
    },
    included: {
      title: "Included in both plans",
      lead: "The tools to run your day, whichever plan you choose.",
      groups: [
        {
          title: "Be discovered",
          items: [
            "A public Zavoia page for every location",
            "Online booking with your real availability",
            "Reviews from clients with completed appointments"
          ]
        },
        {
          title: "All appointments in one calendar",
          items: [
            "Online bookings and the phone or walk-in appointments you add",
            "Cancellation and rescheduling updates",
            "Booking windows, buffers, breaks and time off"
          ]
        },
        {
          title: "Organise your services and team",
          items: [
            "Team logins, access and permissions",
            "Services and bundles, with prices and durations per team member",
            "Service and team assignments for each location"
          ]
        },
        {
          title: "Reminders and client history",
          items: [
            "Email reminders for confirmed appointments",
            "View each client’s appointment history and export it as a PDF"
          ]
        }
      ]
    },
    addons: {
      title: "Extras when you need them",
      lead: "Optional purchases, separate from your monthly subscription.",
      studioLink: "Explore Web Studio",
      items: [
        {
          title: "SMS credits",
          body: "Email reminders are included. Add SMS reminders with optional credit packs, bought separately in your business dashboard.",
          availability: "Available with either paid plan."
        },
        {
          title: "Premium website styles",
          body: "Build your website with included styles. Preview premium styles in Web Studio and buy the ones you want as optional one-time purchases.",
          availability: "Style purchases and website publishing require Plus."
        }
      ]
    },
    faq: {
      title: "Questions about pricing",
      lead: "How your trial, team seats and monthly subscription work.",
      helpPrompt: "Need more details?",
      helpLink: "Visit the help centre",
      items: [
        {
          q: "How does the free trial work?",
          a: "Your free trial lasts {days} and starts when you create your business. It includes Base features and limits. No card is required. Add payment and billing details when you subscribe.\n\nIf you do not subscribe when the trial ends, your public Zavoia pages are hidden and scheduled client reminders stop. Existing appointments are not automatically cancelled. You can still view your calendar, but need an active subscription to add or change appointments."
        },
        {
          q: "How does team pricing work?",
          a: "Your account is included. Each additional team seat costs {seat}/month and covers one member across your business’s locations, including staff who don’t take appointments.\n\nBase supports up to {baseTeamMembers} besides you. Plus has no team-size limit. Additional seats cost the same on either plan. You pay for the seats in your subscription, including unused seats, so removing a member does not automatically reduce your bill."
        },
        {
          q: "What happens when I add or remove team seats?",
          a: "Adding seats takes effect after successful payment, with a prorated charge for the rest of your current billing period. Reducing unused seats takes effect at your next renewal. Make these changes in your billing settings."
        },
        {
          q: "Can I switch between Base and Plus?",
          a: "Yes, in your billing settings. An upgrade to Plus takes effect after successful payment, with a prorated charge for the rest of your billing period. A change to Base takes effect at your next renewal.\n\nWhen Base takes effect, your Web Studio website is no longer public. You can still edit its draft, and premium styles you have bought remain yours. Your locations’ public Zavoia pages are included in both plans."
        },
        {
          q: "Can I cancel my subscription at any time?",
          a: "Yes. Cancel in your billing settings. Your paid plan stays active until the end of the period you have paid for."
        },
        {
          q: "Will I get an invoice?",
          a: "Yes. Invoices are available in your business billing area, using the billing details you provide."
        },
        {
          q: "Do you charge commission on bookings?",
          a: "No. Zavoia does not charge commission on bookings, including bookings from clients who discover you on the marketplace. You pay for your subscription, additional team seats and any optional extras you choose."
        },
        {
          q: "Do clients pay through Zavoia?",
          a: "No. Clients pay your business directly, using the payment methods you accept. Zavoia does not process appointment payments."
        }
      ]
    },
    plansLabel: "Plans",
  },
  appointments: {
    title: "Appointments",
    upcomingWord: "UPCOMING",
    pastWord: "PAST",
    filters: {
      all: "All",
      upcoming: "Upcoming",
      past: "Past",
      cancelled: "Cancelled",
      noShow: "No-show",
    },
    sectionUpcoming: "Upcoming",
    finishedLabels: {
      cancelled: "Cancelled",
      noShow: "No-show",
      completed: "Completed",
      past: "Past",
    },
    stamps: {
      cancelled: "Cancelled",
      noShow: "No-show",
      pending: "Pending",
      live: "Live",
    },
    timeUntil: {
      live: "Live",
      awaiting: "Awaiting",
      starting: "Starting",
      tomorrow: "Tomorrow",
      inMinutes: "in {n}m",
      inHours: "in {n}h",
      inDaysOne: "in {n} day",
      inDaysMany: "in {n} days",
      inWeeksOne: "in {n} week",
      inWeeksMany: "in {n} weeks",
      inMonthsOne: "in {n} month",
      inMonthsMany: "in {n} months",
    },
    free: "Free",
    loadMore: "Load more",
    loadMoreError: "We couldn’t load more appointments.",
    loading: "Loading your appointments…",
    errorLoading: "We couldn't load your appointments. Please try again.",
    retry: "Try again",
    notes: {
      upcomingEmpty: "You have no upcoming appointments.",
      pastEmpty:
        "Your past appointments will appear here.",
      cancelledEmpty: "You have no cancelled appointments.",
      noShowEmpty: "You have no appointments marked as no-show.",
    },
    empty: {
      title: "No appointments yet",
      body: "Your appointments will appear here after you book.",
      cta: "Explore",
    },
    gate: {
      title: "Appointments",
      body: "Sign in to see your appointments.",
      cta: "Sign in",
      secondary: "Explore",
    },
  },
  appointmentDetail: {
    back: "Appointments",
    atBusiness: "at {business}",
    sections: {
      where: "Where",
      service: "Service",
      services: "Services",
      note: "Your note to the venue",
      with: "With",
      yourReview: "Your review",
      about: "About",
    },
    bundleTag: "Bundle",
    subtotal: "Subtotal",
    bundleDiscount: "Bundle discount",
    totalAtVenue: "Total at venue",
    payDirectly: "Pay directly with {business}",
    free: "Free",
    awaitingConfirmation: "Awaiting confirmation",
    awaitingConfirmationBody:
      "Your appointment is awaiting confirmation from {business}.",
    inProgress: "In progress",
    endingNow: "Ending now",
    oneMinLeft: "1 min left",
    minsLeft: "{n} min left",
    visitOfTotal: "Visit {index} of {total}",
    finalVisit: "Final visit in this series",
    nextOn: "Next on {date}",
    viewVenue: "View venue",
    viewProfile: "View profile",
    viewBrand: "View brand",
    edit: "Edit",
    viewMap: "View map",
    callVenue: "Call",
    leaveReview: "Leave a review",
    openApp: "Open in app",
    bookAgain: "Book again",
    reschedule: "Reschedule",
    rescheduleUnavailable: "Reschedule unavailable",
    rescheduleWindowPassed: "The deadline for online rescheduling has passed",
    contactBusinessDirectly: "Contact the venue for help.",
    cancelAppointment: "Cancel appointment",
    cancelUnavailable: "Cancellation unavailable",
    cancelWindowPassed: "The deadline for online cancellation has passed",
    youMissedAppointment: "You missed this appointment",
    cancelledTitle: "Cancelled",
    bookedOn: "Booked on {date}",
    relative: {
      inProgress: "In progress",
      today: "Today",
      tomorrow: "Tomorrow",
      inDays: "In {n} days",
    },
    bookedVia: {
      zavoia: "via Zavoia",
      direct: "directly with the venue",
      admin: "by support",
    },
    recurringPlan: "Part of a recurring plan",
    status: {
      inProgress: "In progress",
      cancelled: "Cancelled",
      noShow: "No-show",
      completed: "Completed",
      pending: "Pending",
      confirmed: "Confirmed",
    },
    signedOutTitle: "Sign in to view this appointment.",
    signedOutBody:
      "Your appointments are private. Sign in to see the details, reschedule or get directions.",
    explorePlaces: "Explore places",
    notFound: "Appointment not found",
    backToAppointments: "Back to appointments",
    loading: "Loading appointment…",
    errorLoading: "We couldn't load this appointment. Please try again.",
  },
  help: {
    pageTitle: "Help centre",
    pageDescription:
      "Answers to the questions people ask us most about booking, paying, and managing appointments on Zavoia.",
    head: {
      kicker: "Help centre",
      title: "What do you need a hand with?",
      sub: "Plain answers to the things people ask us most — open any question to read it right here, no digging required.",
    },
    searchPlaceholder: "Search questions — cancel, deposit, reschedule…",
    allLabel: "All",
    resultsLabel: "results for",
    noResults: "No questions matched. Try different words.",
    topics: [
      {
        id: "booking",
        icon: "cal",
        label: "Appointments",
        items: [
          {
            q: "How do I book an appointment?",
            a: "Search, pick a service and a time, and confirm — no payment needed up front.",
          },
          {
            q: "Can I reschedule or cancel?",
            a: "Yes — free up to the venue's cancellation window, usually 24 hours before your appointment.",
          },
        ],
      },
      {
        id: "paying",
        icon: "wallet",
        label: "Paying & pricing",
        items: [
          {
            q: "When and how do I pay?",
            a: "You pay the business directly after your visit. Zavoia never charges your card just to book.",
          },
          {
            q: "How do refunds work?",
            a: "Because you pay the venue directly, refunds are handled by the venue according to their policy.",
          },
        ],
      },
      {
        id: "account",
        icon: "user",
        label: "Your account",
        items: [
          {
            q: "Can I manage reminders and notifications?",
            a: "Yes — choose which reminders and offers you receive from your profile settings.",
          },
        ],
      },
      {
        id: "reviews",
        icon: "star",
        label: "Reviews",
        items: [
          {
            q: "How do I leave a review?",
            a: "After a completed visit, open the appointment from your history and rate your experience.",
          },
        ],
      },
      {
        id: "safety",
        icon: "shield",
        label: "Trust & safety",
        items: [
          {
            q: "What does a verified business mean?",
            a: "Every business on Zavoia is identity-checked before it can accept appointments.",
          },
        ],
      },
      {
        id: "business",
        icon: "flash",
        label: "For businesses",
        items: [
          {
            q: "How do I list my business?",
            a: "Zavoia for Business gives every team member a public profile, a self-protecting calendar, and reminders that cut no-shows. Start a free trial from the For business page.",
          },
        ],
      },
    ],
    goodToKnow: {
      title: "Good to know",
      items: [
        { label: "Cancellation policy", href: ["terms", "booking-policy"] },
        { label: "List your business", href: ["for-business"] },
        { label: "Privacy policy", href: ["terms", "privacy-policy"] },
      ],
    },
    report: {
      title: "Report an issue",
      sub: "We look into every report, usually within a few hours.",
      cta: "Report an issue",
      modal: {
        title: "Report an issue",
        intro:
          "Tell us what went wrong — no account needed. We'll get back to you at the email you leave here.",
        titleLabel: "Title",
        titlePlaceholder: "A short summary of the issue",
        emailLabel: "Email",
        emailPlaceholder: "you@example.com",
        messageLabel: "What happened?",
        messagePlaceholder: "Describe the issue with as much detail as you can…",
        submit: "Send report",
        cancel: "Cancel",
        error: "We couldn't send your report. Please try again.",
        errorRateLimit:
          "You've sent a few reports recently. Please wait a while and try again.",
        success: {
          title: "Thanks — we got your report",
          body: "Our team looks into every report, usually within a few hours. We'll reply to {email}.",
          reference: "Reference",
          done: "Done",
        },
      },
    },
  },
  appointmentActions: {
    cancel: {
      title: "Cancel this appointment?",
      keep: "Keep it",
      confirm: "Cancel appointment",
      successToast: "Appointment cancelled",
      error: "We couldn’t cancel your appointment. Try again.",
      windowPassed:
        "The online cancellation deadline has passed. Contact {businessName} directly.",
      notAllowed:
        "Online cancellation isn’t available. Contact {businessName} directly.",
      alreadyCancelled: "This appointment is already cancelled.",
      noLongerCancellable:
        "This appointment can no longer be cancelled. Refresh the page to see its current status.",
    },
    reschedule: {
      title: "Reschedule",
      sub: "Pick a new time at {business}",
      currentNote: "Currently {when} — free to move up to {hours}h before",
      dateLabel: "Date",
      pickSlot: "Pick a slot to continue",
      newTimeLabel: "New time",
      confirm: "Confirm new time",
      successToast: "Rescheduled to {when}",
      error: "We couldn’t reschedule your appointment. Try again.",
      windowPassed:
        "The online rescheduling deadline has passed. Contact {businessName} directly.",
      notAllowed:
        "Online rescheduling isn’t available. Contact {businessName} directly.",
      alreadyStarted:
        "The appointment’s start time has passed. It can no longer be rescheduled.",
      noLongerReschedulable:
        "This appointment can no longer be rescheduled. Refresh the page to see its current status.",
      unsupported:
        "This appointment can't be rescheduled online. Contact the venue to change the time.",
    },
    review: {
      titleNew: "How was it?",
      titleEdit: "Edit your review",
      sub: "Your visit to {business}",
      publicNote: "Reviews are public. Your first name, last initial and profile photo, if available, are shown.",
      submitNew: "Post review",
      submitEdit: "Update review",
      noteLabel: "Comment (optional)",
      includeEveryone: "Include everyone you want to review before posting.",
      back: "Back",
      continue: "Continue",
      skip: "Skip",
      stepAria: "Review {current} of {total}",
      labelPoor: "Poor",
      labelFair: "Fair",
      labelGood: "Good",
      labelGreat: "Great",
      labelExceptional: "Exceptional",
      successNew: "Thanks for your review",
      successEdit: "Review updated",
      businessLabel: "Rate {business}",
      professionalLabel: "Rate {name}",
      starsAria: "{n} stars",
      error: "We couldn’t post your review. Try again.",
    },
  },
  notFound: {
    page: {
      skip: "Skip to content",
      navigation: "Page navigation",
      language: "Language",
      signIn: "Business sign in",
      signInShort: "Sign in",
      businessTitle: "Give your business a home on Zavoia.",
      businessTitleLead: "Give your business",
      businessTitlePre: "a ",
      businessTitleWord: "home",
      businessTitlePost: " on Zavoia.",
      createAccount: "Create business account",
      offerFirst: "Create your website.",
      offerSecond: "Take appointments online.",
      businessDescription: "Show your services, prices and team. Manage your appointments and website in one place.",
      trialDetail: "{days} days free on Standard. No card required.",
      websiteDetail: "Website publishing is included with Plus.",
      how: "See how it works",
      lost: "lost",
      title: "This page isn’t available.",
      description: "You can still find businesses and book appointments on Zavoia.",
      explore: "Find a business",
    },

  },
};

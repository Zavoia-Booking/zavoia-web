import type { Locale } from "../locales";

// English dictionary — the source of truth for the `Dictionary` type
// (`type Dictionary = typeof en`). Add new keys here first, then mirror
// them in ./ro.ts (TypeScript enforces that ro matches this shape).
// Note: no `as const` — values stay `string` so ro can hold different text.
export const en: {
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
    available: {
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
      kicker: string;
      title: string;
    };
    editorsPick: {
      kicker: string;
      title: string;
      sub: string;
      cta: string;
      viewProfile: string;
      prev: string;
      next: string;
    };
    trust: {
      kicker: string;
      title: string;
      items: {
        title: string;
        sub: string;
      }[];
    };
    app: {
      kicker: string;
      title: string;
      sub: string;
      appStore: string;
      googlePlay: string;
      mockLabel: string;
    };
    bizStrip: {
      kicker: string;
      title: string;
      meta: string;
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
  category: {
    titleTemplate: string;
    descriptionTemplate: string;
    heading: string;
    body1: string;
    body2: string;
    body3: string;
    listHeading: string;
    comingSoon: string;
    otherCitiesHeading: string;
    otherIndustriesHeading: string;
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
    businessOwnerPrompt: string;
    businessOwnerCta: string;
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
    };
    passwordStrength: {
      label: string;
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
      greeting: string;
      explanation: string;
      sendLink: string;
      sending: string;
      sentFallback: string;
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
      appointments: string;
      reviews: string;
      saved: string;
      memberSince: string;
    };
    verifiedPill: string;
    unverifiedPill: string;
    emailReadOnlyNote: string;
    notif: {
      marketing: string;
      marketingCaption: string;
      reminders: string;
      remindersCaption: string;
      push: string;
      pushCaption: string;
      sms: string;
      smsCaption: string;
      email: string;
      emailCaption: string;
      reminderEmailCaption: string;
    };
    password: {
      current: string;
      new: string;
      confirm: string;
      rules: string;
      tooShort: string;
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
      currentLabel: string;
      newLabel: string;
      newPlaceholder: string;
      submit: string;
      submitting: string;
      cancel: string;
      manageHint: string;
      invalidEmail: string;
      changedToast: string;
      otherSessionsRevoked: string;
      otherSessionsRevokedOne: string;
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
    sectionError: string;
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
      };
    };
  };
  saved: {
    title: string;
    kicker: string;
    heading: string;
    countSuffix: string;
    tabs: {
      all: string;
      businesses: string;
      locations: string;
      people: string;
    };
    empty: {
      title: string;
      body: string;
      cta: string;
    };
    filteredEmpty: string;
    removed: string;
    undo: string;
    removeError: string;
    removeAria: string;
    gate: {
      title: string;
      body: string;
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
    bookHeading: string;
    bookRailEmpty: string;
    totalLabel: string;
    freeCancellation: string;
    cancellationAnytime: string;
    noFreeCancellation: string;
    cancellationWindowDay: string;
    cancellationWindowDays: string;
    loadMoreReviews: string;
    reviewsCount: string;
    reviewsCountOne: string;
    onlineBookingUnavailable: string;
    noServices: string;
    closed: string;
    call: string;
    directions: string;
    share: string;
    shareCopied: string;
    close: string;
    continue: string;
    comingSoon: string;
    notFoundKicker: string;
    notFoundTitle: string;
    notFoundBody: string;
    backToExplore: string;
    browseBusinesses: string;
  };
  booking: {
    stepServicesTitle: string;
    stepDateTimeTitle: string;
    stepReviewTitle: string;
    stepProgress: string;
    selectServicesEmpty: string;
    noAvailability: string;
    nextAvailable: string;
    jumpToNext: string;
    slotsCountLabel: string;
    morning: string;
    afternoon: string;
    evening: string;
    fullyBookedDay: string;
    chooseTime: string;
    anyAvailable: string;
    staffLabel: string;
    serviceCount: string;
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
    cancellationDeadline: string;
    rescheduleDeadline: string;
    cancellationRescheduleDeadline: string;
    cancellationAnytime: string;
    rescheduleAnytime: string;
    cancellationRescheduleAnytime: string;
    noFreeCancellationOrReschedule: string;
    noFreeCancellation: string;
    noFreeReschedule: string;
    payAtVenueTitle: string;
    payAtVenueNote: string;
    freeCancellationTitle: string;
    rescheduleTitle: string;
    back: string;
    retry: string;
    loading: string;
    loadError: string;
    rebookError: string;
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
    signIn: string;
    reviews: string;
    open: string;
    closed: string;
    open247: string;
    closesAt: string;
    photo: string;
  };
  nav: {
    explore: string;
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
  searchOverlay: {
    overlayTitle: string;
    what: string;
    where: string;
    when: string;
    whatSummary: string;
    whatPlaceholder: string;
    browseByCategory: string;
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
    editSearch: string;
  };
  // Industry / industry-tag display names, keyed by the stable API slug.
  // Backend `industry.name` / `industry_tag.name` are English; consumers look
  // up `dict.industries[slug] ?? industry.name` so an unmapped slug still
  // renders (the backend name) instead of breaking.
  industries: Record<string, string>;
  industryTags: Record<string, string>;
  footer: {
    tagline: string;
    explore: string;
    zavoia: string;
    support: string;
    about: string;
    journal: string;
    forBusiness: string;
    pricing: string;
    businessDashboard: string;
    helpCentre: string;
    myTickets: string;
    cancellation: string;
    offers: string;
    privacy: string;
    terms: string;
    rights: string;
    langLine: string;
    catHair: string;
    catNails: string;
    catMassage: string;
    catDental: string;
    catAuto: string;
    catCleaning: string;
  };
  accountMenu: {
    appointments: string;
    saved: string;
    profileSettings: string;
    journal: string;
    helpSupport: string;
    forBusiness: string;
    pricing: string;
    logout: string;
    loggedOut: string;
    login: string;
    welcome: string;
    loginOrSignUp: string;
  };
  notifications: {
    title: string;
    emptyTitle: string;
    emptyBody: string;
  };
  mobileTabs: {
    explore: string;
    search: string;
    bookings: string;
    saved: string;
    help: string;
    offers: string;
  };
  toast: {
    signedOut: string;
  };
  breadcrumbHome: string;
  localeNames: Record<Locale, string>;
  forBusiness: {
    pageTitle: string;
    pageDescription: string;
    dashboardToast: string;
    hero: {
      kicker: string;
      titleLead: string;
      titleMid: string;
      titleMuted: string;
      subcopy: string;
      ctaPrimary: string;
      ctaPricing: string;
      trust: {
        noCommission: string;
        noFees: string;
        freeTrial: string;
      };
    };
    phone: {
      imgAlt: string;
      name: string;
      rating: string;
      pickTime: string;
      times: string[];
      confirm: string;
      footnote: string;
    };
    industries: {
      kicker: string;
      lead: string;
      items: { label: string }[];
    };
    overview: {
      kicker: string;
      title: string;
      subcopy: string;
      tiles: {
        diary: string;
        demand: string;
        defence: string;
        reviews: string;
        team: string;
        locations: string;
      };
      calendar: {
        head: string;
        fillingUp: string;
        rows: { time: string; label: string; state: "booked" | "open" }[];
      };
      search: {
        head: string;
        topResult: string;
        logo: string;
        name: string;
        meta: string;
        verified: string;
        book: string;
        note: string;
      };
      reminder: {
        title: string;
        sub: string;
        reschedule: string;
        confirm: string;
      };
      review: {
        name: string;
        verified: string;
        quote: string;
      };
      teamCard: {
        name: string;
        meta: string;
        nextFree: string;
        book: string;
      };
      locationsCard: {
        head: string;
        branches: string;
        rows: { name: string; sub: string; on: boolean }[];
      };
    };
    switch: {
      kicker: string;
      title: string;
      subcopyLead: string;
      subcopyEm: string;
      subcopyTail: string;
      colZavoia: string;
      colMarket: string;
      colSoft: string;
      rows: {
        label: string;
        zav: string;
        market: string;
        soft: string;
      }[];
      cta: string;
      ctaNote: string;
    };
    setup: {
      title: string;
      trialBadge: string;
      steps: {
        n: string;
        title: string;
        body: string;
      }[];
    };
    testimonials: {
      kicker: string;
      prevLabel: string;
      nextLabel: string;
      items: {
        biz: string;
        photo: string;
        quote: string;
        name: string;
        role: string;
        context: string;
      }[];
    };
    pricingStrip: {
      perMember: string;
      perMonth: string;
      onePlan: string;
      monthlyLine: string;
      ctaPricing: string;
      ctaTrial: string;
    };
    faq: {
      kicker: string;
      title: string;
      asideLead: string;
      asideCta: string;
      asideTail: string;
      items: { q: string; a: string }[];
    };
    ctaBand: {
      kicker: string;
      title: string;
      sub: string;
      ctaPrimary: string;
      ctaSecondary: string;
    };
  };
  pricing: {
    pageTitle: string;
    pageDescription: string;
    head: {
      kicker: string;
      title: string;
      sub: string;
    };
    plan: {
      trialBadge: string;
      perMember: string;
      perMonth: string;
      blurb: string;
      features: string[];
      cta: string;
    };
    calc: {
      kicker: string;
      title: string;
      membersLabel: string;
      trackSolo: string;
      trackMax: string;
      total: string;
      perMonth: string;
    };
    compare: {
      kicker: string;
      title: string;
      blurb: string;
      checks: string[];
      receiptHeader: string;
      lineService: string;
      lineTip: string;
      lineVisitTotal: string;
      lineFee: string;
      lineYouKeep: string;
      footnoteLine1: string;
      footnoteLine2: string;
    };
    faq: {
      kicker: string;
      title: string;
      items: { q: string; a: string }[];
    };
    cta: {
      kicker: string;
      title: string;
      sub: string;
      primary: string;
    };
  };
  appointments: {
    kicker: string;
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
    edit: string;
    getDirections: string;
    callVenue: string;
    leaveReview: string;
    bookAgain: string;
    directions: string;
    reschedule: string;
    rescheduleUnavailable: string;
    cancelAppointment: string;
    youMissedAppointment: string;
    cancelledTitle: string;
    freeCancellationUpTo: string;
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
      windowNote: string;
      successToast: string;
      error: string;
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
    };
    review: {
      titleNew: string;
      titleEdit: string;
      sub: string;
      publicNote: string;
      submitNew: string;
      submitEdit: string;
      noteLabel: string;
      notePlaceholder: string;
      ratePrompt: string;
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
} = {
  preposition: "in",
  home: {
    title: "Zavoia — Booking & Discovery in Romania",
    description:
      "Find and book barbers, nail salons, hair salons, massage and spa services across Romania.",
    heading: "Zavoia — Booking & Discovery in Romania",
    intro:
      "Browse barbers, nail salons, hair salons, massage and spa services in every major city.",
    heroTagline: "Local bookings, made simple.",
  },
  homeSections: {
    hero: {
      headlineLead: "Book the city's best,",
      headlineAccent: "in seconds.",
      subcopy:
        "See real-time availability from trusted local professionals — and reserve in a couple of clicks.",
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
    available: {
      kicker: "Just joined",
      title: "Fresh on Zavoia",
      action: "See all",
      empty: "New places are joining all the time — check back soon.",
    },
    nearYou: {
      kicker: "Near you",
      title: "More places nearby",
      action: "Open map",
      showMore: "Show more places",
      locating: "Finding places near you…",
    },
    recentlyViewed: {
      kicker: "Pick up where you left off",
      title: "Recently viewed",
    },
    editorsPick: {
      kicker: "Editor's picks",
      title: "The standouts near you",
      sub: "Hand-picked studios and pros worth the trip. Open a profile to see services and book.",
      cta: "See all businesses",
      viewProfile: "View profile",
      prev: "Previous",
      next: "Next",
    },
    trust: {
      kicker: "Why Zavoia",
      title: "Booking you can trust",
      items: [
        {
          title: "Book local services",
          sub: "Find and book appointments with businesses in your area.",
        },
        {
          title: "Easy online booking",
          sub: "Choose a service, pick a time, and book in just a few clicks.",
        },
        {
          title: "Pay at the venue",
          sub: "Nothing upfront. Settle directly with the business after your visit.",
        },
      ],
    },
    app: {
      kicker: "The Zavoia app",
      title: "Your bookings, in your pocket",
      sub: "Live slots, two-tap rebooking and reminders that actually remind — the whole marketplace, wherever you are",
      appStore: "App Store",
      googlePlay: "Google Play",
      mockLabel: "Zavoia app",
    },
    bizStrip: {
      kicker: "Bring your business online",
      title: "Get found, booked, and rebooked by local clients.",
      meta: "No commission · simple pricing · start today",
      cta: "Zavoia for business",
      pricing: "Pricing",
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
  category: {
    titleTemplate: "{industry} in {city}",
    descriptionTemplate:
      "Find and book the best {industryLower} in {city}. Compare services, prices and availability on Zavoia.",
    heading: "{industry} in {city}",
    body1:
      "Looking for {industryLower} in {city}? Zavoia helps you discover and book trusted local spots — compare services, prices and availability, then book online in a few clicks.",
    body2:
      "Every business listed in {city} is independently operated. Availability and pricing are kept up to date by the owners themselves, so what you see is what you book.",
    body3:
      "Want to shop around? Zavoia also covers {industryLower} in other Romanian cities — see the related links below.",
    listHeading: "{industry} in {city}",
    comingSoon:
      "Businesses coming soon — Zavoia is onboarding {industryLower} in {city} now.",
    otherCitiesHeading: "{industry} in other cities",
    otherIndustriesHeading: "Other services in {city}",
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
    businessOwnerPrompt: "Business owner?",
    businessOwnerCta: "Sign in to your dashboard",
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
        'Signed up with Google? Use "Continue with Google" above.',
      emailInvalid: "Enter a valid email address.",
      emailRequired: "Email is required.",
      passwordRequired: "Password is required.",
      passwordTooShort: "Password must be at least 8 characters.",
      passwordWeak:
        "Password must include lowercase, uppercase, digit and a special character.",
      firstNameRequired: "First name is required.",
      lastNameRequired: "Last name is required.",
      nameTooShort: "Must be at least 2 characters.",
      nameTooLong: "Must be fewer than 50 characters.",
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
    },
    passwordStrength: {
      label: "Password strength",
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
      heading: "Enable marketplace access",
      greeting: "Hi {name},",
      explanation:
        "You already have a Zavoia business account with this email. To keep your account safe, we'll email you a secure link — open it and confirm your password to enable marketplace access. No new account needed.",
      sendLink: "Email me the secure link",
      sending: "Sending...",
      sentFallback:
        "If the email is associated with a business account, we've sent a link to enable marketplace access.",
      cancel: "Back to sign in",
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
      confirmBody:
        "To enable marketplace access for {email}, confirm your account password.",
      googleOnlyBody:
        "The account {email} uses Google sign-in. Continue with Google to enable marketplace access.",
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
      appointments: "Appointments",
      reviews: "Reviews",
      saved: "Saved",
      memberSince: "Member since {date}",
    },
    verifiedPill: "Email verified",
    unverifiedPill: "Email not verified",
    emailReadOnlyNote: "Contact support to change your email address.",
    notif: {
      marketing: "Marketing",
      marketingCaption:
        "Receive updates about promotions, offers, and new features.",
      reminders: "Reminders",
      remindersCaption: "Get reminded about your upcoming appointments.",
      push: "Push notifications",
      pushCaption: "Get notified on your device",
      sms: "SMS",
      smsCaption: "Receive text messages",
      email: "Email",
      emailCaption: "Receive promotional emails",
      reminderEmailCaption: "Receive email reminders",
    },
    password: {
      current: "Current password",
      new: "New password",
      confirm: "Confirm new password",
      rules: "Use at least 8 characters.",
      tooShort: "Password must be at least 8 characters.",
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
      caption: "Change the email you use to sign in.",
      currentLabel: "Current email",
      newLabel: "New email",
      newPlaceholder: "you@example.com",
      submit: "Update email",
      submitting: "Updating…",
      cancel: "Cancel",
      manageHint: "Click here to change your email",
      invalidEmail: "Enter a valid email address.",
      changedToast: "Email updated",
      otherSessionsRevoked: "You were signed out on {count} other devices.",
      otherSessionsRevokedOne: "You were signed out on 1 other device.",
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
    sectionError: "Couldn't load this section. Please try again.",
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
      },
    },
  },
  saved: {
    title: "Saved",
    kicker: "Your shortlist",
    heading: "Saved",
    countSuffix: "saved",
    tabs: {
      all: "All",
      businesses: "Businesses",
      locations: "Locations",
      people: "People",
    },
    empty: {
      title: "Nothing saved yet",
      body: "Tap the heart on any place, venue or team member — your favourites collect here for next time.",
      cta: "Browse places",
    },
    filteredEmpty: "Nothing saved in this category yet.",
    removed: "Removed · {name}",
    undo: "Undo",
    removeError: "Something went wrong. Please try again.",
    removeAria: "Remove {name} from saved",
    gate: {
      title: "Your shortlist, saved.",
      body: "Sign in to keep the places, venues and people you love in one tap-to-rebook list.",
      secondary: "Explore places",
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
    bundles: "Packages",
    bundleSave: "Save",
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
    bookHeading: "Book an appointment",
    bookRailEmpty:
      "Pick one or more services from the list — or jump straight in and choose during booking.",
    totalLabel: "total",
    freeCancellation: "Free cancellation up to {window} before",
    cancellationAnytime: "Free cancellation anytime",
    noFreeCancellation: "Cancellation policy applies",
    cancellationWindowDay: "{count} day",
    cancellationWindowDays: "{count} days",
    loadMoreReviews: "Show more reviews",
    reviewsCount: "{count} reviews",
    reviewsCountOne: "{count} review",
    onlineBookingUnavailable: "Online booking unavailable",
    noServices: "No services listed yet.",
    closed: "Closed",
    call: "Call",
    directions: "Directions",
    share: "Share",
    shareCopied: "Link copied",
    close: "Close",
    continue: "Continue",
    comingSoon: "Booking is coming soon.",
    notFoundKicker: "NOT FOUND",
    notFoundTitle: "This place isn't on Zavoia.",
    notFoundBody:
      "It may have closed or moved. Plenty of other trusted pros are a click away.",
    backToExplore: "Back to Explore",
    browseBusinesses: "Browse businesses",
  },
  booking: {
    stepServicesTitle: "Choose services",
    stepDateTimeTitle: "Pick a date & time",
    stepReviewTitle: "Review & confirm",
    stepProgress: "Step {n} of {total}",
    selectServicesEmpty: "Select at least one service to continue.",
    noAvailability: "No availability in the next 30 days.",
    nextAvailable: "Next available: {date}",
    jumpToNext: "Jump to next available",
    slotsCountLabel: "{count} slots",
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    fullyBookedDay: "Fully booked this day — try another date.",
    chooseTime: "Choose a time to continue.",
    anyAvailable: "Any available",
    staffLabel: "Professional",
    serviceCount: "{count} services · {duration}",
    dateLabel: "Date",
    todayLabel: "Today",
    confirmBooking: "Confirm booking",
    booking: "Booking…",
    signInToBook: "Sign in to book",
    successTitle: "You're booked",
    successBody: "{services} at {business}",
    pendingTitle: "Booking requested",
    pendingBody: "{services} at {business} — awaiting confirmation.",
    viewAppointment: "View appointment",
    done: "Done",
    close: "Close",
    cancellationDeadline: "Cancel for free until {date}.",
    rescheduleDeadline: "Reschedule for free until {date}.",
    cancellationRescheduleDeadline: "Cancel or reschedule for free until {date}.",
    cancellationAnytime: "Cancel for free anytime.",
    rescheduleAnytime: "Reschedule for free anytime.",
    cancellationRescheduleAnytime: "Cancel or reschedule for free anytime.",
    noFreeCancellationOrReschedule: "Cancellation and reschedule policy applies.",
    noFreeCancellation: "Cancellation policy applies.",
    noFreeReschedule: "Reschedule policy applies.",
    freeCancellationTitle: "Free cancellation",
    rescheduleTitle: "Free reschedule",
    payAtVenueTitle: "Pay at the venue",
    payAtVenueNote: "Nothing to pay now — settle directly with {business} after your visit.",
    back: "Back",
    retry: "Try again",
    loading: "Loading…",
    loadError: "We couldn't load availability. Please try again.",
    rebookError: "Some services may have changed — review the menu to book again.",
    errors: {
      tooSoon: "That time is too soon to book. Please pick a later date.",
      tooFar: "That date is too far ahead. Please pick an earlier date.",
      slotConflict: "That slot was just taken. Please choose another time.",
      outsideHours: "That time is outside opening hours. Please choose another.",
      calendarBlock: "That time is no longer available. Please choose another.",
      staffUnavailable: "That professional isn't available then. Please choose another time.",
      generic: "Something went wrong. Please try again.",
    },
  },
  common: {
    signIn: "Sign in",
    reviews: "reviews",
    open: "Open",
    closed: "Closed",
    open247: "Open 24/7",
    closesAt: "Closes {time}",
    photo: "photo",
  },
  nav: {
    explore: "Explore",
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
  searchOverlay: {
    overlayTitle: "What can we help you find?",
    what: "What?",
    where: "Where?",
    when: "When?",
    whatSummary: "All services",
    whatPlaceholder: "All services and businesses",
    browseByCategory: "Browse by category",
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
    sortLabel: "Sort",
    sortTopRated: "Top rated",
    sortNearest: "Nearest",
    filterAll: "All",
    filterOpenNow: "Open now",
    filterAvailableToday: "Available today",
    emptyTitle: "No places match those filters",
    emptyBody: "Try widening your filters or clearing the category.",
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
    editSearch: "Edit search",
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
    tagline:
      "Book trusted local professionals — beauty, health, home and more — in a couple of clicks.",
    explore: "Explore",
    zavoia: "Zavoia",
    support: "Support",
    about: "About",
    journal: "Journal",
    forBusiness: "For business",
    pricing: "Pricing",
    businessDashboard: "Business dashboard",
    helpCentre: "Help centre",
    myTickets: "My tickets",
    cancellation: "Cancellation policy",
    offers: "Offers",
    privacy: "Privacy",
    terms: "Terms",
    rights: "© 2026 ZAVOIA",
    langLine: "ENGLISH (UK) · GBP £",
    catHair: "Hair",
    catNails: "Nails",
    catMassage: "Massage",
    catDental: "Dental",
    catAuto: "Auto",
    catCleaning: "Cleaning",
  },
  accountMenu: {
    appointments: "Appointments",
    saved: "Saved",
    profileSettings: "Profile & settings",
    journal: "The Journal",
    helpSupport: "Help & support",
    forBusiness: "For business",
    pricing: "Pricing",
    logout: "Log out",
    loggedOut: "Signed out",
    login: "Log in",
    welcome: "Welcome",
    loginOrSignUp: "Log in or sign up",
  },
  notifications: {
    title: "Notifications",
    emptyTitle: "You're all caught up",
    emptyBody: "New bookings, reminders and updates will show up here.",
  },
  mobileTabs: {
    explore: "Explore",
    search: "Search",
    bookings: "Bookings",
    saved: "Saved",
    help: "Help",
    offers: "Offers",
  },
  toast: {
    signedOut: "Signed out",
  },
  breadcrumbHome: "Home",
  localeNames: { ro: "Română", en: "English" },
  forBusiness: {
    pageTitle: "Zavoia for business — your calendar, full",
    pageDescription:
      "Salons, barbers, garages, clinics, trainers and groomers across Romania get found by nearby clients, with live availability, per-location calendars and reminders that kill no-shows. Clients pay you in person — no commission.",
    dashboardToast: "Opening the Zavoia Business dashboard…",
    hero: {
      kicker: "Zavoia for business",
      titleLead: "Your bookings.",
      titleMid: "Your clients.",
      titleMuted: "Your revenue.",
      subcopy:
        "Salons, barbers, garages, clinics, trainers, groomers — wherever people book a time, Zavoia puts you in front of the clients searching nearby, with live availability, per-location calendars and reminders that reduce no-shows. Clients pay you in person, so we never take a cut.",
      ctaPrimary: "Get started free",
      ctaPricing: "See pricing",
      trust: {
        noCommission: "No commission",
        noFees: "No booking fees",
        freeTrial: "First 2 weeks free, no card required",
      },
    },
    phone: {
      imgAlt: "Glow Studio on Zavoia",
      name: "Glow Studio",
      rating: "4.9 · Hair · Centru Vechi",
      pickTime: "Choose a time · Tue 16 Dec",
      times: ["14:00", "14:30", "15:00", "15:30", "16:30"],
      confirm: "Confirm · Balayage + tone",
      footnote: "Pay at the venue · free cancellation",
    },
    industries: {
      kicker: "For every local service",
      lead: "Not just salons and spas — anywhere clients book a time.",
      items: [
        { label: "Salons & stylists" },
        { label: "Barbers" },
        { label: "Nails & beauty" },
        { label: "Spas & massage" },
        { label: "Skin & aesthetics" },
        { label: "Garages & MOT" },
        { label: "Dentists & clinics" },
        { label: "Trainers & studios" },
        { label: "Pet grooming" },
        { label: "Cleaners & trades" },
      ],
    },
    overview: {
      kicker: "One workspace",
      title: "Run your whole business from one dashboard",
      subcopy:
        "Manage bookings, calendars, team members, locations, reviews, and new client requests — all in one place.",
      tiles: {
        diary: "Today's diary",
        demand: "New-client demand",
        defence: "No-show defence",
        reviews: "Verified reviews",
        team: "Team profiles",
        locations: "Every location",
      },
      calendar: {
        head: "TUE 16 DEC · MARA",
        fillingUp: "Filling up",
        rows: [
          { time: "10:30", label: "Ioana M. — Balayage + tone", state: "booked" },
          { time: "12:00", label: "Open slot", state: "open" },
          { time: "13:30", label: "Ruxandra P. — Gloss & blow-dry", state: "booked" },
        ],
      },
      search: {
        head: "MARKETPLACE · CENTRU VECHI",
        topResult: "Top result",
        logo: "G",
        name: "Glow Studio",
        meta: "Hair · Centru Vechi",
        verified: "Verified",
        book: "Book",
        note: "Found by clients searching nearby — not ones you already had.",
      },
      reminder: {
        title: "Your appointment is in 3 hours",
        sub: "Glow Studio · 15:30 · with Mara",
        reschedule: "Reschedule",
        confirm: "I'll be there",
      },
      review: {
        name: "Diana K.",
        verified: "VERIFIED",
        quote:
          "“Best balayage in Centru Vechi — booked my next visit before I’d left the chair.”",
      },
      teamCard: {
        name: "Ana M.",
        meta: "Curls & texture · 6 yrs",
        nextFree: "NEXT FREE · TODAY 17:15",
        book: "Book Ana",
      },
      locationsCard: {
        head: "YOUR LOCATIONS",
        branches: "3 branches",
        rows: [
          { name: "Centru Vechi", sub: "6 in the diary today", on: true },
          { name: "Floreasca", sub: "4 in the diary today", on: true },
          { name: "Pipera", sub: "Opening next month", on: false },
        ],
      },
    },
    switch: {
      kicker: "Why owners switch",
      title: "Get discovered without giving up your margin.",
      subcopyLead:
        "Big marketplaces can bring new clients, but they often take a cut and control the relationship. Booking software gives you control, but doesn’t help clients find you. Zavoia gives you both: customers discover you ",
      subcopyEm: "and",
      subcopyTail: " direct bookings, with no commission.",
      colZavoia: "Zavoia",
      colMarket: "Marketplace apps",
      colSoft: "Booking software",
      rows: [
        {
          label: "Commission on bookings",
          zav: "€0 — ever",
          market: "Often 15–30%",
          soft: "€0",
        },
        {
          label: "Helps bring new clients",
          zav: "Yes — local marketplace discovery",
          market: "Yes, but you pay for access",
          soft: "No — you bring your own",
        },
        {
          label: "Works for solo, teams, and multiple locations",
          zav: "Built in",
          market: "Varies",
          soft: "Varies",
        },
        {
          label: "Payments",
          zav: "Clients pay you directly",
          market: "Platform may process and take a cut",
          soft: "Usually their processor",
        },
        {
          label: "Commitment",
          zav: "Monthly, cancel anytime",
          market: "Varies",
          soft: "Often annual contracts",
        },
      ],
      cta: "Create my business page",
      ctaNote:
        "Your first 2 weeks are free · Set up in minutes · No commission, ever.",
    },
    setup: {
      title: "Start taking bookings today",
      trialBadge: "Your first 2 weeks are free",
      steps: [
        {
          n: "01",
          title: "Create your business page",
          body: "Add your photos, services, prices, locations, and team members in minutes.",
        },
        {
          n: "02",
          title: "Set your availability",
          body: "Control when each location and team member can be booked. Clients only see real open times.",
        },
        {
          n: "03",
          title: "Start getting bookings",
          body: "Show up in local search, accept bookings online, and make it easy for clients to come back.",
        },
      ],
    },
    testimonials: {
      kicker: "What owners say",
      prevLabel: "Previous testimonial",
      nextLabel: "Next testimonial",
      items: [
        {
          biz: "Glow Studio · Centru Vechi",
          photo:
            "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&q=80",
          quote:
            "We used to lose Tuesday mornings to the phone. Now the calendar fills itself overnight, the no-shows all but vanished, and my stylists each have their own following.",
          name: "Dana Ionescu",
          role: "Owner",
          context: "Team of 7 · on Zavoia since 2024",
        },
        {
          biz: "Maison Noir · Floreasca",
          photo:
            "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=80",
          quote:
            "We stopped thinking of the calendar as something to fill and started thinking of it as something to defend. Walk-ins became regulars with a rebooking habit.",
          name: "Andrei Pop",
          role: "Master barber",
          context: "Team of 4 · on Zavoia since 2025",
        },
        {
          biz: "Kepler Garage · Pipera",
          photo:
            "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=1200&q=80",
          quote:
            "Customers book an MOT at 11pm from their sofa. The phone barely rings now — and the bays stay full all week.",
          name: "Marius Vasile",
          role: "Owner",
          context: "6 bays · on Zavoia since 2025",
        },
      ],
    },
    pricingStrip: {
      perMember: "per bookable team member",
      perMonth: "per month",
      onePlan: "One plan. Every feature. No commission.",
      monthlyLine:
        "Billed monthly per bookable member · {trial}-day free trial · cancel anytime",
      ctaPricing: "See full pricing",
      ctaTrial: "Start free trial",
    },
    faq: {
      kicker: "Questions",
      title: "The things owners ask first",
      asideLead: "Not sure it fits your trade? ",
      asideCta: "Talk to the team",
      asideTail: ".",
      items: [
        {
          q: "Do you really take no commission?",
          a: "None. Clients pay you directly, in person — Zavoia never touches the money, so there is nothing for us to take a cut of. Your subscription is the whole price.",
        },
        {
          q: "So how do payments work?",
          a: "However they already do. Clients pay you at the venue by whatever methods you accept; Zavoia handles the booking, reminders and reviews, never the transaction. That is exactly what keeps it commission-free.",
        },
        {
          q: "Do I need a team to use it?",
          a: "No. Run solo with a single calendar, or give every team member their own bookable page — your call. Appointments can sit against a location directly when there is no named person to book.",
        },
        {
          q: "Can I add multiple locations?",
          a: "Yes. Manage all your locations from one account. Each location can have its own team, services, calendars, and opening hours. One subscription covers everything.",
        },
        {
          q: "How do we get started?",
          a: "Add your locations, services and anyone who takes appointments in the Zavoia Business dashboard, then open the calendar. Most businesses are live the same afternoon, and the first {trial} days are free.",
        },
        {
          q: "Can we cancel anytime?",
          a: "Yes. Zavoia is month-to-month, with no minimum term and no long-term contract.",
        },
      ],
    },
    ctaBand: {
      kicker: "Zavoia for business",
      title: "Get discovered, booked, and rebooked by local clients.",
      sub: "Your first 2 weeks are free. No commission, ever. Set up today.",
      ctaPrimary: "Get started free",
      ctaSecondary: "See pricing",
    },
  },
  pricing: {
    pageTitle: "Pricing — Zavoia",
    pageDescription:
      "One plan, priced per bookable team member. Every feature included, €{monthly} per member a month, billed monthly. No commission on your bookings, ever.",
    head: {
      kicker: "Pricing",
      title: "One plan. Priced by team, not by tier.",
      sub: "Every feature included, €{monthly} per bookable team member per month, billed monthly. No commission on your bookings, ever.",
    },
    plan: {
      trialBadge: "{trial}-day free trial",
      perMember: "per bookable team member",
      perMonth: "per month",
      blurb:
        "Every feature, for every business — from a one-chair studio to a twenty-bay garage. No commission on bookings. No setup fee. No contract.",
      features: [
        "Unlimited bookings & clients",
        "Marketplace listing across your city",
        "Reminders, deposits & no-show protection",
        "Payments with daily payouts",
        "Per-member profiles, portfolios & reviews",
        "Insights & exports",
      ],
      cta: "Start your free trial",
    },
    calc: {
      kicker: "What would you pay?",
      title: "Price out your team",
      membersLabel: "Bookable team members",
      trackSolo: "SOLO",
      trackMax: "25",
      total: "Your total",
      perMonth: "/ month",
    },
    compare: {
      kicker: "The difference",
      title: "No commission. We mean it.",
      blurb:
        "Most marketplaces take a cut of every new client's first visit — typically 20–30% — or charge to be seen at all. On Zavoia, a client who finds you through the marketplace costs exactly what a regular costs: nothing beyond your subscription.",
      checks: [
        "No new-client acquisition fees — ever",
        "No per-booking or “boost” charges to stay visible",
      ],
      receiptHeader: "NEW CLIENT · FIRST VISIT",
      lineService: "Balayage + tone",
      lineTip: "Tip",
      lineVisitTotal: "Visit total",
      lineFee: "Zavoia marketplace fee",
      lineYouKeep: "You keep",
      footnoteLine1: "ELSEWHERE, THIS VISIT COSTS YOU €34–€56",
      footnoteLine2: "IN NEW-CLIENT COMMISSION",
    },
    faq: {
      kicker: "Questions",
      title: "Pricing, without the asterisks",
      items: [
        {
          q: "Who counts toward the per-member price?",
          a: "Only people clients can book time with. A salon with five stylists and two receptionists pays for five. Owners and admin staff use the dashboard free.",
        },
        {
          q: "Is there really no commission or booking fee?",
          a: "Really. The subscription is our entire revenue from your business. Bookings, rebookings, and clients who found you through the marketplace all cost the same: nothing extra.",
        },
        {
          q: "What happens when my team changes size?",
          a: "Your bill adjusts automatically. Add a member mid-month and you pay a prorated amount; remove one and the next invoice drops.",
        },
        {
          q: "How does the free trial work?",
          a: "Full product, every feature, {trial} days, no card required to start. Take real bookings during the trial — if you leave, your data exports with you.",
        },
        {
          q: "Are prices inclusive of VAT?",
          a: "Prices shown exclude VAT, which is added at checkout where applicable. VAT invoices are issued automatically every billing cycle.",
        },
        {
          q: "How does billing work?",
          a: "Monthly, with no minimum term. You're billed per bookable member each month and can cancel anytime — there's no annual lock-in.",
        },
      ],
    },
    cta: {
      kicker: "Ready when you are",
      title: "Try Zavoia free for 2 weeks",
      sub: "Every feature included. No card needed.",
      primary: "Start free",
    },
  },
  appointments: {
    kicker: "Your bookings",
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
    loading: "Loading your appointments…",
    errorLoading: "We couldn't load your appointments. Please try again.",
    retry: "Try again",
    notes: {
      upcomingEmpty: "Nothing coming up yet — your next visit will show here.",
      pastEmpty:
        "Your completed visits will show here once you've had your first.",
      cancelledEmpty: "No cancellations — a clean record.",
      noShowEmpty: "No missed visits. Nice.",
    },
    empty: {
      title: "An empty schedule, for now.",
      body: "Your visits show up here — the date, the place, and everything you need to walk in.",
      cta: "Explore places near you",
    },
    gate: {
      title: "Keep every booking in one place.",
      body: "Sign in to see your upcoming and past appointments, with reminders, reschedules and directions.",
      secondary: "Explore places",
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
      about: "About the venue",
    },
    bundleTag: "Bundle",
    subtotal: "Subtotal",
    bundleDiscount: "Bundle discount",
    totalAtVenue: "Total at venue",
    payDirectly: "Pay directly with {business}",
    free: "Free",
    awaitingConfirmation: "Awaiting confirmation",
    awaitingConfirmationBody:
      "{business} usually confirms within a few hours. We'll notify you the moment they do — nothing's charged until then.",
    inProgress: "In progress",
    endingNow: "Ending now",
    oneMinLeft: "1 min left",
    minsLeft: "{n} min left",
    visitOfTotal: "Visit {index} of {total}",
    finalVisit: "Final visit in this series",
    nextOn: "Next on {date}",
    viewVenue: "View venue",
    viewProfile: "View profile",
    edit: "Edit",
    getDirections: "Get directions",
    callVenue: "Call venue",
    leaveReview: "Leave a review",
    bookAgain: "Book again",
    directions: "Directions",
    reschedule: "Reschedule",
    rescheduleUnavailable: "Reschedule unavailable",
    cancelAppointment: "Cancel appointment",
    youMissedAppointment: "You missed this appointment",
    cancelledTitle: "Cancelled",
    freeCancellationUpTo: "Free cancellation up to {n}h before",
    bookedOn: "Booked {date}",
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
      "Your bookings are private. Sign in to see the details, reschedule or get directions.",
    explorePlaces: "Explore places",
    notFound: "Appointment not found",
    backToAppointments: "Back to appointments",
    loading: "Loading appointment…",
    errorLoading: "We couldn't load this appointment. Please try again.",
  },
  help: {
    pageTitle: "Help centre — Zavoia",
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
        label: "Booking & appointments",
        items: [
          {
            q: "How do I book an appointment?",
            a: "Search, pick a service and a time, and confirm — no payment needed up front.",
          },
          {
            q: "Can I reschedule or cancel?",
            a: "Yes — free up to the venue's cancellation window, usually 24 hours before your appointment.",
          },
          {
            q: "How do recurring appointments work?",
            a: "Series bookings repeat on a cadence you choose and show progress like \"2 of 4\" so you can track them.",
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
            a: "Every business on Zavoia is identity-checked before it can accept bookings.",
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
        { label: "Cancellation policy", href: ["legal", "cancellation"] },
        { label: "List your business", href: ["for-business"] },
        { label: "Privacy policy", href: ["legal", "privacy"] },
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
      confirm: "Cancel booking",
      windowNote:
        "You're within the free window — cancelling now costs nothing. After {hours}h before your slot, the venue's cancellation fee may apply.",
      successToast: "Appointment cancelled",
      error: "We couldn't cancel your appointment. Please try again.",
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
      error: "We couldn't reschedule. Please try again.",
    },
    review: {
      titleNew: "How was it?",
      titleEdit: "Edit your review",
      sub: "Your visit to {business}",
      publicNote: "Reviews are public and tied to your visit.",
      submitNew: "Post review",
      submitEdit: "Update review",
      noteLabel: "Add a note (optional)",
      notePlaceholder: "What stood out — the result, the welcome, the space?",
      ratePrompt: "Tap to rate",
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
      error: "We couldn't submit your review. Please try again.",
    },
  },
};

// ─────────────────────────────────────────────────────────────
// Zavoia · Business Microsite — APP ROOT
// Renders the dashboard-configured section list in the editorial
// "lookbook" engine, themed by accent + font. A "Business type"
// tweak swaps the whole dataset (salon / spa / auto) to prove the
// engine is vertical-agnostic. Adds a kinetic marquee band + a
// right-rail section index.
// ─────────────────────────────────────────────────────────────

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "vertical": "salon",
  "font": "elegant",
  "accent": "#C2552F",
  "announcement": false,
  "annoText": "",
  "annoCta": "",
  "annoStyle": "neutral",
  "annoDeadline": "",
  "galleryLayout": "editorial",
  "amenitiesStyle": "row",
  "teamLayout": "portraits",
  "motion": true
}/*EDITMODE-END*/;

// Optional ?v=spa|auto|salon override for review
try {
  const qv = new URLSearchParams(location.search).get('v');
  if (qv && window.MC_VERTICALS[qv]) { TWEAK_DEFAULTS.vertical = qv; const vb = window.MC_VERTICALS[qv].vibe; TWEAK_DEFAULTS.accent = vb.accent; TWEAK_DEFAULTS.font = vb.font; }
} catch (e) {}

const MC_ACCENTS = ['#C2552F', '#1B9C85', '#7A3B57', '#2F5D4A', '#2F6E8F', '#1C1C1A'];
const MC_FONTS = [
  { value: 'modern', label: 'Modern' }, { value: 'classic', label: 'Classic' },
  { value: 'elegant', label: 'Elegant' }, { value: 'friendly', label: 'Friendly' },
];
const MC_ANNO_STYLES = [
  { value: 'neutral', label: 'Neutral' }, { value: 'offer', label: 'Offer' }, { value: 'alert', label: 'Alert' },
];
const MC_AMENITY_STYLES = [
  { value: 'row', label: 'Icon row' }, { value: 'list', label: 'Tick list' },
];
const MC_GALLERY_LAYOUTS = [
  { value: 'editorial', label: 'Editorial' }, { value: 'carousel', label: 'Carousel' }, { value: 'grid', label: 'Bento' }, { value: 'masonry', label: 'Masonry' },
];
const MC_TEAM_LAYOUTS = [
  { value: 'portraits', label: 'Portraits' }, { value: 'roster', label: 'Roster' },
];
const MC_NAV_TYPES = { about: 'About', locations: 'Locations', gallery: 'Gallery', team: 'Team', reviews: 'Reviews', contact: 'Visit' };

// ── Location preview control (bound to the live store) ──
function LocationTweak() {
  const [loc, idx, setIdx] = useMCLocation();
  return (
    <TweakSelect label="Preview location" value={loc.name}
      options={MC_LOCS.map(l => l.name)}
      onChange={(name) => { const i = MC_LOCS.findIndex(l => l.name === name); if (i >= 0) setIdx(i); }} />
  );
}

// ── Business-logo upload — feeds the footer logo store (localStorage, not the
// tweak block). Demonstrates "businesses provide their own logo"; blank = wordmark. ──
function LogoTweak() {
  const logo = useMCLogo();
  const inputRef = React.useRef(null);
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => window.MCLogoStore.set(r.result);
    r.readAsDataURL(f);
    e.target.value = '';
  };
  return (
    <TweakRow label="Business logo">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input ref={inputRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
        <div style={{ flex: 1, minWidth: 0, fontSize: 10.5, color: 'rgba(41,38,27,0.5)', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {logo
            ? <img src={logo} alt="" style={{ height: 20, maxWidth: 104, objectFit: 'contain', verticalAlign: 'middle' }} />
            : 'Wordmark (none)'}
        </div>
        <TweakButton label={logo ? 'Replace' : 'Upload'} secondary onClick={() => inputRef.current && inputRef.current.click()} />
        {logo && <TweakButton label="Clear" secondary onClick={() => window.MCLogoStore.set('')} />}
      </div>
    </TweakRow>
  );
}

function MicroApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const rootRef = React.useRef(null);
  window.__microNoMotion = !t.motion;
  window.__mcGalleryLayout = t.galleryLayout;
  window.__mcAmenitiesStyle = t.amenitiesStyle;

  // Apply the selected vertical's data BEFORE rendering children (idempotent).
  if (window.MC_VERTICAL_KEY !== t.vertical) mcSetVertical(t.vertical);

  const secs = window.MC_SECTIONS_DEFAULT;
  const visible = secs.filter(s => s.type === 'announcement' ? !!t.announcement : s.visible !== false);

  React.useEffect(() => { document.documentElement.setAttribute('data-micro-font', t.font); }, [t.font]);
  useMicroEngine(rootRef, t.motion);

  const navLinks = visible.filter(s => MC_NAV_TYPES[s.type]).map(s => ['#' + s.id, MC_NAV_TYPES[s.type]]);

  // Section dots (right rail)
  const labels = MC_BIZ.labels || {};
  const dotLabel = { hero: 'Top', about: 'About', locations: (labels.placePlural || 'Places'), gallery: 'Gallery', team: (labels.teamPlural || 'Team'), reviews: 'Reviews', faq: 'FAQ', contact: 'Visit' };
  const dotItems = visible.filter(s => dotLabel[s.type]).map(s => ({ id: s.id, label: dotLabel[s.type] }));

  const nodes = [];
  const annoCfg = { text: t.annoText, cta: t.annoCta, style: t.annoStyle, deadline: t.annoDeadline, motion: t.motion };
  visible.forEach((sec) => {
    if (sec.type === 'announcement') { nodes.push(<SecAnnouncement key={sec.id} cfg={annoCfg} />); return; }
    const Comp = window.MC_SECTION_COMPONENTS[sec.type];
    if (Comp) nodes.push(sec.type === 'gallery' ? <Comp key={sec.id} layout={t.galleryLayout} /> : sec.type === 'locations' ? <Comp key={sec.id} amenitiesStyle={t.amenitiesStyle} /> : sec.type === 'team' ? <Comp key={sec.id} layout={t.teamLayout} /> : <Comp key={sec.id} />);
    if (sec.type === 'hero' && MC_BIZ.marquee) nodes.push(<MarqueeBand key="band" items={MC_BIZ.marquee} />);
  });

  const verticalKeys = Object.keys(window.MC_VERTICALS);
  const verticalLabel = (window.MC_VERTICALS[t.vertical] || {}).label || 'Hair salon';

  return (
    <>
      <div ref={rootRef} className={'micro' + (t.motion ? '' : ' no-motion')}
           data-font={t.font} data-screen-label="Business microsite"
           style={{ '--mc-accent': t.accent }}>
        <div className="mc-progress"></div>
        <div className="mc-grain"></div>
        <MicroNav links={navLinks} />
        <SectionDots key={'dots-' + t.vertical} items={dotItems} />
        <div key={t.vertical} className="mc-flow">
          <div className="mc-content">
            {nodes}
          </div>
          <MicroFooter />
        </div>
        <BookingFlow key={'bk-' + t.vertical} />
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Business type" />
        <div style={{ fontSize: 10.5, lineHeight: 1.5, color: 'rgba(41,38,27,0.5)', margin: '-2px 0 8px' }}>
          The same page engine, themed per industry. Switching also sets the matching colour &amp; type.
        </div>
        <TweakSelect label="Industry" value={verticalLabel}
          options={verticalKeys.map(k => window.MC_VERTICALS[k].label)}
          onChange={(lbl) => {
            const key = verticalKeys.find(k => window.MC_VERTICALS[k].label === lbl) || 'salon';
            const v = window.MC_VERTICALS[key];
            setTweak({ vertical: key, accent: v.vibe.accent, font: v.vibe.font });
          }} />

        <TweakSection label="Branding" />
        <TweakColor label="Accent colour" value={t.accent} options={MC_ACCENTS} onChange={(v) => setTweak('accent', v)} />
        <TweakRadio label="Font style" value={t.font} options={MC_FONTS} onChange={(v) => setTweak('font', v)} />
        <LogoTweak />
        <div style={{ fontSize: 10.5, lineHeight: 1.5, color: 'rgba(41,38,27,0.5)', margin: '-2px 0 2px' }}>
          Provide a logo to replace the footer wordmark. Left blank, the business name shows as text.
        </div>

        <TweakSection label="Content" />
        <TweakSelect label="Gallery layout" value={(MC_GALLERY_LAYOUTS.find(l => l.value === t.galleryLayout) || {}).label || 'Editorial'}
          options={MC_GALLERY_LAYOUTS.map(l => l.label)}
          onChange={(lbl) => { const o = MC_GALLERY_LAYOUTS.find(l => l.label === lbl); if (o) setTweak('galleryLayout', o.value); }} />
        <TweakRadio label="Amenities style" value={(MC_AMENITY_STYLES.find(l => l.value === t.amenitiesStyle) || {}).label || 'Icon row'}
          options={MC_AMENITY_STYLES.map(l => l.label)}
          onChange={(lbl) => { const o = MC_AMENITY_STYLES.find(l => l.label === lbl); if (o) setTweak('amenitiesStyle', o.value); }} />
        <TweakRadio label="Team layout" value={(MC_TEAM_LAYOUTS.find(l => l.value === t.teamLayout) || {}).label || 'Portraits'}
          options={MC_TEAM_LAYOUTS.map(l => l.label)}
          onChange={(lbl) => { const o = MC_TEAM_LAYOUTS.find(l => l.label === lbl); if (o) setTweak('teamLayout', o.value); }} />
        <TweakToggle label="Announcement bar" value={t.announcement} onChange={(v) => setTweak('announcement', v)} />
        {t.announcement && (
          <>
            <TweakText label="Message" value={t.annoText}
              placeholder={(MC_BIZ.announcement || {}).text || 'Your announcement…'}
              onChange={(v) => setTweak('annoText', v)} />
            <TweakText label="CTA label" value={t.annoCta}
              placeholder={(MC_BIZ.announcement || {}).cta || 'Book now'}
              onChange={(v) => setTweak('annoCta', v)} />
            <TweakRadio label="Tone" value={t.annoStyle} options={MC_ANNO_STYLES} onChange={(v) => setTweak('annoStyle', v)} />
            <TweakText label="Ends (date)" value={t.annoDeadline} placeholder="2026-10-31"
              onChange={(v) => setTweak('annoDeadline', v)} />
            <div style={{ fontSize: 10.5, lineHeight: 1.5, color: 'rgba(41,38,27,0.5)', margin: '-2px 0 4px' }}>
              Blank message / CTA fall back to the industry default. Add an end date (YYYY-MM-DD) to show a live countdown. Visitors can dismiss it; a changed message brings it back.
            </div>
          </>
        )}

        <TweakSection label="Preview" />
        <LocationTweak key={'loctweak-' + t.vertical} />
        <TweakToggle label="Animations" value={t.motion} onChange={(v) => setTweak('motion', v)} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<MicroApp />);

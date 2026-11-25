document.addEventListener('alpine:init', () => {
  Alpine.data('wurizipPopup', () => ({
    ready: false,
    glassStyle: {},
    isOpen: false,
    step: 1,
    selectedIndexId: null,
    interest: null,
    content: null,
    loadError: '',
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
    motionReduced: false,
    get characterSource() {
      const animation = this.step === 1 ? 'waving' : 'blinking';
      return './assets/wurizip-' + animation + (this.motionReduced ? '-still.png' : '.gif');
    },
    get selectedIndex() { return this.content?.indices.find(index => index.id === this.selectedIndexId); },
    get options() {
      return this.content?.options ?? [];
    },
    get selected() {
      return this.options.find(option => option.id === this.interest);
    },
    // A short curved tail points toward the avatar without covering its face.
    get bubblePath() {
      return 'M174 302 C88 273 33 225 33 171 C33 82 183 10 368 10 C553 10 703 82 703 171 C703 260 553 332 368 332 C313 332 261 326 215 315 Q180 348 142 365 Q159 333 174 302 Z';
    },
    init() {
      this.motionReduced = this.reducedMotion.matches;
      this.onMotionChange = () => { this.motionReduced = this.reducedMotion.matches; };
      this.reducedMotion.addEventListener('change', this.onMotionChange);
      this.loadContent();
    },
    // A Laravel endpoint can replace this URL using the same JSON structure.
    async loadContent() {
      this.loadError = '';
      try {
        const response = await fetch('./dummy.json', { cache: 'no-cache' });
        if (!response.ok) throw new Error('dummy.json: HTTP ' + response.status);
        this.content = await response.json();
        this.interest = this.options[0]?.id ?? null;
        document.title = this.content.pageTitle;
        this.ready = true;
        const projectId = new URLSearchParams(location.search).get('projectId') || this.content.projectId;
        this.seenKey = 'wurizip-seen:' + location.pathname + ':' + projectId;
        try {
          this.isOpen = sessionStorage.getItem(this.seenKey) !== '1';
          if (this.isOpen) sessionStorage.setItem(this.seenKey, '1');
        } catch { this.isOpen = true; }
        this.$nextTick(() => {
          if (!this.isOpen || !this.$refs.popupAnchor) return;
          this.onResize = () => this.syncGlass();
          this.glassObserver = new ResizeObserver(this.onResize);
          this.glassObserver.observe(this.$refs.popupAnchor);
          window.addEventListener('resize', this.onResize);
          this.syncGlass();
        });
      } catch (error) {
        this.loadError = error.message;
        console.error(error);
      }
    },
    destroy() {
      this.reducedMotion.removeEventListener('change', this.onMotionChange);
      this.glassObserver?.disconnect();
      window.removeEventListener('resize', this.onResize);
    },
    syncGlass() {
      const anchor = this.$refs.popupAnchor;
      if (!anchor || !this.isOpen) return;
      const rect = anchor.getBoundingClientRect();
      const flowing = window.matchMedia('(max-width:600px), (max-height:500px)').matches;
      this.glassStyle = { left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: (flowing ? rect.height : rect.width * 536 / 712) + 'px' };
    },
    focusStep() {
      this.$nextTick(() => {
        this.$refs.popupViewport?.scrollTo({ top: 0, behavior: 'instant' });
        this.$refs.stepTitle?.focus({ preventScroll: true });
      });
    },
    advance() { this.step = 2; this.focusStep(); },
    chooseIndex(id) {
      this.selectedIndexId = id;
      this.step = Number(this.selectedIndex.value) <= 1 ? 3 : 4;
      this.focusStep();
    },
    explore() { this.step = 5; this.interest = null; this.focusStep(); },
    answerNo() {
      if (Number(this.step) === 4) {
        this.explore();
        return;
      }
      this.closePopup();
    },
    chooseTopic(id) { this.interest = id; this.focusStep(); },
    backFromExplore() { this.step = 4; this.focusStep(); },
    closePopup() {
      this.isOpen = false;
      this.glassObserver?.disconnect();
      window.removeEventListener('resize', this.onResize);
    },
  }));
});

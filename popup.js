document.addEventListener('alpine:init', () => {
  Alpine.data('wurizipPopup', () => ({
    ready: false,
    isOpen: true,
    step: 1,
    declined: false,
    interest: null,
    content: null,
    loadError: '',
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
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
      this.$watch('isOpen', () => this.syncVideos());
      this.$watch('step', () => this.syncVideos());
      this.$watch('declined', () => this.syncVideos());
      this.onMotionChange = () => this.syncVideos();
      this.reducedMotion.addEventListener('change', this.onMotionChange);
      this.loadContent();
    },
    // A Laravel endpoint can replace this URL using the same JSON structure.
    async loadContent() {
      this.loadError = '';
      try {
        const response = await fetch('./dummy.json');
        if (!response.ok) throw new Error('dummy.json: HTTP ' + response.status);
        this.content = await response.json();
        this.interest = this.options[0]?.id ?? null;
        document.title = this.content.pageTitle;
        this.ready = true;
        this.syncVideos();
      } catch (error) {
        this.loadError = error.message;
        console.error(error);
      }
    },
    destroy() {
      this.reducedMotion.removeEventListener('change', this.onMotionChange);
    },
    // Respect reduced-motion preferences and pause hidden animations.
    syncVideos() {
      this.$nextTick(() => {
        const active = this.step === 1 && !this.declined ? 'wave' : 'blink';
        ['wave', 'blink'].forEach(name => {
          const video = this.$refs[name];
          if (!video) return;
          video.muted = true;
          if (this.isOpen && name === active && !this.reducedMotion.matches) {
            video.play().catch(() => { /* A blocked autoplay leaves the first frame visible. */ });
          } else video.pause();
        });
      });
    },
    focusStep() {
      this.$nextTick(() => {
        this.$refs.popupViewport?.scrollTo({ top: 0, behavior: 'instant' });
        this.$refs.stepTitle?.focus({ preventScroll: true });
      });
    },
    advance() { this.step = Math.min(4, this.step + 1); this.focusStep(); },
    choose(id) { this.interest = id; this.step = 5; this.focusStep(); },
    decline() { this.declined = true; this.focusStep(); },
    back() {
      if (this.declined) this.declined = false;
      else this.step = Math.max(1, this.step - 1);
      this.focusStep();
    },
    openPopup() { this.isOpen = true; this.focusStep(); },
    closePopup() {
      this.isOpen = false;
      this.$nextTick(() => this.$refs.launcher?.focus({ preventScroll: true }));
    },
  }));
});

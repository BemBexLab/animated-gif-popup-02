document.addEventListener('alpine:init', () => {
  Alpine.data('wurizipPopup', () => ({
    ready: false,
    isOpen: true,
    step: 1,
    declined: false,
    interest: 'value',
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
    options: [
      { id: 'value', symbol: 'A', label: 'What gives a project value?', title: 'Look beyond the first impression.', description: 'A great project tells a clear story. Here are three things worth checking:', tips: ['Look for original work and a clear creative direction.', 'Review the scope, deliverables, and usage rights.', 'Compare the asking price with similar projects.'] },
      { id: 'creator', symbol: 'B', label: 'Tell me about the creator', title: 'Get to know the person behind it.', description: 'The creator is part of the story. A little research can help you feel more confident.', tips: ['Explore their portfolio and previous projects.', 'Read available reviews and community feedback.', 'Ask about their process, availability, and experience.'] },
      { id: 'details', symbol: 'C', label: 'What should I check first?', title: 'The details make the difference.', description: 'Before taking the next step, give these project essentials a quick look.', tips: ['Read the full project description and included files.', 'Check timelines, revisions, and licensing terms.', 'Contact the creator about anything that is unclear.'] },
    ],
    get selected() {
      return this.options.find(option => option.id === this.interest);
    },
    // A short curved tail points toward the avatar without covering its face.
    get bubblePath() {
      return 'M174 302 C88 273 33 225 33 171 C33 82 183 10 368 10 C553 10 703 82 703 171 C703 260 553 332 368 332 C313 332 261 326 215 315 Q180 348 142 365 Q159 333 174 302 Z';
    },
    get message() {
      if (this.declined) return { eyebrow: 'No rush at all', title: 'I’ll be right here.', description: 'Enjoy exploring! Tap “Ask Wurizip” whenever you would like a little guidance.' };
      if (this.step === 1) return { eyebrow: 'A friendly little hello', title: 'Hi, I’m Wurizip!', description: 'Your Opustown companion. Curious about what makes a project valuable? Let’s take a closer look together.' };
      if (this.step === 2) return { eyebrow: 'Let’s make it yours', title: 'What are you curious about?', description: 'Pick a topic and I’ll share a few helpful things to look for.' };
      return { eyebrow: 'Your project checklist', title: this.selected.title, description: this.selected.description };
    },
    init() {
      this.ready = true;
      this.$watch('isOpen', () => this.syncVideos());
      this.$watch('step', () => this.syncVideos());
      this.$watch('declined', () => this.syncVideos());
      this.onMotionChange = () => this.syncVideos();
      this.reducedMotion.addEventListener('change', this.onMotionChange);
      this.syncVideos();
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

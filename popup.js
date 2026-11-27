document.addEventListener('alpine:init', () => {
  Alpine.data('wurizipPopup', () => ({
    stageOffsetX: 0,
    resizeFrame: 0,
    bubbleGeometry: { scale: 0.9, tx: 36.8, ty: 17.1 },
    isOpen: false,
    step: 1,
    selectedIndexId: null,
    interest: null,
    content: null,
    loadError: '',
    get characterPath() {
      return './assets/wurizip-' + (this.step === 1 ? 'waving' : 'blinking');
    },
    get selectedIndex() {
      return this.content.indices.find(index => index.id === this.selectedIndexId);
    },
    get selected() {
      return this.content.options.find(option => option.id === this.interest);
    },
    get isReadingAnswer() {
      return this.step === 3 || this.step === 4 || (this.step === 5 && Boolean(this.selected));
    },
    get selectedDescription() {
      const option = this.selected;
      if (option?.id !== 'creator') return option?.description ?? '';
      return option.description.replace(/\{(\w+)\}/g, (_, field) => this.content.creator[field]);
    },
    bubblePath: 'M174 302 C88 273 33 225 33 171 C33 82 183 10 368 10 C553 10 703 82 703 171 C703 260 553 332 368 332 C313 332 261 326 215 315 Q180 348 142 365 Q159 333 174 302 Z',
    get bubbleTransform() {
      const { scale, tx, ty } = this.bubbleGeometry;
      return `matrix(${scale} 0 0 ${scale} ${tx} ${ty})`;
    },
    get bubbleTextCenterY() {
      const { scale, ty } = this.bubbleGeometry;
      // The picker is centered between the top of the outline and the tip of the tail.
      return ty + scale * (this.step === 2 ? (10 + 365) / 2 : 171);
    },
    get bubbleCenterX() {
      const { scale, tx } = this.bubbleGeometry;
      return tx + scale * 368;
    },
    get layoutStyle() {
      const { scale, tx, ty } = this.bubbleGeometry;
      // The SVG and the desktop controls share a 712-unit-wide stage.
      const length = value => (value / 712 * 100) + 'cqw';
      return {
        '--stage-offset': length(this.stageOffsetX),
        '--bubble-x': length(this.bubbleCenterX),
        '--text-y': length(this.bubbleTextCenterY),
        '--badge-x': length(tx + scale * 33 + 44),
        '--control-y': (Math.max(2, ty + scale * 10 - 24) / 536 * 100) + '%',
        '--close-x': length(Math.min(tx + scale * 703 - 16 + this.stageOffsetX, 660)),
        '--topics-y': length(ty + scale * 365 + 12),
      };
    },

    async init() {
      try {
        const response = await fetch('./dummy.json', { cache: 'no-cache' });
        if (!response.ok) throw new Error('dummy.json: HTTP ' + response.status);
        this.content = await response.json();
        document.title = this.content.pageTitle;
        const projectId = new URLSearchParams(location.search).get('projectId') || this.content.projectId;
        const seenKey = 'wurizip-seen:' + location.pathname + ':' + projectId;
        try {
          this.isOpen = sessionStorage.getItem(seenKey) !== '1';
          if (this.isOpen) sessionStorage.setItem(seenKey, '1');
        } catch { this.isOpen = true; }
        if (this.isOpen) this.$nextTick(() => this.observeLayout());
      } catch (error) {
        this.loadError = error.message;
        console.error(error);
      }
    },
    observeLayout() {
      if (!this.isOpen) return;
      this.onResize = () => {
        cancelAnimationFrame(this.resizeFrame);
        this.resizeFrame = requestAnimationFrame(() => {
          this.resizeFrame = 0;
          this.$nextTick(() => this.syncLayout());
        });
      };
      this.layoutObserver = new ResizeObserver(this.onResize);
      this.layoutObserver.observe(this.$refs.popupAnchor);
      this.layoutObserver.observe(this.$refs.stepTitle);
      window.addEventListener('resize', this.onResize);
      this.syncLayout();
    },
    stopObservingLayout() {
      this.layoutObserver?.disconnect();
      window.removeEventListener('resize', this.onResize);
      cancelAnimationFrame(this.resizeFrame);
    },
    destroy() {
      this.stopObservingLayout();
    },
    syncLayout() {
      const anchor = this.$refs.popupAnchor;
      if (!this.isOpen || !anchor) return;
      const flowing = window.matchMedia('(max-width: 600px), (max-height: 500px)').matches;
      this.$root.toggleAttribute('data-compact', flowing);
      const rect = anchor.getBoundingClientRect();
      if (!rect.width) return;
      if (flowing) this.stageOffsetX = 0;
      else this.fitBubble(anchor, rect);
    },
    bubbleContentRects() {
      // Size the oval around the visible reading area, including its scrollbar.
      if (this.isReadingAnswer) return this.$refs.answerViewport.getClientRects();
      const title = this.$refs.stepTitle;
      const fragments = [];
      const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.textContent.trim()) continue;
        range.selectNodeContents(node);
        fragments.push(...Array.from(range.getClientRects()).filter(rect => rect.width && rect.height));
      }
      // The outermost button in each row determines how wide the oval must be.
      for (const button of title.querySelectorAll('.index-choices button')) {
        fragments.push(...button.getClientRects());
      }
      return fragments;
    },
    fitBubble(anchor, anchorRect) {
      const fragments = this.bubbleContentRects();
      if (!fragments.length) return;

      const scale = anchorRect.width / 712;
      const centerX = anchorRect.left + (this.stageOffsetX + this.bubbleCenterX) * scale;
      const centerY = anchorRect.top + this.bubbleTextCenterY * scale;
      // Fit the farthest corner of each fragment inside the oval's 335 × 161 radii.
      let requiredScale = 0.48;
      const inset = this.isReadingAnswer ? 18 : 10;
      for (const rect of fragments) {
        const dx = Math.max(centerX - rect.left, rect.right - centerX) / scale + inset;
        const dy = Math.max(centerY - rect.top, rect.bottom - centerY) / scale + inset;
        requiredScale = Math.max(requiredScale, Math.hypot(dx / 335, dy / 161));
      }
      const step5Answer = this.step === 5 && Boolean(this.selected);
      const bubbleScale = Math.min(requiredScale, step5Answer ? 0.96 : 0.93);
      const tx = 150 - bubbleScale * 142;
      const tipY = step5Answer ? 350 : 340;
      const ty = tipY - bubbleScale * 365;
      this.bubbleGeometry = {
        scale: Math.round(bubbleScale * 1000) / 1000,
        tx: Math.round(tx * 10) / 10,
        ty: Math.round(ty * 10) / 10,
      };
      let contentRight = tx + bubbleScale * 703 + 28;
      for (const button of anchor.querySelectorAll('button:not(.popup-close)')) {
        const rect = button.getBoundingClientRect();
        if (rect.width && rect.height) contentRight = Math.max(contentRight, (rect.right - anchorRect.left) / scale - this.stageOffsetX);
      }
      const rightOffset = Math.max(0, 712 - contentRight - 24);
      this.stageOffsetX = Math.round(rightOffset * 10) / 10;
    },

    showStep(step, topicId = null) {
      this.step = step;
      this.interest = topicId;
      this.$nextTick(() => {
        this.$refs.popupViewport?.scrollTo({ top: 0, behavior: 'instant' });
        const answer = this.$refs.answerViewport;
        answer?.scrollTo({ top: 0, behavior: 'instant' });
        const focusTarget = answer && this.isReadingAnswer && answer.scrollHeight > answer.clientHeight
          ? answer : this.$refs.stepTitle;
        focusTarget?.focus({ preventScroll: true });
        this.syncLayout();
      });
    },
    chooseIndex(id) {
      this.selectedIndexId = id;
      this.showStep(Number(this.selectedIndex.value) <= 1 ? 3 : 4);
    },
    answerNo() {
      if (this.step === 1) this.closePopup();
      else this.showStep(5);
    },
    goBack() {
      if (this.step === 5) {
        if (this.selected) this.showStep(5);
        else this.chooseIndex(this.selectedIndexId);
      } else {
        this.showStep(this.step === 2 ? 1 : 2);
      }
    },
    closePopup() {
      this.isOpen = false;
      this.stopObservingLayout();
    },
  }));
});

document.addEventListener('alpine:init', () => {
  Alpine.data('wurizipPopup', () => ({
    ready: false,
    glassStyle: {},
    stageOffsetX: 0,
    flowingLayout: false,
    resizeFrame: 0,
    bubbleGeometry: { scale: 0.9, tx: 36.8, ty: 17.1 },
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
    // Keep the original oval and tail path; scale it uniformly to fit the text.
    get bubblePath() {
      return 'M174 302 C88 273 33 225 33 171 C33 82 183 10 368 10 C553 10 703 82 703 171 C703 260 553 332 368 332 C313 332 261 326 215 315 Q180 348 142 365 Q159 333 174 302 Z';
    },
    get bubbleTransform() {
      const { scale, tx, ty } = this.bubbleGeometry;
      return `matrix(${scale} 0 0 ${scale} ${tx} ${ty})`;
    },
    get bubbleClipTransform() {
      const { scale, tx, ty } = this.bubbleGeometry;
      return `matrix(${scale / 712} 0 0 ${scale / 536} ${tx / 712} ${ty / 536})`;
    },
    get bubbleTextStyle() {
      if (this.flowingLayout) return { left: 'auto', top: 'auto' };
      const { scale, tx, ty } = this.bubbleGeometry;
      const left = tx + scale * 368;
      const top = ty + scale * 171;
      return { left: (left / 712 * 100) + '%', top: (top / 536 * 100) + '%' };
    },
    get stageStyle() {
      const offset = this.flowingLayout ? 0 : this.stageOffsetX;
      return { transform: offset ? `translateX(${offset / 712 * 100}%)` : 'none' };
    },
    get exploreTopicListStyle() {
      if (this.flowingLayout) return { position: 'relative', left: 'auto', top: 'auto', width: 'auto' };
      const { scale, tx, ty } = this.bubbleGeometry;
      const centerX = tx + scale * 368 + this.stageOffsetX;
      const width = 300;
      const left = centerX - 80;
      const top = ty + scale * 365 + 12;
      return {
        position: 'absolute',
        left: (left / 712 * 100) + '%',
        right: 'auto',
        top: (top / 712 * 100) + 'cqw',
        width: (width / 712 * 100) + '%',
      };
    },
    get choiceActionsStyle() {
      if (this.flowingLayout) {
        return { left: 'auto', right: 'auto', width: 'auto', justifyContent: 'flex-start', gap: '16px' };
      }
      const { scale, tx } = this.bubbleGeometry;
      const centerX = tx + scale * 368;
      const width = 240;
      return {
        left: ((centerX - width / 2) / 712 * 100) + '%',
        right: 'auto',
        width: (width / 712 * 100) + '%',
        justifyContent: 'center',
        gap: '3cqw',
      };
    },
    get badgeStyle() {
      if (this.flowingLayout) return { left: '24px', top: '8px' };
      const { scale, tx, ty } = this.bubbleGeometry;
      const left = tx + scale * 33 + 44;
      const top = Math.max(2, ty + scale * 10 - 24);
      return { left: (left / 712 * 100) + '%', top: (top / 536 * 100) + '%' };
    },
    get closeStyle() {
      if (this.flowingLayout) return { left: 'auto', right: '2%', top: '0px' };
      const { scale, tx, ty } = this.bubbleGeometry;
      const left = Math.min(tx + scale * 703 - 16 + this.stageOffsetX, 660);
      const top = Math.max(2, ty + scale * 10 - 24);
      return { left: (left / 712 * 100) + '%', right: 'auto', top: (top / 536 * 100) + '%' };
    },
    get headerBackStyle() {
      if (this.flowingLayout) return { left: 'auto', right: 'calc(2% + 44px)', top: '0px' };
      const { scale, tx, ty } = this.bubbleGeometry;
      const closeLeft = Math.min(tx + scale * 703 - 16 + this.stageOffsetX, 660);
      const top = Math.max(2, ty + scale * 10 - 24);
      return { left: ((closeLeft - 44) / 712 * 100) + '%', right: 'auto', top: (top / 536 * 100) + '%' };
    },
    init() {
      this.motionReduced = this.reducedMotion.matches;
      this.flowingLayout = this.isFlowingLayout();
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
          this.onResize = () => this.scheduleLayoutSync();
          this.glassObserver = new ResizeObserver(this.onResize);
          this.glassObserver.observe(this.$refs.popupAnchor);
          this.bubbleObserver = new ResizeObserver(() => this.scheduleLayoutSync());
          if (this.$refs.stepTitle) this.bubbleObserver.observe(this.$refs.stepTitle);
          window.addEventListener('resize', this.onResize);
          this.syncGlass();
          this.syncBubble();
        });
      } catch (error) {
        this.loadError = error.message;
        console.error(error);
      }
    },
    destroy() {
      this.reducedMotion.removeEventListener('change', this.onMotionChange);
      this.glassObserver?.disconnect();
      this.bubbleObserver?.disconnect();
      window.removeEventListener('resize', this.onResize);
      if (this.resizeFrame) cancelAnimationFrame(this.resizeFrame);
    },
    isFlowingLayout() {
      return window.matchMedia('(max-width:600px), (max-height:500px)').matches;
    },
    scheduleLayoutSync() {
      if (this.resizeFrame) cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = requestAnimationFrame(() => {
        this.resizeFrame = 0;
        this.flowingLayout = this.isFlowingLayout();
        this.$nextTick(() => {
          this.syncBubble();
          this.syncGlass();
        });
      });
    },
    syncGlass() {
      const anchor = this.$refs.popupAnchor;
      if (!anchor || !this.isOpen) return;
      const rect = anchor.getBoundingClientRect();
      const flowing = this.flowingLayout;
      const offset = flowing ? 0 : this.stageOffsetX * rect.width / 712;
      this.glassStyle = { left: rect.left + offset + 'px', top: rect.top + 'px', width: rect.width + 'px', height: (flowing ? rect.height : rect.width * 536 / 712) + 'px' };
    },
    syncBubble() {
      const title = this.$refs.stepTitle;
      const anchor = this.$refs.popupAnchor;
      if (!title || !anchor || !this.isOpen) return;
      if (this.flowingLayout) {
        this.stageOffsetX = 0;
        this.bubbleGeometry = { scale: 0.9, tx: 36.8, ty: 17.1 };
        this.syncGlass();
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const scale = anchorRect.width / 712;
      if (!scale) return;

      const fragments = [];
      const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        fragments.push(...Array.from(range.getClientRects()).filter(rect => rect.width && rect.height));
      }
      const choices = title.querySelector('.index-choices');
      if (choices?.getClientRects().length) {
        const rows = [];
        for (const button of choices.querySelectorAll('button')) {
          const rect = button.getBoundingClientRect();
          let row = rows.find(candidate => Math.abs(candidate.top - rect.top) < 3);
          if (!row) {
            row = { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
            rows.push(row);
          } else {
            row.left = Math.min(row.left, rect.left);
            row.right = Math.max(row.right, rect.right);
            row.top = Math.min(row.top, rect.top);
            row.bottom = Math.max(row.bottom, rect.bottom);
          }
        }
        fragments.push(...rows.map(row => ({ left: row.left, right: row.right, top: row.top, bottom: row.bottom, width: row.right - row.left, height: row.bottom - row.top })));
      }
      if (!fragments.length) return;

      const currentGeometry = this.bubbleGeometry;
      const centerX = currentGeometry.tx + currentGeometry.scale * 368;
      const centerY = currentGeometry.ty + currentGeometry.scale * 171;
      const step5Answer = Number(this.step) === 5 && Boolean(this.selected);
      const bubbleScale = Math.min(step5Answer ? 0.96 : 0.93, Math.max(0.48, ...fragments.map(rect => {
        const dx = Math.abs((rect.left + rect.width / 2 - anchorRect.left) / scale - this.stageOffsetX - centerX);
        const dy = Math.abs((rect.top + rect.height / 2 - anchorRect.top) / scale - centerY);
        const halfWidth = rect.width / (2 * scale) + 10;
        const halfHeight = rect.height / (2 * scale) + 10;
        return Math.sqrt(((dx + halfWidth) / 335) ** 2 + ((dy + halfHeight) / 161) ** 2);
      })));
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
      this.syncGlass();
    },
    focusStep() {
      this.$nextTick(() => {
        this.$refs.popupViewport?.scrollTo({ top: 0, behavior: 'instant' });
        this.$refs.stepTitle?.focus({ preventScroll: true });
        this.syncBubble();
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
    goBack() {
      if (Number(this.step) === 5) {
        if (this.selected) {
          this.interest = null;
          this.focusStep();
          return;
        }
        this.backFromExplore();
        return;
      }
      this.step = Number(this.step) === 2 ? 1 : 2;
      this.focusStep();
    },
    chooseTopic(id) { this.interest = id; this.focusStep(); },
    backFromExplore() { this.step = 4; this.focusStep(); },
    closePopup() {
      this.isOpen = false;
      this.glassObserver?.disconnect();
      window.removeEventListener('resize', this.onResize);
      this.bubbleObserver?.disconnect();
    },
  }));
});

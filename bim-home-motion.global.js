/** Enterprise BIM homepage motion kit. Native ES module; no third-party runtime. */
const D={duration:8000,color:'#00A86B',pauseWhenHidden:true,loop:true};
const q=(s,r=document)=>r.querySelector(s);const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const layer=(el)=>{let l=q(':scope > .motion-layer',el);if(!l){l=document.createElement('div');l.className='motion-layer';el.append(l)}return l};
const visible=(el)=>{const r=el.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight};
/** Configurable Banner scan layer with wireframe, outline and coordinate nodes. */
class DigitalScanOverlay {
  static init(el, o = {}) { return new DigitalScanOverlay(el, o) }
  constructor(el, o = {}) {
    this.el = el;
    this.o = { ...D, direction:'bottom-to-top', scanLineWidth:1, scanGlowHeight:120, opacity:.1, wireframeOpacity:.08, ...o };
    this.l = layer(el);
    this.l.classList.add('digital-scan-layer');
    this.l.setAttribute('aria-hidden', 'true');
    this.l.insertAdjacentHTML('beforeend', '<div class="hero-scan-mask"><div class="hero-wireframe-layer"></div><div class="motion-building-outline"></div></div><div class="hero-scan-glow"></div><div class="hero-scan-line"></div>');
    const tagNames = ['PROCESS','UTILITY','POWER','HVAC','STEAM','COMPRESSED AIR','CHILLED WATER','ENERGY CENTER','DIGITAL FACTORY','TOBACCO PROCESS'];
    const tagPositions = [[47,29],[58,64],[67,36],[80,58],[88,24],[53,48],[73,72],[91,46],[62,21],[84,76]];
    const tagLayer = document.createElement('div');
    tagLayer.className = 'hero-industry-tags';
    this.tags = tagNames.map((name, i) => {
      const tag = document.createElement('span');
      tag.className = 'hero-industry-tag';
      tag.textContent = name;
      tag.style.cssText = `left:${tagPositions[i][0]}%;top:${tagPositions[i][1]}%`;
      tagLayer.append(tag);
      return tag;
    });
    this.l.append(tagLayer);
    this.nodes = [[48,68],[62,54],[76,40],[88,27]].map(([x, y], i) => {
      const n = document.createElement('i');
      n.className = 'motion-node';
      n.dataset.state = 'normal';
      n.dataset.scanNode = `${i + 1}`;
      n.style.cssText = `left:${x}%;top:${y}%;animation-delay:${i * .38}s`;
      this.l.append(n);
      return n;
    });
    this.progress = 0;
    this.cycleIndex = 0;
    this.lastTime = 0;
    this.frame = 0;
    this.running = false;
    this.updateOptions();
    this._render();
    this.ro = new ResizeObserver(() => this._render());
    this.ro.observe(el);
    this.io = new IntersectionObserver(([entry]) => (entry.isIntersecting || !this.o.pauseWhenHidden) && !this.disabled && !this.rhythmHeld && !document.documentElement.classList.contains('is-motion-paused') ? this.resume() : this.pause(), { threshold:.05 });
    this.io.observe(el);
  }
  _render() {
    const height = this.el.clientHeight || 455;
    const normalizedY = this.o.direction === 'top-to-bottom' ? this.progress : 1 - this.progress;
    const y = Math.max(0, Math.min(height, normalizedY * height));
    this.el.style.setProperty('--scan-progress', this.progress.toFixed(4));
    this.el.style.setProperty('--scan-y', `${y.toFixed(2)}px`);
    const yPercent = normalizedY * 100;
    this.nodes.forEach(node => {
      const target = Number.parseFloat(node.style.top);
      const active = Math.abs(target - yPercent) <= 9;
      if (active && node.dataset.state !== 'active') {
        node.dataset.state = 'active';
        node.classList.remove('pulse-once');
        requestAnimationFrame(() => node.classList.add('pulse-once'));
      } else if (!active) {
        node.dataset.state = 'normal';
        node.classList.remove('pulse-once');
      }
    });
    const tagWindow = [[.10,.225],[.42,.545],[.72,.845]].findIndex(([from, to]) => this.progress >= from && this.progress < to);
    const activeTagIndexes = tagWindow < 0 ? [] : [
      (this.cycleIndex * 3 + tagWindow * 2) % this.tags.length,
      (this.cycleIndex * 3 + tagWindow * 2 + 1) % this.tags.length
    ];
    this.tags.forEach((tag, index) => tag.classList.toggle('is-active', activeTagIndexes.includes(index)));
  }
  _tick = time => {
    if (!this.running) return;
    if (!this.lastTime) this.lastTime = time;
    const delta = (time - this.lastTime) / this.o.duration;
    this.lastTime = time;
    this.progress += delta;
    if (this.progress >= 1) {
      if (this.o.loop === false) {
        this.progress = 1;
        this._render();
        this.pause();
        return;
      }
      this.progress %= 1;
      this.cycleIndex += 1;
    }
    this._render();
    this.frame = requestAnimationFrame(this._tick);
  }
  start() {
    if (this.running || this.disabled) return this;
    this.running = true;
    this.lastTime = 0;
    this.el.classList.remove('is-motion-paused');
    this.frame = requestAnimationFrame(this._tick);
    return this;
  }
  pause() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.lastTime = 0;
    this.el.classList.add('is-motion-paused');
    return this;
  }
  resume() { return this.start() }
  stop() { return this.pause() }
  destroy() { this.pause(); this.io?.disconnect(); this.ro?.disconnect(); this.l.remove() }
  updateOptions(o = {}) {
    Object.assign(this.o, o);
    this.el.style.setProperty('--scan-duration', `${this.o.duration}ms`);
    this.el.style.setProperty('--scan-color', this.o.color);
    this.el.style.setProperty('--scan-line-width', `${this.o.scanLineWidth}px`);
    this.el.style.setProperty('--scan-opacity', this.o.opacity);
    this.el.style.setProperty('--scan-glow-height', `${this.o.scanGlowHeight}px`);
    this.el.style.setProperty('--scan-band-offset', `${this.o.scanGlowHeight / 2}px`);
    this.el.style.setProperty('--wireframe-opacity', this.o.wireframeOpacity);
    this.el.classList.toggle('scan-top-to-bottom', this.o.direction === 'top-to-bottom');
    this._render?.();
    return this;
  }
}
class NodePulse {
  static init(el, o = {}) { return new NodePulse(el, o) }
  constructor(el, o = {}) {
    this.el = el;
    this.o = { duration:2400, stagger:350, color:'#00A86B', coreSize:4, ringSize:16, ...o };
    this.nodes = new Map();
    this.pulseTimers = new Map();
    this.running = false;
    this.updateOptions();
    this.io = new IntersectionObserver(([entry]) => entry.isIntersecting && !this.disabled && !this.rhythmHeld && !document.documentElement.classList.contains('is-motion-paused') ? this.resume() : this.pause(), { threshold:.05 });
    this.io.observe(el);
  }
  register(id, o = {}) {
    const n = document.createElement('i');
    n.className = 'motion-node';
    n.dataset.state = o.state || 'normal';
    const delay = o.delay ?? this.nodes.size * this.o.stagger;
    n.style.cssText = `left:${o.x ?? 50}%;top:${o.y ?? 50}%;animation-delay:${delay}ms`;
    layer(o.container || this.el).append(n);
    this.nodes.set(id, n);
    return n;
  }
  unregister(id) { clearTimeout(this.pulseTimers.get(id)); this.pulseTimers.delete(id); this.nodes.get(id)?.remove(); this.nodes.delete(id) }
  setState(id, state) {
    const n = this.nodes.get(id);
    if (!n) return this;
    clearTimeout(this.pulseTimers.get(id));
    n.classList.remove('pulse-once');
    n.dataset.state = state;
    return this;
  }
  pulse(id) {
    const n = this.nodes.get(id);
    if (!n) return this;
    const previous = n.dataset.state || 'normal';
    clearTimeout(this.pulseTimers.get(id));
    n.dataset.state = 'active';
    n.classList.remove('pulse-once');
    requestAnimationFrame(() => n.classList.add('pulse-once'));
    this.pulseTimers.set(id, setTimeout(() => {
      n.classList.remove('pulse-once');
      n.dataset.state = previous === 'active' ? 'normal' : previous;
      this.pulseTimers.delete(id);
    }, 800));
    return this;
  }
  pause() { this.running = false; this.el.classList.add('is-node-pulse-paused'); return this }
  resume() { this.running = true; this.el.classList.remove('is-node-pulse-paused'); return this }
  updateOptions(o = {}) {
    Object.assign(this.o, o);
    this.el.style.setProperty('--node-duration', `${this.o.duration}ms`);
    this.el.style.setProperty('--node-color', this.o.color);
    this.el.style.setProperty('--node-core-size', `${this.o.coreSize}px`);
    this.el.style.setProperty('--node-ring-size', `${this.o.ringSize}px`);
    return this;
  }
  destroy() { this.pause(); this.io?.disconnect(); this.pulseTimers.forEach(clearTimeout); this.pulseTimers.clear(); this.nodes.forEach(n => n.remove()); this.nodes.clear(); this.el.classList.remove('is-node-pulse-paused') }
}
/** Inline-SVG industrial utility flow with SMIL particles and arrival pulses. */
class PipelineFlow {
  static init(el, o = {}) { return new PipelineFlow(el, o) }
  constructor(el, o = {}) {
    this.el = el;
    this.o = { speed:1, particleCount:2, particleRadius:5, color:'#00A86B', opacity:.9, pathOpacity:.28, glow:5, ...o };
    this.paths = new Map();
    this.running = false;
    this.uid = `pipe-${Math.random().toString(36).slice(2, 8)}`;
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('class', 'motion-overlay pipeline-flow-overlay');
    this.svg.setAttribute('viewBox', '0 0 1000 700');
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    this.svg.setAttribute('aria-hidden', 'true');
    this.svg.innerHTML = `<defs><filter id="${this.uid}-glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g class="pipeline-paths"></g><g class="pipeline-particles"></g><g class="pipeline-nodes"></g>`;
    el.append(this.svg);
    this.pathGroup = this.svg.querySelector('.pipeline-paths');
    this.particleGroup = this.svg.querySelector('.pipeline-particles');
    this.nodeGroup = this.svg.querySelector('.pipeline-nodes');
    this._buildDefaultPaths();
    this.updateOptions();
    this.svg.pauseAnimations?.();
    this.ro = new ResizeObserver(() => this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet'));
    this.ro.observe(el);
    this.io = new IntersectionObserver(([entry]) => entry.isIntersecting && !this.disabled && !this.rhythmHeld && !document.documentElement.classList.contains('is-motion-paused') ? this.resume() : this.pause(), { threshold: .08 });
    this.io.observe(el);
  }
  _buildDefaultPaths() {
    [
      ['cooling-pump', 'M790 160 C735 190 690 260 610 330 S470 430 370 470', 5.4, 0, 'chilled-water'],
      ['pump-main', 'M370 470 C455 520 550 505 615 425 S700 355 760 390', 6.1, 1.1, 'compressed-air'],
      ['main-tank', 'M610 330 C700 330 760 405 840 455 S900 465 932 440', 6.7, 2.0, 'steam'],
      ['control-main', 'M790 585 C735 540 660 535 590 510 S495 455 430 420', 4.9, .55, 'circulating-water']
    ].forEach(([id, d, duration, delay, medium], index) => this.addPath(id, { d, duration, delay, medium, direction:index === 1 ? -1 : 1 }));
  }
  addPath(id, opt = {}) {
    const ns = 'http://www.w3.org/2000/svg';
    const pathId = `${this.uid}-${id}`;
    const base = document.createElementNS(ns, 'path');
    base.setAttribute('id', pathId);
    base.setAttribute('class', 'pipeline-base-path');
    base.setAttribute('d', opt.d);
    base.dataset.medium = opt.medium || 'energy';
    this.pathGroup.append(base);
    const highlight = base.cloneNode();
    highlight.removeAttribute('id');
    highlight.setAttribute('class', 'pipeline-flow-streak');
    highlight.dataset.medium = opt.medium || 'energy';
    highlight.style.animationDuration = `${opt.duration || 6}s`;
    highlight.style.animationDelay = `-${opt.delay || 0}s`;
    if (opt.color) highlight.style.stroke = opt.color;
    if (opt.direction < 0) highlight.style.animationDirection = 'reverse';
    this.pathGroup.append(highlight);
    const dots = [];
    const count = Math.max(1, Math.min(3, opt.particleCount || this.o.particleCount));
    for (let i = 0; i < count; i++) {
      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('class', 'pipeline-moving-dot');
      dot.dataset.medium = opt.medium || 'energy';
      dot.setAttribute('r', `${opt.particleRadius || this.o.particleRadius}`);
      dot.setAttribute('filter', `url(#${this.uid}-glow)`);
      if (opt.color) dot.style.fill = opt.color;
      const motion = document.createElementNS(ns, 'animateMotion');
      motion.setAttribute('dur', `${(opt.duration || 6) / this.o.speed}s`);
      const baseBegin = (opt.delay || 0) + i * ((opt.duration || 6) / count);
      motion.setAttribute('begin', `${baseBegin / this.o.speed}s`);
      motion.setAttribute('repeatCount', 'indefinite');
      motion.setAttribute('keyPoints', opt.direction < 0 ? '1;0' : '0;1');
      motion.setAttribute('keyTimes', '0;1');
      motion.setAttribute('calcMode', 'linear');
      const mpath = document.createElementNS(ns, 'mpath');
      mpath.setAttribute('href', `#${pathId}`);
      motion.append(mpath);
      const onArrival = () => this.running && this.highlightNode(id);
      motion.addEventListener('repeatEvent', onArrival);
      dot.append(motion);
      this.particleGroup.append(dot);
      dots.push({ dot, motion, onArrival, baseDuration:opt.duration || 6, baseBegin });
    }
    const end = base.getPointAtLength(opt.direction < 0 ? 0 : base.getTotalLength());
    const node = document.createElementNS(ns, 'g');
    node.setAttribute('class', 'pipeline-end-node');
    node.dataset.state = 'normal';
    node.setAttribute('transform', `translate(${end.x} ${end.y})`);
    node.dataset.medium = opt.medium || 'energy';
    node.innerHTML = '<circle class="pressure-wave" r="9"/><circle class="flow-node-ring" r="12"/><circle class="flow-node-core" r="4"/>';
    node.style.animationDelay = `${opt.delay || 0}s`;
    this.nodeGroup.append(node);
    this.paths.set(id, { base, highlight, dots, node, direction:opt.direction || 1, baseDuration:opt.duration || 6, stateTimer:0 });
    return this;
  }
  removePath(id) { const p = this.paths.get(id); if (p) { clearTimeout(p.stateTimer); p.base.remove(); p.highlight.remove(); p.node.remove(); p.dots.forEach(x => { x.motion.removeEventListener('repeatEvent', x.onArrival); x.dot.remove() }); this.paths.delete(id) } }
  setSpeed(speed) {
    this.o.speed = Math.max(.25, speed);
    this.paths.forEach(p => {
      p.highlight.style.animationDuration = `${p.baseDuration / this.o.speed}s`;
      p.dots.forEach(x => {
        x.motion.setAttribute('dur', `${x.baseDuration / this.o.speed}s`);
        x.motion.setAttribute('begin', `${x.baseBegin / this.o.speed}s`);
      });
    });
    return this;
  }
  updateOptions(o = {}) {
    Object.assign(this.o, o);
    this.svg.style.setProperty('--pipeline-color', this.o.color);
    this.svg.style.setProperty('--pipeline-path-opacity', this.o.pathOpacity);
    this.svg.style.setProperty('--pipeline-particle-opacity', this.o.opacity);
    this.setSpeed(this.o.speed);
    return this;
  }
  setDirection(id, direction) {
    const p = this.paths.get(id);
    if (!p) return;
    p.direction = direction < 0 ? -1 : 1;
    p.highlight.style.animationDirection = p.direction < 0 ? 'reverse' : 'normal';
    p.dots.forEach(x => { x.motion.setAttribute('keyPoints', p.direction < 0 ? '1;0' : '0;1'); x.motion.beginElement?.() });
    const point = p.base.getPointAtLength(p.direction < 0 ? 0 : p.base.getTotalLength());
    p.node.setAttribute('transform', `translate(${point.x} ${point.y})`);
  }
  highlightNode(id) {
    const p = this.paths.get(id);
    if (!p) return;
    clearTimeout(p.stateTimer);
    p.node.dataset.state = 'active';
    p.node.classList.remove('pulse-once');
    requestAnimationFrame(() => p.node.classList.add('pulse-once'));
    p.stateTimer = setTimeout(() => {
      p.node.dataset.state = 'normal';
      p.node.classList.remove('pulse-once');
      p.stateTimer = 0;
    }, 800);
  }
  start() { if (this.running) return this; this.running = true; this.svg.unpauseAnimations?.(); this.svg.classList.remove('is-flow-paused'); return this }
  play() { return this.start() }
  pause() { this.running = false; this.svg.pauseAnimations?.(); this.svg.classList.add('is-flow-paused'); return this }
  resume() { return this.start() }
  destroy() { this.pause(); this.io?.disconnect(); this.ro?.disconnect(); [...this.paths.keys()].forEach(id => this.removePath(id)); this.svg.remove() }
}

/** Controlled building-to-building SVG data transmission network. */
class NetworkDataFlow {
  static init(el, o = {}) { return new NetworkDataFlow(el, o) }
  constructor(el, o = {}) {
    this.el = el;
    this.o = { autoFlow:true, interval:3000, duration:2200, maxConcurrentFlows:2, particleSize:5, color:'#00A86B', edgeOpacity:.24, ...o };
    this.nodes = new Map();
    this.edges = new Map();
    this.active = new Set();
    this.sequence = [['center','power'],['power','factory-left'],['center','warehouse'],['warehouse','factory-right'],['factory-right','center']];
    this.sequenceIndex = 0;
    this.timer = 0;
    this.initialTimer = 0;
    this.running = false;
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('class', 'motion-overlay network-flow-overlay');
    this.svg.setAttribute('viewBox', '0 0 1000 700');
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    this.svg.setAttribute('aria-hidden', 'true');
    this.svg.innerHTML = '<g class="network-edges"></g><g class="network-particles"></g><g class="network-nodes"></g>';
    el.append(this.svg);
    this.edgeGroup = this.svg.querySelector('.network-edges');
    this.particleGroup = this.svg.querySelector('.network-particles');
    this.nodeGroup = this.svg.querySelector('.network-nodes');
    this._buildDefaultNetwork();
    this.updateOptions();
    this.ro = new ResizeObserver(() => this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet'));
    this.ro.observe(el);
    this.io = new IntersectionObserver(([entry]) => entry.isIntersecting && !this.disabled && !this.rhythmHeld && !document.documentElement.classList.contains('is-motion-paused') ? this.resume() : this.pause(), { threshold: .08 });
    this.io.observe(el);
  }
  _buildDefaultNetwork() {
    [
      { id:'center', x:500, y:430 }, { id:'power', x:250, y:290 },
      { id:'factory-left', x:165, y:475 }, { id:'warehouse', x:690, y:260 },
      { id:'factory-right', x:835, y:455 }, { id:'service', x:555, y:575 }
    ].forEach(n => this.registerNode(n));
    [
      { id:'center-power', source:'center', target:'power', d:'M500 430 Q370 360 250 290' },
      { id:'power-left', source:'power', target:'factory-left', d:'M250 290 Q185 365 165 475' },
      { id:'center-warehouse', source:'center', target:'warehouse', d:'M500 430 Q590 320 690 260' },
      { id:'warehouse-right', source:'warehouse', target:'factory-right', d:'M690 260 Q815 325 835 455' },
      { id:'right-center', source:'factory-right', target:'center', d:'M835 455 Q675 520 500 430' }
    ].forEach(e => this.registerEdge(e));
  }
  registerNode(node) {
    const ns = 'http://www.w3.org/2000/svg';
    const group = document.createElementNS(ns, 'g');
    group.setAttribute('class', 'network-node');
    group.setAttribute('transform', `translate(${node.x} ${node.y})`);
    group.dataset.node = node.id;
    group.dataset.state = 'normal';
    group.innerHTML = '<circle class="network-node-ring" r="13"/><circle class="network-node-core" r="4"/>';
    this.nodeGroup.append(group);
    this.nodes.set(node.id, { ...node, group, stateTimer:0 });
  }
  registerEdge(edge) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'network-edge');
    path.setAttribute('d', edge.d);
    path.dataset.edge = edge.id;
    this.edgeGroup.append(path);
    this.edges.set(edge.id, { ...edge, path });
  }
  _findEdge(source, target) { return [...this.edges.values()].find(e => e.source === source && e.target === target) }
  send(source, target, opt = {}) {
    const edge = this._findEdge(source, target);
    const targetNode = this.nodes.get(target);
    if (!edge || !targetNode || this.active.size >= this.o.maxConcurrentFlows) return false;
    const ns = 'http://www.w3.org/2000/svg';
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('class', 'network-moving-dot');
    dot.setAttribute('r', `${opt.particleSize || this.o.particleSize}`);
    this.particleGroup.append(dot);
    edge.path.classList.add('is-active');
    const token = { dot, edge, elapsed: 0, lastTime: 0, frame: 0 };
    this.active.add(token);
    const length = edge.path.getTotalLength();
    const duration = opt.duration || this.o.duration;
    const frame = now => {
      if (!this.running) { token.frame = 0; token.lastTime = 0; return }
      if (!token.lastTime) token.lastTime = now;
      token.elapsed += now - token.lastTime;
      token.lastTime = now;
      const progress = Math.min(1, token.elapsed / duration);
      const point = edge.path.getPointAtLength(length * progress);
      dot.setAttribute('cx', point.x); dot.setAttribute('cy', point.y);
      if (progress < 1) token.frame = requestAnimationFrame(frame);
      else {
        token.frame = 0;
        dot.remove(); edge.path.classList.remove('is-active'); this.active.delete(token);
        clearTimeout(targetNode.stateTimer);
        targetNode.group.dataset.state = 'active';
        targetNode.group.classList.remove('pulse-once');
        requestAnimationFrame(() => targetNode.group.classList.add('pulse-once'));
        targetNode.stateTimer = setTimeout(() => {
          targetNode.group.dataset.state = 'normal';
          targetNode.group.classList.remove('pulse-once');
          targetNode.stateTimer = 0;
        }, 800);
      }
    };
    token.step = frame;
    token.frame = requestAnimationFrame(frame);
    return true;
  }
  startAutoFlow() {
    if (this.timer) return this;
    this.running = true;
    this.active.forEach(token => {
      if (!token.frame) {
        token.lastTime = 0;
        token.frame = requestAnimationFrame(token.step);
      }
    });
    const fire = () => { const pair = this.sequence[this.sequenceIndex++ % this.sequence.length]; this.send(pair[0], pair[1]) };
    clearTimeout(this.initialTimer);
    this.initialTimer = setTimeout(() => { this.initialTimer = 0; if (this.running) fire() }, 500);
    this.timer = setInterval(fire, this.o.interval);
    return this;
  }
  stopAutoFlow() { clearTimeout(this.initialTimer); clearInterval(this.timer); this.initialTimer = 0; this.timer = 0; return this }
  pause() {
    this.running = false;
    this.stopAutoFlow();
    this.active.forEach(token => { if (token.frame) cancelAnimationFrame(token.frame); token.frame = 0; token.lastTime = 0 });
    return this;
  }
  resume() {
    this.running = true;
    if (this.o.autoFlow) return this.startAutoFlow();
    this.active.forEach(token => {
      if (!token.frame) { token.lastTime = 0; token.frame = requestAnimationFrame(token.step) }
    });
    return this;
  }
  setActivePath(ids = []) { this.edges.forEach(e => e.path.classList.toggle('is-active', ids.includes(e.id))); return this }
  updateOptions(o = {}) {
    Object.assign(this.o, o);
    this.svg.style.setProperty('--network-color', this.o.color);
    this.svg.style.setProperty('--network-edge-opacity', this.o.edgeOpacity);
    return this;
  }
  destroy() { this.pause(); this.io?.disconnect(); this.ro?.disconnect(); this.active.forEach(x => { cancelAnimationFrame(x.frame); x.dot.remove() }); this.nodes.forEach(node => clearTimeout(node.stateTimer)); this.svg.remove(); this.nodes.clear(); this.edges.clear() }
}
/** Low-amplitude model motion and independently controlled BIM layer separation. */
class BimModelMotion {
  static init(el, o = {}) { return new BimModelMotion(el, o) }
  constructor(el, o = {}) {
    this.elements = el instanceof Element ? [el] : [...(el || [])].filter(Boolean);
    this.el = this.elements[0];
    this.o = { mode:'float', duration:9000, explodeDistance:14, ...o };
    this.running = true;
    this.sequenceEnabled = false;
    this.sequenceTimers = [];
    this.updateOptions();
    this.setMode(this.o.mode);
    this.io = new IntersectionObserver(entries => entries.forEach(entry => {
      entry.target.classList.toggle('is-motion-paused', !entry.isIntersecting || !this.running || this.disabled || this.rhythmHeld || document.documentElement.classList.contains('is-motion-paused'));
    }), { threshold:.05 });
    this.elements.forEach(x => this.io.observe(x));
  }
  setMode(mode) {
    this.o.mode = mode;
    this.elements.forEach(el => {
      el.classList.remove('motion-model-float', 'motion-model-explode');
      el.classList.add(mode === 'explode' ? 'motion-model-explode' : 'motion-model-float');
    });
    return this;
  }
  play() {
    this.running = true;
    this.elements.forEach(el => el.classList.toggle('is-motion-paused', !visible(el)));
    return this;
  }
  pause() { this.running = false; this._clearSequenceTimers(); this.elements.forEach(el => el.classList.add('is-motion-paused')); return this }
  resume() { return this.sequenceEnabled ? this.playSequence() : this.play() }
  reset() { this.sequenceEnabled = false; this._clearSequenceTimers(); this.setLayerProgress(0); return this.setMode('float') }
  explode() { this.setMode('explode'); this.setLayerProgress(1); return this }
  assemble() { this.setLayerProgress(0); this.setMode('float'); return this }
  setLayerProgress(progress = 0) {
    const value = Math.max(0, Math.min(1, progress));
    const offsets = { architecture:-8, structure:-16, process:-24, utility:-32, pipeline:-32, equipment:4 };
    this.elements.forEach(el => {
      el.dataset.layerProgress = value;
      qa('[data-model-layer]', el).forEach(layerEl => {
        const offset = offsets[layerEl.dataset.modelLayer] ?? -this.o.explodeDistance;
        layerEl.style.setProperty('--layer-shift', `${offset * value}px`);
      });
    });
    return this;
  }
  _clearSequenceTimers() { this.sequenceTimers.forEach(clearTimeout); this.sequenceTimers = [] }
  playSequence() {
    this.sequenceEnabled = true;
    this._clearSequenceTimers();
    this.play();
    const cycle = () => {
      if (!this.sequenceEnabled || !this.running) return;
      this.assemble();
      this.sequenceTimers.push(setTimeout(() => this.explode(), 2000));
      this.sequenceTimers.push(setTimeout(() => this.assemble(), 5750));
      this.sequenceTimers.push(setTimeout(cycle, 12000));
    };
    cycle();
    return this;
  }
  updateOptions(o = {}) {
    Object.assign(this.o, o);
    this.elements.forEach(el => {
      el.style.setProperty('--model-duration', `${this.o.duration}ms`);
      el.style.setProperty('--explode-duration', `${this.o.explodeDuration || 1800}ms`);
    });
    return this;
  }
  destroy() {
    this.pause();
    this.sequenceEnabled = false;
    this._clearSequenceTimers();
    this.io?.disconnect();
    this.elements.forEach(el => {
      el.classList.remove('motion-model-float', 'motion-model-explode', 'is-motion-paused');
      el.removeAttribute('data-layer-progress');
    });
  }
}
/** Six-step industrial BIM model presentation sequencer. */
class ModelShowcase {
  constructor(el, o = {}) {
    this.el = el;
    this.o = { stepDurations:[2000,2000,2000,2000,2000,2000], ...o };
    this.placeholder = q('.placeholder', el) || el;
    this.placeholder.classList.add('has-model-scene');
    this.placeholder.insertAdjacentHTML('afterbegin', `
      <div class="model-stage model-scene-shell" data-active-layer="all" aria-hidden="true">
        <svg class="model-showcase-svg" viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="showcase-grid" width="42" height="42" patternUnits="userSpaceOnUse"><path d="M42 0H0V42" fill="none" stroke="rgba(0,140,90,.14)" stroke-width="1"/></pattern>
            <filter id="showcase-glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <path class="model-ground" d="M95 390L470 185 905 337 526 487Z"/>
          <path class="model-grid-plane" d="M95 390L470 185 905 337 526 487Z"/>
          <g class="bim-model-layer model-layer model-layer-structure layer-structure" data-model-layer="structure">
            <path d="M245 352V224L482 112 744 206V350L506 455Z"/>
            <path d="M245 224L506 318 744 206M506 318V455M482 112L506 318"/>
            <path d="M294 244V330M348 220V352M408 190V374M470 158V396M545 147V395M612 170V375M678 194V353"/>
          </g>
          <g class="bim-model-layer model-layer model-layer-architecture layer-architecture" data-model-layer="architecture">
            <path d="M274 237L483 138 711 218V328L505 421 274 338Z"/>
            <path d="M274 272L505 355 711 253M274 307L505 390 711 288"/>
            <path d="M318 221V354M365 199V371M416 174V389M557 164V398M608 182V378M658 201V359"/>
          </g>
          <g class="bim-model-layer model-layer model-layer-equipment layer-equipment" data-model-layer="equipment">
            <ellipse cx="390" cy="332" rx="57" ry="22"/><path d="M333 332V286M447 332V286"/><ellipse cx="390" cy="286" rx="57" ry="22"/>
            <rect x="500" y="283" width="92" height="68" rx="4"/><path d="M512 303H580M512 322H580"/>
            <circle cx="642" cy="300" r="34"/><circle cx="642" cy="300" r="17"/><path d="M642 266V334M608 300H676"/>
          </g>
          <g class="bim-model-layer model-layer model-layer-process layer-process" data-model-layer="process">
            <path class="model-pipe pipe-process" d="M296 366C352 352 372 351 390 332S470 294 500 317H608C626 317 632 310 642 300"/>
            <path class="model-pipe pipe-process" d="M362 286C431 258 485 238 547 249S658 272 705 246"/>
            <circle class="model-valve" cx="474" cy="314" r="7"/><circle class="model-valve" cx="547" cy="249" r="7"/>
          </g>
          <g class="bim-model-layer model-layer model-layer-utility layer-utility" data-model-layer="utility">
            <path d="M253 341C315 390 398 421 496 427S682 389 744 350"/>
            <g class="model-equipment-nodes"><circle cx="309" cy="245" r="6"/><circle cx="496" cy="427" r="6"/><circle cx="744" cy="350" r="6"/></g>
          </g>
          <g class="bim-model-layer model-layer model-layer-pipeline layer-pipeline" data-model-layer="pipeline">
            <path class="model-pipe pipe-utility" d="M253 341C315 390 398 421 496 427S682 389 744 350"/>
            <path class="model-pipe pipe-utility" d="M309 245C345 222 371 207 409 194S471 174 505 179"/>
          </g>
          <g class="professional-layer professional-layer-hvac" data-professional-layer="hvac">
            <path d="M310 260H430V230H555V262H690" stroke-dasharray="16 9"/><path d="M344 278V306M520 246V286M646 262V294"/>
          </g>
          <g class="professional-layer professional-layer-electrical" data-professional-layer="electrical">
            <path d="M286 375L505 465 771 348" stroke-dasharray="7 11"/><path d="M286 358L484 268 725 350" stroke-dasharray="7 11"/>
          </g>
          <g class="industrial-context-layer">
            <rect x="172" y="350" width="86" height="46" rx="3"/><path d="M172 350L208 330 294 361 258 396"/>
            <rect x="718" y="310" width="82" height="52" rx="3"/><path d="M718 310L755 290 837 322 800 362"/>
            <path class="agv-route" d="M205 415C330 465 633 470 793 386" stroke-dasharray="5 10"/>
            <rect class="agv-unit" x="462" y="442" width="28" height="14" rx="3"/>
            <text x="184" y="344">PROCESS HALL</text><text x="727" y="304">ENERGY CENTER</text><text x="475" y="478">AGV LOGISTICS</text>
          </g>
        </svg>
        <div class="professional-layer-indicator"><span data-layer-name="architecture">Architecture</span><span data-layer-name="process">Process</span><span data-layer-name="utility">Utility</span><span data-layer-name="hvac">HVAC</span><span data-layer-name="electrical">Electrical</span></div>
      </div>`);
    this.scene = q('.model-scene-shell', this.placeholder);
    this.motion = BimModelMotion.init(this.scene, { mode:'float', duration:9000, explodeDistance:14 });
    this.currentStep = -1;
    this.timer = 0;
    this.running = false;
    this.io = new IntersectionObserver(([entry]) => entry.isIntersecting && !this.disabled && !this.rhythmHeld && !document.documentElement.classList.contains('is-motion-paused') ? this.resume() : this.pause(), { threshold:.08 });
    this.io.observe(el);
  }
  _applyStep(index) {
    this.currentStep = index;
    this.scene.dataset.sequenceStep = ['architecture','process','utility','hvac','electrical','restore'][index];
    this.scene.classList.remove('is-static', 'is-equipment-active');
    if (index === 0) { this.setProfessionalLayer('architecture'); this.motion.assemble().play() }
    if (index === 1) { this.setProfessionalLayer('process'); this.motion.explode().play() }
    if (index === 2) { this.setProfessionalLayer('utility'); this.scene.classList.add('is-equipment-active'); this.motion.play() }
    if (index === 3) { this.setProfessionalLayer('hvac'); this.motion.play() }
    if (index === 4) { this.setProfessionalLayer('electrical'); this.motion.play() }
    if (index === 5) { this.setProfessionalLayer('all'); this.motion.assemble().pause(); this.scene.classList.add('is-static') }
  }
  _runStep(index) {
    clearTimeout(this.timer);
    this._applyStep(index);
    if (this.running) this.timer = setTimeout(() => this._runStep((index + 1) % 6), this.o.stepDurations[index]);
  }
  playSequence() { if (this.running) return this; this.running = true; this._runStep(0); return this }
  pause() { this.running = false; clearTimeout(this.timer); this.timer = 0; this.motion.pause(); return this }
  resume() { if (this.running) return this; this.running = true; this._runStep(this.currentStep < 0 ? 0 : this.currentStep); return this }
  nextStep() { this._runStep((this.currentStep + 1) % 6); return this }
  reset() { this.running = false; clearTimeout(this.timer); this.timer = 0; this._applyStep(5); return this }
  setProfessionalLayer(name = 'all') {
    this.scene.dataset.activeLayer = name;
    qa('[data-layer-name]', this.scene).forEach(label => label.classList.toggle('is-active', label.dataset.layerName === name));
    return this;
  }
  destroy() { this.pause(); this.io?.disconnect(); this.motion.destroy(); this.scene.remove() }
}
/** Unified lifecycle, quality, reduced-motion and component control surface. */
class BimHomeMotionController {
  constructor(o = {}) {
    const requestedQuality = o.quality || 'auto';
    this.autoQuality = requestedQuality === 'auto';
    this.o = { ...o, quality:this._resolveQuality(requestedQuality), reducedMotion:o.reducedMotion ?? matchMedia('(prefers-reduced-motion:reduce)').matches };
    this.items = {};
    this.initialized = false;
    this.rhythmStarted = false;
    this.rhythmTimers = [];
  }
  _resolveQuality(value) {
    if (value !== 'auto') return value;
    if (innerWidth < 768) return 'low';
    if (innerWidth < 1180) return 'medium';
    return 'high';
  }
  init() {
    if (this.initialized) return this;
    document.documentElement.classList.add('is-motion-paused');
    const hero = q('.hero'); if (hero) this.items.digitalScan = DigitalScanOverlay.init(hero, this.o.digitalScan);
    const cards = qa('.ability');
    this.items.nodePulse = NodePulse.init(cards[1]?.querySelector('.ability-visual') || document.body, this.o.nodePulse);
    [[21,78],[38,84],[59,72],[78,80]].forEach(([x,y], i) => this.items.nodePulse.register(`quality-${i}`, { x, y, delay:i * 350 }));
    const utilityVisual = cards[2]?.querySelector('.ability-visual');
    if (utilityVisual) this.items.pipelineFlow = PipelineFlow.init(utilityVisual, this.o.pipelineFlow);
    const modelVisuals = cards.slice(0,2).map(card => card.querySelector('.ability-visual')).filter(Boolean);
    if (modelVisuals.length) this.items.bimModelMotion = BimModelMotion.init(modelVisuals, this.o.bimModelMotion);
    const publicVisual = cards[3]?.querySelector('.ability-visual');
    if (publicVisual) this.items.networkDataFlow = NetworkDataFlow.init(publicVisual, this.o.networkDataFlow);
    const show = q('.gif-stage'); if (show && !q('img', show)) this.items.modelShowcase = new ModelShowcase(show, this.o.modelShowcase);
    this._observe();
    this.setQuality(this.autoQuality ? 'auto' : this.o.quality);
    document.documentElement.classList.toggle('motion-reduced', this.o.reducedMotion);
    this.initialized = true;
    return this;
  }
  _observe() {
    this.io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-visible') }), {threshold:.12});
    qa('.content,.cases').forEach(section => { section.classList.add('motion-section-reveal'); if (visible(section)) section.classList.add('is-visible'); this.io.observe(section) });
    qa('.title,.ability,.gif-slot,.case').forEach((x,i) => { x.classList.add('motion-reveal'); x.style.transitionDelay=`${Math.min(i%4,3)*80}ms`; if (visible(x)) x.classList.add('is-visible'); this.io.observe(x) });
    document.addEventListener('visibilitychange', this._visibility = () => document.hidden ? this.pause() : this.resume());
    addEventListener('resize', this._resize = () => { if (this.autoQuality) this.setQuality('auto') }, { passive:true });
  }
  start() { return this.resume() }
  _isLowQualityBlocked(key) {
    return this.o.quality === 'low' && ['networkDataFlow','bimModelMotion','modelShowcase'].includes(key);
  }
  _startItem(key, item) {
    if (!item || item.disabled || item.rhythmHeld || this._isLowQualityBlocked(key) || this.o.reducedMotion || document.documentElement.classList.contains('is-motion-paused')) return;
    if (item.el && !visible(item.el)) { item.pause?.(); return; }
    if (item.resume) item.resume(); else if (item.start) item.start(); else item.play?.();
  }
  _clearRhythmTimers() {
    this.rhythmTimers.forEach(clearTimeout);
    this.rhythmTimers = [];
  }
  _startRhythm() {
    const schedule = { digitalScan:0, pipelineFlow:2000, networkDataFlow:4000, bimModelMotion:6000, modelShowcase:6000, nodePulse:10000 };
    this.rhythmStarted = true;
    Object.entries(this.items).forEach(([key, item]) => {
      const delay = schedule[key] ?? 0;
      item.pause?.();
      item.rhythmHeld = delay > 0;
      if (!delay) {
        this._startItem(key, item);
        return;
      }
      const timer = setTimeout(() => {
        this.rhythmTimers = this.rhythmTimers.filter(id => id !== timer);
        item.rhythmHeld = false;
        this._startItem(key, item);
      }, delay);
      this.rhythmTimers.push(timer);
    });
  }
  pause() {
    this._clearRhythmTimers();
    document.documentElement.classList.add('is-motion-paused');
    Object.values(this.items).forEach(x => x.pause?.());
    return this;
  }
  resume() {
    if (this.o.reducedMotion) return this;
    document.documentElement.classList.remove('is-motion-paused');
    if (!this.rhythmStarted) {
      this._startRhythm();
      return this;
    }
    Object.entries(this.items).forEach(([key, item]) => {
      item.rhythmHeld = false;
      this._startItem(key, item);
    });
    return this;
  }
  stop() { return this.pause() }
  destroy() { this.pause(); this.io?.disconnect(); document.removeEventListener('visibilitychange',this._visibility); removeEventListener('resize',this._resize); Object.values(this.items).forEach(x=>x.destroy?.()); this.items={}; this.initialized=false; this.rhythmStarted=false }
  enable(k) { const item = this.items[k]; if (item) { item.disabled = false; this._startItem(k, item) } return this }
  disable(k) { const item = this.items[k]; if (item) { item.disabled = true; item.pause?.() } return this }
  setQuality(v) {
    this.autoQuality = v === 'auto';
    this.o.quality = this._resolveQuality(v);
    document.documentElement.dataset.motionQuality = this.o.quality;
    const canRun = !this.o.reducedMotion && !document.documentElement.classList.contains('is-motion-paused');
    const basePipelineSpeed = this.o.pipelineFlow?.speed || 1;
    this.items.pipelineFlow?.setSpeed(this.o.quality === 'low' ? basePipelineSpeed * .7 : this.o.quality === 'medium' ? basePipelineSpeed * .85 : basePipelineSpeed);
    if (this.o.quality === 'low') {
      this.items.networkDataFlow?.pause();
      this.items.bimModelMotion?.pause();
      this.items.modelShowcase?.reset();
    } else if (canRun) {
      this._startItem('networkDataFlow', this.items.networkDataFlow);
      this._startItem('bimModelMotion', this.items.bimModelMotion);
      this._startItem('modelShowcase', this.items.modelShowcase);
    }
    return this;
  }
  setReducedMotion(v) { this.o.reducedMotion=v; document.documentElement.classList.toggle('motion-reduced',v); v?this.pause():this.resume(); return this }
  updateOptions(o) { Object.assign(this.o,o); Object.entries(o).forEach(([k,v])=>this.items[k]?.updateOptions?.(v)); return this }
  getState() { return { initialized:this.initialized, playing:!document.documentElement.classList.contains('is-motion-paused'), quality:this.o.quality, reducedMotion:this.o.reducedMotion, activeAnimations:Object.keys(this.items) } }
}
window.BimHomeMotion = {
  BimHomeMotionController,
  DigitalScanOverlay,
  PipelineFlow,
  BimModelMotion,
  NodePulse,
  NetworkDataFlow,
  ModelShowcase
};
window.BimHomeMotionController = BimHomeMotionController;

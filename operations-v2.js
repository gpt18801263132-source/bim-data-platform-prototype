(() => {
  const scene = document.getElementById('scene');
  const params = new URLSearchParams(location.search);
  const requestedView = params.get('view');
  const initialFloor = requestedView === 'energy' && params.get('floor') === '4' ? 4 : 3;
  const state = { view: ['overview', 'solar', 'building', 'energy', 'safety', 'security'].includes(requestedView) ? requestedView : 'overview', solar: ['a', 'b', 'curtain'].includes(params.get('unit')) ? params.get('unit') : null, overviewFloor: requestedView === 'overview' && params.has('floor') ? 3 : null, buildingFloor: initialFloor, room: initialFloor === 4 ? '四楼整体' : '三楼整体', period: '今日', acOn: false, acMode: '制冷', lights: [false, false, false, false], safetyDetail: null, solarChartExpanded: false, bulkAction: null, bulkFeedback: '', weatherCity: '合肥' };
  const panels = { ac: false, lights: false };
  const canControl = params.get('permission') !== 'readonly';
  const names = { overview: '园区总览', solar: '光储系统', building: '楼宇控制', energy: '能耗计量', safety: '用电安全', security: '园区安防' };
  const units = {
    a: { name: 'A楼屋顶光伏', today: '4.7', power: null, location: 'A楼屋顶光伏板区域' },
    b: { name: 'B楼屋顶光伏', today: '18.5', power: null, location: 'B楼屋顶' },
    curtain: { name: 'A楼光伏幕墙', today: '0', power: null, location: 'A楼外立面光伏幕墙' }
  };
  const roomsByFloor = {
    3: ['301办公室', '303办公室', '304办公室', '305办公室', '306办公室', '307办公室', '308办公室', '311会议室'],
    4: ['401办公室', '403办公室', '404办公室', '405办公室', '406办公室', '407办公室', '408办公室', '411会议室']
  };
  // 客户确认的空间分组；同组房间进入能耗详情时查看同一组的照明、插座回路。
  const energyRoomGroups = {
    3: [['301办公室', '303办公室', '304办公室'], ['305办公室', '306办公室'], ['307办公室', '308办公室'], ['309办公室', '310办公室'], ['311会议室']],
    4: [['401办公室', '403办公室', '404办公室'], ['405办公室', '406办公室'], ['407办公室', '408办公室'], ['411会议室']]
  };
  const energyGroupForRoom = (floor, room) => energyRoomGroups[floor]?.find(group => group.includes(room)) || [room];
  const sumUnitValues = field => { const values = Object.values(units).map(unit => unit[field]); return values.some(value => value == null) ? null : Math.round(values.reduce((total, value) => total + Number(value), 0) * 100) / 100; };
  const totalGeneration = () => sumUnitValues('today');
  const totalPower = () => sumUnitValues('power');
  const safetyFilters = { status: 'all', range: '24h' };
  const weatherPanel = () => `<section class="overview-weather" aria-label="${state.weatherCity}当前天气"><div class="weather-current"><strong>24<span>°C</span></strong><div><b>晴</b><small>${state.weatherCity}</small></div></div><div class="weather-extra"><div><span>相对湿度</span><b>43<small>%</small></b></div><div><span>风向</span><b>东风</b></div><div><span>风力</span><b>4<small>级</small></b></div></div></section>`;
  const safetyFilterControls = () => `<div class="safety-filter-controls" aria-label="监测详情筛选"><label>监测状态 <select id="safetyStatusFilter"><option value="all" ${safetyFilters.status === 'all' ? 'selected' : ''}>全部点位</option><option value="abnormal" ${safetyFilters.status === 'abnormal' ? 'selected' : ''}>仅异常点位</option></select></label><label>告警范围 <select id="safetyRangeFilter">${[['24h','最近24小时'],['7d','最近7天'],['30d','最近30天']].map(([value,label]) => `<option value="${value}" ${safetyFilters.range === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div>`;
  const floorMarkerPositions = [[30, 68], [42, 63], [51, 59], [60, 54], [69, 50], [28, 48]];
  const roomReadings = room => `<div class="room-basic-readings"><span>温度 <b>${room === '301办公室' ? '22.6 ℃' : '— ℃'}</b></span><span>空调 <b class="${room === '301办公室' && state.acOn ? 'ac-running' : ''}">${room === '301办公室' ? (state.acOn ? '已开启' : '已关闭') : '待接入'}</b></span></div>`;
  const buildingOverallRoomCards = () => {
    const rooms = state.view === 'energy' && state.buildingFloor === 4 ? ['401办公室', '403办公室', '404办公室', '405办公室', '406办公室', '411会议室'] : ['301办公室', '303办公室', '304办公室', '305办公室', '306办公室', '311会议室'];
    // 卡片对齐用户标注的门洞位置；相邻房间上下错开，避免信息遮挡。
    const positions = [[21.4, 39], [33.5, 34.5], [37.1, 52], [62.3, 32], [67.7, 50], [79.4, 34]];
    return `<div class="building-overall-room-layer" aria-label="三楼房间信息">${rooms.map((room, index) => { const [x, y] = positions[index]; return `<button class="floor-room-marker overall-room-marker" style="left:${x}%;top:${y}%" data-enter-room="${room}" data-enter-floor="${state.buildingFloor}" aria-label="查看${room}信息"><span>${room}</span>${state.view === 'energy' ? `<div class="room-basic-readings"><span>空调耗电 <b>— kWh</b></span></div>` : roomReadings(room)}</button>`; }).join('')}</div>`;
  };
  const buildingCallouts = () => `<svg class="overview-building-connectors" aria-hidden="true">${['b','a','curtain'].map(key => `<g data-connector="${key}"><path/><circle r="4"/></g>`).join('')}</svg>${['b', 'a', 'curtain'].map(key => `<aside class="overview-building-card" data-building-card="${key}"><header><strong>${key === 'curtain' ? 'A楼幕墙' : key.toUpperCase() + '楼'}</strong><small>光伏概况</small></header><div><span>今日光伏</span><b class="building-generation">${units[key].today} <small>kWh</small></b></div></aside>`).join('')}`;
  function updateBuildingConnectors() {
    const stage = scene.querySelector('.overview-model-stage');
    const model = stage?.querySelector('.overview-model-img');
    const svg = stage?.querySelector('.overview-building-connectors');
    if (!model?.naturalWidth || !svg) return;
    const bounds = stage.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    if (window.matchMedia('(max-width:850px)').matches) {
      stage.querySelectorAll('[data-building-card]').forEach(card => { card.style.left = ''; card.style.top = ''; });
      return;
    }
    const imageBounds = model.getBoundingClientRect();
    const scale = Math.min(imageBounds.width / model.naturalWidth, imageBounds.height / model.naturalHeight);
    const width = model.naturalWidth * scale, height = model.naturalHeight * scale;
    const left = imageBounds.left - bounds.left + (imageBounds.width - width) / 2;
    const top = imageBounds.top - bounds.top + (imageBounds.height - height) / 2;
    for (const [key, x, y] of [['b', .59, .32], ['a', .79, .51], ['curtain', .743, .635]]) {
      const card = stage.querySelector(`[data-building-card="${key}"]`);
      const end = { x: left + width * x, y: top + height * y };
      const beside = end.y < card.offsetHeight + 44;
      const cardLeft = Math.max(12, Math.min(bounds.width - card.offsetWidth - 12, beside ? end.x - card.offsetWidth - 40 : end.x + (key === 'b' ? -35 : 55)));
      const cardTop = key === 'curtain' ? Math.min(bounds.height - card.offsetHeight - 54, end.y + 30) : Math.max(12, end.y - card.offsetHeight - 32);
      card.style.left = `${cardLeft}px`; card.style.top = `${cardTop}px`;
      const start = key === 'curtain' ? { x: cardLeft + card.offsetWidth * .35, y: cardTop } : beside ? { x: cardLeft + card.offsetWidth, y: cardTop + card.offsetHeight * .65 } : { x: cardLeft + card.offsetWidth * .35, y: cardTop + card.offsetHeight };
      const group = svg.querySelector(`[data-connector="${key}"]`);
      group.querySelector('path').setAttribute('d', key === 'curtain' ? `M ${start.x} ${start.y} L ${start.x} ${start.y - 16} L ${end.x} ${end.y}` : beside ? `M ${start.x} ${start.y} L ${start.x + 16} ${start.y} L ${end.x} ${end.y}` : `M ${start.x} ${start.y} L ${start.x} ${start.y + 16} L ${end.x} ${end.y}`);
      group.querySelector('circle').setAttribute('cx', end.x);
      group.querySelector('circle').setAttribute('cy', end.y);
    }
  }
  new ResizeObserver(() => requestAnimationFrame(updateBuildingConnectors)).observe(scene);
  window.addEventListener('resize', updateBuildingConnectors);
  const img = (file, cls, alt) => `<img class="scene-image ${cls}" src="operations-assets/${file}" alt="${alt}">`;
  const heading = (en, title, desc) => `<div class="scene-heading"><span>${en}</span><h1>${title}</h1>${desc ? `<p>${desc}</p>` : ''}</div>`;
  const note = () => '';
  const metric = (label, value, featured = false) => `<div class="side-metric ${featured ? 'featured' : ''}"><span>${label}</span><strong>${value}</strong></div>`;
  const selectors = () => `<div class="location-controls room-only" aria-label="空间筛选"><label>空间 <select id="roomSelect" aria-label="选择空间">${(state.view === 'energy' ? [3,4] : [3]).map(floor => `<optgroup label="A楼${floor === 3 ? '三' : '四'}层"><option value="${floor === 3 ? '三楼整体' : '四楼整体'}" ${state.room === (floor === 3 ? '三楼整体' : '四楼整体') ? 'selected' : ''}>A楼${floor === 3 ? '三' : '四'}层</option>${(state.view === 'energy' ? energyRoomGroups[floor].flat() : roomsByFloor[floor]).map(room => `<option ${room === state.room ? 'selected' : ''}>${room}</option>`).join('')}</optgroup>`).join('')}</select></label></div>`;
  const lightingNames = ['南301外东', '南301东', '南301西', '南301外西'];
  const airQuality = () => `<aside class="data-panel official-air" aria-label="空气质量"><h2><span class="panel-icon">⚑</span>空气质量</h2><div class="official-air-list">${[
    ['温度', '22.6', '℃', '舒适范围: 22–26℃'],
    ['湿度', '45.4', '%', '舒适范围: 40–60%'],
    ['光照强度', '0', 'lx', '舒适范围: 300–600lx'],
    ['PM2.5', '14.15', 'μg/m³', '标准值: &lt;35 μg/m³']
  ].map(([label, value, unit, hint]) => `<div class="air-reading"><div><span>${label}</span><strong>${value}<small>${unit}</small></strong></div><p>${hint}</p></div>`).join('')}</div></aside>`;
  const energyMonitor = () => {
    const overall = state.room.endsWith('楼整体');
    const floorName = `A楼${state.buildingFloor === 3 ? '三' : '四'}层`;
    const acValue = !overall && state.room === '301办公室' && state.period === '今日' ? '0.00' : '—';
    const group = overall ? [] : energyGroupForRoom(state.buildingFloor, state.room);
    const groupName = group.join('、');
    const roomNo = state.room.match(/^([34]\d{2})/)?.[1] || state.room.replace(/办公室|会议室/, '');
    const acDevices = state.room === '307办公室' ? ['307西空调', '307东空调'] : [`${roomNo}空调`];
    return `<aside class="data-panel official-energy" aria-label="${overall ? floorName + '能耗总览' : state.room + '能耗'}"><h2><span class="panel-icon">◷</span>${overall ? '楼层能耗总览' : '房间能耗'}</h2><div class="official-energy-body">${overall ? `<p class="energy-scope">${floorName} · 全层统计</p>` : ''}<div class="period-tabs">${['今日', '本周', '本月'].map(p => `<button data-period="${p}" aria-pressed="${state.period === p}">${p}</button>`).join('')}</div>${overall ? `<div class="energy-totals"><div><span>${state.period}全层空调</span><strong>${acValue}<small> kWh</small></strong></div><div><span>${state.period}全层插座＋照明</span><strong>—<small> kWh</small></strong></div></div>` : `<h3 class="split-ac-heading"><span>♧</span>分体空调能耗</h3><div class="split-ac-list">${acDevices.map(device => `<div class="split-ac-item"><div><span>${device}</span><strong>${state.room === '301办公室' ? '0.00' : '—'}<small> kWh</small></strong></div><i aria-hidden="true"></i></div>`).join('')}</div><h3>所在空间组回路能耗</h3><p class="energy-group-label">${groupName} · 以上房间合计用电</p><div class="energy-circuit-grid"><div class="energy-circuit"><b>照明</b><strong>—<small> kWh</small></strong></div><div class="energy-circuit"><b>插座</b><strong>—<small> kWh</small></strong></div></div>`}<h3>${overall ? '楼层' : '房间与回路'}能耗趋势 (kWh)</h3><div class="energy-graph"><div class="graph-legend"><span>● 空调</span><span>● ${overall ? '插座＋照明' : '照明'}</span>${overall ? '' : '<span>● 插座</span>'}</div><div class="energy-no-data">趋势数据待接入</div></div></div></aside>`;
  };
  const buildingControls = () => `<div class="building-device-controls"><div class="device-panel-switches"><button data-panel-toggle="ac" aria-expanded="${panels.ac}" ${canControl ? '' : 'disabled title="无控制权限"'}>空调控制 ${panels.ac ? '⌃' : '⌄'}</button><button data-panel-toggle="lights" aria-expanded="${panels.lights}" ${canControl ? '' : 'disabled title="无控制权限"'}>照明控制 ${panels.lights ? '⌃' : '⌄'}</button></div>${panels.ac && canControl ? `<section class="official-ac"><div class="ac-device-row"><strong>301空调</strong><button data-ac-toggle aria-label="${state.acOn ? '关闭' : '开启'}301空调" aria-pressed="${state.acOn}">⏻</button></div>${state.acOn ? `<div class="official-ac-modes"><span>运行模式</span><button data-ac-mode="制冷" aria-pressed="${state.acMode === '制冷'}">制冷</button><button data-ac-mode="制热" aria-pressed="${state.acMode === '制热'}">制热</button></div>` : ''}</section>` : ''}${panels.lights && canControl ? `<section class="official-lights"><div class="lights-heading"><strong>301办公室</strong><button data-light-all aria-label="${state.lights.every(Boolean) ? '关闭' : '开启'}全部灯具">${state.lights.every(Boolean) ? '⏻' : '一键开启　⏻'}</button></div><div class="lights-list-label">收起灯具列表 (4)⌃</div><div class="lights-list">${lightingNames.map((name, i) => `<div class="light-device-row"><span>${name}</span><button data-light-index="${i}" aria-label="${state.lights[i] ? '关闭' : '开启'}${name}" aria-pressed="${state.lights[i]}">⏻</button></div>`).join('')}</div></section>` : ''}</div>`;
  const hourlyGeneration = {
    hours: Array.from({ length: 16 }, (_, i) => i + 5),
    a: [0, 1, 3, 0, 2, 3, 4, 4, 3, 3, 2, 2, 1, 1, 0.5, 0],
    b: [0, 2, 14, 8, 7, 6, 6, 5, 4, 4, 3, 2, 2, 1, 1, 0],
    curtain: [0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 1.5, 1, 1, 0.5, 0.5, 0]
  };
  const hourlyChart = () => {
    const left = 44, bottom = 245, top = 26, groupWidth = 43.5, barWidth = 9;
    const y = value => bottom - value / 15 * (bottom - top);
    const grid = [0, 3, 6, 9, 12, 15].map(value => `<g><line x1="${left}" y1="${y(value)}" x2="742" y2="${y(value)}" class="chart-grid-line"/><text x="35" y="${y(value) + 4}" text-anchor="end" class="chart-axis-text">${value}</text></g>`).join('');
    const bars = hourlyGeneration.hours.map((hour, i) => {
      const base = left + i * groupWidth + 5;
      const series = [['a', 0], ['b', 12], ['curtain', 24]].map(([key, offset]) => {
        const value = hourlyGeneration[key][i];
        if (!value) return '';
        const x = base + offset;
        return `<rect x="${x}" y="${y(value)}" width="${barWidth}" height="${bottom - y(value)}" class="hour-bar bar-${key}"/><text x="${x + barWidth / 2}" y="${y(value) - 5}" text-anchor="middle" class="bar-value value-${key}">${value}</text>`;
      }).join('');
      return `${series}<text x="${base + 16}" y="269" text-anchor="middle" class="chart-axis-text">${hour}</text>`;
    }).join('');
    return `<svg class="solar-hourly-chart" viewBox="0 0 760 286" role="img" aria-label="5时至20时A楼、B楼和光伏幕墙每小时发电量"><text x="44" y="15" class="chart-unit-text">发电量（kWh）</text>${grid}<line x1="${left}" y1="${bottom}" x2="742" y2="${bottom}" class="chart-axis-line"/>${bars}<text x="749" y="269" class="chart-axis-text">时</text></svg>`;
  };
  const hourlyLegend = () => `<div class="solar-chart-legend"><span><i class="legend-a"></i>A楼当日发电量</span><span><i class="legend-b"></i>B楼当日发电量</span><span><i class="legend-curtain"></i>光伏幕墙当日发电量</span></div>`;
  const powerLegend = () => `<div class="solar-chart-legend"><span><i class="legend-a"></i>A楼功率</span><span><i class="legend-b"></i>B楼功率</span><span><i class="legend-curtain"></i>幕墙功率</span></div>`;
  const powerChart = () => `<svg class="solar-hourly-chart solar-power-chart" viewBox="0 0 760 286" role="img" aria-label="A楼、B楼和光伏幕墙实时功率曲线，数据待接入"><text x="44" y="18" class="chart-unit-text">实时功率（kW）</text>${[55,115,175,235].map(y => `<line x1="44" y1="${y}" x2="742" y2="${y}" class="chart-grid-line"/>`).join('')}<text x="390" y="146" text-anchor="middle" class="chart-axis-text">功率时间序列待接入</text>${['06:00','09:00','12:00','15:00','18:00'].map((time,i) => `<text x="${55+i*168}" y="270" text-anchor="middle" class="chart-axis-text">${time}</text>`).join('')}</svg>`;
  const solarGenerationSummary = (unit = null) => {
    const values = unit ? { total: '—', year: '—', month: '—', week: '—' } : { total: '199344.76', year: '192072.5', month: '4558.81', week: '3163.97' };
    return `<aside class="solar-stat-card${unit ? ' solar-detail-panel' : ''}" aria-label="${unit ? unit.name : '园区'}发电情况总览"><h2><span>▣</span>${unit ? (state.solar === 'curtain' ? '幕墙' : state.solar.toUpperCase() + '楼') + ' · ' : ''}发电情况总览</h2>${unit ? `<div class="solar-detail-live"><div><span>今日累计发电量</span><strong>${unit.today}<small> kWh</small></strong></div><div><span>实时发电功率</span><strong>${unit.power ?? '—'}<small> kW</small></strong></div></div>` : ''}<div class="solar-total"><span>本年发电量</span><strong>${values.year}<small> kWh</small></strong></div><div class="solar-year"><span>累计总发电量</span><strong>${values.total}<small> kWh</small></strong></div><div class="solar-period-grid"><div><span>本周</span><strong>${values.week}<small> kWh</small></strong></div><div><span>本月</span><strong>${values.month}<small> kWh</small></strong></div></div>${unit ? '' : `<div class="solar-summary-current"><div><span>今日总发电量</span><b>${totalGeneration()}<small> kWh</small></b></div><div><span>实时总功率</span><b>${totalPower() ?? '—'}<small> kW</small></b></div></div>`}</aside>`;
  };
  const solarDashboard = () => `<div class="solar-overview-rail">${solarGenerationSummary()}<aside class="solar-stat-card solar-storage-card"><h2><span>▣</span>储能系统</h2>${metric('电池电量', '98%')}${metric('电池温度', '29 ℃')}${metric('健康度', '100%')}</aside></div><div class="solar-chart-rail"><aside class="solar-chart-card"><div class="solar-chart-heading"><h2><span>▣</span>发电量小时统计</h2></div>${hourlyChart()}${hourlyLegend()}</aside><aside class="solar-chart-card"><div class="solar-chart-heading"><h2><span>▣</span>实时发电功率</h2></div>${powerChart()}${powerLegend()}</aside></div>`;
  const floorTabs = () => `<div class="floor-tabs" aria-label="三楼空间导航"><button data-floor-select="3" aria-pressed="${state.overviewFloor === 3}">三楼剖面</button></div>`;
  function floorSection() {
    const floor = state.overviewFloor;
    const markers = ['301办公室', '303办公室', '304办公室', '305办公室', '306办公室', '311会议室'].map((room, i) => {
      const [x, y] = floorMarkerPositions[i];
      return `<button class="floor-room-marker" style="left:${x}%;top:${y}%" data-enter-room="${room}" data-enter-floor="${floor}" aria-label="进入${room}楼宇控制"><span>${room}</span>${roomReadings(room)}</button>`;
    }).join('');
    return `<div class="floor-section-stage"><div class="floor-section-frame"><img src="operations-assets/floor-section-reference.png" alt="A楼单层建筑剖面"><div class="floor-marker-layer">${markers}</div></div></div><div class="floor-section-toolbar"><button data-floor-back>← 园区总览</button><strong>A楼 · ${floor === 2 ? '二层' : '三层'}剖面</strong></div><div class="floor-room-list" aria-label="房间快捷入口">${roomsByFloor[floor].map(room => `<button data-enter-room="${room}" data-enter-floor="${floor}"><strong>${room}</strong>${roomReadings(room)}</button>`).join('')}</div>`;
  }

  function overview() {
    if (state.overviewFloor) return floorSection();
    return `<div class="overview-dashboard">
      <div class="overview-page-title"><div><span>CAMPUS OPERATIONS</span><h1>园区运行总览</h1></div></div>
      <div class="overview-workspace">
        <div class="overview-essential-rail">
          <aside class="overview-side-card overview-safety"><header><h2>安全状态</h2><button data-view="safety">详情 ›</button></header><div class="overview-monitor-row"><span>线缆温度</span><b class="overview-normal">全部正常</b></div><div class="overview-monitor-row"><span>漏电监测</span><b>待同步</b></div></aside>
          <aside class="overview-side-card overview-energy"><header><h2>今日能源</h2><button data-view="solar">详情 ›</button></header><div class="overview-essential-metric"><span>光伏总发电量</span><strong>${totalGeneration()}<small>kWh</small></strong></div><div class="overview-essential-metric"><span>实时总发电功率</span><strong>${totalPower() ?? '—'}<small>kW</small></strong></div><div class="overview-essential-metric"><span>储能电量</span><strong>98<small>%</small></strong></div><div class="overview-essential-metric overview-campus-consumption"><span>A楼今日总用电</span><strong>—<small>kWh</small></strong></div></aside>
          <aside class="overview-side-card overview-bulk-control"><header><h2>楼宇快捷控制</h2><button data-view="building">进入 ›</button></header><button data-bulk-action="lights">关闭三楼全部照明 <span>⏻</span></button><small>包含走廊照明</small><button data-bulk-action="room-lights">关闭三楼全部房间照明 <span>⏻</span></button><small>不含走廊照明</small><button data-bulk-action="ac">关闭三楼全部空调 <span>⏻</span></button>${state.bulkFeedback ? `<p class="overview-bulk-feedback" role="status">${state.bulkFeedback}</p>` : ''}</aside>
        </div>
        <section class="overview-model-area" aria-label="园区 BIM 空间导航"><div class="overview-space-nav"><div><small>空间导航</small><strong>A楼</strong></div>${floorTabs()}</div><div class="overview-model-stage"><img class="overview-model-img" src="operations-assets/campus-clean.png" alt="园区 BIM 整体模型">${buildingCallouts()}<div class="overview-model-caption"><span>园区 BIM 模型</span></div></div></section>
      </div>
    </div>${state.bulkAction ? `<div class="bulk-control-backdrop" data-bulk-cancel></div><section class="bulk-control-dialog" role="dialog" aria-modal="true" aria-labelledby="bulkTitle"><h2 id="bulkTitle">${state.bulkAction === 'lights' ? '关闭三楼全部照明' : state.bulkAction === 'room-lights' ? '关闭三楼全部房间照明' : '关闭三楼全部空调'}</h2><p>${state.bulkAction === 'lights' ? '范围：三楼全部照明，包含办公室、会议室及走廊照明。' : state.bulkAction === 'room-lights' ? '范围：三楼全部房间照明，包含办公室、会议室，不含走廊照明。' : '范围：三楼空调设备。'}</p><p>确认执行该批量控制操作？</p><div><button data-bulk-cancel>取消</button><button data-bulk-confirm>确认</button></div></section>` : ''}`;
  }
  function solar() {
    const unit = state.solar && units[state.solar];
    return `${img('campus-clean.png', 'solar-campus-image', '园区模型，含 B 楼、A 楼与光伏幕墙')}<div class="solar-wash"></div>
      ${heading('PHOTOVOLTAIC & STORAGE', unit ? unit.name : '光储系统', '')}
      ${unit ? '<button class="scene-back" data-solar-back>返回光储总览</button>' : ''}
      ${unit ? '' : `<div class="solar-hotspots" aria-label="光伏位置详情入口">${['b', 'a', 'curtain'].map(key => `<button class="solar-marker marker-${key}" data-solar="${key}" aria-label="查看${units[key].name}详情"><span>${key === 'curtain' ? 'A楼幕墙' : key.toUpperCase() + '楼光伏'} ›</span><span class="solar-marker-reading"><span>今日发电量</span><strong>${units[key].today}<small> kWh</small></strong></span><span class="solar-marker-reading"><span>实时发电功率</span><strong>${units[key].power ?? '—'}<small> kW</small></strong></span></button>`).join('')}</div>`}
      ${unit ? solarGenerationSummary(unit) : solarDashboard()}
      ${state.solarChartExpanded ? `<div class="solar-chart-backdrop" data-solar-chart-close></div><section class="solar-chart-dialog" role="dialog" aria-modal="true" aria-label="${state.solarChartExpanded === 'power' ? '实时发电功率' : '发电量小时统计'}"><div class="solar-chart-heading"><h2><span>▣</span>${state.solarChartExpanded === 'power' ? '实时发电功率' : '发电量小时统计分析'}</h2><button data-solar-chart-close aria-label="关闭图表">×</button></div>${state.solarChartExpanded === 'power' ? powerChart() + powerLegend() : hourlyChart() + hourlyLegend()}</section>` : ''}
      ${note()}`;
  }
  function building() {
    const available = state.room === '301办公室';
    if (state.room === '三楼整体') return `${img('floor3-overall-reference.png', 'floor3-overall-image', 'A楼三楼整体视角')}${buildingOverallRoomCards()}${heading('BUILDING CONTROL', '楼宇控制', '')}${selectors()}<button class="building-section-entry" data-floor-select="3">查看三楼剖面 ›</button>`;
    return `${available ? img('office-clean.png', 'office-image', '301办公室') : `<div class="unavailable-model"><b>${state.room}</b><span>已进入 A 楼${state.buildingFloor === 2 ? '二' : '三'}层该空间；专属模型视角与控制数据待接入</span><button data-back-floor>返回楼层剖面</button></div>`}<div class="office-wash"></div>
      ${selectors(true, true)}${available ? `${airQuality()}${buildingControls()}` : ''}`;
  }
  function energy() {
    const available = state.room === '301办公室';
    const overall = state.room.endsWith('楼整体');
    return `${overall ? img('floor3-overall-reference.png', 'floor3-overall-image', '楼宇整体视角') : available ? img('office-clean.png', 'office-image', '301办公室') : `<div class="unavailable-model"><b>${state.room}</b><span>专属模型视角待接入</span></div>`}<div class="office-wash"></div>${overall ? buildingOverallRoomCards() : ''}${heading('ENERGY METERING', '能耗计量', '')}${selectors()}${energyMonitor()}`;
  }
  function safety() {
    return `${img('safety-stairwell-clean.png', 'safety-image', '北走廊楼梯下方配电房')}<div class="scene-shade safety-shade"></div>
      ${heading('ELECTRICAL SAFETY', '用电安全', '北走廊 · 楼梯下方配电房固定视角')}
      <aside class="data-panel safety-panel" aria-label="用电安全实时状态"><h2><span class="safety-title-icon">▣</span>用电安全实时状态</h2><div class="safety-panel-body"><div class="safety-monitor-grid"><button data-safety-detail="cable" aria-label="查看线缆温度监测详情"><span>线缆温度监测</span><strong>76个</strong><em>全部正常</em><small>查看详情 ›</small></button><button data-safety-detail="leakage" aria-label="查看漏电监测详情"><span>漏电监测</span><strong>76个</strong><small>查看详情 ›</small></button></div><h3><span>☷</span>配电房状态</h3><div class="safety-status-grid"><div><span>环境温度</span><strong>22.4<small>℃</small></strong></div><div><span>环境湿度</span><strong>57<small>%</small></strong></div><div><span>烟雾</span><strong>0<small> /</small></strong></div><div><span>水浸</span><strong>0<small> /</small></strong></div></div></div></aside>
      ${state.safetyDetail ? `<div class="safety-detail-backdrop" data-safety-close></div><section class="safety-detail" role="dialog" aria-modal="true" aria-labelledby="safetyDetailTitle"><header><div><small>用电安全 · 监测详情</small><h2 id="safetyDetailTitle">${state.safetyDetail === 'cable' ? '线缆温度监测' : '漏电监测'}</h2></div><button data-safety-close aria-label="关闭详情">×</button></header><div class="safety-detail-summary"><div><span>监测点数</span><strong>76 个</strong></div><div><span>当前状态</span><strong class="${state.safetyDetail === 'cable' ? 'normal' : ''}">${state.safetyDetail === 'cable' ? '全部正常' : '状态待接入'}</strong></div></div><div class="monitor-table-wrap"><table class="monitor-table"><thead><tr><th>监测点</th><th>位置</th><th>${state.safetyDetail === 'cable' ? '线缆温度（℃）' : '漏电电流（mA）'}</th><th>状态</th><th>更新时间</th><th>告警详情</th></tr></thead><tbody><tr><td colspan="6">监测明细待接入</td></tr></tbody></table></div></section>` : ''}`;
  }
  function security() {
    return `<div class="future-scene">${heading('CAMPUS SECURITY', '园区安防', '')}<div><b>安防数据待接入</b></div></div>`;
  }
  const views = { overview, solar, building, energy, safety, security };
  function render(view = state.view) {
    state.view = view;
    scene.dataset.scene = view;
    scene.dataset.unit = view === 'solar' && state.solar ? state.solar : '';
    scene.dataset.floor = view === 'overview' && state.overviewFloor ? state.overviewFloor : '';
    scene.setAttribute('aria-label', names[view]);
    scene.innerHTML = views[view]();
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) headerActions.innerHTML = view === 'overview' ? weatherPanel() : '';
    if (state.safetyDetail && view === 'safety') scene.querySelector('.safety-detail-summary').insertAdjacentHTML('afterend', safetyFilterControls());
    const model = scene.querySelector('.overview-model-img');
    model?.addEventListener('load', updateBuildingConnectors, { once: true });
    requestAnimationFrame(() => { updateBuildingConnectors(); updateCalloutLines(); });
    if (!canControl) scene.querySelectorAll('[data-bulk-action]').forEach(button => { button.disabled = true; button.title = '无控制权限'; });
    document.querySelectorAll('.ops-header nav [data-view]').forEach(button => {
      button.classList.toggle('active', button.dataset.view === view);
      button.setAttribute('aria-pressed', String(button.dataset.view === view));
    });
  }
  document.addEventListener('click', event => {
    const control = event.target.closest('[data-panel-toggle], [data-ac-toggle], [data-ac-mode], [data-light-all], [data-light-index], [data-bulk-action], [data-bulk-confirm]');
    if (control && !canControl) return;
    const panel = event.target.closest('[data-panel-toggle]');
    if (panel) { panels[panel.dataset.panelToggle] = !panels[panel.dataset.panelToggle]; render(); return; }
    const nav = event.target.closest('[data-view]');
    if (nav) { panels.ac = panels.lights = false; state.solar = null; state.safetyDetail = null; state.solarChartExpanded = false; state.bulkAction = null; if (nav.dataset.view === 'overview') state.overviewFloor = null; if (['building','energy'].includes(nav.dataset.view)) { state.buildingFloor = 3; state.room = '三楼整体'; } render(nav.dataset.view); return; }
    const bulk = event.target.closest('[data-bulk-action]');
    if (bulk) { state.bulkAction = bulk.dataset.bulkAction; render('overview'); scene.querySelector('[data-bulk-confirm]')?.focus(); return; }
    if (event.target.closest('[data-bulk-cancel]')) { state.bulkAction = null; render('overview'); return; }
    if (event.target.closest('[data-bulk-confirm]')) { if (['lights', 'room-lights'].includes(state.bulkAction)) state.lights = state.lights.map(() => false); else state.acOn = false; state.bulkFeedback = '设备状态已更新'; state.bulkAction = null; render('overview'); return; }
    const overviewUnit = event.target.closest('[data-overview-unit]');
    if (overviewUnit) { state.solar = overviewUnit.dataset.overviewUnit; render('solar'); return; }
    const floorSelect = event.target.closest('[data-floor-select]');
    if (floorSelect) { state.overviewFloor = 3; state.buildingFloor = 3; state.room = roomsByFloor[3][0]; render('overview'); return; }
    if (event.target.closest('[data-floor-back]')) { state.overviewFloor = null; render('overview'); return; }
    if (event.target.closest('[data-back-floor]')) { state.overviewFloor = 3; state.buildingFloor = 3; render('overview'); return; }
    const enterRoom = event.target.closest('[data-enter-room]');
    if (enterRoom) { state.buildingFloor = Number(enterRoom.dataset.enterFloor); state.room = enterRoom.dataset.enterRoom; panels.ac = panels.lights = false; render(state.view === 'energy' ? 'energy' : 'building'); return; }
    const chartOpen = event.target.closest('[data-solar-chart-open]');
    if (chartOpen) { state.solarChartExpanded = chartOpen.dataset.solarChartOpen || 'generation'; render('solar'); document.querySelector('.solar-chart-dialog [data-solar-chart-close]')?.focus(); return; }
    if (event.target.closest('[data-solar-chart-close]')) { state.solarChartExpanded = false; render('solar'); return; }
    const unit = event.target.closest('[data-solar]');
    if (unit) { state.solar = unit.dataset.solar; state.solarChartExpanded = false; render('solar'); return; }
    if (event.target.closest('[data-solar-back]')) { state.solar = null; render('solar'); return; }
    if (event.target.closest('[data-ac-toggle]')) { state.acOn = !state.acOn; render(); return; }
    const mode = event.target.closest('[data-ac-mode]');
    if (mode) { state.acMode = mode.dataset.acMode; render(); return; }
    if (event.target.closest('[data-light-all]')) { const next = !state.lights.every(Boolean); state.lights = state.lights.map(() => next); render(); return; }
    const light = event.target.closest('[data-light-index]');
    if (light) { const index = Number(light.dataset.lightIndex); state.lights[index] = !state.lights[index]; render(); return; }
    const period = event.target.closest('[data-period]');
    if (period) { state.period = period.dataset.period; render(); return; }
    const safetyDetail = event.target.closest('[data-safety-detail]');
    if (safetyDetail) { state.safetyDetail = safetyDetail.dataset.safetyDetail; render('safety'); document.querySelector('.safety-detail [data-safety-close]')?.focus(); return; }
    if (event.target.closest('[data-safety-close]')) { state.safetyDetail = null; render('safety'); }
  });
  document.addEventListener('keydown', event => { if (event.key !== 'Escape') return; if (state.bulkAction) { state.bulkAction = null; render('overview'); } else if (state.safetyDetail) { state.safetyDetail = null; render('safety'); } else if (state.solarChartExpanded) { state.solarChartExpanded = false; render('solar'); } });
  scene.addEventListener('change', event => {
    if (event.target.id === 'roomSelect') { panels.ac = panels.lights = false; state.room = event.target.value; state.buildingFloor = state.room === '四楼整体' || /^4/.test(state.room) ? 4 : 3; render(); }
    if (event.target.id === 'safetyStatusFilter' || event.target.id === 'safetyRangeFilter') { const id = event.target.id; safetyFilters[id === 'safetyStatusFilter' ? 'status' : 'range'] = event.target.value; render('safety'); scene.querySelector(`#${id}`)?.focus(); }
  });

  function updateCalloutLines() {
    scene.querySelectorAll('.callout-lines').forEach(el => el.remove());
    for (const selector of ['.building-overall-room-layer', '.floor-marker-layer', '.solar-hotspots']) {
      const layer = scene.querySelector(selector);
      if (!layer || matchMedia('(max-width:850px)').matches) continue;
      const bounds = layer.getBoundingClientRect();
      if (!bounds.width || !bounds.height) continue;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'callout-lines');
      svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
      const cards = layer.querySelectorAll('button');
      svg.innerHTML = [...cards].map(card => {
        const box = card.getBoundingClientRect();
        const x = box.left - bounds.left + box.width / 2;
        const y = box.bottom - bounds.top;
        let ex = x - 22, ey = y + 26;
        if (selector === '.solar-hotspots') {
          const model = scene.querySelector('.solar-campus-image');
          const rect = model.getBoundingClientRect();
          const scale = Math.min(rect.width / model.naturalWidth, rect.height / model.naturalHeight);
          const width = model.naturalWidth * scale, height = model.naturalHeight * scale;
          const anchor = {b:[.59,.32],a:[.79,.51],curtain:[.743,.635]}[card.dataset.solar];
          ex = rect.left - bounds.left + (rect.width-width)/2 + width*anchor[0];
          ey = rect.top - bounds.top + (rect.height-height)/2 + height*anchor[1];
        }
        return `<path d="M ${x} ${y} L ${x} ${y+12} L ${ex} ${ey}"/><circle cx="${ex}" cy="${ey}" r="4"/>`;
      }).join('');
      layer.prepend(svg);
    }
  }
  new ResizeObserver(() => requestAnimationFrame(updateCalloutLines)).observe(scene);
  window.addEventListener('resize', updateCalloutLines);
  render();
})();

(() => {
  const scene = document.getElementById('scene');
  const params = new URLSearchParams(location.search);
  const requestedView = params.get('view');
  const state = { view: ['overview', 'solar', 'building', 'energy', 'safety', 'security'].includes(requestedView) ? requestedView : 'overview', solar: ['a', 'b', 'curtain'].includes(params.get('unit')) ? params.get('unit') : null, room: '301办公室', period: '今日', acOn: false, acMode: '制冷', lightOn: false };
  const names = { overview: '园区总览', solar: '光储系统', building: '楼宇控制', energy: '能耗计量', safety: '用电安全', security: '园区安防' };
  const units = {
    a: { name: 'A楼屋顶光伏', today: '4.7', location: 'A楼屋顶' },
    b: { name: 'B楼屋顶光伏', today: '18.5', location: 'B楼屋顶' },
    curtain: { name: '光伏幕墙', today: '0', location: '建筑立面' }
  };
  const rooms = ['301办公室', '303办公室', '304办公室', '305办公室', '306办公室', '311会议室'];
  const img = (file, cls, alt) => `<img class="scene-image ${cls}" src="operations-assets/${file}" alt="${alt}">`;
  const heading = (en, title, desc) => `<div class="scene-heading"><span>${en}</span><h1>${title}</h1><p>${desc}</p></div>`;
  const note = text => `<p class="scene-note">${text || '数据为原型演示，实际数值以正式平台接口为准'}</p>`;
  const metric = (label, value, featured = false) => `<div class="side-metric ${featured ? 'featured' : ''}"><span>${label}</span><strong>${value}</strong></div>`;
  const selectors = () => `<div class="location-controls" aria-label="空间筛选"><label>楼宇 <select aria-label="选择楼宇"><option>A楼</option></select></label><label>楼层 <select aria-label="选择楼层"><option>三层</option></select></label><label>空间 <select id="roomSelect" aria-label="选择空间">${rooms.map(room => `<option ${room === state.room ? 'selected' : ''}>${room}</option>`).join('')}</select></label><span>预设视角</span></div>`;

  function overview() {
    return `${img('campus-clean.png', 'campus-image', '园区 BIM 模型参考视角')}<div class="scene-shade"></div>
      ${heading('CAMPUS OVERVIEW', '园区总览', '按业务模块进入预设视角')}
      <div class="overview-hints"><button data-view="solar"><b>光储系统</b><span>今日发电量 23.2 kWh</span></button><button data-view="building"><b>楼宇控制</b><span>进入 A 楼三层空间</span></button></div>
      <aside class="data-panel summary-panel"><h2>运行概况</h2>${metric('光伏今日发电量', '23.2 <small>kWh</small>')}${metric('储能电池电量', '98 <small>%</small>')}${metric('301办公室温度', '25.03 <small>℃</small>')}<button class="panel-link" data-view="safety">查看用电安全状态</button></aside>
      ${note()}`;
  }
  function solar() {
    const unit = state.solar && units[state.solar];
    return `${img('campus-clean.png', 'solar-campus-image', '园区 B 楼、A 楼和光伏幕墙 BIM 参考视角')}<div class="solar-wash"></div>
      ${heading('PHOTOVOLTAIC & STORAGE', unit ? unit.name : '光储系统', unit ? '设备详情 · 固定视角' : 'B楼、A楼与光伏幕墙发电位置')}
      ${unit ? '<button class="scene-back" data-solar-back>返回光储总览</button>' : ''}
      <div class="solar-hotspots ${unit ? 'detail-open' : ''}" aria-label="模型位置数据">${['b', 'a', 'curtain'].map(key => { const item = units[key]; const label = key === 'curtain' ? '幕墙发电' : key.toUpperCase() + '楼发电'; return `<button class="solar-marker marker-${key} ${state.solar === key ? 'selected' : ''}" data-solar="${key}" aria-label="查看${item.name}详情"><span>${label}</span><strong>今日累计 ${item.today} kWh</strong></button>`; }).join('')}</div>
      <aside class="data-panel solar-left"><h2>储能系统</h2>${metric('电池电量', '98%')}${metric('电池温度', '29 ℃')}${metric('健康度', '100%')}<div class="weather-slot"><span>园区天气</span><b>待接入</b><small>预留气象站或天气接口配置</small></div></aside>
      <aside class="data-panel solar-right ${unit ? 'solar-detail-panel' : 'solar-overview-panel'}">${unit ? `<h2>${unit.name} · 设备详情</h2>${metric('今日累计发电量', unit.today + ' <small>kWh</small>', true)}${metric('实时发电功率', '暂无数据')}${metric('位置', unit.location)}<p class="data-hint">点击返回，可查看各楼栋的单项概览数据。</p>` : `<h2>光伏发电总览</h2>${metric('今日累计发电量', '23.2 <small>kWh</small>', true)}<p class="data-hint">点击模型位置旁的数值，查看对应设备详情。</p>`}</aside>
      ${note('发电数据取自既有原型截图；实时功率与天气未接入')}`;
  }
  function building() {
    const available = state.room === '301办公室';
    return `${available ? img('office-clean.png', 'office-image', '301办公室 BIM 场景参考视角') : '<div class="unavailable-model"><b>该空间暂无预设模型视角</b><span>请选择 301办公室查看现有场景</span></div>'}<div class="office-wash"></div>
      ${heading('BUILDING CONTROL', '楼宇控制', `${state.room} · A楼三层预设视角`)}${selectors()}
      <aside class="data-panel control-panel"><h2>空间设备</h2>${available ? `<div class="device-row"><div><b>分体空调</b><small>${state.acOn ? '运行中 · ' + state.acMode : '已关闭'}</small></div><button data-ac-toggle aria-pressed="${state.acOn}">${state.acOn ? '关闭' : '开启'}</button></div><div class="ac-modes" ${state.acOn ? '' : 'hidden'}><span>运行模式</span><button data-ac-mode="制冷" aria-pressed="${state.acMode === '制冷'}">制冷</button><button data-ac-mode="制热" aria-pressed="${state.acMode === '制热'}">制热</button></div><div class="device-row"><div><b>照明</b><small>${state.lightOn ? '已开启' : '已关闭'}</small></div><button data-light-toggle aria-pressed="${state.lightOn}">${state.lightOn ? '关闭' : '开启'}</button></div><p class="data-hint">按钮仅演示控制流程，未向真实设备下发指令。</p>` : '<p class="empty-info">该空间尚未配置模型视角和控制数据。</p>'}</aside>
      ${available ? `<aside class="data-panel air-panel-new"><h2>空间环境</h2>${metric('温度', '25.03 ℃')}${metric('湿度', '64.2 %')}${metric('PM2.5', '33.85 μg/m³')}</aside>` : ''}${note()}`;
  }
  function energy() {
    const available = state.room === '301办公室';
    return `${available ? img('office-clean.png', 'office-image', '301办公室 BIM 场景参考视角') : '<div class="unavailable-model"><b>该空间暂无预设模型视角</b><span>请选择 301办公室查看现有场景</span></div>'}<div class="office-wash"></div>
      ${heading('ENERGY METERING', '能耗计量', 'A楼三层 · ' + state.room)}${selectors()}
      <aside class="data-panel control-panel energy-new"><h2>空间能耗</h2><div class="period-tabs">${['今日', '本周', '本月'].map(p => `<button data-period="${p}" aria-pressed="${state.period === p}">${p}</button>`).join('')}</div>${metric(state.period + '空调能耗', '暂无数据', true)}${metric(state.period + '插座与照明能耗', '暂无数据')}<div class="empty-chart"><b>暂无能耗趋势数据</b><span>接口返回有效采样后再绘制曲线</span></div></aside>
      ${note('空值和缺测时段不绘制为 0；数据示例以正式平台接口为准')}`;
  }
  function safety() {
    return `${img('safety-stairwell-clean.png', 'safety-image', '北走廊楼梯下方配电房 BIM 参考视角')}<div class="scene-shade safety-shade"></div>
      ${heading('ELECTRICAL SAFETY', '用电安全', '北走廊 · 楼梯下方配电房固定视角')}
      <div class="safety-location"><b>配电房安全监测</b><span>楼梯下方 · 烟感 / 水浸</span></div>
      <aside class="data-panel safety-panel"><h2>配电房安全监测</h2><div class="safety-grid"><div><span>烟感</span><strong>无烟感</strong><small>参考截图状态</small></div><div><span>水浸</span><strong>无水浸</strong><small>参考截图状态</small></div><div><span>环境温度</span><strong>暂无数据</strong></div><div><span>环境湿度</span><strong>暂无数据</strong></div></div>${metric('线缆温度监测', '76 个监测点')}${metric('漏电监测', '76 个监测点')}<p class="data-hint">正式模型仍需将配电房点位绑定到该视角。</p></aside>
      ${note('视角依据客户截图还原；状态为截图示例，不代表当前实时告警')}`;
  }
  function security() {
    return `<div class="future-scene">${heading('FUTURE MODULE', '园区安防', '模块入口预留')}<div><b>当前未接入安防数据</b><p>待摄像头、门禁或告警接口接入后，可配置独立场景与数据面板。</p></div></div>`;
  }
  const views = { overview, solar, building, energy, safety, security };
  function render(view = state.view) {
    state.view = view;
    scene.dataset.scene = view;
    scene.dataset.unit = view === 'solar' && state.solar ? state.solar : '';
    scene.setAttribute('aria-label', names[view]);
    scene.innerHTML = views[view]();
    document.querySelectorAll('.ops-header nav [data-view]').forEach(button => {
      button.classList.toggle('active', button.dataset.view === view);
      button.setAttribute('aria-pressed', String(button.dataset.view === view));
    });
  }
  document.addEventListener('click', event => {
    const nav = event.target.closest('[data-view]');
    if (nav) { state.solar = null; render(nav.dataset.view); return; }
    const unit = event.target.closest('[data-solar]');
    if (unit) { state.solar = unit.dataset.solar; render('solar'); return; }
    if (event.target.closest('[data-solar-back]')) { state.solar = null; render('solar'); return; }
    if (event.target.closest('[data-ac-toggle]')) { state.acOn = !state.acOn; render(); return; }
    const mode = event.target.closest('[data-ac-mode]');
    if (mode) { state.acMode = mode.dataset.acMode; render(); return; }
    if (event.target.closest('[data-light-toggle]')) { state.lightOn = !state.lightOn; render(); return; }
    const period = event.target.closest('[data-period]');
    if (period) { state.period = period.dataset.period; render(); }
  });
  scene.addEventListener('change', event => {
    if (event.target.id === 'roomSelect') { state.room = event.target.value; render(); }
  });
  render();
})();

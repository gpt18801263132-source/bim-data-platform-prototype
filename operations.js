(() => {
  const scene = document.getElementById('scene');
  let current = 'overview';
  let returnFocus = null;
  const controls = (building) => `<div class="scene-controls"><select aria-label="选择房间"><option>301办公室</option></select>${building ? '<button data-toggle aria-pressed="false">♧ 空调开关</button><button data-toggle aria-pressed="false">☼ 灯光开关</button>' : ''}</div>`;
  const air = () => `<section class="panel air-panel" aria-label="空气质量"><h2><i>⚑</i>空气质量</h2><div class="air-readings">${[['温度','25.03','℃','舒适范围: 22–26℃'],['湿度','64.2','%','舒适范围: 40–60%'],['光照强度','8','lx','舒适范围: 300–600lx'],['PM2.5','33.85','μg/m³','标准值: <35 μg/m³'],['CO2浓度','—','ppm','标准值: <450 ppm'],['TVOC','—','mg/m³','标准值: <0.6 mg/m³']].map(([label,value,unit,desc])=>`<div class="air-reading"><div><label>${label}</label><b>${value}<small>${unit}</small></b></div><p>${desc.replaceAll('<','&lt;')}</p></div>`).join('')}</div></section>`;
  const energy = () => `<section class="panel energy-panel" aria-label="能耗监控"><h2><i>◷</i>能耗监控</h2><div class="energy-body"><div class="period-tabs" aria-label="统计周期">${['今日','本周','本月'].map((x,i)=>`<button data-period="${x}" class="${i===0?'active':''}" aria-pressed="${i===0}">${x}</button>`).join('')}</div><div class="energy-total"><div><span data-energy-label>当日空调能耗</span><b>0.00<small>kWh</small></b></div><div><span data-energy-label>当日插座+灯能耗</span><b>0.00<small>kWh</small></b></div></div><h3>♧ 分体空调能耗</h3><div class="energy-device"><span>301空调</span><b>0.00<small>kWh</small></b></div><h3>⚑ 能耗趋势 (kWh)</h3><div class="energy-chart" aria-label="能耗趋势暂无数据"><div class="chart-legend"><span>●</span> 空调能耗　<span>●</span> 插座+灯能耗</div><div class="chart-axis"></div></div></div></section>`;

  const overviewPanels = () => `<svg class="overview-connectors" aria-hidden="true"><g class="connector-energy"><path class="connector-glow"/><path class="connector-flow"/><circle r="4"/></g><g class="connector-environment"><path class="connector-glow"/><path class="connector-flow"/><circle r="4"/></g></svg><aside class="overview-panels" aria-label="园区数据总览">
    <section class="overview-card" aria-labelledby="overviewEnergyTitle">
      <div class="overview-card-head"><h2 id="overviewEnergyTitle"><i>ϟ</i>能源运行总览</h2><span>光伏 · 储能 · 用能</span></div>
      <div class="overview-card-body">
        <div class="overview-kpis"><button data-view="solar" class="overview-kpi"><span>今日光伏发电</span><b>23.2<small>kWh</small></b><em>A楼 4.7 / B楼 18.5 / 幕墙 0</em></button><button data-view="solar" class="overview-kpi"><span>储能电池电量</span><b>98<small>%</small></b><em class="overview-good">● 正在充电</em></button></div>
        <div class="overview-storage"><span>电池健康度 <b>100%</b></span><span>电池温度 <b>29℃</b></span></div>
        <div class="overview-line"><span>累计光伏发电</span><b>191,083.52 <small>kWh</small></b></div>
      </div>
    </section>
    <section class="overview-card" aria-labelledby="overviewEnvironmentTitle">
      <div class="overview-card-head"><h2 id="overviewEnvironmentTitle"><i>◈</i>环境与安全总览</h2><span>空间环境 · 安全监测</span></div>
      <div class="overview-card-body">
        <div class="overview-environment-entry"><button class="overview-building-link" data-view="building" aria-label="查看楼宇详情" title="查看楼宇详情"></button>
        <div class="overview-section-label"><span>空间环境</span><select aria-label="总览监测空间" id="overviewRoom">
          <optgroup label="办公空间"><option>301办公室</option><option>303办公室</option><option>304办公室</option><option>305办公室</option><option>306办公室</option></optgroup>
          <optgroup label="会议空间"><option>311会议室</option></optgroup>
          <optgroup label="公共空间"><option>北走廊</option><option>南走廊</option><option>西走廊</option><option>电梯走廊</option><option>茶水间</option><option>男卫生间</option><option>女卫生间</option></optgroup>
        </select></div>
        <div class="overview-environment"><div><span>温度</span><b data-overview-reading>25.03<small>℃</small></b></div><div><span>湿度</span><b data-overview-reading>64.2<small>%</small></b></div><div><span>PM2.5</span><b data-overview-reading>33.85<small>μg/m³</small></b></div></div>
        <div class="overview-room-note" id="overviewRoomNote">当前空间读数 · 湿度高于舒适范围</div></div>
        <button class="overview-line overview-safety-row" data-safety><span>线缆温度监测 <small>76个</small></span><b class="overview-good">全部正常 <small>›</small></b></button>
        <button class="overview-line overview-safety-row" data-safety><span>漏电监测</span><b>76 <small>个监测点 ›</small></b></button>
      </div>
    </section>
    <p class="overview-data-note">数据示例 · 以现有监测截图为展示依据</p>
  </aside>`;
  function updateConnectors() {
    if(current!=='overview')return;
    const svg=scene.querySelector('.overview-connectors');
    if(!svg)return;
    const bounds=scene.getBoundingClientRect();
    svg.setAttribute('viewBox','0 0 '+bounds.width+' '+bounds.height);
    const cards=scene.querySelectorAll('.overview-card');
    const points=[{x:bounds.width*.59,y:bounds.height*.425},{x:bounds.width*.54,y:bounds.height*.655}];
    cards.forEach((card,index)=>{
      const rect=card.getBoundingClientRect();
      const start=index===0?{x:rect.left-bounds.left+rect.width*.5,y:rect.bottom-bounds.top}:{x:rect.right-bounds.left,y:rect.top-bounds.top+rect.height*.48};
      const end=points[index];
      const mid=index===0?{x:start.x,y:(start.y+end.y)/2}:{x:(start.x+end.x)/2,y:start.y};
      const group=svg.children[index];
      group.querySelectorAll('path').forEach(path=>path.setAttribute('d','M '+start.x+' '+start.y+' L '+mid.x+' '+mid.y+' L '+end.x+' '+end.y));
      const dot=group.querySelector('circle');dot.setAttribute('cx',end.x);dot.setAttribute('cy',end.y);
    });
  }
  new ResizeObserver(()=>requestAnimationFrame(updateConnectors)).observe(scene);
  function render(view) {
    current = view;
    scene.dataset.scene = view;
    scene.setAttribute('aria-label', {overview:'园区总览',solar:'光储系统',building:'楼宇系统',energy:'能耗计量'}[view]);
    document.querySelectorAll('nav [data-view]').forEach(b => {b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-pressed',String(b.dataset.view===view));});
    if(view==='overview') scene.innerHTML='<img class="scene-image campus-image" src="operations-assets/campus-reference.jpg" alt="合肥设计院园区 BIM 模型">';
    else if(view==='solar') scene.innerHTML='<img class="scene-image solar-image" src="operations-assets/solar-reference.png" alt="屋顶光伏模型，储能系统实时状态、A楼与B楼今日发电量、发电情况总览及小时统计分析"><div class="scene-controls solar-controls"><select aria-label="光储设备"><option>光伏板</option></select></div>';
    else scene.innerHTML='<img class="scene-image office-image" src="operations-assets/office-clean.png" alt="301办公室 BIM 场景">'+controls(view==='building')+(view==='building'?air():energy());
    if(view==='overview') scene.insertAdjacentHTML('beforeend',overviewPanels());
    requestAnimationFrame(updateConnectors);
    scene.insertAdjacentHTML('beforeend','<span class="view-caption">合肥设计院 · BIM 智慧运维</span>');
  }
  function openDialog(id,trigger){ returnFocus=trigger;document.getElementById(id).showModal(); }
  document.addEventListener('click', e => {
    const view=e.target.closest('[data-view]');if(view)render(view.dataset.view);
    const safe=e.target.closest('[data-safety]');if(safe)openDialog('safetyDialog',safe);
    const security=e.target.closest('[data-security]');if(security)openDialog('securityDialog',security);
    const close=e.target.closest('[data-close]');if(close)close.closest('dialog').close();
    const toggle=e.target.closest('[data-toggle]');if(toggle){const on=toggle.getAttribute('aria-pressed')!=='true';toggle.setAttribute('aria-pressed',String(on));toggle.title=on?'已开启':'已关闭';}
    const period=e.target.closest('[data-period]');if(period){document.querySelectorAll('[data-period]').forEach(b=>{b.classList.toggle('active',b===period);b.setAttribute('aria-pressed',String(b===period));});const prefix={今日:'当日',本周:'本周',本月:'本月'}[period.dataset.period];document.querySelectorAll('[data-energy-label]').forEach((label,i)=>label.textContent=prefix+(i===0?'空调能耗':'插座+灯能耗'));}
  });
  scene.addEventListener('change',e=>{
    if(e.target.id==='overviewRoom'){
      const known=e.target.value==='301办公室';
      const values=known?['25.03','64.2','33.85']:['—','—','—'];
      document.querySelectorAll('[data-overview-reading]').forEach((node,i)=>node.innerHTML=values[i]+'<small>'+['℃','%','μg/m³'][i]+'</small>');
      document.getElementById('overviewRoomNote').textContent=known?'当前空间读数 · 湿度高于舒适范围':'该空间暂无监测数据';
    }
});
  document.querySelectorAll('dialog').forEach(dialog=>{dialog.addEventListener('close',()=>returnFocus?.focus());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});});
  render('overview');
})();

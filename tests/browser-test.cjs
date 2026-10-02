// Local build test; requires Playwright. Never changes bank data.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||undefined,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.setDefaultTimeout(20000);
  const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:8765');
  assert(!requests.some(u=>u.includes('/data/')),'Home eagerly loads database');
  await page.route('**/data/indice.json',async route=>{await new Promise(r=>setTimeout(r,500));await route.continue()});
  await page.locator('[data-view=programas]').first().click();
  await page.locator('#search').fill('Cistos de Balantidium');
  await page.waitForFunction(()=>document.querySelectorAll('#list button').length===1);
  assert.equal(await page.locator('#areaCards button').count(),43);
  assert(!requests.some(u=>u.includes('/parte-')),'Catalog eagerly loads sequences');
  await page.locator('#list button').click();
  await page.waitForFunction(()=>document.querySelectorAll('#packages .item').length===2);
  for(const [i,steps] of [[0,6],[1,2]]){
   await page.locator('#packages .item').nth(i).click();
   await page.waitForFunction(()=>!document.querySelector('#player').hidden);
   await page.locator('#play').click();
   await page.waitForFunction(n=>document.querySelector('#playStatus').textContent.includes('Reproduzindo')&&document.querySelector('#playStatus').textContent.includes('Etapa 1 de '+n),steps);
   await page.locator('#pause').click();assert.match(await page.locator('#playStatus').innerText(),/Pausado/);
   await page.locator('#play').click();await page.waitForFunction(()=>document.querySelector('#playStatus').textContent.includes('Reproduzindo'));
   await page.locator('#stop').click();
  }
  await page.evaluate(()=>{const input=document.querySelector('#search');input.value='tireoide';input.dispatchEvent(new Event('input'));document.querySelector('#backAreas').click()});
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#areaCards').evaluate(e=>e.hidden),false);
  assert.equal(await page.locator('#list button').count(),0);
  await page.selectOption('#area','indice');
  for(const [id,label] of [['51210','Requer Box'],['70582','Requer Box'],['87768','mistos / parciais'],['82693','Requer Box']]){
   const previous=await page.locator('#list').textContent();
   await page.locator('#search').fill(id);await page.waitForFunction(({label,previous})=>{const text=document.querySelector('#list').textContent;return text!==previous&&text.includes(label)},{label,previous});
   await page.locator('#list button').first().click();
   await page.waitForFunction(()=>document.querySelector('#packages .item'));
   await page.locator('#packages .item').first().click();
   await page.waitForFunction(()=>!document.querySelector('#player').hidden);
   if(id==='51210'){assert.match(await page.locator('#sequence').innerText(),/requer Box/i);assert(await page.locator('#play').isDisabled());}
   if(id==='87768'){assert.match(await page.locator('#sequence').innerText(),/Áudio disponível/);assert.match(await page.locator('#sequence').innerText(),/requer Box/i);assert(!await page.locator('#play').isDisabled());}
  }
  await page.locator('#search').fill('69270');
  await page.waitForFunction(()=>document.querySelector('#list').textContent.includes('Seios acessórios do nariz'));
  await page.locator('#list button').first().click();
  await page.waitForFunction(()=>document.querySelector('#packages .item'));
  await page.locator('#packages .item').first().click();
  await page.locator('#play').click();
  await page.waitForFunction(()=>document.querySelector('#playStatus').textContent.includes('Reproduzindo'));
  assert.match(await page.locator('#playStatus').innerText(),/Etapa 3 de 4/);
  assert.match(await page.locator('#playStatus').innerText(),/parcial/);
  assert.match(await page.locator('#playStatus').innerText(),/inativas: 1, 2/);
  assert.equal(await page.locator('#executionPreset').count(),0);
  assert.equal(await page.locator('#skipStep').count(),0);
  await page.locator('#stop').click();
  await page.locator('[data-view=livre]').first().click();
  for(const hz of ['9.6','20001','25000']){
   await page.locator('#freeHz').fill(hz);await page.locator('#prepareFree').click();
   assert.match(await page.locator('#message').innerText(),/Requer Box/);assert(await page.locator('#player').evaluate(e=>e.hidden));
  }
  await page.locator('#freeHz').fill('440');await page.locator('#prepareFree').click();await page.locator('#play').click();
  await page.waitForFunction(()=>document.querySelector('#playStatus').textContent.includes('Reproduzindo'));
  assert.equal(await page.locator('#noise').inputValue(),'0');
  await page.locator('[data-view=home]').first().click();assert.match(await page.locator('#playStatus').innerText(),/Parado/);
  const signal=await page.evaluate(async()=>{
   const {Player,compile}=await import('./engine.mjs');const ctx=new OfflineAudioContext(1,48000,48000);
   const p=new Player(()=>{});p.plan=compile([0,'test','',[],'440=1',0,180,1]);
   p.ctx=ctx;p.started=0;p.gain=ctx.createGain();p.gain.connect(ctx.destination);p.noiseGate=ctx.createGain();p.schedule(0);
   const d=(await ctx.startRendering()).getChannelData(0);let crossings=0,sum=0;
   for(let i=4800;i<43200;i++){sum+=d[i]*d[i];if(d[i-1]<=0&&d[i]>0)crossings++}
   return {hz:crossings/.8,rms:Math.sqrt(sum/38400)};
  });
  assert(Math.abs(signal.hz-440)<2,JSON.stringify(signal));assert(signal.rms>.5);
  await page.setViewportSize({width:390,height:844});assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  await page.locator('[data-view=programas]').first().click();assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  assert.deepEqual(errors,[]);
  console.log('PASS: deferred search, return to areas, lazy load, original sequences, pause/resume, per-stage matrix, pending presets, mixed programs, free frequency, navigation, mobile, 440 Hz signal without noise');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});

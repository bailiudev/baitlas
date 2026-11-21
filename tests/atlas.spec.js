import {test,expect} from '@playwright/test';
const project='/read/lewis_and_clark_expedition/';

test('homepage, independent collections, and About have working navigation',async({page})=>{
 await page.goto('/');
 await expect(page.locator('h1')).toContainText('Go a little');
 await expect(page.locator('.featured-story')).toContainText('Lewis & Clark Expedition');
 await expect(page.locator('#map')).toHaveCount(0);
 for(const collection of ['Read','Hike']) {
  await page.getByRole('link',{name:collection,exact:true}).click();
  await expect(page).toHaveURL(`/${collection.toLowerCase()}/`);
  await expect(page.locator('.article-row')).toHaveCount(1);
  await page.locator('.article-row').click();
  await expect(page.locator('.project-heading h1')).toHaveText('Lewis & Clark Expedition');
  if(collection==='Hike')await expect(page.locator('.mode-notice')).toBeVisible();
 }
 await page.getByRole('link',{name:'About',exact:true}).click();
 await expect(page).toHaveURL('/about/');
 await expect(page.locator('h1')).toContainText('Every story');
 await expect(page.locator('#map')).toHaveCount(0);
 await page.getByRole('link',{name:'Baitlas home',exact:true}).click();
 await expect(page).toHaveURL('/');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('slashless direct URLs reach their directory pages',async({page})=>{
 for(const [route,selector] of [['/read','.article-row'],['/about','.about-page h1'],['/read/lewis_and_clark_expedition','.project-heading h1']]) {
  const response=await page.goto(route);
  expect(response.status()).toBe(200);
  await expect(page).toHaveURL(`${route}/`);
  await expect(page.locator(selector)).toBeVisible();
 }
});

test('independent timeline below map synchronizes cards and layers',async({page})=>{
 const errors=[],failed=[],remote=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
 page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4173'))remote.push(r.url());});
 await page.goto(project);
 await expect(page.locator('.place-marker')).toHaveCount(9);
 await expect(page.locator('.geographic-label')).toHaveCount(4);
 await expect(page.locator('.timeline-event')).toHaveCount(11);
 await expect(page.locator('#place-card')).toBeHidden();
 expect(await page.evaluate(()=>{
  const map=document.querySelector('.atlas'),timeline=document.querySelector('.timeline-panel');
  return map.parentElement===timeline.parentElement&&!map.contains(timeline)&&timeline.getBoundingClientRect().top>map.getBoundingClientRect().bottom;
 })).toBe(true);
 await page.locator('[data-event="great-falls"]').click();
 await expect(page.locator('#place-card h1')).toHaveText('Great Falls');
 await expect(page.locator('[data-event="great-falls"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#event-progress')).toHaveText('Moment 5 of 11');
 await page.getByRole('button',{name:'Next event',exact:true}).click();
 await expect(page.locator('#place-card h1')).toHaveText('Lemhi Pass');
 await page.locator('#view-selected-map').click();
 await expect(page.locator('#map')).toBeInViewport();
 await page.getByRole('button',{name:'Close place card'}).click();
 await expect(page.locator('#place-card')).toBeHidden();
 await page.locator('[data-layer="regions"]').check();
 await page.locator('[data-layer="markers"]').uncheck();
 await expect(page.locator('.place-marker')).toHaveCount(0);
 await page.locator('[data-layer="markers"]').check();
 await expect(page.locator('.place-marker')).toHaveCount(9);
 await page.getByRole('button',{name:'Full expedition'}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);expect(failed).toEqual([]);expect(remote).toEqual([]);
});

test('article section navigation and references stay inside the current project',async({page})=>{
 await page.goto(project);
 await expect(page.locator('.notes-toc a')).toHaveCount(5);
 await page.locator('.notes-toc').getByRole('link',{name:'04 How to read this map'}).click();
 await expect(page).toHaveURL(`${project}#section-4-how-to-read-this-map`);
 await page.reload();
 await expect(page.locator('.project-heading h1')).toHaveText('Lewis & Clark Expedition');
 await expect(page.locator('#section-4-how-to-read-this-map')).toBeInViewport();
 await page.locator('.reference-link').first().click();
 await expect(page).toHaveURL(`${project}#reference-8`);
 await expect(page.locator('#reference-8')).toBeFocused();
 expect(await page.evaluate(()=>document.querySelector('.references').getBoundingClientRect().top>=document.querySelector('.notes-copy').getBoundingClientRect().bottom)).toBe(true);
 await expect(page.locator('.references li')).toHaveCount(10);
 await page.locator('.notes-copy img').scrollIntoViewIfNeeded();
 await expect.poll(()=>page.locator('.notes-copy img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
});

test('direct and legacy event links work; unknown project routes return 404',async({page})=>{
 for(const url of [`${project}#event=leave-clatsop`,'/?page=read&project=lewis_and_clark_expedition#event=leave-clatsop','/#lewis_and_clark_expedition/leave-clatsop']) {
  await page.goto(url);
  await expect(page.locator('.card-event-title')).toHaveText('The return begins');
  await expect(page.locator('#place-card h1')).toHaveText('Fort Clatsop');
  await expect(page).toHaveURL(`${project}#event=leave-clatsop`);
 }
 const missing=await page.goto('/read/missing-project/');
 expect(missing.status()).toBe(404);
 await page.goto('/read/');
 await expect(page.locator('.article-row')).toHaveCount(1);
});

test('map marker and keyboard event activation work',async({page})=>{
 await page.goto(project);
 await page.locator('.place-marker[title="Great Falls"]').click();
 await expect(page.locator('#place-card h1')).toHaveText('Great Falls');
 await page.getByRole('button',{name:'Close place card'}).click();
 await page.locator('[data-event="st-louis"]').press('Enter');
 await expect(page.locator('#place-card h1')).toHaveText('St. Louis');
 await expect.poll(()=>page.locator('[data-event="st-louis"]').evaluate(button=>{
  const r=button.getBoundingClientRect(),v=button.closest('.timeline-scroll').getBoundingClientRect();
  return r.left>=v.left-1&&r.right<=v.right+1;
 })).toBe(true);
 await expect(page.getByRole('button',{name:'Next event',exact:true})).toBeDisabled();
});

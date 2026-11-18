import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests',fullyParallel:true,workers:2,reporter:'list',
 use:{baseURL:'http://127.0.0.1:8000',headless:true},
 webServer:{command:'python3 -m http.server 8000 --bind 127.0.0.1 --directory ..',url:'http://127.0.0.1:8000',reuseExistingServer:!process.env.CI},
 projects:[{name:'desktop',use:{viewport:{width:1440,height:1100}}},{name:'mobile',use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}]
});

import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests',testMatch:'**/*.spec.js',outputDir:'./tests/results',workers:1,reporter:'list',
 use:{baseURL:'http://127.0.0.1:4173',headless:true},
 webServer:{command:'python3 -m http.server 4173 --bind 127.0.0.1 --directory dist',url:'http://127.0.0.1:4173',reuseExistingServer:false},
 projects:[{name:'desktop',use:{viewport:{width:1440,height:1100}}},{name:'mobile',use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}]
});

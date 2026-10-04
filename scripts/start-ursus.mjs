// The normal `npm start` keeps the official data. This launcher is loopback-only by design.
import {buildUrsus} from '../tools/build-ursus.mjs';
import {getData,resetData} from '../server/data.js';
import {setSimData} from '../server/sim/simdata.js';
import {setGameData} from '../server/sim/content/support/index.js';
import {startServer} from '../server/index.js';
const {dir}=await buildUrsus();
await import('../tools/fetch-ursus-assets.mjs');
resetData();const data=getData({dir});setSimData(data);setGameData(data);
const server=await startServer({dataDir:dir,host:'127.0.0.1',port:Number(process.env.URSUS_PORT||3001)});
const url=`http://127.0.0.1:${server.port}/dev/ursus.html`;
console.log(`Local Ursus experiment: ${url}`);
if(process.argv.includes('--open')){const {openBrowser}=await import('./open-browser.mjs');openBrowser(url);}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await server.close();process.exit(0)});

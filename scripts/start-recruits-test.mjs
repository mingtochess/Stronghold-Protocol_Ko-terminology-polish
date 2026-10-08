// Separate recruit integration preview. Uses the prepared data without rebuilding or changing the original workspace.
import {getData,resetData} from '../server/data.js';
import {setSimData} from '../server/sim/simdata.js';
import {setGameData} from '../server/sim/content/support/index.js';
import {startServer} from '../server/index.js';
import {previewHandler} from './ursus-preview-http.mjs';
const dir=new URL('../.cache/ursus-data/',import.meta.url).pathname;
resetData();const data=getData({dir});setSimData(data);setGameData(data);
const port=Number(process.env.RECRUITS_PORT||3004),preview=await previewHandler(process.cwd(),port);
const server=await startServer({dataDir:dir,host:'127.0.0.1',port,handleRequest:preview.handle});
console.log(`Recruit integration preview: http://127.0.0.1:${server.port}/`);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{preview.close();await server.close();process.exit(0)});

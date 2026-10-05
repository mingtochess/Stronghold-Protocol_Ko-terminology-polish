// WebSocket facade selected only by the Ursus preview bootstrap.
export class PreviewSocket {
 constructor(){this.readyState=0;this.ack=0;this.seq=0;this.queue=[];this.errors=0;this.open()}
 async request(body){const res=await fetch('/dev/ursus-transport',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});if(!res.ok)throw Error(`Preview HTTP ${res.status}`);return res.json()}
 async open(){try{const {id}=await this.request({action:'open'});this.id=id;if(this.readyState===3){this.request({action:'close',id}).catch(()=>{});return}this.readyState=1;this.onopen?.({});this.poll()}catch{this.close(1006,'Preview connection failed')}}
 send(data){if(this.readyState!==1)throw Error('Socket not open');this.queue.push({seq:++this.seq,data});if(this.queue.length>512)this.close(1009,'Preview send queue full')}
 async poll(){while(this.readyState===1){try{const reply=await this.request({id:this.id,ack:this.ack,send:this.queue.slice(0,64)});this.errors=0;this.queue=this.queue.filter(m=>m.seq>reply.sent);for(const m of reply.messages){if(m.seq>this.ack){this.ack=m.seq;this.onmessage?.({data:m.data})}}if(reply.closed){this.close(reply.closed.code,reply.closed.reason);return}}catch{if(++this.errors>=3){this.close(1006,'Preview connection lost');return}}await new Promise(r=>setTimeout(r,100))}}
 close(code=1000,reason=''){if(this.readyState===3)return;this.readyState=3;if(this.id)this.request({action:'close',id:this.id}).catch(()=>{});queueMicrotask(()=>this.onclose?.({code,reason}))}
}

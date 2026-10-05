// Load the game only after this browser has a complete resource cache.
async function message(type, onProgress) {
  const channel = new MessageChannel();
  return new Promise((resolve, reject) => {
    channel.port1.onmessage = ({ data }) => {
      if (data.type === 'progress') { onProgress?.(data); return; }
      channel.port1.close();
      if (data.type === 'error') reject(new Error(data.message));
      else resolve(data);
    };
    navigator.serviceWorker.controller.postMessage({ type }, [channel.port2]);
  });
}

async function boot() {
  const preview=await fetch('/dev/ursus-config.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
  if(preview?.httpTransport){
    const [{net},{PreviewSocket}]=await Promise.all([import('./net.js'),import('../dev/ursus-http-socket.js')]);net.WS=PreviewSocket;
    if('serviceWorker' in navigator){const reg=await navigator.serviceWorker.register('/dev/ursus-resource-worker.js',{scope:'/'});if(reg.installing)await new Promise(resolve=>{const worker=reg.installing;worker.addEventListener('statechange',()=>{if(worker.state==='activated'||worker.state==='redundant')resolve();});});await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller||!navigator.serviceWorker.controller.scriptURL.endsWith('/dev/ursus-resource-worker.js'))await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));}
    document.getElementById('resource-fonts').href='/fonts/fonts.css';await import('./main.js');navigator.serviceWorker?.controller?.postMessage({type:'warmPatch'});return;
  }
  const response = await fetch('/vendor/browser-resources.json', { cache: 'no-store' });
  // Existing self-hosted installations without the browser-download index retain their workflow.
  if (response.status === 404) {
    document.getElementById('resource-fonts').href = '/fonts/fonts.css';
    await import('./main.js'); return;
  }
  if (!response.ok) throw new Error('리소스 목록을 불러오지 못했습니다. 새로고침해 주세요.');
  const resources = await response.json();
  if (!('serviceWorker' in navigator) || !('caches' in window)) throw new Error('HTTPS와 브라우저 저장소를 지원하는 최신 브라우저가 필요합니다.');
  await navigator.serviceWorker.register('/resource-worker.js', { type: 'module', scope: '/' });
  await navigator.serviceWorker.ready;
  if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  const cacheStatus=await message('status');
  if (!cacheStatus.ready) {
    const splash = document.getElementById('boot');
    splash.removeAttribute('aria-hidden');
    const panel = splash.querySelector('.boot__inner');
    panel.replaceChildren();
    const title = document.createElement('h1'); title.textContent = '게임 리소스 다운로드';
    const description = document.createElement('p');
    description.textContent = `처음 한 번 약 ${Math.ceil(resources.estimatedBytes / 1048576)}MB의 이미지·모델·소리·폰트를 공개 GitHub 미러에서 내려받습니다. Wi-Fi 사용을 권장합니다. 파일은 이 브라우저에 저장해 다음 접속에 재사용합니다. 브라우저 저장소가 삭제되면 다시 다운로드합니다.`;
    const notice = document.createElement('p');
    notice.textContent = '비공식 팬 게임입니다. 게임 소재의 권리는 Hypergryph·Yostar 등 원 권리자에게 있으며, 개인적인 비상업적 이용만 가능합니다.';
    const sources = document.createElement('a'); sources.href = 'https://github.com/moring-m/Stronghold-Protocol_Ko_Arca/blob/master/docs/ASSETS.md'; sources.target = '_blank'; sources.rel = 'noopener'; sources.textContent = '리소스 출처와 이용 안내';
    const progress = document.createElement('progress'); progress.max = resources.files.length; progress.value = 0;
    const status = document.createElement('p'); status.setAttribute('role', 'status'); status.style.whiteSpace = 'pre-wrap';
    const button = document.createElement('button'); button.textContent = '다운로드 후 시작'; button.type = 'button';
    panel.style.cssText = 'max-width:620px;padding:24px;max-height:85vh;overflow:auto;text-align:left;line-height:1.6';
    button.style.cssText = 'padding:12px 20px;margin-top:12px;cursor:pointer';
    panel.append(title, description, notice, sources, progress, status, button);
    await new Promise(resolve => {
      button.onclick = async () => {
        button.disabled = true;
        try {
          const estimate = await navigator.storage?.estimate();
          if (estimate?.quota && estimate.quota - estimate.usage < resources.estimatedBytes * 1.15) throw new Error('브라우저 저장 공간이 부족합니다. 공간을 확보한 뒤 다시 시도해 주세요.');
          await navigator.storage?.persist?.();
          await message('prepare', ({ done, total }) => { progress.value = done; status.textContent = `${done.toLocaleString()} / ${total.toLocaleString()}개 파일 확인 중`; });
          resolve();
        } catch (error) { status.textContent = error.message; button.textContent = '다운로드 다시 시도'; button.disabled = false; }
      };
    });
  }
  // The initial stylesheet request can precede service-worker control.
  const fonts = document.getElementById('resource-fonts');
  if (fonts) fonts.href = '/fonts/fonts.css?resources=' + resources.version;
  await import('./main.js');
  if(cacheStatus.patch)message('preparePatch').catch(error=>console.warn('Background resource patch:',error.message));
}
boot().catch(error => {
  console.error('[resources]', error);
  const errorElement = document.getElementById('boot-err') || document.querySelector('.boot__inner');
  if (errorElement) errorElement.textContent = error.message;
});

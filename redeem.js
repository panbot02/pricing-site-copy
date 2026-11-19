// 萌萌哒 AI · credentials never leave memory except in requests to the configured service.
const $=id=>document.getElementById(id), stage=$('stage');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brandText=v=>String(v??'').replace(/easysub/ig,'萌萌哒 AI');
const friendly=v=>brandText(typeof v==='string'?v:'这一步暂时没有完成，请稍后再试。');
const PLAN={chatgptplusplan:'ChatGPT Plus',chatgptprolite:'ChatGPT Pro 100',chatgptproliteplan:'ChatGPT Pro 100',chatgptpro:'ChatGPT Pro 200',chatgptproplan:'ChatGPT Pro 200',chatgptpromax:'ChatGPT Pro 500',chatgptgoplan:'ChatGPT Go',chatgpt2pro20x:'ChatGPT Pro 200',claudepro:'Claude Pro',claudemax5x:'Claude Max 5x',claudemax20x:'Claude Max 20x',grok_plus:'Plus',grok_premium:'Premium',grok_super:'Super',grok_ultra:'Ultra',PRODUCT_TIER_SUPER_GROK_LITE:'SuperGrok Lite',PRODUCT_TIER_GROK_PRO:'SuperGrok',PRODUCT_TIER_SUPER_GROK_PLUS:'SuperGrok Plus',PRODUCT_TIER_SUPER_GROK_PRO:'SuperGrok Heavy',free:'免费版',Free:'免费版',plus:'Plus',pro:'Pro'};
const plan=v=>PLAN[v]||brandText(v||'暂未提供');
const PROVIDER={openai:'ChatGPT',claude:'Claude',grok:'Grok'};
const MAX=5*1024*1024, KEY='jmm.redeem.flow.v1';
let W=(function(){var q=(location.search+'&'+location.hash.slice(1)).replace(/^\?/,'').split('&');for(var i=0;i<q.length;i++){var kv=q[i].split('=');if(kv[0].toLowerCase()==='sales'&&kv[1]){try{var v=decodeURIComponent(kv[1]).trim();if(v)return v.slice(0,40)}catch(e){}}}return 'panplus5'})();
document.querySelectorAll('.wxid').forEach(e=>e.textContent=W);
const hasSales=/(?:^|[?&#])sales=/i.test(location.search+'&'+location.hash.slice(1));
function salesURL(path){let u=new URL(path,location.href);if(hasSales)u.searchParams.set('Sales',W);return u.pathname+u.search+u.hash}
document.querySelectorAll('.sales-link').forEach(a=>a.href=salesURL(a.getAttribute('href')));
$('redeem-nav').href=salesURL('redeem.html');
function safeGet(key){try{return sessionStorage.getItem(key)}catch{return null}}
function safeSet(key,val){try{sessionStorage.setItem(key,val);return true}catch{return false}}
let theme='';try{theme=localStorage.t||''}catch{}
document.documentElement.dataset.t=theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'');
$('tg').onclick=()=>{const h=document.documentElement;h.dataset.t=h.dataset.t==='dark'?'':'dark';try{localStorage.t=h.dataset.t}catch{}};
async function copy(text,status){try{await navigator.clipboard.writeText(text);if(status)status.textContent='已复制，去粘贴就好。'}catch{const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();let ok=false;try{ok=document.execCommand('copy')}catch{}t.remove();if(status)status.textContent=ok?'已复制，去粘贴就好。':'没能自动复制，请长按选中文字复制。'}}
$('cp').onclick=()=>copy(W,$('copy-status'));
$('copy-link').onclick=()=>copy(location.href,$('alert')).then(()=>{$('alert').hidden=false});
let preview=new URLSearchParams(location.hash.slice(1)).get('preview')||new URLSearchParams(location.search).get('preview');
if(!['step1','step2','confirm','success','query','processing','failed'].includes(preview))preview=null;
if(window.JMM_DESIGN_PREVIEW_ONLY===true&&!preview)preview='step1';
const DEMO={provider:'openai',product_name:'ChatGPT Plus',plan:'chatgptplusplan',activation_token:'preview-only',expires_in:900,expires_at:new Date(Date.now()+900000).toISOString()};
let flow=null;try{const p=JSON.parse(safeGet(KEY));if(p&&typeof p.nonce==='string'&&/^[A-Za-z0-9_-]+$/.test(p.nonce)&&p.nonce.length>=22&&p.nonce.length<=86&&typeof p.cdk==='string')flow=p}catch{}
let token='',account=null,mode='redeem',busy=false,pollId=0,cdkValid=false,zstdPromise=null;
const rateUntil=new Map();
if(preview){$('redeem-nav').href=salesURL('redeem.html#preview=step1');$('preview-note').hidden=false;flow={nonce:'preview',cdk:'DEMO-JMM-2026-PLUS',meta:DEMO};}
function persist(){if(preview)return; // Never persist a Session, Cookie, raw input, refreshed_token or account.
 const f=flow;if(f)safeSet(KEY,JSON.stringify({nonce:f.nonce,cdk:f.cdk,meta:f.meta,queryToken:f.queryToken,orderNo:f.orderNo,uncertain:f.uncertain,terminal:f.terminal,orderMeta:f.orderMeta}));}
function newNonce(){const b=crypto.getRandomValues(new Uint8Array(24));return bytes64(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function bytes64(b){let out='';for(let i=0;i<b.length;i+=0x8000)out+=String.fromCharCode(...b.subarray(i,i+0x8000));return btoa(out)}
function payload(r){return r.data&&typeof r.data==='object'?r.data:r}
function apiBase(){const base=typeof window.EASYSUB_API_BASE==='string'?window.EASYSUB_API_BASE:'https://api.easysub.site';const b=base.replace(/\/+$/,'');return b.endsWith('/api/v1/sub')?b:b+'/api/v1/sub'}
class ApiError extends Error{constructor(m,kind,wait=0){super(m);this.kind=kind;this.wait=wait}}
async function api(path,data){
 if(preview)throw new ApiError('当前为设计预览，不会连接真实充值接口。','preview');
 const till=rateUntil.get(path)||0;if(Date.now()<till)throw new ApiError('慢一点点，接口需要休息。请在 '+Math.ceil((till-Date.now())/1000)+' 秒后重试。','rate',till-Date.now());
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),35000);let res;
 try{res=await fetch(apiBase()+'/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:ctl.signal});}
 catch(e){if(e instanceof TypeError)throw new ApiError('浏览器暂时未能连接充值接口。请查看下方的连接说明，再重试。','network');throw new ApiError('连接等待有点久。若已提交充值，请先查询订单，避免重复提交。','timeout')}
 finally{clearTimeout(timer)}
 if(res.status===429){const retry=res.headers.get('Retry-After');const sec=/^\d+(\.\d+)?$/.test(retry||'')?Number(retry):Math.max(1,(Date.parse(retry)-Date.now())/1000||30);const wait=Math.ceil(sec*1000);rateUntil.set(path,Date.now()+wait);throw new ApiError('请求有点密，等 '+Math.ceil(wait/1000)+' 秒再试就好。','rate',wait)}
 if(res.status===503)throw new ApiError('安全校验暂不可用，请稍后再试。兑换码请先保留好。','unavailable');
 let r;try{r=await res.json()}catch{throw new ApiError('接口没有返回可读取的结果，请稍后再试。','response')}
 if(!res.ok||Number(r.code)!==200)throw new ApiError(friendly(r.error||'这一步暂时没有完成，请稍后再试。'),'business');
 return payload(r);
}
function err(e){$('alert').textContent=friendly(e.message||e);$('alert').hidden=false;if(e.kind==='network')$('network-note').hidden=false;}
function clearError(){$('alert').hidden=true;}
function step(n){document.querySelectorAll('.stepper li').forEach(li=>{const k=Number(li.dataset.step);li.classList.toggle('on',k===n);li.classList.toggle('done',k<n);li.querySelector('.num').textContent=k<n?'✓':k;li.setAttribute('aria-current',k===n?'step':'false')});}
function render(html,n){stage.innerHTML='<div class="fade">'+html+'</div>';step(n);if(preview){const field=$('cdk');if(field){field.readOnly=true;field.value='DEMO-JMM-2026-PLUS'}const session=$('session');if(session){session.readOnly=true;session.value='演示用虚构登录信息 · 无需粘贴真实 Session';}const drop=$('drop');if(drop)drop.hidden=true;const query=$('query-cdks');if(query){query.readOnly=true;query.value='DEMO-JMM-2026-PLUS'}}}
function loading(text,desc){render('<div class="loader" aria-hidden="true"></div><h2>'+esc(text)+'</h2><p class="lead">'+esc(desc)+'</p>',cdkValid?2:1)}
function setMode(m){pollId++;mode=m;clearError();$('query-tab').classList.toggle('on',m==='query');$('redeem-tab').classList.toggle('on',m==='redeem');if(m==='query')showQuery();else showCode();}
function tab(m){if(busy)return;token='';account=null;setMode(m)}
$('query-tab').onclick=()=>tab('query');$('query-nav').onclick=()=>{tab('query');document.querySelector('.workspace').scrollIntoView()};$('net-query').onclick=()=>tab('query');$('redeem-tab').onclick=()=>tab('redeem');
function heading(tag,title,desc){return '<div class="section-tag">'+esc(tag)+'</div><h2>'+title+'</h2><p class="lead">'+desc+'</p>'}
function title(meta=flow?.meta){if(!meta)return '订阅会员';let s=brandText(meta.product_name||plan(meta.plan));if(meta.product_type==='codex_credits')s+=' · '+(Number(meta.credit_quantity)||0).toLocaleString('zh-CN')+' Credits';return s}
function banner(){let m=flow.meta,p=m.provider;let art=p==='claude'?'<span class="mark" aria-hidden="true">✳</span>':'<img src="img/'+(p==='grok'?'switch-grok.webp':'switch-chatgpt.webp')+'" alt="">';return '<div class="product-banner">'+art+'<div><b>'+esc(title())+'</b><small>'+esc(PROVIDER[p]||'订阅服务')+' · 兑换码已验证</small></div><span class="verified">✓ 已验证</span></div>'}
function showCode(){cdkValid=false;token='';account=null;const resume=flow?.uncertain||flow?.queryToken;render(heading('STEP 01 · 从这里开始','输入兑换码，<span>开启好体验。</span>','准备好你的 CDK，萌萌哒 AI 先帮你确认可充值的会员类型。')+
 (resume?'<div class="network-note"><b>上次的订单还在这里。</b><p>若上次已提交，请先恢复查询，确认结果后再操作。</p><button class="text-btn" id="resume">恢复订单查询 ›</button></div>':'')+
 '<form id="code-form" class="form"><label for="cdk">兑换码（CDK）</label><input id="cdk" class="field cdk-field" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="粘贴你的兑换码" maxlength="500" value="'+esc(flow?.cdk||'')+'" required><p class="caption">会自动识别 ChatGPT、Claude 或 Grok，无需先选套餐。</p><div class="actions"><button class="btn" type="submit">验证兑换码 <span>→</span></button><button type="button" class="text-btn" id="go-query">已兑换？查询订单 ›</button></div></form><div class="bottom-hint"><span>✓</span> 验证成功后，才会出现账号登录信息的输入框。</div>',1);
 $('go-query').onclick=()=>tab('query');if($('resume'))$('resume').onclick=()=>restore();
 $('code-form').onsubmit=async e=>{e.preventDefault();if(busy)return;clearError();const c=$('cdk').value.trim();if(!c)return;
 if(flow&&flow.cdk!==c){if(flow.uncertain){err(new Error('上次提交的结果还未确认，请先恢复订单查询，再开始新的兑换。'));return}flow=null;}

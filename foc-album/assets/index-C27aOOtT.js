(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function n(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(r){if(r.ep)return;r.ep=!0;const s=n(r);fetch(r.href,s)}})();const J=[["BRB","Brobnar","bro",["Brasao","Daniel Chamon","Marc Emerim"]],["DIS","Dis","dis",["Brasao","David MatouGolias","Mateus Barbosa","Victor Faria"]],["LGS","Logos","lgos",["Brasao","Kammy","Guilherme Monteiro"]],["MRS","Mars","mrs",["Brasao","Daniel Mekaro","JP Rodriguez"]],["SCT","Sanctum","sct",["Brasao","Leo Butinão","Rigel Duarte"]],["RDP","Redemption","rdp",["Brasao","Gian Rumachella"]],["SHW","Shadows","shw",["Brasao","Rodrigo Bunda","Diogo Costa","Flávio Ciampone"]],["UNT","Untamed","unt",["Brasao","Gabriel Firmo","Lucas Hubacek","Marcos Dhrago"]],["SAU","Saurian","sau",["Brasao","DreadsGu","Pedro Godoy"]],["STA","Star Alliance","sta",["Brasao","Nicholas Sukorski","Roberto Rocha"]],["UNF","Unfathomable","unf",["Brasao","Gabriel Oliveira","Tamara Holanda"]],["EKW","Ekwidon","ekw",["Brasao","Guilherme Faria"]],["GST","Geistoid","gst",["Brasao","Hygow Lial"]],["SKB","Skyborn","skb",["Brasao","Fábio Hideki"]]],I=Object.fromEntries(J.map(([e,t,n])=>[e,{code:e,name:t,icon:`/assets/houses/House=${n}.svg`}])),S=J.flatMap(([e,t,n,i])=>i.map((r,s)=>({id:`${e} ${s}`,slug:`${e.toLowerCase()}-${s}`,house:e,houseName:t,icon:`/assets/houses/House=${n}.svg`,name:r,type:s===0?"crest":"player",image:s===0?"/assets/stickers/stickers_mock.webp":`/assets/stickers/${e==="STA"?"STR":e}_${s}.webp`}))),$=S.filter(e=>e.type==="player"),ae=["BRB 1","DIS 1","LGS 1","MRS 1","SCT 1","SHW 1"],X=["BRB 0","DIS 0","LGS 0"],E=[{number:1,background:"/assets/pages/P01.webp",kind:"cover",stickers:[]},{number:2,background:"/assets/pages/P02.webp",kind:"cover",stickers:[]},{number:3,background:"/assets/pages/P03_3A.webp",layout:"3A",stickers:["BRB 0","BRB 1","BRB 2"]},{number:4,background:"/assets/pages/P04_2A.webp",layout:"2A",stickers:["DIS 0","DIS 1"]},{number:5,background:"/assets/pages/P05_2A.webp",layout:"2A",stickers:["DIS 2","DIS 3"]},{number:6,background:"/assets/pages/P06_3A.webp",layout:"3A",stickers:["LGS 0","LGS 1","LGS 2"]},{number:7,background:"/assets/pages/P07_3B.webp",layout:"3B",stickers:["MRS 0","MRS 1","MRS 2"]},{number:8,background:"/assets/pages/P08_3A.webp",layout:"3A",stickers:["SCT 0","SCT 1","SCT 2"]},{number:9,background:"/assets/pages/P09_2A.webp",layout:"2A",stickers:["RDP 0","RDP 1"]},{number:10,background:"/assets/pages/P10_2A.webp",layout:"2A",stickers:["SHW 0","SHW 1"]},{number:11,background:"/assets/pages/P11_2A.webp",layout:"2A",stickers:["SHW 2","SHW 3"]},{number:12,background:"/assets/pages/P12_2A.webp",layout:"2A",stickers:["UNT 0","UNT 1"]},{number:13,background:"/assets/pages/P13_2A.webp",layout:"2A",stickers:["UNT 2","UNT 3"]},{number:14,background:"/assets/pages/P14_3A.webp",layout:"3A",stickers:["SAU 0","SAU 1","SAU 2"]},{number:15,background:"/assets/pages/P15_3B.webp",layout:"3B",stickers:["STA 0","STA 1","STA 2"]},{number:16,background:"/assets/pages/P16_3A.webp",layout:"3A",stickers:["UNF 0","UNF 1","UNF 2"]},{number:17,background:"/assets/pages/P17_2A.webp",layout:"2A",stickers:["EKW 0","EKW 1"]},{number:18,background:"/assets/pages/P18_2A.webp",layout:"2A",stickers:["GST 0","GST 1"]},{number:19,background:"/assets/pages/P19_2A.webp",layout:"2A",stickers:["SKB 0","SKB 1"]},{number:20,background:"/assets/pages/P20.webp",kind:"cover",stickers:[]}];function T(e){return S.find(t=>t.id===e)}function ne(e){const t=[...e];for(let n=t.length-1;n>0;n--){const i=Math.floor(Math.random()*(n+1));[t[n],t[i]]=[t[i],t[n]]}return t}function Y(){const e=$.map(r=>r.id),t=ne(e).slice(0,6),n=["BRB 0","BRB 1","BRB 2","DIS 0","DIS 1","DIS 2","DIS 3"],i=Object.fromEntries([...t.slice(0,3),...n].map(r=>[r,{quantity:1,isNew:!0,source:"pack"}]));return{currentRoute:"packs",user:{id:"fabio_hideki",name:"Fábio Hideki",packOpened:!0,isAdmin:!0,serie:"B"},activeRound:{number:1,name:"Rodada 1",active:!0,startsAt:new Date().toISOString(),deadline:new Date(Date.now()+48*60*60*1e3).toISOString(),sasLimit:80},packs:[{id:"welcome",type:"player",title:"Pacotinho inicial",subtitle:"6 jogadores",image:"/assets/pack/player_pack.webp",opened:!0,stickerIds:t},{id:"golden-1",type:"crest",title:"Pacotinho dourado",subtitle:"Brasões",image:"/assets/pack/golden_pack.webp",opened:!1,disabled:!0,stickerIds:X}],collection:i,albumPage:0,reveal:null,selectedHouseCodes:[],report:{matchId:"r1m1",housesSubmitted:!1,reported:!1,completed:!1,playerAKeys:0,playerBKeys:0,opponentHouses:["MRS","SCT","SHW"],opponentReported:!1,confirmed:!1,conflict:!1,confirmedAt:null,pickedIds:[],matchDeadlinePassed:!1,fallbackActive:!1,maxPicks:3},challenges:[{id:"c1",title:"Deck SAS abaixo do limite",desc:"Vencer com deck cujo SAS seja 5 ou mais abaixo do limite da rodada",completed:!1,pickedId:null,pendingValidation:!1},{id:"c2",title:"Aember bonus mínimo",desc:"Vencer com deck com bônus de aember de 8 ou menos",completed:!1,pickedId:null,pendingValidation:!1},{id:"c3",title:"Keycheat único",desc:"Vencer usando exatamente 1 keycheat na partida",completed:!1,pickedId:null,pendingValidation:!1},{id:"c4",title:"Creature control mínimo",desc:"Vencer com deck com creature control de 8 ou menos",completed:!1,pickedId:null,pendingValidation:!1},{id:"c5",title:"1 Maverick no deck",desc:"Vencer com um deck que tenha exatamente 1 Maverick",completed:!1,pickedId:null,pendingValidation:!1},{id:"c6",title:"≥ 6 artefatos",desc:"Vencer com um deck que tenha pelo menos 6 artefatos",completed:!1,pickedId:null,pendingValidation:!1},{id:"c7",title:"≥ 20 criaturas",desc:"Vencer com um deck que tenha pelo menos 20 criaturas",completed:!1,pickedId:null,pendingValidation:!1},{id:"c8",title:"Pós-MM econômico",desc:"Vencer com deck pós-Mass Mutation com no máximo 6 propagações",completed:!1,pickedId:null,pendingValidation:!1}],matches:[{id:"r1m1",playerA:"Fábio Hideki",playerB:"Flávio Ciampone"},{id:"r1m2",playerA:"Pedro Godoy",playerB:"Gian Carlo"},{id:"r1m3",playerA:"Camilly Marcondes",playerB:"Guilherme Monteiro"},{id:"r1m4",playerA:"Daniel Chamon",playerB:"Marc Emerim"}],opponentCollection:Object.fromEntries(S.filter(r=>r.type==="player").map((r,s)=>[r.id,{quantity:s%4===0?2:1}]))}}function D(e,t,n={}){const i=T(e);if(!i)return"";const s=!!t[e]||!!n.forceOwned,o=["sticker-card",s?"is-owned":"is-empty",i.type==="crest"?"is-crest":"is-player"];n.small&&o.push("is-small");let c="";return s&&(c=`data-action="viewSticker" data-value="${i.id}"`),`
    <button class="${o.join(" ")}" ${c} type="button">
      <span class="card-holo-effect" aria-hidden="true"></span>
      <span class="card-holo-glare" aria-hidden="true"></span>
      ${s?`<img class="sticker-image" src="${i.image}" alt="${i.name}" />`:`<span class="sticker-silhouette"></span><span class="sticker-code">${i.id}</span>`}
    </button>
  `}function ie(e){const t=e.reveal;return`
    <section class="page-view packs-view">
      <div class="section-heading">
        <h2>Pacotinhos</h2>
      </div>

      <div class="panel packs-panel">
        <div class="pack-grid">
          ${e.packs.map(n=>oe(n)).join("")}
        </div>
      </div>

      ${t?se(t,e.collection):""}
    </section>
  `}function oe(e){const t=e.type==="crest"?"is-golden":"is-player",n=e.type==="crest"?"button-gold":"button-silver",i=e.opened||e.disabled?"disabled":"",r=e.disabled?"Em breve":e.opened?"Aberto":"Abrir";return`
    <article class="pack-card ${t}">
      <div class="pack-art">
        <img src="${e.image}" alt="${e.title}" />
      </div>
      <button class="button ${n}" data-action="openPack" data-value="${e.id}" ${i}>
        ${r}
      </button>
    </article>
  `}function se(e,t){e.flippedIndexes=e.flippedIndexes||[],e.ripped=e.ripped||!1;const n=e.pack.stickerIds.map((o,c)=>{const l=T(o),p=e.flippedIndexes.includes(c)?"is-flipped":"",g=(l==null?void 0:l.type)==="crest"?"is-crest":"";return`
      <div class="flip-card ${p} ${g}" data-index="${c}">
        <div class="flip-card-inner">
          <div class="flip-card-back" style="padding: 0; background: transparent;">
            <img src="/assets/sticker_back.webp" alt="Verso" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
          </div>
          <div class="flip-card-front">
            ${D(o,t,{small:!0,forceOwned:!0})}
          </div>
        </div>
      </div>
    `}).join(""),i=e.ripped?"state-revealing":"state-unopened",s=e.flippedIndexes.length===e.pack.stickerIds.length?"opacity: 1; pointer-events: auto;":"opacity: 0; pointer-events: none;";return`
    <div class="reveal-overlay ${i}" id="revealOverlay">
      <div class="reveal-overlay-bg"></div>

      <!-- Fase 1: Pacotinho Fechado -->
      <div class="pack-opening-stage">
        <div class="pack-wrapper-3d" id="packWrapper">
          <div class="pack-rip-container" id="packRipContainer">
            <div class="pack-half pack-top">
              <img src="${e.pack.image}" alt="${e.pack.title}" />
            </div>
            <div class="pack-half pack-bottom">
              <img src="${e.pack.image}" alt="${e.pack.title}" />
            </div>
          </div>
          <div class="pack-glow-back"></div>
        </div>
        <div class="pack-instruction">
          <h3>${e.pack.title}</h3>
          <p>Clique no pacote para rasgar</p>
        </div>
      </div>

      <!-- Fase 2: Figurinhas Reveladas Uma a Uma -->
      <div class="cards-reveal-stage">
        <div class="reveal-header">
          <p class="eyebrow">${e.pack.type==="crest"?"Pacotinho dourado":"Pacotinho inicial"}</p>
          <h2>${e.newIds.length} novas figurinhas!</h2>
          <p class="reveal-hint">Clique nas figurinhas para revelá-las</p>
        </div>
        <div class="reveal-cards-grid" id="revealCardsGrid">
          ${n}
        </div>
        <div class="reveal-actions" style="${s} transition: opacity 0.5s ease;">
          <button class="button button-secondary" data-action="goAlbum">Ver álbum</button>
        </div>
      </div>
    </div>
  `}function re(e,t){const n=document.querySelector("#revealOverlay");if(!n)return;const i=e.reveal;if(!i)return;i.flippedIndexes=i.flippedIndexes||[],i.ripped=i.ripped||!1,document.querySelectorAll(".bottom-nav .nav-item").forEach(o=>{o.addEventListener("click",()=>{e.reveal=null})});const r=n.querySelector('[data-action="goAlbum"]');if(r&&r.addEventListener("click",()=>{e.reveal=null}),i.ripped){F(n,i);return}const s=n.querySelector("#packWrapper");s&&s.addEventListener("click",()=>{n.classList.contains("state-ripping")||i.ripped||(n.classList.remove("state-unopened"),n.classList.add("state-ripping"),le(s,i.pack.type==="crest"),de(),setTimeout(()=>{i.ripped=!0,n.classList.remove("state-ripping"),n.classList.add("state-revealing"),F(n,i)},1200))})}function F(e,t,n){if(e._cardsInitialized)return;e._cardsInitialized=!0;const i=e.querySelectorAll(".flip-card"),r=e.querySelector(".reveal-actions");i.forEach(o=>{o.addEventListener("click",()=>{const c=parseInt(o.dataset.index,10);if(t.flippedIndexes.includes(c)||o.classList.contains("is-charging"))return;const l=t.pack.stickerIds[c],d=T(l);if((d==null?void 0:d.type)==="crest"){o.classList.add("is-charging"),pe();const g=setInterval(()=>{o.classList.contains("is-charging")?ce(o):clearInterval(g)},60);setTimeout(()=>{clearInterval(g),o.classList.remove("is-charging"),o.classList.add("is-flipped"),t.flippedIndexes.includes(c)||t.flippedIndexes.push(c),G(!0),K(o,!0),s()},400)}else o.classList.add("is-flipped"),t.flippedIndexes.includes(c)||t.flippedIndexes.push(c),G(!1),K(o,!1),s()})});function s(){t.flippedIndexes.length===t.pack.stickerIds.length&&r&&setTimeout(()=>{r.style.opacity="1",r.style.pointerEvents="auto"},500)}}function le(e,t){const n=e.getBoundingClientRect(),i=n.width/2,r=n.height/2,s=30;for(let o=0;o<s;o++){const c=document.createElement("div");c.className="pack-particle";const l=Math.random()*8+4;c.style.setProperty("--size",`${l}px`);const d=Math.random()*Math.PI*2,p=Math.random()*180+50,g=Math.cos(d)*p,f=Math.sin(d)*p;c.style.setProperty("--dx",`${g}px`),c.style.setProperty("--dy",`${f}px`);const h=Math.random()*.6+.6;c.style.setProperty("--duration",`${h}s`);let y;if(t){const x=["#f2c14e","#ffd700","#ffffff","#e5c158","#b8860b"];y=x[Math.floor(Math.random()*x.length)]}else{const x=["#3185ff","#ffffff","#1e90ff","#8a2be2","#00ffff"];y=x[Math.floor(Math.random()*x.length)]}c.style.setProperty("--particle-color",y),c.style.left=`${i}px`,c.style.top=`${r}px`,e.appendChild(c),setTimeout(()=>{c.remove()},h*1e3)}}function ce(e,t){const n=e.getBoundingClientRect(),i=document.createElement("div");i.className="pack-particle";const r=Math.random()*4+2;i.style.setProperty("--size",`${r}px`);const s=(Math.random()-.5)*60,o=-(Math.random()*40+10);i.style.setProperty("--dx",`${s}px`),i.style.setProperty("--dy",`${o}px`);const c=Math.random()*.3+.2;i.style.setProperty("--duration",`${c}s`),i.style.setProperty("--particle-color","#ffd700"),i.style.left=`${Math.random()*n.width}px`,i.style.top=`${Math.random()*n.height}px`,e.appendChild(i),setTimeout(()=>{i.remove()},c*1e3)}function K(e,t){const n=e.getBoundingClientRect(),i=n.width/2,r=n.height/2,s=t?35:15;for(let o=0;o<s;o++){const c=document.createElement("div");c.className="pack-particle";const l=Math.random()*6+3;c.style.setProperty("--size",`${l}px`);const d=Math.random()*Math.PI*2,p=Math.random()*120+30,g=Math.cos(d)*p,f=Math.sin(d)*p;c.style.setProperty("--dx",`${g}px`),c.style.setProperty("--dy",`${f}px`);const h=Math.random()*.5+.4;c.style.setProperty("--duration",`${h}s`);let y;if(t){const x=["#f2c14e","#ffd700","#ffffff","#fff8dc"];y=x[Math.floor(Math.random()*x.length)]}else{const x=["#3185ff","#ffffff","#e0ffff"];y=x[Math.floor(Math.random()*x.length)]}c.style.setProperty("--particle-color",y),c.style.left=`${i}px`,c.style.top=`${r}px`,e.appendChild(c),setTimeout(()=>{c.remove()},h*1e3)}}function de(){try{const e=window.AudioContext||window.webkitAudioContext;if(!e)return;const t=new e,n=t.sampleRate*.4,i=t.createBuffer(1,n,t.sampleRate),r=i.getChannelData(0);for(let l=0;l<n;l++)r[l]=Math.random()*2-1;const s=t.createBufferSource();s.buffer=i;const o=t.createBiquadFilter();o.type="bandpass",o.frequency.setValueAtTime(1e3,t.currentTime),o.frequency.exponentialRampToValueAtTime(300,t.currentTime+.35);const c=t.createGain();c.gain.setValueAtTime(.15,t.currentTime),c.gain.exponentialRampToValueAtTime(.01,t.currentTime+.38),s.connect(o),o.connect(c),c.connect(t.destination),s.start(),s.stop(t.currentTime+.4)}catch{}}function pe(){try{const e=window.AudioContext||window.webkitAudioContext;if(!e)return;const t=new e,n=t.createOscillator(),i=t.createGain();n.type="sawtooth",n.frequency.setValueAtTime(100,t.currentTime),n.frequency.linearRampToValueAtTime(350,t.currentTime+.4);const r=t.createBiquadFilter();r.type="lowpass",r.frequency.setValueAtTime(400,t.currentTime),i.gain.setValueAtTime(.01,t.currentTime),i.gain.linearRampToValueAtTime(.08,t.currentTime+.4),n.connect(r),r.connect(i),i.connect(t.destination),n.start(),n.stop(t.currentTime+.4)}catch{}}function G(e){try{const t=window.AudioContext||window.webkitAudioContext;if(!t)return;const n=new t,i=n.createOscillator(),r=n.createGain();if(i.connect(r),r.connect(n.destination),e){i.type="triangle",i.frequency.setValueAtTime(261.63,n.currentTime),i.frequency.exponentialRampToValueAtTime(523.25,n.currentTime+.1),i.frequency.exponentialRampToValueAtTime(1046.5,n.currentTime+.35);const s=n.createOscillator(),o=n.createGain();s.type="sine",s.frequency.setValueAtTime(329.63,n.currentTime),s.frequency.exponentialRampToValueAtTime(659.25,n.currentTime+.15),s.connect(o),o.connect(n.destination),o.gain.setValueAtTime(.08,n.currentTime),o.gain.exponentialRampToValueAtTime(.001,n.currentTime+.5),s.start(),s.stop(n.currentTime+.55),r.gain.setValueAtTime(.12,n.currentTime),r.gain.exponentialRampToValueAtTime(.001,n.currentTime+.5)}else i.type="sine",i.frequency.setValueAtTime(220,n.currentTime),i.frequency.exponentialRampToValueAtTime(880,n.currentTime+.2),r.gain.setValueAtTime(.1,n.currentTime),r.gain.exponentialRampToValueAtTime(.001,n.currentTime+.3);i.start(),i.stop(n.currentTime+.5)}catch{}}function ue(e,t){return`
    <div id="album-container-wrapper">
      <div id="album-flipbook">
        ${e.albumPages.map(i=>{const r=i.layout?`layout-${i.layout}`:"",s=i.kind==="cover";return`
      <div class="page-wrapper-turn">
        <article class="album-page ${r}" style="background-image: url('${i.background||"/assets/pages/pages_mock.webp"}')">
          ${s?"":i.stickers.map(o=>{const c=T(o);return`<div class="album-slot" aria-label="${(c==null?void 0:c.name)||o}">${D(o,e.collection)}</div>`}).join("")}
        </article>
      </div>
    `}).join("")}
      </div>
    </div>
  `}function ge(){const e=document.getElementById("album-container-wrapper"),t=e?e.clientWidth:window.innerWidth,n=window.innerWidth<768,i=n?Math.min(t-12,680):Math.min(t-48,800),r=i/2,s=Math.round(r*1.4);return{width:i,height:s,isMobile:n}}function me(e,t){const n=window.jQuery("#album-flipbook");if(!n.length)return;const i=ge();n.turn({width:i.width,height:i.height,display:"double",acceleration:!0,gradients:!1,elevation:50,page:e.albumPage+1,when:{turning:function(s,o){e.albumPage=o-1,document.querySelectorAll(".page-rail button").forEach(g=>g.classList.remove("is-active"));const c=n.turn("view",o);c.forEach(g=>{if(g>0){const f=document.querySelector(`.page-rail button[data-value="${g-1}"]`);f&&f.classList.add("is-active")}});const l=document.querySelector(`.page-rail button[data-value="${o-1}"]`);l&&l.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});const d=document.querySelector('[data-action="pagePrev"]'),p=document.querySelector('[data-action="pageNext"]');d&&(d.disabled=o===1),p&&(p.disabled=c.includes(e.albumPages.length))}}});const r=document.getElementById("album-container-wrapper");r&&typeof window.ResizeObserver<"u"&&new window.ResizeObserver(o=>{for(let c of o){const l=c.contentRect.width;if(l<=0)return;const p=window.innerWidth<768?Math.min(l-12,680):Math.min(l-48,800),g=p/2,f=Math.round(g*1.4),h=n.width(),y=n.height();(h!==p||y!==f)&&n.turn("size",p,f)}}).observe(r)}function fe(e){return e.albumPages=E,`
    <section class="page-view album-view">
      <div class="album-stage">
        ${ue(e)}
      </div>

      <div class="album-controls-bar">
        <button class="control-btn" data-action="pagePrev" ${e.albumPage===0?"disabled":""}>‹</button>
        <button class="control-btn" data-action="pageNext" ${e.albumPage===E.length-1?"disabled":""}>›</button>
      </div>

      <div class="page-rail">
        ${E.map((t,n)=>`
          <button class="${n===e.albumPage?"is-active":""}" data-action="setPage" data-value="${n}">
            ${String(t.number).padStart(2,"0")}
          </button>
        `).join("")}
      </div>

      <section class="house-progress">
        ${Object.values(I).map(t=>he(t,e.collection)).join("")}
      </section>
    </section>
  `}function he(e,t){const n=S.filter(r=>r.house===e.code),i=n.filter(r=>t[r.id]).length;return`
    <article>
      <img src="${e.icon}" alt="" />
      <span>${e.code}</span>
      <strong>${i}/${n.length}</strong>
    </article>
  `}function be(e){const t=e.challenges||[],n=t.filter(c=>c.completed).length,i=t.filter(c=>c.pendingValidation&&!c.completed).length,r=n+i,s=4,o=r<s;return`
    <div class="challenges-content-wrapper" style="width: 100%;">
      <div class="challenges-progress-bar-wrapper">
        <div class="challenges-meta">
          <span class="challenges-used">${r} / ${s} desafios usados</span>
          ${i>0?`<span class="challenges-pending-badge">${i} aguardando validação</span>`:""}
        </div>
        <div class="challenges-track">
          ${[1,2,3,4].map(c=>`<span class="challenges-dot ${r>=c?"is-filled":""}"></span>`).join("")}
        </div>
      </div>

      <div class="challenges-rule-note">
        <span class="rule-icon">ℹ</span>
        <p>Reporte e aguarde a confirmação do Flávio.</p>
      </div>

      <div class="challenges-list">
        ${t.map(c=>ye(c,o)).join("")}
      </div>
    </div>
  `}function ye(e,t,n){const i=e.completed,r=e.pendingValidation&&!i;let s="";return i?s=`<button class="button" disabled style="background: rgba(0, 99, 225, 0.12); color: var(--color-signal-blue); border: 1px solid rgba(0, 99, 225, 0.28); min-width: 160px;">Concluído (+${e.pickedId||"figurinha"})</button>`:r?s='<button class="button" disabled style="background: rgba(242, 193, 78, 0.12); color: #f2c14e; border: 1px solid rgba(242, 193, 78, 0.28); min-width: 160px;">Aguardando</button>':s=t?`<button class="button" data-action="claimChallenge" data-value="${e.id}" style="background: transparent; border: 2.5px solid var(--color-paper); color: var(--color-paper); font-weight: 700; min-width: 160px;">Reportar</button>`:'<button class="button button-secondary" disabled title="Limite de 4 desafios atingido" style="min-width: 160px;">Limite atingido</button>',`
    <article class="challenge-item ${i?"is-completed":""} ${r?"is-pending":""}">
      <div class="challenge-info">
        <h4 class="challenge-title">${e.title}</h4>
        <p class="challenge-desc">${e.desc}</p>
      </div>
      <div class="challenge-action">
        ${s}
      </div>
    </article>
  `}function ve(e){if(!e.activeChallengeId)return"";const t=(e.challenges||[]).find(i=>i.id===e.activeChallengeId);if(!t)return"";const n=$.filter(i=>!e.collection[i.id]||e.collection[i.id].quantity===0);return`
    <div class="challenge-picker-overlay" id="challengePickerOverlay">
      <div class="challenge-picker-bg" data-action="closeChallengePicke"></div>
      <div class="challenge-picker-content">
        <div class="challenge-picker-header">
          <h3>Escolha sua figurinha bônus</h3>
          <p class="challenge-picker-sub">Desafio: <strong>${t.title}</strong></p>
          <p class="challenge-picker-note">Sua escolha será enviada para validação dos administradores.</p>
          <button class="close-highlight-btn" data-action="closeChallengePicke">✕</button>
        </div>
        <div class="challenge-picker-grid">
          ${n.length===0?'<p class="empty-text">Você já tem todas as figurinhas!</p>':n.map(i=>`
              <div class="picker-item">
                <div class="picker-card-wrapper">
                  ${D(i.id,{},{small:!0})}
                </div>
                <button class="button button-primary"
                        data-action="pickChallengeSticker"
                        data-challenge="${t.id}"
                        data-value="${i.id}">
                  Escolher
                </button>
              </div>
            `).join("")}
        </div>
      </div>
    </div>
  `}function xe(e){if(!e.confirmChallengeId)return"";const t=(e.challenges||[]).find(n=>n.id===e.confirmChallengeId);return t?`
    <div class="challenge-picker-overlay" id="challengeConfirmOverlay">
      <div class="challenge-picker-bg" data-action="cancelChallenge"></div>
      <div class="challenge-picker-content" style="max-width: 420px; text-align: center;">
        <div class="challenge-picker-header">
          <h3>Confirmar Desafio</h3>
          <p class="challenge-picker-sub" style="margin-top: 10px; font-size: 0.9rem;">
            Você confirma que concluiu o desafio:<br>
            <strong>${t.title}</strong>?
          </p>
          <p class="challenge-picker-note" style="margin-top: 14px; text-align: left;">
            Ao confirmar, você poderá escolher a sua figurinha bônus e o desafio será enviado para validação dos administradores.
          </p>
        </div>
        <div class="challenge-confirm-buttons" style="display: flex; gap: 12px; justify-content: center; margin-top: 16px; width: 100%;">
          <button class="button button-secondary" data-action="cancelChallenge" style="flex: 1;">Cancelar</button>
          <button class="button button-primary" data-action="confirmChallenge" data-value="${t.id}" style="flex: 1;">Confirmar</button>
        </div>
      </div>
    </div>
  `:""}function ke(e){if(!e)return"—";const t=new Date(e),n=t.getDate(),r=["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"][t.getMonth()];return`${n} ${r}`}function we(e){if(!e.user.packOpened)return`
      <section class="page-view report-view">
        <div class="locked-panel">
          <span class="lock-mark">◇</span>
          <h2>Reporte bloqueado</h2>
          <p>Abra o pacotinho inicial para liberar a rodada.</p>
        </div>
      </section>
    `;const t=e.reportTab||"match";return`
    <section class="page-view report-view">
      <!-- TABS BAR -->
      <div class="report-tabs" style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 12px; width: 100%;">
        <button class="tab-button" data-action="setReportTab" data-value="match" style="flex: 1; background: ${t==="match"?"var(--color-signal-blue)":"transparent"}; color: ${t==="match"?"var(--color-paper)":"var(--color-ash)"}; border: 1.5px solid ${t==="match"?"var(--color-signal-blue)":"rgba(255,255,255,0.08)"}; padding: 10px; border-radius: var(--radius-md); font-weight: 700; font-family: var(--font-display); font-size: 0.8rem; text-transform: uppercase; cursor: pointer; transition: all 0.2s;">
          Partida
        </button>
        <button class="tab-button" data-action="setReportTab" data-value="challenges" style="flex: 1; background: ${t==="challenges"?"var(--color-signal-blue)":"transparent"}; color: ${t==="challenges"?"var(--color-paper)":"var(--color-ash)"}; border: 1.5px solid ${t==="challenges"?"var(--color-signal-blue)":"rgba(255,255,255,0.08)"}; padding: 10px; border-radius: var(--radius-md); font-weight: 700; font-family: var(--font-display); font-size: 0.8rem; text-transform: uppercase; cursor: pointer; transition: all 0.2s;">
          Desafios
        </button>
      </div>

      <div class="section-heading" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 10px;">
        <h2>${t==="match"?`Rodada ${e.activeRound.number}`:"Desafios"}</h2>
        ${t==="match"&&(e.user.isAdmin||["teste_1","teste_2"].includes(e.user.id))?`
          <button class="button button-secondary" data-action="resetMatch" style="margin: 0; padding: 6px 12px; font-size: 0.78rem; font-family: 'Fixture', sans-serif; text-transform: uppercase; font-weight: 700; height: 32px; min-height: auto;">
            Resetar Partida
          </button>
        `:""}
      </div>

      ${t==="challenges"?be(e):$e(e)}
    </section>
  `}function $e(e){const t=e.report;return`
      <div class="round-info-bar">
        <span class="deadline-badge">Prazo: ${ke(e.activeRound.deadline)}</span>
      </div>

      <article class="panel match-card">
        <div class="match-info">
          <span class="panel-label">Mesa 1</span>
          <h3>${e.matches[0].playerA} <span class="vs">vs</span> ${e.matches[0].playerB}</h3>
        </div>
        <div class="match-status-container">
          ${Ce(t)}
        </div>
      </article>

      ${t.completed?"":Se(e)}
      ${Ae(e)}
      ${t.housesSubmitted?Ie(t,e):""}
      ${t.confirmed?Re(e):""}
  `}function Ce(e){return e.completed?'<strong class="status-pill is-completed">Picks Concluídos</strong>':e.confirmed?'<strong class="status-pill is-confirmed">Confirmada</strong>':e.conflict?'<strong class="status-pill is-conflict">Conflito</strong>':e.reported?'<strong class="status-pill is-reported">Aguardando confirmação</strong>':e.opponentReported?'<strong class="status-pill is-active">Confirmar reporte</strong>':e.housesSubmitted?'<strong class="status-pill is-active">Aguardando Placar</strong>':'<strong class="status-pill is-waiting">Aguardando Casas</strong>'}function Se(e){const t={},n={};Object.keys(I).forEach(o=>{const c=$.filter(l=>l.house===o);t[o]=c.filter(l=>e.collection[l.id]),n[o]=c.filter(l=>e.opponentCollection[l.id])});const i=$.filter(o=>e.opponentCollection[o.id]&&(!e.collection[o.id]||e.collection[o.id].quantity===0));$.filter(o=>e.collection[o.id]&&(!e.opponentCollection[o.id]||e.opponentCollection[o.id].quantity===0));const r=e.matches.find(o=>o.id===e.report.matchId),s=r?r.playerB:"Adversário";return`
    <section class="panel pre-match-panel">
      <div class="step-header">
        <span class="step-number">Pré-partida</span>
        <h4>Figurinhas disponíveis</h4>
        <p>Veja o que cada jogador tem antes de escolher seu deck.</p>
      </div>

      <div class="pre-match-summary">
        <span class="pre-match-badge can-get">${i.length} figurinha${i.length!==1?"s":""} que você pode tentar pegar</span>
      </div>

      <div class="pre-match-grid">
        <div class="pre-match-col">
          <span class="panel-label">Sua coleção</span>
          <div class="pre-match-houses">
            ${Object.keys(I).map(o=>{const c=I[o],l=$.filter(p=>p.house===o).length,d=t[o].length;return`
                <details class="pre-match-accordion-item ${d>0?"has-some":"has-none"} ${d===l?"has-all":""}">
                  <summary class="pre-match-accordion-header">
                    ${c?`<img src="${c.icon}" alt="" class="house-mini-icon"/>`:""}
                    <span class="house-mini-name">${o}</span>
                    <span class="house-mini-count">${d}/${l}</span>
                    <span class="chevron-icon">▼</span>
                  </summary>
                  <div class="pre-match-accordion-content">
                    ${t[o].length===0?'<p class="empty-text">Nenhuma obtida</p>':`<ul>
                          ${t[o].map(p=>`<li><strong>${p.id}</strong> — ${p.name}</li>`).join("")}
                         </ul>`}
                  </div>
                </details>
              `}).join("")}
          </div>
        </div>
        <div class="pre-match-col">
          <span class="panel-label">${s}</span>
          <div class="pre-match-houses">
            ${Object.keys(I).map(o=>{const c=I[o],l=$.filter(p=>p.house===o).length,d=n[o].length;return`
                <details class="pre-match-accordion-item ${d>0?"has-some":"has-none"} ${d===l?"has-all":""}">
                  <summary class="pre-match-accordion-header">
                    ${c?`<img src="${c.icon}" alt="" class="house-mini-icon"/>`:""}
                    <span class="house-mini-name">${o}</span>
                    <span class="house-mini-count">${d}/${l}</span>
                    <span class="chevron-icon">▼</span>
                  </summary>
                  <div class="pre-match-accordion-content">
                    ${n[o].length===0?'<p class="empty-text">Nenhuma obtida</p>':`<ul>
                          ${n[o].map(p=>`<li><strong>${p.id}</strong> — ${p.name}</li>`).join("")}
                         </ul>`}
                  </div>
                </details>
              `}).join("")}
          </div>
        </div>
      </div>
    </section>
  `}function Ae(e){const t=e.report,n=e.selectedHouseCodes||[];return t.housesSubmitted?`
    <section class="panel houses-panel">
      <div class="panel-row-divided">
        <div class="deck-display">
          <span class="panel-label">Seu deck</span>
          <div class="house-chips">
            ${n.map(i=>U(i)).join("")}
          </div>
        </div>
        <div class="deck-display">
          <span class="panel-label">Deck do adversário</span>
          <div class="house-chips">
            ${t.confirmed||t.completed?t.opponentHouses.map((i,r)=>U(i,!0,r)).join(""):["???","???","???"].map(i=>`<span class="house-chip is-hidden">${i}</span>`).join("")}
          </div>
        </div>
      </div>
    </section>
  `:`
      <section class="panel houses-panel">
        <div class="step-header">
          <span class="step-number">Etapa 1</span>
          <h4>Selecione as 3 casas do seu deck</h4>
        </div>
        <div class="house-selector-grid">
          ${Object.keys(I).map(r=>{const s=I[r],o=n.includes(r);return`
              <button class="house-selector-chip ${o?"is-selected":""}" 
                      data-action="toggleHouse" 
                      data-value="${r}" 
                      type="button">
                ${s?`<img src="${s.icon}" alt="" />`:""}
                <span class="house-name">${r}</span>
                ${o?'<span class="check-indicator">✓</span>':""}
              </button>
            `}).join("")}
        </div>
        <div class="panel-action-bar">
          <span class="selection-counter">${n.length} de 3 selecionadas</span>
          <button class="button button-primary" data-action="submitHouses" ${n.length===3?"":"disabled"}>
            Confirmar casas
          </button>
        </div>
      </section>
    `}function U(e,t=!1,n=0){const i=I[e];return`
    <span class="house-chip ${t?`is-revealed reveal-delay-${n}`:""}">
      ${i?`<img src="${i.icon}" alt="" />`:""}
      <strong>${e}</strong>
    </span>
  `}function Ie(e,t){const n=!e.reported||e.conflict,i=t&&t.activeRound.deadline&&new Date(t.activeRound.deadline)<new Date,r=e.playerAKeys;return`
    <section class="panel score-panel">
      <div class="step-header">
        <span class="step-number">Etapa 2</span>
        <h4>${e.opponentReported&&!e.reported?"Confirme o reporte da partida":"Informe suas chaves forjadas"}</h4>
        <p>Cada jogador reporta apenas as próprias chaves. O segundo reporte confirma a partida.</p>
      </div>

      ${e.conflict?`
        <div class="alert-box is-error">
          <span class="alert-icon">⚠</span>
          <div class="alert-content">
            <strong>Divergência nos dados!</strong>
            <p>Seu reporte: Você ${e.playerAKeys} - ${e.playerBKeys} Oponente.</p>
            <p>Reporte do oponente: Você ${e.opponentKeysB} - ${e.opponentKeysA} Oponente.</p>
            <p>Ajuste os valores abaixo para corrigir.</p>
          </div>
        </div>
      `:""}

      ${n?`
        <div class="stepper-grid">
          <div class="stepper-item">
            <span class="stepper-label">Suas chaves</span>
            <div class="stepper-control">
              <button class="stepper-btn" data-action="adjustKeys" data-side="a" data-amount="-1" ${e.playerAKeys===0||i?"disabled":""}>−</button>
              <span class="stepper-value">${e.playerAKeys}</span>
              <button class="stepper-btn" data-action="adjustKeys" data-side="a" data-amount="1" ${e.playerAKeys===3||i?"disabled":""}>+</button>
            </div>
          </div>

          ${e.opponentReported||e.confirmed?`
            <div class="stepper-item is-readonly">
              <span class="stepper-label">Chaves do adversário</span>
              <div class="stepper-control">
                <span class="stepper-value">${e.playerBKeys}</span>
              </div>
            </div>
          `:""}
        </div>

        <button class="button button-primary button-large" data-action="reportMatch" ${i?"disabled":""}>
          ${i?"Prazo encerrado":e.opponentReported?"Confirmar reporte":e.conflict?"Corrigir e reenviar":"Enviar reporte"}
        </button>
      `:`
        <div class="score-display-card">
          <span class="score-label">Placar reportado</span>
          <div class="score-numbers">
            <div class="score-num-item">
              <span class="score-player">Você</span>
              <strong class="score-num">${r}</strong>
            </div>
            <div class="score-divider">-</div>
            <div class="score-num-item">
              <span class="score-player">Adversário</span>
              <strong class="score-num">${e.playerBKeys}</strong>
            </div>
          </div>
          ${e.confirmed?"":`
            <button class="button button-secondary button-large" data-action="editReport">
              Alterar meu reporte
            </button>
          `}
        </div>
      `}
    </section>
  `}function Re(e){const t=e.report,n=e.selectedHouseCodes||[],i=$.filter(l=>n.includes(l.house)).filter(l=>e.opponentCollection[l.id]).filter(l=>!e.collection[l.id]||e.collection[l.id].quantity===0),r=i.length===0,s=r?$.filter(l=>n.includes(l.house)).filter(l=>!e.collection[l.id]||e.collection[l.id].quantity===0):i,o=r?3:Math.min(t.playerAKeys,i.length),c=Math.max(0,o-t.pickedIds.length);return`
    <section class="panel picker-panel">
      <div class="countdown-wrapper">
        <div class="countdown-bar" id="countdown-timer">
          <!-- Vanilla JS Date Countdown -->
        </div>
      </div>

      <div class="section-heading compact">
        <p class="eyebrow">Picker pós-partida</p>
        <h2>${c} escolhas restantes</h2>
        <p class="picker-instruction">
          ${r?"Regra de Fallback Ativa: como o adversário não tinha figurinhas elegíveis, você pode escolher livremente até 3 de suas casas.":`Como você ganhou ${t.playerAKeys} ${t.playerAKeys===1?"chave":"chaves"}, você pode escolher até ${o} figurinha(s) elegível(eis) do adversário.`}
        </p>
      </div>

      ${r?`
        <div class="fallback-banner">
          <span class="fallback-icon">⚡</span>
          <div>
            <strong>Fallback ativo</strong>
            <p>Você pode escolher livremente até 3 figurinhas que você não tem nas casas do seu deck jogado.</p>
          </div>
        </div>
      `:""}

      ${s.length?`
        <div class="picker-list">
          ${s.map(l=>`
              <div class="picker-list-item">
                <div>
                  <strong>${l.id}</strong>
                  <span>${l.houseName} · ${l.name}</span>
                </div>
                <button class="button button-secondary" 
                        data-action="pickSticker" 
                        data-value="${l.id}" 
                        ${c===0||t.pickedIds.includes(l.id)||t.completed?"disabled":""}>
                  ${t.pickedIds.includes(l.id)?"Escolhida":"Pegar"}
                </button>
              </div>
            `).join("")}
        </div>
      `:`
        <div class="empty-state-panel">
          <span class="empty-icon">✕</span>
          <p class="empty-text">Não há figurinhas elegíveis para pegar.</p>
        </div>
      `}

      ${t.completed?`
        <div class="alert-box is-success">
          <span class="alert-icon">✓</span>
          <div class="alert-content">
            <strong>Picks concluídos com sucesso!</strong>
            <p>As figurinhas escolhidas foram enviadas para um novo pacotinho.</p>
          </div>
        </div>
      `:`
        <button class="button button-primary button-large" data-action="completePicks" ${t.completed?"disabled":""}>
          Concluir picks
        </button>
      `}
    </section>
  `}function Pe(e){if(window.countdownInterval&&clearInterval(window.countdownInterval),document.getElementById("countdown-timer")&&e.report.confirmedAt&&!e.report.completed){let s=function(){const o=document.getElementById("countdown-timer");if(!o){clearInterval(window.countdownInterval);return}const c=new Date(e.report.confirmedAt).getTime()+48*60*60*1e3,l=Date.now(),d=c-l;if(d<=0){o.innerHTML=`
          <div class="countdown-content is-expired">
            <span class="countdown-icon">⏱</span>
            <span class="countdown-text">Tempo para picks expirado! (Limite de 48h atingido)</span>
          </div>
        `,clearInterval(window.countdownInterval),document.querySelectorAll('[data-action="pickSticker"]').forEach(h=>{h.disabled=!0});return}const p=Math.floor(d/(1e3*60*60)),g=Math.floor(d%(1e3*60*60)/(1e3*60)),f=Math.floor(d%(1e3*60)/1e3);o.innerHTML=`
        <div class="countdown-content">
          <span class="countdown-icon">⏱</span>
          <span class="countdown-text">Tempo restante para os picks:</span>
          <strong class="countdown-time">${p}h ${g.toString().padStart(2,"0")}m ${f.toString().padStart(2,"0")}s</strong>
        </div>
      `};var i=s;s(),window.countdownInterval=setInterval(s,1e3)}if(document.getElementById("match-deadline-display")&&e.activeRound.deadline){let s=function(){const o=document.getElementById("match-deadline-display");if(!o)return;const l=new Date(e.activeRound.deadline).getTime()-Date.now();if(l<=0)o.innerHTML="⏱ Prazo encerrado",o.classList.add("is-expired"),e.report.reported||document.querySelectorAll('[data-action="reportMatch"]').forEach(d=>d.disabled=!0);else{const d=Math.floor(l/36e5),p=Math.floor(l%36e5/6e4);o.textContent=`⏱ Prazo: ${d}h ${p.toString().padStart(2,"0")}m`}};var r=s;window.matchDeadlineInterval&&clearInterval(window.matchDeadlineInterval),s(),window.matchDeadlineInterval=setInterval(s,3e4)}}function Te(e){const t=e.adminTab||"rounds";let n="";return t==="validation"?n=Le(e):t==="collections"?n=Me(e):t==="history"?n=Be(e):t==="rounds"&&(n=Ee(e)),`
    <section class="page-view admin-view">
      <div class="section-heading">
        <h2>Painel Admin</h2>
      </div>

      <div class="admin-tabs" style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; overflow-x: auto;">
        <button class="button ${t==="rounds"?"button-primary":"button-secondary"}" data-action="setAdminTab" data-value="rounds" style="flex: 1; height: 38px; min-height: auto; padding: 0 8px; white-space: nowrap;">Rodadas</button>
        <button class="button ${t==="validation"?"button-primary":"button-secondary"}" data-action="setAdminTab" data-value="validation" style="flex: 1; height: 38px; min-height: auto; padding: 0 8px; white-space: nowrap;">Validações</button>
        <button class="button ${t==="collections"?"button-primary":"button-secondary"}" data-action="setAdminTab" data-value="collections" style="flex: 1; height: 38px; min-height: auto; padding: 0 8px; white-space: nowrap;">Coleções</button>
        <button class="button ${t==="history"?"button-primary":"button-secondary"}" data-action="setAdminTab" data-value="history" style="flex: 1; height: 38px; min-height: auto; padding: 0 8px; white-space: nowrap;">Histórico Geral</button>
      </div>

      ${n}
    </section>
  `}function Le(e){const t=e.challenges||[],n=e.pendingChallenges&&e.pendingChallenges.length>0?e.pendingChallenges:t.filter(o=>o.pendingValidation&&!o.completed),r=e.activeRound.deadline&&new Date(e.activeRound.deadline)<new Date&&!e.report.completed;let s="";return r&&(s=`
      <div class="panel admin-panel" style="margin-top: 20px; border: 1px solid rgba(220, 60, 60, 0.3); background: rgba(220, 60, 60, 0.05);">
        <span class="panel-label" style="color: #ff6b6b; font-weight: 700;">Partida Congelada (Prazo Vencido)</span>
        <div style="padding: 12px 0; display: flex; flex-direction: column; gap: 8px;">
          <p style="margin: 0; font-size: 0.85rem; color: var(--color-paper);">
            A partida da Rodada <strong>${e.activeRound.number}</strong> não foi reportada a tempo e o prazo limite (<strong>${e.activeRound.deadline?new Date(e.activeRound.deadline).toLocaleDateString():"—"}</strong>) já expirou.
          </p>
          <div style="display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap;">
            <button class="button button-primary" data-action="confirmWO" data-value="r1m1" style="flex: 1; min-width: 140px; height: 36px; min-height: auto; padding: 0 12px; background: #dc3c3c; border-color: #dc3c3c;">
              Confirmar W.O. (0x0)
            </button>
            <button class="button button-secondary" data-action="unfreezeMatch" data-value="r1m1" style="flex: 1; min-width: 140px; height: 36px; min-height: auto; padding: 0 12px;">
              Descongelar (+24h)
            </button>
          </div>
        </div>
      </div>
    `),`
    <div class="panel admin-panel">
      <span class="panel-label">Validação de Desafios</span>
      ${n.length===0?'<p class="empty-text" style="padding: 20px 0; text-align: center; color: var(--color-ash); font-size: 0.85rem;">Nenhum desafio aguardando validação no momento.</p>':`
          <div class="admin-challenges-list" style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
            ${n.map(o=>`
              <div class="admin-challenge-card" style="padding: 16px; background: var(--color-iron); border-radius: var(--radius-md); box-shadow: var(--shadow-subtle); display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 200px;">
                  <h5 style="margin: 0 0 4px; font-size: 0.95rem; color: var(--color-paper);">${o.title}</h5>
                  ${o.playerName?`<p style="margin: 0 0 4px; font-size: 0.8rem; color: var(--color-gold);">Jogador: <strong>${o.playerName}</strong></p>`:""}
                  <p style="margin: 0 0 8px; font-size: 0.8rem; color: var(--color-ash);">${o.desc}</p>
                  <span style="font-size: 0.78rem; padding: 3px 8px; background: var(--color-graphite); border-radius: var(--radius-sm); color: var(--color-gold);">
                    Figurinha solicitada: <strong>${o.pickedId||"—"}</strong>
                  </span>
                </div>
                <button class="button button-primary" data-action="approveChallenge" data-value="${o.id}" data-player="${o.playerUsername||""}" style="min-width: 100px; height: 36px; min-height: auto; padding: 0 16px;">
                  Aprovar
                </button>
              </div>
            `).join("")}
          </div>
        `}
    </div>
    ${s}
  `}function Me(e){const t=e.selectedAdminPlayerId||"fabio_hideki",n=(e.players||[]).find(s=>s.id===t)||e.players[0],i=n?n.collection||{}:{};(!e.adminEditCollection||e.adminEditCollection.playerId!==t)&&(e.adminEditCollection={playerId:t,quantities:{}},S.forEach(s=>{var o;e.adminEditCollection.quantities[s.id]=((o=i[s.id])==null?void 0:o.quantity)||0}));let r=!1;return S.forEach(s=>{var l;const o=((l=i[s.id])==null?void 0:l.quantity)||0,c=e.adminEditCollection.quantities[s.id];o!==c&&(r=!0)}),`
    <div class="panel admin-panel">
      <span class="panel-label">Gerenciar Coleções</span>
      
      <div style="margin-bottom: 20px; display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 0.78rem; color: var(--color-ash); font-weight: 600; text-transform: uppercase;">Selecionar Jogador</label>
        <select id="adminPlayerSelect" style="width: 100%; max-width: 320px; background: var(--color-iron); color: var(--color-paper); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-md); padding: 10px 14px; font-weight: 600; outline: none; font-size: 0.88rem;">
          ${(e.players||[]).map(s=>`
            <option value="${s.id}" ${s.id===t?"selected":""}>${s.name} (${s.serie?`Série ${s.serie}`:"Sem Série"})</option>
          `).join("")}
        </select>
      </div>

      <div style="max-height: 400px; overflow-y: auto; padding-right: 4px; display: flex; flex-direction: column; gap: 8px; border: 1px solid rgba(255,255,255,0.04); padding: 12px; border-radius: var(--radius-lg); background: rgba(0,0,0,0.15);">
        ${S.map(s=>{var d;const o=e.adminEditCollection.quantities[s.id],c=((d=i[s.id])==null?void 0:d.quantity)||0,l=o!==c;return`
            <div class="admin-sticker-row" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--color-iron); border-radius: var(--radius-md); gap: 12px; flex-wrap: wrap; border-left: 3px solid ${l?"var(--color-signal-blue)":"transparent"};">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 0.72rem; font-weight: 700; color: var(--color-gold); background: var(--color-graphite); padding: 3px 6px; border-radius: var(--radius-sm);">${s.id}</span>
                <span style="font-size: 0.88rem; color: var(--color-paper); font-weight: 600;">${s.name}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 0.82rem; font-weight: 600; color: var(--color-ash);">Qtd: <strong style="color: ${l?"var(--color-signal-blue)":"var(--color-paper)"}; font-size: 0.9rem;">${o}</strong></span>
                <div style="display: flex; gap: 4px;">
                  <button class="button button-secondary" data-action="adminRemoveSticker" data-player="${n.id}" data-value="${s.id}" style="width: 28px; height: 28px; min-width: auto; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; line-height: 1;" ${o<=0?"disabled":""}>-</button>
                  <button class="button button-primary" data-action="adminAddSticker" data-player="${n.id}" data-value="${s.id}" style="width: 28px; height: 28px; min-width: auto; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; line-height: 1;">+</button>
                </div>
              </div>
            </div>
          `}).join("")}
      </div>

      <!-- BOTOES DE CONFIRMACAO EM MASSA -->
      ${r?`
        <div style="display: flex; gap: 10px; margin-top: 16px;">
          <button class="button button-secondary" data-action="adminCancelStickers" style="flex: 1; height: 36px; min-height: auto; margin: 0;">Cancelar</button>
          <button class="button button-primary" data-action="adminConfirmStickers" data-player="${n.id}" style="flex: 1; height: 36px; min-height: auto; margin: 0; background: var(--color-signal-blue); border-color: var(--color-signal-blue);">OK (Confirmar)</button>
        </div>
      `:""}

      <div class="panel" style="margin-top: 24px; max-height: 250px; overflow-y: auto; background: var(--color-graphite); border: 1px solid rgba(255,255,255,0.04);">
        <span class="panel-label" style="font-size: 0.76rem;">Histórico de Edições (Admin)</span>
        <div style="font-family: monospace; font-size: 0.74rem; display: flex; flex-direction: column; gap: 6px; padding: 8px 0;">
          ${(e.adminLogs||[]).length===0?'<p style="color: var(--color-ash); text-align: center; margin: 0; padding: 12px;">Nenhuma edição realizada ainda.</p>':(e.adminLogs||[]).slice().reverse().map(s=>`
              <div style="color: var(--color-ash); line-height: 1.4; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 4px;">
                <span style="color: var(--color-steel); font-weight: 600;">[${new Date(s.timestamp).toLocaleTimeString()}]</span> ${s.message}
              </div>
            `).join("")}
        </div>
      </div>
    </div>
  `}function Be(e){const t=e.stickersLog||[],n={};return t.forEach(i=>{const r=i.round||1;n[r]||(n[r]=[]),n[r].push(i)}),`
    <div class="panel admin-panel">
      <span class="panel-label">Histórico Geral de Entradas</span>
      ${t.length===0?'<p class="empty-text" style="padding: 20px 0; text-align: center; color: var(--color-ash); font-size: 0.85rem;">Nenhum registro de entrada de figurinhas.</p>':`
          <div class="timeline-wrapper" style="margin-top: 12px; display: flex; flex-direction: column; gap: 20px;">
            ${Object.keys(n).sort((i,r)=>r-i).map(i=>`
              <div>
                <h4 style="font-size: 0.9rem; color: var(--color-gold); text-transform: uppercase; border-left: 3px solid var(--color-gold); padding-left: 8px; margin: 0 0 10px; font-weight: 700; letter-spacing: 0.05em;">Rodada ${i}</h4>
                <div style="display: flex; flex-direction: column; gap: 8px; border-left: 1px dashed rgba(255,255,255,0.08); padding-left: 12px; margin-left: 8px;">
                  ${n[i].slice().reverse().map(r=>`
                    <div style="font-size: 0.8rem; color: var(--color-ash); display: flex; align-items: flex-start; gap: 8px; line-height: 1.4;">
                      <span style="font-size: 0.72rem; color: var(--color-steel); white-space: nowrap; margin-top: 2px; font-family: monospace;">[${new Date(r.timestamp).toLocaleTimeString()}]</span>
                      <div style="flex: 1;">
                        <span style="color: var(--color-paper); font-weight: 500;">${r.message}</span>
                        <span style="font-size: 0.64rem; padding: 2px 6px; border-radius: var(--radius-full); background: rgba(255,255,255,0.05); margin-left: 6px; font-weight: 700; text-transform: uppercase; color: var(--color-steel); display: inline-block;">${r.type||"info"}</span>
                      </div>
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
        `}
    </div>
  `}function Ee(e){const t=e.allRounds||[],n=e.players||[],i=Object.fromEntries(n.map(r=>[r.id,r]));return`
    <style>
      details.round-details-expand[open] svg.chevron-icon {
        transform: rotate(180deg);
      }
    </style>
    <div class="panel admin-panel">
      <span class="panel-label">Gerenciar Rodadas</span>
      
      <div class="admin-rounds-list" style="display: flex; flex-direction: column; gap: 16px; margin-top: 12px;">
        ${t.map(r=>{const s=r.deadline?new Date(new Date(r.deadline).getTime()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10):"",o=r.active?'<span style="background: var(--color-green); color: #000; padding: 2px 6px; border-radius: var(--radius-sm); font-size: 0.72rem; font-weight: 700; text-transform: uppercase;">Ativa</span>':'<span style="background: var(--color-steel); color: var(--color-ash); padding: 2px 6px; border-radius: var(--radius-sm); font-size: 0.72rem; font-weight: 700; text-transform: uppercase;">Inativa</span>',c=(e.allMatches||[]).filter(l=>l.round_number===r.number);return`
            <div class="round-management-card" style="padding: 16px; background: var(--color-iron); border-radius: var(--radius-md); border: 1.5px solid ${r.active?"var(--color-signal-blue)":"rgba(255,255,255,0.04)"}; display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                <h4 style="margin: 0; font-size: 1rem; color: var(--color-paper);">${r.name}</h4>
                ${o}
              </div>
              
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.76rem; color: var(--color-ash); font-weight: 600; text-transform: uppercase;">Prazo de Encerramento</label>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <input type="date" class="round-deadline-input" data-round="${r.number}" value="${s}" style="background: var(--color-graphite); color: var(--color-paper); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-sm); padding: 6px 10px; font-family: sans-serif; font-size: 0.82rem; outline: none; flex: 1;" />
                  <button class="button button-secondary" data-action="saveRoundDeadline" data-round="${r.number}" style="height: 32px; min-height: auto; font-size: 0.76rem; padding: 0 12px; margin: 0; font-family: 'Fixture', sans-serif; font-weight: 700; text-transform: uppercase;">Salvar</button>
                </div>
              </div>

              <div style="display: flex; gap: 8px; margin-top: 4px;">
                ${r.active?`<button class="button button-secondary" data-action="deactivateRound" data-round="${r.number}" style="flex: 1; height: 32px; min-height: auto; margin: 0; font-family: 'Fixture', sans-serif; font-weight: 700; text-transform: uppercase; border-color: var(--color-red); color: var(--color-red);">Encerrar Rodada</button>`:`<button class="button button-primary" data-action="activateRound" data-round="${r.number}" style="flex: 1; height: 32px; min-height: auto; margin: 0; font-family: 'Fixture', sans-serif; font-weight: 700; text-transform: uppercase; background: var(--color-signal-blue); border-color: var(--color-signal-blue);">Começar Rodada</button>`}
              </div>

              <!-- DROPDOWN DE CONFRONTOS -->
              <details class="round-details-expand" style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
                <summary style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; font-weight: 600; color: var(--color-ash); outline: none; list-style: none; user-select: none;">
                  <span>Ver Confrontos (${c.length})</span>
                  <svg class="chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s ease;"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </summary>
                
                <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
                  ${c.length===0?'<p style="font-size: 0.78rem; color: var(--color-steel); text-align: center; margin: 0;">Nenhum confronto cadastrado para esta rodada.</p>':c.map(l=>{const d=i[l.player_a_username]||{name:l.player_a_username},p=i[l.player_b_username]||{name:l.player_b_username};let g="Pendente",f="var(--color-graphite)",h="var(--color-steel)",y="Aguardando reporte";l.completed?(g="Concluído",f="rgba(0, 180, 100, 0.15)",h="#00e680",y=`Placar: <strong>${l.player_a_keys} x ${l.player_b_keys}</strong>`):l.player_a_reported&&l.player_b_reported?(g="Conflito",f="rgba(230, 80, 80, 0.15)",h="#ff6666",y=`Divergência: <strong>${l.player_a_keys} vs ${l.player_b_keys}</strong>`):(l.player_a_reported||l.player_b_reported)&&(g="Parcial",f="rgba(255, 170, 0, 0.12)",h="#ffb300",l.player_a_reported?y=`Reportado por ${d.name} (${l.player_a_keys} chaves)`:y=`Reportado por ${p.name} (${l.player_b_keys} chaves)`);const x=(e.allPicks||[]).filter(v=>v.round===r.number),R=x.filter(v=>v.player_username===l.player_a_username).map(v=>{const A=v.message.match(/[A-Z]{3}\s\d/);return A?A[0]:""}).filter(Boolean),m=x.filter(v=>v.player_username===l.player_b_username).map(v=>{const A=v.message.match(/[A-Z]{3}\s\d/);return A?A[0]:""}).filter(Boolean);let b="";return(R.length>0||m.length>0)&&(b=`
                            <div style="margin-top: 6px; display: flex; flex-direction: column; gap: 4px; font-size: 0.74rem; border-top: 1px dashed rgba(255,255,255,0.04); padding-top: 6px;">
                              ${R.length>0?`<div><span style="color: var(--color-gold); font-weight: 600;">${d.name}:</span> ${R.map(v=>`<span style="background: var(--color-graphite); padding: 2px 6px; border-radius: var(--radius-xs); margin-left: 4px; color: var(--color-paper); font-weight: bold; border: 1px solid rgba(255,255,255,0.04);">${v}</span>`).join("")}</div>`:""}
                              ${m.length>0?`<div><span style="color: var(--color-gold); font-weight: 600;">${p.name}:</span> ${m.map(v=>`<span style="background: var(--color-graphite); padding: 2px 6px; border-radius: var(--radius-xs); margin-left: 4px; color: var(--color-paper); font-weight: bold; border: 1px solid rgba(255,255,255,0.04);">${v}</span>`).join("")}</div>`:""}
                            </div>
                          `),`
                          <div style="padding: 12px; background: rgba(0,0,0,0.18); border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.02); display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; font-weight: 600; gap: 10px;">
                              <span style="color: var(--color-paper);">${d.name} <span style="color: var(--color-steel); font-weight: normal;">vs</span> ${p.name}</span>
                              <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: var(--radius-sm); background: ${f}; color: ${h}; font-weight: 700; text-transform: uppercase;">${g}</span>
                            </div>
                            <div style="font-size: 0.78rem; color: var(--color-ash); font-weight: 500;">
                              ${y}
                            </div>
                            ${b}
                          </div>
                        `}).join("")}
                </div>
              </details>
            </div>
          `}).join("")}
      </div>
    </div>
  `}function _(e){return e?e==="album"?"Álbum":e.split("_").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" "):""}function De(e){const t=e.tableTab||e.user.serie||"A",r=[...(e.standings||[]).filter(s=>s.serie===t)].sort((s,o)=>o.wins!==s.wins?o.wins-s.wins:o.keys!==s.keys?o.keys-s.keys:o.challengesCount!==s.challengesCount?o.challengesCount-s.challengesCount:o.stickersCount!==s.stickersCount?o.stickersCount-s.stickersCount:_(s.username).localeCompare(_(o.username)));return`
    <section class="page-view table-view">
      <!-- SERIES TABS BAR -->
      <div class="report-tabs" style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 12px; width: 100%;">
        <button class="tab-button" data-action="setTableTab" data-value="A" style="flex: 1; background: ${t==="A"?"var(--color-signal-blue)":"transparent"}; color: ${t==="A"?"var(--color-paper)":"var(--color-ash)"}; border: 1.5px solid ${t==="A"?"var(--color-signal-blue)":"rgba(255,255,255,0.08)"}; padding: 10px; border-radius: var(--radius-md); font-weight: 700; font-family: var(--font-display); font-size: 0.8rem; text-transform: uppercase; cursor: pointer; transition: all 0.2s;">
          Série A
        </button>
        <button class="tab-button" data-action="setTableTab" data-value="B" style="flex: 1; background: ${t==="B"?"var(--color-signal-blue)":"transparent"}; color: ${t==="B"?"var(--color-paper)":"var(--color-ash)"}; border: 1.5px solid ${t==="B"?"var(--color-signal-blue)":"rgba(255,255,255,0.08)"}; padding: 10px; border-radius: var(--radius-md); font-weight: 700; font-family: var(--font-display); font-size: 0.8rem; text-transform: uppercase; cursor: pointer; transition: all 0.2s;">
          Série B
        </button>
      </div>

      <div class="section-heading" style="margin-top: 10px;">
        <h2>Classificação</h2>
      </div>

      <!-- TABLE CONTAINER -->
      <div class="table-container" style="overflow-x: auto; width: 100%; border: 1px solid rgba(255,255,255,0.06); border-radius: var(--radius-lg); background: rgba(0,0,0,0.15); margin-top: 10px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.82rem; min-width: 580px;">
          <thead>
            <tr style="border-bottom: 1.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); color: var(--color-ash); font-family: 'Fixture', sans-serif; font-weight: 700; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.05em;">
              <th style="padding: 12px 10px; text-align: center; width: 50px;">#</th>
              <th style="padding: 12px 24px 12px 14px; width: 1%; white-space: nowrap;">Jogador</th>
              <th style="padding: 12px 10px; text-align: center; width: 70px;" title="Figurinhas Obtidas">Fig</th>
              <th style="padding: 12px 10px; text-align: center; width: 50px;" title="Vitórias">V</th>
              <th style="padding: 12px 10px; text-align: center; width: 50px;" title="Derrotas">D</th>
              <th style="padding: 12px 10px; text-align: center; width: 50px;" title="Partidas Jogadas">J</th>
              <th style="padding: 12px 10px; text-align: center; width: 60px;" title="Chaves Forjadas">Ch</th>
              <th style="padding: 12px 10px; text-align: center; width: 60px;" title="Desafios Concluídos">Des</th>
            </tr>
          </thead>
          <tbody>
            ${r.length===0?'<tr><td colspan="8" style="padding: 24px; text-align: center; color: var(--color-ash);">Nenhum jogador cadastrado nesta série.</td></tr>':r.map((s,o)=>{const c=s.username===e.user.id,l=c?"rgba(242, 193, 78, 0.06)":o%2===0?"transparent":"rgba(255,255,255,0.01)",d=c?"var(--color-gold)":"var(--color-paper)";return`
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); background: ${l}; transition: background 140ms ease;">
                      <td style="padding: 12px 10px; text-align: center; font-weight: 700; color: ${c?"var(--color-gold)":"var(--color-ash)"};">
                        ${String(o+1).padStart(2,"0")}
                      </td>
                      <td style="padding: 12px 24px 12px 14px; font-weight: 600; color: ${d}; width: 1%; white-space: nowrap;">
                        ${_(s.username)}
                      </td>
                      <td style="padding: 12px 10px; text-align: center; font-weight: 600; color: var(--color-paper);">
                        ${String(s.stickersCount).padStart(2,"0")}
                      </td>
                      <td style="padding: 12px 10px; text-align: center; font-weight: 700; color: #4cd964;">
                        ${String(s.wins).padStart(2,"0")}
                      </td>
                      <td style="padding: 12px 10px; text-align: center; font-weight: 600; color: #ff3b30;">
                        ${String(s.losses).padStart(2,"0")}
                      </td>
                      <td style="padding: 12px 10px; text-align: center; color: var(--color-ash);">
                        ${String(s.played).padStart(2,"0")}
                      </td>
                      <td style="padding: 12px 10px; text-align: center; font-weight: 700; color: var(--color-gold);">
                        ${String(s.keys).padStart(2,"0")}
                      </td>
                      <td style="padding: 12px 10px; text-align: center; font-weight: 600; color: var(--color-signal-blue);">
                        ${String(s.challengesCount).padStart(2,"0")}
                      </td>
                    </tr>
                  `}).join("")}
          </tbody>
        </table>
      </div>
      
      <!-- LEGEND / EXPLANATION -->
      <div style="margin-top: 14px; display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.7rem; color: var(--color-ash); padding: 0 4px;">
        <span><strong>Fig:</strong> Figurinhas Obtidas</span>
        <span><strong>V:</strong> Vitórias</span>
        <span><strong>D:</strong> Derrotas</span>
        <span><strong>J:</strong> Partidas Jogadas</span>
        <span><strong>Ch:</strong> Chaves Forjadas</span>
        <span><strong>Des:</strong> Desafios Concluídos</span>
      </div>
    </section>
  `}const Oe=null,k=!!Oe;async function w(e){return null}async function Ve(e,t,n,i,r){}async function He(e,t,n,i){}async function qe(e,t){}async function W(e,t,n,i,r){}async function _e(e,t,n){}async function je(e,t,n,i,r){}async function Ne(e){}async function ze(e,t){}async function Fe(e,t,n,i){}async function Ke(e,t,n,i){}async function Ge(e){}async function Ue(e,t){}async function We(e){}async function Ze(e){}let a=Y();"activeChallengeId"in a||(a.activeChallengeId=null);"confirmChallengeId"in a||(a.confirmChallengeId=null);"adminTab"in a||(a.adminTab="rounds");"selectedAdminPlayerId"in a||(a.selectedAdminPlayerId="fabio_hideki");"reportTab"in a||(a.reportTab="match");"tableTab"in a||(a.tableTab=a.user.serie||"A");const C=document.querySelector("#app");function Z(e){a.currentRoute=e,window.history.replaceState(null,"",`#${e}`),u()}async function Je(e){const t=a.packs.find(d=>d.id===e);if(!t||t.opened||t.disabled)return;t.opened=!0,t.type==="player"&&(a.user.packOpened=!0),t.id==="extra_pack"&&localStorage.setItem("foc_extra_pack_opened","true");const n=[],i=[],r=Array.isArray(t.stickerIds)?t.stickerIds:[],s=Xe(t.type),o=r.length?r:s,c=S.filter(d=>d.type===t.type),l=[];if(o.forEach(d=>{if(a.collection[d]&&a.collection[d].quantity>0||l.includes(d)){const p=c.find(g=>(!a.collection[g.id]||a.collection[g.id].quantity===0)&&!l.includes(g.id));p?l.push(p.id):l.push(d)}else l.push(d)}),t.stickerIds=l,k){await Ve(a.user.id,t.stickerIds,t.type,a.activeRound.number,a.user.name);const d=await w(a.user.id);if(d){const p=[...t.stickerIds];a=d,a.reveal={pack:t,newIds:p,duplicateIds:i}}}else t.stickerIds.forEach(d=>{a.collection[d]={quantity:1,isNew:!0,source:"pack"},n.push(d),a.stickersLog||(a.stickersLog=[]),a.stickersLog.push({round:a.activeRound.number,timestamp:new Date().toISOString(),message:`${a.user.name} obteve a figurinha ${d} via Pacotinho`,type:"pack"})}),a.reveal={pack:t,newIds:n,duplicateIds:i};u()}function j(e){a.albumPage=Math.max(0,Math.min(e,E.length-1)),u()}function Xe(e){if(e==="crest"){const n=S.filter(i=>i.type==="crest").filter(i=>!a.collection[i.id]||a.collection[i.id].quantity===0).map(i=>i.id);return(n.length?n:X).slice(0,3)}const t=$.filter(n=>!a.collection[n.id]||a.collection[n.id].quantity===0).map(n=>n.id);return(t.length?t:ae).slice(0,6)}function Ye(e){if(a.report.housesSubmitted)return;a.selectedHouseCodes||(a.selectedHouseCodes=[]);const t=a.selectedHouseCodes.indexOf(e);t>-1?a.selectedHouseCodes.splice(t,1):a.selectedHouseCodes.length<3&&a.selectedHouseCodes.push(e),u()}async function Qe(){if(a.selectedHouseCodes.length===3){if(k){await Ke(a.report.matchId,a.user.id,a.selectedHouseCodes,a.report.isPlayerA);const e=await w(a.user.id);e&&(a=e)}else a.report.housesSubmitted=!0;u()}}function Q(e,t){const n=Number(t);n<0||n>3||(e==="a"&&(a.report.playerAKeys=n),e==="b"&&(a.report.playerBKeys=n),u())}function et(e,t){if(a.report.reported&&!a.report.conflict)return;const n=e==="a"?a.report.playerAKeys:a.report.playerBKeys;Q(e,n+Number(t))}function ee(e=!0){a.report.opponentReported=!0,e?(a.report.opponentKeysA=a.report.playerAKeys,a.report.opponentKeysB=a.report.playerBKeys,a.report.confirmed=!0,a.report.conflict=!1,a.report.confirmedAt=new Date().toISOString()):(a.report.opponentKeysA=a.report.playerAKeys===3?1:3,a.report.opponentKeysB=a.report.playerBKeys===3?1:3,a.report.confirmed=!1,a.report.conflict=!0),u()}async function tt(){if(a.report.housesSubmitted){if(a.report.reported=!0,a.report.opponentReported&&(a.report.confirmed=!0,a.report.conflict=!1,a.report.confirmedAt=new Date().toISOString()),u(),k){await He(a.report.matchId,a.user.id,a.report.playerAKeys,a.report.isPlayerA);const e=await w(a.user.id);e&&(a=e)}else a.report.conflict=!1,a.report.opponentReported||(a.report.confirmed=!1,setTimeout(()=>{a.report.reported&&!a.report.opponentReported&&ee(!0)},2e3));u()}}async function at(){if(!(a.report.confirmed||a.report.completed)){if(k){await qe(a.report.matchId,a.report.isPlayerA);const e=await w(a.user.id);e&&(a=e)}else a.report.reported=!1,a.report.conflict=!1;u()}}async function nt(e){if(a.report.pickedIds.includes(e)||!ot().some(n=>n.id===e))return;const t=it();a.report.pickedIds.length>=t||(a.report.pickedIds.push(e),u())}function it(){const{eligible:e}=te();return a.report.fallbackActive||e.length===0?3:a.report.playerAKeys}function ot(){const{eligible:e,fallbackPool:t}=te();return a.report.fallbackActive||e.length===0?t:e}function te(){const e=a.selectedHouseCodes||[],t=$.filter(i=>e.includes(i.house)).filter(i=>a.opponentCollection[i.id]).filter(i=>!a.collection[i.id]||a.collection[i.id].quantity===0),n=$.filter(i=>e.includes(i.house)).filter(i=>!a.collection[i.id]||a.collection[i.id].quantity===0);return{eligible:t,fallbackPool:n}}async function st(){const e=[...a.report.pickedIds];if(k){e.length?await W(a.user.id,e,a.report.matchId,a.activeRound.number,a.user.name):await W(a.user.id,[],a.report.matchId,a.activeRound.number,a.user.name);const t=await w(a.user.id);t&&(a=t)}else e.forEach(t=>{a.collection[t]?(a.collection[t].quantity+=1,a.collection[t].isNew=!0,a.collection[t].source="pick"):a.collection[t]={quantity:1,isNew:!0,source:"pick"},a.stickersLog||(a.stickersLog=[]),a.stickersLog.push({round:a.activeRound.number,timestamp:new Date().toISOString(),message:`${a.user.name} obteve a figurinha ${t} via Pick pós-partida`,type:"pick"})}),a.report.completed=!0;e.length&&(a.reveal={pack:{id:`pick-${a.report.matchId}`,type:"player",title:"Pacotinho de picks",subtitle:`${e.length} figurinhas`,image:"/assets/pack/player_pack.webp",opened:!0,stickerIds:e},newIds:e,duplicateIds:[],ripped:!1,flippedIndexes:[]},a.currentRoute="packs",window.history.replaceState(null,"","#packs")),u()}async function rt(){if(k){const e=document.querySelector('[data-action="resetMatch"]');e&&(e.disabled=!0,e.textContent="Resetando..."),await Ge(a.report.matchId);const t=await w(a.user.id);t&&(a=t),u()}}function lt(e){const t=a.challenges.find(i=>i.id===e);!t||t.completed||t.pendingValidation||a.challenges.filter(i=>i.completed||i.pendingValidation).length>=4||(a.confirmChallengeId=e,u())}function ct(e){a.activeChallengeId=e,a.confirmChallengeId=null,u()}function dt(){a.confirmChallengeId=null,u()}async function pt(e,t){if(k){const i=(a.pendingChallenges||[]).find(o=>o.id===e&&o.playerUsername===t);if(!i)return;const r=i.pickedId;i.playerName,await je(t,e,r,a.activeRound.number);const s=await w(a.user.id);s&&(a=s)}else{const n=a.challenges.find(i=>i.id===e);if(!n)return;n.completed=!0,n.pendingValidation=!1,n.pickedId&&(a.collection[n.pickedId]?a.collection[n.pickedId].quantity+=1:a.collection[n.pickedId]={quantity:1,source:"challenge"},a.stickersLog||(a.stickersLog=[]),a.stickersLog.push({round:a.activeRound.number,timestamp:new Date().toISOString(),message:`${a.user.name} obteve a figurinha ${n.pickedId} via Desafio: ${n.title}`,type:"challenge"})),a.adminLogs||(a.adminLogs=[]),a.adminLogs.push({timestamp:new Date().toISOString(),message:`Admin aprovou o desafio "${n.title}" para ${a.user.name}`})}u()}function ut(){a.activeChallengeId=null,u()}async function gt(e,t){const n=a.challenges.find(i=>i.id===e);if(n){if(n.pendingValidation=!0,n.pickedId=t,a.activeChallengeId=null,k){await _e(a.user.id);const i=await w(a.user.id);i&&(a=i)}u()}}async function mt(e){if(k){await Ne();const t=await w(a.user.id);t&&(a=t)}else a.report.playerAKeys=0,a.report.playerBKeys=0,a.report.housesSubmitted=!0,a.report.reported=!0,a.report.confirmed=!0,a.report.completed=!0,a.report.confirmedAt=new Date().toISOString(),a.adminLogs||(a.adminLogs=[]),a.adminLogs.push({timestamp:new Date().toISOString(),message:`Confirmado W.O. (0 a 0) para a partida ${e}`});u()}async function ft(e){if(k){await ze(e,a.activeRound.number);const t=await w(a.user.id);t&&(a=t)}else a.activeRound.deadline=new Date(Date.now()+24*60*60*1e3).toISOString(),a.adminLogs||(a.adminLogs=[]),a.adminLogs.push({timestamp:new Date().toISOString(),message:`Partida ${e} descongelada. Prazo estendido por 24h.`});u()}async function ht(e,t){if(a.adminEditCollection&&a.adminEditCollection.playerId===e){const n=a.adminEditCollection.quantities[t]||0;a.adminEditCollection.quantities[t]=n+1}u()}async function bt(e,t){if(a.adminEditCollection&&a.adminEditCollection.playerId===e){const n=a.adminEditCollection.quantities[t]||0;a.adminEditCollection.quantities[t]=Math.max(0,n-1)}u()}function yt(){a.adminEditCollection=null,u()}async function vt(e){const t=a.players.find(o=>o.id===e);if(!t||!a.adminEditCollection)return;const n=t.collection||{},i=a.adminEditCollection.quantities,r=[];if(S.forEach(o=>{var d;const c=((d=n[o.id])==null?void 0:d.quantity)||0,l=i[o.id]||0;c!==l&&r.push({id:o.id,diff:l-c})}),r.length===0){a.adminEditCollection=null,u();return}const s=document.querySelector('[data-action="adminConfirmStickers"]');if(s&&(s.disabled=!0,s.textContent="Salvando..."),k)try{await Promise.all(r.map(c=>Fe(e,c.id,c.diff,t.name)));const o=await w(a.user.id);if(o){const c=a.adminTab,l=a.selectedAdminPlayerId;a=o,a.adminTab=c,a.selectedAdminPlayerId=l}}catch(o){console.error("Erro ao salvar edições de figurinhas:",o),alert("Erro ao salvar edições no banco de dados.")}else r.forEach(o=>{t.collection||(t.collection={}),t.collection[o.id]||(t.collection[o.id]={quantity:0,source:"admin"}),t.collection[o.id].quantity+=o.diff,t.collection[o.id].quantity<=0&&delete t.collection[o.id];const l=`Admin ${o.diff>0?"adicionou":"removeu"} a figurinha ${o.id} ${o.diff>0?"para":"de"} ${t.name}`;a.adminLogs||(a.adminLogs=[]),a.adminLogs.push({timestamp:new Date().toISOString(),message:l}),a.stickersLog||(a.stickersLog=[]),a.stickersLog.push({round:a.activeRound.number,timestamp:new Date().toISOString(),message:l,type:"admin"})});a.adminEditCollection=null,u()}function xt(e){a.adminTab=e,u()}async function kt(e,t){if(!t)return;const n=new Date(t+"T23:59:59").toISOString();if(k){await Ue();const i=await w(a.user.id);if(i){const r=a.adminTab,s=a.selectedAdminPlayerId;a=i,a.adminTab=r,a.selectedAdminPlayerId=s}}else{a.allRounds||(a.allRounds=[]);const i=a.allRounds.find(r=>r.number===e);i&&(i.deadline=n)}u()}async function wt(e){if(k){await We();const t=await w(a.user.id);if(t){const n=a.adminTab,i=a.selectedAdminPlayerId;a=t,a.adminTab=n,a.selectedAdminPlayerId=i}}else{a.allRounds||(a.allRounds=[]),a.allRounds.forEach(n=>n.active=!1);const t=a.allRounds.find(n=>n.number===e);t&&(t.active=!0,a.activeRound={number:t.number,name:t.name,startsAt:t.startsAt,deadline:t.deadline,sasLimit:t.sasLimit||80,active:!0})}u()}async function $t(e){if(k){await Ze();const t=await w(a.user.id);if(t){const n=a.adminTab,i=a.selectedAdminPlayerId;a=t,a.adminTab=n,a.selectedAdminPlayerId=i}}else{a.allRounds||(a.allRounds=[]);const t=a.allRounds.find(n=>n.number===e);t&&(t.active=!1,a.activeRound&&a.activeRound.number===e&&(a.activeRound.active=!1))}u()}function Ct(){return a.currentRoute==="album"?fe(a):a.currentRoute==="report"?we(a):a.currentRoute==="table"?De(a):a.currentRoute==="admin"?Te(a):ie(a)}function B(e,t,n){const i=a.currentRoute===e?"is-active":"",r=e==="report"&&!a.user.packOpened?"is-disabled":"",s=e==="packs"&&a.packs.some(o=>!o.opened)?'<span class="nav-badge"></span>':"";return`
    <button class="nav-item ${i} ${r}" data-route="${e}" ${r?"disabled":""}>
      <span class="nav-icon">${n}</span>
      <span>${t}</span>
      ${s}
    </button>
  `}function St(){return`
    <div class="login-view">
      <div class="login-card">
        <img src="foc-album/assets/logo.png" alt="Logo FOC" class="login-logo">
        <h1>Copa do Mundo do FOC 2026™</h1>
        
        <form class="login-form" id="loginForm">
          <div class="login-input-group">
            <label for="usernameInput">Login do Jogador</label>
            <input type="text" id="usernameInput" class="login-input" placeholder="Ex: fabio_hideki" required autofocus>
          </div>
          
          <button type="submit" class="login-btn" id="loginSubmitBtn">
            <span class="btn-text">Entrar no Álbum</span>
            <div class="login-spinner" id="loginSpinner"></div>
          </button>
        </form>
        
        <div class="login-error" id="loginError">Jogador não encontrado no banco de dados.</div>
      </div>
    </div>
  `}function At(){const e=document.getElementById("loginForm");e&&e.addEventListener("submit",async t=>{t.preventDefault();const n=document.getElementById("usernameInput"),i=document.getElementById("loginSubmitBtn"),r=document.getElementById("loginSpinner"),s=i.querySelector(".btn-text"),o=document.getElementById("loginError"),c=n.value.trim().toLowerCase();if(c){i.disabled=!0,r.style.display="block",s&&(s.style.display="none"),o.style.display="none";try{const l=await w(c);l?(localStorage.setItem("foc_username",c),a=l,u()):(o.textContent="Jogador não cadastrado ou erro na rede.",o.style.display="block",i.disabled=!1,r.style.display="none",s&&(s.style.display="block"))}catch(l){console.error(l),o.textContent="Erro ao conectar ao banco de dados.",o.style.display="block",i.disabled=!1,r.style.display="none",s&&(s.style.display="block")}}})}function u(){if(k&&!localStorage.getItem("foc_username")){C.innerHTML=St(),At();return}const e=C.querySelector(".app-main"),t=e?e.scrollTop:0;a.packs.filter(s=>!s.opened).length;const n=Object.keys(a.collection).filter(s=>{const o=T(s);return o&&o.type==="player"}).length;C.innerHTML=`
    <div class="app-shell">
      <header class="app-header">
        <div class="header-logo-container">
          <img src="/assets/logo.png" alt="Logo FOC" class="header-logo" />
          <h1 class="header-title">Copa do Mundo do <br class="mobile-only-break" />FOC 2026™</h1>
        </div>
        <div class="header-actions" style="display: flex; gap: 8px; align-items: center;">
          ${k?`
            <button class="button button-secondary" data-action="logout" type="button" style="height: 32px; min-height: auto; font-size: 0.72rem; padding: 0 10px; border-radius: var(--radius-sm); border-color: rgba(255,255,255,0.08); font-family: 'Fixture', sans-serif; font-weight: 700; text-transform: uppercase;">Sair</button>
          `:""}
          ${a.user.isAdmin?`
            <button class="header-admin-btn" data-route="admin" type="button" aria-label="Painel Admin">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          `:""}
        </div>
      </header>

      <main class="app-main">
        <section class="panel collection-summary" style="margin-bottom: 20px;">
          <div>
            <span class="panel-label">Coleção atual</span>
            <strong>${n}/27</strong>
          </div>
          <div class="meter"><span style="width: ${n/27*100}%"></span></div>
        </section>
        ${Ct()}
      </main>

      <nav class="bottom-nav">
        ${B("packs","Pacotinhos",'<svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;"><path d="M80 90L75 84L70 90L65 84L60 90L55 84L50 90L45 84L40 90L35 84L30 90L25 84L20 90V10L25 16L30 10L35 16L40 10L45 16L50 10L55 16L60 10L65 16L70 10L75 16L80 10V90ZM39.8701 51.3975C34.4191 51.3977 30.0002 55.8166 30 61.2676V71.1387C30.0001 76.5898 34.419 81.0086 39.8701 81.0088H60.1299C65.581 81.0086 69.9999 76.5898 70 71.1387C70 65.6875 65.581 61.2678 60.1299 61.2676H70C69.9998 55.8166 65.5809 51.3977 60.1299 51.3975H39.8701ZM39.8701 19.9912C34.4191 19.9914 30.0002 24.4103 30 29.8613H39.8701C34.419 29.8616 30 34.2812 30 39.7324V49.6025H70V39.7324H60.1299C65.581 39.7322 69.9999 35.3125 70 29.8613C69.9998 24.4103 65.5809 19.9914 60.1299 19.9912H39.8701Z" fill="currentColor"/></svg>')}
        ${B("album","Álbum",'<svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;"><path d="M83 90H23V10H83V90ZM42.8701 51.3975C37.4191 51.3977 33.0002 55.8166 33 61.2676V71.1387C33.0001 76.5898 37.419 81.0086 42.8701 81.0088H63.1299C68.581 81.0086 72.9999 76.5898 73 71.1387C73 65.6875 68.581 61.2678 63.1299 61.2676H73C72.9998 55.8166 68.5809 51.3977 63.1299 51.3975H42.8701ZM42.8701 19.9912C37.4191 19.9914 33.0002 24.4103 33 29.8613H42.8701C37.419 29.8616 33 34.2812 33 39.7324V49.6025H73V39.7324H63.1299C68.581 39.7322 72.9999 35.3125 73 29.8613C72.9998 24.4103 68.5809 19.9914 63.1299 19.9912H42.8701Z" fill="currentColor"/><rect x="18" y="10" width="4" height="80" fill="currentColor"/></svg>')}
        ${B("report","Reporte",'<svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;"><path d="M69 10C75.0751 10 80 14.9249 80 21V79C80 85.0751 75.0751 90 69 90H31C24.9249 90 20 85.0751 20 79V21C20 14.9249 24.9249 10 31 10H69ZM44.7334 53.1758L40.9805 50.0947C36.1342 46.1153 28.9794 46.8178 25 51.6641L36.4912 61.0996C36.9512 61.4773 37.4328 61.8126 37.9297 62.1064L46.3887 69.0518L75.5879 33.4922L66.8125 26.2861L44.7334 53.1758Z" fill="currentColor"/></svg>')}
        ${B("table","Tabela",'<svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;"><path d="M69 10C75.0751 10 80 14.9249 80 21V79C80 85.0751 75.0751 90 69 90H31C24.9249 90 20 85.0751 20 79V21C20 14.9249 24.9249 10 31 10H69ZM34 74H66V66H34V74ZM34 61H66V53H34V61ZM34 48H66V41H34V48ZM34 28V36H66V28H34Z" fill="currentColor"/></svg>')}
      </nav>

      ${Pt()}
      ${ve(a)}
      ${xe(a)}
    </div>
  `,C.querySelectorAll("[data-route]").forEach(s=>{s.addEventListener("click",()=>Z(s.dataset.route))}),C.querySelectorAll("[data-action]").forEach(s=>{s.addEventListener("click",()=>{const o=s.dataset.action,c=s.dataset.value;if(o==="setReportTab"){a.reportTab=c,u();return}if(o==="setTableTab"){a.tableTab=c,u();return}if(o==="logout"){localStorage.removeItem("foc_username"),a=Y(),u();return}if(o==="openPack"&&Je(c),o==="viewSticker"&&It(c,s),o==="closeHighlight"&&Rt(),o==="pagePrev"){const l=window.jQuery("#album-flipbook");l.length&&typeof l.turn=="function"&&l.turn("is")?l.turn("previous"):j(a.albumPage-1)}if(o==="pageNext"){const l=window.jQuery("#album-flipbook");l.length&&typeof l.turn=="function"&&l.turn("is")?l.turn("next"):j(a.albumPage+1)}if(o==="setPage"){const l=Number(c),d=window.jQuery("#album-flipbook");d.length&&typeof d.turn=="function"&&d.turn("is")?d.turn("page",l+1):j(l)}if(o==="toggleHouse"&&Ye(c),o==="adjustKeys"){const l=s.dataset.side,d=Number(s.dataset.amount);et(l,d)}if(o==="simulateOpponent"&&ee(c==="consistent"),o==="submitHouses"&&Qe(),o==="reportMatch"&&tt(),o==="editReport"&&at(),o==="pickSticker"&&nt(c),o==="completePicks"&&st(),o==="resetMatch"&&rt(),o==="goAlbum"&&Z("album"),o==="claimChallenge"&&lt(c),o==="confirmChallenge"&&ct(c),o==="cancelChallenge"&&dt(),o==="closeChallengePicke"&&ut(),o==="approveChallenge"){const l=s.dataset.player;pt(c,l)}if(o==="pickChallengeSticker"){const l=s.dataset.challenge;gt(l,c)}if(o==="setAdminTab"&&xt(c),o==="confirmWO"&&mt(c),o==="unfreezeMatch"&&ft(c),o==="adminAddSticker"){const l=s.dataset.player;ht(l,c)}if(o==="adminRemoveSticker"){const l=s.dataset.player;bt(l,c)}if(o==="adminCancelStickers"&&yt(),o==="adminConfirmStickers"){const l=s.dataset.player;vt(l)}if(o==="saveRoundDeadline"){const l=Number(s.dataset.round),d=C.querySelector(`.round-deadline-input[data-round="${l}"]`);d&&kt(l,d.value)}if(o==="activateRound"){const l=Number(s.dataset.round);wt(l)}if(o==="deactivateRound"){const l=Number(s.dataset.round);$t(l)}})});const i=C.querySelector("#adminPlayerSelect");if(i&&i.addEventListener("change",()=>{a.selectedAdminPlayerId=i.value,u()}),C.querySelectorAll("[data-keys]").forEach(s=>{s.addEventListener("change",()=>Q(s.dataset.keys,s.value))}),a.currentRoute==="album"&&me(a),a.currentRoute==="packs"&&re(a),a.currentRoute==="report"&&Pe(a),a.currentRoute==="packs"&&a.reveal&&a.reveal.ripped&&C.querySelectorAll(".flip-card.is-flipped .sticker-card").forEach(s=>{N(s)}),a.highlightedStickerId){const s=document.getElementById("highlightOverlay"),o=document.getElementById("highlightCard3D");if(o&&P&&s){const c=o.getBoundingClientRect(),l=P,d=l.width/c.width,p=l.height/c.height,g=l.left+l.width/2-(c.left+c.width/2),f=l.top+l.height/2-(c.top+c.height/2);s.style.opacity="0",o.style.transform=`translate(${g}px, ${f}px) scale(${d}, ${p})`,o.style.opacity="0",o.style.transition="none",o.getBoundingClientRect(),requestAnimationFrame(()=>{s.style.transition="opacity 0.28s ease",s.style.opacity="1",o.style.transition="transform 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.28s ease",o.style.transform="translate(0,0) scale(1)",o.style.opacity="1"});const h=o.querySelector(".sticker-card");h&&N(h)}else if(o){const c=o.querySelector(".sticker-card");c&&N(c)}}const r=C.querySelector(".app-main");r&&(r.scrollTop=t)}let P=null;function It(e,t){a.collection[e]&&(a.collection[e].isNew=!1),t&&(P=t.getBoundingClientRect()),a.highlightedStickerId=e,u()}function Rt(){const e=document.getElementById("highlightOverlay"),t=document.getElementById("highlightCard3D");if(e&&t&&P){const n=t.getBoundingClientRect(),i=P,r=i.width/n.width,s=i.height/n.height,o=i.left+i.width/2-(n.left+n.width/2),c=i.top+i.height/2-(n.top+n.height/2);e.classList.add("is-leaving"),t.style.transition="transform 0.32s cubic-bezier(0.4, 0, 1, 1), opacity 0.28s ease",t.style.transform=`translate(${o}px, ${c}px) scale(${r}, ${s})`,t.style.opacity="0",e.style.transition="opacity 0.32s ease",e.style.opacity="0",setTimeout(()=>{a.highlightedStickerId=null,P=null,u()},340)}else a.highlightedStickerId=null,P=null,u()}function Pt(){if(!a.highlightedStickerId)return"";const e=a.highlightedStickerId,t=a.collection[e];let n="";if(t&&t.source)if(t.source==="pack")n="Pacotinho inicial.";else if(t.source==="pick"){const i=a.matches.find(s=>s.id===a.report.matchId),r=a.activeRound.number;i?n=`Rodada ${r}: ${i.playerA} x ${i.playerB}`:n=`Rodada ${r}: Pick pós-partida.`}else if(t.source==="challenge"){const i=a.challenges.find(r=>r.pickedId===e);i?n=`Desafio: ${i.title}.`:n="Conclusão de Desafio."}else t.source==="admin"&&(n="Ajuste de Administrador.");return`
    <div class="highlight-overlay" id="highlightOverlay">
      <div class="highlight-overlay-bg" data-action="closeHighlight"></div>
      <div class="highlight-content">
        <button class="close-highlight-btn" data-action="closeHighlight">✕</button>
        <div class="highlight-card-wrapper" id="highlightCard3D">
          ${D(e,a.collection,{forceOwned:!0})}
        </div>
        ${n?`<p class="highlight-source-label">${n}</p>`:""}
      </div>
    </div>
  `}function N(e){if(!e)return;let t=0,n=0,i=0,r=0,s=null,o=!1;const c=.12,l=.8,d=20;function p(m,b,v){return Math.min(Math.max(m,b),v)}function g(m,b=100){return Math.round(m*b)/b}function f(m,b,v,A,L,M,O,V){e.style.setProperty("--rotate-x",`${m}deg`),e.style.setProperty("--rotate-y",`${b}deg`),e.style.setProperty("--pointer-x",`${v}%`),e.style.setProperty("--pointer-y",`${A}%`),e.style.setProperty("--pointer-from-left",L),e.style.setProperty("--pointer-from-top",M),e.style.setProperty("--pointer-from-center",g(O)),e.style.setProperty("--card-opacity",g(V)),e.style.transform=`perspective(900px) rotateX(${m}deg) rotateY(${b}deg) scale3d(1.04,1.04,1.04)`}function h(){const m=t-i,b=n-r;i+=m*c,r+=b*c,i*=l+(1-l),r*=l+(1-l),Math.abs(m)>.05||Math.abs(b)>.05?s=requestAnimationFrame(h):(i=t,r=n,s=null)}function y(m){const b=e.getBoundingClientRect(),v=m.touches?m.touches[0].clientX:m.clientX,A=m.touches?m.touches[0].clientY:m.clientY;if(!o)return;const L=v-b.left,M=A-b.top,O=p(g(100/b.width*L),0,100),V=p(g(100/b.height*M),0,100),H=p(L/b.width,0,1),q=p(M/b.height,0,1),z=Math.sqrt((H-.5)**2+(q-.5)**2)*2;n=g(p((H-.5)*d*2,-d,d)),t=g(p((q-.5)*-d*2,-d,d)),f(i,r,O,V,H,q,z,Math.min(1,z+.1)),s||(s=requestAnimationFrame(h)),m.cancelable&&m.preventDefault()}function x(m){o=!0,e.classList.add("is-active"),e.style.transition="none",y(m)}function R(){o=!1,e.classList.remove("is-active"),t=0,n=0,e.style.transition="transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease",e.style.transform="perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)",e.style.setProperty("--card-opacity","0"),s&&(cancelAnimationFrame(s),s=null)}e.addEventListener("mouseenter",x),e.addEventListener("mousemove",y),e.addEventListener("mouseleave",R),e.addEventListener("touchstart",x,{passive:!1}),e.addEventListener("touchmove",y,{passive:!1}),e.addEventListener("touchend",R),e.addEventListener("touchcancel",R)}async function Tt(){const e=window.location.hash.replace("#","");if(["packs","album","report","challenges","admin"].includes(e)&&(a.currentRoute=e),k){const t=localStorage.getItem("foc_username");if(t){C.innerHTML=`
        <div class="login-view">
          <div class="login-spinner" style="display: block;"></div>
        </div>
      `;try{const n=await w(t);n?(a=n,["packs","album","report","challenges","admin"].includes(e)&&(a.currentRoute=e)):localStorage.removeItem("foc_username")}catch(n){console.error("Erro carregando estado inicial do banco:",n),localStorage.removeItem("foc_username")}}}u()}Tt();

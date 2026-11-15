// Desktop-only reader. Uses the existing renderer/tweens; mobile keeps its reader.
const DREAD={book:null,pending:null,stage:'idle',hinge:new Tw([0]),pages:[],index:0,leaf:null,turn:null,box:null};

function requestDesktopRead(){
  if(MOBILE||!S.active||DREAD.book||DREAD.pending)return;
  DREAD.pending=S.active;
  setPhase('desktopLoading');
  dRead.disabled=true;
  dRead.setAttribute('aria-busy','true');
  postReaderBook('ashen-press:desktop-read',S.active.data);
}

addEventListener('message',event=>{
  if(event.source!==window.parent||event.data?.type!=='ashen-press:desktop-pages'||MOBILE)return;
  const B=DREAD.pending;
  if(!B||S.active!==B||event.data.id!==B.data.id)return;
  DREAD.pending=null;
  dRead.disabled=false;dRead.removeAttribute('aria-busy');
  if(!Array.isArray(event.data.pages)||!event.data.pages.length){
    setPhase('selected');return;
  }
  startDesktopRead(B,event.data.pages);
});

function startDesktopRead(B,pages){
  DREAD.book=B;DREAD.pages=pages;DREAD.index=-1;DREAD.stage='opening';
  DREAD.saved={p:B.tActiveP.v.slice(),r:B.tActiveR.v.slice(),hover:B.tHover.v.slice(),tilt:B.tTilt.v.slice(),
    coverPosition:B.cover.position.clone(),coverRotation:B.cover.rotation.clone(),side:B.coverMat.side};
  dragReset();ORB.tx=ORB.x;ORB.ty=ORB.y;
  B.sWob.start([0,0,0]);
  B.tHover.start([0,0,0],REDUCED?1:600,activeEase);
  B.tTilt.start([0,0,0],REDUCED?1:600,activeEase);
  const hinge=new THREE.Group();
  hinge.position.set(-SZW/2,0,DREAD.saved.coverPosition.z);
  B.gScl.add(hinge);hinge.add(B.cover);
  B.cover.position.set(SZW/2,0,0);B.cover.rotation.set(0,0,0);
  B.coverMat.side=THREE.DoubleSide;B.coverMat.needsUpdate=true;
  B.coverMat.uniforms.uInsidePaper.value=true;
  DREAD.coverHinge=hinge;
  const lining=new THREE.Mesh(new THREE.PlaneGeometry(SZW,SZH),new THREE.MeshBasicMaterial({color:0xffffff}));
  lining.position.set(SZW/2,0,-0.002);lining.rotation.y=Math.PI;lining.layers.set(LAY_FG);hinge.add(lining);DREAD.lining=lining;
  // The page block is on the right; the white left lining stays attached to the cover.
  const paper=new THREE.Mesh(new THREE.PlaneGeometry(SZW,SZH),new THREE.MeshBasicMaterial({color:0xfaf9f5}));
  paper.position.set(0,0,DREAD.saved.coverPosition.z+0.012);
  paper.layers.set(LAY_FG);paper.visible=false;B.gScl.add(paper);DREAD.paper=paper;
  createDesktopPages();fitDesktopRead(REDUCED?1:700);
  DREAD.hinge.set([0]);DREAD.hinge.start([-Math.PI],REDUCED?1:740,activeEase,REDUCED?0:520);
  setPhase('desktopReading');
  dRead.hidden=true;dRead.style.display='none';
  dClose.setAttribute('aria-label','Close reading book');
  document.body.style.cursor='default';
  window.parent.postMessage({type:'ashen-press:desktop-reading',active:true},'*');
  wakeRender();
}

function fitDesktopRead(duration=0){
  const B=DREAD.book;if(!B||DREAD.stage==='closing')return;
  ORB.tx=ORB.x;ORB.ty=ORB.y;
  const card=detailEl.getBoundingClientRect();
  const left=Math.max(card.right+26,VW*0.30),right=VW-32;
  const ratio=2*SZW/SZH;
  const width=Math.min(Math.max(120,right-left),VH*0.78*ratio);
  const height=width/ratio;
  DREAD.box={x:left+(right-left-width)/2,y:(VH-height)/2-12,width,height};
  const box=DREAD.box;
  const pageZ=DREAD.saved.coverPosition.z+0.012;
  const distance=SZH*VH/(2*Math.tan(camera.fov*Math.PI/360)*height);
  const ndcX=((box.x+width*0.75)/VW)*2-1,ndcY=1-((box.y+height/2)/VH)*2;
  // Move the actual book closer, keeping its world dimensions and camera unchanged.
  const position=new THREE.Vector3(ndcX*distance*Math.tan(camera.fov*Math.PI/360)*camera.aspect,
    ndcY*distance*Math.tan(camera.fov*Math.PI/360),-distance-pageZ);
  position.applyQuaternion(camera.quaternion).add(camera.position);
  const rotation=new THREE.Euler().setFromQuaternion(camera.quaternion,'XYZ');
  if(duration){B.tActiveP.start(position.toArray(),duration,activeEase);B.tActiveR.start([rotation.x,rotation.y,rotation.z],duration,activeEase);}
  else{B.tActiveP.set(position.toArray());B.tActiveR.set([rotation.x,rotation.y,rotation.z]);}
  Object.assign(DREAD.element.style,{left:box.x+'px',top:box.y+'px',width:width+'px',height:height+'px'});
  wakeRender();
}

function closeDesktopRead(){
  if(DREAD.pending){DREAD.pending=null;dRead.disabled=false;dRead.removeAttribute('aria-busy');setPhase('selected');return;}
  const B=DREAD.book;if(!B||DREAD.stage==='closing')return;
  DREAD.stage='closing';DREAD.element.classList.remove('is-visible');
  DREAD.turn?.cancel();DREAD.turn=null;DREAD.leaf?.remove();DREAD.leaf=null;
  DREAD.hinge.start([0],REDUCED?1:550,activeEase);
  const saved=DREAD.saved,delay=REDUCED?0:550,duration=REDUCED?1:650;
  B.tActiveP.start(saved.p,duration,activeEase,delay);B.tActiveR.start(saved.r,duration,activeEase,delay);
  B.tHover.start(saved.hover,duration,activeEase,delay);B.tTilt.start(saved.tilt,duration,activeEase,delay);
  wakeRender();
}

function updateDesktopRead(){
  const B=DREAD.book;if(!B)return;
  DREAD.hinge.update();DREAD.coverHinge.rotation.y=DREAD.hinge.v[0];
  DREAD.paper.visible=DREAD.hinge.v[0]<-1.5;
  if(DREAD.stage==='opening'&&!DREAD.hinge.d){
    DREAD.stage='reading';DREAD.element.classList.add('is-visible');
    DREAD.element.querySelector('.in-book-page:not(.in-book-endpaper)')?.focus({preventScroll:true});
  }
  if(DREAD.stage==='closing'&&!DREAD.hinge.d&&!B.tActiveP.d){
    B.gScl.add(B.cover);B.cover.position.copy(DREAD.saved.coverPosition);B.cover.rotation.copy(DREAD.saved.coverRotation);
    B.coverMat.side=DREAD.saved.side;B.coverMat.needsUpdate=true;
    B.coverMat.uniforms.uInsidePaper.value=false;
    B.gScl.remove(DREAD.coverHinge,DREAD.paper);DREAD.paper.geometry.dispose();DREAD.paper.material.dispose();
    DREAD.lining.geometry.dispose();DREAD.lining.material.dispose();
    DREAD.element.remove();DREAD.book=null;DREAD.pages=[];DREAD.stage='idle';DREAD.element=null;
    dRead.hidden=false;dRead.style.removeProperty('display');dRead.disabled=false;
    dClose.setAttribute('aria-label','Close book details');setPhase('selected');
    dRead.focus({preventScroll:true});
    window.parent.postMessage({type:'ashen-press:desktop-reading',active:false},'*');
  }
}

function applyDesktopReadPose(B){
  // A front-facing, still volume keeps both pages readable while preserving the card.
  if(DREAD.stage!=='closing')B.gWob.rotation.set(0,0,0);
}

function makeDesktopPage(index){
  const page=document.createElement('article');page.className='in-book-page';
  page.tabIndex=0;page.setAttribute('role','button');page.setAttribute('aria-label','Read page; click or press Enter to turn');
  if(index<0){
    page.classList.add('in-book-endpaper');page.removeAttribute('tabindex');page.removeAttribute('role');
    page.setAttribute('aria-label','White lining of the front cover');return page;
  }
  const data=DREAD.pages[index];
  if(data){
    const chapter=document.createElement('small');chapter.textContent=data.chapter;
    const heading=document.createElement('h2');heading.textContent=data.heading;
    page.append(chapter,heading);
    for(const text of data.paragraphs){const p=document.createElement('p');p.textContent=text;page.append(p);}
  }
  if(index>=DREAD.pages.length){
    const end=document.createElement('h2');end.textContent='The End';
    const hint=document.createElement('p');hint.textContent='Use the left page to go back.';
    page.append(end,hint);return page;
  }
  if(index===DREAD.pages.length-1){const end=document.createElement('p');end.className='in-book-end';end.textContent='The End';page.append(end);}
  const number=document.createElement('small');number.className='in-book-number';number.textContent=String(index+1);page.append(number);
  return page;
}

function renderDesktopSpread(){
  DREAD.element.replaceChildren(makeDesktopPage(DREAD.index),makeDesktopPage(DREAD.index+1));
  const note=document.createElement('div');note.className='in-book-instruction';note.setAttribute('aria-live','polite');
  note.textContent=DREAD.index+2>=DREAD.pages.length?'The End · Left page: back':'Right page: forward · Left page: back · Hover near an outer edge or click';
  DREAD.element.append(note);
}

function turnDesktopPage(direction=1){
  if(DREAD.stage!=='reading'||DREAD.turn)return;
  const next=DREAD.index+2*direction;
  if(next<-1||next>=DREAD.pages.length)return;
  const backward=direction<0;
  const leaf=document.createElement('div');leaf.className='in-book-leaf';
  const currentPage=DREAD.element.children[backward?0:1];
  const {width,height}=currentPage.getBoundingClientRect();
  const front=makeDesktopPage(backward?next+1:DREAD.index+1),back=makeDesktopPage(backward?DREAD.index:next);
  const animations=[],count=24,steps=28,duration=REDUCED?1:940;
  const options={duration,easing:'cubic-bezier(.38,.04,.2,1)',fill:'forwards'};
  for(const page of [front,back]){
    page.removeAttribute('tabindex');page.removeAttribute('role');page.classList.remove('in-book-endpaper');
    page.setAttribute('aria-hidden','true');page.style.width=width+'px';page.style.height=height+'px';
  }
  // Each narrow slice follows the same continuous bent sheet. Only transforms animate.
  for(let i=0;i<count;i++){
    const strip=document.createElement('div');strip.className='in-book-strip';
    const stripWidth=width/count;strip.style.width=(stripWidth+1.5)+'px';
    for(const [side,template] of [['front',front],['back',back]]){
      const face=document.createElement('div');face.className='in-book-strip-face '+side;
      const content=template.cloneNode(true);
      content.style.left=-(side==='front'?i:count-1-i)*stripWidth+'px';
      face.append(content);strip.append(face);
      if(side===(backward?'back':'front'))content.scrollTop=currentPage.scrollTop;
    }
    const keys=[];
    for(let step=0;step<=steps;step++){
      const p=backward?1-step/steps:step/steps,bend=Math.sin(Math.PI*p),u=i/count;
      let x=0,z=0;
      for(let segment=0;segment<i;segment++){
        const s=(segment+0.5)/count;
        const angle=Math.PI*p+0.72*bend*(2*s-1);
        x+=stripWidth*Math.cos(angle);z+=stripWidth*Math.sin(angle);
      }
      const angle=Math.PI*p+0.72*bend*(2*(i+0.5)/count-1);
      const flutter=5*bend*u*u*Math.sin(2*Math.PI*p+u*2);
      keys.push({transform:`translate3d(${x}px,${flutter}px,${z}px) rotateY(${-angle*180/Math.PI}deg)`});
    }
    leaf.append(strip);animations.push(strip.animate(keys,options));
  }
  const shadow=document.createElement('div');shadow.className='in-book-turn-shadow';leaf.prepend(shadow);
  animations.push(shadow.animate([
    {opacity:0,transform:'scaleX(.08)'},
    {opacity:0.23,transform:'scaleX(.82)',offset:0.42},
    {opacity:0,transform:'scaleX(.08)'}
  ],options));
  DREAD.leaf=leaf;
  DREAD.element.children[backward?0:1].replaceWith(makeDesktopPage(backward?next:next+1));DREAD.element.append(leaf);
  DREAD.turn={cancel:()=>{for(const animation of animations)animation.cancel();}};
  animations[0].onfinish=()=>{
    if(DREAD.leaf!==leaf)return;
    DREAD.turn.cancel();DREAD.turn=null;DREAD.leaf=null;DREAD.index=next;renderDesktopSpread();
    DREAD.element.querySelector('.in-book-page:not(.in-book-endpaper)')?.focus({preventScroll:true});
  };
}

function createDesktopPages(){
  if(!document.getElementById('in-book-style')){
    const style=document.createElement('style');style.id='in-book-style';style.textContent=`
      .in-book-spread{--page-inset:clamp(6px,.6vw,10px);position:fixed;z-index:45;display:grid;grid-template-columns:1fr 1fr;padding:var(--page-inset);perspective:4200px;opacity:0;pointer-events:none;transition:opacity .16s;isolation:isolate;color:#241a12}
      .in-book-spread::after{content:'';position:absolute;top:var(--page-inset);bottom:var(--page-inset);left:50%;width:22px;transform:translateX(-50%);background:linear-gradient(90deg,transparent,rgba(72,48,28,.08) 35%,rgba(52,32,17,.28) 49%,rgba(255,255,255,.55) 52%,rgba(72,48,28,.10) 65%,transparent);pointer-events:none;z-index:1}
      .in-book-spread.is-visible{opacity:1;pointer-events:auto}
      .in-book-page{min-width:0;min-height:0;margin:0;overflow:auto;overscroll-behavior:contain;padding:clamp(18px,2.2vw,38px);background:#faf9f5;border:1px solid #ddcfb7;box-shadow:0 2px #e5dac5,0 3px #fffaf0,0 4px #d5c8b0,inset -12px 0 18px -18px #3a2618;font:600 clamp(16px,1.1vw,20px)/1.5 'EB Garamond',Georgia,serif;cursor:pointer;scrollbar-width:thin;text-align:left;user-select:text}
      .in-book-page.in-book-endpaper{opacity:0;pointer-events:none;border:0;box-shadow:none}
      .in-book-page:nth-child(2){box-shadow:inset 12px 0 18px -18px #3a2618}
      .in-book-page h2{font:600 clamp(23px,1.7vw,32px)/1.12 'EB Garamond',Georgia,serif;margin:12px 0 20px;overflow-wrap:anywhere}
      .in-book-page p{margin:0 0 15px}.in-book-page small{font:600 11px/1.4 Inter,sans-serif;letter-spacing:.07em}
      .in-book-page:focus-visible{outline:2px solid #796449;outline-offset:-3px}
      .in-book-number{display:block;text-align:center;margin-top:24px;color:#6d604f}
      .in-book-end{text-align:center;font-style:italic;font-size:25px;padding-top:15px}
      .in-book-instruction{position:absolute;top:calc(100% + 12px);left:0;width:100%;text-align:center;font:600 12px/1.4 Inter,sans-serif;color:#241a12}
      .in-book-leaf{position:absolute;left:50%;top:var(--page-inset);width:calc(50% - var(--page-inset));height:calc(100% - 2 * var(--page-inset));transform-style:preserve-3d;pointer-events:none;z-index:2}
      .in-book-strip{position:absolute;left:0;top:0;height:100%;transform-origin:left center;transform-style:preserve-3d;will-change:transform}
      .in-book-strip-face{position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;contain:paint;background:#faf9f5}
      .in-book-strip-face.back{transform:rotateY(180deg)}
      .in-book-strip-face .in-book-page{position:absolute;top:0;overflow:hidden;box-shadow:none;border:0;pointer-events:none}
      .in-book-turn-shadow{position:absolute;inset:0;transform-origin:left center;background:linear-gradient(90deg,#392615,transparent);pointer-events:none}
      @media(prefers-reduced-motion:reduce){.in-book-spread{transition:none}}
    `;document.head.append(style);
  }
  const element=document.createElement('div');element.className='in-book-spread';element.setAttribute('role','group');element.setAttribute('aria-label',DREAD.book.data.title+' story pages');
  DREAD.element=element;renderDesktopSpread();document.body.append(element);
  let down=null,hoverSide=0;
  element.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch'||DREAD.stage!=='reading'||DREAD.turn)return;
    const box=DREAD.box,x=event.clientX-box.x,edge=Math.min(42,box.width*0.055);
    const side=x<edge?-1:x>box.width-edge?1:0;
    if(side===hoverSide)return;
    hoverSide=side;
    if(side)turnDesktopPage(side);
  });
  element.addEventListener('pointerleave',()=>{hoverSide=0;});
  element.addEventListener('pointerdown',event=>{
    event.stopPropagation();const page=event.target.closest('.in-book-page:not(.in-book-endpaper)');
    down=page?{x:event.clientX,y:event.clientY,scroll:page.scrollTop}:null;
  });
  element.addEventListener('click',event=>{
    event.stopPropagation();const page=event.target.closest('.in-book-page:not(.in-book-endpaper)');
    if(!page)return;
    const scroll=page.scrollTop;
    if(!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>6||Math.abs(scroll-down.scroll)>3||window.getSelection()?.toString())return;
    turnDesktopPage(page===element.children[0]?-1:1);
  });
  element.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();turnDesktopPage(event.target.closest('.in-book-page')===element.children[0]?-1:1);}});
}

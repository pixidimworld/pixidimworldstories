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

addEventListener('message',async event=>{
  if(event.source!==window.parent||event.data?.type!=='ashen-press:desktop-pages'||MOBILE)return;
  const B=DREAD.pending;
  if(!B||S.active!==B||event.data.id!==B.data.id)return;
  if(B.data.id==='the-great-climber'){
    await document.fonts.load('600 20px "EB Garamond"').catch(()=>{});
    if(DREAD.pending!==B||S.active!==B)return;
  }
  if(!DREAD.PageFlip){
    const url=URL.createObjectURL(new Blob([__PAGE_FLIP_SOURCE__],{type:'text/javascript'}));
    try{DREAD.PageFlip=(await import(url)).PageFlip;}
    catch(error){DREAD.pending=null;dRead.disabled=false;dRead.removeAttribute('aria-busy');setPhase('selected');console.error('Reader animation failed to load.',error);return;}
    finally{URL.revokeObjectURL(url);}
    if(DREAD.pending!==B||S.active!==B)return;
  }
  DREAD.pending=null;
  dRead.disabled=false;dRead.removeAttribute('aria-busy');
  if(!Array.isArray(event.data.pages)||!event.data.pages.length){
    setPhase('selected');return;
  }
  startDesktopRead(B,event.data.pages);
});

function startDesktopRead(B,pages){
  DREAD.book=B;DREAD.pages=pages;DREAD.index=-1;DREAD.stage='opening';
  DREAD.sourcePages=pages;DREAD.paginated=B.data.id==='the-great-climber';DREAD.paginationSize=null;
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
  if(DREAD.flip){disposeDesktopFlip();renderDesktopSpread();}
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
  if(DREAD.paginated)paginateDesktopStory();
  mountDesktopFlip();
  wakeRender();
}

function closeDesktopRead(){
  if(DREAD.pending){DREAD.pending=null;dRead.disabled=false;dRead.removeAttribute('aria-busy');setPhase('selected');return;}
  const B=DREAD.book;if(!B||DREAD.stage==='closing')return;
  DREAD.stage='closing';DREAD.element.classList.remove('is-visible');
  disposeDesktopFlip();
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
    DREAD.element.remove();DREAD.book=null;DREAD.pages=[];DREAD.sourcePages=null;DREAD.paginationSize=null;DREAD.stage='idle';DREAD.element=null;
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

function paginateDesktopStory(){
  const element=DREAD.element,right=element.children[1],rect=right.getBoundingClientRect();
  const font=getComputedStyle(right);
  const size=[rect.width.toFixed(2),rect.height.toFixed(2),font.font,font.padding].join('|');
  if(size===DREAD.paginationSize)return;
  const anchor=DREAD.index<0?null:DREAD.pages[DREAD.index+1]||DREAD.pages[DREAD.index];
  DREAD.turn?.cancel();DREAD.turn=null;DREAD.leaf?.remove();DREAD.leaf=null;
  const probe=document.createElement('article');probe.className='in-book-page';
  Object.assign(probe.style,{position:'absolute',left:'0',top:'0',width:rect.width+'px',height:rect.height+'px',visibility:'hidden',pointerEvents:'none',overflow:'hidden'});
  element.append(probe);
  const pages=[];
  try{
    DREAD.sourcePages.forEach((source,sourceIndex)=>{
      let part=0,offset=0,paragraphs=[],startOffset=0;
      const fits=(candidate,last=false)=>{
        const chapter=document.createElement('small');chapter.textContent=source.chapter+(part?' (continued)':'');
        const heading=document.createElement('h2');heading.textContent=source.heading;
        const content=candidate.map(text=>{const p=document.createElement('p');p.textContent=text;return p;});
        const number=document.createElement('small');number.className='in-book-number';number.textContent=String(pages.length+1);
        probe.replaceChildren(chapter,heading,...content);
        if(last){const end=document.createElement('p');end.className='in-book-end';end.textContent='The End';probe.append(end);}
        probe.append(number);
        return probe.scrollHeight<=probe.clientHeight;
      };
      const finish=()=>{
        pages.push({...source,chapter:source.chapter+(part?' (continued)':''),paragraphs,pageNum:pages.length+1,_source:sourceIndex,_offset:startOffset});
        paragraphs=[];part++;startOffset=offset;
      };
      source.paragraphs.forEach((text,paragraphIndex)=>{
        const words=text.trim().split(/\s+/);let cursor=0;
        while(cursor<words.length){
          const lastParagraph=sourceIndex===DREAD.sourcePages.length-1&&paragraphIndex===source.paragraphs.length-1;
          const rest=words.slice(cursor).join(' ');
          if(fits([...paragraphs,rest],lastParagraph)){
            paragraphs.push(rest);offset+=words.length-cursor;cursor=words.length;break;
          }
          let low=0,high=words.length-cursor;
          while(low<high){
            const count=Math.ceil((low+high)/2);
            if(fits([...paragraphs,words.slice(cursor,cursor+count).join(' ')],lastParagraph&&cursor+count===words.length))low=count;
            else high=count-1;
          }
          if(low){paragraphs.push(words.slice(cursor,cursor+low).join(' '));cursor+=low;offset+=low;}
          if(!paragraphs.length)throw new Error('The reading viewport is too short for a story page.');
          finish();
        }
      });
      if(paragraphs.length)finish();
    });
    DREAD.pages=pages;DREAD.paginationSize=size;
    if(anchor?._source!==undefined){
      let pageIndex=0;
      pages.forEach((page,index)=>{if(page._source===anchor._source&&page._offset<=anchor._offset)pageIndex=index;});
      DREAD.index=pageIndex<1?-1:pageIndex%2?pageIndex:pageIndex-1;
    }
    renderDesktopSpread();
  }finally{probe.remove();}
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
  renderDesktopNote();
}

function renderDesktopNote(){
  DREAD.element.querySelector('.in-book-instruction')?.remove();
  const note=document.createElement('div');note.className='in-book-instruction';note.setAttribute('aria-live','polite');
  note.textContent=DREAD.index+2>=DREAD.pages.length?'The End · Left page: back':'Right page: forward · Left page: back · Hover near an outer edge or click';
  DREAD.element.append(note);
}

function turnDesktopPage(direction=1){
  if(DREAD.stage!=='reading'||DREAD.turn||!DREAD.flip)return;
  const next=DREAD.index+2*direction;
  if(next<-1||next>=DREAD.pages.length)return;
  if(REDUCED){DREAD.flip.turnToPage(next+1);DREAD.flip.getRender().render(performance.now());return;}
  if(direction<0)DREAD.flip.flipPrev('bottom');else DREAD.flip.flipNext('bottom');
}

function mountDesktopFlip(){
  const rect=DREAD.element.children[1].getBoundingClientRect();
  const host=document.createElement('div');host.className='in-book-engine';
  const items=[makeDesktopPage(-1),...DREAD.pages.map((_,index)=>makeDesktopPage(index))];
  if(items.length%2)items.push(makeDesktopPage(DREAD.pages.length));
  for(const page of items)page.dataset.density='soft';
  DREAD.element.replaceChildren(host);renderDesktopNote();
  const engine=new DREAD.PageFlip(host,{
    width:rect.width,height:rect.height,size:'fixed',usePortrait:false,autoSize:false,
    startPage:DREAD.index+1,showCover:false,useMouseEvents:false,showPageCorners:false,
    drawShadow:true,maxShadowOpacity:0.24,flippingTime:900
  });
  DREAD.flip=engine;
  engine.on('flip',event=>{DREAD.index=event.data-1;renderDesktopNote();});
  engine.on('changeState',event=>{DREAD.turn=event.data==='read'?null:{cancel:()=>engine.getRender().finishAnimation()};});
  engine.loadFromHTML(items);
  const render=engine.getRender(),start=render.startAnimation.bind(render);
  render.startAnimation=(...args)=>{
    render.timer=performance.now();start(...args);
    if(render._readerAlive&&!render._readerFrame)render._readerFrame=requestAnimationFrame(render._readerLoop);
  };
}

function disposeDesktopFlip(){
  if(!DREAD.flip)return;
  const render=DREAD.flip.getRender();render._readerAlive=false;
  cancelAnimationFrame(render._readerFrame);render._readerFrame=0;render.animation=null;
  DREAD.flip.destroy();DREAD.flip=null;DREAD.turn=null;
}

function createDesktopPages(){
  if(!document.getElementById('in-book-style')){
    const style=document.createElement('style');style.id='in-book-style';style.textContent=`
      .in-book-spread{--page-inset:clamp(6px,.6vw,10px);position:fixed;z-index:45;display:grid;grid-template-columns:1fr 1fr;padding:var(--page-inset);perspective:4200px;opacity:0;pointer-events:none;transition:opacity .16s;isolation:isolate;color:#241a12}
      .in-book-spread::after{content:'';position:absolute;top:var(--page-inset);bottom:var(--page-inset);left:50%;width:22px;transform:translateX(-50%);background:linear-gradient(90deg,transparent,rgba(72,48,28,.08) 35%,rgba(52,32,17,.28) 49%,rgba(255,255,255,.55) 52%,rgba(72,48,28,.10) 65%,transparent);pointer-events:none;z-index:1}
      .in-book-spread.is-visible{opacity:1;pointer-events:auto}
      .in-book-page{min-width:0;min-height:0;margin:0;overflow:auto;overscroll-behavior:contain;padding:clamp(18px,2.2vw,38px);background:#faf9f5;border:1px solid #ddcfb7;box-shadow:0 2px #e5dac5,0 3px #fffaf0,0 4px #d5c8b0,inset -12px 0 18px -18px #3a2618;font:600 clamp(16px,1.1vw,20px)/1.5 'EB Garamond',Georgia,serif;cursor:pointer;scrollbar-width:thin;text-align:left;user-select:text}
      .in-book-page.in-book-endpaper{opacity:0;pointer-events:none;border:0;box-shadow:none}
      .in-book-spread.is-paginated .in-book-page{overflow:hidden}
      .in-book-page.--left{box-shadow:inset -12px 0 18px -18px #3a2618}
      .in-book-page.--right{box-shadow:inset 12px 0 18px -18px #3a2618}
      .in-book-page h2{font:600 clamp(23px,1.7vw,32px)/1.12 'EB Garamond',Georgia,serif;margin:12px 0 20px;overflow-wrap:anywhere}
      .in-book-page p{margin:0 0 15px}.in-book-page small{font:600 11px/1.4 Inter,sans-serif;letter-spacing:.07em}
      .in-book-page:focus-visible{outline:2px solid #796449;outline-offset:-3px}
      .in-book-number{display:block;text-align:center;margin-top:24px;color:#6d604f}
      .in-book-end{text-align:center;font-style:italic;font-size:25px;padding-top:15px}
      .in-book-instruction{position:absolute;top:calc(100% + 12px);left:0;width:100%;text-align:center;font:600 12px/1.4 Inter,sans-serif;color:#241a12}
      .in-book-engine{position:absolute;inset:var(--page-inset);z-index:2}
      @media(prefers-reduced-motion:reduce){.in-book-spread{transition:none}}
    `;document.head.append(style);
  }
  const element=document.createElement('div');element.className='in-book-spread';element.setAttribute('role','group');element.setAttribute('aria-label',DREAD.book.data.title+' story pages');
  element.classList.toggle('is-paginated',DREAD.paginated);
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
    turnDesktopPage(page.classList.contains('--left')?-1:1);
  });
  element.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();turnDesktopPage(event.target.closest('.in-book-page')?.classList.contains('--left')?-1:1);}});
}

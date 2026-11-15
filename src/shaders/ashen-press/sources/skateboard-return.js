// Reuse the original dog for a second, stationary-pose traversal.
const SKATE={board:null,wheels:[],phase:'idle',timer:0,entered:false,
  bounds:new THREE.Box3(),point:new THREE.Vector3(),axle:new THREE.Vector3(0,1,0),direction:new THREE.Vector3()};

function prepareSkateReturn(gltf){
  if(!dogRun||!gltf)return;
  const mover=dogRun.mover,board=gltf.scene;
  mover.updateMatrixWorld(true);
  const inverse=mover.matrixWorld.clone().invert();
  const dogBox=new THREE.Box3().setFromObject(dogRun.root).applyMatrix4(inverse);
  const dogSize=dogBox.getSize(new THREE.Vector3()),dogCenter=dogBox.getCenter(new THREE.Vector3());
  const authoredSize=new THREE.Box3().setFromObject(board).getSize(new THREE.Vector3());
  const length=Math.abs(dogRun.forward.x)>Math.abs(dogRun.forward.z)?dogSize.x:dogSize.z;
  board.scale.setScalar(length*1.18/authoredSize.z);
  board.rotation.y=Math.atan2(dogRun.forward.x,dogRun.forward.z);
  mover.add(board);board.updateMatrixWorld(true);
  const localBox=new THREE.Box3().setFromObject(board).applyMatrix4(inverse);
  const center=localBox.getCenter(new THREE.Vector3());
  const floor=environmentRoot.getObjectByName('floor');
  const groundY=floor
    ?new THREE.Vector3(0,new THREE.Box3().setFromObject(floor).max.y+0.006,0).applyMatrix4(inverse).y
    :dogBox.min.y;
  board.position.set(dogCenter.x-center.x,groundY-localBox.min.y,dogCenter.z-center.z);
  board.updateMatrixWorld(true);
  const deck=board.getObjectByName('shape001_16')||board.getObjectByName('shape.001_16')||board;
  const deckBox=new THREE.Box3().setFromObject(deck).applyMatrix4(inverse);
  SKATE.lift=deckBox.max.y-dogBox.min.y+0.012;
  SKATE.dogPosition=dogRun.root.position.clone();
  SKATE.dogQuaternion=dogRun.root.quaternion.clone();
  SKATE.returnQuaternion=SKATE.dogQuaternion.clone().premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI));
  SKATE.dogCenter=dogCenter;
  SKATE.radius=0.101*board.scale.x;
  SKATE.board=board;board.visible=false;
  SKATE.wheels=['Cylinder.002_8','Cylinder.004_10','Cylinder.007_14','Cylinder.008_15']
    .map(name=>board.getObjectByName(name.replace(/\./g,''))||board.getObjectByName(name)).filter(Boolean);
  board.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
}

function scheduleSkateReturn(){
  if(!SKATE.board||REDUCED||SKATE.phase!=='idle')return;
  SKATE.phase='waiting';
  SKATE.timer=window.setTimeout(startSkateReturn,10000);
}

function skateboardScreenBounds(){
  const min=SKATE.bounds.min,max=SKATE.bounds.max;
  let minX=Infinity,maxX=-Infinity;
  for(let i=0;i<8;i++){
    SKATE.point.set(i&1?max.x:min.x,i&2?max.y:min.y,i&4?max.z:min.z).project(camera);
    minX=Math.min(minX,SKATE.point.x);maxX=Math.max(maxX,SKATE.point.x);
  }
  SKATE.minX=minX;SKATE.maxX=maxX;
}

function startSkateReturn(){
  SKATE.timer=0;
  if(!dogRun||!SKATE.board||document.hidden||SKATE.phase!=='waiting')return;
  const mover=dogRun.mover;
  SKATE.direction.copy(dogRun.forward).negate();
  dogRun.root.position.copy(SKATE.dogPosition);dogRun.root.position.y+=SKATE.lift;
  dogRun.root.quaternion.copy(SKATE.returnQuaternion);
  dogRun.root.position.x=2*SKATE.dogCenter.x-SKATE.dogPosition.x;
  dogRun.root.position.z=2*SKATE.dogCenter.z-SKATE.dogPosition.z;
  SKATE.board.visible=true;
  // Keep the complete assembly offscreen until its return begins.
  for(let i=0;i<80;i++){
    mover.updateMatrixWorld(true);SKATE.bounds.setFromObject(mover);skateboardScreenBounds();
    if(SKATE.maxX<=-1.06)break;
    mover.position.addScaledVector(dogRun.forward,0.25);
  }
  SKATE.phase='riding';SKATE.entered=false;mover.visible=true;
  backgroundDirty=true;renderer.shadowMap.needsUpdate=true;wakeRender();
}

function updateSkateReturn(dt){
  if(SKATE.phase!=='riding')return false;
  const distance=dogRun.speed*dt;
  dogRun.mover.position.addScaledVector(SKATE.direction,distance);
  for(const wheel of SKATE.wheels)wheel.rotateOnAxis(SKATE.axle,-distance/SKATE.radius);
  dogRun.mover.updateMatrixWorld(true);SKATE.bounds.setFromObject(dogRun.mover);skateboardScreenBounds();
  if(SKATE.maxX>=-1&&SKATE.minX<=1)SKATE.entered=true;
  if(SKATE.entered&&SKATE.minX>=1.06){
    SKATE.phase='finished';dogRun.mover.visible=false;SKATE.board.visible=false;
    dogRun.root.position.copy(SKATE.dogPosition);
    dogRun.root.quaternion.copy(SKATE.dogQuaternion);
  }
  backgroundDirty=true;renderer.shadowMap.needsUpdate=true;
  return SKATE.phase==='riding';
}

addEventListener('pagehide',()=>{if(SKATE.timer){clearTimeout(SKATE.timer);SKATE.timer=0;}},{once:true});

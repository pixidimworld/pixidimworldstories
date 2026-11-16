import source from "page-flip/dist/js/page-flip.module.js?raw";
import license from "page-flip/LICENSE?raw";

// Keep upstream's folding geometry intact, but do not leave its endless RAF
// running after a turn. The pinned 2.0.7 bundle has this one renderer entry.
const upstreamStart = "start(){this.update();const t=e=>{this.render(e),requestAnimationFrame(t)};requestAnimationFrame(t)}";
const sleepingStart = "start(){this.update();this._readerAlive=true;this._readerFrame=0;this._readerLoop=t=>{this._readerFrame=0;if(!this._readerAlive)return;if(this.animation&&t<this.animation.startedAt)this.animation.startedAt=t;this.render(t);if(this.animation)this._readerFrame=requestAnimationFrame(this._readerLoop)};this._readerFrame=requestAnimationFrame(this._readerLoop)}";
if (!source.includes(upstreamStart)) throw new Error("StPageFlip renderer adapter needs review.");

export default `/* ${license} */\n${source.replace(upstreamStart, sleepingStart)}`;

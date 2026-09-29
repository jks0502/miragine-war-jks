// Game sound effects plus scene music. Music starts after the first user gesture.
export class Sound {
  constructor(){
    this.enabled=true;this.context=null;this.lastHit=0;this.weatherClock=0;this.weatherId='clear';this.noiseBuffer=null;
    this.scene='menu';this.musicTrack=null;
    this.music={
      menu:new Audio(new URL('../assets/audio/civ6-china-home.m4a',import.meta.url)),
      battle:new Audio(new URL('../assets/audio/civ6-china-battle.m4a',import.meta.url)),
    };
    for(const track of Object.values(this.music)){track.loop=true;track.preload='auto';track.volume=.22;}
  }
  unlock(){
    if(!this.context)this.context=new AudioContext();
    if(!this.noiseBuffer){
      const length=Math.floor(this.context.sampleRate*.22),buffer=this.context.createBuffer(1,length,this.context.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);
      this.noiseBuffer=buffer;
    }
    if(this.context.state==='suspended')this.context.resume();
    this.syncMusic();
  }
  syncMusic(){
    for(const [name,track] of Object.entries(this.music)){
      const active=this.enabled&&name===this.scene;
      if(active){
        if(this.musicTrack!==track){
          for(const other of Object.values(this.music))if(other!==track){other.pause();other.currentTime=0;}
          this.musicTrack=track;
        }
        track.play().catch(()=>{});
      }else track.pause();
    }
  }
  setScene(scene){this.scene=scene==='battle'?'battle':'menu';if(this.context)this.syncMusic();}
  setEnabled(enabled){this.enabled=Boolean(enabled);if(this.context)this.syncMusic();}
  tone(freq,duration=.1,volume=.035,type='triangle',delay=0){
    if(!this.enabled||!this.context)return;
    const c=this.context,o=c.createOscillator(),g=c.createGain(),at=c.currentTime+delay;
    o.type=type;o.frequency.setValueAtTime(freq,at);g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(volume,at+.008);g.gain.exponentialRampToValueAtTime(.0001,at+duration);
    o.connect(g);g.connect(c.destination);o.start(at);o.stop(at+duration+.02);
  }
  click(){this.tone(440,.05,.028);this.tone(660,.08,.02,'triangle',.025);}
  round(){[261.6,329.6,392,523.2].forEach((n,i)=>this.tone(n,.35,.045,'triangle',i*.08));}
  end(win){(win?[261,329,392,523]:[293,261,220,146]).forEach((n,i)=>this.tone(n,.75,.07,'triangle',i*.22));}
  setWeather(weather){this.weatherId=typeof weather==='string'?weather:(weather?.id||'clear');}
  weatherBurst(){
    if(!this.enabled||!this.context||!this.noiseBuffer||this.weatherId==='clear')return;
    const c=this.context,source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
    source.buffer=this.noiseBuffer;
    filter.type=this.weatherId==='rain'?'highpass':'lowpass';filter.frequency.value=this.weatherId==='rain'?1700:950;
    const now=c.currentTime;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(this.weatherId==='rain'?.012:.008,now+.025);gain.gain.exponentialRampToValueAtTime(.0001,now+.2);
    source.connect(filter);filter.connect(gain);gain.connect(c.destination);source.start(now);source.stop(now+.22);
  }
  update(dt,battle){
    if(!this.enabled)return;
    this.lastHit-=dt;
    if(this.lastHit<=0&&battle.effects.some(e=>e.type==='slash')){this.tone(90+Math.random()*70,.055,.012,'triangle');this.lastHit=.18;}
    this.weatherClock-=dt;
    if(this.weatherId!=='clear'&&this.weatherClock<=0){this.weatherClock=this.weatherId==='rain'?.24:.48;this.weatherBurst();}
  }
}

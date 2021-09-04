function copy(str){
  var tempElem = document.createElement('textarea');
  tempElem.value = str;
  document.body.appendChild(tempElem);

  tempElem.select();
  document.execCommand("copy");
  document.body.removeChild(tempElem);
}

function reverse(str){
  return str.split('').reverse().join('');
}

function getDateString(d){
  return [
    d.getFullYear(),
    (d.getMonth()+1).toString().padStart(2, '0'),
    d.getDate().toString().padStart(2, '0')
  ].join('-');
}

let timeLimitList = {};
function timeLimit(key, time){
  if(timeLimitList[key] === undefined){
    timeLimitList[key] = 0;
  }

  if(Date.now() - timeLimitList[key] < time){
    return true;
  }
  timeLimitList[key] = Date.now();
  return false;
}

function comma(n){
  // if(n === undefined) return "0";
  // n = n.toString();
  let minus;
  if(typeof n === "number"){
    if(n<0){
      minus = true;
    }
    n = n.toString().replace(/-/g,'');
  }else if(typeof n === "string"){
    // console.log("@", n);
    n = n.replace(/,/g,'');
    n = Number(n);
    // console.log("@@", n);
    if(isNaN(n)){
      return n = "0";
    }
    if(n<0){
      minus = true;
    }
    n = n.toString().replace(/-/g,'');
  }
  if(!n) return "0";



  let a = [], j=0;
  for(let i=n.length-1; i>=0; i--){
    a.unshift(n[i]);
    if(++j%3==0 && i>0){
      a.unshift(',');
    }
  }

  return (minus?'-':'')+a.join('');

  // let t = reverse(n).matchAll(/((?:\d\d\d|\d\d|\d))/gm);
  // let v, result=[];
  // while(1){
  //   v = t.next();
  //   if(v.done) break;
  //
  //   if(v.value.length == 1){
  //     result.push(v.value[0]);
  //   }else{
  //     result.push(v.value.slice(1));
  //   }
  // }
  // return reverse(result.join(','));

  // return reverse(expgen("{(###|##|#)}").getAll(reverse(n)).join(','))
}

function round(n,p=0){
  return Math.round(n * Math.pow(10,p))/Math.pow(10,p);
}

function printPercent(n){
  return round(n*100,2) + '%';
}

function setupMoneyInput(input){
  if(!input) return;
  input.style.textAlign = "right";
  input.onkeydown = function(event){
    // console.error(event.keyCode);
    switch(event.keyCode){
      case 8:// backspace
      case 46:// delete
      case 37:// left
      case 38:// up
      case 39:// right
      case 40:// down
      break;

      default:
        if(
          !(
            event.keyCode >= 48 && event.keyCode <= 57 ||
            event.keyCode >= 96 && event.keyCode <= 105
            // event.keyCode == 109 // -
          )
        ){
          event.preventDefault();
        }
    }
  }

  input.oninput = function(event){
    event.target.value = Number(event.target.value);
  }

  input.onfocus = function(event){
    let n = toNumber(event.target.value);
    event.target.value = n == 0 ? '' : n;
  }

  input.onblur = function(event){
    event.target.value = comma(event.target.value);
  }
}

function or(a, b){
  if(a !== undefined && a !== null){
    return a;
  }
  return b;
}

function toNumber(str){
  //str.replace(/)
  return Number(str.replace(/[^0-9-]/g,''));
}


let $cover = $('<div>').css({
  position: 'fixed',
  left: '0px',
  right: '0px',
  top: '0px',
  bottom: '0px',
  outline: '0px',
  background: 'rgba(0, 0, 0, 0.6)',
  padding: 'calc(50vh - 3rem)',
  'text-align': 'center',
  'z-index': 10000
});
let $spinner = $('<span class="c-loading-button-spinner spinner-border spinner-border-sm">').css({
  width: '6rem',
  height: '6rem'
});
function screenLock(){
  //c-loading-button-spinner spinner-border spinner-border-sm
  $spinner.remove();
  $cover.appendTo(document.body);
}

function screenUnlock(){
  $cover.remove();
}

let _loadingLock;
function loadingLock(){
  _loadingLock = true;
}
function loadingUnlock(){
  _loadingLock = false;
}

let loading;
function startLoading(){
  if(_loadingLock) return;
  if(loading) return;
  loading = true;
  $cover.append($spinner);
  $cover.appendTo(document.body);
}

function stopLoading(){
  if(_loadingLock) return;
  loading = false;
  $cover.remove();
}

function delay(n){
  return new Promise(resolve=>setTimeout(resolve, n));
}

let resumeCallback = {};
function pause(key){
  return new Promise(resolve=>resumeCallback[key]=resolve);
}

function resume(key){
  if(typeof resumeCallback[key] === "function"){
    resumeCallback[key]();
  }
}

function gotoLogin(){
  window.location.href = "/login";
}

const calc = {
    stakeB: function (oddA, oddB, stakeA) {
        return oddA / oddB * stakeA;
    },
    investment: function (oddA, oddB, stakeA) {
        return this.stakeB(oddA, oddB, stakeA) + stakeA;
    },
    profit: function (oddA, oddB, stakeA, stakeB) {
			if(stakeB !== undefined){
				return oddA * stakeA - (stakeB + stakeA);
			}
      return oddA * stakeA - this.investment(oddA, oddB, stakeA);
    },
    profitP: function (oddA, oddB) {
        return this.profit(oddA, oddB, 1) / this.investment(oddA, oddB, 1);
    }
};

function profitSoundEffect(profit){
  if(profit > 1){
    Sound.play("coin2");
  }else{
    Sound.play("coin1");
  }
}

var Sound = {
    itv: {},
    els: {},
    ct: {},
    urls: {
      reqWithdraw: "/sounds/reqWithdraw.mp3",
      coin1: "/sounds/coin1.mp3",
      coin2: "/sounds/coin2.mp3",
      lakeBet365Money: "/sounds/lakeBet365Money.mp3",
      lakePncMoney: "/sounds/lakePncMoney.mp3"
    },
    init: function () {
        for (let o in this.urls) {
            let t = document.createElement("audio");
            this.els[o] = t;
            t.src = this.urls[o];
        }
    },
    create: function(name){
      return new Promise(resolve=>{
        let t = new Audio(`/sounds/${name}.mp3`);
        t.oncanplay = function(){
          resolve();
        }
        this.els[name] = t;
      })
    },
    play: async function (name, repeat = 1, delay = 0) {
      if(!this.els[name]){
        await this.create(name);
      }
      this.ct[name] = 0;
      this._play(name, repeat, delay);
    },
    _play: function (name, repeat, delay) {
        if (this.els[name]) {
            if (!this.ct[name])
                this.ct[name] = 1;
            else
                this.ct[name]++;
            let self = this;
            if(!repeat || repeat <= 0) repeat = 1;
            this.els[name].onended = function () {
                if (self.ct[name] < repeat) {
                    if (delay) {
                        this.itv[name] = setTimeout(function () {
                            self._play(name, repeat);
                        }, delay);
                    }
                    else {
                        self._play(name, repeat);
                    }
                }
            };
            this.els[name].currentTime = 0;
            this.els[name].play();
        }
    },
    clear: function () {
        for (let o in this.els) {
            this.els[o].onended = null;
            this.els[o].pause();
            clearInterval(this.itv[o]);
        }
    }
};

// class _Sound {
//   static links = {
//     lakeBet365Money: "/sounds/lakeBet365Money.mp3"
//   };
//   static pool = {}
//   static play(name, loop=1){
//     let sound = this.get(name);
//     if(sound){
//       if(loop>1){
//         sound.once("end", ()=>{
//           this.play(name, loop-1);
//         })
//       }
//       sound.once('load', ()=>{
//         sound.play();
//       });
//     }
//   }
//
//   static create(name){
//     if(!this.has(name) && this.links[name]){
//       this.pool[name] = new Howl({
//         src: this.links[name]
//       })
//     }
//   }
//
//   static has(name){
//     return !!this.pool[name];
//   }
//
//   static get(name){
//     return this.pool[name];
//   }
// }

function getDatePickerOption({dateSelected}={}){
  let days = "일,월,화,수,목,금,토".split(',');
  return {
    id: 1,
    customDays: ['일', '월', '화', '수', '목', '금', '토'],
    customMonths: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    customOverlayMonths: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    overlayButton: "확인",
    overlayPlaceholder: "년도",
    dateSelected: dateSelected||new Date(),
    formatter: (input, date, instance) => {
      const value = date.toLocaleDateString() + " (" + days[date.getDay()] + ")";
      input.value = value;
    },
    position : 'tl'
  }
}

function getRgba(type, alphaP=100){
  return coreui.Utils.hexToRgba(coreui.Utils.getStyle('--'+type, document.getElementsByClassName('c-app')[0]), alphaP);
}

function getColor(type){
  return coreui.Utils.getStyle('--'+type, document.getElementsByClassName('c-app')[0])
}

function getDateOfWeek(w, y) {
  let d = (1 + (w - 1) * 7); // 1st of January + 7 days for each week
  return new Date(y===undefined?new Date().getFullYear():y, 0, d);
}

function hexToRgbA(hex, a){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+a+')';
    }
    throw new Error('Bad Hex');
}

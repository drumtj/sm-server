console.log("socket.js");


var socket;
// var setSocket;
// async function socketReady(){
//   if(socket) return socket;
//   return new Promise(resolve=>{
//     setSocket = resolve;
//   })
// }
var socketReadyResolve;
var socketReady = new Promise(resolve=>{
  socketReadyResolve = resolve;
})

var appReadyResolve;
var appReady = new Promise(resolve=>{
  appReadyResolve = resolve;
});

var appMountedResolve;
var appMounted = new Promise(resolve=>{
  appMountedResolve = resolve;
});

var socketResolveList = {};
// 여기서 서버로 보낸 uuid가
// 서버가 멀티코어로 실행됐을때 uuid를 받은 프로세스에서 응답하지 않게되는 경우
// 저장된 resolve함수가 없으므로 구현된 socket promise가 작동하지 않는다..
function emitPromise(com, data){
  let id = uuid.v4();
  console.error("emitPromise", {com, data, id})
  socket.emit(com, data, id);
  return new Promise(resolve=>{
    socketResolveList[id] = resolve;
  })
}

// window.addEventListener('load', async ()=>{
$(document).ready(async ()=>{

  document.body.addEventListener('click', function() {
    let context = new AudioContext();
    context.resume().then(() => {
      console.log('Playback resumed successfully');
    });
  },{once:true});

  // let d = $('<div>').appendTo(document.body);
  // d.html('<iframe style="width:1px; height:1px;" src="/sounds/reqWithdraw.mp3" allow="autoplay">');
  // // Sound.init();
  // await delay(1000);
  // Sound.play("reqWithdraw");

  console.log("wait appReady");
  await appReady;

  console.log("set socket");
  console.log(link, user);
  // var socket = io('/'+user.email);
  // var socket = io('ws://localhost:4500', { transports: ['websocket'] });
  // var socket = io('/'+user.email, { transports: ['websocket'] });
  // var socket = io('/'+pageCode, { transports: ['websocket'] });
  try{
    socket = io('/', { transports: ['websocket'] });
  }catch(e){
    console.error(e);
    window.location.reload();
    return;
  }

  socket.on("destroyedSession", ()=>{
    console.error("destroyedSession");
    window.location.href = '/login';
  })

  socket.on("sound", data=>{
    console.error("receive sound message", data);
    let {name, loop} = data;
    Sound.play(name, loop);
  })

  socket.on("profitSound", profit=>{
    console.error("profitSound", profit);
    profitSoundEffect(profit);
  })

  socket.on("resolve", (data, uuid)=>{
    // console.error("resolve", {data, uuid, backEvent, pid, bid});
    if(socketResolveList[uuid]){
      socketResolveList[uuid](data);
      delete socketResolveList[uuid];
    }

    // switch(backEvent){
    //   case "startMatch":
    //
    //   break;
    // }
  })


  // var socket = io('ws://localhost:4500', { transports: ['websocket'] });
  // var socket = io('ws://localhost:4500');
  socket.on("connect", async ()=>{
    console.log("socket connected");
    socketReadyResolve();
    await appMounted;
    socket.emit("init", {link:link});
  })

  if(user.master){
    if(link !== '/admin/memberManager'){
      socket.on("requestUserRegist", ()=>{
        console.error("requestUserRegist");
        Vmenu.setNew('/admin/memberManager');
        VsideMenu.setNew('/admin/memberManager');
        Sound.play("recReqRegist");
      })
    }
  }

  if(user.admin){
    if(link == '/admin/eventMemberManager'){
      socket.on("newEventMember", ()=>{
        console.error("requestUserRegist");
        Vmenu.setNew('/admin/eventMemberManager');
        VsideMenu.setNew('/admin/eventMemberManager');
        Sound.play("reqRegistSkillbit");
      })
    }
  }

  socket.on("menuBadge", data=>{
    console.log("menuBadge", data);
    if(Array.isArray(data)){
      data.forEach(d=>{
        Vmenu.setBadge(d.link, d.text);
        VsideMenu.setBadge(d.link, d.text);
      })
    }else{
      Vmenu.setBadge(data.link, data.text);
      VsideMenu.setBadge(data.link, data.text);
    }
  })

  function refreshTab(links){
    links = Array.isArray(links) ? links : [links];
    if(links.indexOf(link) > -1 && Vapp.loadList){
      Vapp.loadList(Vapp.curPage, Vapp.tab);
    }
  }

  socket.on("refreshTab", data=>{
    console.log("refreshTab", data)
    refreshTab(data.link);
    // let links = Array.isArray(data.link) ? data.link : [data.link];
    // if(links.indexOf(link) > -1 && Vapp.loadList){
    //   Vapp.loadList(Vapp.curPage, Vapp.tab);
    // }
  })

  // tab을 갱신하고, account.money를 갱신
  socket.on("updateEachBet365Money", data=>{
    console.log("updateEachBet365Money", data);
    refreshTab(data.updateTarget);
    let accounts = Vapp.accounts;

    console.error("app accounts", accounts);

    if(Array.isArray(accounts)){
      let account = accounts.find(ac=>{
        return ac && ac._id==data.account._id;
      });
      if(account){
        console.error("bet365 money refresh", data.account.money, data.account.startMoney);
        account.money = data.account.money;
        if(data.account.startMoney !== undefined){
          account.startMoney = data.account.startMoney;
        }
      }
      Vapp.$forceUpdate();
    }
  })

  socket.on("modal", data=>{
    modal(data.title, data.body, data.option);
  })

  // socket.on("join", data=>{
  //   console.log('join room:', data);
  // })
  let itvUpdateMoney;
  socket.on("updateMoney", money=>{
    // clearTimeout(itvUpdateMoney);
    // itvUpdateMoney = setTimeout(()=>{
    if(money.email == user.email){
      console.log("updateMoney:", money);
      if(money.money !== undefined){
        Vmoney.money.site = money.money;
      }
      if(money.wallet !== undefined){
        Vmoney.money.wallet = money.wallet;
      }
      if(money.bet365Money !== undefined){
        Vmoney.money.bet365 = money.bet365Money;
      }
    }
    // }, 100);
  })

})

function openBrowser(pid, bid){
  socket.emit("openBrowser", pid, bid);
}

function closeBrowser(pid, bid){
  socket.emit("closeBrowser", pid, bid);
}

function sendDataToAdmin(com, data){
  socket.emit("adminDelivery", {com, data});
}
// socket.emit("closeBrowser", pid, _bid);
function sendDataToMember(email, com, data){
  socket.emit("memberDelivery", {com, data, email});
}

//to program socekts
function sendDataToServer(com, data){
  socket.emit(com, data)
}

function sendDataToProgram(pid, com, data){
  socket.emit("delivery", {pid, data:{com, data}})
}

function sendDataToMain(pid, bid, com, data){
  socket.emit("delivery", {
    pid,
    data:{
      com:"toMain",
      data: {com, data, bid, from:"dashboard"}
    }
  })
}

function sendDataToMainPromise(pid, bid, com, data){
  return emitPromise("delivery", {
    pid,
    data:{
      com:"toMain",
      data: {com, data, bid, from:"dashboard"}
    }
  })
}

function sendDataToBg(pid, bid, com, data){
  socket.emit("delivery", {
    pid,
    data:{
      com:"toBg",
      data: {com, data, bid, from:"dashboard"}
    }
  })
}

function sendDataToBet365(pid, bid, com, data){
  socket.emit("delivery", {
    pid,
    data:{
      com:"toBet365",
      data: {com, data, bid, from:"dashboard"}
    }
  })
}

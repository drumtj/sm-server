console.log("main.js");
// let socket = io(SOCKET_URL, { transports: ['websocket'] });
var version = 2;
// log.setSendFunc = sendData;


// function getParam(){
//   let r = {};
//   window.location.href.split('?').pop().split('&').forEach(kv=>{
//     let arr = kv.split('=');
//     r[arr[0]] = arr[1];
//   });
//   return r;
// }
let devMode = false;

let api;
let socket;
let $logCon = $(".log-container");
let $logTemp = $('<div class="log-line"></div>');
let prevLog;
let sameLogCount=0;

if(devMode){
  $logCon.css("display", "none");
}

function log(msg, type, sendToServer){
  let $el;
  let str = msg;
  let isSame;
  if(prevLog == msg){
    isSame = true;
    msg += `(${++sameLogCount})`;
  }else{
    sameLogCount = 0;
  }
  prevLog = str;

  if(devMode){
    if(isSame){
      $el = $($logCon[0].lastElementChild).removeClass("log-info log-warning log-success log-danger log-primary log-null");
    }else if($logCon[0].childElementCount < MAX_LOG_LENGTH){
      $el = $logTemp.clone();
    }else{
      $el = $($logCon[0].firstElementChild).removeClass("log-info log-warning log-success log-danger log-primary log-null");
    }
    if(type){
      $el.addClass('log-' + type);
    }

    let isBottom = $logCon.scrollTop()+$logCon.prop('offsetHeight')+20 >= $logCon.prop('scrollHeight');

    $logCon.append($el.html('<span class="text-secondary">'+(new Date()).toLocaleTimeString() + '</span> ' + msg));
    if(isBottom){
      $logCon.scrollTop($logCon.prop('scrollHeight'));
    }
  }

  console.log("[log]", msg);
  if(sendToServer){
    sendDataToServer("log", {msg, type, isSame});
  }
}

var flag = {
  bet365LoginComplete:false,
  isMatching:false
};
let betOption, optionName;
var account;
//from injection.js (by bg)
async function onMessage(message){
  let {com, data} = message;
  // console.error("inner onMessage", com, data, message);
  let resolveData;
  switch(com){
    case "test":
      resolveData = "test!!";
    break;

    // case "getBetmax":
    //   delay(500).then(()=>{
    //     var f = `var t = document.querySelector(".bss-StakeBox_StakeValueInput");
    //     function inputWithEvent(el, value){
    //     	var event = new CustomEvent("input");
    //     	el.value = value;
    //     	el.dispatchEvent(event);
    //     };inputWithEvent(t, ${data});`
    //     sendData("dev", f, PN_BG);
    //   })
    // break;

    case "log":
      log(data.msg, data.type, true);
      // sendDataToServer("log", data);
    break;

    case "bet365LoginComplete":
      // console.error("bet365LoginComplete", data);
      account = data.account;
      // pinnacleId = data.pinnacleId;
      betOption = data.betOption;
      optionName = data.optionName;
      $("#optionName").html(`[${optionName}]`);
      if(optionName == "체크기"){
        setupMode("dev");
      }

      if(!betOption){
        alert("옵션데이터가 없습니다.")
        return;
      }
      flag.bet365LoginComplete = true;
      if(!flag.isMatching){
        log('매칭을 시작하려면 <span class="text-success">[매칭시작]</span>을 눌러주세요', "warning", true);
      }
    break;

    case "isMatching":
      resolveData = flag.isMatching;
    break;



    // case "afterAccept":
    //   data.odds
    // break;
  }
  return resolveData;
}

function activeBet365(){
  sendData("activeBet365", null, PN_BG, true);
}

function activeMain(){
  sendData("activeMain", null, PN_BG, true);
}

function sendDataToProgram(com, data){
  socket.emit(com, data, BID);
}

function sendDataToServer(com, data){
  socket.emit("toServer", {com, data, bid:BID});
}

function sendDataToSite(com, data){
  socket.emit("toSite", {com, data, bid:BID});
}

function sendDataToServerPromise(com, data){
  return emitPromise("toServer", {com, data, bid:BID});
}

function sendDataToSitePromise(com, data){
  return emitPromise("toSite", {com, data, bid:BID});
}

function emitPromise(com, data){
  let id = uuid.v4();
  socket.emit(com, data, id);
  return new Promise(resolve=>{
    resolveList[id] = resolve;
  })
}

// async function onSocketMessage(com, args){
//   let resolveData;
//   switch(com){
//     case "connect":
//       console.log("socket connected");
//       let data = {bid:params.bid, email:params.email};
//       socket.emit("initMainPage", data);
//       // sendSocketData("loadBrowserInfo", data);
//       sendData("loadBrowserInfo", data, "bg");
//     break;
//   }
//   return resolveData;
// }

let messagePromises = {};

function setupOnMessage(){
  window.addEventListener("message", async message=>{
    if(message.data.isInner) return;


    let {com, data, to, from, _code, _rcode} = message.data;

    if(to === "program"){
      sendDataToProgram(com, data);
    }else if(to === "server"){
      sendDataToServer(com, data);
    }else if(to === "site"){
      sendDataToSite(com, data);
    }else{
      let resolveData = await onMessage(message.data);

      if(_code){
        // console.log("??sendResolveData", _code, resolveData, from);
        sendResolveData(_code, resolveData, from);
      }else if(_rcode && messagePromises[_rcode]){
        messagePromises[_rcode](data);
      }
    }
  });
}

let matchButtonDownTime = 0;
$("#matchButton, #matchButton2").on("click", e=>{
  if(!flag.bet365LoginComplete){
    // log("벳365 로그인 중입니다.");
    return;
  }
  if(Date.now() - matchButtonDownTime > 300){
    matchButtonDownTime = Date.now();
    if(flag.isMatching){
      stopMatch(true);
    }else{
      startMatch(true);
    }
  }
})

function updateMatchButtonState(){
  if(flag.isMatching){
    $(".icon").addClass("active");
    $("#matchButton2").addClass("active");
    $("#matchButton").removeClass("btn-success").addClass("btn-warning").html("매칭중지");
  }else{
    $(".icon").removeClass("active");
    $("#matchButton2").removeClass("active");
    $("#matchButton").removeClass("btn-warning").addClass("btn-success").html("매칭시작");
  }
}

function sendResolveData(_code, data, to){
  window.postMessage({_rcode:_code, data, to, from:PN_MAIN, isInner:true}, "*");
}

function sendData(com, data, to, noResolve){
  if(!to){
    to = PN_BG;
  }
  let msg = {com, data, to, from:PN_MAIN, isInner:true};
  if(noResolve){
    console.log("sendData", msg);
    window.postMessage(msg, "*");
    return;
  }
  // console.log("sendData", com, data, to);
  let mid = guid();
  let _code = com+'@'+mid;
  msg._code = _code;
  console.log("sendData", msg);
  window.postMessage(msg, "*");
  return new Promise(resolve=>{
    messagePromises[_code] = (d)=>{
      delete messagePromises[_code];
      resolve(d);
    }
  })
}

async function getBets(betData, timeout=0){
  if(betData.status == "PENDING_ACCEPTANCE"){
    log(`배팅확인중..`, null, true);
    let isTimeout, itv;
    if(timeout>0){
      itv = setTimeout(()=>{
        isTimeout = true;
      }, timeout);
    }
    while(1){
      if(isTimeout){
        betData.straightBet = null;
        betData.status = "TIMEOUT";
        break;
      }
      let bd = await sendData("getBets", betData.uniqueRequestId, PN_BG);
      console.error(bd);
      if(bd.straightBets && bd.straightBets.length){
        if(bd.straightBets[0].betStatus == "PENDING_ACCEPTANCE"){
          await delay(2000);
          log(`배팅확인중..`, null, true);
          continue;
        }
        // betData
        // return bd.straightBets[0];
        betData.straightBet = bd.straightBets[0];
        betData.status = "ACCEPTED";
        break;
      }
    }
    clearTimeout(itv);
  }
  // return betData;
}

async function placeBet(line){
  if(line.lineData.status == "SUCCESS"){
    console.error("wait bets");
    log(`피나클 배팅시작: $${line.lineData.minRiskStake}`, "info", true);
    let bets = await sendData("placeBet", line, PN_BG);
    console.error({bets});
    await getBets(bets.betData, 20000);
    line.betData = bets.betData;
    if(bets.betData){
      if(bets.betData.status == "ACCEPTED"){
        switch(bets.betData.straightBet.betStatus){
          case "CANCELLED":
            log(`피나클 배팅실패. 취소됨. ${bets.betData.straightBet.betStatus}`, "danger", true);
          break;

          case "REFUNDED":
            log(`피나클 배팅실패. 환불됨. ${bets.betData.straightBet.betStatus}`, "danger", true);
          break;

          case "NOT_ACCEPTED":
            log(`피나클 배팅실패. 허용되지 않음. ${bets.betData.straightBet.betStatus}`, "danger", true);
          break;

          case "ACCEPTED":
            console.error("피나클 배팅성공", bets.betData.straightBet);
            log(`피나클 배팅성공. odds: ${bets.betData.straightBet.price}, betId:${bets.betData.straightBet.betId}`, "success", true);
          break;

          default:
            console.error("예상치 못한 배팅 상태", bets.betData.straightBet);
            log(`예상치 못한 배팅 상태 ${bets.betData.straightBet}`, "danger", true);
        }

        // sendDataToServer("betData", {pinnacleId, account:account._id, data:bets.betData.straightBet});
        return {
          status: bets.betData.straightBet.betStatus == "ACCEPTED" ? "success" : "fail",
          data: bets.betData.straightBet
        };
      }else if(bets.betData.status == "PROCESSED_WITH_ERROR"){
        // log(`피나클 배팅실패: ${bets.betData.errorCode} ${bets.betData.errorMessage}`, "danger", true);
        log(`피나클 배팅실패: ${bets.betData.errorCode}`, "danger", true);
      }else{
        switch(bets.betData.status){
          case "TIMEOUT":
            log(`피나클 배팅실패. 시간초과.`, "danger", true);
          break;

          default:
            log(`피나클 배팅실패: ${bets.betData.status}`, "danger", true);
        }
      }
    }
  }
  return {
    status: "fail"
  }
}

function round(n,p=0){
  return Math.round(n * Math.pow(10,p))/Math.pow(10,p);
}

function printPercent(n){
  return round(n*100,2) + '%';
}

function validProfitP(oddsA, oddsB, noLog){
  let profitP = calc.profitP(oddsA, oddsB, 1);

  if(profitP < betOption.minProfitP/100){
    if(!noLog){
      log(`수익률 <span class="text-danger">${printPercent(betOption.minProfitP/100)} 미만(${printPercent(profitP)})</span>`, null, true);
    }
    return false;
  }

  if(profitP > betOption.maxProfitP/100){
    if(!noLog){
      log(`수익률 <span class="text-danger">${printPercent(betOption.maxProfitP/100)} 초과(${printPercent(profitP)})</span>`, null, true);
    }
    return false;
  }

  if(!noLog){
    log(`수익률: <span class="text-info">${printPercent(profitP)}</span>`, null, true);
  }
  return true;
}

function validProfit(oddsA, oddsB, stakeA, noLog){
  let profit = calc.profit(oddsA, oddsB, stakeA);

  if(profit < betOption.minProfit){
    if(!noLog){
      log(`수익 <span class="text-danger">$${round(betOption.minProfit,2)} 미만($${round(profit,2)})</span>`, null, true);
    }
    return false;
  }

  if(profit > betOption.maxProfit){
    if(!noLog){
      log(`수익 <span class="text-danger">$${round(betOption.maxProfit,2)} 초과($${round(profit,2)})</span>`, null, true);
    }
    return false;
  }

  if(!noLog){
    log(`수익: <span class="text-info">$${round(profit,2)}</span>`, null, true);
  }
  return true;
}

function hasEventMark(id){
  return !!getData(id);
}

function getEventMark(id){
  let em = getData(id);
  if(!em){
    em = {
      lineFindFailCount: 0
      // profitMatchFailCount: 0
    };
    setData(id, em);
  }
  return em;
}

function benEvent(data, key, time, msg){
  let ids = getEventIds(data);
  let id = ids[key];
  if(time <= 0){
    console.log("이벤트 영구제외", key, id);
    log(`이벤트 영구제외: ${msg?msg:''}`, "warning", true);
  }else{
    console.log("이벤트 제외", round(time/1000,1)+"초", key, id);
    log(`이벤트 ${round(time/1000,1)}초 제외: ${msg?msg:''}`, "warning", true);
    setTimeout(()=>{
      clearBenEvent(id);
    },time);
  }
  getEventMark(id).ben = true;
}

function clearBenEvent(id){
  if(hasEventMark(id)){
    getEventMark(id).ben = false;
  }
}

function isBenEvent(id){
  return hasEventMark(id) && (!!getEventMark(id).ben);
}

function lineFindFailCount(id){
  return getEventMark(id).lineFindFailCount;
}

function lineFindFailCountUp(id){
  return ++getEventMark(id).lineFindFailCount;
}

// function profitMatchFailCountUp(id){
//   return ++getEventMark(id).profitMatchFailCount;
// }

var isCheckingMatch = false;
async function findMatch(){
  if(isCheckingMatch){
    return;
  }
  let data = getNextData();
  log(`매칭확인중..`, null, true);
  // && data.pinnacle.sports == "Soccer"
  if(data){
    isCheckingMatch = true;
    if(betOption.action == "checkBetmax"){
      await checkBetmaxProcess(data);
    }else if(betOption.action == "vl"){
      // 고정 betmax로 벨류
      // await vlProcess(data);
      console.error("준비되지 않은 처리:", betOption.action);
    }else{
      console.error("준비되지 않은 처리:", betOption.action);
    }
    isCheckingMatch = false;
    // log('이벤트 수신 대기중', "primary", true);
  }
}

let currentGameData;
async function findMatch2(data){
  console.error("findMatch2", {isCheckingMatch});
  if(isCheckingMatch){
    return;
  }

  currentGameData = data;
  // let data = getNextData();
  // && data.pinnacle.sports == "Soccer"
  if(data){
    isCheckingMatch = true;
    if(betOption.action == "yb"){
      await userYbProcess(currentGameData.betburger);
    }else if(betOption.action == "vl"){
      //betmax로 벨류
      // await userVlProcess(currentGameData.betburger);
      console.error("준비되지 않은 처리:", betOption.action);
    }else{
      console.error("준비되지 않은 처리:", betOption.action);
    }

    isCheckingMatch = false;
    // log('이벤트 수신 대기중', "primary", true);
  }
}

function getNextData(){
  let d = getData("gamedata");
  let data;
  while(1){
    data = d.shift();
    if(data){
      // #1 타입확인
      // #2 옵션적용 필터링
      if(Array.isArray(data)){
        data = data.reduce((r,v)=>{
          r[v.bookmaker] = v;
          return r;
        }, {})
      }

      let ids = getEventIds(data);
      let out;
      for(let key in ids){
        if(isBenEvent(ids[key])){
          console.log(`제외된 이벤트: ${key} ${ids[key]}`);
          out = true;
          break;
        }
      }

      if(out){
        continue;
      }

      break;
      // return data;
    }else{
      break;
    }
  }

  return data;
}

async function userVlProcess(data){

}

function getEventIds(data){
  return {
    PK: data.pinnacle.id,
    POK: data.pinnacle.id + data.pinnacle.odds,
    BK: data.bet365.id,
    BOK: data.bet365.id + data.bet365.odds,
    //origin bet365 event id + odds  key
    OBOK: data.bet365.eventId + data.bet365.odds,
    // matchId: data.pinnacle.id + ':' + data.bet365.id
    EK: data.pinnacle.betburgerEventId,
    EBOK: data.pinnacle.betburgerEventId + data.bet365.odds,
    EPOK: data.pinnacle.betburgerEventId + data.pinnacle.odds
  }
}

function updateBet365Link(data){
  data.bet365.betLink = data.bet365.betLink.replace(/~(\d+\.?\d*)&/, (origin, found)=>{
    return origin.replace(found, data.bet365.odds);
  })
}

function updateBet365Stake(data){
  // 유저 양빵단계의 벳삼 배당 변동시에는 벳삼 stake를 다시 계산해주고 판단한다.
  data.bet365.stake = round(calc.stakeB(data.pinnacle.odds, data.bet365.odds, data.pinnacle.stake), 2);
  if(data.bet365.stake > betOption.maxBetmax){
    data.bet365.stake = round(betOption.maxBetmax * (Math.random()*0.05+0.95), 2);
    updatePncStake(data);
  }
}

function updatePncStake(data){
  data.pinnacle.stake = round(calc.stakeB(data.bet365.odds, data.pinnacle.odds, data.bet365.stake), 2);
}

function changeOddsBet365Process(data, odds){
  if(data.bet365.odds != odds){
    log(`벳365 배당변동: ${data.bet365.odds} -> ${odds}`, data.bet365.odds < odds ? "info" : "danger", true);
    data.bet365.odds = odds;
    return true;
    // // 유저 양빵단계의 벳삼 배당 변동시에는 벳삼 stake를 다시 계산해주고 판단한다.
    // data.bet365.stake = calc.stakeB(data.pinnacle.odds, data.bet365.odds, data.pinnacle.stake);
  }
  return false;
}

function profitValidation(data, noLog){
  return validProfit(data.pinnacle.odds, data.bet365.odds, data.pinnacle.stake, noLog);
}

function profitPValidation(data, noLog){
  return validProfitP(data.pinnacle.odds, data.bet365.odds, noLog);
}

function profitAllValidation(data, noLog){
  return validProfitP(data.pinnacle.odds, data.bet365.odds, noLog) && validProfit(data.pinnacle.odds, data.bet365.odds, data.pinnacle.stake, noLog);
}

function checkLakeMoney(data, money){
  if(money < data.bet365.stake){
    log(`배팅취소: 벳365 잔액부족 ($${data.bet365.stake}/$${money})`, 'danger', true);
    stopMatch(true);
    return true;
  }
  return false;
}

async function openBet365AndGetInfo(data){
  activeBet365();
  let bet365Info = await sendData("setUrl", data.bet365, PN_B365);
  activeMain();
  if(!bet365Info){
    log(`벳365 링크열기 실패`, "danger", true);
    return;
  }else if(bet365Info.status == "fail"){
    if(bet365Info.type == "notFoundSelectedItem"){
      benEvent(data, "BK", 0, "선택된 이벤트 없음");
    }
    return;
  }else{
    log(`벳365 확인: ${data.bet365.odds}`, null, true);
    console.log("bet365 info", bet365Info);
    console.log("betburger info", data.bet365);
    // if(bet365Info.money < data.bet365.stake){
    //   log(`배팅취소: 벳365 잔액부족 ($${data.bet365.stake}/$${bet365Info.money})`, 'danger', true);
    //   stopMatch(true);
    //   return;
    // }
  }
  return bet365Info;
}

function printGame(data){
  log(`
    <div>종목: ${data.pinnacle.sports} (${data.pinnacle.betType})</div>
    <div>수익률: ${Math.floor(data.pinnacle.profitP*10000)/100}%</div>
    <div><span class="text-warning">피나클</span>: ${data.pinnacle[data.pinnacle.homeAway]} (<span class="text-info">${data.pinnacle.odds}</span>) <span class="text-warning">${data.pinnacle.type.code}</span> ${data.pinnacle.type.set}</div>
    <div><span class="text-success">벳365</span>: ${data.bet365[data.bet365.homeAway]} (<span class="text-info">${data.bet365.odds}</span>) <span class="text-warning">${data.bet365.type.code}</span> ${data.bet365.type.set}</div>
  `, null, true);
}

async function checkBalance(lv=0){
  let balance = await api.balance();
  if(balance.status == "success"){
    if(optionName != "체크기" && balance.data.money < 100){
      log(`피나클 잔액이 100 미만입니다.`, "danger", true);
      sendDataToSite("sound", {name:"lakePncMoney"});
      return false;
    }
    return true;
  }else{
    log(`피나클 잔액확인 실패: ${balance.message}`, "danger", true);
    if(lv <= 3){
      log('재시도..', null, true);
      await delay(2000);
      return await checkBalance(lv+1);
    }else{
      return false;
    }
  }
}

async function reLogin(){
  activeBet365();
  let m = await sendData("reLogin", null, PN_B365);
  activeMain();
  return m;
}

function setBet365RandomStake(data, stake){
  let ratio = 0.95 * (Math.random()*0.05+0.95);
  let nbm = round(stake * ratio, 2);
  log(`stake rand: ${stake} -> ${nbm}(${round(ratio*100,2)}%)`, null, true);
  data.bet365.stake = nbm;
  // }
  // changeOddsBet365Process(data, result.info.odds);
  // data.bet365.stake = result.betmax;
  updatePncStake(data);
  updateBet365Stake(data);
}

// 유저 양빵 처리
async function userYbProcess(data){
  console.log(data);
  // let ids = getEventIds(data);
  printGame(data);

  if(!(await checkBalance())){
    stopMatch(true);
    return;
  }

  let bet365Info, checkProfit, checkType;
  bet365Info = await openBet365AndGetInfo(data);
  if(!bet365Info){
    return;
  }

  if(bet365Info.money == null){
    log("벳365 로그아웃 됨. 재 로그인 시도 중..", "danger", true);
    // activeBet365();
    // let m = await sendData("reLogin", null, PN_B365);
    // activeMain();
    let m = await reLogin();
    if(m == null){
      log("재 로그인 실패. 브라우져를 다시 켜주세요.", "danger", true);
      stopMatch(true);
      return;
    }else{
      log("벳365 재로그인 완료. 링크 다시 여는중..", null, true);
      bet365Info = await openBet365AndGetInfo(data);
      if(!bet365Info){
        return;
      }
    }
  }

  if(!checkBet365TeamName(data, bet365Info)){
    log(`배팅취소: 벳삼 팀이름 다름`, "danger", true);
    return;
  }

  checkType = await checkGameType(data, bet365Info, false);

  if(!checkType){
    //: 벳삼 타입 다름
    log(`배팅취소: 벳삼 타입다름`, "danger", true);
    benEvent(data, "BK", 0);
    return;
  }

  if(checkLakeMoney(data, bet365Info.money)){
    sendDataToSite("sound", {name:"lakeBet365Money"});
    return;
  }

  if(changeOddsBet365Process(data, bet365Info.odds)){
    updateBet365Stake(data);
  }

  if(!checkOddsForBet365(data)){
    log(`배팅취소`, "danger", true);
    benEvent(data, "OBOK", 20000, "벳삼 최소배당 미만");
    return;
  }

  setBet365RandomStake(data, data.bet365.stake);
  checkProfit = profitAllValidation(data);

  if(checkProfit){
    if(!flag.isMatching) return;
    activeBet365();
    // log(`벳365 배팅시작`, "info", true);
    let result, checkBet, isChangeOdds, isFirst = true, lakeMoney, fixedBetmax;
    while(1){
      if(checkProfit){
        if(isChangeOdds || isFirst){
          isFirst = false;
          isChangeOdds = false;
          log(`벳365 배팅시작 <span class="text-warning">$${data.bet365.stake}</span>`, "info", true);
        }

        // BOK
        // if(isBenEvent(data.bet365.id+data.bet365.odds)){
        // OBOK
        if(isBenEvent(data.bet365.eventId+data.bet365.odds)){
          log(`제외된 배당입니다.(${data.bet365.eventId+data.bet365.odds})`, "warning", true);
          break;
        }

        if(!checkOddsForBet365(data)){
          benEvent(data, "OBOK", 20000, "벳삼 최소배당 미만");
          break;
        }

        if(result){
          checkType = await checkGameType(data, result.info, false);
          if(!checkType){
            //: 벳삼 타입 다름
            log(`벳365 배팅실패: 벳삼 타입다름`, "danger", true);
            benEvent(data, "BK", 0);
            break;
          }
        }



        result = await sendData("placeBet", {fixedBetmax, stake:data.bet365.stake, prevInfo:bet365Info, betOption}, PN_B365);
        fixedBetmax = false;
        if(result && result.info){
          bet365Info = result.info;
        }
        console.log("bet365 betting..", result);
        if(result === undefined || result === null){
          log("벳365 배팅실패: 응답없음.", "danger", true);
          break;
        }

        // 배팅완료한뒤에는 체크하지 말자.
        // checkType = await checkGameType(data, result.info);
        // if(!checkType){
        //   log(`배팅취소: 벳삼 타입 다름`, "danger", true);
        //   benEvent(data, "BK", 0);
        //   if(result.status == "success"){
        //     log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", "danger", true);
        //     log(`벳365 배팅완료 후 타입바뀜!`, "danger", true);
        //     stopMatch(true);
        //   }
        //   break;
        // }
        if(result.status == "notEnoughFunds"){
          log(`벳365 배팅실패: ${result.message}`, "danger", true);
          stopMatch(true);
          break;
        }else if(result.status == "foundBetmax"){
          changeOddsBet365Process(data, result.info.odds);
          setBet365RandomStake(data, result.betmax);
          fixedBetmax = true;
        }else if(result.status == "acceptChange"){
          isChangeOdds = changeOddsBet365Process(data, result.info.odds);
          if(isChangeOdds){
            updateBet365Stake(data);
            checkProfit = profitAllValidation(data);
          }
        }else if(result.status == "lakeMoney"){
          log(`벳365 잔액부족 stake:$${result.stake}, money:$${result.money}`, "danger", true);
          changeOddsBet365Process(data, result.info.odds);
          data.bet365.stake = result.money;
          updatePncStake(data);
          checkProfit = profitAllValidation(data);
          lakeMoney = true;
        }else if(result.status == "success"){
          if(result.info.market == ""){
            log(`배팅취소: 배팅카트 사라짐`, "danger", true);
          }else{
            log(`벳365 배팅완료!`, "success", true);
            checkBet = true;
          }
          break;
        }else{
          log(`벳365 배팅실패: ${result.message}`, "danger", true);
          if(
            result.status == "restriction" ||
            result.status == "needVerify"
          ){
            stopMatch(true);
          }
          break;
        }
      }else{
        log(`배팅취소`, 'danger', true);
        break;
      }
    }
    activeMain();
    console.log("bet365 bet complete", result);

    if(checkBet){
      sendDataToServer("updateMoney", result.money - result.stake);
      await delay(100);
      // 사이트 배팅
      log(`피나클 배팅시작 <span class="text-warning">$${data.pinnacle.stake}</span>`, "info", true);
      // 배팅정보 저장
      let res = await api.bet({
        account: account._id,
        // accountId: account.id,
        event: currentGameData._id,
        betId: currentGameData.betId,
        siteOdds: data.pinnacle.odds,
        siteStake: data.pinnacle.stake,
        bookmakerOdds: data.bet365.odds,
        bookmakerStake: data.bet365.stake,
        bookmaker: result
      })
      if(res.status == "success"){
        log(`피나클 배팅완료!`, "success", true);
        benEvent(data, "OBOK", 0, "배팅완료");
      }else{
        log(`피나클 배팅실패: ${res.message}`, "danger", true);
        stopMatch(true);
      }
    }

    if(lakeMoney){
      stopMatch(true);
      sendDataToSite("sound", {name:"lakeBet365Money"});
      return;
    }
  }else{
    log(`배팅취소`, 'danger', true);
    return;
  }
}

function calcBet365Handi(info){
  let handicap;
  if(info.handicap){
    handicap = info.handicap;
  }else{
    //"Under 3.5"
    let m = info.title.match(/(?:over|under)[ ]*([+-]?\d+(?:\.\d+)?)/i);
    if(m){
      handicap = m[1];
    }
  }
  if(!handicap) return null;
  return handicap.split(',').reduce((r,v,i,a)=>{
    r += parseFloat(v)/a.length;
    return r;
  },0)
}

function getBet365TeamName(data){
  return data.bet365[data.bet365.homeAway];
}

function checkBet365TeamName(data, info){
  let teams = info.desc.toLowerCase().split(' vs ');
  if(teams.length==1){
    teams = info.desc.toLowerCase().split(' v ');
  }
  if(teams.length==1){
    teams = info.desc.toLowerCase().split(' @ ');
  }

  let bet365TeamName;
  let teamName = getBet365TeamName(data);
  if(data.bet365.homeAway == "home"){
    bet365TeamName = teams[0];
  }else{
    bet365TeamName = teams[1];
  }
  log(`팀이름확인 '${teamName}' in '${bet365TeamName}'`, "danger");
  return bet365TeamName && bet365TeamName.indexOf(teamName.toLowerCase()) > -1;
}



async function checkGameType(data, bet365Info, logging){
  let comment, checkType;

  // async function saveTest(){
  //   let res = await api.saveTestData({
  //     check: checkType,
  //     data: {
  //       betburger: data,
  //       bet365Info,
  //       betType: data.bet365.betType,
  //       comment
  //     }
  //   })
  //   if(res.status == "success"){
  //     return res.data;
  //   }else{
  //     return null;
  //   }
  // }

  if(data.bet365.betType == "TOTAL_POINTS"){
    //// bet365Info.title
    // 보통 "(0-0) Under2.5" 이렇게온다.
    // "(0-0) Under2.5,3.0" 의 형태가 있다. 이건 2.75
    ///// 이때 bet365Info.handicap에 "2.5", "2.5,3.0" 핸디문자열이 있다.

    let typestr = bet365Info.title.toLowerCase();
    let handi = calcBet365Handi(bet365Info);
    if(typestr.indexOf(data.bet365.side.toLowerCase()) > -1){
      checkType = true;
    }else{
      comment = `OVER/UNDER 다름 '${data.bet365.side.toLowerCase()}' not in '${typestr}'`;
      log(comment, "danger");
      checkType = false;
    }

    if(checkType){
      if(handi == null){
        handi = bet365Info.handicap2;
      }

      if(handi == data.bet365.handicap){
        checkType = true;
      }else{
        comment = `핸디 달라짐. ${data.bet365.handicap} -> ${handi}`;
        log(comment, "danger");
        checkType = false;
      }
    }
  }else if(data.bet365.betType == "MONEYLINE"){
    checkType = true;
  }else if(data.bet365.betType == "SPREAD"){
    let handi = calcBet365Handi(bet365Info);
    // let handi = bet365Info.handicap2;
    if(handi == null){
      handi = bet365Info.handicap2;
    }
    if(handi == data.bet365.handicap || (handi == 0 && data.bet365.handicap == null)){
      checkType = true;
    }else{
      comment = `핸디 달라짐. ${data.bet365.handicap} -> ${handi}`;
      log(comment, "danger");
      checkType = false;
    }
  }else{
    log(`예외 타입 ${data.bet365.betType}`);
    checkType = true;
  }

  if(logging){
    let cs;
    if(!checkType){
      cs = "danger";
    }else{
      cs = "info";
    }

    log("----- type check test -----");
    log(`bet365Info.market: ${bet365Info.market}`, cs);
    log(`bet365Info.title: ${bet365Info.title}`, cs);
    log(`bet365Info.type: ${bet365Info.type}`, cs);
    log(`betburger.betType: ${data.bet365.betType}`, cs);
    log(`betburger.type: ${data.bet365.type.code} | ${data.bet365.type.set}`, cs);
    log(`betburger.side: ${data.bet365.side}`, cs);
    log(`betburger.team: ${data.bet365.team}`, cs);
    log("----------------------------");

    // if(!checkType){
    //   log(`typelog save ID: ${await saveTest()}`);
    // }
  }

  return checkType;
}

function checkOddsForBet365(data){
  if(betOption.minOddsForBet365 == undefined){
    console.error("벳삼 최소배당정보가 없음.");
    return false;
  }
  let checkOdds = betOption.minOddsForBet365;
  if(data.bet365.odds <= betOption.minOddsForBet365){
    log(`벳365 최소배당보다 작습니다. ${data.bet365.odds}/${betOption.minOddsForBet365}`, "danger", true);
    return false;
  }
  return true;
}

function openBet365EveryBrowser(data){
  sendDataToServer("inputGameUrl", data.bet365.betLink);
}

async function checkBetmaxProcess(data){
  console.log(data);
  // let ids = getEventIds(data);
  printGame(data);

  if(!checkOddsForBet365(data)){
    log(`배팅취소`, "danger", true);
    benEvent(data, "OBOK", 20000, "벳삼 최소배당 미만");
    return;
  }

  console.error("wait pnc balance");
  let balance = await sendData("getBalance", null, PN_BG);
  if(balance.availableBalance < 10){
    log(`피나클 충전이 필요합니다. ($${balance.availableBalance})`, "warning", true);
    stopMatch(true);
    sendDataToSite("sound", {name:"lakePncMoney"});
    return;
  }else{
    log(`피나클 잔액: $${balance.availableBalance}`, null, true);
  }
  if(!flag.isMatching) return;
  console.error("wait getLine");
  let line = await sendData("getLine", data.pinnacle, PN_BG);
  let checkLine;
  console.error({line});
  if(line && line.lineData){
    if(line.lineData.status == "SUCCESS"){
      checkLine = true;
      log(`라인확인: ${line.lineData.price}`, null, true);
      if(data.pinnacle.odds != line.lineData.price){
        log(`피나클 배당변동: ${data.pinnacle.odds} -> ${line.lineData.price}`, data.pinnacle.odds < line.lineData.price ? "info" : "danger", true);
        data.pinnacle.odds = line.lineData.price;
      }
    }else{
      console.error(line.lineData.status);
      log(`라인찾기실패: ${line.lineData.status}`, "danger", true);
      benEvent(data, "PK", 0);
      return;
      // let count = lineFindFailCountUp(ids.peId);
      // if(count >= 2){
      //   benEvent(ids.peId, 0, "2 연속 못찾음");
      // }
    }
  }else{
    log(`이벤트로드 실패`, "danger", true);
    benEvent(data, "PK", 0);
    return;
  }

  if(!flag.isMatching) return;

  let bet365Info, checkProfit, checkType, isTypeTest = false;
  // #2 벳삼열어서 배당 및 타입체크
  if(checkLine){
    openBet365EveryBrowser(data);
    bet365Info = await openBet365AndGetInfo(data);
    if(!bet365Info){
      return;
    }



    if(!checkBet365TeamName(data, bet365Info)){
      log(`배팅취소: 벳삼 팀이름 다름`, "danger", true);
      benEvent(data, "BK", 0);
      //data.bet365.betburgerEventId, 0);
      return;
    }

    checkType = await checkGameType(data, bet365Info, isTypeTest);

    if(!checkType){
      log(`배팅취소: 벳삼 타입 다름`, "danger", true);
      benEvent(data, "BK", 0);
      // benEvent(data.bet365.betburgerEventId, 0);
      return;
    }

    if(isTypeTest){
      /////////////// TEST
      benEvent(data, "BK", 0);
      // benEvent(data.bet365.betburgerEventId, 0);
      return;
      /////////////////
    }

    if(checkLakeMoney(data, 1)){
      return;
    }

    if(changeOddsBet365Process(data, bet365Info.odds)){
      updateBet365Link(data);
    }

    if(!checkOddsForBet365(data)){
      log(`배팅취소`, "danger", true);
      benEvent(data, "OBOK", 20000, "벳삼 최소배당 미만");
      return;
    }

    // betmax 확인전에는 수익률로만 판단
    checkProfit = profitPValidation(data);

    if(!checkProfit){
      benEvent(data, "EBOK", 10000);
      // benEvent(data.bet365.betburgerEventId, 10000);
      log(`배팅취소`, 'danger', true);
      return;
    }


  }

  let checkPinnacleBet, betResult;
  // #3 피나클 배팅.
  if(checkProfit){
    if(!flag.isMatching) return;
    betResult = await placeBet(line);
    if(betResult.status == "success"){
      // 피나클 배팅완료후, 배팅된 배당으로 다시 수익률을 판단할 필요가 있나 ?
      // checkProfit = validProfitP(betResult.data.price, bet365Info.odds);
      if(betResult.data.price != data.pinnacle.odds){
        log(`피나클배팅후 배당바뀜: ${data.pinnacle.odds} -> ${betResult.data.price}`, data.pinnacle.odds < betResult.data.price ? "info" : "danger", true);
        data.pinnacle.odds = betResult.data.price;
        // checkProfit = validProfitP(data.bet365.odds, data.pinnacle.odds, true) && validProfit(data.bet365.odds, data.pinnacle.odds, data.bet365.stake, true);
        checkProfit = profitPValidation(data);
        if(!checkProfit){
          log(`배팅취소`, 'danger', true);
          return;
        }
      }
      checkPinnacleBet = true;
    }else{
      return;
    }
  }

  // #4 벳맥스 체크
  if(checkLine && checkProfit && checkPinnacleBet){
    activeBet365();
    log(`betmax 확인시작`, null, true);
    let betmaxInfo = await sendData("getBetmax", null, PN_B365);
    activeMain();
    console.error({betmaxInfo});
    if(betmaxInfo == null){
      log(`배팅취소: 벳365 이벤트 사라짐`, 'danger', true);
      benEvent(data, "BK", 7000);
      return;
    }

    if(betmaxInfo.status == "logouted"){
      log("배팅취소: 벳365 로그아웃 됨. 재 로그인 시도 중..", "danger", true);
      let m = await reLogin();
      if(m == null){
        log("재 로그인 실패. 브라우져를 다시 켜주세요.", "danger", true);
        stopMatch(true);
      }
      return;
    }

    if(betmaxInfo.status == "placed"){
      log(`배팅취소: ${betmaxInfo.message}`, "danger", true);
      stopMatch(true);
      return;
    }

    if(betmaxInfo.status == "false"){
      log(`배팅취소: ${betmaxInfo.message}`, "danger", true);
      benEvent(data, "BK", 7000);
      return;
    }

    checkType = await checkGameType(data, betmaxInfo.info);
    if(!checkType){
      log(`배팅취소: 벳삼 타입 다름`, "danger", true);
      benEvent(data, "BK", 0);
      return;
    }

    // if(betOption.betmaxRatio !== undefined){
    //   let nbm = round(betmaxInfo.betmax * betOption.betmaxRatio/100, 2);
    //   log(`betmax:${betmaxInfo.betmax} -> ${nbm}(${betOption.betmaxRatio}%)`, null, true);
    //   betmaxInfo.betmax = nbm;
    // }

    // 체크기에서 일부러 큰값을 보낸다. 배팅기에서 벳맥스체크를 다시 하도록 유도.
    // 추후에는.. 체크기와 동일한 시점에 작동하도록 고민...
    // betmaxInfo.betmax = betmaxInfo.betmax * 2;

    // 벳맥스체크에서는 원래값을 그냥보내고 배팅기에서 절삭처리하도록 변경한다.
    if(betmaxInfo.betmax > betOption.maxBetmax){
      log(`betmax 제한값 초과. 절삭: $${betOption.maxBetmax}`, null, true);
      betmaxInfo.betmax = betOption.maxBetmax;
    }

    log(`betmax: $${betmaxInfo.betmax}, odds: ${betmaxInfo.info.odds}`, null, true);
    data.bet365.stake = round(betmaxInfo.betmax, 2);
    if(betmaxInfo.info.odds != data.bet365.odds){
      log(`벳삼배당바뀜: ${data.bet365.odds} -> ${betmaxInfo.info.odds}`, data.bet365.odds < betmaxInfo.info.odds ? "info" : "danger", true);
      data.bet365.odds = betmaxInfo.info.odds;
      if(!checkOddsForBet365(data)){
        log(`배팅취소`, "danger", true);
        benEvent(data, "OBOK", 20000, "벳삼 최소배당 미만");
        return;
      }
      checkProfit = validProfitP(data.bet365.odds, data.pinnacle.odds);
    }

    if(checkProfit){
      checkProfit = validProfit(data.bet365.odds, data.pinnacle.odds, data.bet365.stake);
      // log(`수익: $${profit}`, checkProfit ? "info" : "danger", true);
    }

    ////////////////////
    /////// test ///////
    // if(!flag.isMatching) return;
    // activeBet365();
    // // log(`벳365 배팅시작`, "info", true);
    // let result, checkBet, isChangeOdds, isFirst = true, lakeMoney;
    // while(1){
    //   if(1 || checkProfit){
    //     if(isChangeOdds || isFirst){
    //       isFirst = false;
    //       isChangeOdds = false;
    //       log(`벳365 배팅시작 <span class="text-warning">$${data.bet365.stake}</span>`, "info", true);
    //     }
    //
    //     // BOK
    //     // if(isBenEvent(data.bet365.id+data.bet365.odds)){
    //     // OBOK
    //     if(isBenEvent(data.bet365.eventId+data.bet365.odds)){
    //       log(`제외된 배당입니다.(${data.bet365.eventId+data.bet365.odds})`, "warning", true);
    //       break;
    //     }
    //
    //     if(!checkOddsForBet365(data)){
    //       benEvent(data, "OBOK", 20000, "벳삼 최소배당 미만");
    //       break;
    //     }
    //
    //     if(result){
    //       checkType = await checkGameType(data, result.info, false);
    //       if(!checkType){
    //         //: 벳삼 타입 다름
    //         log(`벳365 배팅실패: 벳삼 타입다름`, "danger", true);
    //         benEvent(data, "BK", 0);
    //         break;
    //       }
    //     }
    //
    //     result = await sendData("placeBet", {stake:data.bet365.stake, prevInfo:bet365Info}, PN_B365);
    //     if(result && result.info){
    //       bet365Info = result.info;
    //     }
    //     console.log("bet365 betting..", result);
    //     if(result === undefined || result === null){
    //       log("벳365 배팅실패: 응답없음.", "danger", true);
    //       break;
    //     }
    //
    //     // 배팅완료한뒤에는 체크하지 말자.
    //     // checkType = await checkGameType(data, result.info);
    //     // if(!checkType){
    //     //   log(`배팅취소: 벳삼 타입 다름`, "danger", true);
    //     //   benEvent(data, "BK", 0);
    //     //   if(result.status == "success"){
    //     //     log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", "danger", true);
    //     //     log(`벳365 배팅완료 후 타입바뀜!`, "danger", true);
    //     //     stopMatch(true);
    //     //   }
    //     //   break;
    //     // }
    //     if(result.status == "notEnoughFunds"){
    //       log(`벳365 배팅실패: ${result.message}`, "danger", true);
    //       stopMatch(true);
    //       break;
    //     }
    //
    //     if(result.status == "acceptChange"){
    //       isChangeOdds = changeOddsBet365Process(data, result.info.odds);
    //       if(isChangeOdds){
    //         updateBet365Stake(data);
    //         checkProfit = profitAllValidation(data);
    //       }
    //     }else if(result.status == "lakeMoney"){
    //       log(`벳365 잔액부족 stake:$${result.stake}, money:$${result.money}`, "danger", true);
    //       changeOddsBet365Process(data, result.info.odds);
    //       data.bet365.stake = result.money;
    //       updatePncStake(data);
    //       checkProfit = profitAllValidation(data);
    //       lakeMoney = true;
    //     }else if(result.status == "success"){
    //       if(result.info.market == ""){
    //         log(`배팅취소: 배팅카트 사라짐`, "danger", true);
    //       }else{
    //         log(`벳365 배팅완료!`, "success", true);
    //         checkBet = true;
    //       }
    //       break;
    //     }else{
    //       log(`벳365 배팅실패: ${result.message}`, "danger", true);
    //       if(result.status == "restriction"){
    //         stopMatch(true);
    //       }
    //       break;
    //     }
    //   }else{
    //     log(`배팅취소`, 'danger', true);
    //     break;
    //   }
    // }
    // activeMain();
    // console.log("bet365 bet complete", result);
    //
    // if(checkBet){
    //   log("TEST: 벳삼배팅완료", "success", true);
    // }else{
    //   log("TEST: 벳삼배팅실패", "danger", true);
    // }
    // return;
    ////////////////////
    ////////////////////


    console.error("##", line);
    if(checkProfit){
      updatePncStake(data);
      log(`
        <div class="text-info">------ 데이터 전송 ------</div>
        <div class="text-warning">피나클: $${data.pinnacle.stake} (${data.pinnacle.odds})</div>
        <div class="text-success">벳365: $${data.bet365.stake} (${data.bet365.odds})</div>
      `, null, true);

      betResult.data.pncLine = line.lineData;
      betResult.data.betburger = data;
      betResult.data._id = betResult.data.uniqueRequestId;
      betResult.data.bookmaker = betmaxInfo;
      sendDataToServer("inputGameData", betResult.data);
      // benEvent(data, "BOK", 0, "데이터 수집");
      benEvent(data, "OBOK", 0, "데이터 수집");
    }else{
      log(`배팅취소`, 'danger', true);
    }
  }
}//end checkBetmaxProcess

async function vlProcess(data){

}

async function startMatch(sync){
  log("-------- 매칭켜짐 --------", "info", true);
  flag.isMatching = true;
  updateMatchButtonState();
  if(sync){
    sendDataToSite("receiveMatchFlag", flag.isMatching);
  }
  if(!(await checkBalance())){
    stopMatch(sync);
  }

  return flag.isMatching;
}

function stopMatch(sync){
  log("-------- 매칭꺼짐 --------", "danger", true);
  flag.isMatching = false;
  updateMatchButtonState();
  if(sync){
    sendDataToSite("receiveMatchFlag", flag.isMatching);
  }
}

let taitv;
function tabActiveSchedule(){
  clearTimeout(taitv);
  taitv = setInterval(async ()=>{
    activeBet365();
    await delay(100);
    activeMain();
  }, 1000 * 60 * 60)
}

var resolveList = {};
let urlParams;

function setupF5Lock(){
  window.addEventListener("keydown", e=>{
    if(e.key == "F5"){
      e.preventDefault();
    }
  }, false)
}

function setupMode(mode){
  if(mode == "dev"){
    devMode = true;
    $(".container").hide();
    $("#matchButton").show();
    $("#optionName").show();
    $(".log-container").show();
    $(".log-container").css("height", "calc(100vh - 63px)");
  }else{

    $(".container").show();
    $("#matchButton").hide();
    $("#optionName").hide();
    $(".log-container").hide();

    let styleStr = `
    #matchButton2 {
        width: 219px;
        height: 179px;
        background: url(//www.surebet.vip/extension/main/imgs/startbtn-normal.png);
        position: absolute;
        top: 50%;
        left: 50%;
        margin: 20px 0 0 -110px;
        cursor: pointer;
      }
      #matchButton2:hover {
        background: url(//www.surebet.vip/extension/main/imgs/startbtn-hover.png);
      }

      #matchButton2.active {
        background: url(//www.surebet.vip/extension/main/imgs/stopbtn-normal.png);
      }

      #matchButton2.active:hover {
        background: url(//www.surebet.vip/extension/main/imgs/stopbtn-hover.png);
      }

      .icon {
        width: 250px;
        height: 250px;
        background: url(//www.surebet.vip/extension/main/imgs/off-icon.png);
        position: absolute;
        top: 50%;
        left: 50%;
        margin: -210px 0 0 -125px;
      }

      .icon.active {
        background: url(//www.surebet.vip/extension/main/imgs/on-icon.png);
      }

      .container{
        position: fixed;
        left: 0px;
        right: 0px;
        top: 0px;
        bottom: 0px;
        background-color: rgb(5,5,5);
      }
    `;

    if($(".product-style").length == 0){
      $(document.head).append($('<style class="product-style">').html(styleStr));
    }
  }
}

async function init(){
  console.error("init");
  // console.log(code.toString());
  let bet365Code = bet365JS.toString().replace(/^function bet365JS\(\)\{/,'').replace(/}$/,'');
  let apiCode = setupAPI.toString();
  let bgCode = bgJS.toString().replace(/^function bgJS\(\)\{/,'').replace(/}$/,'');
  // let params = getParam();
  urlParams = getUrlParams(window.location.href);
  history.replaceState({}, "index", "http://localhost:8080/main.html?v=" + version);

  // axios.get("http://lumtest.com/myip.json").then(res=>{
  //   console.error(res.data);
  // })

  setupF5Lock();

  socket = io();
  setupOnMessage();

  // let _ip = ip();
  // setData("ip", _ip);
  // $("#ip").html(_ip);
  // $("#ip").remove();
  // document.title = _ip;
  // $("h1").remove();

  setupMode("product");

  socket.on("resolve", (data, uuid)=>{
    if(resolveList[uuid]){
      resolveList[uuid](data);
      delete resolveList[uuid];
    }
  })

  socket.on("connect", async ()=>{
    console.log("socket connected");
    let data = {
      bid: urlParams.bid,
      email: urlParams.email,
      countryCode: urlParams.countryCode,
      // ip: _ip,
      needPnc: urlParams.needPnc == "true"
    };
    BID = data.bid;
    EMAIL = data.email;
    ///
    // data.isChecker = true;
    ///
    socket.emit("initMainPage", data);
    // sendSocketData("loadBrowserInfo", data);
    // sendData("loadBrowserInfo", data, PN_BG);
    await sendData("runBgCode", {code:bgCode}, PN_BG);
    await sendData("runApiCode", {email:EMAIL, code:apiCode}, PN_BG);
    await sendData("saveBet365Account", data, PN_BG);
    await sendData("runBet365Code", bet365Code, PN_BG);
    api = setupAPI(EMAIL);

    // tabActiveSchedule();
  })

  socket.on("sendData", data=>{
    if(data.to == "main"){
      onMessage(data);
    }else{
      sendData(data.com, data.data, data.to, true);
    }
  })

  socket.on("getState", (data, uuid)=>{
    let r = {
      // ip: getData("ip"),
      isMatching: flag.isMatching
    }
    // console.error("getState", r);
    // console.error("send resolve", uuid);
    socket.emit("resolve", r, uuid);
  })

  socket.on("startMatch", async (data, uuid)=>{
    console.log("startMatch", data, uuid);
    let r = await startMatch();
    if(uuid){
      socket.emit("resolve", r, uuid);
    }
  })

  socket.on("stopMatch", (data, uuid)=>{
    console.log("stopMatch", data, uuid);
    stopMatch();
    if(uuid){
      socket.emit("resolve", false, uuid);
    }
  })

  socket.on("loadMoney", async (data, uuid)=>{
    console.error("loadMoney", data, uuid);
    if(!flag.bet365LoginComplete){
      if(uuid){
        socket.emit("resolve", "로그인 전입니다.", uuid);
      }
      log("벳365 money갱신: 로그인 전입니다", null, true);
      return;
    }
    log("벳365 money갱신중..", null, true);
    activeBet365();
    let money = await sendData("loadMoney", null, PN_B365);
    activeMain();
    console.error("money", money);
    log(`벳365 money갱신: $${money}`, null, true);
    if(uuid){
      socket.emit("resolve", money, uuid);
    }
  })

  socket.on("withdraw", async (data, uuid)=>{
    console.error("withdraw", data, uuid);
    if(!flag.bet365LoginComplete){
      if(uuid){
        socket.emit("resolve", "로그인 전입니다.", uuid);
      }
      log("벳365 출금시도: 로그인 전입니다", null, true);
      return;
    }
    log("벳365 출금시도중..", null, true);
    activeBet365();
    let money = await sendData("withdraw", data, PN_B365);
    activeMain();
    // console.error("money", money);
    if(money == null){
      log(`벳365 출금요청실패`, "danger", true);
    }else{
      log(`벳365 출금요청완료. 잔액: $${money}`, null, true);
    }
    if(uuid){
      socket.emit("resolve", money, uuid);
    }
  })

  // socket.on("setChecker", data=>{
  //
  // })



  socket.on("gamedata", data=>{
    if(!flag.bet365LoginComplete) return;

    console.log("receive gamedata", data);
    let gd;
    try{
      gd = JSON.parse(data.data);
    }catch(e){
      console.error("gamedata parsing error. data:", data);
      return;
    }
    setData("gamedata", gd);

    if(!flag.isMatching) return;
    // sendData("gamedata", data, "bg");

    // console.log("gamedata", gd);

    findMatch();
  })

  socket.on("gamedata2", async data=>{
    if(!flag.bet365LoginComplete) return;
    console.log("receive gamedata2");

    await delay(Math.random()*1000);

    setData("gamedata", data);
    if(!flag.isMatching) return;
    // sendData("gamedata", data, "bg");
    // let gd = JSON.parse(data);
    // console.log("gamedata", data);
    //
    findMatch2(data);
  })

  socket.on("gameurl", data=>{
    sendData("setPreUrl", data, PN_B365, true);
  })
}

init();

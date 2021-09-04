console.log("bg code");
function bgJS(){
  // var require_body_version = 1.0;
  function checkBodyVersion(){
    return window.body_version && window.body_version && window.body_version >= 1.0;
  }
  window.code_version = 1.0;
  console.log({version:window.code_version});

  // if(!window.addedAgentChanger){
  //   window.addedAgentChanger = true;
  //   chrome.webRequest.onBeforeSendHeaders.addListener(
  //     function (details) {
  //       for (var i = 0; i < details.requestHeaders.length; ++i) {
  //         if (details.requestHeaders[i].name === 'User-Agent') {
  //           // details.requestHeaders[i].value = details.requestHeaders[i].value + ' OurUAToken/1.0';
  //           details.requestHeaders[i].value = 'Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36';
  //           break;
  //         }
  //       }
  //       return { requestHeaders: details.requestHeaders };
  //     },
  //     { urls: ['https://*.bet365.com/*'] },
  //     ['blocking', 'requestHeaders']
  //   );
  // }

  function removeCache(){
    return new Promise(resolve=>{
      // chrome.browsingData.removeCache({}, resolve);
      chrome.browsingData.remove({
        // "origins": ["https://www.bet365.com"]
        }, {
        "cacheStorage": true,
        "cookies": true,
        "fileSystems": true,
        "indexedDB": true,
        "localStorage": true,
        "serviceWorkers": true,
        "webSQL": true
      }, resolve);
    })
  }

  let betData = {};
  let betHeaders = {};
  let betslipData = {};
  let timekeyReceiveTime = {};

  //벳삼 먹통을 체크하기 위한 변수
  // 소켓통신이 complete 되기까지(+1sec) 벳슬립 정보가 없으면
  // 먹통으로 간주하자
  let bet365WwsState = {};
  let loadedBetslip = {};
  let updateTabState = {};

  window._onBgMessage = async function _onBgMessage(message){
    let {com, data, from} = message;
    let resolveData;

    switch(com){
      case "withdrawComplete":
        chrome.tabs.query({ active: true }, function(tabs) {
          chrome.tabs.remove(tabs[0].id, ()=>{
            sendData("withdrawComplete", data, PN_B365, true);
          });
        });
        // chrome.tabs.query({url:data.url}, function(tabs){
        //   chrome.tabs.remove(tabs[0].id);
        // });
      break;

  		case "getBalance":
  			resolveData = await papi.getBalance();
  		break;

  		case "getLine":
  			if(!pinnacleSportsMap[data.sports]){
  				console.error("can not find sports object in pinnacleSportsMap", data.sports);
  				break;
  			}

  			let sportId = pinnacleSportsMap[data.sports].id;

  			let eventId = data.eventId;
  			if(data.isLive && data.sports == "Soccer"){
  				console.error("라이브 축구 이벤트ID 다시찾기", data.eventId);
  				try{
  					// 이벤트 id 찾기
  					let teamName = data[data.homeAway];
  					let events = (await papi.getEvents({sportId:sportId, isLive:1})).league;
  					for(let o=0; o<events.length; o++){
  				    let event = events[o].events.find(e=>e[data.homeAway] == teamName);
  				    if(event){
  							eventId = event.id;
  			        console.error("결과", event.id, event);
  			        break;
  			    	}
  					}
  				}catch(e){
  					console.error(e);
  				}
  			}

  			let line = await papi.scGetLine({
  				eventId: eventId,
  				sportId: sportId,
  				isLive: data.isLive,
  				betType: data.betType,
  				team: data.team,
  				side: data.side,
  				periodNumber: data.periodNumber,
  				handicap: data.handicap
  			})

  			resolveData = line;
  		break;

  		case "placeBet":
  			resolveData = await papi.scMinPlaceBet(data);
  		break;

  		case "getBets":
  			resolveData = await papi.getBets({uniqueRequestIds:data});
  		break;

  		case "setBet365InitMessage":
  			// DATA.setBet365InitMessage = data;
  			setData("setBet365InitMessage", data);
  		break;

      case "getBetData":
        // resolveData = betData[tabInfos.bet365.id];
        try{
          resolveData = JSON.parse(JSON.stringify(betData[tabInfos.bet365.id]));
        }catch(e){
          resolveData = undefined
        }
      break;

      case "getBetHeaders":
        resolveData = betHeaders[tabInfos.bet365.id];
      break;

      case "getBetslipData":
        try{
          console.log("getBetslipData", betslipData[tabInfos.bet365.id]);
          if(betslipData[tabInfos.bet365.id]){
            resolveData = JSON.parse(JSON.stringify(betslipData[tabInfos.bet365.id]));
          }else{
            resolveData = undefined;
          }
        }catch(e){
          console.error(e);
          resolveData = undefined;
        }
      break;

      case "setBetslipData":
        try{
          betslipData[tabInfos.bet365.id] = data;
        }catch(e){
          console.error(e);
          resolveData = undefined;
        }
      break;

      case "isTimekeyOver":
        resolveData = Date.now() - (timekeyReceiveTime[tabInfos.bet365.id]||0) > (1000*60*3);
      break;

      case "resetTimekeyTime":
        timekeyReceiveTime[tabInfos.bet365.id] = 0;
      break;

      case "removeCache":
        await removeCache();
      break;

      // case "updatedUrl":
      //   console.error("% update url");
      //   updateTabState[tabInfos.bet365.id] = 0;
      // break;

  		case "readyBet365":
  			// data.bid, data.email

        /// test
        // break;

        if(!checkBodyVersion()){
          let msg = "업그레이드가 필요한 버전입니다. " + window.body_version;
          log(msg, "danger", true);
          // alert(msg);
          break;
          // throw new Error(msg);
        }

  			try{

  				if(getData("setBet365InitMessage")){
  					let initMessage = getData("setBet365InitMessage");
  					_sendData(initMessage);
  					removeData("setBet365InitMessage");
  					break;
  				}

  				let browser = localStorage.getItem('browser');
  				if(!browser){
  					// sendDataToSite("receiveIP", getData("ip"));

  					let res = await api.loadBrowser(BID);
  					console.log("load browser info", res);
  					if(res.status == "success"){
  						browser = res.data;
  						localStorage.setItem('browser', browser);

  						let account = browser.account;
  						// setProxy(setting['proxyZone-'+account.country], setting['proxyPw-'+account.country]);
  						// test
  						// account = {
  						// 	id: "banu8995",
  						// 	pw: "Asas1234@"
  						// };
  						console.log('login', account);
  						log('벳365 로그인 중.');
  						activeBet365();
  						let itv = setTimeout(()=>{
  							console.error("로그인 응답이 20초동안 없음. 강제 새로고침 시도");
  							log("로그인 응답이 20초동안 없음. 강제 새로고침 시도");
  							refreshBet365();
  						}, 20 * 1000);
  						let money = await sendData("login", account, PN_B365);
  						clearTimeout(itv);
  						activeMain();
  						if(money == null){
  							log('로그인 실패');
  						}else{
  							// log(`벳365 (${account.id}) 로그인 완료. 잔액: ${money}`);
  							// sendDataToServer("updateMoney", money);
  							sendDataToMain("bet365LoginComplete",{
  								account,
                  money,
  								// pinnacleId: getData("pinnacleId"),
  								betOption: browser.option.data,
  								optionName: browser.option.name
  							});


                sendData("bet365LoginComplete", null, PN_B365, true);

                // 벳삼은 자주 새로고침된다. 처음에주는건 의미가 없으니 주석. 항상 받아서 사용하자.
                // sendData("betOption", browser.option.data, PN_B365, true);
  							// sendDataToServer("bet365InitData", {
  							// 	money,
  							// 	limited
  							// })
  						}
  					}else{
  						alert(res.message);
  					}
  				}
  			}catch(e){
  				console.error(e);
  			}
  		break;

  		case "getIP":
  			sendDataToSite("receiveIP", getData("ip"));
  			// sendData("receiveIP", getData("ip"), 'site');
  		break;

  		case "getState":
  			sendDataToSite("receiveState", {
  				ip: getData("ip"),
  				isMatching: await sendData("isMatching", null, PN_MAIN)
  			});
  			// sendData("receiveIP", getData("ip"), 'site');
  		break;

      // case "setAgent":
      //   var protocolVersion = '1.0';
      //   chrome.debugger.attach({
      //     tabId: tabInfos.bet365.id
      //   }, protocolVersion, function() {
      //     if (chrome.runtime.lastError) {
      //         console.error(chrome.runtime.lastError.message);
      //         return;
      //     }
      //     // 2. Debugger attached, now prepare for modifying the UA
      //     chrome.debugger.sendCommand({
      //         tabId: tabInfos.bet365.id
      //     }, "Network.enable", {}, function(response) {
      //         // Possible response: response.id / response.error
      //         // 3. Change the User Agent string!
      //         chrome.debugger.sendCommand({
      //             tabId: tabInfos.bet365.id
      //         }, "Network.setUserAgentOverride", {
      //             userAgent: data
      //         }, function(response) {
      //             // Possible response: response.id / response.error
      //             // 4. Now detach the debugger (this restores the UA string).
      //             chrome.debugger.detach({tabId: tabInfos.bet365.id});
      //         });
      //     });
      //   });
      // break;
  	}

    return resolveData;
  }


  function buf2str(buf){
    return decodeURIComponent(String.fromCharCode.apply(null, new Uint8Array(buf)));
  }

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab)=>{
    // if(tabInfos[PN_B365].id == tabId){
    //   console.error("@@@@@@@", changeInfo, tab);
    // }
		if(tabInfos[PN_B365].id == tabId && tab.status == "complete"){
      if(tab.url.indexOf("bet365.com") > -1){
        console.error("%%% update");
  			// console.error("updated bet365", tab);
        updateTabState[tabInfos.bet365.id] = 0;
        loadedBetslip[tabInfos.bet365.id] = false;
  			// clearTimeout(bet365UpdatedItv);
  			// bet365UpdatedItv = setTimeout(runBet365Code, 200);
      }
      //// 감지안됨.
      // else if(tab.url.indexOf("localhost") > -1){
      //   console.error("!!! localhost cache 제거");
      //   await removeCache();
      // }
		}
	})

  // chrome.webRequest.onBeforeRequest.addListener(function (details) {
  //   let c;
  //   let w = details.url.match(/wss:\/\/([^.]+).*/)[1];
  //   if(details.url.indexOf("premws-pt")>-1){
  //     c = "#";
  //   }else{
  //     c = "@";
  //   }
  //   console.error(`${c} ${w} socket before request`, details);
  //   // if(updateTabState[details.tabId] == 0){
  //   //   bet365WwsState[details.tabId] = 0;
  //   //   loadedBetslip[details.tabId] = false;
  //   // }
  // }, {
  //   "urls": [
  //     // "wss://premws-pt3.365lpodds.com/zap/?uid=*",
  //     // "wss://premws-pt2.365lpodds.com/zap/?uid=*",
  //     // "wss://premws-pt1.365lpodds.com/zap/?uid=*",
  //     "wss://pshudws.365lpodds.com/zap/?uid=*"
  //   ],
  //   "types": ['xmlhttprequest',"websocket"]
  // }, ["requestBody"]);

  let repairRefreshCount = {};
  async function repairRefresh(){
    let itv = setTimeout(()=>{
      // 벳삼먹통인상황으로 간주. 새로고침하자
      if(repairRefreshCount[tabInfos.bet365.id] === undefined){
        repairRefreshCount[tabInfos.bet365.id] = 0;
      }
      repairRefreshCount[tabInfos.bet365.id]++;

      if(repairRefreshCount[tabInfos.bet365.id] < 5){
        console.error("!!! 먹통 새로고침");
        refreshBet365();
      }else{
        console.error("!!! 먹통 새로고침 횟수 초과로 새로고침 안함");
      }
    }, 1000)
    let chk = await sendData("checkPage", null, PN_B365);
    if(!chk){
      clearTimeout(itv);
    }
  }

  chrome.webRequest.onCompleted.addListener(function (details) {
    if(tabInfos.bet365.id != details.tabId){
      return;
    }
    let c;
    let w = details.url.match(/wss:\/\/([^.]+).*/)[1];
    if(details.url.indexOf("premws-pt")>-1){
      c = "###";
    }else{
      c = "@@@";
    }
    console.error(`${c} ${w} socket completed`, details);

    if(updateTabState[details.tabId] == 0){
      // bet365WwsState[details.tabId] = 1;
      updateTabState[details.tabId] = 1;
      setTimeout(()=>{
        if(updateTabState[details.tabId] == 1 && !loadedBetslip[details.tabId]){
          // https://www.bet365.com/?bs=101157588-1606551388~7&bet=1#/IP/EV15591587195C13
          chrome.tabs.get(tabInfos.bet365.id, async tab=>{
            if(tab && tab.url.indexOf("https://www.bet365.com/?bs=") == 0){
              console.error("배팅페이지에서 먹통체크");
              repairRefresh();
            }else{
              // console.error("배팅페이지아닌 곳에서 먹통체크");
              // repairRefresh();
            }
          })
        }
      }, 2000);
    }
  }, {
    "urls": [
      // "wss://premws-pt3.365lpodds.com/zap/?uid=*",
      // "wss://premws-pt2.365lpodds.com/zap/?uid=*",
      // "wss://premws-pt1.365lpodds.com/zap/?uid=*",
      "wss://pshudws.365lpodds.com/zap/?uid=*"
    ],
    "types": ['xmlhttprequest',"websocket"]
  }, ["responseHeaders"]);


  // chrome.webRequest.onBeforeRequest.addListener(function (details) {
  //   if(tabInfos.bet365.id != details.tabId){
  //     return;
  //   }
	// 	console.error("$$$check", details.url, details);
	// }, {
	// 	"urls": ["https://www.bet365.com/BetsWebAPI/*"],
	// 	"types": ["xmlhttprequest"]
	// }, ["extraHeaders", "requestBody"]);
  chrome.webRequest.onHeadersReceived.addListener(async function (details) {
    if(tabInfos.bet365.id != details.tabId){
      return;
    }
    if(details.statusCode != 302){
      return;
    }
    let h = details.responseHeaders.find(h=>{
      return h.name == "Location"
    })
    if(h && h.value == "http://localhost"){
      console.error("@@@ found localhost. removeCache");
      // sendData("foundLocalhost", null, PN_MAIN, true);
      await removeCache();
      log("localhost발생. 캐시제거", "danger", true);
      localStorage.removeItem('browser');
      setData("setBet365InitMessage", null);
      // await sendData("localhostProcess", null, PN_B365);

      // sendData("foundLocalhost", null, PN_MAIN, true);

      console.error("@@@ refreshBet365");
      refreshBet365();
      // await delay(2000);
      // sendData("reLogin", null, PN_B365);
    }
    // console.error("HEADER", details);
  }, {
		"urls": ["https://www.bet365.com/*"],
		"types": ["xmlhttprequest"]
	}, ["extraHeaders", "responseHeaders"]);


  chrome.webRequest.onBeforeRequest.addListener(function (details) {
    if(tabInfos.bet365.id != details.tabId){
      return;
    }
		// console.error("onBeforeRequest", details);
    // let str = decodeURIComponent(String.fromCharCode.apply(null, new Uint8Array(details.requestBody.raw[0].bytes)));
    if(details.requestBody.raw){
      let str = buf2str(details.requestBody.raw[0].bytes);
      let data = str.split('&').reduce((r,kv)=>{
        if(kv){
          let arr = kv.split('=');
          r[arr.shift()] = arr.join('=');
        }
        return r;
      },{});
      betData[details.tabId] = {
        data
      };
      console.error("betData", betData);
    }
    // return {
    //   requestHeaders: details.requestHeaders
    // };
	}, {
		"urls": ["https://www.bet365.com/BetsWebAPI/placebet*"],
		"types": ["xmlhttprequest"]
	}, ["extraHeaders", "requestBody"]);



  chrome.webRequest.onBeforeRequest.addListener(function (details) {
    if(tabInfos.bet365.id != details.tabId){
      return;
    }
		// console.error("onBeforeRequest", details);
    // let str = decodeURIComponent(String.fromCharCode.apply(null, new Uint8Array(details.requestBody.raw[0].bytes)));
    if(details.requestBody.raw){
      let str = buf2str(details.requestBody.raw[0].bytes);
      let data = str.split('&').reduce((r,kv)=>{
        if(kv){
          let arr = kv.split('=');
          r[arr.shift()] = arr.join('=');
        }
        return r;
      },{});
      // betslipDataTime[details.tabId] = Date.now();
      betslipData[details.tabId] = {
        data
      };
      loadedBetslip[details.tabId] = true;
      repairRefreshCount[tabInfos.bet365.id] = 0;
      try{
        console.error("origin betslipData", betslipData[details.tabId]);
        console.error("betslipData", JSON.parse(JSON.stringify(betslipData[details.tabId])));
      }catch(e){
        console.error(e);
      }
    }
    // return {
    //   requestHeaders: details.requestHeaders
    // };
	}, {
		"urls": ["https://www.bet365.com/BetsWebAPI/refreshslip"],
		"types": ["xmlhttprequest"]
	}, ["extraHeaders", "requestBody"]);


  chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
    if(tabInfos.bet365.id != details.tabId){
      return;
    }

    console.error("onBeforeSendHeaders", details);
    // betData.url = details.url;
    let xnst = details.requestHeaders.find(h=>h.name=="X-Net-Sync-Term");
    // let ctype = details.requestHeaders.find(h=>h.name=="Content-type");
    if(xnst.value){
      timekeyReceiveTime[details.tabId] = Date.now();
      betHeaders[details.tabId] = {
        "X-Net-Sync-Term": xnst.value,
        'Content-Type': 'application/x-www-form-urlencoded'
        // "Content-type": ctype.value
      }
      console.error("betHeaders", xnst.value);
    }
  }, {
    "urls": [
      "https://www.bet365.com/BetsWebAPI/refreshslip",
      "https://www.bet365.com/BetsWebAPI/placebet*",
      "https://www.bet365.com/BetsWebAPI/addbet",
      "https://www.bet365.com/BetsWebAPI/removebet",
      "https://www.bet365.com/SportsBook.API/web?*"
    ],
		"types": ["xmlhttprequest"]
  }, ["requestHeaders"]);
  //"requestHeaders"
  //https://members.bet365.com/he/Authenticated/Bank/Balances/?hostedBy=MEMBERS_HOST&mh=1
}

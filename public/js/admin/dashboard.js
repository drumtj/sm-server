console.log("adminDashboard.js");

let Vapp;
(async ()=>{

  let refreshMoneyFlag = {};

  function setupSocket(){
    // socket.on("setBrowserTitle", (data, pid, bid)=>{
    //   console.log("setBrowserTitle", data, pid, bid);
    //   Vapp.setBrowserIP(pid, bid, data);
    //   // let browser = Vapp.getBrowserObj(pid, bid);
    //   // if(browser){
    //   //   browser.ip = data;
    //   // }
    // })

    // socket.on("receiveIP", (data, pid, bid)=>{
    //   console.log("receiveIP", data, pid, bid);
    //   Vapp.setBrowserIP(pid, bid, data);
    // })

    //from main tab
    socket.on("receiveMatchFlag", (data, pid, bid)=>{
      console.log("receiveMatchFlag", data, pid, bid);
      let browser = Vapp.getBrowserObj(pid, bid);
      if(browser){
        browser.isMatching = data;
        Vapp.$forceUpdate();
      }
    })

    //from main tab
    socket.on("receiveState", (data, pid, bid)=>{
      console.log("receiveState", data, pid, bid);
      // let program = Vapp.getProgramObj(pid);
      // if(program){
      //   program.connected = true;
      // }
      let browser = Vapp.getBrowserObj(pid, bid);
      if(browser){
        browser.isOn = true;
        // browser.ip = data.ip;
        browser.isMatching = data.isMatching;
        Vapp.$forceUpdate();
      }
    })

    socket.on("updateAccountState", ({id, state, bid})=>{
      console.log("updateAccountState", id, state, bid);
      let browser = Vapp.getBrowserObj(bid);
      if(browser){
        if(browser.account){
          browser.account[state] = true;
        }
      }
    })

    socket.on("addBetCount", ({id, account, bid})=>{
      console.log("addBetCount", id, account, bid);
      let browser = Vapp.getBrowserObj(bid);
      if(browser){
        if(browser.account){
          //betCount, startBetCount update
          for(let o in account){
            browser.account[o] = account[o];
          }
        }
      }
    })

    socket.on("log", (data, pid, bid)=>{
      console.log("log", data);
      Vapp.updateLog(pid, bid, data);
    })

    socket.on("connectedProgram", pid=>{
      console.log("connected program", pid);
      let program = Vapp.getProgramObj(pid);
      if(program){
        program.connected = true;
        Vapp.$forceUpdate();
      }
    })

    socket.on("disconnectProgram", pid=>{
      console.log("disconnectProgram");
      let program = Vapp.getProgramObj(pid);
      if(program){
        program.connected = false;
        Vapp.$forceUpdate();
      }
    })

    socket.on("addProgram", program=>{
      console.log("receive addProgram", program);
      Vapp.addProgram(program);
    })


    socket.on("removeProgram", pid=>{
      console.log("receive removeProgram", pid);
      Vapp.removeProgram(pid);
    })

    socket.on("addBrowser", (pid, browser)=>{
      console.log("receive addBrowser", pid, browser);
      Vapp.addBrowser(pid, browser);
    })

    socket.on("removeBrowser", (pid, _bid)=>{
      console.log("receive removeBrowser", pid, _bid);
      Vapp.removeBrowser(pid, _bid);
    })

    socket.on("closedBrowser", (data, pid, bid)=>{
      console.log("receive closedBrowser", pid, bid);
      Vapp.setBrowserState(pid, bid, false);
    })

    socket.on("openedBrowser", (data, pid, bid)=>{
      console.log("receive openedBrowser", pid, bid);
      Vapp.setBrowserState(pid, bid, true);
    })



    socket.on("receiveLivingBrowsers", data=>{
      console.log("receiveLivingBrowsers", data);
      let program = Vapp.programs.find(program=>program._id == data.pid);
      // console.log(Vapp.programs.length, program);
      if(program){
        program.connected = !data.exit;
        if(data.browsers){
          program.browsers.forEach(browser=>{
            // console.log("browser", browser);
            let b = data.browsers[browser._id];
            if(b){
              browser.isOn = true;
              if(typeof b === "object"){
                // browser.ip = b.ip;
                browser.isMatching = b.isMatching;
              }
            }else{
              browser.isOn = false;
              // browser.ip = "";
              browser.isMatching = false;
            }
          })
        }

        Vapp.$forceUpdate();
      }
    })
  }

  Vapp = new Vue({
    el: "#app",
    data: {
      //user: user,
      users: [],
      email: "",
      programs: [],
      //money갱신시 쓰임.
      accounts: [],
      proxys: [],
      itvUpdateScroll: {},
      $withdrawForm: null
    },
    async mounted(){

      console.log("wait socketReady");
      await socketReady;
      setupSocket();

      // this.load();
      let res = await api.getEmailList();
      this.users = res.data||[];

      window.addEventListener("keydown", e=>{
        if(e.key == "F5"){
          this.reload();
          api.refreshMoney();
          e.preventDefault();
        }
      })

      this.$nextTick(()=>{
        $(this.$el).removeClass("pre-hide");
        this.$withdrawForm = $(".withdraw-form").removeClass("pre-hide").remove();
        appMountedResolve();
      })



      $(document).on("click", ".browser", null, e=>{
        // console.error("click");
        $(e.currentTarget).find(".browser-logger").removeClass("scrollLock");
      })

      $(document).on("mouseleave", ".browser", null, e=>{
        // console.error("leave", e.currentTarget);
        $(e.currentTarget).find(".browser-logger").addClass("scrollLock");
      })
    },

    methods: {

      printProxy(proxy){
        let s = 1000 * 60 * 60 * 24;
        let d = new Date(proxy.expire);
        let days = (Math.floor(d.getTime()/s)*s - Math.floor(Date.now()/s)*s) / s;
        return `${proxy.proxyHttp} (${d.toLocaleDateString()}만료 ${days}일 남음)`;
      },

      reload(){
        this.load();
      },

      reset(){
        this.programs = [];
        this.accounts = [];
        this.proxys = [];
      },

      changeSearchEmail(){
        this.email = $('.search-email').val().trim();
        socket.emit("remoteDashboardLogin", this.email);
        this.reload();
      },

      pushAccount(account){
        let has = this.accounts.find(a=>a._id == account._id);
        if(!has){
          this.accounts.push(account);
        }
      },

      updateAccountList(){
        this.accounts = [];
        this.programs.forEach(program=>{
          program.browsers.forEach(browser=>{
            if(browser.account){
              this.accounts.push(browser.account);
            }
          })
        })
      },

      async load(){
        if(!this.email){
          this.reset();
          return;
        }


        let res = await api.getUser(this.email);
        if(res.status == "success"){
          // let user = res.data.user;
          // res.data.programs.forEach(program=>{
          //   program.browsers.forEach(browser=>{
          //     if(browser.account){
          //       this.accounts.push(browser.account);
          //     }
          //   })
          // })

          this.programs = res.data.programs;
          this.updateAccountList();
          this.$nextTick(()=>{
            this.programs.forEach(program=>{
              delay(100).then(()=>{
                sendDataToProgram(program._id, "getLivingBrowsers");
              })
            })
          })

          let multiLoadCount = 3;
          this.$nextTick(async ()=>{
            // startLoading();
            // loadingLock();
            for(let j=0; j<this.programs.length; j++){
              let program = this.programs[j];
              for(let i=0; i<program.browsers.length; i+=multiLoadCount){
                let browsers = program.browsers.slice(i, i+multiLoadCount);
                await Promise.all(browsers.map(browser=>{
                  console.log("load logs", browser._id);
                  return api.loadLogs(browser._id).then(res=>{
                    if(res.status == "success"){

                      this.setupLog(browser, res.data.reverse().sort((a,b)=>{
                        let at = a.data.time ? a.data.time : new Date(a.data.updatedAt).getTime();
                        let bt = b.data.time ? b.data.time : new Date(b.data.updatedAt).getTime();
                        return at - bt;
                      }));
                    }
                  })
                }))

              }
            }
            // loadingUnlock();
            // stopLoading();
          })
        }
      },

      browserClass(browser){
        let obj = {};
        obj[browser._id] = true;
        if(browser.account){
          if(browser.account.limited){
            obj['border-warning'] = true;
          }else if(browser.account.died){
            obj['border-danger'] = true;
          }else{
            obj['border-success'] = true;
          }
        }else{
          obj['border-primary'] = true;
        }
        return obj;
      },

      calcProfit(browser){
        if(browser.account && browser.account.startMoney){
          return browser.account.money - browser.account.startMoney;
        }else{
          return 0;
        }
      },

      printProfitHtml(browser){
        let pf = round(this.calcProfit(browser), 2);
        let color = pf>0?'text-success':pf<0?'text-danger':'';
        let b = pf>0?'+':'';
        let c = browser.account&&typeof browser.account.betCount==="number"?browser.account.betCount-browser.account.startBetCount:0;
        return `(<span class="${color}">${b}$${pf}</span>) <span class="badge badge-pill badge-secondary">${c}</span>`;
      },

      // profitClass(browser){
      //   if(browser.account && browser.account.startMoney){
      //     let c = browser.account.money - browser.account.startMoney;
      //     if(c > 0){
      //       return 'text-success';
      //     }else if(c < 0){
      //       return 'text-danger';
      //     }else{
      //       return '';
      //     }
      //   }else{
      //     return '';
      //   }
      // },

      sumMoney(program){
        if(program){
          return program.browsers.reduce((r,b)=>{
            if(b.account){
              return r + b.account.money;
            }else{
              return r;
            }
          }, 0)
        }
      },

      sumProfit(program){
        if(program){
          return program.browsers.reduce((r,b)=>{
            if(b.account){
              return r + this.calcProfit(b)
            }else{
              return r;
            }
          }, 0)
        }
      },

      round(n, p){
        return round(n, p)
      },

      printSumHtml(program){
        let sum = round(this.sumMoney(program), 2);
        let pf = round(this.sumProfit(program), 2);
        let color = pf>0?'text-success':pf<0?'text-danger':'';
        let b = pf>0?'+':'';
        return `합계: $${sum} (<span class="${color}">${b}$${pf}</span>)`;
      },

      printSumHtmlAll(programs){
        let sum = round(programs.reduce((r,program)=>r+this.sumMoney(program),0) ,2);
        let pf = round(programs.reduce((r,program)=>r+this.sumProfit(program),0), 2);
        let color = pf>0?'text-success':pf<0?'text-danger':'';
        let b = pf>0?'+':'';
        return `합계: $${sum} (<span class="${color}">${b}$${pf}</span>)`;
      },

      async resetProfitInfo(browser){
        if(timeLimit("resetProfitInfo", 200)){
          return;
        }
        $(`.${browser._id}.btn-refresh-startMoney`).prop("disabled", true);
        let info = await emitPromise("resetProfitInfo", {id:browser.account.id});
        if(info == null){
          console.error("브라우져가 통신가능한 상태가 아닙니다.");
        }else{
          browser.account.startMoney = info.startMoney;
          browser.account.startBetCount = info.startBetCount;
        }
        console.log("resetProfitInfo", info);
        await delay(1000);
        $(`.${browser._id}.btn-refresh-startMoney`).prop("disabled", false);
      },

      logToHtml(log){
        // console.log(Date.now(), log);
        let d = new Date(log.data.time||log.updatedAt);
        let ds = (d.getMonth()+1)+'/'+d.getDate() + ' ' + d.toTimeString().split(' ')[0];
        let dateStr = '<span class="text-white-50">['+ds+']</span>';
        return dateStr + ' ' + '<span>' + log.data.msg + '</span>';
      },

      getProgramObj(pid){
        return this.programs.find(v=>v._id==pid);
      },
      getBrowserObj(pid, _bid){
        if(arguments.length == 1){
          _bid = pid;
          for(let i=0; i<this.programs.length; i++){
            for(let j=0; j<this.programs[i].browsers.length; j++){
              if(this.programs[i].browsers[j]._id == _bid){
                return this.programs[i].browsers[j];
              }
            }
          }
        }else{
          let program = this.getProgramObj(pid);
          if(program){
            return program.browsers.find(browser=>browser._id == _bid);
          }
        }
      },
      getBrowserIndex(pid, _bid){
        let program = this.getProgramObj(pid);
        if(program){
          let i;
          program.browsers.find((browser, j)=>{
            if(browser._id == _bid){
              i = j;
              return true;
            }else{
              return false;
            }
          });
          return i;
        }
      },
      setBrowserObj(pid, _bid, obj){
        let program = this.getProgramObj(pid);
        if(program){
          let i;
          program.browsers.find((browser,j)=>{
            if(browser._id == _bid){
              i=j;
              return true;
            }
          });
          if(i !== undefined){
            program.browsers[i] = obj;
          }
        }
      },

      async requestWithdraw(account, money){
        if(account){
          let res = await api.requestWithdrawAccount(account._id, money);
          if(res.status == "success"){
            // account.requestedDeposit = true;
            // this.$forceUpdate();

            // if(res.data && res.data.pid){
            //   closeBrowser(res.data.pid, res.data.bid);
            // }
          }else{
            modal("오류", `출금요청 실패<br>${res.message}`);
          }
        }else{
          modal("알림", `계정을 찾을 수 없습니다.`);
        }
      },

      async withdraw(program, browser, withdrawMoney){
        startLoading();
        let money = await sendDataToMainPromise(program._id, browser._id, "withdraw", withdrawMoney);
        // console.error("!!!", money);
        if(money == null){
          console.error("브라우져가 통신가능한 상태가 아닙니다.");
        }else if(typeof money === "string"){
          console.error(money);
        }else{
          await this.requestWithdraw(browser.account, withdrawMoney);

          console.log("refreshMoney", money);
          browser.account.money = money;
          sendDataToServer("updateBet365MoneyFromSite", {money, aid:browser.account._id, uid:browser.user});
        }
        stopLoading();
      },

      async openWithdrawModal(program, browser){
        if(!browser.isOn) return;
        startLoading();
        let money = await sendDataToMainPromise(program._id, browser._id, "loadMoney");
        stopLoading();
        if(typeof money !== "number"){
          console.error("loaded money was not number", money);
          return;
        }

        browser.account.money = money;
        // money = Math.floor(money);

        let $input = this.$withdrawForm.find(".withdraw-input").val(money);
        $input.attr("max", money);
        setTimeout(()=>$input.focus(), 500);
        if(await modal("출금", this.$withdrawForm, {buttons:['취소', '출금']})){
          let inputMoney = parseFloat($input.val());
          // console.error(money);
          if(inputMoney < 10){
            modal("알림", "$10 이상만 출금 가능합니다.");
            return;
          }
          if(inputMoney > browser.account.money){
            modal("알림", `잔액($${browser.account.money})보다 큰 입력입니다.`);
            return;
          }
          await this.withdraw(program, browser, inputMoney);
        }
      },

      async refreshMoney(program, browser){
        // if(refreshTime[browser._id] === undefined) refreshTime[browser._id] = 0;
        //
        // if(Date.now() - refreshTime[browser._id] < 1000){
        //   return;
        // }
        // refreshTime[browser._id] = Date.now();

        if(!program.connected || !browser.isOn){
          return;
        }

        if(refreshMoneyFlag[browser._id] == true){
          return;
        }

        refreshMoneyFlag[browser._id] = true;
        $(`.btn-refresh-money[data-bid="${browser._id}"]`).prop("disabled", true);
        // setTimeout(()=>{
        //   refreshMoneyFlag[browser._id] = false;
        //   $(`.btn-refresh-money[data-bid="${browser._id}"]`).prop("disabled", null);
        // }, 1000);



        let money = await sendDataToMainPromise(program._id, browser._id, "loadMoney");
        if(money == null){
          console.error("브라우져가 통신가능한 상태가 아닙니다.");
        }else if(typeof money === "string"){
          console.error(money);
        }else{
          if(browser.account.money != money){
            console.log("refreshMoney", money);
            browser.account.money = money;
            sendDataToServer("updateBet365MoneyFromSite", {money, aid:browser.account._id, uid:browser.user});
          }
        }

        refreshMoneyFlag[browser._id] = false;
        $(`.btn-refresh-money[data-bid="${browser._id}"]`).prop("disabled", null);
        // this.$forceUpdate();
      },
      refreshMoneyAll(program){
        let programs = program?[program]:this.programs;
        programs.forEach(program=>{
          program.browsers.forEach(browser=>{
            this.refreshMoney(program, browser);
          })
        })
      },
      openBrowserAll(program){
        let programs = program?[program]:this.programs;
        programs.forEach(program=>{
          program.browsers.forEach(browser=>{
            this.sk_openBrowser(program._id, browser._id);
          })
        })
      },
      closeBrowserAll(program){
        let programs = program?[program]:this.programs;
        programs.forEach(program=>{
          program.browsers.forEach(browser=>{
            this.sk_closeBrowser(program._id, browser._id);
          })
        })
      },
      startMatchAllProgram(){
        this.programs.forEach(program=>this.startMatchAllBrowser(program));
      },
      stopMatchAllProgram(){
        this.programs.forEach(program=>this.stopMatchAllBrowser(program));
      },
      startMatchAllBrowser(program){
        program.browsers.forEach(browser=>{
          this.startMatch(program, browser);
        })
      },
      stopMatchAllBrowser(program){
        program.browsers.forEach(browser=>{
          this.stopMatch(program, browser);
        })
      },
      async startMatch(program, browser){
        // sendDataToMain(program._id, browser._id, "startMatch");
        if(!browser.isMatching){
          let data = await sendDataToMainPromise(program._id, browser._id, "startMatch");
          // console.log("??? after startMatch", data);
          browser.isMatching = data;
          this.$forceUpdate();
        }
      },
      async stopMatch(program, browser){
        // sendDataToMain(program._id, browser._id, "stopMatch");
        if(browser.isMatching){
          let data = await sendDataToMainPromise(program._id, browser._id, "stopMatch");
          browser.isMatching = data;
          this.$forceUpdate();
        }
      },
      sk_addProgram(){
        // console.log("socket", socket);
        if(this.email){
          socket.emit("addProgram", this.email);
        }
      },
      addProgram(program){
        this.programs.push(program);
      },
      async sk_removeProgram(pid){
        if(await modal("알림", `프로그램 ${pid} 를 목록에서 제거하시겠습니까?`, {buttons:['취소', '확인']})){
          socket.emit("removeProgram", pid);
        }
      },
      removeProgram(pid){
        this.programs.find((v,i,a)=>{
          if(v._id == pid){
            a.splice(i, 1);
            return true;
          }else{
            return false;
          }
        })
      },
      //pid 맞다
      async sk_addBrowser(pid){
        socket.emit("addBrowser", pid);
      },
      addBrowser(pid, browser){
        // let program = this.programs.find(v=>v._id==pid);
        let program = this.getProgramObj(pid);
        if(program){
          program.browsers.push(browser);
        }
      },
      async sk_removeBrowser(pid, _bid){
        if(await modal("알림", `프로그램 ${pid}의 브라우져(${_bid})를 목록에서 제거하시겠습니까?`, {buttons:['취소', '확인']})){
          socket.emit("removeBrowser", pid, _bid);
        }
      },
      removeBrowser(pid, _bid){
        // let program = this.programs.find(v=>v._id==pid);
        let program = this.getProgramObj(pid);
        program.browsers.find((v,i,a)=>{
          if(v._id == _bid){
            a.splice(i, 1);
            return true;
          }else{
            return false;
          }
        })
      },
      async sk_openBrowser(pid, _bid){//, isChecker){
        let browser = this.getBrowserObj(pid, _bid);
        let index = this.getBrowserIndex(pid, _bid);
        if(browser){
          // console.log(browser)
          if(!browser.account){
            modal("알림", `계정연결이 필요한 브라우져입니다.`);
          }else if(!browser.option){
            modal("알림", `옵션연결이 필요한 브라우져입니다.`);
          }else{
            // if(isChecker){
            //   let r = await modal("확인", "다른곳에서 체크기가 켜져있다면 꺼집니다. 계속합니까?", {buttons:["취소", "체크기 켜기"]});
            //   if(!r){
            //     return;
            //   }
            // }
            socket.emit("openBrowser", pid, _bid, index);//, isChecker);
          }
        }else{
          modal("알림", `브라우져(${_bid})를 찾을 수 없습니다`);
        }
      },
      sk_closeBrowser(pid, _bid){
        socket.emit("closeBrowser", pid, _bid);
      },
      setBrowserState(pid, _bid, opened){
        let browser = this.getBrowserObj(pid, _bid);
        if(browser){
          browser.isOn = opened;
          if(!opened){
            // browser.ip = "";
            browser.isMatching = false;
          }
          this.$forceUpdate();
        }else{
          console.error({pid, _bid}, "getBrowserObj 실패");
        }
      },
      setBrowserIP(pid, _bid, ip){
        let browser = this.getBrowserObj(pid, _bid);
        if(browser){
          // browser.ip = ip;
          this.$forceUpdate();
        }
      },
      setupLog(browser, logs){
        if(!browser.$loggerUl){
          browser.$loggerUl = $(`.${browser._id}>.browser-logger>.logger-ul`);
        }
        browser.logs = logs;
        logs.forEach(log=>{
          browser.$loggerUl.append(`<li><div class="log-line ${log.data.type?'text-'+log.data.type:''}">${this.logToHtml(log)}</div></ul>`);
        })
        this.updateLogScroll(browser._id);
      },
      updateLog(pid, _bid, data){
        let browser = this.getBrowserObj(pid, _bid);
        if(browser){
          if(!browser.logs){
            browser.logs = [];
          }
          let $con = $(`.${_bid}>.browser-logger`);
          // console.error("!", $con.scrollTop() + $con.prop("offsetHeight") + 20, $con.prop("scrollHeight"));
          // let isBottom = $con.scrollTop() + $con.prop("offsetHeight") + 20 >= $con.prop("scrollHeight");
          if(data.isSame){
            browser.logs[browser.logs.length-1] = {data, updatedAt:new Date()};
          }else{
            if(browser.logs.length < MAX_LOG_LENGTH){
              browser.logs.push({data, updatedAt:new Date()});
            }else{
              browser.logs = browser.logs.slice(-(MAX_LOG_LENGTH-1)).concat({data, updatedAt:new Date()});
            }
          }
          if(!browser.$loggerUl){
            browser.$loggerUl = $(`.${_bid}>.browser-logger>.logger-ul`);
          }
          if(data.isSame){
            let $el = browser.$loggerUl.children().last().find('.log-line');
            $el[0].className = "log-line";
            if(data.type){
              $el.addClass('text-'+data.type);
            }
            $el.html(this.logToHtml(browser.logs[browser.logs.length-1]));
          }else{
            browser.$loggerUl.append(`<li><div class="log-line ${data.type?'text-'+data.type:''}">${this.logToHtml(browser.logs[browser.logs.length-1])}</div></ul>`);
          }
          // if(isBottom){
          if($con.hasClass("scrollLock")){
            this.updateLogScroll(_bid);
          }
          // if(isBottom){
          //   this.updateLogScroll(_bid);
          // }else{
          //   clearTimeout(this.itvUpdateScroll);
          //   this.itvUpdateScroll = setTimeout(()=>{
          //     this.$forceUpdate();
          //   },50);
          // }
        }
      },
      updateLogScroll(_bid){
        clearTimeout(this.itvUpdateScroll[_bid]);
        this.itvUpdateScroll[_bid] = setTimeout(()=>{
          let $el = $(`.${_bid}>.browser-logger`);
          $el.scrollTop($el.prop('scrollHeight'));
          // this.$forceUpdate();
        },50);
      },

      proxyBtnHtml(proxy){
        return `<button class="btn btn-square btn-secondary btn-proxy" type="button">
            <svg class="icon-svg" style="width: 30px;height: 17px;">
              <use xlink:href="/vendors/@coreui/icons/sprites/flag.svg#cif-${proxy.country.toLowerCase()}"></use>
            </svg>
            [${proxy.number}] ${proxy.proxyHttp}
          </button>`
      },

      async openProxyModal(pid, _bid){
        let browser = this.getBrowserObj(pid, _bid);
        if(!browser){
          return;
        }

        let res = await api.loadBrowser(_bid);
        if(res.status == "success"){
          this.setBrowserObj(pid, _bid, res.data);
          browser = res.data;
        }else{
          modal("오류", `브라우져 정보 로딩 실패. ${res.message}`);
          return;
        }

        if(!browser){
          return;
        }

        let proxys;
        res = await api.getLinkedProxys();
        if(res.status == "success"){
          proxys = res.data.filter(proxy=>!proxy.browser);
        }else{
          modal("오류", res.message);
          return;
        }
        // console.log({accounts});
        // let browser = this.getBrowserObj(pid, _bid);
        if(proxys.length){
          let selectedProxy;
          let proxyElList = proxys.map(proxy=>{
            return $(this.proxyBtnHtml(proxy)).on("click", e=>{
              selectedProxy = proxy;
              modalHide();
            })
          })
          let r = await modal("프록시IP 연결", proxyElList, {
            buttons: ["닫기", "연결 끊기 (루미나티 사용)"]
          });
          if(r){
            res = await api.updateBrowser(_bid, {proxy: null});
            if(res.status == "success"){
              browser.proxy = null;
              this.$forceUpdate();
            }else{
              modal("알림", `브라우져 업데이트 실패<br>${res.message}`);
            }
            return;
          }
          // console.log({selectedProxy});
          if(selectedProxy){
            if(browser){
              res = await api.updateBrowser(_bid, {proxy: selectedProxy._id});
              if(res.status == "success"){
                browser.proxy = selectedProxy;
                this.proxys.push(selectedProxy);
                this.$forceUpdate();
              }else{
                modal("알림", `브라우져 업데이트 실패<br>${res.message}`);
              }
              // res = await api.updateAccount()
              // console.error(selectedOption);
            }else{
              console.error("bid로 browser객체를 찾을 수 없습니다.");
              modal("알림", "bid로 browser객체를 찾을 수 없습니다.")
              return;
            }
          }
        }else{
          if(browser.proxy){
            let r = await modal("알림", "연결 가능한 프록시IP가 없습니다.", {
              buttons: ["닫기", "연결 끊기 (루미나티 사용)"]
            });
            if(r){
              res = await api.updateBrowser(_bid, {proxy: null});
              if(res.status == "success"){
                browser.proxy = null;
                this.$forceUpdate();
              }else{
                modal("알림", `브라우져 업데이트 실패<br>${res.message}`);
              }
            }
          }else{
            modal("알림", "연결 가능한 프록시IP가 없습니다.");
          }
        }
      },

      accountBtnHtml(account){
        let colorClass = account.limited?'text-warning':account.died?'text-danger':'text-success';
        return `<button class="btn btn-square btn-secondary btn-account" type="button">
            <svg class="icon-svg" style="width: 30px;height: 17px;">
              <use xlink:href="/vendors/@coreui/icons/sprites/flag.svg#cif-${account.country.toLowerCase()}"></use>
            </svg>
            <span class="${colorClass}">${account.id} ($${account.money})</span>
          </button>`
      },

      async openAccountModal(pid, _bid){
        let browser = this.getBrowserObj(pid, _bid);
        if(!browser || browser.used){
          return;
        }

        let res = await api.loadBrowser(_bid);
        if(res.status == "success"){
          this.setBrowserObj(pid, _bid, res.data);
          browser = res.data;
        }else{
          modal("오류", `브라우져 정보 로딩 실패. ${res.message}`);
          return;
        }

        if(!browser || browser.used){
          return;
        }

        let accounts;
        res = await api.getLinkedAccounts(this.email);
        if(res.status == "success"){
          accounts = res.data.filter(account=>!account.browser);
        }else{
          modal("오류", res.message);
          return;
        }
        // console.log({accounts});
        // let browser = this.getBrowserObj(pid, _bid);
        if(accounts.length){
          let selectedAccount;
          let accountElList = accounts.map(account=>{
            return $(this.accountBtnHtml(account)).on("click", e=>{
              selectedAccount = account;
              modalHide();
            })
          })
          let r = await modal("계정연결", accountElList, {
            buttons: ["닫기", "계정연결 끊기"]
          });
          if(r){
            res = await api.updateBrowser(_bid, {account: null});
            if(res.status == "success"){
              browser.account = null;
              this.$forceUpdate();
            }else{
              modal("알림", `브라우져 업데이트 실패<br>${res.message}`);
            }
            return;
          }
          // console.log(selectedAccount);
          if(selectedAccount){
            if(browser){
              res = await api.updateBrowser(_bid, {account: selectedAccount._id});
              if(res.status == "success"){
                if(res.account){
                  for(let k in res.account){
                    if(k){
                      selectedAccount[k] = res.account[k];
                    }
                  }
                }
                browser.account = selectedAccount;
                this.pushAccount(selectedAccount);
                this.$forceUpdate();
              }else{
                modal("알림", `브라우져 업데이트 실패<br>${res.message}`);
              }
              // res = await api.updateAccount()
              // console.error(selectedOption);
            }else{
              console.error("bid로 browser객체를 찾을 수 없습니다.");
              modal("알림", "bid로 browser객체를 찾을 수 없습니다.")
              return;
            }
          }
        }else{
          if(browser.account){
            let r = await modal("알림", "연결 가능한 계정이 없습니다.", {
              buttons: ["닫기", "계정연결 끊기"]
            });
            if(r){
              res = await api.updateBrowser(_bid, {account: null});
              if(res.status == "success"){
                browser.account = null;
                this.$forceUpdate();
              }else{
                modal("알림", `브라우져 업데이트 실패<br>${res.message}`);
              }
            }
          }else{
            modal("알림", "연결 가능한 계정이 없습니다.");
          }
        }
      },

      async openOptionModal(pid, _bid){
        let options;
        let res = await api.getOptionList();
        if(res.status == "success"){
          options = res.data;
        }else{
          modal("오류", res.message);
          return;
        }

        if(options.length){
          let selectedOption;
          let optionElList = options.map(option=>{
            return $(`<button class="btn btn-square btn-success ${option.permission=="admin"?"btn-info":"btn-warning"}" type="button">${option.name}</button>`).on("click", e=>{
              selectedOption = option;
              modalHide();
            })
          })
          await modal("옵션선택", optionElList);

          if(selectedOption){
            let browser = this.getBrowserObj(pid, _bid);
            if(browser){
              res = await api.updateBrowser(_bid, {option: selectedOption._id});
              if(res.status == "success"){
                browser.option = selectedOption;
                this.$forceUpdate();
              }else{
                modal("알림", `브라우져 업데이트 실패<br>${res.message}`);
              }
              // console.error(selectedOption);
            }else{
              console.error("bid로 browser객체를 찾을 수 없습니다.");
              modal("알림", "bid로 browser객체를 찾을 수 없습니다.")
              return;
            }
          }
          // console.log(selectedOption);
        }else{
          modal("알림", "등록된 옵션이 없습니다.");
        }
      },

      copyPid(pid){
        var tempElem = document.createElement('textarea');
        tempElem.value = pid;
        document.body.appendChild(tempElem);

        tempElem.select();
        document.execCommand("copy");
        document.body.removeChild(tempElem);

        modal("알림", "PC코드가 클립보드에 복사되었습니다.")
      },
      changeInputMode(pid){
        // console.error("pid", pid);
        let program = this.getProgramObj(pid);
        if(program){
          // console.error($(".pc-name").text());
          program._name = program.name;
          program.name = "";
          this.$forceUpdate();
          setTimeout(()=>{
            $('.'+pid).find(".pc-name-input").focus();
          }, 10)
        }
      },
      onChangeName(e){
        let pid = e.target.dataset.pid;
        let program = this.getProgramObj(pid);

        if(program){
          program.name = e.target.value;
          this.$forceUpdate();
        }

        sendDataToServer("setProgramName", {
          pid, name: program.name
        })
      }
    }
  })//end Vapp

  appReadyResolve();
})()

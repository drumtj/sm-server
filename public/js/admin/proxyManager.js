console.log("adminProxyntManager.js");

let Vapp;
(async ()=>{
  let _res = await api.getCountryList();
  let countryObj;
  if(_res.status == "success"){
    countryObj = _res.data;
  }else{
    countryObj = {};
  }
  // console.log({countryObj});
  let registFormFormat = [
    {
      name: "국가 *",
      key: "country",
      list: Object.keys(countryObj).map(code=>{
        return {
          name: countryObj[code],
          value: code
        }
      }),
      value: "KR",
      type: "select"
    },
    {
      name: "proxyHttp *",
      key: "proxyHttp",
      value: "",
      placeholder: "123.123.123.123:8888",
      //help: "help text",
      type: "text"
    },
    {
      name: "가격",
      key: "price",
      value: 0,
      type: "number",
      prepend: "$"
    },
    {
      name: "만료일",
      key: "expire",
      value: "",
      placeholder: "2021-12-17",
      type: "date",
      _value: "",
      set: function(v){
        // console.error("set", v);
        if(v){
          let d = new Date(v);
          this._value = d.toString();
          this.value = getDateString(d);
        }else{
          this._value = null;
          this.value = '';
        }
        // this._value = v;
        // this.value = v?getDateString():'';
      },
      get: function(validation){
        if(validation){
          return this.value;
        }
        return this._value;
      }
    }
  ]

  // list가 문자열로 된 것들을 오브젝트형태로 통일하자.
  registFormFormat.forEach(obj=>{
    if(Array.isArray(obj.list)){
      obj.list.forEach((item, i, arr)=>{
        if(typeof item !== "object"){
          arr[i] = {
            name: item,
            value: item
          }
        }
      })
    }
  })

  let defaultData = registFormFormat.reduce((r, form)=>{
    r[form.key] = form.value;
    return r;
  }, {})

  // console.log("defaultData", defaultData);

  Vapp = new Vue({
    el: "#app",
    data: {
      email: undefined, // 소유자 필터시
      count: 0, //조건에 맞는 계정수
      curPage: 0, //현재 페이지
      startPage: 0, //페이지 버튼에서 시작페이지
      endPage: 0, //페이지 버튼에서 끝페이지
      maxPage: 0, //마지막페이지
      pages: [],
      tab: 0,
      proxyId: "",
      searchIP: "",
      proxys: [],
      forms: [],
      users: []
    },
    async created(){
      console.log("wait socketReady");
      await socketReady;

      let tab, linkPart = window.location.href.split('#')[1];
      // if(expgen("&email").test(linkPart)){
      //   await this.loadListTo(linkPart);
      // }else{
        tab = parseInt(linkPart);
        if(isNaN(tab)){
          tab = 0
        }
        await this.loadList(0, tab);

        // switch(tab){
        //   case 0: await this.loadList(); break;
        //   case 1: await this.loadList(0, 1); break;
        //   case 2: await this.loadList(0, 2); break;
        //   case 3: await this.loadList(0, 3); break;
        //
        //   default:
        //     await this.loadList();
        // }
      // }



      // let res = await api.getAccounts({
      //   used:false
      // });
      //
      //
      // if(res.status == "success"){
      //   this.setData(res.data);
      // }else{
      //   return;
      // }



      // this.forms = JSON.parse(JSON.stringify(registFormFormat));
      this.forms = registFormFormat;
      this.formsMap = this.forms.reduce((r,form)=>{
        r[form.key] = form;
        return r;
      }, {});

      $(this.$el).removeClass("pre-hide");

      window.addEventListener("keydown", e=>{
        if(e.key == "F5"){
          this.reload();
          api.refreshMoney();
          e.preventDefault();
        }
      })


      this.$nextTick(function() {
        this.$form = $(".proxy-form").remove();
        this.$depositInputWrap = $(".deposit-input-wrap").removeClass("pre-hide").remove();
        this.$depositInput = this.$depositInputWrap.find("#depositInput");
        // setupMoneyInput(this.$depositInput[0]);
        // setupMoneyInput(this.$form.find("#money")[0]);

        // for(let key in this.formsMap){
        //   Object.defineProperty(this.formsMap[key], "$el", {
        //     value: $('.account-form').find(key)
        //   })
        // }
        appMountedResolve();
      })
    },
    updated(){
      // console.error("?");
      // $(".account-money-input").each((i,el)=>{
      //   setupMoneyInput(el);
      // }).on("input", e=>{
      //   $(e.target).addClass('text-warning');
      // })
    },
    methods: {
      comma(n){
        return comma(Math.floor(n));
      },

      countryName(code){
        // console.error("code", code, countryObj[code]);
        return countryObj[code];
      },



      optionNameValidation(){
        // let data = this.getProxyData({validation:true});
        let data = this.getProxyData();
        // console.log("validation", data);
        // if(data.expire && !expgen("####-[01]#-[0123]#").test(data.expire.trim())){
        //   alert('날짜 형식이 알맞지 않습니다.');
        //   return false;
        // }
        if(!expgen("(#{1,3}.){3}#{1,3}:#{1,5}").test(data.proxyHttp)){
          alert('proxyHttp 형식이 알맞지 않습니다.');
          return false;
        }

        return true;
      },

      setData(data){
        // console.log(data);
        this.proxys = data.proxys;
        this.curPage = data.curPage;
        this.startPage = data.startPage;
        this.endPage = data.endPage;
        this.maxPage = data.maxPage;
        this.count = data.count;
        this.users = data.users;

        let pages = [];
        for(let i=this.startPage; i<=this.endPage; i++){
          pages.push(i);
        }
        this.pages = pages;
      },

      async loadList(curPage=0, tab=0, opt={}){
        // console.error("loadList", curPage, tab, opt);
        let {email, searchIP} = opt;
        this.searchIP = searchIP;
        this.email = email;
        // console.log("loadList page", curPage);
        // tab 0 => no used list
        // tab 1 => used list
        // tab 2 => trash list
        let query = {email, searchIP};
        switch(tab){
          case 0: // 등록완료된 리스트
            query.used = false;
            query.curPage = curPage;
          break;

          case 1: // 발급완료된 리스트
            query.used = true;
            query.trash = false;
            query.curPage = curPage;
          break;

          case 2: // 휴지통 리스트
            query.used = true;
            query.trash = true;
            query.curPage = curPage;
          break;
        }

        // if(email){
        //   query.email = email;
        // }
        let res = await api.getProxys(query);
        this.tab = tab;
        if(res.status == "success"){
          // console.log(res.data);
          this.setData(res.data);
          // console.error("open option", id, option);
        }else{
          await modal("알림", `프록시 IP 로딩 실패<br>${res.message}`);
          if(res.code == "NO_AUTHENTICATION"){
            gotoLogin();
          }
          return;
        }
      },

      reload(curPage, tab){
        return this.loadList(or(curPage,this.curPage), or(tab,this.tab), this.getCurrentSearchInfo());
      },

      resetReload(tab){
        // console.error(tab, this.tab, or(tab,this.tab));
        return this.loadList(0, or(tab,this.tab));
      },

      loadListTo(email){
        return this.loadList(0, 1, {email});
      },

      changeSearchIP(){
        this.searchIP = $('.search-ip').val().trim();
      },

      changeSearchEmail(){
        this.email = $('.search-email').val().trim();
      },

      getCurrentSearchInfo(){
        return {
          email: this.email,
          searchIP: this.searchIP
        }
      },

      loadUseList(){
        // used list
        return this.reload(0, 1);
      },

      loadTrashList(){
        // trash list
        return this.reload(0, 2);
      },

      getProxyForm(){
        // this.optionNameValidationReset();
        return this.$form;
      },




      async openProxyRegistModal(){
        this.setProxyData(defaultData);
        let result = await modal("프록시 IP 등록", this.getProxyForm(), {
          buttons:['취소', '등록'],
          lock:true,
          size:'lg',
          validation: this.optionNameValidation
        })

        if(result){
          let proxy = this.getProxyData();
          // console.log(proxy);
          // console.error("regist option", JSON.parse(JSON.stringify(option)));
          let res = await api.registProxy(proxy);
          if(res.status == "success"){
            // if(this.accounts.length >= 10){
            //   this.curPage++;
            // }
            // this.loadList(this.curPage, this.tab);
            this.resetReload();
            // modal("알림", `옵션 ${option.name} 등록 성공`);
            // account = res.data;
            // if(this.accounts.length)
            // this.accounts.unshift(account);
          }else{
            modal("알림", res.message);
          }
        }
      },

      update(event){
        let key = event.target.id.split('_');
        let value = event.target.value;

        // console.error(key, value, this.formsMap[key[0]]);

        let form = this.formsMap[key[0]];
        if(form){
          if(form.type == 'checkbox'){
            // console.log(event.target.checked);
            form.value[key[1]] = event.target.checked;
          }else if(form.type == 'radio'){
            if(event.target.checked){
              form.value = key[1];
            }
          }else{
            // console.error(value);
            if(typeof form.set === "function"){
              form.set(value);
            }else{
              form.value = value;
            }
          }
        }
        // console.log(key, value, this.formsMap, this.forms);
      },

      getProxyData(option={}){
        let opt = {};
        for(let key in this.formsMap){
          if(typeof this.formsMap[key].get === "function"){
            // opt[key] = this.formsMap[key].get(option.validation);
            opt[key] = this.formsMap[key].get();
          }else{
            if(this.formsMap[key].isBoolean){
              try{
                opt[key] = JSON.parse(this.formsMap[key].value);
              }catch(e){
                opt[key] = false;
              }
            }else{
              opt[key] = this.formsMap[key].value;
            }
          }
          if(typeof opt[key] === "string"){
            opt[key] = opt[key].trim();
          }
        }
        opt._id = this.proxyId;
        return JSON.parse(JSON.stringify(opt));
      },

      setProxyData(proxy){
        proxy = JSON.parse(JSON.stringify(proxy));
        this.proxyId = proxy._id;
        for(let key in this.formsMap){
          // console.log(key, this.formsMap[key], account[key]);
          if(this.formsMap[key]){
            // console.error("?", this.formsMap[key].set);
            if(typeof this.formsMap[key].set === "function"){
              this.formsMap[key].set(proxy[key]);
            }else{
              if(this.formsMap[key].isBoolean){
                this.formsMap[key].value = proxy[key] ? proxy[key].toString() : "false";
              }else{
                this.formsMap[key].value = proxy[key] || "";
              }
            }
          }
        }
        // this.$forceUpdate();
      },
      // async registOption(option){
      //   // 옵션 데이터 추출
      //   // 서버전달
      //   // 응답 처리
      //   // let option = getAccountData();
      //   let res = await api.registOption(option);
      //   if(res.status == "success"){
      //     this.options.push(option);
      //     modal("알림", `옵션 [${option.name}] 등록 완료`);
      //   }else{
      //     modal("옵션등록 실패", res.message);
      //   }
      // },

      getProxyObj(id){
        return this.proxys.find(opt=>opt._id==id);
      },

      // pullAccountObj(idOrObj){
      //   let id;
      //   if(typeof idOrObj === "object"){
      //     id = idOrObj._id;
      //   }else if(typeof idOrObj === "string"){
      //     id = idOrObj;
      //   }
      //
      //   if(id){
      //     let index;
      //     let account = this.proxys.find((opt,i)=>{
      //       if(opt._id==id){
      //         index = i;
      //         return true;
      //       }
      //     });
      //     this.proxys.splice(index, 1);
      //     return account;
      //   }
      // },

      async removeProxy(id){
        let proxy = this.getProxyObj(id);
        if(!proxy){
          modal("알림", `${id} 프록시 IP를 찾을 수 없습니다.`);
          return;
        }
        if(!(await modal("프록시IP 제거", `프록시 IP '${proxy.proxyHttp}'를 제거하시겠습니까?`, {buttons:["취소", "제거"]}))) return;

        let res = await api.removeProxy(id);
        if(res.status == "success"){
          // this.pullAccountObj(id);
          // await this.loadList(this.curPage, this.tab);
          await this.resetReload();
          modal("알림", `프록시 IP '${proxy.proxyHttp}'를 제거했습니다`);
        }else{
          modal("알림", `프록시 IP 제거 실패.<br>${res.message}`);
        }
      },

      async resetProxy(id){
        let proxy = this.getProxyObj(id);
        if(!proxy){
          modal("알림", `${id} 프록시 IP를 찾을 수 없습니다.`);
          return;
        }
        if(!(await modal("초기화", `프록시 IP '${proxy.proxyHttp}'를 초기화하시겠습니까? (회수+복구)`, {buttons:["취소", "초기화"]}))) return;

        let res = await api.updateProxy(id, {
          user: null,
          trash: false
        });
        if(res.status == "success"){
          // this.pullAccountObj(id);
          // await this.loadList(this.curPage, this.tab);
          await this.resetReload();
          modal("알림", `프록시 IP '${proxy.proxyHttp}'를 초기화했습니다`);
        }else{
          modal("알림", `프록시 IP 초기화 실패.<br>${res.message}`);
        }
      },

      printExpire(proxy){
        let s = 1000 * 60 * 60 * 24;
        let d = new Date(proxy.expire);
        let days = (Math.floor(d.getTime()/s)*s - Math.floor(Date.now()/s)*s) / s;
        return d.toLocaleDateString() + ` (${days}일 남음)`;
      },

      async removeProxyUser(id){
        let proxy = this.getProxyObj(id);
        if(!proxy){
          modal("알림", `${id} 프록시 IP를 찾을 수 없습니다.`);
          return;
        }
        if(!(await modal("프록시 IP 회수", `프록시 IP '${proxy.proxyHttp}'를 회수하시겠습니까?`, {buttons:["취소", "회수"]}))) return;

        let res = await api.removeProxyUser(id);
        console.error("?", res);
        if(res.status == "success"){
          // this.pullAccountObj(id);
          // await this.loadList(this.curPage, this.tab);
          await this.resetReload();
          modal("알림", `프록시 IP '${proxy.proxyHttp}'를 회수했습니다`);
        }else{
          modal("알림", `프록시 IP 회수 실패.<br>${res.message}`);
        }
      },

      async restoreProxy(id){
        let proxy = this.getProxyObj(id);
        if(!proxy){
          modal("알림", `${id} 프록시 IP를 찾을 수 없습니다.`);
          return;
        }
        if(!(await modal("프록시 IP 복구", `프록시 IP '${proxy.proxyHttp}'를 복구하시겠습니까?`, {buttons:["취소", "복구"]}))) return;

        let res = await api.restoreProxy(id);
        if(res.status == "success"){
          // this.pullAccountObj(id);
          // await this.loadList(this.curPage, this.tab);
          await this.resetReload();
          modal("알림", `프록시 IP '${proxy.proxyHttp}'를 복구했습니다`);
        }else{
          modal("알림", `프록시 IP 복구 실패.<br>${res.message}`);
        }
      },

      async trashProxy(proxy){
        if(!(await modal("휴지통", `프록시 IP '${proxy.proxyHttp}'를 휴지통에 넣으시겠습니까?`, {buttons:["취소", "휴지통"]}))) return;

        let res = await api.updateProxy(proxy._id, {trash:true});
        if(res.status == "success"){
          // this.pullAccountObj(id);
          // await this.loadList(this.curPage, this.tab);
          await this.resetReload();
          modal("알림", `프록시 IP '${proxy.proxyHttp}'를 휴지통에 넣었습니다`);
        }else{
          modal("오류", res.message);
        }
      },

      async openProxyModal(id){
        let res = await api.getProxys({
          ids: [id],
          used: undefined
        });
        let proxy;
        // console.error(id, res);
        if(res.status == "success"){
          proxy = res.data.proxys[0];
          // console.error("open option", id, option);
        }else{
          modal("알림", `프록시 IP(${id}) 로딩 실패<br>${res.message}`);
          return;
        }
        this.setProxyData(proxy);

        let btns;
        btns = ['닫기', '저장'];
        // if(this.tab <= 2){
        // }else{
        //   btns = ['닫기'];
        // }
        let result = await modal("프록시 IP 수정", this.getProxyForm(), {
          buttons: btns,
          lock: true,
          size: 'lg',
          validation: this.optionNameValidation
        });

        if(result){
          proxy = this.getProxyData();
          // console.error("??", proxy)
          res = await api.updateProxy(proxy._id, proxy);
          if(res.status == "success"){
            let originProxy = this.proxys.find(opt=>opt._id==proxy._id);
            if(originProxy && res.data){
              delete res.data._id;
              for(let o in res.data){
                originProxy[o] = res.data[o];
              }
              //originAccount.name = account.name;
              modal("알림", `프록시 IP '${proxy.proxyHttp}'이 저장됐습니다.`)
            }else{
              modal("알림", `저장 실패<br>${proxy._id} 을 찾을 수 없습니다. `);
            }
          }else{
            modal("알림", `프록시 IP 저장 실패<br>${res.message}`);
          }
        }
      }
    }
  })//end Vapp

  appReadyResolve();
})()

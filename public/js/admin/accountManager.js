console.log("adminAccountManager.js");

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
  let accountRegistFormFormat = [
    {
      name: "국가",
      key: "country",
      list: Object.keys(countryObj).map(code=>{
        return {
          name: countryObj[code],
          value: code
        }
      }),
      value: "BD",
      type: "select"
    },
    {
      name: "bet365 id",
      key: "id",
      value: "",
      //placeholder: "테스트1 입력하세요",
      //help: "help text",
      type: "text"
    },
    {
      name: "bet365 password",
      key: "pw",
      value: "",
      type: "text"
    },
    {
      name: "bet365 4 DIGIT",
      key: "digit4",
      value: "",
      type: "text"
    },
    {
      name: "skrill email",
      key: "skrillEmail",
      value: "",
      type: "text"
    },
    {
      name: "skrill id",
      key: "skrillId",
      value: "",
      type: "text"
    },
    {
      name: "skrill password",
      key: "skrillPw",
      value: "",
      type: "text"
    },
    {
      name: "skrill pin",
      key: "skrillCode",
      value: "",
      help: "스크릴 보안코드",
      type: "text"
    },
    // {
    //   name: "bet365 money",
    //   key: "money",
    //   value: "",
    //   type: "number",
    //   prepend: "$"
    // },
    {
      name: "리밋 여부",
      key: "limited",
      list: ["true", "false"],
      value: "false",
      isBoolean: true,
      type: "radio"
    },
    {
      name: "폐쇄 여부",
      key: "died",
      list: ["true", "false"],
      value: "false",
      isBoolean: true,
      type: "radio"
    }
  ]

  // list가 문자열로 된 것들을 오브젝트형태로 통일하자.
  accountRegistFormFormat.forEach(obj=>{
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

  let defaultData = accountRegistFormFormat.reduce((r, form)=>{
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
      accountId: "",
      searchId: "",
      accounts: [],
      forms: [],
      users: [],
      user: user
    },
    async created(){
      console.log("wait socketReady");
      await socketReady;

      let tab, linkPart = window.location.href.split('#')[1];
      if(expgen("&email").test(linkPart)){
        await this.loadListTo(linkPart);
      }else{
        tab = parseInt(linkPart);

        switch(tab){
          case 0: await this.loadList(); break;
          case 1: await this.loadList(0, 1); break;
          case 2: await this.loadList(0, 2); break;
          case 4: await this.loadList(0, 4); break;
          case 5:
            if(user.master){
              await this.loadList(0, 4);
            }else{
              await this.loadList();
            }
          break;

          default:
            await this.loadList();
        }
      }



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



      this.forms = JSON.parse(JSON.stringify(accountRegistFormFormat));
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
        this.$form = $(".account-form").remove();
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

      reload(){
        this.loadList(this.curPage, this.tab, this.getCurrentSearchInfo());
      },

      optionNameValidation(){
        let data = this.getAccountData();
        // console.log("validation", data);
        let spaceTestExp = / /;
        // let numTestExp = /[^0-9]/;
        let spcTestExp = expgen("[&sb]").unwrap();
        let textList = [
          data.id, data.pw, data.skrillId, data.skrillPw, data.skrillCode
        ];
        textList = textList.map(str=>str.trim());
        let spaceTest = textList.some(str=>spaceTestExp.test(str));
        // let numTest = numTestExp.test(data.money);
        if( spaceTest ){
          alert('공백이 포함됐습니다. 공백을 제거해주세요');
          return false;
        }
        // else if( numTest ){
        //   alert('bet365 money에는 숫자만 입력해주세요');
        //   return false;
        // }
        return true;
      },

      setData(data){
        // console.log(data);
        this.accounts = data.accounts;
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
        let {email, searchId} = opt;
        this.searchId = searchId;
        this.email = email;
        // console.log("loadList page", curPage);
        // tab 0 => no used list
        // tab 1 => used list
        // tab 2 => trash list
        let query = {email, searchId};
        switch(tab){
          case 0: // 등록완료된 리스트
            query.used = false;
            query.firstCharged = false;
            query.curPage = curPage;
          break;

          case 1: // 충전완료된 리스트
            query.used = false;
            query.firstCharged = true;
            query.curPage = curPage;
          break;

          case 2: // 발급완료된 리스트
            query.used = true;
            query.trash = false;
            query.curPage = curPage;
          break;

          case 3: // 입/출금 리스트
            query.used = true;
            query.trash = false;
            query.curPage = curPage;
            query.requestedDeposit = true;
          break;

          case 4: // 휴지통 리스트
            query.used = true;
            query.trash = true;
            query.curPage = curPage;
          break;

          case 5: // 휴지통 리스트
            query.removed = true;
            query.curPage = curPage;
          break;
        }

        // if(email){
        //   query.email = email;
        // }
        let res = await api.getAccounts(query);
        this.tab = tab;
        if(res.status == "success"){
          // console.log(res.data);
          this.setData(res.data);
          // console.error("open option", id, option);
        }else{
          await modal("알림", `계정 로딩 실패<br>${res.message}`);
          if(res.code == "NO_AUTHENTICATION"){
            gotoLogin();
          }
          return;
        }
      },

      // 벳삼에서 출금처리됐는데 우리쪽은 안됐을 때 처리하기 위함
      async requestWithdrawForce(account){
        let $input = $(`.force-request-withdraw-money-input[data-id=${account._id}]`);
        if(account){
          let money = parseFloat($input.val());
          if(isNaN(money)){
            modal("알림", `입력값이 잘못됐습니다.`);
          }else if(confirm(`이 작업은 해당계정의 지갑에 돈이 추가됩니다. ${money}을 출금기록으로 남깁니까?`)){
            let res = await api.requestWithdrawAccountForce(account._id, money);
            if(res.status == "success"){
            }else{
              modal("오류", `출금요청 실패<br>${res.message}`);
            }
          }
        }else{
          modal("알림", `계정을 찾을 수 없습니다.`);
        }
        $input.val('');
      },

      // openBrowserForMoneyCheck(account){
      //   socket.emit("openBrowserForMoneyCheck", account._id);
      // },

      resetReload(){
        this.loadList(this.curPage, this.tab);
      },

      loadListTo(email){
        return this.loadList(0, 2, {email});
      },

      changeSearchId(){
        this.searchId = $('.search-id').val().trim();
      },

      changeSearchEmail(){
        this.email = $('.search-email').val().trim();
      },

      getCurrentSearchInfo(){
        return {
          email: this.email,
          searchId: this.searchId
        }
      },

      loadChargedList(curPage=0){
        // charged list
        this.loadList(curPage, 1, this.getCurrentSearchInfo());
      },

      loadUseList(curPage=0){
        // used list
        this.loadList(curPage, 2, this.getCurrentSearchInfo());
      },

      loadRequestList(curPage=0){
        // 입/출금 리스트
        this.loadList(curPage, 3, this.getCurrentSearchInfo());
      },

      loadTrashList(curPage=0){
        // trash list
        this.loadList(curPage, 4, this.getCurrentSearchInfo());
      },

      loadRemoveList(curPage=0){
        this.loadList(curPage, 5, this.getCurrentSearchInfo());
      },

      getAccountForm(){
        // this.optionNameValidationReset();
        return this.$form;
      },

      async deposit(account){
        // 출금된 금액 입력창을 띄우고 승인버튼 노출

        let r = await modal("승인확인", this.$depositInputWrap, {
          lock: true,
          buttons: ["취소", "승인"],
          init:()=>{
            this.$depositInput.val(0).focus();
          },
          validation: ()=>{
            let n = toNumber(this.$depositInput.val());
            if(n <= 0 || isNaN(n)){
              alert("잘못된 값이 입력됐습니다.");
              return false;
            }
            if(!confirm(`$${comma(n)} 를 실제 출금처리 완료하였고, 마스터에게 승인을 요청합니다. 계속하시겠습니까?`)){
              return false;
            }
            return true;
          }
        })

        if(r){
          let money = toNumber(this.$depositInput.val());
          let res = await api.depositAccount(account._id, money);
          if(res.status == "success"){
            await this.loadList(this.curPage, this.tab);
            // account.depositStatus = res.depositStatus;
            if(res.depositStatus == "outstanding"){

              modal("알림", `$${comma(money)} 출금건 승인요청 됨.`);
            }else if(res.depositStatus == "complete"){
              modal("알림", `$${comma(money)} 출금완료.`);
            }
          }else{
            modal("알림", res.message);
          }
        }
      },

      async rejectDeposit(account){
        if(!(await modal("출금요청 반려", `'${account.id}'의 출금요청을 반려하시겠습니까?`, {buttons:["취소", "반려"]}))) return;

        let res = await api.rejectRequestDepositAccount(account._id);
        if(res.status == "success"){
          await this.loadList(this.curPage, this.tab);
          modal("알림", `'${account.id}'의 출금요청을 반려했습니다`);
        }else{
          modal("알림", `출금요청 반려 실패.<br>${res.message}`);
        }
      },

      async cancelDeposit(account){
        if(!(await modal("출금승인요청 취소", `'${account.id}'의 출금승인요청을 취소하시겠습니까?`, {buttons:["취소", "승인요청취소"]}))) return;

        let res = await api.cancelDepositAccount(account._id);
        if(res.status == "success"){
          // await this.loadList(this.curPage, this.tab);
          account.depositStatus = res.depositStatus;
          modal("알림", `'${account.id}'의 출금승인요청을 취소했습니다`);
        }else{
          modal("알림", `출금승인요청 취소 실패.<br>${res.message}`);
        }
      },

      async doChargeComplete(_id){
        let $input = $(`.account-money-input[data-id="${_id}"]`);
        let str = $input.val();
        let money = parseInt(str);
        if(!(/[0-9]+/.test(money)) || isNaN(money)){
          modal("알림", "올바른 숫자 형태로 입력해주세요.");
          return;
        }

        // console.error(money)
        if(money < 0){
          modal("알림", "충전 금액이 너무 작습니다.");
          return;
        }

        let account = this.getAccountObj(_id);
        if(!account){
          modal("알림", `계정 ${_id}를 찾을 수 없습니다.`);
          return;
        }

        let r = await modal("확인", `계정 [${account.id}]에 <span class="price">$${money}</span>를 충전처리 합니다. 계속하시겠습니까?`, {buttons:["취소", "확인"]});
        if(!r){
          return;
        }

        let res = await api.chargeAccount(_id, money);
        $input.removeClass('text-warning');
        if(res.status == "success"){
          // this.pullAccountObj(_id);
          await this.loadList(this.curPage, this.tab);
          await modal("알림", "충전완료처리 성공");
        }else{
          modal("알림", res.message);
        }
      },

      async openAccountRegistModal(){
        this.setAccountData(defaultData);
        let result = await modal("계정등록", this.getAccountForm(), {
          buttons:['취소', '등록'],
          lock:true,
          size:'lg',
          validation: this.optionNameValidation
        })

        if(result){
          let account = this.getAccountData();
          // console.log(account);
          // console.error("regist option", JSON.parse(JSON.stringify(option)));
          let res = await api.registAccount(account);
          if(res.status == "success"){
            // if(this.accounts.length >= 10){
            //   this.curPage++;
            // }
            this.loadList(this.curPage, this.tab);
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
            form.value = value;
          }
        }
        // console.log(key, value, this.formsMap, this.forms);
      },

      getAccountData(){
        let opt = {};
        for(let key in this.formsMap){
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
        opt._id = this.accountId;
        return JSON.parse(JSON.stringify(opt));
      },

      setAccountData(account){
        account = JSON.parse(JSON.stringify(account));
        this.accountId = account._id;
        for(let key in this.formsMap){
          // console.log(key, this.formsMap[key], account[key]);
          if(this.formsMap[key]){
            if(this.formsMap[key].isBoolean){
              this.formsMap[key].value = account[key] ? account[key].toString() : "false";
            }else{
              this.formsMap[key].value = account[key] || "";
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

      getAccountObj(id){
        return this.accounts.find(opt=>opt._id==id);
      },

      pullAccountObj(idOrObj){
        let id;
        if(typeof idOrObj === "object"){
          id = idOrObj._id;
        }else if(typeof idOrObj === "string"){
          id = idOrObj;
        }

        if(id){
          let index;
          let account = this.accounts.find((opt,i)=>{
            if(opt._id==id){
              index = i;
              return true;
            }
          });
          this.accounts.splice(index, 1);
          return account;
        }
      },

      async removeAccount(id){
        let account = this.getAccountObj(id);
        if(!account){
          modal("알림", `${id} 계정을 찾을 수 없습니다.`);
          return;
        }
        if(!(await modal("계정제거", `계정 '${account.id}'을 제거하시겠습니까?`, {buttons:["취소", "제거"]}))) return;

        let res = await api.removeAccount(id);
        if(res.status == "success"){
          // this.pullAccountObj(id);
          await this.loadList(this.curPage, this.tab);
          modal("알림", `계정 '${account.id}' 을 제거했습니다`);
        }else{
          modal("알림", `계정제거 실패.<br>${res.message}`);
        }
      },

      async resurrectionAccount(id){
        let account = this.getAccountObj(id);
        if(!account){
          modal("알림", `${id} 계정을 찾을 수 없습니다.`);
          return;
        }
        if(!(await modal("계정부활", `계정 '${account.id}'을 복구하시겠습니까?`, {buttons:["취소", "복구"]}))) return;

        let res = await api.resurrectionAccount(id);
        if(res.status == "success"){
          // this.pullAccountObj(id);
          await this.loadList(this.curPage, this.tab);
          modal("알림", `계정 '${account.id}' 을 복구했습니다`);
        }else{
          modal("알림", `계정부활 실패.<br>${res.message}`);
        }
      },

      async resetAccount(id){
        let account = this.getAccountObj(id);
        if(!account){
          modal("알림", `${id} 계정을 찾을 수 없습니다.`);
          return;
        }
        if(!(await modal("계정초기화", `계정 '${account.id}'을 초기화하시겠습니까?`, {buttons:["취소", "초기화"]}))) return;

        let res = await api.updateAccount(id, {
          user: null,
          used: false,
          firstCharged: false,
          trash: false,
          limited: false,
          died: false,
          memo: "",
          money: 0,
          depositStatus: null
        });
        if(res.status == "success"){
          // this.pullAccountObj(id);
          await this.loadList(this.curPage, this.tab);
          modal("알림", `계정 '${account.id}' 을 초기화했습니다`);
        }else{
          modal("알림", `계정초기화 실패.<br>${res.message}`);
        }
      },

      async resetDeposit(id){
        let account = this.getAccountObj(id);
        if(!account){
          modal("알림", `${id} 계정을 찾을 수 없습니다.`);
          return;
        }
        if(!(await modal("출금상태초기화", `계정 '${account.id}'의 출금상태를 초기화하시겠습니까?`, {buttons:["취소", "초기화"]}))) return;

        let res = await api.updateAccount(id, {
          depositStatus: null
        });
        if(res.status == "success"){
          account.depositStatus = "";
          modal("알림", `계정 '${account.id}'의 출금상태를 초기화했습니다`);
          // this.$forceUpdate();
        }else{
          modal("알림", `출금상태 초기화 실패.<br>${res.message}`);
        }
      },

      async removeAccountUser(id){
        let account = this.getAccountObj(id);
        if(!account){
          modal("알림", `${id} 계정을 찾을 수 없습니다.`);
          return;
        }
        if(!(await modal("계정회수", `계정 '${account.id}'을 회수하시겠습니까?`, {buttons:["취소", "회수"]}))) return;

        let res = await api.removeAccountUser(id);
        if(res.status == "success"){
          // this.pullAccountObj(id);
          await this.loadList(this.curPage, this.tab);
          modal("알림", `계정 '${account.id}' 을 회수했습니다`);
        }else{
          modal("알림", `계정회수 실패.<br>${res.message}`);
        }
      },

      async restoreAccount(id){
        let account = this.getAccountObj(id);
        if(!account){
          modal("알림", `${id} 계정을 찾을 수 없습니다.`);
          return;
        }
        if(!(await modal("계정복구", `계정 '${account.id}'을 복구하시겠습니까?`, {buttons:["취소", "복구"]}))) return;

        let res = await api.restoreAccount(id);
        if(res.status == "success"){
          // this.pullAccountObj(id);
          await this.loadList(this.curPage, this.tab);
          modal("알림", `계정 '${account.id}' 을 복구했습니다`);
        }else{
          modal("알림", `계정복구 실패.<br>${res.message}`);
        }
      },

      async trashAccount(account){
        if(!(await modal("휴지통", `계정 '${account.id}'을 휴지통에 넣으시겠습니까?`, {buttons:["취소", "휴지통"]}))) return;

        let res = await api.updateAccount(account._id, {trash:true});
        if(res.status == "success"){
          // this.pullAccountObj(id);
          await this.loadList(this.curPage, this.tab);
          modal("알림", `계정 '${account.id}' 을 휴지통에 넣었습니다`);
        }else{
          modal("오류", res.message);
        }
      },

      async openAccountModal(id){
        let res = await api.getAccounts({
          ids: [id],
          used: undefined,
          withSkrill: true
        });
        let account;
        // console.error(id, res);
        if(res.status == "success"){
          account = res.data.accounts[0];
          // console.error("open option", id, option);
        }else{
          modal("알림", `계정(${id}) 로딩 실패<br>${res.message}`);
          return;
        }
        this.setAccountData(account);

        let btns;
        if(this.tab <= 2){
          btns = ['닫기', '저장'];
        }else{
          btns = ['닫기'];
        }
        let result = await modal("계정수정", this.getAccountForm(), {
          buttons: btns,
          lock: true,
          size: 'lg',
          validation: this.optionNameValidation
        });

        if(result){
          account = this.getAccountData();
          res = await api.updateAccount(account._id, account);
          if(res.status == "success"){
            let originAccount = this.accounts.find(opt=>opt._id==account._id);
            if(originAccount){
              for(let o in account){
                originAccount[o] = account[o];
              }
              //originAccount.name = account.name;
              modal("알림", `계정 '${account.id}'이 저장됐습니다.`)
            }else{
              modal("알림", `계정저장 실패<br>${account._id} 계정을 찾을 수 없습니다. `);
            }
          }else{
            modal("알림", `계정저장 실패<br>${res.message}`);
          }
        }
      }
    }
  })//end Vapp

  appReadyResolve();
})()

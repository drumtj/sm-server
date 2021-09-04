console.log("accountManager.js")

let Vapp;
(async ()=>{
  let _res = await api.getCountryList();
  let countryObj;
  if(_res.status == "success"){
    countryObj = _res.data;
  }else{
    countryObj = {};
  }

  Vapp = new Vue({
    el: "#app",
    data: {
      price: 0,
      $storeTable: null,
      storeAccounts: [],
      // selectedAccount: null,
      accounts: []
    },
    async mounted(){

      console.log("wait socketReady");
      await socketReady;

      await this.loadList();

      window.addEventListener("keydown", e=>{
        if(e.key == "F5"){
          this.reload();
          api.refreshMoney();
          e.preventDefault();
        }
      })

      this.$nextTick(()=>{
        this.$storeTable = $("#storeTable").remove();
        $(this.$el).removeClass("pre-hide");
        appMountedResolve();
      })
    },
    methods: {
      comma(n){
        return comma(Math.floor(n));
      },

      reload(){
        return this.loadList();
      },

      async loadList(){
        let accounts;
        let res = await api.getLinkedAccounts();
        if(res.status == "success"){
          accounts = res.data;
        }else{
          return;
        }

        accounts.forEach(account=>{
          if(account.depositStatus == "requested" || account.depositStatus == "outstanding"){
            account.requestedDeposit = true;
          }
        })

        if(accounts){
          this.accounts = accounts;
        }
      },

      async disconnect(account){
        let r = await modal("확인", "브라우져와의 연결을 해제합니다. 계속합니까?", {buttons:["취소", "확인"]});
        if(!r) return;

        let res = await api.accountDisconnectBrowser(account._id);
        if(res.status == "success"){
          account.browser = null;
        }else{
          modal("오류", `${res.message}`);
        }
      },

      async refreshConnectState(){
        let res = await api.accountRefrechConnectState();
        if(res.status == "success"){
          await this.reload();
          modal("확인", "연결상태 갱신 완료");
        }else{
          modal("오류", `${res.message}`);
        }
      },

      getBorderClass(id){
        let account = this.accounts.find(account=>account._id==id);
        if(account){
          if(account.died){
            return "border-danger";
          }
          if(account.limited){
            return "border-warning";
          }
          return "border-success";
        }
        return "";
      },

      getDepositClass(id){
        let account = this.getAccountObj(id);
        if(account && account.requestedDeposit){
          return "requested-deposit bg-success progress-bar-striped progress-bar-animated";
        }
        return "";
      },

      // createAccountTable(price, list){
      //   let $table = $(`<table class="table table-responsive-sm table-bordered table-striped table-sm">
      //     <thead>
      //       <tr>
      //         <th>아이디</th>
      //         <th>가격($20 + 충전금액)</th>
      //         <th>발급</th>
      //       </tr>
      //     </thead>
      //     <tbody class="account-table-body">
      //     </tbody>
      //     </table>`);
      //   let $body = $table.find(".account-table-body");
      //   list.forEach(account=>{
      //     let $tr = $(`<tr></tr>`)
      //     .appendTo($body)
      //     .append(`<td>${account.id}</td>`)
      //     .append(`<td><span style="color:yellow; font-weight:400;">$${price + account.money}</span></td>`);
      //
      //     $(`<td>`).append(
      //       $(`<button class="btn btn-sm btn-square btn-success btn-account" type="button">발급</button>`).on("click", e=>{
      //         if(confirm(`$${price+account.money}가 소진됩니다. 계속하시겠습니까?`)){
      //           this.selectedAccount = account;
      //           modalHide();
      //         }
      //       })
      //     ).appendTo($tr);
      //   })
      //
      //   return $table;
      // },

      async buyAccount(account){
        if(confirm(`$${this.price+account.money}가 소진됩니다. 계속하시겠습니까?`)){
          // this.selectedAccount = account;
          // modalHide();

          if(account){
            if(Vmoney.money.wallet < this.price + account.money){
              modal("알림", "잔액이 부족합니다.");
              return;
            }
            let _id = account._id;
            // this.selectedAccount = null;

            res = await api.buyAccount(_id);

            if(res.status == "success"){
              Vmoney.money.wallet = res.data.wallet;
              Vmoney.money.bet365 = res.data.bet365Money;
              let account = res.data.account;
              let i;
              // 정렬위치 찾아서
              for(i=0; i<this.accounts.length; i++){
                if(account.id < this.accounts[i].id){
                  break;
                }
              }

              // 찾은 위치에 구매계정목록에 추가
              this.accounts.splice(i, 0, account);
              // store계정목록에서 제거
              this.pullAccountObj(_id, this.storeAccounts);
              // modal("알림", "계정발급 완료");
              modalTitle(`계정발급가능 ${this.storeAccounts.length}개  (발급비: $${this.price} + 충전금액)`);
            }else{
              if(
                res.code == "SOLD_OUT" ||
                res.code == "NOT_FOUND_ACCOUNT" ||
                res.code == "ALREADY_PURCHASED"
              ){
                // store리스트에서 해당 계정을 제거.
                this.pullAccountObj(_id, this.storeAccounts);
              }
              // modal("알림", "계정발급 실패<br>"+res.message);
              alert("계정발급 실패\n\n"+res.message)
              return;
            }
          }
        }
      },

      getCountryName(account){
        return account.country ? countryObj[account.country] : ""
      },

      openAccountModal(account){
        modal(
          `계정정보`,
          `
          <table class="table">
            <thead>
              <th>아이디</th>
              <th>비밀번호</th>
              <th>국가</th>
            </thead>
            <tbody>
              <td>${account.id}</td>
              <td>${account.pw}</td>
              <td>
                <svg class="icon-svg" style="width: 30px;height: 17px;">
                  <use xlink:href="/vendors/@coreui/icons/sprites/flag.svg#cif-${account.country?account.country.toLowerCase():"bd"}"></use>
                </svg>
                ${countryObj[account.country||"BD"]}
              </td>
            </tbody>
          </table>
          `,
          {
            buttons:["닫기"]
          }
        );
      },

      async openAccountStoreModal(){
        // 여기서의 api는 구매되지 않은 전체 계정을 쿼리해와야 한다.
        let res = await api.getStoreAccounts();
        // let res = await api.getAccountQuantity();
        // console.error(res);
        if(res.status == "success"){
          // accounts = res.data.accounts;
          this.price = res.data.price;
          this.storeAccounts = res.data.accounts;
        }else{
          modal("오류", res.message);
          return;
        }

        if(this.storeAccounts.length){
          // this.selectedAccount = null;
          modal(`계정발급가능 ${this.storeAccounts.length}개  (발급비: $${this.price} + 충전금액)`, this.$storeTable, {
            buttons:["닫기"],
            lock: true
          });
        }else{
          modal("알림", "발급 가능한 계정이 부족합니다.");
        }
      },
      // async registAccount(){
      //   // 여기에 모달 띄워서 입력받자.
      //   await modal("알림", "계정정보 입력");
      //   // 랜덤값으로 테스트
      //   let account = {
      //     id: Math.floor(Math.random()*0xffffff).toString(16),
      //     pw: "1111"
      //   }
      //   let res = await api.registAccount(account);
      //   if(res.status == "success"){
      //     this.accounts.push(account);
      //     modal("알림", `${account.id} 등록 완료`);
      //   }else{
      //     modal("계정등록 실패", res.message);
      //   }
      // },

      async removeAccount(id){
        let account = this.getAccountObj(id);
        if(!account){
          modal("알림", `${id} 계정을 찾을 수 없습니다.`);
          return;
        }
        if(!(await modal("계정제거", `계정 '${account.id}'을 제거하시겠습니까?`, {buttons:["취소", "제거"]}))) return;

        let res = await api.trashAccount(id);
        if(res.status == "success"){
          this.pullAccountObj(id);
          modal("알림", `계정 '${account.id}' 을 제거했습니다`);
        }else{
          modal("알림", `계정제거 실패.<br>${res.message}`);
        }
      },

      async deposit(id){
        // let account = this.getAccountObj(id);
        // if(account){
        //   if(account.money < 10){
        //     modal("알림", "잔액이 $10미만이어서 출금요청이 불가능합니다.");
        //     return;
        //   }
        //   let desc = [
        //     "- 출금된 계정은 더 이상 사용 불가능 합니다.",
        //     "- 연결된 브라우져가 즉시 종료되고 계정연결이 해제됩니다."
        //   ]
        //   if(!(await modal("출금요청", `계정 '${account.id}'를 출금요청 하시겠습니까?<br>${desc.join('<br>')}`, {buttons:["취소", "출금요청"]}))) return;
        //
        //   let res = await api.requestDepositAccount(id);
        //   if(res.status == "success"){
        //     account.requestedDeposit = true;
        //     this.$forceUpdate();
        //
        //     if(res.data && res.data.pid){
        //       closeBrowser(res.data.pid, res.data.bid);
        //     }
        //   }else{
        //     modal("오류", `출금요청 실패<br>${res.message}`);
        //   }
        // }else{
        //   modal("알림", `${id} 계정을 찾을 수 없습니다.`);
        // }
      },

      getAccountObj(id, arr){
        let _arr = arr || this.accounts;
        return _arr.find(opt=>opt._id==id);
      },

      pullAccountObj(idOrObj, arr){
        let id;
        if(typeof idOrObj === "object"){
          id = idOrObj._id;
        }else if(typeof idOrObj === "string"){
          id = idOrObj;
        }

        let _arr = arr || this.accounts;

        if(id){
          let index;
          let account = _arr.find((opt,i)=>{
            if(opt._id==id){
              index = i;
              return true;
            }
          });
          _arr.splice(index, 1);
          return account;
        }
      },
    }
  })//end Vapp

  appReadyResolve();
})()

//
// function _sendData(com, data, pid, to, noResolve){
//   let msg = {com, data, to, from:PN_B365};
//   if(noResolve){
//     console.log("sendData", msg);
//     chrome.runtime.sendMessage(msg);
//     return;
//   }
//   let mid = guid();
//   let _code = com+'@'+mid;
//   msg._code = _code;
//
//   console.log("sendData", msg);
//   chrome.runtime.sendMessage(msg);
//   return new Promise(resolve=>{
//     messagePromises[_code] = (d)=>{
//       delete messagePromises[_code];
//       resolve(d);
//     }
//   })
// }

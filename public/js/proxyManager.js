console.log("proxyManager.js")

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
      // price: 0,
      $storeTable: null,
      storeProxys: [],
      // selectedAccount: null,
      proxys: []
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
        this.loadList();
      },

      async loadList(){
        let proxys;
        let res = await api.getLinkedProxys();
        if(res.status == "success"){
          proxys = res.data;
        }else{
          return;
        }

        if(proxys){
          this.proxys = proxys;
        }
      },

      printExpire(proxy){
        let s = 1000 * 60 * 60 * 24;
        let d = new Date(proxy.expire);
        let days = (Math.floor(d.getTime()/s)*s - Math.floor(Date.now()/s)*s) / s;
        return d.toLocaleDateString() + ` (${days}일 남음)`;
      },

      async buyProxy(proxy){
        if(confirm(`$${proxy.price}가 소진됩니다. 계속하시겠습니까?`)){
          // this.selectedAccount = account;
          // modalHide();

          if(proxy){
            if(Vmoney.money.wallet < proxy.price){
              modal("알림", "잔액이 부족합니다.");
              return;
            }
            let _id = proxy._id;
            // this.selectedAccount = null;

            res = await api.buyProxy(_id);

            if(res.status == "success"){
              Vmoney.money.wallet = res.data.wallet;
              let proxy = res.data.proxy;
              let i;
              // 정렬위치 찾아서
              for(i=0; i<this.proxys.length; i++){
                if(proxy.proxyHttp < this.proxys[i].proxyHttp){
                  break;
                }
              }

              // 찾은 위치에 구매계정목록에 추가
              this.proxys.splice(i, 0, proxy);
              // store계정목록에서 제거
              this.pullProxyObj(_id, this.storeProxys);
              // modal("알림", "계정발급 완료");
              modalTitle(`프록시IP 발급가능 ${this.storeProxys.length}개  (발급비: $${proxy.price})`);
            }else{
              if(
                res.code == "SOLD_OUT" ||
                res.code == "NOT_FOUND_PROXY" ||
                res.code == "ALREADY_PURCHASED"
              ){
                // store리스트에서 해당 계정을 제거.
                this.pullProxyObj(_id, this.storeProxys);
              }
              // modal("알림", "계정발급 실패<br>"+res.message);
              alert("프록시IP 발급 실패\n\n"+res.message)
              return;
            }
          }
        }
      },

      getCountryName(proxy){
        return proxy.country ? countryObj[proxy.country] : ""
      },

      async openProxyStoreModal(){
        // 여기서의 api는 구매되지 않은 전체 계정을 쿼리해와야 한다.
        let res = await api.getStoreProxys();
        // let res = await api.getAccountQuantity();
        // console.error(res);
        if(res.status == "success"){
          // accounts = res.data.accounts;
          // this.price = res.data.price;
          this.storeProxys = res.data.proxys;
        }else{
          modal("오류", res.message);
          return;
        }

        if(this.storeProxys.length){
          // this.selectedAccount = null;
          modal(`프록시IP 발급가능 ${this.storeProxys.length}개`, this.$storeTable, {
            buttons:["닫기"],
            lock: true
          });
        }else{
          modal("알림", "발급 가능한 프록시IP가 부족합니다.");
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

      async removeProxy(id){
        let proxy = this.getProxyObj(id);
        if(!proxy){
          modal("알림", `${id} 프록시IP를 찾을 수 없습니다.`);
          return;
        }
        if(!(await modal("프록시IP 제거", `프록시IP '${proxy.proxyHttp}'를 제거하시겠습니까?`, {buttons:["취소", "제거"]}))) return;

        let res = await api.trashProxy(id);
        if(res.status == "success"){
          this.pullProxyObj(id);
          modal("알림", `프록시IP '${proxy.proxyHttp}'를 제거했습니다`);
        }else{
          modal("알림", `프록시IP 제거 실패.<br>${res.message}`);
        }
      },



      getProxyObj(id, arr){
        let _arr = arr || this.proxys;
        return _arr.find(opt=>opt._id==id);
      },

      pullProxyObj(idOrObj, arr){
        let id;
        if(typeof idOrObj === "object"){
          id = idOrObj._id;
        }else if(typeof idOrObj === "string"){
          id = idOrObj;
        }

        let _arr = arr || this.proxys;

        if(id){
          let index;
          let proxy = _arr.find((opt,i)=>{
            if(opt._id==id){
              index = i;
              return true;
            }
          });
          _arr.splice(index, 1);
          return proxy;
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

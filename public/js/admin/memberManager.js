console.log("adminMemberManager.js");

let Vapp;
(async ()=>{

  function setupSocket(){
    socket.on("requestUserRegist", async ()=>{
      console.error("requestUserRegist2");
      await Vapp.loadList();
      Vmenu.setNew(link);
    })
  }

  Vapp = new Vue({
    el: "#app",
    data: {
      // config: config,
      programInfoModalUser: {programs:[]},
      authModalUser: null,
      $programTable: null,
      $authTable: null,
      authLinks: JSON.parse(JSON.stringify(pages.filter(page=>page.admin&&!page.master))),
      // [
      //   {
      //     link: "/admin/dashboard",
      //     name: "[관리자] 대시보드"
      //   },
      //   {
      //     link: "/admin/accountManager",
      //     name: "[관리자] 계정관리"
      //   },
      //   {
      //     link: "/admin/optionManager",
      //     name: "[관리자] 옵션관리"
      //   },
      //   {
      //     link: "/admin/depositManager",
      //     name: "[관리자] 입/출금관리"
      //   }
      // ],
      count: 0, //조건에 맞는 계정수
      curPage: 0, //현재 페이지
      startPage: 0, //페이지 버튼에서 시작페이지
      endPage: 0, //페이지 버튼에서 끝페이지
      maxPage: 0, //마지막페이지
      pages: [],
      tab: 0,
      users: []
    },
    async created(){
      console.log("wait socketReady");
      await socketReady;
      setupSocket();

      let tab, linkPart = window.location.href.split('#')[1];
      // if(expgen("&email").test(linkPart)){
      //   await this.loadListTo(linkPart);
      // }else{
        tab = parseInt(linkPart);

        switch(tab){
          case 0: await this.loadList(0, 0); break;
          case 1: await this.loadList(0, 1); break;
          case 2: await this.loadList(0, 2); break;

          default:
            await this.loadList();
        }
      // }

      window.addEventListener("keydown", e=>{
        if(e.key == "F5"){
          this.reload();
          api.refreshMoney();
          e.preventDefault();
        }
      })

      this.$nextTick(function() {
        $(this.$el).removeClass("pre-hide");
        this.$authTable = $("#authTable").remove();
        this.$programTable = $("#programsInfoTable").remove();
        appMountedResolve();
      })
    },

    mounted(){
    },

    updated(){
      // console.error("?");
      $(".money-input")
      // .each((i,el)=>{
      //   setupMoneyInput(el);
      // })
      .on("input", e=>{
        $(e.target).addClass('text-warning');
      })
    },

    methods: {
      comma(n){
        return comma(Math.floor(n));
      },

      reload(){
        this.loadList(this.curPage, this.tab);
      },

      async addMoney($input, user, target){
        let displayName = {
          money: "P머니",
          wallet: "지갑"
        }[target];
        if(!displayName){
          console.error("not found money name", target);
          return;
        }
        let displayMoney = $input.val();
        let money = parseFloat(displayMoney);
        if(isNaN(money)){
          modal("오류", "잘못된 입력값입니다.");
          return;
        }
        let r = await modal("확인", `${user.email}의 ${displayName}에 ${displayMoney}를 추가하시겠습니까?`, {
          lock: true,
          buttons: ["취소", "추가"]
        });

        if(r){
          let data = {};
          data[target] = money;
          // let res = await api.updateUser(user._id, data);
          let res = await api.addMoney(user._id, data);
          $input.removeClass('text-warning');
          if(res.status == "success"){
            user[target] += money;
            // 접속해있는 대상에게 실시간 변경 위해
            sendDataToMember(user.email, "updateMoney", data);
            modal("확인", `${displayName} 추가 완료`);
            $input.val("");
          }else{
            $input.val(user[target]);
            modal("오류", `${displayName} 추가 실패<br>${res.message}`)
          }
        }else{
          // console.error(user[target]);
          $input.removeClass('text-warning');
          $input.val(user[target]);
        }
      },

      async addPmoney(user){
        let $input = $(`.pmoney[data-id="${user._id}"]`);
        this.addMoney($input, user, "money");
      },

      async addWallet(user){
        let $input = $(`.wallet[data-id="${user._id}"]`);
        this.addMoney($input, user, "wallet");
      },

      async updateProgramCount(user){
        let $input = $(`.program-count[data-id="${user._id}"]`);
        let count = $input.val();
        let r = await modal("확인", `${user.email}의 프로그램 제한 수를 ${count} 로 설정하시겠습니까?`, {
          lock: true,
          buttons: ["취소", "설정"]
        });

        if(r){
          let res = await api.updateUser(user._id, {
            programCount: count
          })

          if(res.status == "success"){
            user.programCount = count;
            modal("확인", "프로그램 제한 수 설정 완료");
          }else{
            $input.val(user.programCount);
            modal("오류", `프로그램 제한 수 설정 실패<br>${res.message}`)
          }
        }
      },

      async updateBrowserCount(user){
        let $input = $(`.browser-count[data-id="${user._id}"]`);
        let count = $input.val();
        let r = await modal("확인", `${user.email}의 브라우져 제한 수를 ${count} 로 설정하시겠습니까?`, {
          lock: true,
          buttons: ["취소", "설정"]
        });

        if(r){
          let res = await api.updateUser(user._id, {
            browserCount: count
          })

          if(res.status == "success"){
            user.browserCount = count;
            modal("확인", "브라우져 제한 수 설정 완료");
          }else{
            $input.val(user.browserCount);
            modal("오류", `브라우져 제한 수 설정 실패<br>${res.message}`)
          }
        }
      },

      openProgramsModal(user){
        this.programInfoModalUser = user;
        modal(`PC 상세 (${user.email})`, this.$programTable, {
          buttons: ["닫기"],
          lock: true
        })
      },

      openAuthModal(user){
        this.authModalUser = user;
        modal(`권한설정 (${user.email})`, this.$authTable, {
          buttons: ["닫기"],
          lock: true
        })
      },

      async addAuth(user, link){
        if(!user.authority){
          user.authority = {};
        }
        user.authority[link.link] = true;

        let res = await api.updateUser(user._id, user);
        if(res.status == "success"){
          Vmenu.reset(link);
          // modal("알림", `멤버 ${user.email}의 관리권한 '${link.name}' 승인 완료`);
          // alert(`멤버 ${user.email}의 관리권한 '${link.name}' 승인 완료`);
        }else{
          alert("관리권한 승인 실패\n\n" + res.message);
        }
        this.$forceUpdate();
      },

      async removeAuth(user, link){
        if(!user.authority){
          user.authority = {};
        }
        delete user.authority[link.link];
        if(Object.keys(user.authority).length == 0){
          user.authority = null;
        }

        let res = await api.updateUser(user._id, user);
        if(res.status == "success"){
          // modal("알림", `멤버 ${user.email}의 관리권한 '${link.name}' 제거 완료`);
          // alert(`멤버 ${user.email}의 관리권한 '${link.name}' 제거 완료`);
        }else{
          alert("관리권한 제거 실패<br>" + res.message);
        }
        this.$forceUpdate();
      },

      setData(data){
        // console.log(data);
        this.users = data.users;
        this.curPage = data.curPage;
        this.startPage = data.startPage;
        this.endPage = data.endPage;
        this.maxPage = data.maxPage;
        this.count = data.count;
        let pages = [];
        for(let i=this.startPage; i<=this.endPage; i++){
          pages.push(i);
        }
        this.pages = pages;
      },

      async loadList(curPage=0, tab=0){
        // console.log("loadList page", curPage);
        let query = {accountCounting:true};
        switch(tab){
          case 0: // 가입요청 리스트
            query.allowed = false;
            query.admin = false;
            query.curPage = curPage;
          break;

          case 1: // 가입승인 리스트
            query.allowed = true;
            query.admin = false;
            query.curPage = curPage;
          break;

          case 2: // 관리자 리스트
            query.allowed = true;
            query.admin = true;
            query.curPage = curPage;
          break;
        }

        let res = await api.getUsers(query);
        this.tab = tab;
        if(res.status == "success"){
          Vmenu.reset(link);
          // console.log(res.data);
          this.setData(res.data);
          // console.error("open option", id, option);
        }else{
          await modal("알림", `멤버 로딩 실패<br>${res.message}`);
          if(res.code == "NO_AUTHENTICATION"){
            gotoLogin();
          }
          return;
        }
      },

      getUserObj(id){
        return this.users.find(opt=>opt._id==id);
      },

      pullUserObj(idOrObj){
        let id;
        if(typeof idOrObj === "object"){
          id = idOrObj._id;
        }else if(typeof idOrObj === "string"){
          id = idOrObj;
        }

        if(id){
          let index;
          let user = this.users.find((opt,i)=>{
            if(opt._id==id){
              index = i;
              return true;
            }
          });
          this.users.splice(index, 1);
          return user;
        }
      },

      async acceptUser(id){
        let user = this.getUserObj(id);
        if(!user){
          modal("오류", `${id} 멤버를 찾을 수 없습니다.`);
          return;
        }
        let res = await api.updateUser(id, {allowed:true});
        if(res.status == "success"){
          await this.loadList(this.curPage, this.tab);
          modal("알림", `멤버 ${user.email} 가입승인 완료`);
        }else{
          modal("오류", "가입승인 실패<br>" + res.message);
        }
      },

      async removeUser(id){
        let user = this.getUserObj(id);
        if(!user){
          modal("알림", `${id} 멤버를 찾을 수 없습니다.`);
          return;
        }
        if(!(await modal("멤버제거", `멤버 '${user.email}'을 제거하시겠습니까?`, {buttons:["취소", "제거"]}))) return;

        let res = await api.removeUser(id);
        if(res.status == "success"){
          // this.pullUserObj(id);
          await this.loadList(this.curPage, this.tab);
          modal("알림", `멤버 '${user.email}' 을 제거했습니다`);
        }else{
          modal("알림", `멤버제거 실패.<br>${res.message}`);
        }
      },

      async resetUser(id){
        let user = this.getUserObj(id);
        if(!user){
          modal("알림", `${id} 멤버를 찾을 수 없습니다.`);
          return;
        }
        if(!(await modal("멤버초기화", `멤버 '${user.email}'를 초기화하시겠습니까?`, {buttons:["취소", "초기화"]}))) return;

        let res = await api.updateUser(id, {
          allowed: false,
          authority: null,
          master: false
        });
        if(res.status == "success"){
          // this.pullUserObj(id);
          await this.loadList(this.curPage, this.tab);
          modal("알림", `멤버 '${user.email}' 를 초기화했습니다`);
        }else{
          modal("알림", `멤버초기화 실패.<br>${res.message}`);
        }
      }
    }
  })//end Vapp

  appReadyResolve();
})()

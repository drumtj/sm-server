console.log("adminApprovalManager.js");

let Vapp;
(async ()=>{

  function setupSocket(){

  }

  Vapp = new Vue({
    el: "#app",
    data: {
      count: 0, //조건에 맞는 계정수
      curPage: 0, //현재 페이지
      startPage: 0, //페이지 버튼에서 시작페이지
      endPage: 0, //페이지 버튼에서 끝페이지
      maxPage: 0, //마지막페이지
      pages: [],
      tab: 0,
      list: [],
      typeMap:{
        deposit: "출금",//벳삼은 출금. 유저에겐(사이트머니) 입금
        withdraw: "입금"
      },
      statusMap:{
        open: "요청중",
        approval: "승인됨",
        reject: "반려됨"
      },
      statusClassMap:{
        open: "badge-primary",
        approval: "badge-success",
        reject: "badge-danger"
      }
    },
    async created(){
      console.log("wait socketReady");
      await socketReady;
      setupSocket();

      let tab, linkPart = window.location.href.split('#')[1];
      tab = parseInt(linkPart);

      switch(tab){
        case 0: await this.loadList(0, 0); break;
        case 1: await this.loadList(0, 1); break;

        default:
          await this.loadList();
      }

      window.addEventListener("keydown", e=>{
        if(e.key == "F5"){
          this.reload();
          api.refreshMoney();
          e.preventDefault();
        }
      })

      this.$nextTick(function() {
        $(this.$el).removeClass("pre-hide");
        // $(".money-input").each((i,el)=>{
        //   setupMoneyInput(el);
        // }).on("input", e=>{
        //   $(e.target).addClass('text-warning');
        // })
        appMountedResolve();
      })
    },

    async mounted(){
    },

    methods: {
      comma(n){
        return comma(Math.floor(n));
      },

      setData(data){
        // console.log(data);
        this.list = data.list;
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

      reload(){
        this.loadList(this.curPage, this.tab);
      },

      async loadList(curPage=0, tab=0){
        // console.log("loadList page", curPage);
        let query = {level:1};
        switch(tab){
          case 0: // 승인 요청 목록
            query.status = "open";
            query.curPage = curPage;
          break;

          case 1: // 승인 완료 목록
            query.status = {$ne:"open"};
            query.curPage = curPage;
          break;
        }

        let res = await api.getApprovals(query);
        this.tab = tab;
        if(res.status == "success"){
          Vmenu.reset(link);
          // console.log(res.data);
          this.setData(res.data);
          // console.error("open option", id, option);
        }else{
          await modal("알림", `리스트 로딩 실패<br>${res.message}`);
          if(res.code == "NO_AUTHENTICATION"){
            gotoLogin();
          }
          return;
        }
      },

      async okApproval(item){
        if(!(await modal("승인", `'${item.user.email}'의 ${item.title}을(를) 승인하시겠습니까?`, {buttons:["취소", "승인"]}))) return;

        let res = await api.okApproval(item._id);
        if(res.status == "success"){
          // this.pullUserObj(id);
          await this.loadList(this.curPage, this.tab);
          modal("알림", `승인 완료`);
        }else{
          modal("알림", `승인 실패.<br>${res.message}`);
        }
      },

      async rejectApproval(item){
        if(!(await modal("반려", `'${item.user.email}'의 ${item.title}을(를) 반려하시겠습니까?`, {buttons:["취소", "반려"]}))) return;

        let res = await api.rejectApproval(item._id);
        if(res.status == "success"){
          // this.pullUserObj(id);
          await this.loadList(this.curPage, this.tab);
          modal("알림", `반려 완료`);
        }else{
          modal("알림", `반려 실패.<br>${res.message}`);
        }
      }
      // getUserObj(id){
      //   return this.users.find(opt=>opt._id==id);
      // },
      //
      // pullUserObj(idOrObj){
      //   let id;
      //   if(typeof idOrObj === "object"){
      //     id = idOrObj._id;
      //   }else if(typeof idOrObj === "string"){
      //     id = idOrObj;
      //   }
      //
      //   if(id){
      //     let index;
      //     let user = this.users.find((opt,i)=>{
      //       if(opt._id==id){
      //         index = i;
      //         return true;
      //       }
      //     });
      //     this.users.splice(index, 1);
      //     return user;
      //   }
      // }
    }
  })//end Vapp

  appReadyResolve();
})()

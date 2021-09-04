console.log("depositHistory.js");

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
        $(".money-input").each((i,el)=>{
          setupMoneyInput(el);
        }).on("input", e=>{
          $(e.target).addClass('text-warning');
        })
        appMountedResolve();
      })
    },

    async mounted(){
    },

    methods: {
      comma(n){
        return comma(n);
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
        let query = {level:0, populateChild:true};
        switch(tab){
          case 0: // 출금목록(deposit-벳삼은출금이지만, 유저한텐 입금이다)
            query.deposit = true;
            query.curPage = curPage;
          break;

          case 1: // 입금목록
            query.deposit = false;
            query.curPage = curPage;
          break;
        }
        let res = await api.getDepositHistory(query);
        // let res = await api.getApprovals(query);
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
      }
    }
  })//end Vapp

  appReadyResolve();
})()

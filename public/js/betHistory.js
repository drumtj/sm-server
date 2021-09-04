console.log("betHistory.js");

let Vapp;
(async ()=>{

  startLoading();

  function setupSocket(){

  }

  let startPicker, endPicker;
  function setupDatePicker(){
    let datePickerOption = getDatePickerOption();
    startPicker = datepicker('.start-date', datePickerOption);
    endPicker = datepicker('.end-date', datePickerOption)
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
      betId: null,
      accountId: null,
      status: null,
      eventName: null,
      result: {},
      accounts: []
      // statusClassMap:{
      //   open: "badge-primary",
      //   approval: "badge-success",
      //   reject: "badge-danger"
      // }
    },
    async created(){
      console.log("wait socketReady");
      await socketReady;
      setupSocket();

      let tab, linkPart = window.location.href.split('#')[1];
      tab = parseInt(linkPart);

      setupDatePicker();

      await this.loadList(0, tab||0);

      // switch(tab){
      //   case 0: await this.loadList(0, 0); break;
      //   case 1: await this.loadList(0, 1); break;
      //
      //   default:
      //     await this.loadList();
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

      round(n,p=0){
        if(typeof n === "number"){
          return Math.round(n * Math.pow(10,p))/Math.pow(10,p);
        }else{
          return 0;
        }
      },

      printPercent(n){
        return this.round(n*100,2) + '%';
      },

      printProfit(item){
        return '$' + this.round(calc.profit(item.siteOdds, item.bookmakerOdds, item.siteStake, item.bookmakerStake), 2);
      },

      printProfitP(item){
        return this.printPercent(calc.profitP(item.siteOdds, item.bookmakerOdds));
      },

      getStatusColor(item, reverse){
        if(reverse){
          if(item.betStatus=='LOSE') return 'text-success';
          if(item.betStatus=='WON') return 'text-danger';
        }else{
          if(item.betStatus=='WON') return 'text-success';
          if(item.betStatus=='LOSE') return 'text-danger';
        }
        if(item.betStatus=='REFUNDED' || item.betStatus=='CANCELLED') return 'text-warning';
        return '';
      },

      getSide(item, who){
        let obj = item.event.betburger[who];
        if(obj.side){
          return `${obj.side} ${obj.handicap}`;
        }else{
          return `${obj[obj.homeAway]} (${obj.team})`;
        }
      },

      changeSearchId(){
        this.accountId = $('.search-id').val();
      },

      changeSearchStatus(){
        this.status = $('.search-status').val().trim();
      },

      changeSearchBetId(){
        this.betId = $('.search-betid').val().trim();
      },

      changeSearchEventName(){
        this.eventName = $('.search-event').val().trim();
      },

      setData(data){
        console.log(data);
        this.list = data.list;
        this.curPage = data.curPage;
        this.startPage = data.startPage;
        this.endPage = data.endPage;
        this.maxPage = data.maxPage;
        this.count = data.count;
        this.accounts = data.accounts;
        this.result = data.result || {};
        let pages = [];
        for(let i=this.startPage; i<=this.endPage; i++){
          pages.push(i);
        }
        this.pages = pages;
      },

      reload(){
        this.loadList(this.curPage, this.tab, {
          accountId:this.accountId,
          status:this.status,
          betId:this.betId,
          eventName: this.eventName
        });
      },

      resetReload(){
        this.loadList(this.curPage, this.tab);
      },

      async loadList(curPage=0, tab=0, opt={}){
        // accountId = accountId||this.accountId;
        let {accountId, status, betId, eventName} = opt;
        this.accountId = accountId;
        this.status = status;
        this.betId = betId;
        this.eventName = eventName;
        let range = startPicker.getRange();
        range.end = new Date(range.end.getTime() + (1000*60*60*24 - 1000));
        // this.accountId = accountId;
        // console.log("loadList page", curPage);
        let query = {curPage, accountId, status, range, betId, eventName};
        switch(tab){
          case 0: // 전체
          break;

          case 1: // 축구
            query.sportName = "Soccer";
          break;

          case 2: // 테니스
            query.sportName = "Tennis";
          break;

          case 3: // 하키
            query.sportName = "Hockey";
          break;

          case 4: // 농구
            query.sportName = "Basketball";
          break;

          case 5: // 야구
            query.sportName = "Baseball";
          break;

          case 6: // 아메리칸 풋볼
            query.sportName = "Football";
          break;
        }
        let res = await api.getBets(query);
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

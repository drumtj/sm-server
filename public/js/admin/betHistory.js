console.log("addminBetHistory.js");

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

  let editFormFormat = [
    {
      name: "피나클 배당",
      key: "siteOdds",
      value: "",
      type: "number"
    },
    {
      name: "벳365 배당",
      key: "bookmakerOdds",
      value: "",
      type: "number"
    },
    {
      name: "상태",
      key: "betStatus",
      value: "",
      list: ["ACCEPTED", "WON", "LOSE", "REFUNDED", "CANCELLED"],
      type: "select"
    }
  ]

  // list가 문자열로 된 것들을 오브젝트형태로 통일하자.
  editFormFormat.forEach(obj=>{
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

  // let defaultData = editFormFormat.reduce((r, form)=>{
  //   r[form.key] = form.value;
  //   return r;
  // }, {})

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
      accountId: null,
      email: null,
      status: null,
      betId: null,
      eventName: null,
      betType: null,
      odds1: null,
      oddsCon1: null,
      odds2: null,
      oddsCon2: null,
      result: {},
      users: [],
      forms: [],
      editItem: null,
      user: user
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
      this.forms = JSON.parse(JSON.stringify(editFormFormat));
      this.formsMap = this.forms.reduce((r,form)=>{
        r[form.key] = form;
        return r;
      }, {});


      window.addEventListener("keydown", e=>{
        if(e.key == "F5"){
          this.reload();
          api.refreshMoney();
          e.preventDefault();
        }
      })


      this.$nextTick(function() {
        this.$form = $(".edit-form").remove();
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

      calcPncResult(item){
        if(item.betStatus=='WON'){
          item.pncResult = this.round(item.siteOdds * item.siteStake,2);
        }else if(item.betStatus=='LOSE'){
          item.pncResult = -this.round(item.siteStake,2);
        }else{
          item.pncResult = 0;
        }
      },

      calcBet365Result(item){
        if(item.betStatus=='LOSE'){
          item.bet365Result = this.round(item.bookmakerOdds * item.bookmakerStake,2);
        }else if(item.betStatus=='WON'){
          item.bet365Result = -this.round(item.bookmakerStake,2);
        }else{
          item.bet365Result = 0;
        }
      },

      changeSearchId(){
        this.accountId = $('.search-id').val().trim();
      },

      changeSearchBetId(){
        this.betId = $('.search-betid').val().trim();
      },

      changeSearchEmail(){
        this.email = $('.search-email').val().trim();
      },

      changeSearchStatus(){
        this.status = $('.search-status').val().trim();
      },

      changeSearchEventName(){
        this.eventName = $('.search-event').val().trim();
      },

      changeSearchBetType(){
        this.betType = $('.search-bettype').val().trim();
      },

      changeSearchOdds1(){
        this.odds1 = parseFloat($('.search-odds1').val().trim());
      },

      changeSearchOddsCon1(){
        this.oddsCon1 = $('.search-oddscon1').val().trim();
      },

      changeSearchOdds2(){
        this.odds2 = parseFloat($('.search-odds2').val().trim());
      },

      changeSearchOddsCon2(){
        this.oddsCon2 = $('.search-oddscon2').val().trim();
      },

      getSide(item, who){
        let obj = item.event.betburger[who];
        if(obj.side){
          return `${obj.side} ${obj.handicap}`;
        }else{
          return `${obj[obj.homeAway]} (${obj.team})`;
        }
      },

      setData(data){
        // console.log(data);
        this.list = data.list;
        this.list.forEach(item=>{
          this.calcPncResult(item);
          this.calcBet365Result(item);
        })
        this.curPage = data.curPage;
        this.startPage = data.startPage;
        this.endPage = data.endPage;
        this.maxPage = data.maxPage;
        this.count = data.count;
        this.users = data.users;
        this.result = data.result || {};
        // if(data.result){
        //   this.betSum = data.result.betSum;
        //   this.returnSum = data.result.returnSum;
        //   this.resultSum = data.result.resultSum;
        // }
        let pages = [];
        for(let i=this.startPage; i<=this.endPage; i++){
          pages.push(i);
        }
        this.pages = pages;
      },

      getCurrentSearchInfo(){
        return {
          accountId:this.accountId,
          email:this.email,
          status:this.status,
          betId:this.betId,
          eventName: this.eventName,
          betType: this.betType,
          odds1: this.odds1,
          oddsCon1: this.oddsCon1,
          odds2: this.odds2,
          oddsCon2: this.oddsCon2
        }
      },

      reload(curPage, tab, opt={}){
        opt = Object.assign(this.getCurrentSearchInfo(), opt);
        return this.loadList(or(curPage,this.curPage), or(tab,this.tab), opt);
      },

      resetReload(curPage, tab){
        this.loadList(or(curPage,this.curPage), or(tab,this.tab));
      },

      async loadList(curPage=0, tab=0, opt={}){//accountId){
        // accountId = accountId||this.accountId;
        let {accountId, email, status, betId, eventName, betType, odds1, oddsCon1, odds2, oddsCon2} = opt;
        this.accountId = accountId;
        this.email = email;
        this.status = status;
        this.betId = betId;
        this.eventName = eventName;
        this.betType = betType;
        this.odds1 = odds1;
        this.oddsCon1 = oddsCon1;
        this.odds2 = odds2;
        this.oddsCon2 = oddsCon2;
        let range = startPicker.getRange();
        range.end = new Date(range.end.getTime() + (1000*60*60*24 - 1000));
        // console.log("date range", range);
        // console.log("loadList page", curPage);
        let query = {curPage, accountId, email, status, range, betId, eventName, betType, odds1, oddsCon1, odds2, oddsCon2};
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
        query.admin = true;
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
      },

      setEditItemData(item){
        this.editItem = JSON.parse(JSON.stringify(item));
        for(let key in this.formsMap){
          // console.log(key, this.formsMap[key], account[key]);
          if(this.formsMap[key]){
            this.formsMap[key].value = this.editItem[key] || "";
          }
        }
      },

      getEditItemData(item){
        let opt = {};
        for(let key in this.formsMap){
          opt[key] = this.formsMap[key].value;
        }
        opt.siteOdds = parseFloat(opt.siteOdds);
        opt._id = this.editItem._id;
        opt.betId = this.editItem.betId;
        return JSON.parse(JSON.stringify(opt));
      },

      async openEditModal(item){
        if(!user.master){
          modal("알림", "마스터만 수정이 가능합니다.")
          return;
        }
        this.setEditItemData(item);
        let result = await modal("수정", this.$form, {
          buttons: ['닫기', '개별수정', '전체수정'],
          lock: true,
          size: 'xl'
        });

        if(result){
          let editItemData = this.getEditItemData();
          editItemData.editTarget = result;
          // console.error(editItemData);

          let res = await api.updateBetdata(editItemData);
          if(res.status == "success"){
            this.reload();
          }else{
            modal("알림", res.message);
          }
        }
      },

      update(e){
        // console.error('update', $(e.target).val());
        let v = $(e.target).val();
        let key = e.target.id;
        this.formsMap[key].value = v;
        this.editItem[key] = v;

        this.calcPncResult(this.editItem);
        this.calcBet365Result(this.editItem);
      }
    }//end methods
  })//end Vapp

  appReadyResolve();
})()

console.log("home.js")

let Vapp;

(async ()=>{

  let tabKey = {
    "basketball":0,
    "baseball":1,
    "hockey":2
  };
  let startPicker, endPicker;

  function setupSocket(){
    socket.on("updateGame", (data, pid, bid)=>{
      console.log("updateGame", data);
      if(tabKey[data.sports] == Vapp.tab){
        let range = startPicker.getRange();
        range.end = new Date(range.end.getTime() + (1000*60*60*24 - 1000));
        let d = new Date(data.date);
        if(d.getTime() >= range.start.getTime() && d.getTime() <= range.end.getTime()){
          if(data.live){
            Vapp.liveUpdate(data.liveList);
          }else{
            Vapp.reload();
          }
        }
      }
    })
    //
    // socket.on("connectedProgram", pid=>{
    //   console.log("connected program", pid);
    //   let program = Vapp.getProgramObj(pid);
    //   if(program){
    //     program.connected = true;
    //     Vapp.$forceUpdate();
    //   }
    // })
  }


  function setupDatePicker(){
    let datePickerOption = getDatePickerOption();
    startPicker = datepicker('.start-date', datePickerOption);
    endPicker = datepicker('.end-date', datePickerOption)
  }

  Vapp = new Vue({
    el: "#app",
    data: {
      user: user,
      count: 0, //조건에 맞는 계정수
      curPage: 0, //현재 페이지
      startPage: 0, //페이지 버튼에서 시작페이지
      endPage: 0, //페이지 버튼에서 끝페이지
      maxPage: 0, //마지막페이지
      pages: [],
      tab: 0,
      games: []
    },
    async mounted(){

      console.log("wait socketReady");
      await socketReady;
      setupSocket();
      setupDatePicker();

      let tab, linkPart = window.location.href.split('#')[1];

      tab = parseInt(linkPart);
      await this.loadList(0, tab||0);

      // this.load();

      // window.addEventListener("keydown", e=>{
      //   if(e.key == "F5"){
      //     this.reload();
      //     api.refreshMoney();
      //     e.preventDefault();
      //   }
      // })

      this.$nextTick(()=>{
        $(this.$el).removeClass("pre-hide");

        appMountedResolve();
      })

    },

    methods: {

      setData(data){
        // console.log(data);
        let games = [], header;
        data.games.forEach(game=>{
          if(!header || header._id != game.league._id){
            header = game.league;
            games.push(header);
          }
          games.push(game);
        })

        this.games = games;
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

      getCurrentSearchInfo(){
        return {

        }
      },

      reload(curPage, tab, opt={}){
        opt = Object.assign(this.getCurrentSearchInfo(), opt);
        return this.loadList(or(curPage,this.curPage), or(tab,this.tab), opt);
      },

      resetReload(curPage, tab){
        this.loadList(or(curPage,this.curPage), or(tab,this.tab));
      },

      async loadList(curPage=0, tab=0, opt={}){
        // console.log("loadList page", curPage);
        // let {fromEmail, email, name} = opt;
        // this.fromEmail = fromEmail;
        // this.email = email;
        // this.name = name;
        // let query = {curPage, fromEmail, email, name};
        let range = startPicker.getRange();
        range.end = new Date(range.end.getTime() + (1000*60*60*24 - 1000));

        let query = {curPage, range};

        switch(tab){
          case 0:
            query.sports = "basketball";
          break;

          case 1:
            query.sports = "baseball";
          break;

          case 2:
            query.sports = "hockey";
          break;
        }

        let res = await api.getGameList(query);
        this.tab = tab;
        if(res.status == "success"){
          // Vmenu.reset(link);
          // console.log(res.data);
          this.setData(res.data);
          // console.error("open option", id, option);
        }else{
          await modal("알림", `로딩 실패<br>${res.message}`);
          if(res.code == "NO_AUTHENTICATION"){
            gotoLogin();
          }
          return;
        }
      },

      async removeGame(game){
        let res = await api.removeGame(game._id);
        if(res.status == "success"){
          this.reload();
        }else{
          await modal("알림", `제거 실패<br>${res.message}`);
        }
      },

      liveUpdate(list){
        list.forEach(ng=>{
          let game = this.games.find(g=>g._id==ng._id);
          if(game){
            game.live = true;
            game.liveTime = ng.liveTime;
            game.homeScore = ng.homeScore;
            game.awayScore = ng.awayScore;
          }
        })
      }
    }
  })//end Vapp

  appReadyResolve();
})()

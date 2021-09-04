console.log("header.js");
const Vmoney = new Vue({
  el: "#rightHeader",
  data: {
    user: user,
    money: {
      site: 0,
      wallet: 0,
      bet365: 0
    }
  },
  methods: {
    //comma: comma,
    printMoney(v){
      return comma(Math.floor(v));
    }
  },
  async created(){
    let res = await api.balance();

    if(res.status == "success"){
      // console.error(res);
      this.money = {
        site: res.data.money,
        wallet: res.data.wallet,
        bet365: res.data.bet365Money
      }
    }else{
      modal("알림", "잔액 로딩 실패<br>" +  res.message);
    }
    
    this.$nextTick(function() {
      $(this.$el).removeClass("pre-hide");
    })
  }
  // mounted: async function(){
  //   $(this.$el).removeClass("pre-hide");
  //
  //   let res = await api.balance();
  //
  //   if(res.status == "success"){
  //     // console.error(res);
  //     this.money = {
  //       site: res.data.money,
  //       wallet: res.data.wallet,
  //       bet365: res.data.bet365Money
  //     }
  //   }else{
  //     modal("알림", "잔액 로딩 실패<br>" +  res.message);
  //   }
  // }
})

const Vmenu = new Vue({
  el: "#menu",
  data: {
    time: 0,
    link: link,
    pages: pages
  },
  methods: {
    getPageObj(link){
      return this.pages.find(p=>p.link==link);
    },

    setBadge(link, text){
      let page = this.getPageObj(link);
      if(page){
        this.time = Date.now();
        page.new = '';
        page.badge = text;
        this.$forceUpdate();
      }
    },

    setNew(link){
      let page = this.getPageObj(link);
      if(page){
        this.time = Date.now();
        page.new = true;
        page.badge = '';
        this.$forceUpdate();
      }
    },

    reset(link){
      let page = this.getPageObj(link);
      if(page){
        //set 이후 바로 지우는 명령을 무시하기 위함.
        if(Date.now() - this.time > 200){
          page.new = null;
          page.badge = '';
          this.$forceUpdate();
        }
      }
    },

    resetAll(){
      this.pages.forEach(page=>{
        page.new = null;
        page.badge = '';
      })
      this.$forceUpdate();
    }
  },
  mounted: async function(){
    $(this.$el).removeClass("pre-hide");
  }
})

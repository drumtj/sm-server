console.log("sidebar.js");

const VsideMenu = new Vue({
  el: "#sidebarNav",
  data: {
    time: 0,
    link: link,
    pages: pages.slice()
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

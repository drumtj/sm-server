console.log("adminSetting.js");

let Vapp;
(async ()=>{
  let settingFormFormat = [
    {
      name: "이벤트 메일 계정",
      key: "emailUser",
      value: "",
      type: "text"
    },
    {
      name: "이벤트 메일 비번",
      key: "emailPass",
      value: "",
      type: "text",
      help: "16자리 코드"
    },
    {
      name: "피나클 계정",
      key: "pinnacleId",
      prepend: `<svg class="c-icon">
      <use xlink:href="/vendors/@coreui/icons/sprites/free.svg#cil-user"></use>
      </svg>`,
      value: "",
      // placeholder: "테스트1 입력하세요",
      help: "체크기 사용 계정",
      type: "text"
    },
    {
      name: "피나클 비번",
      key: "pinnaclePw",
      prepend: `<svg class="c-icon">
      <use xlink:href="/vendors/@coreui/icons/sprites/free.svg#cil-lock-locked"></use>
      </svg>`,
      value: "",
      type: "text"
    },
    {
      name: "벳버거 API 토큰",
      key: "betburgerApiToken",
      value: "",
      type: "text"
    },
    {
      name: "벳버거1 라이브 필터ID",
      key: "betburger1LiveFilterId",
      value: "",
      type: "text"
    },
    {
      name: "벳버거1 프리매치 필터ID",
      key: "betburger1PrematchFilterId",
      value: "",
      type: "text"
    },
    {
      name: "벳버거2 라이브 필터ID",
      key: "betburger2LiveFilterId",
      value: "",
      type: "text"
    },
    {
      name: "벳버거2 프리매치 필터ID",
      key: "betburger2PrematchFilterId",
      value: "",
      type: "text"
    },
    // {
    //   name: "벳버거 페이지당 이벤트",
    //   key: "betburgerPerPage",
    //   value: 20,
    //   type: "number"
    // },
    {
      name: "벳삼 계정발급비용",
      key: "accountPrice",
      prepend:`<svg class="c-icon">
      <use xlink:href="/vendors/@coreui/icons/sprites/free.svg#cil-dollar"></use>
      </svg>`,
      // prepend: "$",
      value: 20,
      type: "number"
    },
    {
      name: "벳삼 출금수수료",
      key: "accountWithdrawCommission",
      append:`%`,
      // prepend: "$",
      value: 5,
      type: "number"
    },
    {
      name: "PC 수량제한 기본값",
      key: "programLimit",
      value: 2,
      type: "number"
    },
    {
      name: "브라우져 수량제한 기본값",
      key: "browserLimit",
      value: 5,
      type: "number"
    },
    {
      name: "PROXY_SERVER",
      key: "proxyServer",
      value: "",
      type: "text"
    },
    {
      name: "PROXY_CUSTOMER",
      key: "proxyCustomer",
      value: "",
      type: "text"
    },
    {
      name: "PROXY_API_TOKEN",
      key: "proxyApiToken",
      value: "",
      type: "text"
    },
    {
      name: "프록시존-방글",
      key: "proxyZone-BD",
      value: "",
      type: "text"
    },
    {
      name: "프록시유저-방글",
      key: "proxyUser-BD",
      value: "",
      type: "text"
    },
    {
      name: "프록시비번-방글",
      key: "proxyPw-BD",
      value: "",
      type: "text"
    },
    {
      name: "프록시존-독일",
      key: "proxyZone-DE",
      value: "",
      type: "text"
    },
    {
      name: "프록시유저-독일",
      key: "proxyUser-DE",
      value: "",
      type: "text"
    },
    {
      name: "프록시비번-독일",
      key: "proxyPw-DE",
      value: "",
      type: "text"
    },
    {
      name: "프록시존-중국",
      key: "proxyZone-CN",
      value: "",
      type: "text"
    },
    {
      name: "프록시유저-중국",
      key: "proxyUser-CN",
      value: "",
      type: "text"
    },
    {
      name: "프록시비번-중국",
      key: "proxyPw-CN",
      value: "",
      type: "text"
    },
    {
      name: "국가 JSON",
      key: "countryJson",
      value: "",
      type: "text"
    }
  ]

  // list가 문자열로 된 것들을 오브젝트형태로 통일하자.
  settingFormFormat.forEach(obj=>{
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

  // let defaultData = settingFormFormat.reduce((r, form)=>{
  //   r[form.key] = form.value;
  //   return r;
  // }, {})

  // console.log("defaultData", defaultData);

  Vapp = new Vue({
    el: "#app",
    data: {
      // settings: [],
      forms: [],
      formsMap: null,
      backupTime: null
    },
    async created(){
      console.log("wait socketReady");
      await socketReady;

      this.forms = JSON.parse(JSON.stringify(settingFormFormat));
      this.formsMap = this.forms.reduce((r,form)=>{
        r[form.key] = form;
        return r;
      }, {});

      await this.load();

      let res = await api.getBackupTime();
      if(res.status == "success"){
        if(res.date){
          this.backupTime = new Date(res.date).toLocaleString();
        }
      }

      this.$nextTick(function() {
        $(this.$el).removeClass("pre-hide");
        appMountedResolve();
      })
    },
    // updated(){
    //   // console.error("?");
    //   $(".account-money-input").each((i,el)=>{
    //     setupMoneyInput(el);
    //   }).on("input", e=>{
    //     $(e.target).addClass('text-warning');
    //   })
    // },
    methods: {

      async load(){
        let res = await api.getSetting();
        if(res.status == "success"){
          console.log(res.data);
          if(res.data){
            this.setData(res.data);
          }
          // this.settings = res.data;
          // res.data.reduce((r,v)=>{
          //   r[v.key] = v.value;
          //   return r;
          // }, {});
        }else{
          modal("오류", res.message)
          return;
        }
      },


      update(event){
        let key = event.target.id.split('_');
        let value = event.target.value;

        // console.error(key, value, this.formsMap[key[0]]);

        let form = this.formsMap[key[0]];
        if(form){
          if(form.type == 'checkbox'){
            // console.log(event.target.checked);
            form.value[key[1]] = event.target.checked;
          }else if(form.type == 'radio'){
            if(event.target.checked){
              form.value = key[1];
            }
          }else{
            form.value = value;
          }
        }
        // console.log(key, value, this.formsMap, this.forms);
      },

      getData(){
        let opt = {};
        for(let key in this.formsMap){
          if(this.formsMap[key].type == "number"){
            opt[key] = Number(this.formsMap[key].value);
          }else{
            opt[key] = this.formsMap[key].value;
          }
        }
        return JSON.parse(JSON.stringify(opt));
      },

      setData(data){
        data = JSON.parse(JSON.stringify(data));
        for(let key in this.formsMap){
          if(this.formsMap[key]){
            this.formsMap[key].value = data[key] === undefined ? "" : data[key];
          }
        }
      },

      async save(){
        let data = this.getData();
        let res = await api.setSetting(data);
        if(res.status == "success"){
          modal("알림", "설정 저장 완료");
        }else{
          modal("오류", res.message);
        }
      },

      async backup(){
        let r = await modal("알림", "서버 백업작업은 서버에 부하를 줄수 있습니다. 계속하시겠습니까?", {buttons:["취소", "확인"]});
        if(!r){
          return;
        }

        let res = await api.backup();
        if(res.status == "success"){
          modal("알림", "서버 백업 완료");
          if(res.time){
            let d = new Date(res.time);
            this.backupTime = d.toLocaleString();
          }
        }else{
          modal("오류", res.message);
        }
      }
    }
  })//end Vapp

  appReadyResolve();
})()

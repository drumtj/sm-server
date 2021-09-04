console.log("addminAnalysis.js");

let Vapp;
(async () => {



  startLoading();

  function setupSocket() {

  }

  ////// sample
  // [
  //   {
  //     value: 0,
  //     text: '축구'
  //   }, {
  //     value: 1,
  //     text: '테니스'
  //   }, {
  //     value: 2,
  //     text: '하키'
  //   }, {
  //     value: 3,
  //     text: '농구'
  //   }
  //   , {
  //     label: '야구',
  //     options: [{
  //       value: 4,
  //       text: 'enhancement2'
  //     }, {
  //       value: 5,
  //       text: 'bug2'
  //     }]
  //   }
  // ]

  function optionParser(options){
    // console.error("optionParser", options);
    if(Array.isArray(options)){
      return options.map(v=>{
        if(Array.isArray(v)){
          return {
            value: v[0],
            text: v[1]
          }
        }else if(typeof v === "object"){
          if(v.label){
            v.options = optionParser(v.options);
          }
          return v;
        }else{
          return {
            value: v,
            text: v
          };
        }
      })
      // console.error(options);
    }
    return options;
  }

  function setupMultiSelect(selector, options){
    let el = $(selector)[0];
    if(!el){
      console.error("not found element: ", selector);
      return;
    }
    options = optionParser(options);
    return new coreui.MultiSelect(el, {
      multiple: true,
      selectionType: 'tags',
      search: true,
      searchPlaceholder: "전체",
      options: options
    });
  }

  let lineChartCfg = {
    type: 'line',
    // data: {
    //   labels: [],
    //   datasets: []
    // },
    // data: {
    //   labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S', 'M', 'T', 'W', 'T', 'F', 'S', 'S', 'M', 'T', 'W', 'T', 'F', 'S', 'S', 'M', 'T', 'W', 'T', 'F', 'S', 'S'],
    //   datasets: [{
    //     label: 'My First dataset',
    //     backgroundColor: getRgba("info", 10),
    //     borderColor: getColor("info"),
    //     pointHoverBackgroundColor: '#fff',
    //     borderWidth: 2,
    //     data: [165, 180, 70, 69, 77, 57, 125, 165, 172, 91, 173, 138, 155, 89, 50, 161, 65, 163, 160, 103, 114, 185, 125, 196, 183, 64, 137, 95, 112, 175]
    //   }, {
    //     label: 'My Second dataset',
    //     backgroundColor: 'transparent',
    //     borderColor: coreui.Utils.getStyle('--success', document.getElementsByClassName('c-app')[0]),
    //     pointHoverBackgroundColor: '#fff',
    //     borderWidth: 2,
    //     data: [92, 97, 80, 100, 86, 97, 83, 98, 87, 98, 93, 83, 87, 98, 96, 84, 91, 97, 88, 86, 94, 86, 95, 91, 98, 91, 92, 80, 83, 82]
    //   }, {
    //     label: 'My Third dataset',
    //     backgroundColor: 'transparent',
    //     borderColor: coreui.Utils.getStyle('--danger', document.getElementsByClassName('c-app')[0]),
    //     pointHoverBackgroundColor: '#fff',
    //     borderWidth: 1,
    //     borderDash: [8, 5],
    //     data: [65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65]
    //   }]
    // },




    options: {
      maintainAspectRatio: false,
      legend: {
        display: true
      },
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        y:{
          suggestedMin: -5000,
          suggestedMax: 10000
        },
        xAxes: [{
          gridLines: {
            drawOnChartArea: true
          }
        }]
        // ,
        // yAxes: [{
        //   ticks: {
        //     beginAtZero: true,
        //     maxTicksLimit: 5,
        //     stepSize: Math.ceil(250 / 5),
        //     max: 250
        //   }
        // }]
      },
      elements: {
        point: {
          radius: 2,
          hitRadius: 10,
          hoverRadius: 4,
          hoverBorderWidth: 3
        }
      }
    }
  }

  let radarChartCfg = {
    type: 'radar',
    options: {
      elements: {
        line: {
          borderWidth: 3
        }
      }
    }
  }

  let mainChartCfg = cloneObj(lineChartCfg);
  mainChartCfg.options.plugins.tooltip.callbacks = {
    footer: function(tooltipItems){
      let profitP = round(tooltipItems[1].parsed.y / tooltipItems[0].parsed.y * 100, 2);
      if(isNaN(profitP)){
        profitP = 0;
      }
      return '수익률: ' + profitP + '%';
    }
  }

  let chartsCfgs = {
    mainChart: mainChartCfg,
    profitFlowChart: cloneObj(lineChartCfg),
    sportsChart: cloneObj(lineChartCfg),
    betTypeChart: cloneObj(lineChartCfg),
    oddsChart: cloneObj(lineChartCfg),
    // oddsChart: null,
    // stakeChart: null
    /// radar
    sportsRadarChart: cloneObj(radarChartCfg)
  }

  let charts = {
    /// line
    mainChart: null,
    profitFlowChart: null,
    sportsChart: null,
    betTypeChart: null,
    oddsChart: null,
    // oddsChart: null,
    // stakeChart: null
    /// radar
    sportsRadarChart: null
  };

  function cloneObj(obj){
    return JSON.parse(JSON.stringify(obj));
  }

  function updateChartAll(data){
    // console.error("!", data);
    for(let o in data.result){
      // console.error("o", o);
      updateChart(o, data.result[o], data.graphType, data.period);
    }
  }

  function updateChart(name, data, graphType, period){
    console.log("updateChart", name, data, period);

    if(!charts[name]){
      console.log('setupChart for update', name);
      setupChart();
    }

    if(!charts[name]){
      return;
    }

    if(data.length){
      let lineTension = 0.3;
      let datasets, labels;
      let max = -9999999, min = 9999999;
      if(graphType == "line"){
        let check = {};
        labels = data.map(d=>{
          if(check[d._id.label]) return null;
          if(period == "week"){
            check[d._id.label] = 1;
            let dt = getDateOfWeek(d._id.label);
            return getDateString(dt) + '~'
          }else{
            check[d._id.label] = 1;
            return d._id.label;
          }
        }).filter(a=>!!a);

        if(name == "mainChart"){
          let datas = [[],[]];
          let stakeSum = 0, profitSum = 0, count = 0;
          data.forEach(d=>{
            count++;
            stakeSum += d.bookmakerStake;
            profitSum += d.bookmakerProfit;
            datas[0].push(round(d.bookmakerStake));
            datas[1].push(round(d.bookmakerProfit));
            max = Math.max(max, Math.max(d.bookmakerStake, d.bookmakerProfit));
            min = Math.min(min, Math.min(d.bookmakerStake, d.bookmakerProfit));
            // max = Math.max(max, d.bookmakerProfit);
            // min = Math.min(min, d.bookmakerProfit);
            // return round(d.bookmakerProfit,2);
          })

          datasets = [
            {
              label: '투자금',
              backgroundColor: getRgba("danger", 10),
              borderColor: getColor("danger"),
              pointHoverBackgroundColor: '#fff',
              borderWidth: 2,
              lineTension,
              fill: true,
              data: datas[0]
            },
            {
              label: '수익',
              backgroundColor: getRgba("success", 10),
              borderColor: getColor("success"),
              pointHoverBackgroundColor: '#fff',
              borderWidth: 2,
              lineTension,
              fill: true,
              data: datas[1]
            }
          ]

          Vapp.totalRealStake = comma(round(stakeSum));
          Vapp.totalRealProfit = comma(round(profitSum));
          Vapp.totalRealProfitP = round(profitSum/stakeSum*100,2) + '%';
          Vapp.totalRealProfitCount = count + Vapp.period;

          // charts[name].options.plugins.tooltip.callback = {
          //   footer: function(tooltipItems){
          //     console.log(tooltipItems);
          //     let sum = 0;
          //     tooltipItems.forEach(function(tooltipItem) {
          //       sum += tooltipItem.parsed.y;
          //     });
          //     return 'Sum: ' + sum;
          //   }
          // }

          charts[name].options.scales.y = {
            suggestedMin: min,
            suggestedMax: max,
            title: {
              display: true,
              text: '$'
            }
          }
        }else if(name == "profitFlowChart"){
          let sum = 0, count = 0;
          data = data.map(d=>{
            max = Math.max(max, d.bookmakerAvgProfitP);
            min = Math.min(min, d.bookmakerAvgProfitP);
            sum += d.bookmakerAvgProfitP;
            count++;
            return round(d.bookmakerAvgProfitP,2);
          })
          datasets= [{
            label: '수익률',
            backgroundColor: getRgba("info", 10),
            borderColor: getColor("info"),
            pointHoverBackgroundColor: '#fff',
            borderWidth: 2,
            lineTension,
            fill: true,
            data: data
          }]

          Vapp.totalProfitFlowP = round(sum,2) + '%';
          Vapp.totalProfitFlowCount = count + Vapp.period;

          charts[name].options.scales.y = {
            suggestedMin: min,
            suggestedMax: max,
            title: {
              display: true,
              text: '%'
            }
          }
        }else{
          // let datas;// = {};
          let list = [];
          let keys = {};
          data.reduce((r,d)=>{
            if(!r[d._id.label]){
              list.push(r[d._id.label] = {});
            }
            if(!r[d._id.label][d._id.key]){
              keys[d._id.key] = 1;
            }

            r[d._id.label][d._id.key] = round(d.bookmakerProfit, 2);
            max = Math.max(max, d.bookmakerProfit);
            min = Math.min(min, d.bookmakerProfit);
            return r;
          }, {})

          let keySum = {};
          let keyCount = {};

          datasets = Object.keys(keys).map(key=>{
            let color = randomColor();
            return {
              label: key,
              data: list.map(d=>{
                if(keySum[key] === undefined){
                  keySum[key] = 0;
                }
                if(keyCount[key] === undefined){
                  keyCount[key] = 0;
                }
                if(d[key]){
                  keySum[key] += d[key];
                  keyCount[key]++;
                }
                return d[key] === undefined ? NaN : d[key]
              }),
              backgroundColor: hexToRgbA(color, 0.1),
              borderColor: color,
              pointHoverBackgroundColor: '#fff',
              lineTension,
              fill: true,
              borderWidth: 2
            }
          })

          charts[name].options.scales.y = {
            suggestedMin: min,
            suggestedMax: max,
            title: {
              display: true,
              text: '$'
            }
          }

          if(name == "betTypeChart"){
            let list = datasets.map(a=>a.label);
            Vapp.betTypeList = list;
            Vapp.betTypeSum = keySum;
            Vapp.betTypeCount = keyCount;
          }
        }

        datasets.push({
          label: '기준선',
          borderDash: [5, 5],
          borderColor: getColor("warning"),
          data: Array(datasets[0].data.length).fill(0)
        })
      }else if(graphType == "radar"){
        console.error(data);
        // return;
        labels = [];
        data = data.map(d=>{
          labels.push(d._id);

          max = Math.max(max, d.bookmakerProfit);
          min = Math.min(min, d.bookmakerProfit);
          return round(d.bookmakerProfit, 2);
        })

        let color = randomColor();
        datasets = [{
          label: "종목별",
          data: data,
          fill: true,
          backgroundColor: hexToRgbA(color, 0.1),
          borderColor: color,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: color
        }]
      }

      // console.log({labels, datasets})


      charts[name].data.labels = labels;
      charts[name].data.datasets = datasets;
      charts[name].update();

      // console.error("aspectRatio", charts[name].aspectRatio);
      // console.error("currentDevicePixelRatio", charts[name].currentDevicePixelRatio);
      // console.error("height", charts[name].height);
    }
  }

  function updateChartOptions(name, options, doUpdate=true){
    if(!charts[name]) return;

    if(options){
      for(let o in options){
        charts[name].options[o] = options[o];
      }
      if(doUpdate){
        charts[name].update();
      }
    }
  }
  // function getRgba(type, alphaP=100){
  //   return coreui.Utils.hexToRgba(coreui.Utils.getStyle('--'+type, document.getElementsByClassName('c-app')[0]), alphaP);
  // }
  //
  // function getColor(type){
  //   return coreui.Utils.getStyle('--'+type, document.getElementsByClassName('c-app')[0])
  // }

  function setupChart() {
    // return;
    for(let name in charts){
      if(!chartsCfgs[name]){
        console.error("not found chart cfg", name);
        continue;
      }
      if(charts[name]){
        continue;
      }
      let el = document.getElementById(name);
      // console.error(name, el)
      if(!el){
        console.error("not found chart element", name);
        continue;
      }
      charts[name] = new Chart(el, chartsCfgs[name]);
    }
  }

  let startPicker, endPicker;

  function setupDatePicker() {
    let today = new Date();
    // let sd = new Date(today.getFullYear(), today.getMonth(), 1);
    let sd = new Date(today.getTime() - 1000*60*60*24*7);
    startPicker = datepicker('.start-date', getDatePickerOption({dateSelected:sd}));
    endPicker = datepicker('.end-date', getDatePickerOption());
  }



  let res = await api.getEmailList();
  let users = res.data||[];



  let ms_sports, ms_bettype, ms_profit_main, ms_user;

  Vapp = new Vue({
    el: "#app",
    data: {
      // count: 0, //조건에 맞는 계정수
      // curPage: 0, //현재 페이지
      // startPage: 0, //페이지 버튼에서 시작페이지
      // endPage: 0, //페이지 버튼에서 끝페이지
      // maxPage: 0, //마지막페이지
      // pages: [],
      // tab: 0,
      // list: [],
      // accountId: null,
      // email: null,
      // status: null,
      // betId: null,
      // eventName: null,
      // betType: null,
      odds1: null,
      oddsCon1: null,
      odds2: null,
      oddsCon2: null,
      graphType: "line",
      period: "day",
      totalProfitFlowP: '0%',
      totalProfitFlowCount: 0,
      totalRealStake: 0,
      totalRealProfit: 0,
      totalRealProfitP: '0%',
      totalRealProfitCount: 0,
      betTypeList: [],
      betTypeSum: {},
      result: {}
      // users: [],
      // user: user
      // statusClassMap:{
      //   open: "badge-primary",
      //   approval: "badge-success",
      //   reject: "badge-danger"
      // }
    },
    async created() {
      console.log("wait socketReady");
      await socketReady;
      setupSocket();

      // let tab, linkPart = window.location.href.split('#')[1];
      // tab = parseInt(linkPart);

      setupDatePicker();
      ms_sports = setupMultiSelect("#select-sports", ["Soccer", "Tennis", "Baseball", "Basketball", "Hockey", "Football"]);
      ms_bettype = setupMultiSelect("#select-bettype", ["MONEYLINE", "SPREAD", "TOTAL_POINTS"]);
      // ms_profit_main = setupMultiSelect("#select-profit-main", [
      //   ["yb", "양빵"],
      //   ["vl-bet365", "벨류-벳365"],
      //   ["vl-pnc", "벨류-피나클"]
      // ]);
      ms_user = setupMultiSelect("#select-user", users.map(u=>u.email));

      // console.error(s);

      setupChart();

      await this.loadList();


      window.addEventListener("keydown", e => {
        if (e.key == "F5") {
          this.reload();
          api.refreshMoney();
          e.preventDefault();
        }
      })


      this.$nextTick(function() {
        $(this.$el).removeClass("pre-hide");
        appMountedResolve();
      })
    },

    async mounted() {},

    methods: {
      comma(n) {
        return comma(Math.floor(n));
      },

      round(n, p = 0) {
        if (typeof n === "number") {
          return Math.round(n * Math.pow(10, p)) / Math.pow(10, p);
        } else {
          return 0;
        }
      },

      // printPercent(n) {
      //   return this.round(n * 100, 2) + '%';
      // },

      // printProfit(item) {
      //   return '$' + this.round(calc.profit(item.siteOdds, item.bookmakerOdds, item.siteStake, item.bookmakerStake), 2);
      // },
      //
      // printProfitP(item) {
      //   return this.printPercent(calc.profitP(item.siteOdds, item.bookmakerOdds));
      // },

      changeSearchOdds1() {
        this.odds1 = parseFloat($('.search-odds1').val().trim());
      },

      changeSearchOddsCon1() {
        this.oddsCon1 = $('.search-oddscon1').val().trim();
      },

      changeSearchOdds2() {
        this.odds2 = parseFloat($('.search-odds2').val().trim());
      },

      changeSearchOddsCon2() {
        this.oddsCon2 = $('.search-oddscon2').val().trim();
      },

      setData(data) {
        // console.log(data);
        // this.list = data.list;
        // this.list.forEach(item => {
        //   this.calcPncResult(item);
        //   this.calcBet365Result(item);
        // })
        // this.curPage = data.curPage;
        // this.startPage = data.startPage;
        // this.endPage = data.endPage;
        // this.maxPage = data.maxPage;

        // this.result = data.result || {};

        // updateChartOptions(newOptions, false);
        // console.error("?");

        updateChartAll(data);

        // if(data.result){
        //   this.betSum = data.result.betSum;
        //   this.returnSum = data.result.returnSum;
        //   this.resultSum = data.result.resultSum;
        // }
        // let pages = [];
        // for (let i = this.startPage; i <= this.endPage; i++) {
        //   pages.push(i);
        // }
        // this.pages = pages;
      },

      getCurrentSearchInfo() {
        return {
          // accountId: this.accountId,
          // betId: this.betId,
          // eventName: this.eventName,

          // email: this.email,
          // status: this.status,
          // betType: this.betType,

          sports: ms_sports._selection.map(a=>a.value),
          betTypes: ms_bettype._selection.map(a=>a.value),
          users: ms_user._selection.map(a=>a.value),
          // profitMains: ms_profit_main._selection.map(a=>a.value),
          emails: ms_user._selection.map(a=>a.value),
          graphType: this.graphType,
          period: this.period,
          odds1: this.odds1,
          oddsCon1: this.oddsCon1,
          odds2: this.odds2,
          oddsCon2: this.oddsCon2
        }
      },

      reload(opt = {}) {
        opt = Object.assign(this.getCurrentSearchInfo(), opt);
        return this.loadList(opt);
      },

      resetReload() {
        this.loadList();
      },

      async loadList(opt = {}) { //accountId){
        // accountId = accountId||this.accountId;
        // console.error(opt);
        let {
          sports,
          betTypes,
          users,
          // profitMains,
          emails,
          period,
          graphType,
          odds1,
          oddsCon1,
          odds2,
          oddsCon2
        } = opt;

        // console.error({period});

        if(period){
          this.period = period;
        }else{
          period = this.period;
        }
        if(graphType){
          this.graphType = graphType;
        }else{
          graphType = this.graphType;
        }
        this.odds1 = odds1;
        this.oddsCon1 = oddsCon1;
        this.odds2 = odds2;
        this.oddsCon2 = oddsCon2;
        let range = startPicker.getRange();
        range.end = new Date(range.end.getTime() + (1000 * 60 * 60 * 24 - 1000));
        // console.log("date range", range);
        // console.log("loadList page", curPage);
        let query = {
          sports,
          betTypes,
          users,
          emails,
          range,
          graphType,
          period,
          odds1,
          oddsCon1,
          odds2,
          oddsCon2
        };

        // query.admin = true;
        let res = await api.getAnalysis(query);

        if (res.status == "success") {
          Vmenu.reset(link);
          // console.log(res.data);
          this.setData(res.data);
          // console.error("open option", id, option);
        } else {
          await modal("알림", `로딩 실패<br>${res.message}`);
          if (res.code == "NO_AUTHENTICATION") {
            gotoLogin();
          }
          return;
        }
      }


    } //end methods
  }) //end Vapp

  appReadyResolve();
})()

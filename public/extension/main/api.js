//const axios = require('axios');
// const {API_BASEURL, EMAIL} = require('./config.js');
// let API_BASEURL_LIST = [];
function setupAPI(email){
  let net = axios.create({
    // baseURL: API_BASEURL_LIST[apiIndex],
    // baseURL: API_BASEURL,
    baseURL: LOCAL_HOST_URL + "/api",
    headers: {
      'Authorization': email
      // 'cache-control': 'no-cache, must-revalidate, post-check=0, pre-check=0'
    }
  })

  // let apiIndex = 0;
  // function rotationUrl(){
  //   if(++apiIndex >= API_BASEURL_LIST.length){
  //     apiIndex = 0;
  //   }
  //   setBaseUrl(API_BASEURL_LIST[apiIndex]);
  //   console.error("rotation api url:", API_BASEURL_LIST[apiIndex]);
  // }

  // console.error("??", net.defaults);
  function setBaseUrl(url){
    net.defaults.baseURL = url;
  }

  function success(res){
    if(res.data.status == "success"){
      return res.data;
    }else if(res.data.status == "fail"){
      return res.data;
    }else{
      return {
        status: 'fail',
        data: res.data
      }
    }
  }

  function err(e){
    // console.error(e);
    if(e.response){
      if(e.response.data && e.response.data.status == "fail"){
        return e.response.data;
      }else{
        // if(e.response.status == 403){
        //   rotationUrl();
        // }
        return {
          status: 'fail',
          message: e.response.statusText
        }
      }
    }else{
      return {
        status: 'fail',
        message: 'empty response'
      }
    }
  }

  function ax(url, data, method='GET', headers){
    return net({method, url, data, headers})
    .then(res=>success(res))
    .catch(e=>err(e));
  }

  return {
    setBaseUrl,
    // rotationUrl,

    getPncinfo(email){
      return ax('/get_pncinfo/' + email);
    },

    // getSetting(){
    //   return ax('/get_setting');
    // },

    // test(){
    //   return ax('/ip', {test:1}, "POST");
    // },
    exchangeRate(originCode, targetCode){
      // USD 미국 달러
      // CNY 중국 위안
      let u = `https://api.manana.kr/exchange/rate/${originCode}/${targetCode}.json`;
      return axios.get(u).then(res=>{
        let r;
        try{
          r = res.data[0].rate;
        }catch(e){
          console.error("error get exchangeRate");
        }
        return r;
      })
    },

    balance(){
      return ax('/balance');
    },

    getPIDs(){
      return ax('/get_pids');
    },

    checkPID(pid){
      return ax('/check_pid/' + pid);
    },

    loadProgram(pid){
      return ax('/load_program/' + pid);
    },

    loadBrowser(bid){
      return ax('/load_browser/' + bid);
    },

    bet(data){
      return ax('/input_bet', data, "POST");
    },

    saveTestData(data){
      return ax("/input_test_data", data, "POST");
    },

    limitAccount(id){
      if(!id) return Promise.reject();
      return ax("/limit_account/" + id);
    },

    dieAccount(id){
      if(!id) return Promise.reject();
      return ax("/die_account/" + id);
    },

    loadAccountInfo(id){
      return ax("/load_account/" + id);
    },

    benEvent(data){
      return ax("/ben_event", data, "POST");
    }
  }
}

module.exports = MD=>{
  let {
    setRedis,
    getRedis,
    room_checker,
    room_bettor,
    argv,
    redisClient,
    io,
    mongoose,
    sendDataToMain,
    sendDataToBg,
    sendDataToBet365,
    emitToMember,
    emitToAdmin,
    emitToProgram,
    emitToProgramPromise,
    socketResolveList,
    config,
    comma,
    router,
    User,
    Program,
    Browser,
    BetData,
    Event,
    Log,
    BenEvent,
    Proxy,
    Withdraw,
    Account,
    Option,
    Approval,
    Setting,
    DepositLog,
    Data,
    BackupHistory,
    authAdmin,
    authMaster,
    task,
    deposit,
    approvalTask,
    refreshTab,
    refreshMoney,
    refreshBet365Money,
    refreshBet365TotalMoney,
    updateBet365Money,
    updateBet365TotalMoney,
    getSetting,
    calc,
    MoneyManager,
    uuidv4
  } = MD;



  // for user
  router.get("/get_proxy_model/:_id", task(async (req, res)=>{
    let _id = req.params._id;
    let proxy = await Proxy.findOne({user:req.user._id, _id}).lean();

    res.json({
      status: "success",
      data: proxy
    })
  }))

  // return;

  // for user
  router.get("/buy_proxy/:_id", task(async (req, res)=>{
    let _id = req.params._id;
    let user = await User.findOne({email:req.user.email}).select(["email", "money", "wallet", "bet365Money"]);
    let proxy = await Proxy.findOne({_id, trash:false, removed:false})
    .populate({
      path: "user",
      model: User,
      option: {
        select: "email"
      }
    });

    if(proxy.price === undefined){
      proxy.price = 0;
    }

    let setting = await getSetting();

    // if(!account){
    //   res.json({
    //     status: "fail",
    //     code: "INSUFFICIENCY_ACCOUNT",
    //     message: "발급 가능한 계정이 없습니다."
    //   });
    //   return;
    // }

    if(!proxy){
      res.json({
        status: "fail",
        code: "NOT_FOUND_PROXY",
        message: "없는 정보에 대한 요청입니다."
      });
      return;
    }

    // console.log(account, req.session.user);

    if(proxy.user && proxy.user.email == req.session.user.email){
      res.json({
        status: "fail",
        code: "ALREADY_PURCHASED",
        message: "이미 발급된 IP 입니다."
      });
      return;
    }

    if(proxy.user){
      res.json({
        status: "fail",
        code: "SOLD_OUT",
        message: "다른 사용자가 구매한 IP입니다."
      });
      return;
    }

    // if(user.wallet < config.ACCOUNT_PRICE + account.money){
    if(user.wallet < proxy.price){
      res.json({
        status: "fail",
        code: "INSUFFICIENT_CASH",
        message: "잔액부족"
      });
      return;
    }

    await MoneyManager.withdrawWallet(user, proxy.price, "buy proxy ip");
    user = await User.findOne({email:req.user.email}).select(["email", "money", "wallet", "bet365Money"]);

    proxy.user = user._id;
    await proxy.save();

    req.user = user;

    res.json({
      status: "success",
      data: {
        proxy,
        wallet: user.wallet
      }
    })
  }))

  router.get("/get_store_proxys", task(async (req, res)=>{
    // let count = await Account.countDocuments({user:null});
    let proxys;
    proxys = await Proxy.find({user:null, removed:false, trash:false})
    .limit(config.PROXY_LIST_COUNT_PER_PAGE)
    .sort({createdAt:1});

    let setting = await getSetting();

    res.json({
      status: "success",
      data: {proxys}
    });
  }))

  // admin, master 권한이 있는 계정만 허용하는 api
  // 모든 계정과, 계정에 연결된 회원정보까지 내보낸다.
  // []관리자]계정관리에서 사용할 용도.
  router.post("/get_proxys", authAdmin, task(async (req, res)=>{
    // if(!(req.user.authority || req.user.master)){
    //   res.json({
    //     status: "fail",
    //     message: "권한이 없는 요청입니다."
    //   })
    //   return;
    // }


    // console.log(req.body);
    let {
      ids, used, trash, searchIP,
      offset, limit, curPage, email
    } = req.body;

    // used == undefined -> all
    // used == true -> used account
    // used == false -> no used account
    // withSkrill == true -> with skrill info
    // offset
    // limit

    let proxys;
    let query = {removed:false};
    if(ids){
      query._id = ids;
    }

    if(used == true){
      query.user = {$ne:null};
    }else if(used == false){
      query.user = null;
    }

    if(trash !== undefined){
      query.trash = trash;
    }

    if(searchIP){
      query.proxyHttp = { $regex: '.*' + searchIP + '.*' };
    }

    if(curPage !== undefined){
      // 페이지가 설정되었으면, 그에 맞춰서 limit, offset 계산
      limit = config.PROXY_LIST_COUNT_PER_PAGE;
      offset = curPage * limit;
    }else{
      // 페이지가 설정안되었다면. 전달된 limit, offset 사용
      // 전달된 limit, offset이 없으면 기본값사용
      if(limit === undefined){
        limit = config.PROXY_LIST_COUNT_PER_PAGE;
      }
      if(offset === undefined){
        offset = 0;
      }

      curPage = offset / limit;
    }

    let populateObj = {
      path: 'user',
      model: User,
      options: {
        select: 'email'
      }
    };

    if(email){
      let user = await User.findOne({email}).select('_id');
      query.user = user._id;
    }


    console.log("query", query);
    // console.log("@@@populateObj", populateObj);

    // 전체숫자는 limit되지 않은숫자여야하므로 이 count방법을 유지한다.
    let count = await Proxy.countDocuments(query);
    let pageLength = Math.ceil(count / limit);// 0 ~
    let maxPage = pageLength - 1;
    // console.log("account count", count);
    let startPage = Math.floor(curPage / config.PAGE_COUNT) * config.PAGE_COUNT;
    let endPage = Math.min(startPage + config.PAGE_COUNT-1, maxPage);

    proxys = await Proxy.find(query)
    .sort({createdAt:-1})
    .limit(limit)
    .skip(offset)
    .populate(populateObj)
    .lean();


    if(used == true){
      proxys = proxys.filter(proxy=>!!proxy.user);
    }

    let users = await User.find({}).select("email").lean();

    res.json({
      status: "success",
      data: {proxys, users, curPage, startPage, endPage, maxPage, count, pageCount:config.PAGE_COUNT}
    });
  }))



  // 관리자 계정관리에서 계정 제거시.
  router.get("/remove_proxy/:_id", authAdmin, task(async (req, res)=>{
    let _id = req.params._id;
    let proxy = await Proxy.findOne({_id});//.populate('browser');

    if(!proxy){
      res.json({
        status: "fail",
        message: "정보를 찾을 수 없습니다."
      })
      return;
    }

    // let user = proxy.user;

    // disconnectBrowser
    // if(proxy.browser){
    //   proxy.browser.proxy = null;
    //   await proxy.browser.save();
    // }
    // proxy.browser = null;
    //
    // proxy.user = null;
    // proxy.removed = true;
    // await proxy.save();

    // 연결된 브라우져가 있으면 해제
    // await proxy.disconnectBrowser();

    if(proxy.browser){
      await Browser.updateOne({_id:proxy.browser}, {proxy:null});
    }
    await Proxy.updateOne({_id}, {browser:null, user:null, removed:true});



    res.json({
      status: "success"
    })
  }))

  // 회수
  router.get("/remove_proxy_user/:_id", authAdmin, task(async (req, res)=>{
    let _id = req.params._id;
    let proxy = await Proxy.findOne({_id});//.populate('browser');
    if(!proxy){
      res.json({
        status: "fail",
        message: "정보를 찾을 수 없습니다."
      })
      return;
    }

    // console.log("@@@1", proxy);

    // disconnectBrowser
    // console.error("browser", proxy.browser);
    if(proxy.browser){
      await Browser.updateOne({_id:proxy.browser}, {proxy:null});
      // proxy.browser.proxy = null;
      // await proxy.browser.save();
    }
    await Proxy.updateOne({_id}, {browser:null, user:null});
    // proxy.browser = null;
    // proxy.user = null;
    // await proxy.save();

    // await proxy.disconnectBrowser();
    // console.log("@1", proxy);
    // let p = await Proxy.findOne({_id});//.populate('browser');
    // console.log("@@@2", p);

    res.json({
      status: "success"
    })
  }))


  // 휴지통에서 복구
  router.get("/restore_proxy/:_id", authAdmin, task(async (req, res)=>{
    let _id = req.params._id;
    let proxy = await Proxy.findOne({_id});
    if(!proxy){
      res.json({
        status: "fail",
        message: "정보를 찾을 수 없습니다."
      })
      return;
    }

    proxy.trash = false;
    await proxy.save();

    res.json({
      status: "success"
    })
  }))


  // 유저의 계정관리에서 제거를 누를경우,
  // Account.user는 유지하고, 제거된 표시만 해야함.
  router.get("/trash_proxy/:_id", task(async (req, res)=>{
    let _id = req.params._id;
    // 자신이 소유한 대상만 컨트롤가능해야한다.
    // await Account.updateOne({_id:id, user:req.user}, {trash:true});
    let proxy = await Proxy.findOne({_id, user:req.user});//.populate('browser');
    if(!proxy){
      res.json({
        status: "fail",
        message: "정보를 찾을 수 없습니다."
      })
      return;
    }

    // disconnectBrowser
    // if(proxy.browser){
    //   proxy.browser.proxy = null;
    //   await proxy.browser.save();
    // }
    // proxy.browser = null;
    //
    // proxy.trash = true;
    // await proxy.save();
    // // await proxy.disconnectBrowser();

    if(proxy.browser){
      await Browser.updateOne({_id:proxy.browser}, {proxy:null});
    }
    await Proxy.updateOne({_id}, {browser:null, trash:true});

    res.json({
      status: "success"
    })
  }))



  // 기본적으로 본인이 소유한 계정만 가져오도록 한다.
  router.post("/get_linked_proxys", task(async (req, res)=>{
    let proxys, user;
    let targetEmail = req.body.email;
    if(targetEmail){
      user = await User.findOne({email:targetEmail});
    }else{
      user = req.user;
    }
    proxys = await Proxy.find({
      user:user._id,
      trash:false,
      removed:false
    })
    .sort({proxyHttp:1})
    .lean();
    //.populate('browser');

    res.json({
      status: "success",
      data: proxys
    });
  }))

  router.post("/update_proxy/:_id", authAdmin, task(async (req, res)=>{
    let _id = req.params._id;
    let body = req.body;
    delete body._id;
    // delete option._id;
    // let proxy = await Proxy.findOne({_id}).lean();

    let data;
    if(body.proxyHttp){
      //내용 수정
      data = await makeProxyBody(body, _id);
      if(data.status == "fail"){
        res.json(data);
        return;
      }
    }else{
      //상태 수정
      data = {body};
    }

    let proxy = await Proxy.findOneAndUpdate({_id}, data.body, {new:true});

    res.json({
      status: "success",
      data: proxy
    })
  }))

  async function makeProxyBody(data, exceptId){
    let body = JSON.parse(JSON.stringify(data));
    delete body._id;
    // console.error(data, body);

    let ip = body.proxyHttp.split(':')[0];
    let temp = await Proxy.findOne({_id:{$ne:exceptId}, proxyHttp:{$regex:'.*'+ip+'.*'}, removed:false});
    if(temp){
      return {
        status: "fail",
        message: "이미 존재하는 IP 입니다."
      }
    }

    temp = await Proxy.findOne({_id:{$ne:exceptId}, proxyHttp:{$regex:'.*'+ip+'.*'}, removed:true});
    if(temp){
      body.historyOfUse = true;
    }else{
      body.historyOfUse = false;
    }

    // console.log("@@@", body);

    if(body.expire){
      body.expire = new Date(body.expire);
    }else{
      // 기본 한달.
      body.expire = new Date(Date.now()+(1000*60*60*24*30));
    }

    return {
      status: "success",
      body
    }
  }

  router.post("/regist_proxy", authAdmin, task(async (req, res)=>{
    let body = req.body;
    // body.user = req.user._id;
    delete body._id;
    let data = await makeProxyBody(body);
    if(data.status == "fail"){
      res.json(data);
      return;
    }

    let proxy = await Proxy.create(data.body);

    res.json({
      status: "success",
      data: proxy
    });
  }))
}

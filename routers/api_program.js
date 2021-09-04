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

  router.get("/load_program/:pid", task(async (req, res)=>{
    let pid = req.params.pid;//req.query.pid || req.body.pid;

    // console.log('user', req.user);
    // console.log('body', req.body);
    // console.log('query', req.query);
    console.log("load_program", pid);
    let user = await User.findOne({_id:req.user._id})
    .select(["email", "money", "programs"])
    .populate([
      {
        path: "programs",
        model: Program,
        populate: {
          path: "browsers",
          model: Browser,
          // select: "-logs",
          populate: [
            {
              path: "proxy",
              model: Proxy
            }
            // {
            //   path: "account",
            //   model: Account,
            //   options: {
            //     select: "id pw limited died country money"
            //   }
            // },
            // {
            //   path: "option",
            //   model: Option
            // }
          ]
        }
      }
    ])
    // .deepPopulate(['programs.browsers'])
    .lean();

    let program = user.programs.find(p=>p._id==pid);
    // console.log("?", user);
    res.json({
      status: "success",
      data: program
    });
  }))

  router.post("/update_browser/:bid", task(async (req, res)=>{
    let bid = req.params.bid;
    let browser = req.body.browser;
    if(!browser){
      res.json({
        status: "fail",
        message: "전달된 browser 데이터가 없습니다."
      });
      return;
    }

    delete browser.logs;
    console.log("update_browser", bid);
    let returnAccount;
    let originBrowser = await Browser.findOne({_id:bid});//.select("-logs");

    // 계정연결 요청이면
    if(browser.account !== undefined){
      // 해당 브라우져에 연결된 계정이 있다면 그 계정에 브라우져 정보 제거
      if(originBrowser.account){
        await Account.updateOne({_id:originBrowser.account}, {browser:null});
      }

      if(browser.account){
        // 해당 계정에 브라우져 정보를 입력
        await Account.updateOne({_id:browser.account}, {browser:bid});
      }

      // // 해당 계정에 브라우져 정보를 입력
      // let account = await Account.findOne({_id:browser.account});
      // account.browser = bid;
      // await account.save();

      // 연결된 계정의 startMoney, betCount를 초기화(현재값과 일치)시킨다.
      let account = await Account.findOne({_id:browser.account});
      if(account && account.startMoney != 0){
        account.startMoney = account.money;
        account.startBetCount = account.betCount;
        await account.save();
        returnAccount = await Account.findOne({_id:browser.account}).lean();
        // console.log("#####", returnAccount);
      }
    }
    // console.log("data", browser);
    // console.log("originBrowser", originBrowser);
    if(browser.proxy !== undefined){
      // 해당 브라우져에 연결된 프록시가 있다면 그 프록시에 브라우져 정보 제거
      if(originBrowser.proxy){
        // console.log("disconnect browser from origin proxy");
        await Proxy.updateOne({_id:originBrowser.proxy}, {browser:null});
      }

      if(browser.proxy){
        // 해당 프록시에 브라우져 정보를 입력
        await Proxy.updateOne({_id:browser.proxy}, {browser:bid});
      }
    }

    await Browser.updateOne({_id:bid}, browser);
    // else{
    //   // 브라우져에 연결된 계정정보가 없는 업데이트인데
    //   // 기존에 브라우져에 연결된 계정이 있다면 없애자
    //   else{
    //   originBrowser.account = null;
    // }
    // await originBrowser.save();

    res.json({
      status: "success",
      account: returnAccount
    });
  }))

  router.get("/load_browser/:bid", task(async (req, res)=>{
    let bid = req.params.bid;//req.query.bid || req.body.bid;

    // console.log('user', req.user);
    // console.log('body', req.body);
    // console.log('query', req.query);
    console.log("load_browser", bid);
    let browser = await Browser.findOne({
      _id:bid,
      // account:{$ne:null},
      // option:{$ne:null}
    })
    //.select("-logs")
    .populate([
      {
        path: "account",
        model: Account,
        options: {
          select: "id pw limited died country money startMoney betCount startBetCount"
        }
      },
      {
        path: "option",
        model: Option
      },
      {
        path: "proxy",
        model: Proxy
      }
    ]).lean();
    // .deepPopulate(['account', 'option']);

    // console.log('browser', browser)
    if(browser){
      res.json({
        status: "success",
        data: browser
      });
    }else{
      res.json({
        status: "fail",
        message: `browser ${bid}를 찾을 수 없습니다.`
        // message: `Browser컬렉션에서 account,option을 가진 ${bid}를 찾을 수 없습니다.`
      });
    }
  }))

  router.get("/load_logs/:bid", task(async (req, res)=>{
    let logs = await Log.find({browser: req.params.bid})
    .sort('-updatedAt')
    .limit(config.MAX_LOG_LENGTH)
    .lean();

    // let bid = req.params.bid;
    // let browser = await Browser.findOne({_id:bid}).select("logs").lean();

    res.json({
      status: "success",
      // data: (browser.logs||[]).sort((a,b)=>b.updatedAt-a.updatedAt)
      data: logs
    });
  }))

  router.get("/check_pid/:pid", task(async (req, res)=>{
    let pid = req.params.pid;//req.query.pid || req.body.pid;

    console.log("check_pid", pid);
    let user = await User.findOne({email:req.user.email, programs:{$in:pid}});
    // if(user)
    // let has = user.programs.indexOf(pid) > -1;
    // let user = await User.findOne({email:req.session.user.email, programs:{ $contains : pid }});
    if(user){
      res.json({
        status: "success"
      })
    }else{
      res.json({
        status: "fail",
        message: "등록되지 않은 프로그램 ID입니다."
      })
    }
  }))

  router.get("/get_pids", task(async (req, res)=>{
    let user = await User.findOne({email:req.user._id}).lean();
    // console.log(user.programs);
    if(user){
      res.json({
        status: "success",
        pids: user.programs
      })
    }else{
      res.json({
        status: "fail"
      })
    }
  }))
}

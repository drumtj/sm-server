module.exports = MD=>{
  let {
    util,
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
    AccountWithdraw,
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

  router.get("/load_account/:id", task(async (req, res)=>{
    let account = await Account.findOne({id:req.params.id})
    .select(["-skrillId", "-skrillPw", "-skrillCode", "-digit4", "-skrillEmail"])
    .lean();

    res.json({
      status: "success",
      data: {account}
    })
  }))

  router.get("/limit_account/:id", task(async (req, res)=>{
    await Account.updateOne({user:req.user._id, id:req.params.id}, {limited:true});
    res.json({
      status: "success"
    })
  }))

  router.get("/die_account/:id", task(async (req, res)=>{
    await Account.updateOne({user:req.user._id, id:req.params.id}, {died:true});
    res.json({
      status: "success"
    })
  }))

  router.get("/buy_account/:id", task(async (req, res)=>{
    let id = req.params.id;
    let user = await User.findOne({email:req.user.email}).select(["email", "money", "wallet", "bet365Money"]);
    let account = await Account.findOne({_id:id, trash:false, removed:false, firstCharged:true})
    // .select("id")
    // .select(["id", "user", "died", "limited", "browser", "number", "money"])
    .select(["-skrillId", "-skrillPw", "-skrillCode", "-digit4", "-skrillEmail"])
    .populate({
      path: "user",
      model: User,
      option: {
        select: "email"
      }
    })
    .limit(1);

    let setting = await getSetting();

    // if(!account){
    //   res.json({
    //     status: "fail",
    //     code: "INSUFFICIENCY_ACCOUNT",
    //     message: "?????? ????????? ????????? ????????????."
    //   });
    //   return;
    // }

    if(!account){
      res.json({
        status: "fail",
        code: "NOT_FOUND_ACCOUNT",
        message: "?????? ????????? ?????? ???????????????."
      });
      return;
    }

    // console.log(account, req.session.user);

    if(account.user && account.user.email == req.session.user.email){
      res.json({
        status: "fail",
        code: "ALREADY_PURCHASED",
        message: "?????? ????????? ???????????????."
      });
      return;
    }

    if(account.user){
      res.json({
        status: "fail",
        code: "SOLD_OUT",
        message: "?????? ???????????? ????????? ???????????????."
      });
      return;
    }

    let price = setting.accountPrice || 0;

    // if(user.wallet < config.ACCOUNT_PRICE + account.money){
    if(user.wallet < price + account.money){
      res.json({
        status: "fail",
        code: "INSUFFICIENT_CASH",
        message: "????????????"
      });
      return;
    }

    await MoneyManager.withdrawWallet(user, price + account.money, "buy account");
    user = await User.findOne({email:req.user.email}).select(["email", "money", "wallet", "bet365Money"]);
    // user.wallet -= setting.accountPrice + account.money;
    // await user.save();

    account.user = user._id;
    await account.save();

    let bet365Money = await updateBet365TotalMoney(user);

    req.user = user;

    res.json({
      status: "success",
      data: {
        account: account,
        wallet: user.wallet,
        bet365Money: bet365Money
      }
    })
  }))

  router.get("/get_store_accounts", task(async (req, res)=>{
    // let count = await Account.countDocuments({user:null});
    let accounts;
    accounts = await Account.find({user:null, firstCharged:true, removed:false, trash:false})
    .select(["-skrillId", "-skrillPw", "-skrillCode"])
    // .select(["id", "money"])
    // .limit(config.ACCOUNT_LIST_COUNT_PER_PAGE)
    .sort({createdAt:1});

    let setting = await getSetting();

    res.json({
      status: "success",
      data: {accounts, price:setting.accountPrice}
    });
  }))

  // admin, master ????????? ?????? ????????? ???????????? api
  // ?????? ?????????, ????????? ????????? ?????????????????? ????????????.
  // []?????????]?????????????????? ????????? ??????.
  router.post("/get_accounts", authAdmin, task(async (req, res)=>{
    // if(!(req.user.authority || req.user.master)){
    //   res.json({
    //     status: "fail",
    //     message: "????????? ?????? ???????????????."
    //   })
    //   return;
    // }


    // console.log(req.body);
    let {
      ids, used, trash, firstCharged, withSkrill, searchId,
      offset, limit, curPage, email, requestedDeposit, removed
    } = req.body;

    if(removed){
      if(!req.user.master){
        res.json({
          status: "fail",
          message: "????????? ?????? ???????????????."
        })
        return;
      }
    }else{
      removed = false;
    }
    // used == undefined -> all
    // used == true -> used account
    // used == false -> no used account
    // withSkrill == true -> with skrill info
    // offset
    // limit

    let accounts;
    let query = {removed};
    if(ids){
      query._id = ids;
    }

    if(used == true){
      query.user = {$ne:null};
    }else if(used == false){
      query.user = null;
    }

    if(trash !== undefined){
      query.trash = trash
    }

    if(firstCharged !== undefined){
      query.firstCharged = firstCharged;
    }

    // if(requestedDeposit){
    //   query.depositStatus = {$in:['requested', 'outstanding']};
    // }

    let withoutSkrillField = ["-skrillId", "-skrillPw", "-skrillCode"];
    if(withSkrill){
      withoutSkrillField = [];
    }

    if(searchId){
      query.id = { $regex: '.*' + searchId + '.*' };
    }

    if(curPage !== undefined){
      // ???????????? ??????????????????, ?????? ????????? limit, offset ??????
      limit = config.ACCOUNT_LIST_COUNT_PER_PAGE;
      offset = curPage * limit;
    }else{
      // ???????????? ?????????????????????. ????????? limit, offset ??????
      // ????????? limit, offset??? ????????? ???????????????
      if(limit === undefined){
        limit = config.ACCOUNT_LIST_COUNT_PER_PAGE;
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

    // ??????????????? limit?????? ??????????????????????????? ??? count????????? ????????????.
    let count = await Account.countDocuments(query);
    let pageLength = Math.ceil(count / limit);// 0 ~
    let maxPage = pageLength - 1;
    // console.log("account count", count);
    let startPage = Math.floor(curPage / config.PAGE_COUNT) * config.PAGE_COUNT;
    let endPage = Math.min(startPage + config.PAGE_COUNT-1, maxPage);

    accounts = await Account.find(query)
    .select(withoutSkrillField)
    .sort({createdAt:-1})
    .limit(limit)
    .skip(offset)
    .populate(populateObj)
    .lean();


    if(used == true){
      accounts = accounts.filter(account=>!!account.user);
    }

    // console.log("@@@@@ count", count);
    // console.log("@@@@@ accounts", accounts);

    // let r = Account.find(query)
    // .select(withoutSkrillField)
    // .sort({createdAt:-1});
    //
    // if(limit !== undefined){
    //   r.limit(limit);
    // }
    //
    // if(offset !== undefined){
    //   r.skip(offset)
    // }
    //
    // account = await r.populate(populateObj);
    // let {countryJson} = await getSetting(["countryJson"]);

    let users = await User.find({}).select("email").lean();

    res.json({
      status: "success",
      data: {accounts, users, curPage, startPage, endPage, maxPage, count, pageCount:config.PAGE_COUNT}
    });
  }))

  router.post("/update_account/:id", authAdmin, task(async (req, res)=>{
    // console.error(req.body)
    // if(!(req.user.authority || req.user.master)){
    //   res.json({
    //     status: "fail",
    //     message: "????????? ?????? ???????????????."
    //   })
    //   return;
    // }


    let id = req.params.id;
    let data = req.body;
    delete data._id;
    // delete option._id;
    await Account.updateOne({_id:id}, data);
    let account = await Account.findOne({_id:id});
    if(account.user && data.money !== undefined){

      // console.error("@@@@!", account);
      // if(!account.startMoney){
      //   account.startMoney = account.money;
      //   await account.save();
      // }

      console.log("update account", data);
      await refreshBet365Money(account);
      await updateBet365TotalMoney(account.user, true);
    }
    // console.log("????", account);
    // let option = await Option.findOne({_id:optionData._id});
    // option.name = optionData.name;
    // option.data = optionData.data;
    // await option.save();
    res.json({
      status: "success"
    })
  }))

  router.get("/resurrection_account/:id", authMaster, task(async (req, res)=>{
    let id = req.params.id;
    let account = await Account.findOne({_id:id, removed:true});
    if(!account){
      res.json({
        status: "fail",
        message: "?????????????????? ????????? ?????? ??? ????????????."
      })
      return;
    }

    account.removed = false;
    await account.save();

    res.json({
      status: "success"
    })
  }));


  // ????????? ?????????????????? ?????? ?????????.
  router.get("/remove_account/:id", authAdmin, task(async (req, res)=>{
    let id = req.params.id;
    let account = await Account.findOne({_id:id, removed:false});//.populate('browser');

    if(!account){
      res.json({
        status: "fail",
        message: "????????? ?????? ??? ????????????."
      })
      return;
    }

    let user = account.user;

    // account.user = null;
    // account.removed = true;
    // await account.save();
    //
    // // ????????? ??????????????? ????????? ??????
    // await account.disconnectBrowser();

    if(account.browser){
      await Browser.updateOne({_id:account.browser}, {account:null});
    }
    await Account.updateOne({_id:id}, {browser:null, user:null, removed:true});

    if(user){
      await updateBet365TotalMoney(user, true);
    }

    // await account.save();


    // await Account.updateOne({_id:id}, {removed:true});
    // await Account.deleteOne({_id:id});

    res.json({
      status: "success"
    })
  }))

  // ?????? ??????
  router.get("/remove_account_user/:id", authAdmin, task(async (req, res)=>{
    let id = req.params.id;
    let account = await Account.findOne({_id:id});//.populate('browser');
    if(!account){
      res.json({
        status: "fail",
        message: "????????? ?????? ??? ????????????."
      })
      return;
    }

    let user = account.user;
    // account.user = null;
    // await account.save();
    // await account.disconnectBrowser();

    if(account.browser){
      await Browser.updateOne({_id:account.browser}, {account:null});
    }
    await Account.updateOne({_id:id}, {browser:null, user:null});

    if(user){
      await updateBet365TotalMoney(user, true);
    }
    // await Account.updateOne({_id:id}, {user:null, trash:false});

    res.json({
      status: "success"
    })
  }))


  router.get("/restore_account/:id", authAdmin, task(async (req, res)=>{
    // if(!(req.user.authority || req.user.master)){
    //   res.json({
    //     status: "fail",
    //     message: "????????? ?????? ???????????????."
    //   })
    //   return;
    // }

    let id = req.params.id;
    let account = await Account.findOne({_id:id});
    if(!account){
      res.json({
        status: "fail",
        message: "????????? ?????? ??? ????????????."
      })
      return;
    }

    account.trash = false;
    await account.save();

    if(account.user){
      await updateBet365TotalMoney(account.user, true);
    }
    // await Account.updateOne({_id:id}, {trash:false});

    res.json({
      status: "success"
    })
  }))

  router.post("/charge_account/:id", authAdmin, task(async (req, res)=>{
    // if(!(req.user.authority || req.user.master)){
    //   res.json({
    //     status: "fail",
    //     message: "????????? ?????? ???????????????."
    //   })
    //   return;
    // }

    let id = req.params.id;
    let money = req.body.money;
    // console.log(req.body, money);
    // await Account.updateOne({_id:id}, {firstCharged:true, money:money});

    let account = await Account.findOne({_id:id});
    if(!account){
      res.json({
        status: "fail",
        message: "????????? ?????? ??? ????????????."
      })
      return;
    }

    account.firstCharged = true;
    account.money = money;
    await account.save();
    await refreshBet365Money(account);
    // await updateBet365Money(account, money, true);

    // ????????? ????????? ???????????? ?????? ??????????????? ????????? ??? bet365Money??? ????????? ????????? ??????.
    // if(account.user){
    //   await updateBet365TotalMoney(account.user, true);
    // }

    res.json({
      status: "success"
    })
  }))



  // ????????? ?????????????????? ????????? ????????????,
  // Account.user??? ????????????, ????????? ????????? ?????????.
  router.get("/trash_account/:id", task(async (req, res)=>{
    let id = req.params.id;
    // ????????? ????????? ????????? ???????????????????????????.
    // await Account.updateOne({_id:id, user:req.user}, {trash:true});
    let account = await Account.findOne({_id:id, user:req.user});//.populate('browser');
    if(!account){
      res.json({
        status: "fail",
        message: "????????? ?????? ??? ????????????."
      })
      return;
    }
    // account.trash = true;
    // await account.save();
    // await account.disconnectBrowser();

    if(account.browser){
      await Browser.updateOne({_id:account.browser}, {account:null});
    }
    await Account.updateOne({_id:id}, {browser:null, trash:true});

    // ???????????? ???????????? ?????? ??????.
    await updateBet365TotalMoney(req.user, true);
    // let account = await Account.findOne({_id:id});
    // if(account){
    //   // account.user = null;
    //   account.trash = true;
    //   account.save();
    // }

    res.json({
      status: "success"
    })
  }))


  // ????????? ??????-???????????? ?????? ??????
  router.get("/account_disconnect_browser/:id", task(async (req, res)=>{
    let id = req.params.id;
    // ????????? ????????? ????????? ???????????????????????????.
    // await Account.updateOne({_id:id, user:req.user}, {trash:true});
    let account = await Account.findOne({_id:id, user:req.user});//.populate('browser');
    if(!account){
      res.json({
        status: "fail",
        message: "????????? ?????? ??? ????????????."
      })
      return;
    }

    if(account.browser){
      await Browser.updateOne({_id:account.browser}, {account:null});
    }
    await Account.updateOne({_id:id}, {browser:null});

    res.json({
      status: "success"
    })
  }))

  // ????????? ???????????? ?????? pc/??????????????? ????????? ??????. ????????????
  router.get("/account_refresh_connect_state", task(async (req, res)=>{

    let accounts = await Account.find({user:req.user, trash:false, removed:false});//.populate('browser');


    for(let i=0; i<accounts.length; i++){
      let account = accounts[i];
      if(account.browser){
        let b = await Browser.findOne({_id:account.browser}).populate("program");
        if(!b || !b.program){
          account.browser = null;
          await account.save();
          // await Account.updateOne({_id:account.}, {browser:null});
        }
      }
    }

    res.json({
      status: "success"
    })
  }))

  // ??????????????? ????????? ????????? ????????? ??????????????? ??????.
  router.post("/get_linked_accounts", task(async (req, res)=>{
    let accounts, user;
    let targetEmail = req.body.email;
    if(targetEmail){
      user = await User.findOne({email:targetEmail});
    }else{
      user = req.user;
    }
    accounts = await Account.find({
      user:user._id,
      trash:false,
      removed:false
      // ??????????????? ??????????????? ??????????????? ??????????????? ??????????????? ???????????????
      // ????????? ??????????????????. ????????? trash:false??? ????????????????????????..
      // depositStatus:{$ne:'complete'}
    })
    .select(["-skrillId", "-skrillPw", "-skrillCode"])
    // .select(["id", "died", "limited", "browser", "number", "money", "deposit"])
    .sort({id:1})
    .lean();
    //.populate('browser');

    res.json({
      status: "success",
      data: accounts
    });
  }))

  router.post("/regist_account", authAdmin, task(async (req, res)=>{
    // console.log(req.body, req.user._id);
    // if(!(req.user.authority || req.user.master)){
    //   res.json({
    //     status: "fail",
    //     message: "????????? ?????? ???????????????."
    //   })
    //   return;
    // }

    let body = req.body;
    // body.user = req.user._id;
    delete body._id;
    let temp = await Account.findOne({id:body.id});
    if(temp){
      res.json({
        status: "fail",
        message: "?????? ???????????? ???????????????."
      })
      return;
    }

    // console.log(body);

    if(!body.money){
      body.money = 0;
    }else{
      let n = Number(body.money);
      if(isNaN(n)){
        console.error('money??? ????????? ??????. 0 ?????? ??????');
        body.money = 0;
      }else{
        body.money = n;
      }
    }

    await Account.create(body);
    let account = await Account.findOne({id:body.id}).lean();

    res.json({
      status: "success",
      data: account
    });
  }))
}

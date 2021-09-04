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

  // for master
  router.post("/get_users", authMaster, task(async (req, res)=>{
    // if(!req.user.master){
    //   res.json({
    //     status: "fail",
    //     message: "권한이 없는 요청입니다."
    //   })
    //   return;
    // }

    // console.log(req.body);
    let {ids, offset, limit, curPage, email, allowed, admin, accountCounting} = req.body;

    let users;
    let query = {email, allowed};

    for(let o in query){
      if(query[o] === undefined){
        delete query[o];
      }
    }

    if(ids){
      query._id = ids;
    }

    if(admin){
      query.authority = {$ne:null};
    }

    // if(email){
    //   query.email = email;
    // }
    //
    // if(allowed !== undefined){
    //   query.allowed = allowed
    // }

    if(curPage !== undefined){
      // 페이지가 설정되었으면, 그에 맞춰서 limit, offset 계산
      limit = config.ACCOUNT_LIST_COUNT_PER_PAGE;
      offset = curPage * limit;
    }else{
      // 페이지가 설정안되었다면. 전달된 limit, offset 사용
      // 전달된 limit, offset이 없으면 기본값사용
      if(limit === undefined){
        limit = config.ACCOUNT_LIST_COUNT_PER_PAGE;
      }
      if(offset === undefined){
        offset = 0;
      }

      curPage = offset / limit;
    }

    let populateObj = {
      path: 'programs',
      model: Program,
      options: {
        select: 'name'
      },
      populate: {
        path: 'browsers',
        model: Browser,
        // options: {
        //   select: 'account option'
        // },
        populate: [
          {
            path: 'account',
            model: Account,
            options: {
              select: 'id limited died country money startMoney betCount startBetCount'
            }
          },
          {
            path: 'option',
            model: Option,
            options: {
              select: 'name'
            }
          }
        ]
      }
    };
    //
    // if(email){
    //   populateObj.match = {
    //     email: email
    //   }
    // }

    // 전체숫자는 limit되지 않은숫자여야하므로 이 count방법을 유지한다.
    let count = await User.countDocuments(query);
    let pageLength = Math.ceil(count / limit);// 0 ~
    let maxPage = pageLength - 1;
    // console.log("account count", count);
    let startPage = Math.floor(curPage / config.PAGE_COUNT) * config.PAGE_COUNT;
    let endPage = Math.min(startPage + config.PAGE_COUNT-1, maxPage);

    users = await User.find(query)
    .select(["-password"])
    .sort({createdAt:-1})
    .limit(limit)
    .skip(offset)
    .populate(populateObj)
    .lean();

    // console.log("query", query);
    // console.log("clientIp", req.clientIp);
    //console.log("???", req.header('x-forwarded-for') || req.connection.remoteAddress);

    // 보유계정 카운트
    let result = users;
    if(accountCounting){
      result = await Promise.all(users.map(async user=>{
        let count;
        try{
          count = await Account.countDocuments({user:user._id})
        }catch(e){
          console.error(e);
          count = 0;
        }
        // let _user = Object.assign({}, user._doc);
        // _user.accountCount = count;
        user.accountCount = count;
        // console.log(count);
        // return _user;
        return user;
      }));
    }

    //// 관리할때는 전체 가진 수량을 표시해야하므로 주석처리.
    // 현재 설정된 program count, browser count 로 잘라 내보냄
    // result.forEach(user=>{
    //   user.programs = user.programs.slice(0, user.programCount);
    //   user.programs.forEach(program=>{
    //     program.browsers = program.browsers.slice(0, user.browserCount);
    //   })
    // })

    res.json({
      status: "success",
      data: {users:result, curPage, startPage, endPage, maxPage, count, pageCount:config.PAGE_COUNT}
    });
  }))

  router.post("/add_money/:id", authMaster, task(async (req, res)=>{
    let id = req.params.id;
    let data = req.body;
    delete data._id;
    let {money, wallet} = data;
    // console.error({money, wallet});
    try{
      if(money !== undefined){
        // await MoneyManager.setMoney(id, money, "from master");
        if(money > 0){
          await MoneyManager.depositMoney(id, money, `from master`, req.user);
        }else if(money < 0){
          await MoneyManager.withdrawMoney(id, Math.abs(money), `from master`, req.user);
        }
      }

      if(wallet !== undefined){
        // await MoneyManager.setWallet(id, wallet, "from master");
        if(wallet > 0){
          await MoneyManager.depositWallet(id, wallet, "from master", req.user);
        }else if(wallet < 0){
          await MoneyManager.withdrawWallet(id, Math.abs(wallet), "from master", req.user);
        }
      }
    }catch(e){
      console.error(e);
      res.json({
        status: "fail",
        message: "입출금 업데이트 실패"
      });
      return
    }

    res.json({
      status: "success"

    });
  }))

  router.post("/update_money/:id", authMaster, task(async (req, res)=>{
    let id = req.params.id;
    let data = req.body;
    delete data._id;
    let {money, wallet} = data;
    // console.error({money, wallet});
    try{
      if(money !== undefined){
        await MoneyManager.setMoney(id, money, "from master", req.user);
        // if(money > 0){
        //   await MoneyManager.setMoney(id, money, "from master");
        // }else if(money < 0){
        //   await MoneyManager.withdrawMoney(id, Math.abs(money), "from master");
        // }
      }

      if(wallet !== undefined){
        await MoneyManager.setWallet(id, wallet, "from master", req.user);
        // if(wallet > 0){
        //   await MoneyManager.depositWallet(id, wallet, "from master");
        // }else if(wallet < 0){
        //   await MoneyManager.withdrawWallet(id, Math.abs(wallet), "from master");
        // }
      }
    }catch(e){
      console.error(e);
      res.json({
        status: "fail",
        message: "입출금 업데이트 실패"
      });
      return
    }

    res.json({
      status: "success"
    });
  }))

  router.post("/update_user/:id", authMaster, task(async (req, res)=>{
    // console.error(req.body)
    // if(!req.user.master){
    //   res.json({
    //     status: "fail",
    //     message: "권한이 없는 요청입니다."
    //   })
    //   return;
    // }

    // console.error(req.body);
    let id = req.params.id;
    let user = req.body;
    delete user._id;

    delete user.money;
    delete user.wallet;
    delete user.bet365Money;

    await User.updateOne({_id:id}, user);
    res.json({
      status: "success"
    })
  }))

  router.get("/remove_user/:id", authMaster, task(async (req, res)=>{
    // console.error(req.body)
    // if(!req.user.master){
    //   res.json({
    //     status: "fail",
    //     message: "권한이 없는 요청입니다."
    //   })
    //   return;
    // }

    let id = req.params.id;
    await User.deleteOne({_id:id});

    res.json({
      status: "success"
    })
  }))

  router.get("/get_user_email_list", authAdmin, task(async (req, res)=>{
    let users = await User.find({email:{$ne:null}}).select("email").lean();
    res.json({
      status: "success",
      data: users
    })
  }))

  router.post("/get_user", task(async (req, res)=>{
    let user;
    let email;
    if(req.body.email){
      if(!req.session.admin){
        res.json({
          status: "fail",
          message: "다른 계정정보 요청은 관리자권한이 필요합니다."
        })
        return;
      }
      email = req.body.email;
      // users = await User.find({}).select("email").lean();
    }else{
      email = req.user.email;
    }

    // console.log(11111);
    user = await User.findOne({email:email})
    // .select(["email", "money", "programs", "programCount", "browserCount"])
    .select(["-password"])
    .populate({
      path: 'programs',
      model: Program,
      options: {
        select: 'name user'
      },
      populate: {
        path: 'browsers',
        model: Browser,
        // options: {
        //   select: 'account option'
        //   // select: 'account option logs'
        // },
        populate: [
          {
            path: 'account',
            model: Account,
            options: {
              // select: 'id money country'
              select: "id pw limited died country money startMoney betCount startBetCount"
            }
          },
          {
            path: 'option',
            model: Option,
            options: {
              select: 'name permission'
            }
          },
          {
            path: 'proxy',
            model: Proxy,
          }
          // ,
          // {
          //   path: 'logs',
          //   model: Log,
          //   options: {
          //     select: 'bet365Id data createdAt'
          //   }
          // }
        ]
      }
    }).lean();
    // .deepPopulate(['programs.browsers.logs']);

    // 현재 설정된 program count, browser count 로 잘라 내보냄
    user.programs = user.programs.slice(0, user.programCount);
    await Promise.all(user.programs.map(async program=>{
      program.browsers = program.browsers.slice(0, user.browserCount);
      // for(let i=0; i<program.browsers.length; i++){
      //   let browser = program.browsers[i];
      //   browser.logs = await Log.find({browser:browser._id});
      // }
    }))


    //log가 많더라도 MAX_LOG_LENGTH를 줄여주면 컷하자
    // user.programs.forEach(p=>{
    //   p.browsers.forEach(b=>{
    //     if(b.logs.length >= config.MAX_LOG_LENGTH){
    //       // browser.logs.shift();
    //       b.logs = b.logs.slice(-config.MAX_LOG_LENGTH);
    //       b.save();
    //     }
    //   })
    // })



    res.json({
      status: "success",
      data: user
    });
  }))
}

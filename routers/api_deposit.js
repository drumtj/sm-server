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

  router.post("/get_deposit_history", task(async (req, res)=>{
    let {
      offset, limit, curPage, deposit
    } = req.body;
    let query = {level:0, user:req.user._id};

    for(let o in query){
      if(query[o] === undefined){
        delete query[o];
      }
    }

    if(deposit){
      query.type = "deposit";
    }else{
      query.type = "withdraw";
    }

    // if(ids){
    //   query._id = ids;
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

    let populateObjList = [
      {
        path: 'user',
        model: User,
        options: {
          select: '-password'
        }
      },
      {
        path: "account",
        model: Account
      },
      {
        path: 'child',
        model: Approval
      }
    ]

    // 전체숫자는 limit되지 않은숫자여야하므로 이 count방법을 유지한다.
    let count = await Approval.countDocuments(query);
    let pageLength = Math.ceil(count / limit);// 0 ~
    let maxPage = pageLength - 1;
    // console.log("account count", count);
    let startPage = Math.floor(curPage / config.PAGE_COUNT) * config.PAGE_COUNT;
    let endPage = Math.min(startPage + config.PAGE_COUNT-1, maxPage);

    let list = await Approval.find(query)
    // .select(["-password"])
    .sort({createdAt:-1})
    .limit(limit)
    .skip(offset)
    .populate(populateObjList)
    .lean();

    // console.log("????", query, list);

    res.json({
      status: "success",
      data: {list, curPage, startPage, endPage, maxPage, count, pageCount:config.PAGE_COUNT}
    });
  }))


  async function accountWithdrawProcess(aid, uid, withdrawMoney){
    let account = await Account.findOne({_id:aid})
    let setting = await getSetting();
    let commission;
    if(setting.accountWithdrawCommission){
      commission = setting.accountWithdrawCommission / 100;
    }else{
      commission = 0;
    }
    let cp = (1-commission);
    let money = withdrawMoney * cp;

    // console.log("???", aid, money, uid);
    await MoneyManager.depositWallet(account.user, money, `from bet365 withdraw(apply commission ${util.round(cp*100)}%)`, uid);

    await AccountWithdraw.create({
      user: uid,
      account: aid,
      withdraw: withdrawMoney,
      commission: commission
    })

    emitToAdmin('menuBadge', {
      link: '/admin/accountWithdrawManager',
      text: 'New'
    });

    emitToAdmin('sound', {
      name: "recReqWithdraw",
      to: "admin"
    });

    emitToAdmin('refreshTab', {
      link: "/admin/accountWithdrawManager"
    });
  }

  // 수동 출금기록하기
  router.post("/request_withdraw_account_force/:id", authMaster, task(async (req, res)=>{
    let id = req.params.id;
    let withdrawMoney = req.body.money;
    await accountWithdrawProcess(id, req.user._id, withdrawMoney);
    res.json({
      status: "success"
    })
  }))

  // 유저의 벳삼 출금요청
  router.post("/request_withdraw_account/:id", task(async (req, res)=>{
    let id = req.params.id;
    let withdrawMoney = req.body.money;
    let account = await Account.findOne({_id:id})
    // .populate({
    //   path: 'browser',
    //   model: Browser,
    //   select: "-logs"
    // })
    .lean();

    if(!account){
      res.json({
        status: "fail",
        message: "계정을 찾을 수 없습니다."
      })
      return;
    }

    // if(account.depositStatus == 'requested' || account.depositStatus == 'outstanding'){
    //   res.json({
    //     status: "fail",
    //     message: "이미 출금요청 됐습니다."
    //   })
    //   return;
    // }

    // 출금이 완료되어 휴지통에 들어간 계정이, 휴지통에서 복구되는 상황이있음.
    // 휴지통에서 복구된다고 출금완료 이력을 제거하지는 않으므로 아래는 주석
    // 즉, 출금완료상태더라도 재출금신청이 가능하게 하가위해 아래를 주석.
    // if(account.depositStatus == 'complete'){
    //   res.json({
    //     status: "fail",
    //     message: "이미 출금 처리가 완료됐습니다."
    //   })
    //   return;
    // }

    // if(account.money < withdrawMoney){
    //   res.json({
    //     status: "fail",
    //     message: "요청금액이 잔액보다 큽니다."
    //   })
    //   return;
    // }
    //
    // if(withdrawMoney < 10){
    //   res.json({
    //     status: "fail",
    //     message: "요청금액이 너무 작습니다. 출금요청시 필요한 최소금액은 $10입니다."
    //   })
    //   return;
    // }

    // let pid, bid;
    // if(account.browser){
    //   pid = account.browser.program._id;
    //   bid = account.browser._id;
    // }

    // await account.requestDeposit(req.user);

    // await Withdraw.create({
    //   id: account.id,
    //   type: "bookmaker",
    //   status: "requested",
    //   money: withdrawMoney
    // });

    await accountWithdrawProcess(id, req.user._id, withdrawMoney);
    // let setting = await getSetting();
    // let commission;
    // if(setting.accountWithdrawCommission){
    //   commission = setting.accountWithdrawCommission / 100;
    // }else{
    //   commission = 0;
    // }
    // let cp = (1-commission);
    // let money = withdrawMoney * cp;
    //
    // await MoneyManager.depositWallet(account.user, money, `from bet365 withdraw(apply commission ${util.round(cp*100)}%)`, req.user);
    //
    // await AccountWithdraw.create({
    //   user: req.user,
    //   account: account,
    //   withdraw: withdrawMoney,
    //   commission: commission
    // })
    //
    // emitToAdmin('menuBadge', {
    //   link: '/admin/accountWithdrawManager',
    //   text: 'New'
    // });
    //
    // emitToAdmin('sound', {
    //   name: "recReqWithdraw",
    //   to: "admin"
    // });
    //
    // emitToAdmin('refreshTab', {
    //   link: "/admin/accountWithdrawManager"
    // });

    res.json({
      status: "success"
      // ,data: {pid, bid}
    })
  }))




  // 출금 승인요청한것을 취소.
  router.post("/cancel_deposit_account/:id", authAdmin, task(async (req, res)=>{
    let id = req.params.id;
    let account = await Account.findOne({_id:id, depositStatus:'outstanding'})
    .populate({
      path: 'depositApproval',
      model: Approval
    });
    if(!account){
      res.json({
        status: "fail",
        message: "승인 요청중이 아닙니다."
      })
      return;
    }

    if(account.depositApproval){
      await account.depositApproval.cancel();
      // await account.depositApproval.remove();
      // account.depositApproval = null;
    }

    await account.rejectDeposit();
    // account.depositStatus = 'requested';
    // await account.save();

    emitToAdmin('refreshTab', {
      link: ["/admin/accountManager", "/admin/approvalManager"]
    });

    emitToMember(account.user.email, 'refreshTab', {
      link: ["/accountManager", "/depositHistory"]
    });

    res.json({
      status: "success",
      depositStatus: account.depositStatus
    })
  }))

  // 출금요청 반려
  router.post("/reject_request_deposit_account/:id", authAdmin, task(async (req, res)=>{
    let id = req.params.id;
    let account = await Account.findOne({_id:id, depositStatus:'requested'})
    .populate([
      {
        path: "depositApproval",
        model: Approval
      },
      {
        path: "user",
        model: User,
        options:{
          select: "email authority master"
        }
      }
    ])
    if(!account){
      res.json({
        status: "fail",
        message: "출금 요청중이 아닙니다."
      })
      return;
    }

    if(account.depositApproval){
      await account.depositApproval.reject();
    }
    await account.rejectRequestDeposit();

    // account.depositStatus = null;
    // await account.save();


    // 모든 admin에게
    emitToAdmin('refreshTab', {
      link: ["/admin/accountManager"]
    });

    emitToMember(account.user.email, 'refreshTab', {
      link: ["/accountManager", "/depositHistory"]
    });


    res.json({
      status: "success",
      depositStatus: account.depositStatus
    })
  }))





  // 관리자의 벳삼 출금완료, 마스터 승인요청
  router.post("/deposit_account/:id", authAdmin, task(async (req, res)=>{
    // if(!(req.user.authority || req.user.master)){
    //   res.json({
    //     status: "fail",
    //     message: "권한이 없는 요청입니다."
    //   })
    //   return;
    // }

    let money = req.body.money;
    // 요청자가 마스터권한이면 바로 완료.
    let status = req.user.master ? 'complete' : 'outstanding';
    let id = req.params.id;
    let account = await Account.findOne({_id:id}).populate([
      {
        path: "user",
        model: User,
        options: {
          select: "email authority master"
        }
      },
      {
        path: "depositApproval",
        model: Approval,
      }
    ]);

    if(!account){
      res.json({
        status: "fail",
        message: `${id}는 찾을 수 없는 계정입니다.`
      })
      return;
    }

    if(account.depositStatus == 'complete'){
      res.json({
        status: "fail",
        message: `이미 출금 승인이 완료됐습니다.`
      })
      return;
    }

    if(account.depositStatus == null){
      res.json({
        status: "fail",
        message: `출금요청이 반려된 건입니다.`
      })
      return;
    }

    if(account.money < money){
      res.json({
        status: "fail",
        message: `잔액보다 큰 금액이 입력됐습니다.`
      })
      return;
    }

    // let updateData = {
    //   depositStatus: status,
    //   depositMoney: money
    // }

    if(status == "complete"){
      // console.log("@@@@@@@@@@");
      // User의 bet365 money수치를 언제 갱신할것인지가 관건,,
      // 아니면 bet365 money값은 항상 조회/합산해서 쓰던지..
      // await deposit(account);
      await account.requestApprovalDeposit(money, req.user);
      await account.depositApproval.child.approval(approvalTask);
      emitToMember(account.user.email, 'refreshTab', {
        link: ["/accountManager", "/depositHistory"]
      });
    }else{
      // 관리자가 마스터에게 승인요청.
      // 이것은 일반유저에게 refersh나 badge 표시할 필요가 없다.

      await account.requestApprovalDeposit(money, req.user);

      emitToMaster('menuBadge', {
        link: '/admin/approvalManager',
        text: 'New'
      });

      emitToMaster('sound', {
        name: "recReqOkApproval",
        to: "master"
      });
    }

    emitToAdmin('refreshTab', {
      link: ["/admin/accountManager", "/admin/approvalManager"]
    });

    res.json({
      status: "success",
      depositStatus: status
    })
  }))
}

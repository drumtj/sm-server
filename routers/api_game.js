module.exports = MD=>{
  let {
    getEventKeyNames,
    getEventKeys,
    getEventKey,
    isLockEvent,
    lockEvent,
    unlockEvent,
    setGameData,
    pullGameData,
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
    EventMember,
    Team,
    League,
    Game,
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
    uuidv4,
    sendMail,
    sendMailOpentalk
  } = MD;



  let bdhMap = {'<':'$lt', '<=':'$lte', '>':'$gt', '>=':'$gte', '==':'$eq', '!=':'$not'};

  router.get("/remove_game/:id", authAdmin, task(async (req, res)=>{
    let _id = req.params.id;
    console.log("remove game", _id);
    await Game.deleteOne({_id});

    res.json({
      status: "success"
    });
  }))

  router.post("/get_game_list", task(async (req, res)=>{
    let {
      ids, offset, limit, curPage, sports,
      range
    } = req.body;
    // let query = {user:req.user._id, event:{$ne:null}, sportName};
    let query = {};

    let $and = [];

    if(sports){
      $and.push({sports});
    }

    if(typeof curPage !== "number"){
      curPage = 0;
    }

    let limitCount = 1000;

    if(curPage !== undefined){
      // 페이지가 설정되었으면, 그에 맞춰서 limit, offset 계산
      limit = limitCount;//config.ACCOUNT_LIST_COUNT_PER_PAGE;
      offset = curPage * limit;
    }else{
      // 페이지가 설정안되었다면. 전달된 limit, offset 사용
      // 전달된 limit, offset이 없으면 기본값사용
      if(limit === undefined){
        limit = limitCount;//config.ACCOUNT_LIST_COUNT_PER_PAGE;
      }
      if(offset === undefined){
        offset = 0;
      }

      curPage = offset / limit;
    }

    let populateObjList = [
      {
        path: 'league',
        model: League
      },
      {
        path: 'home',
        model: Team
      },
      {
        path: 'away',
        model: Team
      }
    ]

    if(range){
      $and.push({date: {
        $gte: new Date(range.start),
        $lte: new Date(range.end)
      }})
    }

    query = {$and};

    console.log("query", query, {offset, limit});
    // console.log({curPage});

    // 전체숫자는 limit되지 않은숫자여야하므로 이 count방법을 유지한다.
    let count = await Game.countDocuments(query);
    let pageLength = Math.ceil(count / limit);// 0 ~
    let maxPage = pageLength - 1;
    // console.log("account count", count);
    let startPage = Math.floor(curPage / config.PAGE_COUNT) * config.PAGE_COUNT;
    let endPage = Math.min(startPage + config.PAGE_COUNT-1, maxPage);

    let list = await Game.find(query)
    // .select(["-password"])
    .sort({date:1})
    .limit(limit)
    .skip(offset)
    .populate(populateObjList)
    .lean();

    // console.log("list", list);

    res.json({
      status: "success",
      data: {games:list, curPage, startPage, endPage, maxPage, count, pageCount:config.PAGE_COUNT}
    });
  }))
}

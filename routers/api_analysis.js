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

  let groupMap = {
    day: {$dateToString:{ format: "%Y-%m-%d", date: "$createdAt", timezone:'Asia/Seoul'}},
    week: {$week: "$createdAt"},
    month: {$dateToString:{ format: "%Y-%m", date: "$createdAt", timezone:'Asia/Seoul'}},
    year: {$dateToString:{ format: "%Y", date: "$createdAt", timezone:'Asia/Seoul'}}
  }

  let bdhMap = {'<':'$lt', '<=':'$lte', '>':'$gt', '>=':'$gte', '==':'$eq', '!=':'$not'};

  async function generateGraphData(query, graphType, period){
    /// test
    // query.$and.push({$or:[
    //   {$ne:[
    //     {account:"60a890e9c28d1348e22a3d83"},
    //     {account:"60a89038c28d1348e22a3d80"}
    //   ]}
    // ]})

    if(graphType == "line"){
      let mainChart = await BetData.aggregate()
      .match(query)
      .group({
        _id: {
          label: groupMap[period]
        },
        // siteProfit: {$sum: {
        //   $cond: [
        //     {$eq: ["$betStatus", "LOSE"]},
        //     "$siteStake",
        //     {$cond:[
        //       {$eq:["$betStatus", "WON"]},
        //       {$subtract:[0, {$multiply: ["$siteStake", {$subtract:["$siteOdds",1]}]} ]},
        //       0
        //     ]}
        //   ]
        // }},
        bookmakerStake: {$sum: {
          $cond: [
            {$or:[
              {$eq: ["$betStatus", "LOSE"]},
              {$eq: ["$betStatus", "WON"]}
            ]},
            "$bookmakerStake",
            0
          ]
        }},
        bookmakerProfit: {$sum: {
          $cond: [
            {$eq: ["$betStatus", "LOSE"]},
            {$multiply: ["$bookmakerStake", {$subtract:["$bookmakerOdds",1]}]},
            {$cond:[
              {$eq:["$betStatus", "WON"]},
              {$subtract:[0,"$bookmakerStake"]},
              0
            ]}
          ]
        }}
      })
      .sort({_id:1});

      // let t1 = await BetData.aggregate()
      // .match(query)
      // .group({
      //   _id:{
      //     label: groupMap[period],
      //     account: "$account"
      //   },
      //   betCount: {$sum: {
      //     $cond: [
      //       {$or:[
      //         {$eq: ["$betStatus", "LOSE"]},
      //         {$eq:["$betStatus", "WON"]}
      //       ]},
      //       1,
      //       0
      //     ]
      //   }},
      //   bookmakerProfit: {$sum: {
      //     $cond: [
      //       {$eq: ["$betStatus", "LOSE"]},
      //       {$multiply: ["$bookmakerStake", {$subtract:["$bookmakerOdds",1]}]},
      //       {$cond:[
      //         {$eq:["$betStatus", "WON"]},
      //         {$subtract:[0,"$bookmakerStake"]},
      //         0
      //       ]}
      //     ]
      //   }}
      //   // bookmakerMaxProfit: {$max:["$bookmakerProfit"]}
      //   // bookmakerProfitP: {$divide: ["$bookmakerProfit", 400]}
      // })
      //
      //
      //
      // let t2 = await BetData.aggregate()
      // .match(query)
      // .group({
      //   _id:{
      //     label: groupMap[period],
      //     account: "$account"
      //   },
      //   betCount: {$sum: {
      //     $cond: [
      //       {$or:[
      //         {$eq: ["$betStatus", "LOSE"]},
      //         {$eq:["$betStatus", "WON"]}
      //       ]},
      //       1,
      //       0
      //     ]
      //   }},
      //   bookmakerProfit: {$sum: {
      //     $cond: [
      //       {$eq: ["$betStatus", "LOSE"]},
      //       {$multiply: ["$bookmakerStake", {$subtract:["$bookmakerOdds",1]}]},
      //       {$cond:[
      //         {$eq:["$betStatus", "WON"]},
      //         {$subtract:[0,"$bookmakerStake"]},
      //         0
      //       ]}
      //     ]
      //   }}
      //   // bookmakerMaxProfit: {$max:["$bookmakerProfit"]}
      //   // bookmakerProfitP: {$divide: ["$bookmakerProfit", 400]}
      // })
      // .group({
      //   _id: {label: "$_id.label"},
      //   bookmakerAvgProfit: {$avg:{
      //     $cond:[
      //       {$gte:["$betCount", 10]},
      //       "$bookmakerProfit",
      //       0
      //     ]
      //   }}
      //   // bookmakerAvgProfit: {$avg:"$bookmakerProfit"}
      // })


      let profitFlowChart = await BetData.aggregate()
      .match(query)
      .group({
        _id:{
          label: groupMap[period],
          account: "$account"
        },
        betCount: {$sum: {
          $cond: [
            {$or:[
              {$eq: ["$betStatus", "LOSE"]},
              {$eq:["$betStatus", "WON"]}
            ]},
            1,
            0
          ]
        }},
        bookmakerProfit: {$sum: {
          $cond: [
            {$eq: ["$betStatus", "LOSE"]},
            {$multiply: ["$bookmakerStake", {$subtract:["$bookmakerOdds",1]}]},
            {$cond:[
              {$eq:["$betStatus", "WON"]},
              {$subtract:[0,"$bookmakerStake"]},
              0
            ]}
          ]
        }}
        // bookmakerMaxProfit: {$max:["$bookmakerProfit"]}
        // bookmakerProfitP: {$divide: ["$bookmakerProfit", 400]}
      })
      .group({
        _id: {label: "$_id.label"},
        bookmakerAvgProfit: {$avg:{
          $cond:[
            {$gte:["$betCount", 10]},
            "$bookmakerProfit",
            0
          ]
        }}
        // bookmakerAvgProfit: {$avg:"$bookmakerProfit"}
      })
      .project({
        // bookmakerProfitP: {$divide:["$bookmakerAvgProfit", 400]}
        // bookmakerAvgProfit: 1,
        bookmakerAvgProfitP: {$multiply:[{$divide:["$bookmakerAvgProfit", 400]},100]}
      })
      .sort({_id:1});



      let sportsChart = await BetData.aggregate()
      .match(query)
      .group({
        _id: {
          label: groupMap[period],
          key: "$sportName"
        },
        bookmakerProfit: {$sum: {
          $cond: [
            {$eq: ["$betStatus", "LOSE"]},
            {$multiply: ["$bookmakerStake", {$subtract:["$bookmakerOdds",1]}]},
            {$cond:[
              {$eq:["$betStatus", "WON"]},
              {$subtract:[0,"$bookmakerStake"]},
              0
            ]}
          ]
        }}
      })
      .sort({_id:1});

      let betTypeChart = await BetData.aggregate()
      .match(query)
      .match({betType:{$ne:null}})
      .group({
        _id: {
          label: groupMap[period],
          key: "$betType"
        },
        bookmakerProfit: {$sum: {
          $cond: [
            {$eq: ["$betStatus", "LOSE"]},
            {$multiply: ["$bookmakerStake", {$subtract:["$bookmakerOdds",1]}]},
            {$cond:[
              {$eq:["$betStatus", "WON"]},
              {$subtract:[0,"$bookmakerStake"]},
              0
            ]}
          ]
        }}
      })
      .sort({_id:1});

      let oddsChart = await BetData.aggregate()
      .match(query)
      .group({
        _id: {
          label: groupMap[period],
          key: {$floor:"$bookmakerOdds"}
        },
        bookmakerProfit: {$sum: {
          $cond: [
            {$eq: ["$betStatus", "LOSE"]},
            {$multiply: ["$bookmakerStake", {$subtract:["$bookmakerOdds",1]}]},
            {$cond:[
              {$eq:["$betStatus", "WON"]},
              {$subtract:[0,"$bookmakerStake"]},
              0
            ]}
          ]
        }}
      })
      .sort({_id:1});

      // console.log("===t1", t1);
      // console.log("===t2", t2);
      // console.log("===t3", profitFlowChart);

      return {mainChart, sportsChart, betTypeChart, profitFlowChart, oddsChart};
    }else if(graphType == "radar"){
      let sportsRadarChart = await BetData.aggregate()
      .match(query)
      .group({
        _id: "$sportName",
        bookmakerProfit: {$sum: {
          $cond: [
            {$eq: ["$betStatus", "LOSE"]},
            {$multiply: ["$bookmakerStake", {$subtract:["$bookmakerOdds",1]}]},
            {$cond:[
              {$eq:["$betStatus", "WON"]},
              {$subtract:[0,"$bookmakerStake"]},
              0
            ]}
          ]
        }}
      })
      .sort({_id:1});

      return {sportsRadarChart}
    }

    return {};
  }

  router.post("/get_analysis", authAdmin, task(async (req, res)=>{
    let {
      sports, period, users, graphType,
      emails, range, betTypes, odds1, oddsCon1, odds2, oddsCon2
    } = req.body;
    // let query = {user:req.user._id, event:{$ne:null}, sportName};
    let query = {};

    let $and = [
      {event:{$ne:null}}
    ];

    if(sports && sports.length){
      $and.push({sportName:{$in:sports}});
    }

    if(oddsCon1 && odds1){
      let q = {};
      q[bdhMap[oddsCon1]] = odds1;
      $and.push({bookmakerOdds:q});
    }

    if(oddsCon2 && odds2){
      let q = {};
      q[bdhMap[oddsCon2]] = odds2;
      $and.push({bookmakerOdds:q});
    }

    if(betTypes && betTypes.length){
      $and.push({betType:{$in:betTypes}});
    }

    if(users && users.length){
      $and.push({email:{$in:users}});
    }

    if(range){
      // query.createdAt= {
      //   $gte: new Date(range.start),
      //   $lte: new Date(range.end)
      // }
      $and.push({createdAt: {
        $gte: new Date(range.start),
        $lte: new Date(range.end)
      }})
    }



    // let gm = JSON.parse(JSON.stringify(groupMap[period]));
    // _id = {};
    // if(sports && sports.length){
    //   _id['sports'] = '$sportName';
    // }
    // _id['label'] = groupMap[period];
    // if(period){
    //   period
    // }

    query = {$and};

    console.log("query", query);


    let result = await generateGraphData(query, graphType, period);

    // let result = resultObj[0] ? resultObj[0].result : {};
    // result.totalMoney = totalMoney;
    // console.log("aggregate result", mainData);

    res.json({
      status: "success",
      data: {result, period, graphType}
    });
  }))
}

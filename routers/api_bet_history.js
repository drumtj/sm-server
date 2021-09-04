module.exports = MD=>{
  let {
    io,
    mongoose,
    sendDataToMain,
    sendDataToBg,
    sendDataToBet365,
    emitToMember,
    emitToAdmin,
    emitToProgram,
    config,
    comma,
    router,
    User,
    Program,
    Browser,
    Log,
    Account,
    Option,
    Approval,
    Event,
    BetData,
    authAdmin,
    authMaster,
    task,
    deposit,
    approvalTask,
    refreshMoney,
    calc,
    MoneyManager
  } = MD;

  // 배팅내역에서 배당, 상태 수정
  router.post("/update_betdata", authMaster, task(async (req, res)=>{
    let {
      editTarget, siteOdds, bookmakerOdds, betStatus, betId, _id
    } = req.body;


    //개별수정
    let betDatas;
    if(editTarget == 1){
      betDatas = await BetData.find({_id});//, betStatus:{$ne:"ACCEPTED"}});
    }else if(editTarget == 2){
      if(!betId){
        res.json({
          status: "fail",
          message: "betId가 없는 배팅기록은 전체수정 될 수 없습니다."
        });
        return;
      }
      betDatas = await BetData.find({betId});//, betStatus:{$ne:"ACCEPTED"}});
    }

    if(betDatas){
      // 입금됐던 항목 반환
      for(let i=0; i<betDatas.length; i++){
        let betData = betDatas[i];
        await betData.refundProcess(MoneyManager);

        // 배팅수정내용 적용
        betData.betStatus = betStatus;
        betData.siteOdds = siteOdds;
        betData.bookmakerOdds = bookmakerOdds;
        await betData.save();

        betData = await BetData.findOne({_id:betData._id});

        // 입/출금 처리
        await betData.resultProcess(MoneyManager);
      }
    }

    res.json({
      status: "success"
    });
  }))

  let bdhMap = {'<':'$lt', '<=':'$lte', '>':'$gt', '>=':'$gte', '==':'$eq', '!=':'$not'};
  router.post("/get_bets", task(async (req, res)=>{
    let {
      ids, offset, limit, curPage, sportName, accountId, admin,
      email, status, range, betId, eventName, betType, odds1, oddsCon1, odds2, oddsCon2
    } = req.body;
    // let query = {user:req.user._id, event:{$ne:null}, sportName};
    let query = {};

    let $and = [
      {event:{$ne:null}}
    ];

    if(sportName){
      $and.push({sportName});
    }

    let user;
    if(admin){
      delete query.user;
      if(email){
        user = await User.findOne({email}).select(["_id", "money"]).lean();
        if(user){
          // query.user = user._id;
          $and.push({user:user._id});
        }else{
          // query.user = null;
          $and.push({user:null});
        }
      }
    }else{
      $and.push({user:req.user._id});
    }

    // for(let o in query){
    //   if(query[o] === undefined){
    //     delete query[o];
    //   }
    // }

    if(ids){
      // query._id = ids;
      $and.push({_id:{$in:ids}});
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

    if(status){
      // query.betStatus = status;
      $and.push({betStatus:status});
    }

    if(betType){
      // query.betType = betType;
      $and.push({betType:betType});
    }

    if(accountId){
      let account = await Account.findOne({id:accountId});
      if(account){
        // query.account = account._id;
        $and.push({account:account._id});
      }else{
        // query.account = null;
        $and.push({account:null});
      }
    }

    let limitCount = 50;

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
        path: 'account',
        model: Account,
        options: {
          select: '-pw -skrillId -skrillPw -skrillCode'
        }
      },
      {
        path: 'user',
        model: User,
        select: '-password'
      }
    ]
    let eventPopulateObj = {
      path: 'event',
      model: Event
    }



    populateObjList.push(eventPopulateObj);
    //
    // console.error("?", sports);
    // if(sportName){
    //   eventPopulateObj.match = {
    //     sportName: sports
    //   }
    // }

    // console.error("range", range);

    // if(eventName){
      // 특문을 완전히 처리할게 아니라면 아래는 쓰면 안된다.
      // query.eventName = {$regex: '.*' + eventName + '.*'};
    // }
    if(betId){
      // query.betId = betId;
      $and.push({betId});
    }

    if(eventName){
      // query.eventName = eventName;
      $and.push({eventName});
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

    query = {$and};

    console.log("query", query, {offset, limit});

    // 전체숫자는 limit되지 않은숫자여야하므로 이 count방법을 유지한다.
    let count = await BetData.countDocuments(query);
    let pageLength = Math.ceil(count / limit);// 0 ~
    let maxPage = pageLength - 1;
    // console.log("account count", count);
    let startPage = Math.floor(curPage / config.PAGE_COUNT) * config.PAGE_COUNT;
    let endPage = Math.min(startPage + config.PAGE_COUNT-1, maxPage);

    let list = await BetData.find(query)
    // .select(["-password"])
    .sort({createdAt:-1})
    .limit(limit)
    .skip(offset)
    .populate(populateObjList)
    .lean();

    // 이런식으로 하면 aggregate 합산에는 반영안됨
    // if(betType){
    //   list = list.filter(bd=>bd.event.betType==betType);
    // }
    // list = list.slice(offset*limit, offset*limit+limit);

    let totalMoney = 0;
    // list.reduce((r,v)=>r+v.user.money, 0);
    // let users = await BetData.aggregate()
    // .match(query)
    // .group({
    //   _id: '$user'
    // })

    let accounts, users;
    if(admin){
      if(user){
        totalMoney = user.money;
      }else{
        let u = await User.aggregate()
        .group({
          _id: 'null',
          totalMoney:{$sum:"$money"}
        })

        if(u[0]){
          totalMoney = u[0].totalMoney;
        }
      }
      users = await User.find({}).select("email").lean();
    }else{
      accounts = await Account.find({user:req.user._id}).select("id").lean();
    }


    let resultObj;


    resultObj = await BetData.aggregate()
    .match(query)
    .group({
      _id: 'null',
      // bookmakerStake: {$sum: {
      //   $cond: [
      //     {$or:[
      //       {$eq: ["$betStatus", "LOSE"]},
      //       {$eq: ["$betStatus", "WON"]}
      //     ]},
      //     "$bookmakerStake",
      //     0
      //   ]
      // }},
      // bookmakerProfit: {$sum: {
      //   $cond: [
      //     {$eq: ["$betStatus", "LOSE"]},
      //     {$multiply: ["$bookmakerStake", {$subtract:["$bookmakerOdds",1]}]},
      //     {$cond:[
      //       {$eq:["$betStatus", "WON"]},
      //       {$subtract:[0,"$bookmakerStake"]},
      //       0
      //     ]}
      //   ]
      // }},
      result: {
        $accumulator: {
          init: function(){
            return {notYetBetSumBookmaker:0, notYetBetSum:0, betSum:0, returnSum:0, resultSum:0, profit:0, notYetprofit:0};
          },
          accumulate: function(state, siteOdds, siteStake, bookmakerStake, betStatus){
            state.betSum += siteStake;
            let rt = 0;
            if(betStatus == "WON"){
              rt = siteOdds * siteStake;
            }else if(betStatus == "REFUNDED" || betStatus == "CANCELLED"){
              rt = siteStake;
            }
            if(betStatus == "ACCEPTED"){
              state.notYetprofit += siteOdds * siteStake - (siteStake + bookmakerStake);
              state.notYetBetSum += siteStake;
              state.notYetBetSumBookmaker += bookmakerStake;
            }else if(betStatus == "WON" || betStatus == "LOSE"){
              state.profit += siteOdds * siteStake - (siteStake + bookmakerStake);
            }
            state.returnSum += rt;
            state.resultSum += siteStake - rt;
            return state;
          },
          accumulateArgs: ["$siteOdds", "$siteStake", "$bookmakerStake", "$betStatus"],
          merge: function(state1, state2){
            return {
              betSum: state1.betSum + state2.betSum,
              notYetBetSum: state1.notYetBetSum + state2.notYetBetSum,
              notYetBetSumBookmaker: state1.notYetBetSumBookmaker + state2.notYetBetSumBookmaker,
              returnSum: state1.returnSum + state2.returnSum,
              resultSum: state1.resultSum + state2.resultSum,
              profit: state1.profit + state2.profit,
              notYetprofit: state1.notYetprofit + state2.notYetprofit
            }
          },
          finalize: function(state) {
            return state;
          },
          lang: "js"
        }
      }
    })

    let result;// = resultObj[0] ? resultObj[0].result : {};
    if(resultObj[0]){
      result = resultObj[0].result;

      // result.bookmakerStake = resultObj[0].bookmakerStake;
      // result.bookmakerProfit = resultObj[0].bookmakerProfit;

    }else{
      result = {};
    }
    result.totalMoney = totalMoney;
    console.log("aggregate result", result);

    res.json({
      status: "success",
      data: {list, result, accounts, users, curPage, startPage, endPage, maxPage, count, pageCount:config.PAGE_COUNT}
    });
  }))
}

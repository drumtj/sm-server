const router = require("express").Router();
const redis = require('redis');
const redisClient = redis.createClient();
const subdomain = require('express-subdomain');

const {promisify} = require('util');
const setRedis = promisify(redisClient.set).bind(redisClient);
const getRedis = promisify(redisClient.get).bind(redisClient);




// const session = require("express-session");
const mongoose = require("mongoose");
const User = require('../models/User');
const Program = require('../models/Program');
const Browser = require('../models/Browser');
const Log = require('../models/Log');
const Account = require('../models/Account');
const Option = require('../models/Option');
const Approval = require('../models/Approval');
const Setting = require('../models/Setting');
const BetData = require('../models/BetData');
const Event = require('../models/Event');
const DepositLog = require('../models/DepositLog');
const TestData = require('../models/TestData');
const Data = require('../models/Data');
const BackupHistory = require('../models/BackupHistory');
const BenEvent = require('../models/BenEvent');
const Withdraw = require('../models/Withdraw');
const AccountWithdraw = require('../models/AccountWithdraw');
const Proxy = require('../models/Proxy');
const EventMember = require('../models/EventMember');

const Team = require('../models/Team');
const League = require('../models/League');
const Game = require('../models/Game');

let argv = process.argv.slice(2);

const config = require('../config');
const {comma} = require('../utils');

const {v4:uuidv4} = require('uuid');

const calc = {
    stakeB: function (oddA, oddB, stakeA) {
        return oddA / oddB * stakeA;
    },
    investment: function (oddA, oddB, stakeA) {
        return this.stakeB(oddA, oddB, stakeA) + stakeA;
    },
    profit: function (oddA, oddB, stakeA, stakeB) {
			if(stakeB !== undefined){
				return oddA * stakeA - (stakeB + stakeA);
			}
      return oddA * stakeA - this.investment(oddA, oddB, stakeA);
    },
    profitP: function (oddA, oddB) {
        return this.profit(oddA, oddB, 1) / this.investment(oddA, oddB, 1);
    }
};

module.exports = (io, {sendMail, sendMailOpentalk})=>{

  function sendDataToMain(pid, bid, com, data){
    // io.to(pid).emit("toMain", {bid, com, data, from:"server"});
    emitToProgram(pid, "toMain", {bid, com, data, from:"server"});
  }

  function sendDataToBg(pid, bid, com, data){
    // io.to(pid).emit("toBg", {bid, com, data, from:"server"});
    emitToProgram(pid, "toBg", {bid, com, data, from:"server"});
  }

  function sendDataToBet365(pid, bid, com, data){
    // io.to(pid).emit("toBet365", {bid, com, data, from:"server"});
    emitToProgram(pid, "toBet365", {bid, com, data, from:"server"});
  }

  function emitToMember(...args){
    let email = args.shift();
    let context = io.to(email);
    context.emit.apply(context, args);
    // io.$.emit(email, ...args);
  }

  function emitToAdmin(...args){
    let context = io.to('admin');
    context.emit.apply(context, args);
    // io.$.emit('admin', ...args);
  }

  function emitToOnlyAdmin(...args){
    let context = io.to('onlyadmin');
    context.emit.apply(context, args);
    // io.$.emit('onlyadmin', ...args);
  }

  function emitToMaster(...args){
    let context = io.to('master');
    context.emit.apply(context, args);
    // io.$.emit('master', ...args);
  }


  function emitToProgram(pid, ...args){
    let context = io.to(pid);
    context.emit.apply(context, args);
    // io.$.emit(pid, ...args);
  }


  // ??????????????? ??????????????? ????????? ?????? ???????????? ???????????? ?????????
  // ????????????????????? ????????? ????????? ??? ??????(?????????),
  // ????????? ?????????????????? raw?????? ????????? function?????? ????????????
  // redisClient?????? ????????? ??? ??????.

  // ???????????? ??????????????? ????????? ???????????? promise??? ????????? ??????????????????
  // ????????? ???????????? socket.emit?????? ???????????? ????????? ????????????

  let socketResolveList = {};

  function emitToProgramPromise(pid, ...args){
    let context = io.to(pid);
    let uuid = uuidv4();
    args.push(uuid);
    context.emit.apply(context, args);
    // io.$.emit(pid, ...args);
    // return new Promise(resolve=>{
    //   socketResolveList[uuid] = resolve;
    // })
  }





  // function adminCheck(res, req, next){
  //   if(!(req.user.authority || req.user.master)){
  //     res.json({
  //       status: "fail",
  //       message: "????????? ?????? ???????????????."
  //     })
  //     return;
  //   }
  //   next();
  // }
  //
  // function masterCheck(res, req, next){
  //   if(!req.user.master){
  //     res.json({
  //       status: "fail",
  //       message: "????????? ?????? ???????????????."
  //     })
  //     return;
  //   }
  //   next();
  // }



  function authAdmin(req, res, next){
    // /api ???????????? ???????????? ?????? ????????? user??? ???????????? ???????????? ?????????.
    // let user = await User.findOne({_id:req.user._id}).select(["authority", "master"]);
    let user = req.user;
    if(user && (user.authority || user.master)){
      next();
      return;
    }

    res.status(500).json({
      status: "fail",
      message: "????????? ????????? ????????? ???????????????."
    });
  }

  function authMaster(req, res, next){
    // /api ???????????? ???????????? ?????? ????????? user??? ???????????? ???????????? ?????????.
    // let user = await User.findOne({_id:req.user._id}).select("master");
    let user = req.user;
    if(user && user.master){
      next();
      return;
    }

    res.status(500).json({
      status: "fail",
      message: "????????? ????????? ????????? ???????????????."
    });
  }

  function task(cb){
    return function(req, res){
      try{
        cb(req, res);
      }catch(e){
        console.error(e);
        res.status(500).json({
          status: "fail",
          message: e.message
        });
      }
    }
  }

  //for master.  ?????????????????????
  async function deposit(account, money){
    return;
    // console.error("#########deposit");
    // let updateData = {
    //   depositStatus: 'complete',
    //   depositMoney: money
    // }
    // money = money || account.depositMoney;
    if(money !== undefined){
      account.depositMoney = money;
    }else{
      money = account.depositMoney;
    }
    account.depositStatus = 'complete';
    //account.depositMoney = money
    account.money = 0;
    account.trash = true;

    // updateData.money = 0;
    await account.save();
    // await User.updateOne({_id:account.user}, {$inc:{wallet:money}});
    await MoneyManager.depositWallet(account.user, money, `bookmaker withdraw '${account.id}' of '${account.user.email?account.user.email:account.user._id}'`);
    await refreshBet365Money(account);
    // await updateBet365Money(account, 0, true);
    // ??????????????? ???????????? ????????? ????????? ???????????? ??????.
    await updateBet365TotalMoney(account.user._id, true);
    // await Account.updateOne({_id:account.}, updateData);
  }

  async function approvalTask(com, data){
    let account, user;
    switch(com){
      case "deposit":
        account = await Account.findOne({_id:data.aid});
        if(account){
          // await account.deposit();
          await deposit(account);
        }
      break;

      case "refreshMoney":
        // user = await User.findOne({_id:data.uid});
        await refreshMoney(data.uid);
      break;
    }
  }


  let refreshMoneyItvs = {};
  async function refreshMoney(user, onlySite){
    user = await getUser(user);
    if(user){
      let {money, wallet, bet365Money} = user;
      let obj;
      if(onlySite){
        obj = {money, wallet};
      }else{
        obj = {money, wallet, bet365Money};
      }

      clearTimeout(refreshMoneyItvs[user.email]);
      refreshMoneyItvs[user.email] = setTimeout(()=>{
        // console.trace("@@ send updateMoney");
        obj.email = user.email;
        emitToMember(user.email, "updateMoney", obj);
      }, 100)
      // console.log("######refreshMoney", user);
      // console.error("######1", user.bet365Money);
      // await updateBet365TotalMoney(user);
      // console.error("######2", user.bet365Money);

    }
  }

  async function updateMoney(user, sync){
    user = await getUser(user);
    if(user){
      await updateBet365TotalMoney(user);
      if(sync){
        await refreshMoney(user);
      }
    }
  }


 ///////////////////////////////
  async function getAccount(account){
    // console.log("########################");
    // console.log(account instanceof mongoose.Types.ObjectId);
    // console.log(account.user instanceof mongoose.Types.ObjectId);
    // console.log(account.user);
    // console.log("@@@", (!(account instanceof mongoose.Types.ObjectId) && account.user instanceof mongoose.Types.ObjectId));
    // console.log("########################");
    if(
      (account instanceof mongoose.Types.ObjectId || typeof account === "string") ||
      (!(account instanceof mongoose.Types.ObjectId) && account.user instanceof mongoose.Types.ObjectId) ||
      (!(account instanceof mongoose.Types.ObjectId) && !(account.user && account.user.email))
    ){
      // console.log("before findone", account);

      account = await Account.findOne({_id:account}).populate({
        path: 'user',
        model: User,
        options:{
          select: "email"
        }
      });

      // console.log("after findone", account);
    }
    return account;
  }

  async function refreshTab(user, links){
    console.log("refreshTab", user, links);
    user = await getUser(user);
    if(user){
      emitToMember(user.email, "refreshTab", {
        link: links
      })
    }
  }

  async function refreshBet365Money(account){
    account = await getAccount(account);
    if(account && account.user){
      console.log("refreshBet365Money", account.id, account.user.email);
      emitToMember(account.user.email, "updateEachBet365Money", {
        account: {
          _id: account._id,
          money: account.money,
          startMoney: account.startMoney
        },
        updateTarget: ["/dashboard", "/accountManager"]
      })
    }
  }

 // ?????? ??? ??????
  async function updateBet365Money(account, money, sync){
    account = await getAccount(account);
    if(account){
      account.money = money;// Math.floor(money);
      //startMoney??? 0?????? money update?????? startMoney ??????
      if(!account.startMoney){
        account.startMoney = account.money;
      }
      await account.save();
      if(sync){
        account = await Account.findOne({_id:account._id});
        await refreshBet365Money(account);
      }
    }
  }

  async function getUser(user){
    // console.log("getUser", user);
    if(user instanceof mongoose.Types.ObjectId || typeof user === "string"){
      // console.log("---find1");
      user = await User.findOne({_id:user}).select('-password');
    }else if(user && !user.email){
      // console.log("---find2");
      user = await User.findOne({_id:user._id}).select('-password');
    }
    return user;
  }

  async function refreshBet365TotalMoney(user){
    console.log("refreshBet365TotalMoney");
    user = await getUser(user);
    if(user){
      // console.error("???", user.email, user.bet365Money);
      emitToMember(user.email, "updateMoney", {email:user.email, bet365Money:user.bet365Money});
    }
  }

  // ?????? ???????????? ??????.
  async function updateBet365TotalMoney(user, sync){
    console.log("updateBet365TotalMoney");
    // ????????? ????????? ??????????????? ????????? ?????? ??????????????? ????????????.
    user = await getUser(user);
    // console.log("updateBet365TotalMoney user", user);

    if(!user) return;

    let filter = {user:user, trash:false, removed:false};
    let accounts = await Account.find(filter).select("money").lean();
    let totalMoney = accounts.reduce((r,account)=>r+account.money, 0);
    // console.log("@@@@@@ totalMoney", totalMoney);
    user.bet365Money = totalMoney;
    await user.save();
    // await User.updateOne({_id:browser.user}, {bet365Money:result[0].money});
    if(sync){
      user = await User.findOne({_id:user._id}).select('-password');
      await refreshBet365TotalMoney(user);
      // emitToMember(user.email, "updateMoney", {bet365Money:totalMoney});
    }

    return totalMoney;
  }

  // select is string array
  async function getSetting(select){
    let data = await Setting.findOne().sort({createdAt:-1});
    if(data){
      return select ? select.reduce((r,v)=>{
        r[v] = data.value[v];
        return r;
      },{}) : data.value;
    }
  }

  let util = {
    round(n,p=0){
      return Math.round(n * Math.pow(10,p))/Math.pow(10,p);
    }
  }

  // ????????????????????????
  class MoneyManager {
    static _checkMoneyName(name){
      switch(name){
        case "money":
        case "wallet":
          return true;
      }
      console.error("????????? money ??????");
      return false;
    }

    static async getFromEmail(from){
      if(from){
        let u = await getUser(from);
        if(u){
          return u.email;
        }else{
          return "notFound";
        }
      }else{
        return "system";
      }
    }

    static async _inc_process(user, prop, money, memo, from){
      if(!this._checkMoneyName(prop)) return;
      try{
        // console.log("?!?", user);
        user = await getUser(user);
        // console.log("?!?!!", user);
        if(user){
          // user[prop] += money;
          // await user.save();
          let updateObj = {};
          updateObj[prop] = money;
          let new_user = await User.findOneAndUpdate({_id:user._id}, {$inc:updateObj}, {new:true}).select(prop).lean();
          let type = money < 0 ? "withdraw" : "deposit";
          console.log(`[MoneyManager] ${user.email} ${type} ${prop} ${memo?memo:''} : ${money}`);
          await DepositLog.create({
            user: user._id,
            from: await this.getFromEmail(from),
            memo:memo + ` (result ${prop}: ${util.round(new_user[prop], 2)})`,
            type,
            money,
            moneyName: prop
          })
          //onlySite
          refreshMoney(user._id, true);
        }
        return true;
      }catch(e){
        console.error(e);
        return false;
      }
    }

    static async _set_process(user, prop, money, memo, from){
      if(!this._checkMoneyName(prop)) return;
      try{
        user = await getUser(user);
        if(user){
          let type = "set";
          let originMoney = user[prop];
          console.log(`[MoneyManager] ${user.email} ${type} ${prop} for set : ${-originMoney}`);
          await DepositLog.create({
            user: user._id,
            from: await this.getFromEmail(from),
            memo: "before set",
            type,
            money: -originMoney,
            moneyName: prop
          })
          // user[prop] = money;
          // await user.save();

          let updateObj = {};
          updateObj[prop] = money;
          await User.updateOne({_id:user._id}, updateObj).select(prop).lean();

          console.log(`[MoneyManager] ${user.email} ${type} ${prop} ${memo?memo:''} : ${money}`);
          await DepositLog.create({
            user: user._id,
            memo,
            type,
            money,
            moneyName: prop
          })
          //onlySite
          refreshMoney(user._id, true);
        }
        return true;
      }catch(e){
        console.error(e);
        return false;
      }
    }

    static async _deposit(user, prop, money, memo, from){
      if(money > 0){
        return this._inc_process(user, prop, money, memo, from);
      }
    }

    static async _withdraw(user, prop, money, memo, from){
      if(money > 0){
        return this._inc_process(user, prop, -money, memo, from);
      }
    }

    static async setMoney(user, money, memo, from){
      return this._set_process(user, "money", money, memo, from);
    }

    static async setWallet(user, money, memo, from){
      return this._set_process(user, "wallet", money, memo, from);
    }

    static async depositMoney(user, money, memo, from){
      return this._deposit(user, "money", money, memo, from);
    }

    static async depositWallet(user, money, memo, from){
      return this._deposit(user, "wallet", money, memo, from);
    }

    static async withdrawMoney(user, money, memo, from){
      return this._withdraw(user, "money", money, memo, from);
    }

    static async withdrawWallet(user, money, memo, from){
      return this._withdraw(user, "wallet", money, memo, from);
    }
  }

  var eventKeyGetter = {
    PK: function(){return this.data.pinnacle.id},
    POK: function(){return this.data.pinnacle.id + this.data.pinnacle.odds},
    BK: function(){return this.data.bet365.id},
    BOK: function(){return this.data.bet365.id + this.data.bet365.odds},
    //origin bet365 event id + odds  key
    // OBOK: data.bet365.eventId + data.bet365.odds,
    OBOK: function(){return this.data.bet365.bookmakerDirectLink + this.data.bet365.odds},
    //origin bet365 event id + odds + id  key
    // OBOIK: data.bet365.eventId + data.bet365.odds + account.id,
    // OBOIK: data.bet365.bookmakerDirectLink + data.bet365.odds + account.id,
    // matchId: data.pinnacle.id + ':' + data.bet365.id
    EK: function(){return this.data.pinnacle.arbHash},
    EBOK: function(){return this.data.pinnacle.arbHash + this.data.bet365.odds},
    EPOK: function(){return this.data.pinnacle.arbHash + this.data.pinnacle.odds}
  }

  Object.defineProperty(eventKeyGetter, "data", {
    value: null,
    enumerable: false,
    writable: true
  })

  function getEventKeyNames(){
    return Object.keys(eventKeyGetter);
  }

  function getEventKey(data, keyName){
    if(eventKeyGetter[keyName]){
      eventKeyGetter.data = data;
      return eventKeyGetter[keyName]();
    }
    return null;
  }

  function getEventKeys(data){
    eventKeyGetter.data = data;
    return Object.keys(eventKeyGetter).reduce((r,key)=>{
      r[key] = eventKeyGetter[key]();
      return r;
    },{})
  }

  let room_checker = "__data_receiver__";
  let room_bettor = "__data_receiver2__";

  async function setGameData(data, dataType){
    // console.log("@@setGameData", data);
    // let d = await getRedis("gamedata_"+dataType);
    // if(d == "temp"){
    //   console.log("@ pass setgame")
    //   return;
    // }
    return setRedis("gamedata_"+dataType, data);
  }

  async function pullGameData(opt){
    let {dataType, livePrematch} = opt;
    let data = await getRedis("gamedata_"+dataType);
    // console.log("@pull", Array.isArray(data)&&data.length, {livePrematch});
    if(data){

      // empty??? ?????? ????????? ???????????? ????????? ??????????????????.
      // temp??? pullGameData???????????? ????????? ???????????? ????????? ??????(?????? ???????????? ???????????? ????????????)
      if(data == "empty" || data == "temp"){
        return null;
      }

      let gd;
      try{
        gd = JSON.parse(data);
      }catch(e){
        console.error("gamedata parsing error. data:", data);
        return;
      }

      // console.log("@ set temp");
      // await setRedis("gamedata_"+dataType, "temp");

      // console.log("gamedata length:", gd.length);
      // console.log("@ gd", !!gd);

      if(gd){
        let r;
        for(let i=0; i<gd.length; i++){
          r = gd[i];
          if(r && await isLockEvent(r.bet365.betburgerEventId, dataType)){
            // console.log("- isLocked");
            r = null;
            continue;
          }

          if(typeof livePrematch === "object"){
            if(r.bet365.isLive && !livePrematch.live){
              // console.log("- is no live");
              r = null;
              continue;
            }
            if(!r.bet365.isLive && !livePrematch.prematch){
              // console.log("- is no prematch");
              r = null;
              continue;
            }
          }

          let keys = getEventKeyNames(r).map(k=>{
            return getEventKey(r, k);
          })

          let ben = await BenEvent.findOne({
            $and: [
              {key: {$in:keys}},
              {$or:[
                {expire: null},
                {expire: {$gte: new Date()}},
              ]},
              //???????????? ?????? ???????????? ??????
              {createdAt: {$gte: new Date(Date.now()-1000*60*60*24*2)}}
            ]
          })

          if(!ben){
            let benCount = await BenEvent.countDocuments({
              $and: [
                {key:getEventKey(r, "OBOK")},
                {createdAt: {$gte: new Date(Date.now()-1000*60*30)}}
              ]
            })
            if(benCount > 5){
              ben = true;
            }
          }

          if(ben){
            console.log("@ ben event");
            gd.splice(i, 1);
            i--;
            r = null;
            continue;
          }

          if(r){
            gd.splice(i, 1);
            // await setGameData(JSON.stringify(gd), dataType);
            await lockEvent(r.bet365.betburgerEventId, dataType);
          }
          break;
          // return r;
        }

        await setGameData(JSON.stringify(gd), dataType);

        // let tempData = await getRedis("gamedata_"+dataType);
        // console.log("@ check", tempData);
        // if(tempData == "temp"){
        //   console.log("@ restore");
        //   await setRedis("gamedata_"+dataType, JSON.stringify(gd));
        // }
        return r;
      }
    }
  }

  async function isLockEvent(id, dataType){
    let list = await getRedis("gamedataLockList_"+dataType);
    list = list ? JSON.parse(list) : {};
    // console.log("@isLockEvent", id, list[id], Object.keys(list).length);
    return list[id] !== undefined;
  }

  async function lockEvent(id, dataType){
    let list = await getRedis("gamedataLockList_"+dataType);
    list = list ? JSON.parse(list) : {};
    list[id] = 1;
    // console.log("@lockEvent", id);
    return setRedis("gamedataLockList_"+dataType, JSON.stringify(list));
  }

  async function unlockEvent(id, dataType){
    let list = await getRedis("gamedataLockList_"+dataType);
    list = list ? JSON.parse(list) : {};
    delete list[id];
    // console.log("@unlockEvent", id);
    return setRedis("gamedataLockList_"+dataType, JSON.stringify(list));
  }

  async function unlockEventAll(dataType){
    return setRedis("gamedataLockList_"+dataType, '{}');
  }

  unlockEventAll("betburger1");
  unlockEventAll("betburger2");

  let MD = {
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
  }

  require('./api_socket')(MD);
  require('./api_option')(MD);
  require('./api_user')(MD);
  require('./api_event')(MD);
  require('./api_account')(MD);
  require('./api_proxy')(MD);
  require('./api_program')(MD);
  require('./api_deposit')(MD);
  require('./api_approval')(MD);
  require('./api_bet_history')(MD);
  require('./api_betburger')(MD);
  require('./api_analysis')(MD);

  require('./api_schedule')(MD);

  require('./api_game')(MD);

  // router.use("/api", subdomain('api.v1', router));
  // router.use("/api", subdomain('api.v2', router));
  // router.use("/api", subdomain('api.v3', router));



  // router.post("/test", async (req, res)=>{
  //   res.send(1);
  // })



  //test
  // let axios = require('axios');
  // router.post("/ip", (req, res)=>{
  //   var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  //   let body = req.body;
  //   console.log("test ip", ip, body);
  //   // let net = axios.create({
  //   //   // baseURL: API_BASEURL_LIST[apiIndex],
  //   //   // baseURL: API_BASEURL,
  //   //   baseURL: "http://localhost:8080"
  //   // })
  //   // // axios.get("http://localhost:8080/api", {test:1});
  //   // net({method:"GET", url:"/api", data:{test:1}}).then(r=>{
  //   //   console.log("??", r.data);
  //   // });
  //   res.json({ip, body});
  //   // res.send(ip);
  // })

  router.post("/input_test_data", async (req, res)=>{
    let d;
    try{
      d = await TestData.create(req.body);
    }catch(e){
      console.error(e);
      res.json({
        status: "fail"
      })
      return
    }
    res.json({
      status: "success",
      data: d._id
    })
  })


  router.post("/input_oddsportal_data", async (req, res)=>{
    let data = req.body;
    let sports = data.sports;
    console.log("@@@@@@@@@@@@@@@@@@", sports);
    let updated;
    let overwrite = data.overwrite == "true";
    let leagues = data.leagues;
    let liveList = [], isLiveUpdate;
    for(let i=0; i<leagues.length; i++){
      let league = leagues[i];
      let lg = await League.findOne({name:league.league});
      if(!lg){
        lg = await League.create({
          name: league.league,
          sports,
          country: league.country
        })
        console.log("create league", lg);
      }
      let games = league.games;
      if(!games) continue;
      for(let k=0; k<games.length; k++){
        let game = games[k];
        let cancelMemo = game.cancelMemo;
        let players = game.players;
        let live = game.live == "true";
        // console.log("???", live, game.live);
        let home, away;
        for(let j=0; j<players.length; j++){
          let player = players[j];
          let team = await Team.findOne({name:player});
          if(!team){
            team = await Team.create({
              name: player,
              sports
            })
            console.log("create team", team);
          }
          if(j==0) home = team;
          else away = team;
        }


        let keyArr
        let key = [data.date,game.time,sports,league.league,home.name,away.name].join('_').replace(/ /g,'');
        let key2 = [data.date,sports,league.league,home.name,away.name].join('_').replace(/ /g,'');
        let gm;
        let date = new Date(game.date);
        let now = new Date();
        // let after4h = new Date(date.getTime() + 1000 * 60 * 60 * 4);
        let before4h = new Date(now.getTime() - 1000 * 60 * 60 * 4);
        let liveFindObj;
        if(live){
          liveFindObj = {
            key2,
            settled: false,
            date:{
              $lte: now,
              // $gte: before4h
            }
          }

          gm = await Game.findOne(liveFindObj);
        }else{
          gm = await Game.findOne({key});
        }

        let result = game.result;// = game.result==-1?'x':['1','2'][game.result];
        let homeScore = Number(game.homeScore);
        let awayScore = Number(game.awayScore);
        let settled = !live&&homeScore!=-1&&!(now.getTime()<date.getTime());// = result == 'x';

        // console.log("game", game)

        // if(game.result==-2){
        //   result = "";
        //   settled = false;
        // }else{
        //   result = game.result==-1?'x':['1','2'][game.result];
        //   settled = true;
        // }

        let time = game.time||"";
        // console.log("DDDD", game.date);

        // let date = new Date(data.date + ((time && time.indexOf(':')>-1)?' '+time:''));
        // console.log("%$%% date", data);
        // ?????? ???????????? ??????
        if(!gm){
          if(!live){
            console.log("create game", key);
            gm = await Game.create({
              key, key2, home, away, result, homeScore, awayScore, time, settled, date, live, sports, cancelMemo,
              league: lg,
              dateStr: data.date
            })
            updated = true;
          }else{
            console.log("not found live game", key2);
          }
        }else{
          let updateFlag;
          if(overwrite){
            if(live){
              if(now.getTime() >= date.getTime()){
                console.log("live overwrite", key2);
                // ??? ????????? ??????~+4 ????????? ?????? ????????? ???????????? ??????????????????
                await Game.updateOne(liveFindObj, {
                  key2,
                  home, away, homeScore, awayScore, settled, live, sports,
                  dateStr: data.date,
                  liveTime: time
                })
              }
            }else{
              console.log("overwrite", key);
              await Game.updateOne({key}, {
                key, key2,
                home, away, result, homeScore, awayScore, time, settled, date, live, sports, cancelMemo,
                dateStr: data.date
              })
            }
            updated = true;
          }else{
            if(live){
              console.log("live update", key2);
              let g = await Game.findOneAndUpdate(liveFindObj, {
                homeScore, awayScore, live,
                liveTime: time
              }, {new: true});
              liveList.push({
                _id: g._id,
                homeScore, awayScore,
                liveTime: time
              })
              isLiveUpdate = true;

              // await Game.updateOne(liveFindObj, {
              //   homeScore, awayScore,
              //   liveTime: time
              // })
              // updated = true;
            }else if(gm.settled == false && settled == true){
              console.log("settled update", key, {result});
              updateFlag = true;
              // ?????? ????????? ???????????? ????????????
            }else if(gm.homeScore != homeScore || gm.awayScore != awayScore){
              console.log("score update", key, {result, homeScore, awayScore});
              updateFlag = true;
              // ????????? ??????????????? ??????
            }else if(gm.result != result){
              console.log("result update", key, {result});
              updateFlag = true;
              // ????????? ??????????????? ??????
            }else if(gm.cancelMemo != cancelMemo){
              console.log("cancelMemo update", key, {result, cancelMemo});
              updateFlag = true;
              // ????????? ??????????????? ??????
            }

            if(updateFlag){
              await Game.updateOne({key}, {
                homeScore, awayScore, result, settled, date, live, cancelMemo
              })
              updated = true;
            }
          }
        }
        //   // ?????? ????????????
        //   if(live){
        //     console.log("live update")
        //     // live??? ????????????
        //     await Game.updateOne({key}, {
        //       homeScore, awayScore, time
        //     })
        //   }else if(gm.settled !== settled){
        //     console.log("settled update", key)
        //     // ?????? ????????? ???????????? ????????????
        //     await Game.updateOne({key}, {
        //       homeScore, awayScore, time, result, settled, date, live
        //     })
        //   }
        // }
      }
    }

    if(updated){
      io.emit("updateGame", {sports, date:data.date});
    }else if(isLiveUpdate){
      // ????????? ??????????????? ????????? ??????????????? ?????? ???????????????.
      io.emit("updateGame", {sports, date:data.date, live:true, liveList});
    }

    res.send('1');
  })

  // from betburger
  // router.post("/input_data", async (req, res)=>{
  //   let t = await getRedis("inputDataTime")||0;
  //   if(Date.now() - t < 1000){
  //     res.send('0');
  //     return;
  //   }
  //   await setRedis("inputDataTime", Date.now());
  //
  //   console.log("receive gamedata " + (req.body.data.length>2), (new Date()).toLocaleTimeString());
  //   // let room = "__data_receiver__";
  //
  //   // console.error(io.in(room).sockets);
  //   // console.error(io.sockets.adapter.rooms.get(room));
  //
  //   // let map = io.sockets.adapter.rooms.get(room_checker);
  //   // if(map){
  //   // //   console.log("found checker");
  //   // // //   // ????????? ????????? ????????? ?????? ????????? ???????????? ???????????? ?????????????????????
  //   //   console.log("count", map.size);
  //   //   console.log(...map.keys());
  //   // }
  //   // io.$.emit(room, "gamedata", req.body);
  //
  //   // io.to(room_checker).emit("gamedata", req.body);
  //
  //
  //   let list;
  //   try{
  //     list = JSON.parse(req.body.data);
  //   }catch(e){
  //     console.error('gamedata parse error', e);
  //   }
  //   // console.log("###", list);
  //   list = list.map(bets=>{
  //     return bets.reduce((r,v)=>{
  //       r[v.bookmaker] = v;
  //       return r;
  //     }, {});
  //   })
  //   // list = list.reduce((r,v)=>{
  //   //   r[v.bookmaker] = v;
  //   //   return r;
  //   // }, {});
  //
  //   await setGameData(JSON.stringify(list));
  //
  //   res.send('1');
  // })


  router.post("/ben_event", task(async (req, res)=>{
    let {id, dataType, betburgerEventId, time, msg} = req.body;
    let ben = await BenEvent.create({
      key: id,
      expire: time == 0 ? null : new Date(Date.now()+time),
      msg: msg,
      betburgerEventId: betburgerEventId,
      dataType: dataType
    })
    console.log("@ben event", ben);
    res.json({
      status: "success"
    })
  }))


  router.post("/input_bet", task(async (req, res)=>{
    let data = req.body;
    data.user = req.user._id;

    if(data.siteStake < 0){
      res.json({
        status: "fail",
        message: "????????? stake????????????."
      })
      return;
    }

    let profit;
    try{
      profit = calc.profit(data.siteOdds, data.bookmakerOdds, data.siteStake, data.bookmakerStake);
      // data.profit = calc.profit(data.siteOdds, data.bookmakerOdds, data.siteStake, data.bookmakerStake);
    }catch(e){
      console.error(e);
    }

    if(profit > 100){
      res.json({
        status: "fail",
        message: "????????? ??????????????????."
      })
      return;
    }

    // try{
    //   data.profitP = calc.profitP(data.siteOdds, data.bookmakerOdds);
    // }catch(e){
    //   console.error(e);
    // }

    let event;
    try{
      event = await Event.findOne({_id:data.event});
      if(!event){
        res.json({
          status: "fail",
          message: "?????? ???????????? ?????? ???????????????."
        })
        return;
      }else{
        event.bookmaker = data.bookmaker;

        delete data.bookmaker;
        await event.save();
      }
    }catch(e){
      console.error(e);
    }

    let bd;
    console.log("input bet", data);
    try{
      if(event.betStatus !== "ACCEPTED"){
        data.betStatus = event.betStatus;
      }
      data.eventName = event.betburger.pinnacle.eventName;
      data.sportName = event.sportName;
      data.betType = event.betType;
      // data.event = await Event.findOne()
      bd = await BetData.create(data);
      // let user = await User.findOneAndUpdate({_id:req.user._id}, {$inc:{money:-data.siteStake}}, {new:true});
      // refreshMoney(user, true);
      await MoneyManager.withdrawMoney(req.user._id, data.siteStake, `bet`);

      // ????????? ????????? ?????? event??? ????????? ?????? ??????????????? ??????????????? ?????? ????????????.
      if(event.betStatus !== "ACCEPTED"){
        if(event.betStatus == "WON"){
          console.log(`---- direct Settled Bet: WON ----`)
          console.log(`-- user: ${req.user.email}`);
          console.log(`-- result: ${data.siteOdds * data.siteStake}`);
          await MoneyManager.depositMoney(req.user._id, data.siteOdds * data.siteStake, `(direct) bet <span class="text-info">WON</span> result (odds:${data.siteOdds}, stake:${data.siteStake})`);
        }else if(event.betStatus == "REFUNDED" || event.betStatus == "CANCELLED"){
          console.log(`---- direct Settled Bet: ${event.betStatus} ----`)
          console.log(`-- user: ${req.user.email}`);
          console.log(`-- result: ${data.siteStake}`);
          await MoneyManager.depositMoney(req.user._id, data.siteStake, `(direct) bet <span class="text-warning">${event.betStatus}</span> result`);
        }
      }
      // console.error("##profitSound", req.user.email, profit);
      emitToMember(req.user.email, "profitSound", profit);
      console.log(`---- bet: ${data.siteStake} ----`);
      console.log(`-- user: ${req.user.email}`);
    }catch(e){
      console.error(e);
      res.json({
        status: "fail",
        message: "???????????? ?????? ??????"
      })
      return;
    }

    res.json({
      status: "success",
      data: bd._id
    })
  }))


  // depositHistory ????????? ??????
  router.post("/get_withdraw_list_for_user", task(async (req, res)=>{
    let {
      ids, offset, limit, curPage, range, searchId
    } = req.body;
    let query = {};

    for(let o in query){
      if(query[o] === undefined || query[o] === ""){
        delete query[o];
      }
    }

    if(ids){
      query._id = ids;
    }

    query.user = req.user._id;

    if(searchId){
      let account = await Account.findOne({id:searchId});
      if(account){
        query.account = account._id;
      }else{
        query.account = null;
      }
    }



    if(curPage !== undefined){
      // ???????????? ??????????????????, ?????? ????????? limit, offset ??????
      limit = 20;//config.ACCOUNT_LIST_COUNT_PER_PAGE;
      offset = curPage * limit;
    }else{
      // ???????????? ?????????????????????. ????????? limit, offset ??????
      // ????????? limit, offset??? ????????? ???????????????
      if(limit === undefined){
        limit = 20;//config.ACCOUNT_LIST_COUNT_PER_PAGE;
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
        select: '-pw -digit4 -skrillEmail -skrillId -skrillPw -skrillCode'
      }
    ]

    if(range){
      query.createdAt= {
        $gte: new Date(range.start),
        $lte: new Date(range.end)
      }
    }

    console.log("query", query);

    // ??????????????? limit?????? ??????????????????????????? ??? count????????? ????????????.
    let count = await AccountWithdraw.countDocuments(query);
    let pageLength = Math.ceil(count / limit);// 0 ~
    let maxPage = pageLength - 1;
    // console.log("account count", count);
    let startPage = Math.floor(curPage / config.PAGE_COUNT) * config.PAGE_COUNT;
    let endPage = Math.min(startPage + config.PAGE_COUNT-1, maxPage);

    let list = await AccountWithdraw.find(query)
    .sort({createdAt:-1})
    .limit(limit)
    .skip(offset)
    .populate(populateObjList)
    .lean();

    let sum = await AccountWithdraw.aggregate()
    .match(query)
    .group({
      _id: 'null',
      total: {$sum:'$withdraw'}
    });

    // console.log("????", query, list);
    console.log("sum", sum);
    let sumWithdraw = 0;
    if(sum[0]){
      sumWithdraw = sum[0].total;
    }

    res.json({
      status: "success",
      data: {list, sumWithdraw, curPage, startPage, endPage, maxPage, count, pageCount:config.PAGE_COUNT}
    });
  }))


  // /admin/accountWithdrawManager ????????? ??????
  router.post("/get_withdraw_list", authAdmin, task(async (req, res)=>{
    let {
      ids, offset, limit, curPage, email, check, checker, range, searchId
    } = req.body;
    let query = {};

    if(email){
      // query.user = {email};
      let user = await User.findOne({email});
      if(user){
        query.user = user._id;
      }else{
        query.user = null;
      }
    }

    if(checker){
      let user = await User.findOne({email:checker});
      if(user){
        query.checker = user._id;
      }else{
        query.checker = null;
      }
    }else if(check){
      if(check == 'y'){
        query.checker = {$ne:null};
      }else if(check == 'n'){
        query.checker = null;
      }
    }

    for(let o in query){
      if(query[o] === undefined || query[o] === ""){
        delete query[o];
      }
    }

    if(ids){
      query._id = ids;
    }

    if(searchId){
      let account = await Account.findOne({id:searchId});
      if(account){
        query.account = account._id;
      }else{
        query.account = null;
      }
    }



    if(curPage !== undefined){
      // ???????????? ??????????????????, ?????? ????????? limit, offset ??????
      limit = 20;//config.ACCOUNT_LIST_COUNT_PER_PAGE;
      offset = curPage * limit;
    }else{
      // ???????????? ?????????????????????. ????????? limit, offset ??????
      // ????????? limit, offset??? ????????? ???????????????
      if(limit === undefined){
        limit = 20;//config.ACCOUNT_LIST_COUNT_PER_PAGE;
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
        select: '-password'
      },
      {
        path: 'checker',
        model: User,
        select: '-password'
      },
      {
        path: 'account',
        model: Account,
        select: '-pw -digit4 -skrillEmail -skrillId -skrillPw -skrillCode'
      }
    ]

    if(range){
      query.createdAt= {
        $gte: new Date(range.start),
        $lte: new Date(range.end)
      }
    }

    console.log("query", query);

    // ??????????????? limit?????? ??????????????????????????? ??? count????????? ????????????.
    let count = await AccountWithdraw.countDocuments(query);
    let pageLength = Math.ceil(count / limit);// 0 ~
    let maxPage = pageLength - 1;
    // console.log("account count", count);
    let startPage = Math.floor(curPage / config.PAGE_COUNT) * config.PAGE_COUNT;
    let endPage = Math.min(startPage + config.PAGE_COUNT-1, maxPage);

    let list = await AccountWithdraw.find(query)
    .sort({createdAt:-1})
    .limit(limit)
    .skip(offset)
    .populate(populateObjList)
    .lean();

    let sum = await AccountWithdraw.aggregate()
    .match(query)
    .group({
      _id: 'null',
      total: {$sum:'$withdraw'}
    });

    let users = await User.find({email:{$ne:null}}).select("email authority master").lean();

    // console.log("????", query, list);
    console.log("sum", sum);
    let sumWithdraw = 0;
    if(sum[0]){
      sumWithdraw = sum[0].total;
    }

    res.json({
      status: "success",
      data: {list, users, sumWithdraw, curPage, startPage, endPage, maxPage, count, pageCount:config.PAGE_COUNT}
    });
  }))


  router.get("/checking_withdraw/:_id", authAdmin, task(async (req, res)=>{
    let aw = await AccountWithdraw.findOneAndUpdate({_id:req.params._id}, {checker:req.user, checkDate:new Date()}, {new:true})
    .populate('user checker account');
    res.json({
      status: "success",
      aw
    })
  }))

  // /admin/depositManager ????????? ??????
  router.post("/get_money_log", authMaster, task(async (req, res)=>{
    let {
      ids, offset, limit, curPage, email, type, moneyName, range, from
    } = req.body;
    let query = {type, moneyName, from};

    if(email){
      let user = await User.findOne({email});
      if(user){
        query.user = user._id;
      }else{
        query.user = null;
      }
    }

    for(let o in query){
      if(query[o] === undefined || query[o] === ""){
        delete query[o];
      }
    }

    if(ids){
      query._id = ids;
    }

    // if(accountId){
    //   let account = await Account.findOne({id:accountId});
    //   if(account){
    //     query.account = account._id;
    //   }else{
    //     query.account = null;
    //   }
    // }



    if(curPage !== undefined){
      // ???????????? ??????????????????, ?????? ????????? limit, offset ??????
      limit = 20;//config.ACCOUNT_LIST_COUNT_PER_PAGE;
      offset = curPage * limit;
    }else{
      // ???????????? ?????????????????????. ????????? limit, offset ??????
      // ????????? limit, offset??? ????????? ???????????????
      if(limit === undefined){
        limit = 20;//config.ACCOUNT_LIST_COUNT_PER_PAGE;
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
        select: '-password'
      }
    ]

    if(range){
      query.createdAt= {
        $gte: new Date(range.start),
        $lte: new Date(range.end)
      }
    }

    console.log("query", query);

    // ??????????????? limit?????? ??????????????????????????? ??? count????????? ????????????.
    let count = await DepositLog.countDocuments(query);
    let pageLength = Math.ceil(count / limit);// 0 ~
    let maxPage = pageLength - 1;
    // console.log("account count", count);
    let startPage = Math.floor(curPage / config.PAGE_COUNT) * config.PAGE_COUNT;
    let endPage = Math.min(startPage + config.PAGE_COUNT-1, maxPage);

    let list = await DepositLog.find(query)
    .sort({createdAt:-1})
    .limit(limit)
    .skip(offset)
    .populate(populateObjList)
    .lean();

    let sum = await DepositLog.aggregate()
    .match(query)
    .group({
      _id: 'null',
      total: {$sum:'$money'}
    });

    let users = await User.find({email:{$ne:null}}).select("email master").lean();
    // let sum = await DepositLog.aggregate([
    //   {
    //     $group: {
    //       _id: "null",
    //       total: {
    //         $sum: "$money"
    //       }
    //     }
    //   },
    //   {
    //     $match: query
    //   }
    // ])
    // console.log("????", query, list);
    console.log("sum", sum);

    res.json({
      status: "success",
      data: {list, users, sum:sum[0]?sum[0].total:0, curPage, startPage, endPage, maxPage, count, pageCount:config.PAGE_COUNT}
    });
  }))

  router.post("/set_setting", authMaster, task(async (req, res)=>{
    let data = req.body;
    if(!data){
      res.json({
        status: "fail",
        message: "?????? ??? ???????????? ????????????."
      })
      return;
    }
    // console.log(data);
    let count = await Setting.countDocuments();
    let setting;
    if(count){
      setting = await Setting.findOne().sort({createdAt:-1});
      setting.value = Object.assign(setting.value, data);
      setting.markModified('value');
      await setting.save();
    }else{
      setting = new Setting({value:data});
      await setting.save();
    }

    res.json({
      status: "success"
    })
  }))

  router.get("/get_setting/:fields", authMaster, task(async (req, res)=>{
    // let setting = await Setting.findOne().sort({createdAt:-1});
    let fields = req.params.fields;
    if(fields != "undefined"){
      fields = fields.split(',');
    }else{
      fields = null;
    }
    let data = await getSetting(fields);

    res.json({
      status: "success",
      data: data
    })
  }))

  router.get("/get_pncinfo/:email", task(async (req, res)=>{
    console.log("###params", req.params);
    let user = await User.findOne({email:req.params.email});
    if(!user){
      res.json({
        status: "fail",
        message: "?????? ???????????? ??????????????????"
      })
      return;
    }

    let data = await getSetting(["pinnacleId", "pinnaclePw"]);
    console.log("pncinfo", data);

    res.json({
      status: "success",
      data: data
    })
  }))

  router.get("/get_country_list", task(async (req, res)=>{
    let setting = await Setting.findOne().sort({createdAt:-1});

    let json;
    if(setting){
      try{
        json = JSON.parse(setting.value['countryJson']);
      }catch(e){
        json = {};
      }
    }

    res.json({
      status: "success",
      data: json
    })
  }))

  router.get("/get_proxy/:code", task(async (req, res)=>{
    let setting = await Setting.findOne().sort({createdAt:-1});
    let code = req.params.code;
    if(!setting){
      res.json({
        status: "fail",
        message: "?????? ????????? ?????? ??? ????????????."
      })
      return;
    }

    let json = {};
    json.server = setting.value["proxyServer"];
    json.customer = setting.value["proxyCustomer"];
    json.token = setting.value["proxyApiToken"];
    // console.log("??", code)
    if(code != "undefined" && code){
      // console.log("#$%");
      json.zone = setting.value["proxyZone-" + code];
      json.user = setting.value["proxyUser-" + code];
      json.pw = setting.value["proxyPw-" + code];
    }else{
      // json = {};
      // console.log("!!", setting.value);
      let countrys = {};
      for(let o in setting.value){
        // console.log("-", o);
        if(o.match(/^proxy(Zone|User|Pw)-/)){
          let countryCode = o.split('-').pop();
          // console.log(o.replace("proxy",''));
          // console.log(o.replace("proxy",'').replace('-'+countryCode,''));
          let key = o.replace("proxy",'').replace('-'+countryCode,'').toLowerCase();
          if(!countrys[countryCode]){
            countrys[countryCode] = {};
          }
          // console.log(countryCode, key, setting.value[o]);
          countrys[countryCode][key] = setting.value[o];
        }
      }
      json.countrys = countrys;
    }

    // for(let o in setting.value){
    //   if(o.indexOf("proxy") > -1){
    //     json[o] = setting.value[o];
    //   }
    // }

    console.log("get proxy info", json);

    res.json({
      status: "success",
      data: json
    })
  }))

  router.get("/balance", task(async (req, res)=>{
    // console.error("@@@@@@1", user.bet365Money);
    await updateBet365TotalMoney(req.user._id);
    let user = await User.findOne({_id:req.user._id}).select(["money", "wallet", "bet365Money", "email"]);
    // console.error("@@@@@@2", user.bet365Money);
    res.json({
      status: "success",
      data: {
        email: user.email,
        money: user.money,
        wallet: user.wallet,
        bet365Money: user.bet365Money
      }
    })
  }))

  router.get("/refreshMoney", task(async (req, res)=>{
    let user = await User.findOne({email:req.user.email}).select(["money", "wallet", "bet365Money", "email"]);
    await updateBet365TotalMoney(user);
    // console.error("?", user.email);
    let data = {
      email: user.email,
      money: user.money,
      wallet: user.wallet,
      bet365Money: user.bet365Money
    };

    // io.$.emit(user.email, "updateMoney", data);
    // console.trace("@@@@ send updateMoney");
    io.to(user.email).emit("updateMoney", data);

    res.json({
      status: "success"
    })
  }))

  router.get("/backuptime", task(async (req, res)=>{
    let bh = await BackupHistory.findOne({}).sort({$natural:-1});

    res.json({
      status: "success",
      date: bh?bh.createdAt:null
    })
  }))



  return router;
}

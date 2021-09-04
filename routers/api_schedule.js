const CronJob = require('cron').CronJob;
const PAPI = require('./papi');
// const Backup = require("backup-mongodb");
const backup = require('mongodb-backup-fixed');

// https://github.com/SeunMatt/backup-mongodb-restorer
// const Restore = require("backup-mongodb-restorer");

let papi;



module.exports = async MD=>{
  let {
    argv,
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
    Account,
    Option,
    Approval,
    Setting,
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
    MoneyManager
  } = MD;

  let pdata = await getSetting(["pinnacleId", "pinnaclePw"])
  if(pdata){
    papi = new PAPI(Buffer.from(pdata.pinnacleId + ':' + pdata.pinnaclePw).toString('base64'));
  }else{
    console.error("you must be set pinnacle ID/PW");
  }

  // router.get("/test", async (req, res)=>{
  //   // let list = await loadArbs("betburger1", "Live", 10);
  //
  //
  //   // let list = await betburgerEventProcess("betburger1");
  //   // res.json(list);
  //
  //   // let p = await papi.getBets({betIds:"1318901205"});
  //   let p = await BetData.aggregate()
  //   .match({betStatus:"ACCEPTED"})
  //   .group({
  //     _id: '$betId'
  //   })
  //
  //
  //
  //   console.log(p);
  //
  //   res.json({});
  // })

  // let cycleTime = 1000 * 60 * 60 * 1;

  // setInterval(process, cycleTime);
  if(0 && (argv[0] == "master" || process.env.NODE_ENV === undefined)){
    console.error("##MASTER");

    let backupTime = 0;
    async function backupProcess(user){
      if(Date.now() - backupTime < 10000){
        return;
      }
      backupTime = Date.now();
      console.log("-------- backup process --------");
      let d = new Date();

      try{
        backup({
          uri: config.DB_URI,
          root: config.BACKUP_PATH
        });

        await BackupHistory.create({user});
        // new Backup(config.DB_URI, config.BACKUP_PATH).backup();
      }catch(e){
        console.error('backup error');
        console.error(e);
      }

      return d.getTime();
    }


    // 매시간 5분 마다 이벤트 결과 확인
    let job5m = new CronJob('0 */5 * * * *', function() {
       eventSettledCheckProcess();
    });
    job5m.start();

    let job1h = new CronJob('0 3 */1 * * *', function() {
       clearLogProcess();
    });
    job1h.start();

    let job24h = new CronJob('0 7 12 * * *', function() {
       backupProcess();
    });

    router.get("/backup", authMaster, task(async (req, res)=>{
      let time = await backupProcess(req.user);
      // console.log("/get_option_list", options);
      res.json({
        status: "success",
        time: time
      });
    }))
  }




  // 1일마다 브라우져당 log에서 500개 이상일 때,
  // 마지막 500개를 제외하고 앞에것을 제거하는 스케쥴을 작성

  async function clearLogProcess(){
    // let b = await Browser.findOne({});
    // for(let i=0; i<320; i++){
    //   await Log.create({browser:b, bet365Id:'test', data:{c:i}});
    //   await new Promise(resolve=>setTimeout(resolve, 100));
    // }
    // return;
    console.log("-------- clear log process --------");
    const count = await Log.aggregate()
    .group({
      _id: "$browser",
      count: {
        $sum: 1
      }
    })
    // console.log(count);
    let max = config.MAX_LOG_LENGTH;
    for(let i=0; i<count.length; i++){
      if(count[i].count > max){
        let offset = count[i].count - max;
        let logs = await Log.find({browser:count[i]._id}).limit(offset).sort("updatedAt").select('_id');
        await Log.deleteMany({_id:logs});
      }
    }
  }

  ///// test
  // let user = await User.findOne({email:"asdf1212@gmail.com"});
  // // // change to accepted
  // await BetData.updateMany({user, betStatus:{$ne:"ACCEPTED"}}, {betStatus:"ACCEPTED"});
  // // //// virture bet
  // let list = await BetData.find({user, betStatus:"ACCEPTED"});
  // for(let i=0; i<list.length; i++){
  //   let b = list[i];
  //   await MoneyManager.withdrawMoney(user, b.siteStake, `virture bet (odds:${b.siteOdds}, stake:${b.siteStake})`);
  // }

  async function eventSettledCheckProcess(){
    console.log("============ bet result process ============", (new Date()).toLocaleString());
    // let list = await BetData.find({betStatus:"ACCEPTED"}).select(["betId", "event"]).lean();
    let ids = await BetData.aggregate()
    .match({betStatus:"ACCEPTED"})
    .group({_id: '$betId'});
    ids = ids.map(a=>a._id);
    // 여기서 이미 결과처리 완료된 이벤트가 있으면 어떻게 처리하냐? papi호출전에 정리되는게 맞다.
    // 하지만, 보통 배팅결과처리가 배팅과 비슷한시기에 되지는 않기때문에,,, 괜찮을듯.
    if(ids.length == 0) return;

    // let ids = list.map(d=>d.betId);
    let results = await papi.getBets({betIds:ids.join()});
    // console.log("results:", results);
    if(Array.isArray(results.straightBets)){
      let users = {};
      for(let i=0; i<results.straightBets.length; i++){
        let bets = results.straightBets[i];
      // results.straightBets.forEach(async bets=>{
        // console.log(bets);
        try{
          await Event.updateOne({_id:bets.uniqueRequestId, betStatus:"ACCEPTED"}, bets);
        }catch(e){
          console.error(e);
        }
        try{
          let list = await BetData.find({betStatus:"ACCEPTED", betId:bets.betId}).populate([
            {
              path: "user",
              model: User
            }
            // ,
            // {
            //   path: "account",
            //   model: Account,
            //   select: "id"
            // }
          ]);
          for(let i=0; i<list.length; i++){
            let betData = list[i];
            await betData.resultProcess(MoneyManager, bets.betStatus);
            if(betData.user){
              users[betData.user.email] = betData.user;
            }
          }

        }catch(e){
          console.error(e);
        }
      }

      Object.keys(users).forEach(email=>{
        // console.log(email, users[email]);
        // refreshMoney(users[email], true);
        refreshTab(users[email], "/betHistory");
      })
    }
    console.log("===============================================");
  }



  // 정각마다 소켓맵 청소
  // let job1h = new CronJob('0 0 */24 * * *', async function() {
  //   socketMapCheckProcess();
  // })
  // job1h.start();

  // io.$.reset();

  // setTimeout(socketMapCheckProcess, 5000);

  // async function socketMapCheckProcess(){
  //   console.log("-------- socketMap check --------");
  //   let list = await io.$.list();
  //   // console.log(list);
  //   for(let room in list){
  //     for(let id in list[room]){
  //       // console.error(room, id, list[room][id]);
  //       // console.error(io.to(id).sockets.sockets.get(id));
  //       if(!io.to(id).sockets.sockets.get(id)){
  //         // list[room][id]++;
  //         // console.error("??????????");
  //         if(list[room][id] > 5 && argv[0] == "master"){
  //           await io.$.del(`${room}|${id}`);
  //         }else{
  //           await io.$.setCount(`${room}|${id}`, list[room][id]+1);
  //         }
  //       }
  //     }
  //   }
  // }
}

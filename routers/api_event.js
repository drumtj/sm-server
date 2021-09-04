module.exports = MD=>{
  const path = require('path');

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






  router.get("/get_event_user/:id", authAdmin, task(async (req, res)=>{
    let id = req.params.id;
    let user = await EventMember.findOne({_id:id}).populate("recommender").lean();
    res.json({
      status: "success",
      data: {user}
    })
  }))

  router.post("/get_event_users", authAdmin, task(async (req, res)=>{
    // if(!req.user.master){
    //   res.json({
    //     status: "fail",
    //     message: "권한이 없는 요청입니다."
    //   })
    //   return;
    // }

    // console.log(req.body);
    let {ids, offset, limit, curPage, fromEmail, email, name, approved, paid, removed} = req.body;

    let users;
    let query;

    // for(let o in query){
    //   if(query[o] === undefined){
    //     delete query[o];
    //   }
    // }

    let $and = [];

    if(email !== undefined){
      $and.push({email});
    }
    if(name !== undefined){
      $and.push({name:{$regex:`.*${name}.*`}});
    }
    if(approved !== undefined){
      $and.push({approved});
    }
    if(removed !== undefined){
      $and.push({removed});
    }

    if(ids){
      // query._id = ids;
      $and.push({_id:{$in:ids}});
    }

    if(paid !== undefined){
      if(paid){
        // $and.push({$and:[
        //   {paid:true},
        //   {$cond:[
        //     {recommender:null},
        //     true,
        //     "$recommenderPaid"
        //   ]}
        // ]})
        $and.push({$and:[
          {paid:true},
          {$or:[
            {$and:[
              {recommender:{$ne:null}},
              {recommenderPaid:true}
            ]},
            {$and:[
              {recommender:null},
              {recommenderPaid:false}
            ]},
          ]}
        ]})
      }else{
        $and.push({$or:[
          {paid:false},
          {$and:[
            {recommender:{$ne:null}},
            {recommenderPaid:false}
          ]}
        ]})
      }
    }

    if(fromEmail){
      let m = await EventMember.findOne({email:fromEmail}).select("_id");
      if(m){
        // query.recommender = m._id;
        $and.push({recommender:m._id});
      }
    }

    query = {$and};
    // if(email){
    //   query.email = email;
    // }
    //
    // if(allowed !== undefined){
    //   query.allowed = allowed
    // }

    if(curPage !== undefined){
      // 페이지가 설정되었으면, 그에 맞춰서 limit, offset 계산
      limit = 20;
      offset = curPage * limit;
    }else{
      // 페이지가 설정안되었다면. 전달된 limit, offset 사용
      // 전달된 limit, offset이 없으면 기본값사용
      if(limit === undefined){
        limit = 20;
      }
      if(offset === undefined){
        offset = 0;
      }

      curPage = offset / limit;
    }



    // 전체숫자는 limit되지 않은숫자여야하므로 이 count방법을 유지한다.
    let count = await EventMember.countDocuments(query);
    let pageLength = Math.ceil(count / limit);// 0 ~
    let maxPage = pageLength - 1;
    // console.log("account count", count);
    let startPage = Math.floor(curPage / config.PAGE_COUNT) * config.PAGE_COUNT;
    let endPage = Math.min(startPage + config.PAGE_COUNT-1, maxPage);

    console.log("query", query);

    users = await EventMember.find(query)
    // .select(["-password"])
    .sort({createdAt:-1})
    .limit(limit)
    .skip(offset)
    .populate("recommender")
    .lean();

    for(let i=0; i<users.length; i++){
      users[i].rCount = await EventMember.countDocuments({recommender:users[i]._id});
    }
    // console.log("clientIp", req.clientIp);
    //console.log("???", req.header('x-forwarded-for') || req.connection.remoteAddress);

    // 보유계정 카운트
    let result = users;
    // if(accountCounting){
    //   result = await Promise.all(users.map(async user=>{
    //     let count;
    //     try{
    //       count = await Account.countDocuments({user:user._id})
    //     }catch(e){
    //       console.error(e);
    //       count = 0;
    //     }
    //     // let _user = Object.assign({}, user._doc);
    //     // _user.accountCount = count;
    //     user.accountCount = count;
    //     // console.log(count);
    //     // return _user;
    //     return user;
    //   }));
    // }

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

  router.post("/update_event_user/:id", authAdmin, task(async (req, res)=>{
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

    // if(user.files){
    //   let member = await EventMember.findOne({_id:id}).lean();
    //   let files = member.files;
    //   user.files
    // }

    await EventMember.updateOne({_id:id}, user);
    res.json({
      status: "success"
    })
  }))

  router.get("/remove_event_user/:id", authAdmin, task(async (req, res)=>{

    let id = req.params.id;
    await EventMember.deleteOne({_id:id});

    res.json({
      status: "success"
    })
  }))

  router.get("/trash_event_user/:id", authAdmin, task(async (req, res)=>{

    let id = req.params.id;
    // await EventMember.deleteOne({_id:id});
    await EventMember.updateOne({_id:id}, {removed:true});

    res.json({
      status: "success"
    })
  }))

  function generateRewardMailHtml(price, code){
    return `<div dir="ltr"><img src="cid:complete" width="542" height="133" tabindex="0">
    <br><br>이벤트&nbsp; ${price}원 문화상품권&nbsp; : <span style="color:#0011ed">${code}</span>
    <br>저작권 © 2021 Skill Bit Limited. Skill은 Skill Ltd.의 등록 상표입니다. 판권 소유.<br><br>Skill Limited는 싱가포르 회사 번호 04260907로 등록되어 있으며 등록 사무소는 3 Ang Mo Kio Street 62, #08-16, 569139 에 있습니다. 전자 화폐 발행에 대해 2011 년 전자 화폐 규정 (FRN : 900001)에 따라 Financial Conduct Authority에서 승인 및 규제합니다.<br><br>당사는 각각 고유 한 태그가있는 하이퍼 링크가 포함 된 일부 이메일에서 쿠키 및 유사한 기술을 사용합니다. 이러한 정보는 귀하가 당사 이메일과 상호 작용하는 방식에 대해 조금 이해하는 데 도움이되며 향후 귀하와의 이메일 커뮤니케이션을 개선하는 데 사용됩니다. 이 이메일에 포함 된 링크를 클릭하면 당사 웹 사이트 사용을 추적 할 수 있습니다. 당사의 쿠키 및 유사 기술 사용에 대한 자세한 내용은 당사의 쿠키 공지 를 참조하십시오 .<br><br>귀하의 개인 정보를 보호하기 위해 최선을 다하고 있습니다. 더 자세한 정보 를 원하시면 개인 정보 보호 정책에 액세스하십시오 .<br><br>Skill 이메일이받은 편지함에 도착하도록하려면 이메일 수신 허용 목록에 <a href="mailto:no-reply@skill.com" target="_blank">no-reply@skill.com</a> 을 추가 하십시오.</div>`;
  }

  router.get("/pay_event_user/:id/:price/:code", authAdmin, task(async (req, res)=>{

    let id = req.params.id;
    let price = req.params.price;
    let code = req.params.code;

    let member = await EventMember.findOne({_id:id});
    if(!member){
      res.json({
        status: "fail",
        message: "가입정보를 찾을 수 없습니다."
      })
      return;
    }

    if(!member.approved){
      res.json({
        status: "fail",
        message: "먼저 승인처리가 돼야 지급할 수 있습니다."
      })
      return;
    }
    //#1 전달받은 쿠폰번호로 이메일 전송
    // let attachments = [{
    //   //http://158.247.221.211/assets/img/skill_bit_complete.png
    //   filename: 'skill_bit_complete.png',
    //   // path: path.resolve(__dirname, '..', 'public', 'assets', 'img'),
    //   path: "public/assets/img/skill_bit_complete.png",
    //   cid: 'complete'
    // }]
    // let info = await sendEmail(member.email, "SKILL BIT 회원가입 완료 되었습니다.", generateRewardMailHtml(price, code), attachments);
    // console.log(info);
    //#2 지급완료 처리
    await EventMember.updateOne({_id:id}, {paid:true, payCode:code, paidAt:new Date()});

    res.json({
      status: "success"
    })
  }))

  router.get("/pay_event_recomender/:id/:price/:code", authAdmin, task(async (req, res)=>{

    let id = req.params.id;
    let price = req.params.price;
    let code = req.params.code;

    let member = await EventMember.findOne({_id:id}).populate("recommender");
    if(!member){
      res.json({
        status: "fail",
        message: "가입정보를 찾을 수 없습니다."
      })
      return;
    }

    if(!member.approved){
      res.json({
        status: "fail",
        message: "먼저 승인처리가 돼야 지급할 수 있습니다."
      })
      return;
    }

    if(!member.recommender){
      res.json({
        status: "fail",
        message: "추천인 가입정보를 찾을 수 없습니다."
      })
      return;
    }

    if(!member.recommender.approved){
      res.json({
        status: "fail",
        message: "추천인이 승인처리가 안된 상태입니다."
      })
      return;
    }

    // let html = `<p>${price}원 문화상품권: ${code}</p>`;
    // //#1 전달받은 쿠폰번호로 이메일 전송
    // let info = await sendEmail(member.recommender.email, "SKILL BIT 추천인 이벤트 상품지급 되었습니다.", html);
    // console.log(info);
    //#2 지급완료 처리
    await EventMember.updateOne({_id:id}, {recommenderPaid:true, recommenderPayCode:code, recommenderPaidAt:new Date()});

    res.json({
      status: "success"
    })
  }))

  router.get("/approve_event_user/:id", authAdmin, task(async (req, res)=>{

    let id = req.params.id;

    await EventMember.updateOne({_id:id}, {approved:true, approvedAt:new Date()});

    res.json({
      status: "success"
    })
  }))



  router.get("/send_email_opentalk/:id", authAdmin, task(async (req, res)=>{
    let id = req.params.id;
    let member = await EventMember.findOne({_id:id});
    if(!member){
      res.json({
        status: "fail",
        message: "가입정보를 찾을 수 없습니다."
      })
      return;
    }

    member.sentOpentalk = true;
    await member.save();

    await sendMailOpentalk(member);

    // let attachments = [{
    //   filename: 'skill_bit_logo.jpg',
    //   path: "public/assets/img/skill_bit_logo.jpg",
    //   cid: 'complete'
    // },{
    //   filename: 'join_talk.jpg',
    //   path: "public/assets/img/join_talk.jpg",
    //   cid: 'talk'
    // }]
    //
    // let html = `
    // <img src="cid:complete" width="450" height="133"/>
    // <p><span style="color:blue">${member.name}</span>회원님 현재 1단계 인증 완료되었습니다.</p>
    // <p>카카오 채널로 연락 후 2단계 인증 완료하시면 이벤트 상금을 지급 받을 수 있습니다.</p>
    // <p>아래를 클릭하여 스킬비트 카카오 채널로 문의해주세요.</p>
    // <div>
    //   <a href="http://pf.kakao.com/_jJeCs" target="_blank">
    //     <img src="cid:talk" width="170"/>
    //   </a>
    // </div>
    // <p>본 이메일의 발신자 주소는 발신 전용으로 문의할 경우 회신 되지 않습니다.</p>
    // <p/>
    // <p>© ${new Date().getFullYear()} Jumio Corp. 판권 소유.</p>
    // <p>개인 정보 보호 정책</p>`;
    //
    // //#1 인증요청 이메일 전송
    // let info = await sendEmail(member.email, "SKILL BIT 거래소", html, attachments);
    // console.log(info);

    res.json({
      status: "success"
    })
  }))

  router.post("/request_approve_event_user/:id", authAdmin, task(async (req, res)=>{

    let id = req.params.id;
    let link = decodeURIComponent(req.body.link);
    // console.log(link);
    let member = await EventMember.findOne({_id:id});
    if(!member){
      res.json({
        status: "fail",
        message: "가입정보를 찾을 수 없습니다."
      })
      return;
    }

    let html = `
    <p><a href="${link}" target="_blank">&lt; 본인 확인 &gt;</a> 클릭 모바일에서 신원을 확인합니다.</p>
    <p>본 링크는 몇 분 후에 처리됩니다.</p>
    <p>본 이메일의 발신자 주소는 발신 전용으로 문의 할 경우 회신되지 않습니다.</p>
    <p/>
    <p>© ${new Date().getFullYear()} Jumio Corp. 판권 소유.</p>
    <p>개인 정보 보호 정책</p>`

    //#1 인증요청 이메일 전송
    let info = await sendMail(member.email, "SKILL BIT 본인 확인 링크", html);
    console.log(info);

    res.json({
      status: "success"
    })
  }))

}

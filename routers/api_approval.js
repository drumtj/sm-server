module.exports = MD=>{
  let {
    io,
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
    authAdmin,
    authMaster,
    task,
    deposit,
    approvalTask,
    refreshMoney
  } = MD;

  // for master
  router.post("/get_approvals", authMaster, task(async (req, res)=>{
    let {
      ids, offset, limit, curPage, email, user,
      type, status, level, populateChild
    } = req.body;
    let query = {user, type, status, level};

    for(let o in query){
      if(query[o] === undefined){
        delete query[o];
      }
    }

    if(ids){
      query._id = ids;
    }

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

    let populateObjList = [];
    let userPopulateObj = {
      path: 'user',
      model: User,
      options: {
        select: '-password'
      }
    };
    populateObjList.push(userPopulateObj)
    //
    if(email){
      userPopulateObj.match = {
        email: email
      }
    }

    if(populateChild){
      populateObjList.push({
        path: 'child',
        model: Approval
      })
    }

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

  // 관리자요청을 마스터가 반려
  router.post("/reject_approval/:id", authMaster, task(async (req, res)=>{
    let id = req.params.id;
    let ap = await Approval.findOne({_id:id})
    .populate({
      path: "account",
      model: Account
    })

    if(!ap){
      res.json({
        status: "fail",
        message: "승인내역을 찾을 수 없습니다."
      })
      return;
    }

    await ap.reject();
    // ap.status = 'reject';
    // await ap.save();

    // await Approval.updateOne({_id:id}, {status:'reject'});

    // 승인대기중을 출금 요청중으로
    if(ap.account){
      await ap.account.rejectDeposit();
      // await rejectDeposit(ap.account);
    }

    // 출금승인 요청이 반려된다고, 유저의 출금 요청이 지워질 필요가 없다.
    // 유저의 출금요청은 관리자가 반려했을때 지워야한다.

    // 승인대기중을 출금 요청중으로
    // let account = await Account.findOne({depositApproval:id});
    // if(account){
    //   await rejectDeposit(account);
    // }

    // emitToAdmin('menuBadge', {
    //   link: '/admin/accountManager',
    //   text: 'New'
    // });

    emitToAdmin('refreshTab', {
      link: "/admin/accountManager"
    });

    res.json({
      status: "success"
    })
  }))

  router.post("/ok_approval/:id", authMaster, task(async (req, res)=>{
    let id = req.params.id;

    let approval = await Approval.findOne({_id:id}).populate({
      path: "account",
      model: Account,
      options:{
        select:"user"
      },
      populate: {
        path: "user",
        model: User,
        options:{
          select:"email"
        }
      }
    });

    if(!approval){
      res.json({
        status: "fail",
        message: "승인내역을 찾을 수 없습니다."
      })
      return;
    }

    // 상태변경
    await approval.approval(approvalTask);
    // approval.status = 'approval';
    // await approval.save();

    // task실행
    // if(approval.tasks){
    //   for(let i=0; i<approval.tasks.length; i++){
    //     let task = approval.tasks[i];
    //     await approvalTask(task.com, task.data);
    //   }
    // }

    // approval.tasks.length = 0;
    // await approval.save();



    emitToAdmin('refreshTab', {
      link: "/admin/accountManager"
    });

    // if(approval.account && approval.account.user){
      emitToMember(approval.account.user.email, 'refreshTab', {
        link: ["/accountManager", "/depositHistory"]
      });
    // }

    res.json({
      status: "success"
    })
  }))
}

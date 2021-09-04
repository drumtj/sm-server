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

  router.get("/remove_option/:id", task(async (req, res)=>{
    let option = await Option.findOne({_id:req.params.id});
    if(option){
      option.remove();
    }
    // console.log("/get_option_list", options);
    res.json({
      status: "success"
    });
  }))

  router.get("/get_option_list", task(async (req, res)=>{
    let filter;
    if(!req.admin && !req.user.master){
      filter = {permission:'all'};
    }
    let options = await Option.find(filter).select(['name', 'permission']).lean();

    // console.log("/get_option_list", options);
    res.json({
      status: "success",
      data: options
    });
  }))

  router.post("/get_options", task(async (req, res)=>{
    let ids = req.body.ids;
    let options = await Option.find({_id:ids}).lean();
    // console.log(options);
    res.json({
      status: "success",
      data: options
    });
  }))

  router.post("/update_option/:id", authAdmin, task(async (req, res)=>{
    // console.error(req.body)
    let id = req.params.id;
    let option = req.body.option;

    // delete option._id;
    await Option.updateOne({_id:id}, option);
    // let option = await Option.findOne({_id:optionData._id});
    // option.name = optionData.name;
    // option.data = optionData.data;
    // await option.save();
    res.json({
      status: "success"
    })
  }))

  router.post("/regist_option", authAdmin, task(async (req, res)=>{
    let body = req.body;
    // console.log(body);
    let option = await Option.create({
      name: body.name,
      permission: body.data.permission,
      data: body.data
    });
    res.json({
      status: "success",
      data: option._id
    });
  }))

  // router.get("/get_options", task(async (req, res)=>{
  //   // console.log(req.session);
  //   let options = await Option.find({});
  //   res.json({
  //     status: "success",
  //     data: options
  //   });
  // }))
}

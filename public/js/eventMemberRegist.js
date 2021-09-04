console.log('event member regist.js');
(()=>{
  let $name = $("#form-name");
  let $date = $("#form-date");
  let $phone = $("#form-phone");
  let $email = $("#form-email");
  let $fromEmail = $("#form-from-email");
  let $picture1 = $("#form-picture1");
  let $picture2 = $("#form-picture2");
  let $picture3 = $("#form-picture3");
  let $check = $("#form-allow-check");
  // let $files = $("#form-album");
  // let $capture = $("#form-camera");
  let $password = $("#form-pw");
  let $password2 = $("#form-pw2");
  let spinner = Ladda.create($("#btn-register").get(0));

  let $imageContainer = $("#image-container");

  let $bankAccount = $("#form-bank-account");
  let $bank = $("#form-bank");

  async function init(){
    $(window).on("unload", e=>{
      console.error("unload");
      let name = $name.val();
      let phone = $phone.val();
      let date = $date.val();
      let email = $email.val();
      let fromEmail = $fromEmail.val();
      let files = getFiles();
      let bank = $bank.val();
      let bankAccount = $bankAccount.val();
      sessionData = {name, phone, email, fromEmail, date, bank, bankAccount};
      sessionStorage.setItem("sessiondata", JSON.stringify(sessionData));
    })

    setFormFromSessionData();

    $("#bank-select").on("change", e=>{
      $bank.prop("disabled", e.target.selectedIndex != 0);
      $bank.prop("placeholder", e.target.selectedIndex != 0 ? '' : '직접입력');
      $bank.val(e.target.selectedIndex==0 ? '' : e.target.value);
      // console.error(e.target.value);
    })

    function onFileSelect(e){
      // console.error(e.target.files);
      $imageContainer.html('');
      // let files = e.target.files;
      let files = getFiles();

      for(let i=0; i<files.length; i++){
        let src = URL.createObjectURL(files[i]);
        let img = new Image();
        img.src = src;
        $imageContainer.append(img);
      }
    }

    $picture1.on("change", onFileSelect);
    $picture2.on("change", onFileSelect);
    $picture3.on("change", onFileSelect);
    // $capture.on("change", onFileSelect);

    // $password2.on("input", e=>{
    //   let password = $password.val();
    //   let password2 = $password2.val();
    //
    //   if(!password || password !== password2){
    //     $password2.removeClass("border-success").addClass("border-danger");
    //   }else{
    //     $password2.toggleClass("border-danger").addClass("border-success");
    //   }
    // })

    $name.focus();

    $phone.on("keypress", onKeypressPhoneNumber);
    $phone.on("input", onInputPhoneNumber);

    $bankAccount.on("keypress", onKeypressPhoneNumber);

    $("#btn-register").on("click", e=>{
      register();
    })
  }

  function setFormFromSessionData(){
    let sessionData;
    try{
      sessionData = JSON.parse(sessionStorage.getItem("sessiondata"));
      console.error("sessionData", sessionData);
    }catch(e){

    }

    if(sessionData){
      if(sessionData.name) $name.val(sessionData.name);
      if(sessionData.date) $date.val(sessionData.date);
      if(sessionData.phone) $phone.val(sessionData.phone);
      if(sessionData.email) $email.val(sessionData.email);
      if(sessionData.fromEmail) $fromEmail.val(sessionData.fromEmail);
      if(sessionData.bank) $bank.val(sessionData.bank);
      if(sessionData.bankAccount) $bankAccount.val(sessionData.bankAccount);
    }
  }

  function onKeypressPhoneNumber(event){
    if(event.key === '-' || event.key >= 0 && event.key <= 9) {
      return true;
    }

    return false;
  }

  // let expPhone = expgen("#(#(#(-(#(#(#(#(-(#(#(#(#)?)?)?)?)?)?)?)?)?)?)?)?");
  let expPhone = expgen("(0(1(0(-(#(#(#(#(-(#(#(#(#)?)?)?)?)?)?)?)?)?)?)?)?)?");
  let expNum = expgen("#");
  function onInputPhoneNumber(event){
    // console.log("prev", this.dataset.temp);
    // console.log(this.value);
    // console.log(expPhone.test(this.value));
    let c = event.originalEvent.data;
    let f = expPhone.test(this.value);

    if(this.dataset.temp !== undefined && expPhone.test(this.dataset.temp+'-') && expNum.test(c)){
      this.value = this.dataset.temp + '-' + c;
    }else{
      if(!f){
        this.value = this.dataset.temp||'';
      }
    }
    this.dataset.temp = this.value;
  }



  function getFiles(){
    return [$picture1, $picture2, $picture3].map($el=>$el.get(0).files[0]).filter(a=>!!a)
    // let files = Array.from($files.get(0).files);
    // if(mobileAndTabletCheck()){
    //   files = files.concat(...Array.from($capture.get(0).files));
    // }
    // return files;
  }

  async function register(){
    let sessionData;


    let name = $name.val();
    let phone = $phone.val();
    let date = $date.val();
    let email = $email.val();
    let fromEmail = $fromEmail.val();
    // let password = $password.val();
    let files = getFiles();
    let bank = $bank.val();
    let bankAccount = $bankAccount.val();
    // console.error($check.get(0).checked);
    // return;
    // let password2 = $password2.val();
    // console.log(files);
    // return;


    let p = [
      [name, "이름을"],
      [phone, "핸드폰번호를", expgen("010-####-####"), "잘못된 핸드폰번호 형식입니다"],
      [date, "생년월일을"],
      [email, "이메일을", expgen('&email'), "잘못된 이메일 형식입니다"],
      // [password, "비밀번호를"],
      [bank, "은행을"],
      [bankAccount, "계좌번호를"]
    ]



    for(let i=0; i<p.length; i++){
      // let chk;
      // if(p[i][2] !== undefined){
      //   chk = p[i][2].test(p[i][0]);
      // }else{
      //   chk = !!p[i][0];
      // }
      // if(!chk){
      //   modal("알림", p[i][3]||(p[i][1] + " 입력해주세요"));
      //   return;
      // }

      if(!p[i][0]){
        modal("알림", p[i][1] + " 입력해주세요");
        return;
      }else if(p[i][2] !== undefined && !p[i][2].test(p[i][0])){
        modal("알림", p[i][3] || (p[i][1] + " 입력해주세요"));
        return;
      }
    }

    if(!expgen('&email').test(email)){
      modal("알림", "잘못된 이메일 형식입니다");
      return;
    }

    let today = new Date();
    let birthday = new Date(date);
    if(today.getFullYear() - birthday.getFullYear() < 18){
      modal("알림", "가입이 불가능한 나이입니다.");
      return;
    }

    if(files.length != 3){
      modal("알림", "사진 수량이 너무 적습니다. 신분증 앞, 뒤 사진과 신분증 들고 찍은 셀카를 올려주세요");
      return;
    }

    if(!$check.get(0).checked){
      modal("알림", "개인정보 수집 및 이용 동의를 확인해주세요.")
      return;
    }



    const formData = new FormData();
    for(let i=0; i<files.length; i++){
      formData.append("photos", files[i]);
    }
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("fromEmail", fromEmail);
    // formData.append("password", password);
    formData.append("birthday", date);
    formData.append("bank", bank);
    formData.append("bankAccount", bankAccount);




    // console.error({email, password});
    spinner.start();
    // axios.post('/event/regist/info', formData).then(res=>{
    let res;
    res = await axios({
      method: "post",
      url: '/event/member/regist/check',
      data: {email, name, birthday}
    })
    if(res.data.status == "success"){
      if(res.data.has == true){
        modal("알림", "이미 가입신청된 정보입니다.");
        spinner.stop();
        return;
      }
    }else{
      modal("알림", "확인 오류, 다시 시도해주세요.");
      spinner.stop();
      return;
    }

    res = await axios({
      method: "post",
      url: '/event/member/regist/upload',
      data: formData,
      headers: { "Content-Type": "multipart/form-data" }
    })
    // .then(res=>{
    if(res.data.status == "success"){
      $(".page-1").addClass("hide");
      $(".page-2").removeClass("hide");
      spinner.stop();
      // modal("알림", "가입신청이 완료됐습니다. 2단계 톡 인증을 진행해주세요.").then(()=>{
      //   $(".page-1").addClass("hide");
      //   $(".page-2").removeClass("hide");
      //   spinner.stop();
      //   // window.location.href = '/login';
      // })
    }else{
      modal("알림", res.data.message).then(()=>{
        spinner.stop();
      });
      console.error(res);
    }
    // })
  }

  // function setupSocket(){
  //   // socket.on("", ()=>{
  //   //
  //   // })
  //
  // }

  init();
  // appReadyResolve();
})()

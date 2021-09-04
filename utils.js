module.exports = {
  comma(n){
    // if(n === undefined) return "0";
    // n = n.toString();
    if(typeof n === "number"){
      n = n.toString();
    }else if(typeof n === "string"){
      // console.log("@", n);
      n = n.replace(/,/g,'');
      n = Number(n);
      // console.log("@@", n);
      if(isNaN(n)){
        return n = "0";
      }
      n = n.toString();
    }
    if(!n) return "0";



    let a = [], j=0;
    for(let i=n.length-1; i>=0; i--){
      a.unshift(n[i]);
      if(++j%3==0 && i>0){
        a.unshift(',');
      }
    }

    return a.join('');
  }
}

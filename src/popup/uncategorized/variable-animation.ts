export class Variable_Animation {
  time: number;
  type: string;
  start_n: number;
  end_n: number;
  startTime: number;
  nowTime: number;
  helps: string;
  data: number[];
  fl: boolean;

  constructor(time: number, type: string, data: number[], floor = false) {
    this.time = time;
    this.type = type;
    this.start_n = data[0];
    this.end_n = data[1];
    this.startTime = -1;
    this.nowTime = -1;
    this.helps = "";
    this.data = data;
    this.fl = Boolean(floor);
  }

  start(){
    this.startTime = Date.now();
  }
  current(){
    this.nowTime = Date.now();
    let ret = this.start_n;
    switch (this.type) {
      case "Normal":
        if((this.nowTime-this.startTime)/this.time < 1){
          ret = this.start_n+(this.end_n-this.start_n)/this.time*(this.nowTime-this.startTime);
          // 5+(9-5)/2000*(150000-149500)=6
        } else {
          ret = this.end_n;
        }
        break;
      case "bc_4":
        var t = (this.nowTime-this.startTime)/this.time;
        if(t>1)t=1;
        var tp = 1-t;
        ret = t*t*t*this.data[3] + 3*t*t*tp*this.data[2] + 3*t*tp*tp*this.data[1] + tp*tp*tp*this.data[0];
        break;
      case "bc_3":
        var t = (this.nowTime-this.startTime)/this.time;
        if(t>1)t=1;
        var tp = 1-t;
        ret = tp*tp*this.data[0] + 2*tp*t*this.data[1] + t*t*this.data[2];
        break;
      case "sliding":
        var tp = 1-(this.nowTime-this.startTime)/this.time;
        if(tp<0)tp=0;
        ret = this.start_n+Math.sqrt(1-Math.pow(tp,2))*(this.end_n-this.start_n);
        break;
      case "r_sliding":
        var tp = (this.nowTime-this.startTime)/this.time;
        if(tp>1)tp=1;
        ret = this.start_n+Math.sqrt(1-Math.pow(tp,2))*(this.end_n-this.start_n);
        break;
      case "sliding_3":
        var tp = 1-(this.nowTime-this.startTime)/this.time;
        if(tp<0)tp=0;
        ret = this.start_n+Math.sqrt(1-Math.pow(tp,3))*(this.end_n-this.start_n);
        break;
      default:
        console.error(`Variable_Animation/error: Unknown type!(${this.type})`);
        break;
    }
    if(this.startTime != -1){
      if(this.fl){
        return Math.floor(ret);
      } else {
        return ret;
      }
    } else {
      return this.start_n;
    }
  }
  reset(){
    this.nowTime = -1;
    this.startTime = -1;
  }
  help(){
    this.helps = "";
    this.helps += "";
    this.helps += "";
    this.helps += "";
    this.helps += "";
    this.helps += "";
    this.helps += "";
    this.helps += "";
    console.log(this.helps);
  }
}

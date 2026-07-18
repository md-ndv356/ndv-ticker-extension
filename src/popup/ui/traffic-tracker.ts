const tfMonitorBase = document.getElementById("tfMonitorBase") as HTMLDivElement;

export class TrafficTracker {
  #field;
  #timeInt = 0;
  #viewName = "";

  constructor (viewName: string, visible = true){
    const field = (this.#field = {
      item: document.createElement("div"),
      title: document.createElement("div"),
      time: document.createElement("div")
    });

    field.item.append(field.title, field.time);
    field.item.classList.add("tfMonitorItem");
    field.title.classList.add("tfMonitorTitle");
    field.time.classList.add("tfMonitorTime");
    tfMonitorBase.appendChild(field.item);
    field.title.textContent = this.#viewName = viewName;
    field.time.textContent = "---";
    field.item.style.display = visible ? "block" : "none";
  }

  update (){
    const target = new Date();
    this.#timeInt = target.getTime();
    this.#field.time.textContent =
      ("000" + target.getFullYear()).slice(-4) + "/" +
      ("0" + (target.getMonth() + 1)).slice(-2) + "/" +
      ("0" + target.getDate()).slice(-2) + " " +
      ("0" + target.getHours()).slice(-2) + ":" +
      ("0" + target.getMinutes()).slice(-2) + ":" +
      ("0" + target.getSeconds()).slice(-2) + "." +
      ("000" + target.getMilliseconds()).slice(-3);
  }

  get lastTime (){
    return this.#timeInt;
  }

  get visible (){
    return !(this.#field.item.style.display === "none");
  }

  set visible (flag){
    this.#field.item.style.display = flag ? "block" : "none";
  }

  get viewName (){
    return this.#viewName;
  }
}

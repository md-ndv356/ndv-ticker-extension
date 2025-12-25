import htmlTest from "./module";

export default () => {
  document.getElementById("app")!.innerHTML = htmlTest();
};

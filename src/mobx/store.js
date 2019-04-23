import { observable, action, computed, runInAction } from "mobx";
import io from "socket.io-client";
import { GetISSDistance } from "../utils";
import { getLoca, getIssPass } from "../api";

class issStore {
  @observable loca_lat = 0;
  @observable loca_lng = 0;
  @observable iss_lat = 0;
  @observable iss_lng = 0;
  @observable risetime = [];
  @observable duration = [];
  @observable risetimObsolete = false
  @observable iss_passing = false;

  constructor() {
    this.socket = io();
    this.init();
  }

  @action init = async () => {
    const loca = await getLoca();
    this.LocaChange({
      loca_lat: loca.lat,
      loca_lng: loca.lng
    });
    await this.ISSPassInfoChange();
    this.socket.on("issPositionChange", data => {
      this.ISSPositionChange({
        iss_lat: data.latitude,
        iss_lng: data.longitude
      });
      this.ISSPassingChange();
    });
  };

  @action
  LocaChange = payload => {
    this.loca_lat = payload.loca_lat;
    this.loca_lng = payload.loca_lng;
    this.socket.emit("join", {
      lat: this.loca_lat,
      lng: this.loca_lng
    });
  };
  @action
  ISSPositionChange = payload => {
    this.iss_lat = payload.iss_lat;
    this.iss_lng = payload.iss_lng;
  };
  @action
  ISSPassInfoChange = async () => {
    const IssPassInfo = await getIssPass({
      loca_lat: this.loca_lat,
      loca_lng: this.loca_lng
    });
    let duration = []
    let risetime = []
    IssPassInfo.response.map(i => {
      duration.push(i.duration * 1000)
      risetime.push(i.risetime * 1000)
    })
    this.risetime = risetime;
    this.duration = duration;
    this.risetimObsolete = false
  };
  @action
  ISSPassingChange = () => {
    let now = Date.now();
    this.iss_passing =
      this.risetime[0] - now < 0 &&
      this.risetime[0] + this.duration[0] - now > 0;
    if (this.iss_passing && !this.risetimObsolete) {
      this.risetimObsolete = true
    }
    // 接口有 BUG 在 ISS 经过当时请求之后的经过事件列表，返回信息缺少即将到来的最近一项，故做此处理
    if (now - this.risetime[0] + this.duration[0] > 1000 * 30) {
      this.ISSPassInfoChange()
    }
  };

  @computed get ISStoreInit() {
    return this.loca_lat * this.loca_lng * this.iss_lat * this.iss_lng;
  }
  @computed get ISSDistance() {
    return this.ISStoreInit
      ? GetISSDistance(
          this.loca_lat,
          this.loca_lng,
          this.iss_lat,
          this.iss_lng
        ).toFixed(2)
      : 0;
  }

  // @computed get ISSPassing() {
  //     return this.ISStoreInit
  //     ? this.risetime - new Date() < 0
  //     : false;
  // }
}
class uiStore {
  @observable menuOpen = false;
}
const ISSStore = new issStore();
const UItore = new uiStore();

export { ISSStore, UItore };

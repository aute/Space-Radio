import { observable, action, computed, runInAction } from "mobx";
import io from "socket.io-client";
import { GetISSDistance } from "../utils";
import { getLoca, getIssPass } from "../api";

class issStore {
  @observable loca_lat = 0;
  @observable loca_lng = 0;
  @observable iss_lat = 0;
  @observable iss_lng = 0;
  @observable risetime = 0;
  @observable duration = 0;
  @observable oldRisetime = 0;
  @observable oldDuration = 0;
  @observable iss_passing = false;

  constructor() {
    this.init();
  }

  @action init = async () => {
    const loca = await getLoca();
    this.LocaChange({
      loca_lat: loca.lat,
      loca_lng: loca.lng
    });
    const IssPassInfo = await getIssPass({
      loca_lat: this.loca_lat,
      loca_lng: this.loca_lng
    });
    this.ISSPassInfoChange({
      duration: IssPassInfo.response[0].duration * 1000,
      risetime: IssPassInfo.response[0].risetime * 1000
    });
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
    this.socket = io();
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
  ISSPassInfoChange = payload => {
    this.risetime = payload.risetime;
    this.duration = payload.duration;
  };
  @action
  ISSPassingChange = () => {
    let now = Date.now();
    this.iss_passing =
      this.oldRisetime - now < 0 &&
      this.oldRisetime + this.oldDuration - now > 0;
    if (!this.iss_passing && this.risetime !== this.oldRisetime) {
      this.oldRisetime = this.risetime;
      this.oldDuration = this.duration;
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

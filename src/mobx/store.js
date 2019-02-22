import { observable, action, computed } from "mobx";
import { GetISSDistance } from "../utils";
class ISSStore {
  @observable loca_lat = 0;
  @observable loca_lng = 0;
  @observable iss_lat = 0;
  @observable iss_lng = 0;
  @observable risetime = 0;
  @observable duration = 0;
  @observable oldRisetime = 0;
  @observable oldDuration = 0;
  @observable iss_passing = false;

  @action
  LocaChange = payload => {
    this.loca_lat = payload.loca_lat;
    this.loca_lng = payload.loca_lng;
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
    let now = Date.now()
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
          this.loca_lng,
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

export default new ISSStore();

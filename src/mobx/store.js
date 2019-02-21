import { observable, action, computed } from "mobx";
import { GetISSDistance } from "../utils";
class ISSStore {
  @observable loca_lat = 0;
  @observable loca_lng = 0;
  @observable iss_lat = 0;
  @observable iss_lng = 0;
  @observable risetime = 0;
  @observable duration = 0;

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
  ISSPassChange = payload => {
    this.risetime = payload.risetime;
    this.duration = payload.duration;
  };

  @computed get ISStoreInit() {
    return (
      this.loca_lat *
      this.loca_lng *
      this.iss_lat *
      this.iss_lng *
      this.risetime *
      this.duration
    );
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

  @computed get ISSPassing() {
      return this.ISStoreInit
      ? this.risetime - new Date() < 0
      : false;
      
  }
}

export default new ISSStore();

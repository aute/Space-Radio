import fetchJsonp from "fetch-jsonp";

/**
 * 获取本机地理位置信息
 * @returns {Promise<*>}
 */
export const getLoca = () => {
    // eslint-disable-next-line
    const geolocation = new qq.maps.Geolocation(
      "MPFBZ-TPZW4-AWOU3-XG2RL-3VE47-MSFIE",
      "Outer Space Radio"
    );
    return new Promise((resolve, reject) => {
      geolocation.getLocation(payload => {
        resolve({
          lat: payload.lat,
          lng: payload.lng
        });
      });
    });
};
  
/**
 * 获取 ISS 通过时间列表
 * @returns {Promise<*>}
 */
export const getIssPass = (payload) => {
    return fetchJsonp(
      `http://api.open-notify.org/iss-pass.json?lat=${payload.loca_lat}&lon=${
        payload.loca_lng
      }&`
    ).then(res => {
        return res.json()
    });
  };
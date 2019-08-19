export const GetDistance = (lat1, lng1, lat2, lng2) => {
  let radLat1 = (lat1 * Math.PI) / 180.0;
  let radLat2 = (lat2 * Math.PI) / 180.0;
  let a = radLat1 - radLat2;
  let b = (lng1 * Math.PI) / 180.0 - (lng2 * Math.PI) / 180.0;
  let s =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin(a / 2), 2) +
          Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)
      )
    );
  s = s * 6378.137; // EARTH_RADIUS;
  s = Math.round(s * 10000) / 10000;
  return s;
};

export const GetISSDistance = (lat1, lng1, lat2, lng2) => {
  let a = GetDistance(lat1, lng1, lat2, lng2)
  let b = 350
  return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2))
};


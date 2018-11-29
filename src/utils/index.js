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

export const getRule = (name) => {
  let rule;
  let ss = document.styleSheets;
  for (let i = 0; i < ss.length; ++i) {
    for (let x = 0; x < ss[i].cssRules.length; ++x) {
      rule = ss[i].cssRules[x];
      if (rule.name === name && rule.type === CSSRule.KEYFRAMES_RULE) {
        return rule
      }
    }
  }
};

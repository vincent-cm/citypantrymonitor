// https://stackoverflow.com/questions/365826/calculate-distance-between-2-gps-coordinates
// Convert two gps coordinates to distance
export function distanceInMiBetweenEarthCoordinates(lat1, lon1, lat2, lon2) {
  const earthRadiusMi = 3959;

  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  lat1 = degreesToRadians(lat1);
  lat2 = degreesToRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMi * c;
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function isInArray(el, array) {
  // Per spec, the way to identify NaN is that it is not equal to itself
  const findNaN = el !== el;
  let indexOf;

  if (!findNaN && typeof Array.prototype.indexOf === 'function') {
    indexOf = Array.prototype.indexOf;
  } else {
    indexOf = function(el) {
      let i = -1,
        index = -1;

      for (i = 0; i < array.length; i++) {
        const item = array[i];

        if ((findNaN && item !== item) || item === el) {
          index = i;
          break;
        }
      }
      return index;
    };
  }
  return indexOf.call(array, el) > -1;
}

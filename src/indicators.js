/**
 * @dev SMA
 * @param {*} dps
 * @param {*} count
 * @returns
 */
export function sma_inc(data, window) {
  const d1 = data.map((d) => d.close);
  var d2 = [];
  if (d1.length < window) {
    return d2;
  }
  var sum = 0;
  for (var i = 0; i < window; ++i) {
    sum += d1[i];
  }
  d2.push(sum / window);
  var steps = d1.length - window - 1;
  for (var i = 0; i < steps; ++i) {
    sum -= d1[i];
    sum += d1[i + window];
    d2.push(sum / window);
  }
  const diff = data.length - d2.length;
  const emptyArray = [...new Array(diff)].map((d) => '');
  const d3 = [...emptyArray, ...d2];
  const results = data.map((d, i) => ({...d, sma: d3[i]}));
  return results;
}

/**
 * @dev EMA
 * @param {*} mArray []
 * @param {*} mRange default 21
 * @returns
 */
function calculateEMA(mArray, mRange) {
  var k = 2 / (mRange + 1);
  // first item is just the same as the first item in the input
  let emaArray = [mArray[0]];
  // for the rest of the items, they are computed with the previous one
  for (var i = 1; i < mArray.length; i++) {
    emaArray.push(mArray[i] * k + emaArray[i - 1] * (1 - k));
  }
  return emaArray;
}
export const ema_inc = (data, mRange) => {
  const d1 = data.map((d) => d.close);
  const d3 = calculateEMA(d1, mRange);
  data = data.map((d, i) => ({...d, ema: d3[i]}));
  return data;
};

/**
 * Market for long short
 */
export const markers_inc = (data) => {
  //EMA21 CROSSOVER SMA100 - LONG
  //EMA21 CROSSUNDER SMA100 - SHORT
  data = data.map((d, i, arr) => {
    const long = arr[i]?.ema > arr[i]?.sma && arr[i - 1]?.ema < arr[i - 1]?.sma ? true : false;
    const short = arr[i]?.ema < arr[i]?.sma && arr[i - 1]?.ema > arr[i - 1]?.sma ? true : false;
    return {...d, long, short};
  });
  return data;
};

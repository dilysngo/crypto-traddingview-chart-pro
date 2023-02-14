import queryString from 'query-string';
import axios from '../curl/Axios';
import {sma_inc, ema_inc, markers_inc} from '../../indicators';
import {ROOT_API} from '../../constants/index';
import {createStorageTTL, MEDIUM_TTL} from './index';

/**
 * @dev
 * 1m 3m 5m 15m 30m 1h 2h 4h 6h 8h 12h 1d 3d 1w 1M
 * @param {*} params
 * @returns []
 */
export const getKlineData = async (params) => {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const cache_key = `m:k:${params.symbol.toLowerCase()}`; // m for ForecastLineCrypto , f for kline
        let data;

        const content = null; // getFromStorageTTL(cache_key)
        if (content !== null) {
          data = content;
        }

        // Ensure we have valid cached data
        if (data === undefined && params) {
          let result = null;
          try {
            const qStr = queryString.stringify(params);
            result = await (await fetch(`https://api.binance.com/api/v3/klines?${qStr}`)).json();
          } catch (err) {
            reject(err);
          }
          if (result && result?.length !== undefined) {
            let klinedata = result.map((d) => ({
              timestamp: d[0],
              open: d[1] * 1,
              high: d[2] * 1,
              low: d[3] * 1,
              close: d[4] * 1,
              volume: d[5] * 1,
              quote_volume: d[6] * 1,
              trader: d[7] * 1,
              turnover: ((d[1] * 1 + d[4] * 1 + d[2] * 1 + d[3] * 1) / 4) * d[5] * 1,
            }));
            klinedata = sma_inc(klinedata, 7);
            klinedata = ema_inc(klinedata, 21);
            klinedata = markers_inc(klinedata);
            data = klinedata;
            // createStorageTTL(cache_key, data, MEDIUM_TTL)
          }
        }
        resolve(data);
      } catch (err) {
        reject(err);
      }
    })();
  });
};

export const getForecastData = async (pairSymbol) => {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const cache_key = `m:f:${pairSymbol.symbol.toLowerCase()}`; // m for ForecastLineCrypto , f for forecast
        let data;

        const content = null; // getFromStorageTTL(cache_key)
        if (content !== null) {
          data = content;
        }

        // Ensure we have valid cached data
        if (data === undefined && pairSymbol) {
          let result = null;
          try {
            const formData = new FormData();
            Object.entries(pairSymbol).forEach(([key, value]) => {
              formData.append(key, value);
            });
            result = await axios({
              method: 'POST',
              url: `${ROOT_API}/forecast`,
              data: formData,
            });
          } catch (err) {
            reject(err);
          }
          if (result?.status === 200) {
            data = result.data;
            createStorageTTL(cache_key, data, MEDIUM_TTL);
          }
        }
        resolve(data);
      } catch (err) {
        reject(err);
      }
    })();
  });
};

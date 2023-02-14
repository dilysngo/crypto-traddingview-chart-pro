import React, {useState, useEffect, useRef} from 'react';
import {init, dispose, Chart, KLineData, TooltipShowRule, TooltipShowType, registerIndicator} from 'klinecharts';
import generatedDataList from '../generatedDataList';
import Layout from '../Layout';
import {getKlineData} from '../services/storage/chart';

const fruits = ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🍍', '🥥', '🥝', '🥭', '🥑', '🍏'];

interface EmojiEntity {
  emoji: number;
  text: string;
}

registerIndicator<EmojiEntity>({
  name: 'EMOJI',
  figures: [{key: 'emoji'}],
  calc: (kLineDataList) => {
    return kLineDataList.map((kLineData) => ({emoji: kLineData.close, text: fruits[Math.floor(Math.random() * 17)]}));
  },
  draw: ({ctx, barSpace, visibleRange, indicator, xAxis, yAxis}) => {
    const {from, to} = visibleRange;

    ctx.font = `${barSpace.gapBar}px Helvetica Neue`;
    ctx.textAlign = 'center';
    const result = indicator.result;
    for (let i = from; i < to; i++) {
      const data = result[i];
      const x = xAxis.convertToPixel(i);
      const y = yAxis.convertToPixel(data.emoji);
      ctx.fillText(data.text, x, y);
    }
    return false;
  },
});

function getTooltipOptions(candleShowType: TooltipShowType, candleShowRule: TooltipShowRule, indicatorShowRule: TooltipShowRule) {
  return {
    candle: {
      tooltip: {
        showType: candleShowType,
        showRule: candleShowRule,
        custom: (kLineData: KLineData) => {
          const change = ((kLineData.close - kLineData.open) / kLineData.open) * 100;
          return [
            {title: 'open', value: kLineData.open.toFixed(2)},
            {title: 'close', value: kLineData.close.toFixed(2)},
            {
              title: 'Change: ',
              value: {
                text: `${change.toFixed(2)}%`,
                color: change < 0 ? '#EF5350' : '#26A69A',
              },
            },
          ];
        },
      },
    },
    indicator: {
      tooltip: {
        showRule: indicatorShowRule,
      },
    },
  };
}

const getData = async (options: any) => {
  let klineData;
  try {
    klineData = await getKlineData(options);
  } catch (error) {}

  return klineData;
};

function updateData(chart: Chart | null) {
  setTimeout(() => {
    if (chart) {
      const dataList = chart.getDataList();
      const lastData = dataList[dataList.length - 1];
      const newData = generatedDataList(lastData.timestamp, lastData.close, 1)[0];
      newData.timestamp += 1000 * 60;
      chart.updateData(newData);
    }
    updateData(chart);
  }, 1000);
}

async function registerSocket(chart: Chart | null, options: any) {
  const binanceSocket = new WebSocket(`wss://stream.binance.com:9443/ws/${options.symbol.toLowerCase()}@kline_${options.interval}`);
  binanceSocket.onmessage = async function (event) {
    var message = JSON.parse(event.data);
    var candlestick = message.k;
    let forecastKline = {
      timestamp: candlestick.t / 1000,
      open: candlestick.o * 1,
      high: candlestick.h * 1,
      low: candlestick.l * 1,
      close: candlestick.c * 1,
      volume: candlestick.v * 1,
      turnover: ((candlestick.o * 1 + candlestick.close * 1 + candlestick.high * 1 + candlestick.low * 1) / 4) * candlestick.volume * 1,
    };

    chart?.updateData(forecastKline);
  };

  return binanceSocket;
}

const TIME_LIST = ['1m', '5m', '1h', '1d', '3d', '1w'];
const themes = [
  {key: 'dark', text: 'dark'},
  {key: 'light', text: 'light'},
];

const rules = [
  {key: 'always', text: 'always'},
  {key: 'follow_cross', text: 'follow_cross'},
  {key: 'none', text: 'none'},
];

const mainIndicators = ['MA', 'EMA', 'SAR'];
const subIndicators = ['VOL', 'MACD', 'KDJ'];

export default function Update() {
  const chart = useRef<Chart | null>(null);
  const paneId = useRef<string>('');
  const socket = useRef<any>(null);
  const [theme, setTheme] = useState('light');
  const [candleShowType, setCandleShowType] = useState('standard');
  const [candleShowRule, setCandleShowRule] = useState('always');
  const [indicatorShowRule, setIndicatorShowRule] = useState('always');

  const [params, setParams] = useState({
    symbol: 'BTCUSDT',
    interval: TIME_LIST[0],
    limit: '1000',
    // startTime: null, endTime: null
  });

  useEffect(() => {
    chart.current = init('update-k-line');
    if (chart.current) {
      chart.current.createIndicator('MA', false, {id: 'candle_pane'});
      chart.current.createIndicator('KDJ', false, {height: 80});
      paneId.current = chart.current.createIndicator('VOL', false) as string;

      // loadmore
      chart.current.loadMore((timestamp) => {
        setTimeout(async () => {
          const firstData = chart.current?.getDataList()[0];
          if (firstData) {
            const data = await getData({
              ...params,
              endTime: timestamp,
            });
            chart.current?.applyMoreData(data, true);
          }
        }, 1000);
      });
    }

    return () => {
      dispose('update-k-line');
    };
  }, []);

  useEffect(() => {
    (async () => {
      const data = await getData(params);
      chart.current?.applyNewData(data);
      socket.current = await registerSocket(chart.current, params);
    })();

    return () => {
      socket.current?.close();
    };
  }, [params]);

  useEffect(() => {
    chart.current?.setStyles(theme);
  }, [theme]);

  useEffect(() => {
    chart.current?.setStyles(getTooltipOptions(candleShowType as TooltipShowType, candleShowRule as TooltipShowRule, indicatorShowRule as TooltipShowRule));
  }, [candleShowType, candleShowRule, indicatorShowRule]);

  return (
    <Layout title="Realtime Chart" style={theme === 'dark' ? {backgroundColor: '#1f2126'} : {}}>
      <div className="time">
        {/* 1m 3m 5m 15m 30m 1h 2h 4h 6h 8h 12h 1d 3d 1w 1M */}
        <button className="btn-pair-currency">BTCUSDT</button>
        {TIME_LIST.map((time) => {
          return (
            <button
              key={time}
              onClick={() => setParams((prev) => ({...prev, interval: time}))}
              style={{color: params.interval === time ? '#fff' : '', background: params.interval === time ? '#6c6c6c' : ''}}
            >
              {time}
            </button>
          );
        })}
      </div>

      <div id="update-k-line" className="k-line-chart" />

      <div className="k-line-chart-menu-container">
        <span style={{paddingRight: 10}}>Theme</span>
        {themes.map(({key, text}) => {
          return (
            <button
              key={key}
              onClick={(_) => {
                setTheme(key);
                document.body.setAttribute('theme', text)
              }}
            >
              {text}
            </button>
          );
        })}
      </div>
      <div className="k-line-chart-menu-container">
        <span style={{paddingRight: 10}}>Tooltip</span>
        <button
          onClick={(_) => {
            setCandleShowType('standard');
          }}
        >
          Show
        </button>
        <button
          onClick={(_) => {
            setCandleShowType('rect');
          }}
        >
          Hide
        </button>
      </div>
      <div className="k-line-chart-menu-container">
        <span style={{paddingRight: 10}}>K-line Price</span>
        {rules.map(({key, text}) => {
          return (
            <button
              key={key}
              onClick={(_) => {
                setCandleShowRule(key as TooltipShowRule);
              }}
            >
              {text}
            </button>
          );
        })}
      </div>
      <div className="k-line-chart-menu-container">
        <span style={{paddingRight: 10}}>EMA</span>
        {rules.map(({key, text}) => {
          return (
            <button
              key={key}
              onClick={(_) => {
                setIndicatorShowRule(key as TooltipShowRule);
              }}
            >
              {text}
            </button>
          );
        })}
      </div>
      {/* Indicator volume */}
      <div className="k-line-chart-menu-container">
        <span style={{paddingRight: 10}}>EMA Chart</span>
        {mainIndicators.map((type) => {
          return (
            <button
              key={type}
              onClick={(_) => {
                chart.current?.createIndicator(type, false, {id: 'candle_pane'});
              }}
            >
              {type}
            </button>
          );
        })}
        <button
          onClick={(_) => {
            chart.current?.createIndicator('EMOJI', true, {id: 'candle_pane'});
          }}
        >
          Emoij
        </button>
        <span style={{paddingRight: 10, paddingLeft: 12}}>Volume Chart</span>
        {subIndicators.map((type) => {
          return (
            <button
              key={type}
              onClick={(_) => {
                chart.current?.createIndicator(type, false, {id: paneId.current});
              }}
            >
              {type}
            </button>
          );
        })}
        <button
          onClick={(_) => {
            chart.current?.createIndicator('EMOJI', false, {id: paneId.current});
          }}
        >
          Emoij
        </button>
      </div>
    </Layout>
  );
}

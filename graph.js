var canvas1 = document.getElementById('stage1');
var canvas2 = document.getElementById('stage2');
var canvas3 = document.getElementById('stage3');
const outputElement = document.getElementById('output_csv');

async function getCsvGraph() {
  var date = new Date();    // Dateオブジェクトを作成
  var a = date.getTime();   // UNIXタイムスタンプを取得する (ミリ秒単位)
  var curr_time = Math.floor( a / 1000 );  // UNIXタイムスタンプを取得する (秒単位)
  var tt = curr_time - 3600*24   // 24時間前

  const res = await fetch(`https://airoco.necolico.jp/data-api/day-csv?id=CgETViZ2&subscription-key=6b8aa7133ece423c836c38af01c59880&startDate=${tt}`);
  const raw_data = await res.text();
  console.log(raw_data);
  const sensorDataMap = convertArray(raw_data);

  co2data = [];
  tempdata = [];
  RHdata = [];
  // センサごとにグラフのデータを設定するループ---ここから---
  for(let senserId in sensorDataMap){
    const sensorData = sensorDataMap[senserId];
    for(let row of sensorData){
      row[3] -= curr_time;
    }
    const color = getColorForSensor(senserId); // センサに応じて色を取得
    // CO2濃度の設定 (発展課題1-2)
    co2data.push({
      label: senserId,
      data: sensorData.map(row => ({x: row[3], y:row[0]})),
      borderColor: color,
      showLine: true
    });
    // 温度の設定 (発展課題1-2)
    tempdata.push({
      label: senserId,
      data: sensorData.map(row => ({x: row[3], y:row[1]})),
      borderColor: color,
      showLine: true
    });
    // 湿度の設定 (発展課題1-2)
    RHdata.push({
      label: senserId,
      data: sensorData.map(row => ({x: row[3], y:row[2]})),
      borderColor: color,
      showLine: true
    });
  }
  // センサごとにグラフのデータを設定するループ---ここまで---

  var co2Chart = drawGraph(canvas1, co2data, 'CO2 濃度 [ppm]');
  var tempChart = drawGraph(canvas2, tempdata, '気温 [deg]');
  var RHChart = drawGraph(canvas3, RHdata, '相対湿度 [%]');
};

function drawGraph(canv, datasets, ylabel) {
  var chart = new Chart(canv, {
    type: 'scatter',
    data: {
      datasets: datasets
    },
    options: {
      elements: {
         point:{
          radius: 0
        },
      },
      plugins: {
        legend: {
          display: true // 凡例を表示 (発展課題1-2)
        }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: '時間 [s]',
            font: {
              size: 14,
            }
          }
        },
        y: {
          title: {
            display: true,
            text: ylabel,
            font: {
              size: 14,
            }
          }
        },
      },
    }
  });
  return chart;
}

// CSVテキストデータをセンサごとにデータ配列に変換する関数 (発展課題1-2)
function convertArray(data) {
  const sensorMap = {};
  const dataString = data.split('\r\n');
  for (let i = 0; i < dataString.length; i++) {
    var row = dataString[i].split(',');

    // 指定センサのみデータを抽出
    if (row[1] == 'Ｒ３ー４０１' || row[1] == 'Ｒ３ー４０３' || row[1] == 'Ｒ３ー３０１'){
      var id = row[1];
      if(!sensorMap.hasOwnProperty(id)){
        sensorMap[id] = [];
      }
      const values = row.slice(3, 7).map(parseFloat);
      sensorMap[id].push(values);
    }
  }
  return sensorMap;
}

// センサIDに応じてグラフで使用する線の色を返す関数 (発展課題1-2)
function getColorForSensor(senserId){
  const colorMap = {
    'Ｒ３ー４０１': '#E41A1C',    // 赤
    'Ｒ３ー４０３': '#377EB8',    // 青
    'Ｒ３ー３０１': '#4DAF4A',    // 緑
    'Ｒ３ー４Ｆ_ＥＨ': '#984EA3', // 紫
    'Ｒ３ー３Ｆ_ＥＨ': '#FF7F00', // オレンジ
    'Ｒ３ー１Ｆ_ＥＨ': '#A65628', // 茶
    'Ｒ３ーB１Ｆ_ＥＨ': '#999999' // グレー
  }
  return colorMap[senserId] || '#000000'; // 該当しないIDの場合は黒を指定
}

getCsvGraph();

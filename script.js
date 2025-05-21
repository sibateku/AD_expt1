// しきい値[ppm]
const THRESHOLD = 1000;
// CSVファイルのパス
const csvFiles = [
  { path: 'observed.csv', label: '計測データ', color: '#E41A1C' },
  { path: 'predicted.csv', label: '予測データ', color: '#377EB8' }
];

// 全CSVを読み込んで結合
Promise.all(csvFiles.map(file =>
  fetch(file.path)
    .then(res => res.text())
    .then(text => {
      const lines = text.trim().split('\n');
      const timestamps = [];
      const values = [];
      for (let i = 1; i < lines.length; i++) {
        const [time, value] = lines[i].split(',');
        timestamps.push(time);
        values.push(Number(value));
      }
      return {
        label: file.label,
        timestamps: timestamps,
        values: values,
        color: file.color
      };
    })
)).then(results => {
  // 全体のX軸（時間）の結合・重複除去・ソート
  const allLabels = [...new Set(results.flatMap(r => r.timestamps))].sort();

  const datasets = results.map(r => {
    // 全ラベルに対応するデータ（該当がなければnull）を並べる
    const data = allLabels.map(label => {
      const idx = r.timestamps.indexOf(label);
      return idx !== -1 ? r.values[idx] : null;
    });

    return {
      label: r.label,
      data: data,
      borderColor: r.color,
      spanGaps: false,   // nullは線でつながない
      tension: 0.3,
      fill: false
    };
  });

  drawChart(allLabels, datasets);
}).catch(error => {
  console.error('CSV読み込みエラー:', error);
});

// グラフ描画
function drawChart(labels, datasets) {
  const ctx = document.getElementById('co2Chart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: '時間'
          }
        },
        y: {
          title: {
            display: true,
            text: 'CO2濃度 (ppm)'
          },
          beginAtZero: true
        }
      }
    }
  });
}

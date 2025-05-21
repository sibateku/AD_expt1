const THRESHOLD = 656; // しきい値（ppm）

const csvFiles = [
  { path: 'observed.csv', label: '計測データ', color: '#E41A1C' },
  { path: 'predicted.csv', label: '予測データ', color: '#377EB8' }
];

Promise.all(csvFiles.map(file =>
  fetch(file.path)
    .then(res => res.text())
    .then(text => {
      const lines = text.trim().split('\n').slice(1); // ヘッダー除去

      const entries = lines.map(line => {
        const [time, value] = line.split(',');
        return { time, value: Number(value) };
      });

      // ソート（昇順）
      entries.sort((a, b) => new Date(a.time) - new Date(b.time));

      return {
        label: file.label,
        entries: entries,
        color: file.color
      };
    })
)).then(results => {
  // 観測データと予測データを分離
  const observed = results.find(r => r.label === '計測データ');
  const predicted = results.find(r => r.label === '予測データ');

  // 両データを結合
  const allLabels = [...observed.entries.map(e => e.time), ...predicted.entries.map(e => e.time)];
  const observedData = [...observed.entries.map(e => e.value), ...new Array(predicted.entries.length).fill(null)];
  const predictedData = [...new Array(observed.entries.length).fill(null), ...predicted.entries.map(e => e.value)];

  // グラフ描画
  drawChart(allLabels, [
    {
      label: observed.label,
      data: observedData,
      borderColor: observed.color,
      spanGaps: false,
      tension: 0.3,
      fill: false
    },
    {
      label: predicted.label,
      data: predictedData,
      borderColor: predicted.color,
      spanGaps: false,
      tension: 0.3,
      fill: false
    }
  ]);

  // しきい値チェック
  const exceeded = predicted.entries.some(e => e.value > THRESHOLD);
  const alertBox = document.getElementById('alert');
  if (exceeded) {
    alertBox.textContent = `⚠️ 警告：予測されたCO2濃度がしきい値(${THRESHOLD}ppm)を超えています。`;
    alertBox.style.color = 'red';
  } else {
    alertBox.textContent = `✔️ 予測されたCO2濃度は正常範囲内です（しきい値：${THRESHOLD}ppm）。`;
    alertBox.style.color = 'green';
  }

}).catch(error => {
  console.error('CSV読み込みエラー:', error);
});

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

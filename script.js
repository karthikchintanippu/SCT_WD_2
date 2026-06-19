

document.addEventListener('DOMContentLoaded', () => {

  
  const displayMain     = document.getElementById('displayMain');
  const displayMs       = document.getElementById('displayMs');
  const statusLabel     = document.getElementById('statusLabel');
  const ringProgress    = document.getElementById('ringProgress');
  const ticksContainer  = document.getElementById('watchTicks');

  const startPauseBtn   = document.getElementById('startPauseBtn');
  const startPauseIcon  = document.getElementById('startPauseIcon');
  const startPauseLabel = document.getElementById('startPauseLabel');
  const lapBtn          = document.getElementById('lapBtn');
  const resetBtn        = document.getElementById('resetBtn');

  const lapsList        = document.getElementById('lapsList');
  const lapsEmpty       = document.getElementById('lapsEmpty');
  const lapsTableHead   = document.getElementById('lapsTableHead');
  const lapCount        = document.getElementById('lapCount');

 
  let startTime = 0;        
  let elapsedBeforePause = 0;
  let isRunning = false;
  let rafId = null;
  let laps = [];            

  const RING_CIRCUMFERENCE = 678.6;
  const RING_FULL_LAP_MS = 60000;   

  
  function buildTicks() {
    const total = 60;
    const radius = 120; 
    for (let i = 0; i < total; i++) {
      const angle = (i / total) * 360;
      const isMajor = i % 5 === 0;
      const tick = document.createElement('div');
      tick.className = 'watch__tick' + (isMajor ? ' watch__tick--major' : '');
      tick.style.transform = `rotate(${angle}deg) translate(0, ${radius - 14}px)`;
      ticksContainer.appendChild(tick);
    }
  }
  buildTicks();

  
  function formatTime(totalMs) {
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const centis = Math.floor((totalMs % 1000) / 10);

    const pad = (n, len = 2) => String(n).padStart(len, '0');

    return {
      main: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
      ms: `.${pad(centis)}`
    };
  }

  
  function getElapsed() {
    if (!isRunning) return elapsedBeforePause;
    return elapsedBeforePause + (performance.now() - startTime);
  }

  function tick() {
    const elapsed = getElapsed();
    const { main, ms } = formatTime(elapsed);
    displayMain.textContent = main;
    displayMs.textContent = ms;

  
    const progressInCycle = (elapsed % RING_FULL_LAP_MS) / RING_FULL_LAP_MS;
    const offset = RING_CIRCUMFERENCE - (progressInCycle * RING_CIRCUMFERENCE);
    ringProgress.style.strokeDashoffset = offset;

    if (isRunning) {
      rafId = requestAnimationFrame(tick);
    }
  }

 
  function start() {
    isRunning = true;
    startTime = performance.now();

    startPauseIcon.textContent = '⏸';
    startPauseLabel.textContent = 'Pause';
    startPauseBtn.classList.add('is-running');

    statusLabel.textContent = 'Running';
    statusLabel.classList.add('is-running');
    statusLabel.classList.remove('is-paused');

    lapBtn.disabled = false;
    resetBtn.disabled = false;

    rafId = requestAnimationFrame(tick);
  }

  function pause() {
    isRunning = false;
    elapsedBeforePause = getElapsed();
    cancelAnimationFrame(rafId);

    startPauseIcon.textContent = '▶';
    startPauseLabel.textContent = 'Resume';
    startPauseBtn.classList.remove('is-running');

    statusLabel.textContent = 'Paused';
    statusLabel.classList.remove('is-running');
    statusLabel.classList.add('is-paused');
  }

  function toggleStartPause() {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }

  
  function reset() {
    isRunning = false;
    cancelAnimationFrame(rafId);
    elapsedBeforePause = 0;
    startTime = 0;
    laps = [];

    displayMain.textContent = '00:00:00';
    displayMs.textContent = '.00';
    ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE;

    startPauseIcon.textContent = '▶';
    startPauseLabel.textContent = 'Start';
    startPauseBtn.classList.remove('is-running');

    statusLabel.textContent = 'Ready';
    statusLabel.classList.remove('is-running', 'is-paused');

    lapBtn.disabled = true;
    resetBtn.disabled = true;

    renderLaps();
  }

  
  function recordLap() {
    const totalMs = getElapsed();
    const previousTotal = laps.length > 0 ? laps[laps.length - 1].totalMs : 0;
    const splitMs = totalMs - previousTotal;

    laps.push({ splitMs, totalMs });
    renderLaps();
  }

  function renderLaps() {
    lapsList.innerHTML = '';

    if (laps.length === 0) {
      lapsTableHead.hidden = true;
      lapCount.textContent = '';
      const empty = document.createElement('li');
      empty.className = 'laps__empty';
      empty.id = 'lapsEmpty';
      empty.textContent = 'No laps recorded yet — start the stopwatch and tap Lap to mark a split.';
      lapsList.appendChild(empty);
      return;
    }

    lapsTableHead.hidden = false;
    lapCount.textContent = `${laps.length} ${laps.length === 1 ? 'lap' : 'laps'}`;

   
    let fastestIdx = -1, slowestIdx = -1;
    if (laps.length > 1) {
      const splits = laps.map(l => l.splitMs);
      const minSplit = Math.min(...splits);
      const maxSplit = Math.max(...splits);
      fastestIdx = splits.indexOf(minSplit);
      slowestIdx = splits.indexOf(maxSplit);
    }

 
    laps.forEach((lap, idx) => {
      const row = document.createElement('li');
      row.className = 'lap-row';
      if (idx === fastestIdx) row.classList.add('lap-row--fastest');
      if (idx === slowestIdx) row.classList.add('lap-row--slowest');

      const split = formatTime(lap.splitMs);
      const total = formatTime(lap.totalMs);

      row.innerHTML = `
        <span class="lap-row__num">Lap ${idx + 1}</span>
        <span class="lap-row__split">${split.main}${split.ms}</span>
        <span class="lap-row__total">${total.main}${total.ms}</span>
      `;
      lapsList.insertBefore(row, lapsList.firstChild);
    });
  }

  
  startPauseBtn.addEventListener('click', toggleStartPause);
  lapBtn.addEventListener('click', recordLap);
  resetBtn.addEventListener('click', reset);

  t
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      toggleStartPause();
    } else if ((e.key === 'l' || e.key === 'L') && !lapBtn.disabled) {
      recordLap();
    } else if ((e.key === 'r' || e.key === 'R') && !resetBtn.disabled) {
      reset();
    }
  });


  ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE;

});

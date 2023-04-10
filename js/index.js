let running = false;
let state = false;
let timer = false;
let seconds; 
let timeDiff;
let chosenTime;
let paused;
let savedArr = localStorage.getItem('saved') ? localStorage.getItem('saved').split(',') : [];
let saldo = localStorage.getItem('saldo') ? localStorage.getItem('saldo') : 0;

const onBeforeUnload = (e) => {
    e.preventDefault();
    e.returnValue = '';
    localStorage.setItem('timer', seconds);
    localStorage.setItem('timestampLeave', Date.now());
    localStorage.setItem('saved', savedArr);
};

const onLoad = () => {
    document.getElementById('stop').innerHTML = labelStartPauseButton();
    const oldTime = parseInt(localStorage.getItem('timestampLeave'));
    const now = Date.now();
    timeDiff = oldTime ? Math.floor((now - oldTime) / 1000) : 0;
    seconds = localStorage.getItem('timer') ? localStorage.getItem('timer') - timeDiff : 0;
    
    const savedTimes = localStorage.getItem('saved');
    const resultEl = document.getElementById('results');
    savedTimes.split(',').map( ( item ) => {
        const valueNode = item !== '' && document.createTextNode(item);
        valueNode && resultEl.appendChild(document.createElement('div')).appendChild(valueNode);
    });
}

const onBlur = () => {
    localStorage.setItem('timer', seconds);
    localStorage.setItem('timestampLeave', Date.now());
}

const onVisibilityChange = () => {
    const oldTime = parseInt(localStorage.getItem('timestampLeave'));
    const now = Date.now();
    timeDiff = oldTime ? Math.floor((now - oldTime) / 1000) : 0;
    seconds = localStorage.getItem('timer') ? localStorage.getItem('timer') - timeDiff : 0;
}

window.addEventListener('beforeunload', onBeforeUnload);
window.addEventListener('load', onLoad);
window.addEventListener('blur', onBlur);
window.addEventListener('visibilitychange', onVisibilityChange);

function start(){ 
    document.getElementById('wrapper').classList.add('pulse');
     
    if (localStorage.getItem('timer') && !paused) {
        seconds = localStorage.getItem('timer') - timeDiff;
    }
    else if (localStorage.getItem('timer')) {
        seconds = localStorage.getItem('timer')
    }
    else {
        seconds = parseInt(document.getElementById('set-hours').value) * 3600 + parseInt(document.getElementById('set-minutes').value) * 60 + parseInt(document.getElementById('set-seconds').value);
    }
    timer = setInterval(runTimer, 1000);

    running = true; 
    closeModal();
    document.getElementById('stop').innerHTML = labelStartPauseButton();
    if (document.getElementById('chosen-time').innerText === '') {
        document.getElementById('chosen-time').innerText = parseTime(seconds);
        chosenTime = parseTime(seconds);
    }
}

function reset() {
    seconds = 0; 
    document.getElementById('set-hours').value = 0; 
    document.getElementById('set-minutes').value = 0; 
    document.getElementById('set-seconds').value = 0; 

    document.getElementById('time').innerHTML = seconds;
    document.getElementById('times-up').innerHTML = '';
    localStorage.removeItem('timer');
    state = 'reset';
    document.getElementById('chosen-time').innerText = '';
}

function openDialog() {
    document.getElementById('count-dialog').setAttribute('open', 'open');
    document.getElementById('overlay').setAttribute('style', 'display: block');
}

const labelStartPauseButton = () => {
   
    return running ? ' <span class="material-symbols-outlined">pause</span>Pausa' : '<span class="material-symbols-outlined">play_arrow</span>Starta';
}

function pause() {
    if (running) {
        document.getElementById('wrapper').classList.remove('pulse');
        clearInterval(timer);
        localStorage.setItem('timer', seconds);
        document.getElementById('stop').innerHTML = '<span class="material-symbols-outlined">play_arrow</span>Starta';
        running = false;
        paused = true;
    }
    else {
        start();
        document.getElementById('stop').innerHTML = '<span class="material-symbols-outlined">pause</span>Pausa';
        paused = false;
    }
}

function timesUp() {
    sploink();
}

function sploink () {
	let sploink = new Audio('sploink.mp3');
	sploink.play();
}

function parseTime(timeInSeconds) {
    const minutes = timeInSeconds/ 60;
    const hours = minutes / 60;
    
    displaySecondsPos = timeInSeconds% 60 < 10 ? '0' + Math.floor(timeInSeconds% 60) : Math.floor(timeInSeconds% 60);
    displaySecondsNeg = timeInSeconds% 60 > -10 ? '0' + Math.ceil(timeInSeconds% 60).toString().replace('-', '') : Math.ceil(timeInSeconds% 60).toString().replace('-', '');

    displayMinutesPos = minutes % 60 < 10 ? '0' + Math.floor(minutes % 60) : Math.floor(minutes % 60);
    displayMinutesNeg = minutes % 60 > -10 ? '0' + Math.ceil(minutes % 60).toString().replace('-', '') : Math.floor(minutes % 60).toString().replace('-', '');

    displayHoursPos = Math.floor(hours) < 10 ? '0' + Math.floor(hours) : Math.floor(hours);
    displayHoursNeg = Math.ceil(hours) > -10 ? '0' + Math.ceil(hours).toString().replace('-', '') : Math.ceil(hours).toString().replace('-', '');

    const secondsToTimePos = '-' + displayHoursPos + ':' + displayMinutesPos + ':' + displaySecondsPos;
    const secondsToTimeNeg = displayHoursNeg + ':' + displayMinutesNeg + ':' + displaySecondsNeg;

    return timeInSeconds> 0 ? secondsToTimePos : secondsToTimeNeg;
}

function runTimer() {   
    parseTime(seconds);    
    document.getElementById('time').innerHTML = parseTime(seconds);
    
    seconds === 0 && timesUp();
    seconds--;   
}

function stopTimer(timer) {
    clearInterval(timer);
    document.getElementById('chosen-time').innerText = '';
    running = false;
    document.getElementById('wrapper').classList.remove('pulse');
}

function closeModal() {
    document.getElementById('count-dialog').removeAttribute('open');
    document.getElementById('overlay').removeAttribute('style');
}

function save(value) { 
    if (seconds !== 0) {
        saldo += seconds;  
        localStorage.setItem('saldo', saldo);

        document.getElementById('saldo').innerHTML = parseTime(saldo);
        savedArr.push(value);
        
        const now = new Date();
        const nowDate = now.getDate() + '/' + parseInt(now.getMonth() + 1) + '/' + new Date().getFullYear();
       
        const valueNode = document.createTextNode(nowDate + ': ' + value);
        const resultEl = document.getElementById('results');
        stopTimer(timer);
        if (seconds > 0) {
            document.getElementById('saldo').classList.add('pos');
            document.getElementById('saldo').classList.remove('neg');
        }
        else {
            document.getElementById('saldo').classList.add('neg');
            document.getElementById('saldo').classList.remove('pos');
        }
        document.getElementById('stop').innerHTML = '<span class="material-symbols-outlined">play_arrow</span>Starta';
        reset();
       
        setTimeout( () => {
            document.getElementById('resetResults').setAttribute('style', 'display: block');
            resultEl.appendChild(document.createElement('div')).appendChild(valueNode);
            document.getElementById('saldo').setAttribute('style', 'display: block');
            
        }, 500);
    }
    else {
        return false;
    }
}

function resetResults() {
    setTimeout( () => {
        document.getElementById('saldo').removeAttribute('style');
        document.getElementById('resetResults').removeAttribute('style');
        document.getElementById('results').innerHTML = '';
    }, 300);
    localStorage.removeItem('saved');
    localStorage.removeItem('saldo');
    saldo = 0;
    savedArr = [];
}
let running = false;
let state = false;
let timer = false;
let seconds; 
let timeDiff;

const onBeforeUnload = (e) => {
    e.preventDefault();
    e.returnValue = '';
    localStorage.setItem('timer', seconds);
    localStorage.setItem('timestampLeave', Date.now());
};

const onLoad = () => {
    console.log(running);
    document.getElementById('stop').innerText = labelStartPauseButton();
    const oldTime = parseInt(localStorage.getItem('timestampLeave'));
    const now = Date.now();
    timeDiff = oldTime ? Math.floor((now - oldTime) / 1000) : 0;
    seconds = localStorage.getItem('timer') ? localStorage.getItem('timer') - timeDiff : 0;
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
     
    if (localStorage.getItem('timer')) {seconds = localStorage.getItem('timer') - timeDiff;}
    else {
        seconds = parseInt(document.getElementById('set-hours').value) * 3600 + parseInt(document.getElementById('set-minutes').value) * 60 + parseInt(document.getElementById('set-seconds').value);
    }
    timer = setInterval(runTimer, 1000);
    running = true; 
    closeModal();
    document.getElementById('stop').innerText = labelStartPauseButton();
    document.getElementById('chosen-time').innerText = parseTime();
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
}

function openDialog() {
    document.getElementById('count-dialog').setAttribute('open', 'open');
    document.getElementById('overlay').setAttribute('style', 'display: block');
}

const labelStartPauseButton = () => {
    return running ? 'Pausa' : 'Starta';
}

function pause() {
    if (running) {
        document.getElementById('wrapper').classList.remove('pulse');
        clearInterval(timer);
        localStorage.setItem('timer', seconds);
        document.getElementById('stop').innerText = 'Starta';
        running = false;
    }
    else {
        start();
        document.getElementById('stop').innerText = 'Pausa';
    }
}

function timesUp() {
    document.getElementById('times-up').innerHTML = seconds.toString().replace('-', '');
    document.getElementById('times-up').innerHTML = 'Klart!';
    sploink();
}

function sploink () {
	let sploink = new Audio('sploink.mp3');
	sploink.play();
}

function parseTime() {
    const minutes = seconds / 60;
    const hours = minutes / 60;
    
    displaySecondsPos = seconds % 60 < 10 ? '0' + Math.floor(seconds % 60) : Math.floor(seconds % 60);
    displaySecondsNeg = seconds % 60 > -10 ? '0' + Math.ceil(seconds % 60).toString().replace('-', '') : Math.ceil(seconds % 60).toString().replace('-', '');

    displayMinutesPos = minutes % 60 < 10 ? '0' + Math.floor(minutes % 60) : Math.floor(minutes % 60);
    displayMinutesNeg = minutes % 60 > -10 ? '0' + Math.ceil(minutes % 60).toString().replace('-', '') : Math.floor(minutes % 60).toString().replace('-', '');

    displayHoursPos = Math.floor(hours) < 10 ? '0' + Math.floor(hours) : Math.floor(hours);
    displayHoursNeg = Math.ceil(hours) > -10 ? '0' + Math.ceil(hours).toString().replace('-', '') : Math.ceil(hours).toString().replace('-', '');

    const secondsToTimePos = '-' + displayHoursPos + ':' + displayMinutesPos + ':' + displaySecondsPos;
    const secondsToTimeNeg = displayHoursNeg + ':' + displayMinutesNeg + ':' + displaySecondsNeg;

    return seconds > 0 ? secondsToTimePos : secondsToTimeNeg;
}

function runTimer() {   
    parseTime();    
    document.getElementById('time').innerHTML = parseTime();
    
    seconds === 0 && timesUp();
    seconds--;   
}

function stopTimer(timer) {
    clearInterval(timer);
}

function closeModal() {
    document.getElementById('count-dialog').removeAttribute('open');
    document.getElementById('overlay').removeAttribute('style');
}

function save(value) {
    console.log('value ', value);
    document.getElementById('result').innerText = value;
    stopTimer(timer);
    reset();
}
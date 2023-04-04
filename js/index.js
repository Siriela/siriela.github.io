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
    running = true;  
    if (localStorage.getItem('timer')) {seconds = localStorage.getItem('timer') - timeDiff;}
    else {
        seconds = parseInt(document.getElementById('set-hours').value) * 3600 + parseInt(document.getElementById('set-minutes').value) * 60 + parseInt(document.getElementById('set-seconds').value);
    }
    timer = setInterval(startTimer, 1000);
    closeModal();
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

function stopp() {
    document.getElementById('wrapper').classList.remove('pulse');

    running = false;
    clearInterval(timer);
    localStorage.setItem('timer', seconds);
}

function resume() {
    if (!running) {
        start();
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

function startTimer() {   
    const minutes = seconds / 60;
    const hours = minutes / 60;
    
    displaySeconds = seconds % 60 < 10 ? '0' + Math.floor(seconds % 60) : Math.floor(seconds % 60);
    displayMinutes = minutes % 60 < 10 ? '0' + Math.floor(minutes % 60) : Math.floor(minutes % 60);
    displayHours = Math.floor(hours) < 10 ? '0' + Math.floor(hours) : Math.floor(hours);
    
    const secondsToTime = displayHours + ':' + displayMinutes + ':' + displaySeconds;
    document.getElementById('time').innerHTML = seconds > 0 ? secondsToTime : seconds.toString().replace('-', '');
    
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
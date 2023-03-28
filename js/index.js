let running = false;
let state = false;
let timer = false;
let seconds = localStorage.getItem('timer') ? localStorage.getItem('timer') : 0;

const beforeUnloadListener = () => {
    localStorage.setItem('timer', seconds);
};

//window.addEventListener("beforeunload", beforeUnloadListener);



function start(){   
    //if (localStorage.getItem('timer')) { seconds = localStorage.getItem('timer')};
    if (localStorage.getItem('timer')) {seconds = localStorage.getItem('timer');}
    else {
        seconds = parseInt(document.getElementById('set-hours').value) * 3600 + parseInt(document.getElementById('set-minutes').value) * 60 + parseInt(document.getElementById('set-seconds').value);
    }
    timer = setInterval(startTimer, 1000);
    closeModal();
    
}

window.addEventListener('freeze', beforeUnloadListener);



function reset() {
    seconds = 0; //parseInt(document.getElementById('set-hours').value) * 3600 + parseInt(document.getElementById('set-minutes').value) * 60 + parseInt(document.getElementById('set-seconds').value);
    document.getElementById('set-hours').value = 0; 
    document.getElementById('set-minutes').value = 0; 
    document.getElementById('set-seconds').value = 0; 

    document.getElementById('time').innerHTML = seconds;
    document.getElementById('times-up').innerHTML = '';
    localStorage.removeItem('timer');
    state = 'reset';
}

function openDialog() {
    console.log('sdf');
    document.getElementById('count-dialog').setAttribute('open', 'open').setAttribute('style', 'display: flex');
    document.getElementById('overlay').setAttribute('style', 'display: block');
}

function stopp() {
    document.getElementById('start-stop').classList.remove('running');
    clearInterval(timer);
    localStorage.setItem('timer', seconds);
    
    
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
    displaySeconds = seconds % 60;
    displayMinutes = minutes % 60;

    document.getElementById('time').innerHTML = seconds > 0 ? Math.floor(hours) + ':' + Math.floor(displayMinutes) + ':' + displaySeconds : seconds.toString().replace('-', '');
    seconds === 0 && timesUp();
    seconds--;   
}

function stopTimer(timer) {
    console.log('stop');
    clearInterval(timer);
}

function closeModal() {
    document.getElementById('count-dialog').removeAttribute('open');
    document.getElementById('overlay').removeAttribute('style');
}
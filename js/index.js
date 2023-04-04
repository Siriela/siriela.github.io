let running = false;
let state = false;
let timer = false;
let seconds; // = localStorage.getItem('timer') ? localStorage.getItem('timer') : 0;
let timeDiff;

const unloadListener = (e) => {
    e.preventDefault();
    e.returnValue = '';
    localStorage.setItem('timer', seconds);
    localStorage.setItem('timestampLeave', Date.now());
};

const onLoad = (e) => {
    const oldTime = parseInt(localStorage.getItem('timestampLeave'));
    const now = Date.now();
    timeDiff = oldTime ? Math.floor((now - oldTime) / 1000) : 0;
  
    seconds = localStorage.getItem('timer') ? localStorage.getItem('timer') - timeDiff : 0;
    console.log('load');
}

const onBlur = () => {
    console.log('blur', seconds);
    localStorage.setItem('timer', seconds);
    localStorage.setItem('timestampLeave', Date.now());
}

const onFocus = () => {
    console.log('focus', seconds);

    const oldTime = parseInt(localStorage.getItem('timestampLeave'));
    const now = Date.now();
    timeDiff = oldTime ? Math.floor((now - oldTime) / 1000) : 0;
  
    seconds = localStorage.getItem('timer') ? localStorage.getItem('timer') - timeDiff : 0;
   
}

const onVisibilityChange = () => {
    // if (document.hidden) {
    //     console.log('hidden', seconds);
    //     localStorage.setItem('timestampLeave', Date.now());
    //     localStorage.setItem('timer', seconds);
    // }
    // else {
        const oldTime = parseInt(localStorage.getItem('timestampLeave'));
        const now = Date.now();
        timeDiff = oldTime ? Math.floor((now - oldTime) / 1000) : 0;
    
        seconds = localStorage.getItem('timer') ? localStorage.getItem('timer') - timeDiff : 0;
        console.log('not-hidden', seconds);
   // };
    
}

//window.addEventListener("beforeunload", beforeUnloadListener);

function start(){ 

    document.getElementById('wrapper').classList.add('pulse');
    
    running = true;  
    console.log('start ', running);
    //if (localStorage.getItem('timer')) { seconds = localStorage.getItem('timer')};
    if (localStorage.getItem('timer')) {seconds = localStorage.getItem('timer') - timeDiff;}
    else {
        seconds = parseInt(document.getElementById('set-hours').value) * 3600 + parseInt(document.getElementById('set-minutes').value) * 60 + parseInt(document.getElementById('set-seconds').value);
    }
    timer = setInterval(startTimer, 1000);
    closeModal();
    
}

// window.addEventListener('beforeunload', unloadListener);
window.addEventListener('beforeunload', unloadListener);
window.addEventListener('load', onLoad);
window.addEventListener('blur', onBlur);
//document.addEventListener('focus', onFocus);
document.addEventListener('visibilitychange', onVisibilityChange);
window.addEventListener("disconnect", (event) => {
    console.log('disconnect window');
});

document.addEventListener("disconnect", (event) => {
    console.log('disconnect document');
});


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
    document.getElementById('count-dialog').setAttribute('open', 'open');
    document.getElementById('overlay').setAttribute('style', 'display: block');
}

function stopp() {

    document.getElementById('wrapper').classList.remove('pulse');

    running = false;
    console.log('stop ', running);
    document.getElementById('start-stop').classList.remove('running');
    clearInterval(timer);
    localStorage.setItem('timer', seconds);
}

function resume() {
    console.log('resume ', running);
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
    displaySeconds = seconds % 60;
    displayMinutes = minutes % 60;

    document.getElementById('time').innerHTML = seconds > 0 ? Math.floor(hours) + ':' + Math.floor(displayMinutes) + ':' + displaySeconds : seconds.toString().replace('-', '');
    seconds === 0 && timesUp();
    seconds--;   
    //console.log(Date(Date.now()));
}

function stopTimer(timer) {
    console.log('stop');
    clearInterval(timer);
}

function closeModal() {
    document.getElementById('count-dialog').removeAttribute('open');
    document.getElementById('overlay').removeAttribute('style');
}
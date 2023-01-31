//import module
//import localStorage from 'localStorage';
// const jsdom = require("jsdom");
// const { JSDOM } = jsdom;

// constructor function to create a storage directory inside our project for all our localStorage setItem.
//global.document = new JSDOM(html).window.document;
let running;
let timer = running ? setInterval(startTimer, 1000) : false;
let seconds = localStorage.getItem('timer') ? localStorage.getItem('timer') : window.getElementById('set-time').value;

window.onload = () => document.getElementById('time').innerHTML = seconds;

const beforeUnloadListener = () => {
    localStorage.setItem('timer', seconds);
};

window.addEventListener("beforeunload", beforeUnloadListener);

const start = () => {
    seconds = document.getElementById('set-time').value;
    running = true;
    timer = setInterval(startTimer, 1000);
    document.getElementById('start-stop').classList.add('running');
}

const reset = () => {
    seconds = document.getElementById('set-time').value;
    document.getElementById('time').innerHTML = seconds;
    document.getElementById('times-up').innerHTML = '';
}

const stopp = () => {
    document.getElementById('start-stop').classList.remove('running');
    clearInterval(timer);
    running = false;
}

const timesUp = () => {
    document.getElementById('times-up').innerHTML = seconds.toString().replace('-', '');
    document.getElementById('times-up').innerHTML = 'Klart!';
    sploink();
}

function sploink () {
	let sploink = new Audio('sploink.mp3');
	sploink.play();
}

const startTimer = () => {
    const minutes = seconds / 60;
    const hours = minutes / 60;
    displaySeconds = seconds % 60;
    displayMinutes = minutes % 60;

    seconds--;   
  
    document.getElementById('time').innerHTML = seconds > 0 ? Math.floor(hours) + ':' + Math.floor(displayMinutes) + ':' + displaySeconds : seconds.toString().replace('-', '');
    seconds === 0 && timesUp();
}

const stopTimer = (timer) => {
    console.log('stop');
    clearInterval(timer);
}
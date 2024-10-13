let recognition;
let currentSpokenText = '';
let currentAuthorGuess = '';
let isRecording = false;
let currentQuote;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const quoteId = urlParams.get('id');
  if (quoteId) {
    fetchQuote(quoteId);
  } else {
    console.error('No quote ID provided');
  }
  setupSpeechRecognition();
});

async function fetchQuote(quoteId) {
  const response = await fetch(`/api/quotes/${quoteId}`);
  const quote = await response.json();
  currentQuote = quote;
  document.getElementById('testArea').dataset.quoteId = quote.id;
}

function setupSpeechRecognition() {
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = function(event) {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        if (isRecording) {
          currentSpokenText += result[0].transcript + ' ';
        } else {
          currentAuthorGuess += result[0].transcript + ' ';
        }
        updateRecordingStatus();
      }
    };

    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      updateRecordingStatus('Error: ' + event.error);
    };

    recognition.onend = function() {
      if (isRecording) {
        recognition.start();
      }
    };

    const startButton = document.getElementById('startRecording');
    const stopButton = document.getElementById('stopRecording');
    const authorButton = document.getElementById('authorButton');
    const finishButton = document.getElementById('finishButton');
    const backButton = document.getElementById('backToList');

    startButton.addEventListener('click', () => {
      currentSpokenText = '';
      currentAuthorGuess = '';
      isRecording = true;
      recognition.start();
      startButton.style.display = 'none';
      stopButton.style.display = 'inline-block';
      authorButton.style.display = 'none';
      finishButton.style.display = 'none';
      updateRecordingStatus('Recording quote...');
      resetEvaluationPanel();
    });

    stopButton.addEventListener('click', () => {
      isRecording = false;
      recognition.stop();
      stopButton.style.display = 'none';
      authorButton.style.display = 'inline-block';
      finishButton.style.display = 'inline-block';
      updateRecordingStatus('Quote recording stopped. You can now record the author\'s name or finish.');
    });

    authorButton.addEventListener('click', () => {
      isRecording = false;
      currentAuthorGuess = '';
      recognition.start();
      authorButton.style.display = 'none';
      finishButton.style.display = 'inline-block';
      updateRecordingStatus('Recording author\'s name...');
    });

    finishButton.addEventListener('click', () => {
      recognition.stop();
      checkQuote(currentSpokenText.trim(), currentAuthorGuess.trim());
      startButton.style.display = 'inline-block';
      finishButton.style.display = 'none';
    });

    backButton.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  } else {
    console.error('Web Speech API is not supported in this browser');
    alert('Speech recognition is not supported in your browser. Please try using Google Chrome.');
  }
}

function updateRecordingStatus(message = '') {
  const statusElement = document.getElementById('recordingStatus');
  statusElement.textContent = message || `Recording in progress...`;
}

function resetEvaluationPanel() {
  const resultElement = document.getElementById('result');
  resultElement.innerHTML = '';
}

async function checkQuote(spokenText, authorGuess) {
  const testArea = document.getElementById('testArea');
  const quoteId = parseInt(testArea.dataset.quoteId);
  const response = await fetch('/api/check-quote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quoteId, spokenText, authorGuess }),
  });
  const result = await response.json();
  displayResult(result);
}

function displayResult(result) {
  const resultElement = document.getElementById('result');
  resultElement.innerHTML = `
    <p>Accuracy: ${result.accuracy}%</p>
    <p>${result.passed ? 'Passed!' : 'Try again!'}</p>
    <p>Your attempt: "${result.spokenText}"</p>
    <p>Correct quote: "${currentQuote.text}"</p>
    <p>Correct words: ${result.correctWords} out of ${result.totalWords}</p>
    <p>Author guess: ${result.authorGuess}</p>
    <p>Correct author: ${result.correctAuthor}</p>
    <p>${result.authorCorrect ? 'You got the author correct! (5% bonus added)' : 'Author incorrect. No bonus.'}</p>
  `;
  updateRecordingStatus('');

  if (result.passed && result.authorCorrect) {
    celebrateSuccess();
  }
}

function celebrateSuccess() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });

  // Create fireworks effect
  const duration = 5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
  }, 250);
}
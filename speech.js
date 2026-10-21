const synth = window.speechSynthesis;

const textToSpeech = (string) => {
  const voice = new SpeechSynthesisUtterance(string);
  voice.text = string;
  voice.lang = "en-US";
  voice.volume = 1;
  voice.rate = 1;
  voice.pitch = 1;
  synth.speak(voice);
};

const setupSpeechRecognition = () => {
  const inputField = document.getElementById("input");
  const listenButton = document.getElementById("listen-button");
  const speechStatus = document.getElementById("speech-status");
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!inputField || !listenButton || !speechStatus) {
    return;
  }

  if (!SpeechRecognition) {
    listenButton.disabled = true;
    speechStatus.textContent = "Voice input is not supported in this Chrome version.";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = true;

  let finalTranscript = "";
  let recognitionError = false;

  const setListening = (isListening) => {
    listenButton.classList.toggle("listening", isListening);
    listenButton.textContent = isListening ? "🛑 Stop" : "🎤 Listen";
    listenButton.setAttribute("aria-label", isListening ? "Stop voice input" : "Start voice input");
    listenButton.setAttribute("aria-pressed", String(isListening));
  };

  listenButton.addEventListener("click", () => {
    if (listenButton.classList.contains("listening")) {
      recognition.stop();
      return;
    }

    if (!navigator.onLine) {
      speechStatus.textContent = "The tablet is offline. Connect to the internet, then press Listen again.";
      return;
    }

    finalTranscript = "";
    recognitionError = false;
    try {
      recognition.start();
      speechStatus.textContent = "Listening... speak now.";
    } catch (error) {
      speechStatus.textContent = "Microphone is already starting. Please try again.";
    }
  });

  recognition.addEventListener("start", () => {
    setListening(true);
    speechStatus.textContent = "Listening... speak now.";
  });

  recognition.addEventListener("result", (event) => {
    let interimTranscript = "";

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const transcript = event.results[index][0].transcript;
      if (event.results[index].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    inputField.value = `${finalTranscript} ${interimTranscript}`.trim();
    speechStatus.textContent = interimTranscript ? "Hearing you..." : "Got it. Sending...";
  });

  recognition.addEventListener("end", () => {
    setListening(false);
    if (recognitionError) {
      return;
    }

    const message = finalTranscript.trim();

    if (message) {
      inputField.value = "";
      output(message);
      speechStatus.textContent = "Press Listen and speak again.";
    } else {
      speechStatus.textContent = "I did not hear anything. Press Listen and try again.";
    }
  });

  recognition.addEventListener("error", (event) => {
    recognitionError = true;
    setListening(false);
    const messages = {
      "not-allowed": "Microphone permission was blocked. Allow the microphone in Chrome and try again.",
      "service-not-allowed": "Chrome cannot access speech recognition. Check the site connection and try again.",
      "no-speech": "I did not hear anything. Press Listen and speak again.",
      "audio-capture": "No microphone was found. Check the robot tablet microphone.",
      "network": "Chrome could not reach its speech service. Connect the tablet to the internet and press Listen again.",
    };
    speechStatus.textContent = messages[event.error] || "Voice input failed. Press Listen and try again.";
  });

  window.addEventListener("online", () => {
    if (!listenButton.classList.contains("listening")) {
      speechStatus.textContent = "Internet connected. Press Listen and speak.";
    }
  });

  window.addEventListener("offline", () => {
    if (!listenButton.classList.contains("listening")) {
      speechStatus.textContent = "The tablet is offline. Voice input needs an internet connection.";
    }
  });
};

document.addEventListener("DOMContentLoaded", setupSpeechRecognition);
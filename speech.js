const synth = window.speechSynthesis;
let speechOutputUnlocked = false;

const textToSpeech = (string) => {
  if (!synth) {
    return;
  }

  if (typeof synth.cancel === "function") {
    synth.cancel();
  }

  if (typeof synth.resume === "function") {
    synth.resume();
  }

  const voice = new SpeechSynthesisUtterance(string);
  voice.text = string;
  voice.lang = "en-US";
  voice.volume = 1;
  voice.rate = 1;
  voice.pitch = 1;
  voice.onstart = () => {
    speechOutputUnlocked = true;
  };
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
  let microphonePermissionChecked = false;

  const setListening = (isListening) => {
    listenButton.classList.toggle("listening", isListening);
    listenButton.textContent = isListening ? "🛑 Stop" : "🎤 Listen";
    listenButton.setAttribute("aria-label", isListening ? "Stop voice input" : "Start voice input");
    listenButton.setAttribute("aria-pressed", String(isListening));
  };

  const checkMicrophonePermission = async () => {
    if (microphonePermissionChecked) {
      return true;
    }

    if (!window.isSecureContext && window.location.protocol !== "file:") {
      speechStatus.textContent = "Voice needs HTTPS or localhost in Chrome.";
      return false;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      microphonePermissionChecked = true;
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      microphonePermissionChecked = true;
      return true;
    } catch (error) {
      const messages = {
        "NotAllowedError": "Allow microphone permission for this site in Chrome.",
        "PermissionDeniedError": "Allow microphone permission for this site in Chrome.",
        "NotFoundError": "Chrome cannot find a microphone on this tablet.",
        "SecurityError": "Voice needs HTTPS or localhost in Chrome."
      };
      speechStatus.textContent = messages[error.name] || "Chrome could not open the microphone.";
      return false;
    }
  };

  listenButton.addEventListener("click", async () => {
    speechOutputUnlocked = true;
    if (synth && typeof synth.resume === "function") {
      synth.resume();
    }

    if (listenButton.classList.contains("listening")) {
      recognition.stop();
      return;
    }

    if (!navigator.onLine) {
      speechStatus.textContent = "The tablet is offline. Connect to the internet, then press Listen again.";
      return;
    }

    speechStatus.textContent = "Checking microphone permission...";
    if (!(await checkMicrophonePermission())) {
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
      "service-not-allowed": "Speech recognition is blocked here. Open this site over HTTPS or localhost.",
      "no-speech": "I did not hear anything. Press Listen and speak again.",
      "audio-capture": "No microphone was found. Check the robot tablet microphone.",
      "network": "Chrome speech service is unavailable. Check internet access and open the site over HTTPS.",
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
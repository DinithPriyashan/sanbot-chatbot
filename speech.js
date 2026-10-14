// Text to Speech

const synth = window.speechSynthesis;
let voiceRecognition = null;
let voiceModeEnabled = false;
let voiceRecognitionRunning = false;
let waitingForReply = false;

const textToSpeech = (string) => {
  if (voiceModeEnabled && voiceRecognition && voiceRecognitionRunning) {
    voiceRecognition.stop();
  }
  document.body.classList.add("is-speaking");

  let voice = new SpeechSynthesisUtterance(string);
  voice.text = string;
  voice.lang = "en-US";
  voice.volume = 1;
  voice.rate = 1;
  voice.pitch = 1; // Can be 0, 1, or 2
  voice.onend = () => {
    document.body.classList.remove("is-speaking");
    waitingForReply = false;
    if (voiceModeEnabled && typeof window.resumeVoiceInput === "function") {
      window.resumeVoiceInput();
    } else if (voiceModeEnabled && voiceRecognition && !voiceRecognitionRunning) {
      try {
        voiceRecognition.start();
      } catch (error) {
        if (error.name !== "InvalidStateError") {
          console.error("Could not resume voice input:", error);
        }
      }
    }
  };
  synth.speak(voice);
}

document.addEventListener("DOMContentLoaded", () => {
  const micButton = document.getElementById("mic-button");
  const inputField = document.getElementById("input");
  const voiceStatus = document.getElementById("voice-status");
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const androidBridge = window.Android;
  const nativeStart = androidBridge &&
    (androidBridge.startVoiceInput || androidBridge.startVoiceRecognition);
  const nativeStop = androidBridge &&
    (androidBridge.stopVoiceInput || androidBridge.stopVoiceRecognition);

  if (!SpeechRecognition && !nativeStart) {
    micButton.disabled = true;
    micButton.title = "Voice input is not supported in this browser";
    voiceStatus.innerText = "Voice input needs Chrome or Android WebView voice bridge support.";
    return;
  }

  if (!SpeechRecognition && nativeStart) {
    function setNativeListeningState(isListening) {
      voiceRecognitionRunning = isListening;
      micButton.classList.toggle("is-listening", isListening);
      document.body.classList.toggle("is-listening", isListening);
      micButton.setAttribute("aria-label", isListening ? "Stop voice input" : "Start voice input");
      micButton.title = isListening ? "Stop voice input" : "Start voice input";
    }

    function startVoiceRecognition() {
      if (!voiceModeEnabled || voiceRecognitionRunning || synth.speaking) {
        return;
      }

      try {
        nativeStart.call(androidBridge);
        setNativeListeningState(true);
        voiceStatus.innerText = "Listening continuously...";
      } catch (error) {
        setNativeListeningState(false);
        voiceStatus.innerText = "Could not start the tablet microphone.";
        console.error("Android voice input failed:", error);
      }
    }

    window.onNativeVoiceResult = (transcript) => {
      if (typeof transcript === "string" && transcript.trim() && !waitingForReply) {
        waitingForReply = true;
        inputField.value = transcript.trim();
        if (typeof nativeStop === "function") {
          nativeStop.call(androidBridge);
        }
        setNativeListeningState(false);
        sendMessage();
        voiceStatus.innerText = "Message received. Preparing reply...";
      }
    };

    window.onNativeVoiceError = (message) => {
      setNativeListeningState(false);
      voiceStatus.innerText = message || "Tablet voice input failed. Please try again.";
    };

    window.resumeVoiceInput = startVoiceRecognition;
    micButton.addEventListener("click", () => {
      if (voiceModeEnabled) {
        voiceModeEnabled = false;
        if (typeof nativeStop === "function") {
          nativeStop.call(androidBridge);
        }
        setNativeListeningState(false);
        voiceStatus.innerText = "Voice input paused. Click the microphone to resume.";
        return;
      }

      voiceModeEnabled = true;
      inputField.value = "";
      startVoiceRecognition();
    });

    voiceModeEnabled = true;
    setTimeout(startVoiceRecognition, 300);
    return;
  }

  const recognition = new SpeechRecognition();
  voiceRecognition = recognition;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  let finalTranscript = "";
  let silenceTimer = null;

  function submitVoiceMessage() {
    const message = inputField.value.trim();

    if (!message || waitingForReply) {
      return;
    }

    clearTimeout(silenceTimer);
    waitingForReply = true;
    inputField.value = message;
    finalTranscript = "";
    recognition.stop();
    sendMessage();
    voiceStatus.innerText = "Message received. Preparing reply...";
  }

  function restartSilenceTimer() {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(submitVoiceMessage, 3000);
  }

  micButton.addEventListener("click", () => {
    if (voiceModeEnabled) {
      voiceModeEnabled = false;
      clearTimeout(silenceTimer);
      if (voiceRecognitionRunning) {
        recognition.stop();
      }
      voiceStatus.innerText = "Voice input paused. Click the microphone to resume.";
      return;
    }

    voiceModeEnabled = true;
    finalTranscript = "";
    inputField.value = "";
    startVoiceRecognition();
  });

  function startVoiceRecognition() {
    if (!voiceModeEnabled || voiceRecognitionRunning || synth.speaking) {
      return;
    }
    window.resumeVoiceInput = startVoiceRecognition;

    try {
      recognition.start();
    } catch (error) {
      if (error.name !== "InvalidStateError") {
        voiceStatus.innerText = "Could not start the microphone. Please try again.";
      }
    }
  }

  recognition.onstart = () => {
    voiceRecognitionRunning = true;
    micButton.classList.add("is-listening");
    micButton.setAttribute("aria-label", "Stop voice input");
    micButton.title = "Stop voice input";
    voiceStatus.innerText = "Listening continuously...";
    document.body.classList.add("is-listening");
  };

  recognition.onresult = (event) => {
    let interimTranscript = "";

    for (let index = event.resultIndex; index < event.results.length; index++) {
      const transcript = event.results[index][0].transcript;
      if (event.results[index].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (!waitingForReply) {
      inputField.value = `${finalTranscript} ${interimTranscript}`.trim();
      if (inputField.value) {
        restartSilenceTimer();
        voiceStatus.innerText = "I'm listening... send when you finish speaking.";
      }
    }
  };

  recognition.onerror = (event) => {
    const messages = {
      "not-allowed": "Microphone access was denied. Allow microphone access and try again.",
      "audio-capture": "No microphone was found. Check your microphone and try again.",
      "no-speech": "No speech detected. Try again."
    };
    voiceStatus.innerText = messages[event.error] || "Voice input failed. Please try again.";

    if (event.error === "not-allowed") {
      voiceModeEnabled = false;
    }
  };

  recognition.onend = () => {
    voiceRecognitionRunning = false;
    document.body.classList.remove("is-listening");
    micButton.classList.remove("is-listening");

    if (voiceModeEnabled && !waitingForReply && finalTranscript.trim()) {
      restartSilenceTimer();
    } else if (voiceModeEnabled && !waitingForReply) {
      micButton.classList.add("is-listening");
      micButton.setAttribute("aria-label", "Stop voice input");
      micButton.title = "Stop voice input";
      if (!synth.speaking) {
        voiceStatus.innerText = "Listening continuously...";
        setTimeout(startVoiceRecognition, 150);
      } else {
        voiceStatus.innerText = "Speaking reply...";
      }
    } else if (!voiceModeEnabled) {
      micButton.setAttribute("aria-label", "Start voice input");
      micButton.title = "Start voice input";
    }

    if (!voiceModeEnabled && !voiceStatus.innerText.startsWith("Microphone") &&
      !voiceStatus.innerText.startsWith("No microphone") &&
      !voiceStatus.innerText.startsWith("No speech") &&
      !voiceStatus.innerText.startsWith("Voice input failed")) {
      voiceStatus.innerText = "Voice input paused. Click the microphone to resume.";
    }
  };

  // Start hands-free voice mode as soon as the page is ready.
  voiceModeEnabled = true;
  setTimeout(startVoiceRecognition, 300);
});
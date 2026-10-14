// Text to Speech

const synth = window.speechSynthesis;
let voiceRecognition = null;
let voiceModeEnabled = false;
let voiceRecognitionRunning = false;

const textToSpeech = (string) => {
  if (voiceModeEnabled && voiceRecognitionRunning) {
    voiceRecognition.stop();
  }

  let voice = new SpeechSynthesisUtterance(string);
  voice.text = string;
  voice.lang = "en-US";
  voice.volume = 1;
  voice.rate = 1;
  voice.pitch = 1; // Can be 0, 1, or 2
  voice.onend = () => {
    if (voiceModeEnabled && voiceRecognition && !voiceRecognitionRunning) {
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

  if (!SpeechRecognition) {
    micButton.disabled = true;
    micButton.title = "Voice input is not supported in this browser";
    voiceStatus.innerText = "Voice input is not supported in this browser.";
    return;
  }

  const recognition = new SpeechRecognition();
  voiceRecognition = recognition;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  let finalTranscript = "";

  micButton.addEventListener("click", () => {
    if (voiceModeEnabled) {
      voiceModeEnabled = false;
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

    inputField.value = `${finalTranscript} ${interimTranscript}`.trim();
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
    micButton.classList.remove("is-listening");

    if (finalTranscript.trim()) {
      sendMessage();
      finalTranscript = "";
      inputField.value = "";
    }

    if (voiceModeEnabled) {
      micButton.classList.add("is-listening");
      micButton.setAttribute("aria-label", "Stop voice input");
      micButton.title = "Stop voice input";
      if (!synth.speaking) {
        voiceStatus.innerText = "Listening continuously...";
        setTimeout(startVoiceRecognition, 150);
      } else {
        voiceStatus.innerText = "Speaking reply...";
      }
    } else {
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
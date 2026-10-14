// Text to Speech

const synth = window.speechSynthesis;

const textToSpeech = (string) => {
  let voice = new SpeechSynthesisUtterance(string);
  voice.text = string;
  voice.lang = "en-US";
  voice.volume = 1;
  voice.rate = 1;
  voice.pitch = 1; // Can be 0, 1, or 2
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
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  let finalTranscript = "";

  micButton.addEventListener("click", () => {
    if (micButton.classList.contains("is-listening")) {
      recognition.stop();
      return;
    }

    finalTranscript = "";
    inputField.value = "";
    recognition.start();
  });

  recognition.onstart = () => {
    micButton.classList.add("is-listening");
    micButton.setAttribute("aria-label", "Stop voice input");
    micButton.title = "Stop voice input";
    voiceStatus.innerText = "Listening...";
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
  };

  recognition.onend = () => {
    micButton.classList.remove("is-listening");
    micButton.setAttribute("aria-label", "Start voice input");
    micButton.title = "Start voice input";

    if (finalTranscript.trim()) {
      sendMessage();
      voiceStatus.innerText = "Message sent.";
    } else if (!voiceStatus.innerText.startsWith("Microphone") &&
      !voiceStatus.innerText.startsWith("No microphone") &&
      !voiceStatus.innerText.startsWith("No speech") &&
      !voiceStatus.innerText.startsWith("Voice input failed")) {
      voiceStatus.innerText = "";
    }
  };
});
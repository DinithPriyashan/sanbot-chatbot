# JavaScript Chatbot 

This is a very simple "chatbot" using nothing but JavaScript, HTML, & CSS. I put this in quotes because chatbots these days are way more complex - this is an exercise in vanilla JS loops and conditionals, not AI.

I hope it makes a good intro for anyone interested in chatbots and frontend fundamentals.

Enjoy!

[Demo](https://sylviapap.github.io/chatbot/)

[Blog post](https://dev.to/sylviapap/make-a-simple-chatbot-with-javascript-1gc)

## Voice input

Voice mode starts automatically when the page loads. Allow microphone access when
the browser asks, then speak naturally; each phrase is sent automatically and
the bot replies by voice. Click the microphone button to pause or resume
hands-free listening.

### Android WebView voice support

Android WebView does not consistently expose the browser Web Speech recognition
API, and mobile WebViews block automatic microphone/TTS startup until the user
touches the page. Tap the microphone button once to start voice mode. The host
app must expose a JavaScript bridge named `Android`, `AndroidVoice`, or
`VoiceBridge` with one of these start/stop method pairs:

```text
startVoiceInput() / stopVoiceInput()
startVoiceRecognition() / stopVoiceRecognition()
startListening() / stopListening()
```

After Android `SpeechRecognizer` returns a phrase, call:

```javascript
window.onNativeVoiceResult("recognized text");
```

For microphone or recognition failures, call
`window.onNativeVoiceError("error message")`. The page automatically uses this
bridge when the Web Speech API is unavailable. The WebView should also enable
JavaScript, DOM storage, microphone permission, and load this page over HTTPS
or from a secure local origin. For native TTS, expose `speakText(text)` (or
`speak(text)`) and call `window.onNativeSpeechEnded()` after Android TTS
finishes, so listening can resume.
Voice input uses the browser's Web Speech API, so it requires a browser that
supports speech recognition and works best when the app is served from
`localhost` or HTTPS.

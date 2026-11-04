import { onBeforeUnmount, onMounted, ref } from "vue";

export function useSpeechRecognition(onTranscript: (text: string) => void) {
  const supported = ref(false);
  const listening = ref(false);
  const interim = ref("");
  const error = ref<string | undefined>();
  let recognition: any;
  let transcript = "";

  onMounted(() => {
    const Ctor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!Ctor) return;
    recognition = new Ctor();
    recognition.lang = navigator.language || "en-GB";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (ev: any) => {
      transcript = Array.from(ev.results as ArrayLike<any>)
        .map(r => r[0]?.transcript ?? "")
        .join("")
        .trim();
      interim.value = transcript;
    };
    recognition.onerror = (ev: any) => {
      error.value = ev?.error ?? "unknown";
    };
    recognition.onend = () => {
      const text = transcript;
      listening.value = false;
      interim.value = "";
      transcript = "";
      if (text) onTranscript(text);
    };
    supported.value = true;
  });

  onBeforeUnmount(() => recognition?.abort());

  function start() {
    if (!recognition || listening.value) return;
    error.value = undefined;
    transcript = "";
    try {
      recognition.start();
      listening.value = true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  function stop() {
    if (listening.value) recognition?.stop();
  }

  function toggle() {
    if (listening.value) stop();
    else start();
  }

  return { supported, listening, interim, error, start, stop, toggle };
}

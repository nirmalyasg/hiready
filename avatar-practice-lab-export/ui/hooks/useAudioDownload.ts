// import { useRef, useState } from "react";
// import { convertWebMBlobToWav } from "../lib/audioUtils";

// function useAudioDownload() {
//   // Ref to store the MediaRecorder instance.
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   // Ref to collect all recorded Blob chunks.
//   const recordedChunksRef = useRef<Blob[]>([]);
//   const [audioUrl, setAudioUrl] = useState<string | null>(null);

//   /**
//    * Starts recording by combining the provided remote stream with
//    * the microphone audio.
//    * @param remoteStream - The remote MediaStream (e.g., from the audio element).
//    */
//   const startRecording = async (remoteStream: MediaStream) => {
//     let micStream: MediaStream;
//     try {
//       micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     } catch (err) {
//       console.error("Error getting microphone stream:", err);
//       // Fallback to an empty MediaStream if microphone access fails.
//       micStream = new MediaStream();
//     }

//     // Create an AudioContext to merge the streams.
//     const audioContext = new AudioContext();
//     const destination = audioContext.createMediaStreamDestination();

//     // Connect the remote audio stream.
//     try {
//       const remoteSource = audioContext.createMediaStreamSource(remoteStream);
//       remoteSource.connect(destination);
//     } catch (err) {
//       console.error(
//         "Error connecting remote stream to the audio context:",
//         err
//       );
//     }

//     // Connect the microphone audio stream.
//     try {
//       const micSource = audioContext.createMediaStreamSource(micStream);
//       micSource.connect(destination);
//     } catch (err) {
//       console.error(
//         "Error connecting microphone stream to the audio context:",
//         err
//       );
//     }

//     const options = { mimeType: "audio/webm" };
//     try {
//       const mediaRecorder = new MediaRecorder(destination.stream, options);
//       mediaRecorder.ondataavailable = (event: BlobEvent) => {
//         if (event.data && event.data.size > 0) {
//           recordedChunksRef.current.push(event.data);
//         }
//       };
//       // Start recording without a timeslice.
//       mediaRecorder.start();
//       mediaRecorderRef.current = mediaRecorder;
//     } catch (err) {
//       console.error("Error starting MediaRecorder with combined stream:", err);
//     }
//   };

//   /**
//    * Stops the MediaRecorder, if active.
//    */
//   const stopRecording = () => {
//     if (mediaRecorderRef.current) {
//       // Request any final data before stopping.
//       mediaRecorderRef.current.requestData();
//       mediaRecorderRef.current.stop();
//       mediaRecorderRef.current = null;
//     }
//   };

//   /**
//    * Initiates download of the recording after converting from WebM to WAV.
//    * If the recorder is still active, we request its latest data before downloading.
//    */
//   const downloadRecording = async () => {
//     // If recording is still active, request the latest chunk.
//     if (
//       mediaRecorderRef.current &&
//       mediaRecorderRef.current.state === "recording"
//     ) {
//       // Request the current data.
//       mediaRecorderRef.current.requestData();
//       // Allow a short delay for ondataavailable to fire.
//       await new Promise((resolve) => setTimeout(resolve, 100));
//     }

//     if (recordedChunksRef.current.length === 0) {
//       console.warn("No recorded chunks found to download.");
//       return;
//     }

//     // Combine the recorded chunks into a single WebM blob.
//     const webmBlob = new Blob(recordedChunksRef.current, {
//       type: "audio/webm",
//     });

//     try {
//       // Convert the WebM blob into a WAV blob.
//       const wavBlob = await convertWebMBlobToWav(webmBlob);
//       const url = URL.createObjectURL(wavBlob);

//       // Generate a formatted datetime string (replace characters not allowed in filenames).
//       const now = new Date().toISOString().replace(/[:.]/g, "-");

//       // Create an invisible anchor element and trigger the download.
//       const a = document.createElement("a");
//       a.style.display = "none";
//       a.href = url;
//       a.download = `realtime_agents_audio_${now}.wav`;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);

//       // Clean up the blob URL after a short delay.
//       setTimeout(() => URL.revokeObjectURL(url), 100);
//     } catch (err) {
//       console.error("Error converting recording to WAV:", err);
//     }
//   };
//   /**
//    * Generates a blob URL to use in an <audio> player.
//    */
//   const generatePlaybackUrl = async () => {
//     if (mediaRecorderRef.current?.state === "recording") {
//       mediaRecorderRef.current.requestData();
//       await new Promise((resolve) => setTimeout(resolve, 100));
//     }

//     if (recordedChunksRef.current.length === 0) {
//       console.warn("No recorded chunks found to play.");
//       return;
//     }

//     const webmBlob = new Blob(recordedChunksRef.current, {
//       type: "audio/webm",
//     });

//     try {
//       const wavBlob = await convertWebMBlobToWav(webmBlob);
//       const url = URL.createObjectURL(wavBlob);
//       setAudioUrl(url);
//     } catch (err) {
//       console.error("Error creating playback URL:", err);
//     }
//   };

//   return {
//     startRecording,
//     stopRecording,
//     downloadRecording,
//     generatePlaybackUrl,
//     audioUrl,
//   };
// }

// export default useAudioDownload;

import { useRef, useState } from "react";
import { convertWebMBlobToWav } from "../lib/audioUtils";

function useAudioDownload() {
  // Ref to store the MediaRecorder instance.
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // Ref to collect all recorded Blob chunks.
  const recordedChunksRef = useRef<Blob[]>([]);
  // Ref to store AudioContext for proper cleanup
  const audioContextRef = useRef<AudioContext | null>(null);
  // Ref to store microphone stream for proper cleanup
  const micStreamRef = useRef<MediaStream | null>(null);
  // Ref to store the combined stream for cleanup
  const combinedStreamRef = useRef<MediaStream | null>(null);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  /**
   * Starts recording by combining the provided remote stream with
   * the microphone audio.
   * @param remoteStream - The remote MediaStream (e.g., from the audio element).
   */
  const startRecording = async (remoteStream: MediaStream) => {
    // Clean up any existing recording first
    stopRecording();

    let micStream: MediaStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;
    } catch (err) {
      console.error("Error getting microphone stream:", err);
      // Fallback to an empty MediaStream if microphone access fails.
      micStream = new MediaStream();
      micStreamRef.current = micStream;
    }

    // Create an AudioContext to merge the streams.
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const destination = audioContext.createMediaStreamDestination();
    combinedStreamRef.current = destination.stream;

    // Connect the remote audio stream.
    try {
      const remoteSource = audioContext.createMediaStreamSource(remoteStream);
      remoteSource.connect(destination);
    } catch (err) {
      console.error(
        "Error connecting remote stream to the audio context:",
        err,
      );
    }

    // Connect the microphone audio stream.
    try {
      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(destination);
    } catch (err) {
      console.error(
        "Error connecting microphone stream to the audio context:",
        err,
      );
    }

    const options = { mimeType: "audio/webm" };
    try {
      const mediaRecorder = new MediaRecorder(destination.stream, options);

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("MediaRecorder stopped");
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
      };

      // Start recording without a timeslice.
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      console.log("Recording started successfully");
    } catch (err) {
      console.error("Error starting MediaRecorder with combined stream:", err);
      // Clean up if recorder creation failed
      cleanup();
    }
  };

  /**
   * Clean up all audio resources
   */
  const cleanup = () => {
    console.log("Cleaning up audio resources...");

    // Stop all tracks in the microphone stream
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("Stopped mic track:", track.kind);
      });
      micStreamRef.current = null;
    }

    // Stop all tracks in the combined stream
    if (combinedStreamRef.current) {
      combinedStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("Stopped combined track:", track.kind);
      });
      combinedStreamRef.current = null;
    }

    // Close the AudioContext
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch((err) => {
          console.error("Error closing AudioContext:", err);
        });
      }
      audioContextRef.current = null;
    }

    console.log("Audio cleanup completed");
  };

  /**
   * Stops the MediaRecorder and cleans up all resources.
   */
  const stopRecording = () => {
    console.log("Stopping recording...");

    if (mediaRecorderRef.current) {
      const currentState = mediaRecorderRef.current.state;
      console.log("MediaRecorder state:", currentState);

      if (currentState === "recording") {
        // Request any final data before stopping.
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      }

      mediaRecorderRef.current = null;
    }

    // Always clean up resources
    cleanup();
  };

  /**
   * Initiates download of the recording after converting from WebM to WAV.
   * If the recorder is still active, we request its latest data before downloading.
   */
  const downloadRecording = async () => {
    if (!mediaRecorderRef.current && recordedChunksRef.current.length === 0) {
      console.warn("No recorded chunks found to download.");
      return;
    }

    // If recording is still ongoing, request final chunk
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      await new Promise<void>((resolve) => {
        const recorder = mediaRecorderRef.current!;

        // ondataavailable will fire after requestData
        const onData = (event: BlobEvent) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
          recorder.removeEventListener("dataavailable", onData);
          resolve();
        };

        recorder.addEventListener("dataavailable", onData);
        recorder.requestData();
      });
    }

    if (recordedChunksRef.current.length === 0) {
      console.warn("No recorded chunks found to download.");
      return;
    }

    // Combine all recorded chunks into a single Blob
    const webmBlob = new Blob(recordedChunksRef.current, { type: "audio/webm" });

    try {
      // Optional: convert to WAV if needed
      const wavBlob = await convertWebMBlobToWav(webmBlob);

      const url = URL.createObjectURL(wavBlob);
      const now = new Date().toISOString().replace(/[:.]/g, "-");

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `ai_roleplay_${now}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error("Error converting recording to WAV:", err);
    }
  };

  // const downloadRecording = async () => {
  //   // If recording is still active, request the latest chunk.
  //   if (
  //     mediaRecorderRef.current &&
  //     mediaRecorderRef.current.state === "recording"
  //   ) {
  //     // Request the current data.
  //     mediaRecorderRef.current.requestData();
  //     // Allow a short delay for ondataavailable to fire.
  //     await new Promise((resolve) => setTimeout(resolve, 100));
  //   }

  //   if (recordedChunksRef.current.length === 0) {
  //     console.warn("No recorded chunks found to download.");
  //     return;
  //   }

  //   // Combine the recorded chunks into a single WebM blob.
  //   const webmBlob = new Blob(recordedChunksRef.current, {
  //     type: "audio/webm",
  //   });

  //   try {
  //     // Convert the WebM blob into a WAV blob.
  //     const wavBlob = await convertWebMBlobToWav(webmBlob);
  //     const url = URL.createObjectURL(wavBlob);

  //     // Generate a formatted datetime string (replace characters not allowed in filenames).
  //     const now = new Date().toISOString().replace(/[:.]/g, "-");

  //     // Create an invisible anchor element and trigger the download.
  //     const a = document.createElement("a");
  //     a.style.display = "none";
  //     a.href = url;
  //     a.download = `ai_roleplay_${now}.wav`;
  //     document.body.appendChild(a);
  //     a.click();
  //     document.body.removeChild(a);

  //     // Clean up the blob URL after a short delay.
  //     setTimeout(() => URL.revokeObjectURL(url), 100);
  //   } catch (err) {
  //     console.error("Error converting recording to WAV:", err);
  //   }
  // };

  /**
   * Generates a blob URL to use in an <audio> player.
   */
  const generatePlaybackUrl = async () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.requestData();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (recordedChunksRef.current.length === 0) {
      console.warn("No recorded chunks found to play.");
      return;
    }

    const webmBlob = new Blob(recordedChunksRef.current, {
      type: "audio/webm",
    });

    try {
      const wavBlob = await convertWebMBlobToWav(webmBlob);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
    } catch (err) {
      console.error("Error creating playback URL:", err);
    }
  };
  // const generateBlob = () => {
  //   if (recordedChunksRef.current.length === 0) return null;
  //   return new Blob(recordedChunksRef.current, { type: "audio/webm" });
  const generateBlob = async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current && recordedChunksRef.current.length === 0) {
      console.warn("No recorded chunks found.");
      return null;
    }

    // Flush final chunk if still recording
    if (mediaRecorderRef.current?.state === "recording") {
      await new Promise<void>((resolve) => {
        const recorder = mediaRecorderRef.current!;

        const onData = (event: BlobEvent) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
          recorder.removeEventListener("dataavailable", onData);
          resolve();
        };

        recorder.addEventListener("dataavailable", onData);
        recorder.requestData();
      });
    }

    if (recordedChunksRef.current.length === 0) {
      console.warn("No recorded chunks found.");
      return null;
    }

    // ✅ Create the blob (WebM by default)
    const webmBlob = new Blob(recordedChunksRef.current, { type: "audio/webm" });

    // If you want WAV, try conversion
    try {
      const wavBlob = await convertWebMBlobToWav(webmBlob);
      return wavBlob;
    } catch {
      return webmBlob;
    }
  };

  // };
  /**
   * Reset recorded chunks (useful when starting a new recording)
   */
  const resetRecording = () => {
    recordedChunksRef.current = [];
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  return {
    startRecording,
    stopRecording,
    downloadRecording,
    generatePlaybackUrl,
    generateBlob,
    resetRecording,
    cleanup,
    audioUrl,
  };
}

export default useAudioDownload;

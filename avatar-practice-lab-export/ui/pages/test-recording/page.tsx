import { useState, useRef } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export default function TestRecordingPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  const screenChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      // Set up screen recording for S3 upload
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser",
        },
        audio: true,
      });

      const screenRecorder = new MediaRecorder(displayStream);
      screenChunksRef.current = [];

      screenRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          screenChunksRef.current.push(e.data);
        }
      };

      screenRecorder.onstop = async () => {
        const screenBlob = new Blob(screenChunksRef.current, {
          type: "video/webm",
        });
        await uploadRecording(screenBlob);
      };

      // Start recorder
      screenRecorder.start();
      screenRecorderRef.current = screenRecorder;
      setIsRecording(true);
      setUploadStatus("Recording session...");
    } catch (error) {
      console.error("Recording error:", error);
      setUploadStatus("Failed to start recording");
    }
  };

  const stopRecording = () => {
    if (screenRecorderRef.current && isRecording) {
      screenRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadRecording = async (recordingBlob: Blob) => {
    try {
      setUploadStatus("Uploading recording to S3...");
      const formData = new FormData();
      formData.append("file", recordingBlob, `recording_${Date.now()}.webm`);

      const response = await fetch("/api/upload-recording", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadStatus("Recording uploaded successfully!");
        setRecordingUrl(data.fileUrl);
        console.log("Recording uploaded to:", data.fileUrl);
      } else {
        setUploadStatus("Failed to upload recording.");
        console.error("Upload error:", data.error);
      }
    } catch (error) {
      setUploadStatus("Error uploading recording.");
      console.error("Error uploading recording:", error);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">
        Test Recording &amp; S3 Upload
      </h1>
      <Card className="max-w-lg w-full">
        <CardContent className="flex flex-col gap-4 items-center">
          <p className="text-center">
            This page tests the screen recording and S3 upload functionality.
            Click "Start Recording" to begin recording your screen, then "Stop
            Recording" to upload it to S3.
          </p>
          <Button
            className={`${isRecording ? "bg-red-600" : "bg-green-600"} text-white rounded-lg w-full max-w-xs`}
            size="lg"
            variant="ghost"
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? (
              <p>
                Stop Recording {" "}<span className="animate-pulse">●</span>
              </p>
            ) : (
              "Start Recording"
            )}
          </Button>
        </CardContent>
        <Separator />
        <CardFooter className="flex flex-col gap-3">
          {uploadStatus && (
            <Badge
              className={`
                ${
                  uploadStatus.includes("success")
                    ? "bg-green-500"
                    : uploadStatus.includes("Failed") ||
                        uploadStatus.includes("Error")
                      ? "bg-red-500"
                      : "bg-blue-500"
                } 
                text-white w-full justify-center
              `}
            >
              {uploadStatus}
            </Badge>
          )}
          {recordingUrl && (
            <Button
               href={recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-600 text-white rounded-lg w-full"
              variant="ghost"
            >
              View Recording
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

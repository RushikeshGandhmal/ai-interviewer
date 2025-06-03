"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { interviewer } from "@/constants";
import { createFeedback, saveTranscript } from "@/lib/actions/general.action";
import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

export interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
  jobDescription,
  resumeText,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.log("Error:", error);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("Generating feedback");
      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
      });
      console.log("Feedback created", success, id);

      const { success: transcriptSuccess } = await saveTranscript(
        interviewId!,
        userId!,
        messages
      );

      if (success && id && transcriptSuccess) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        console.log("Error saving feedback");
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    if (type === "generate") {
      await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
        variableValues: {
          username: userName,
          userid: userId,
          jobDescription,
          resumeText,
        },
      });
    } else {
      let formattedQuestions = "";
      if (questions) {
        formattedQuestions = questions
          .map((question) => `- ${question}`)
          .join("\n");
      }

      await vapi.start(interviewer, {
        variableValues: {
          questions: formattedQuestions,
        },
      });
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <div className="flex w-full gap-6 mt-8">
      {/* Left: Call View */}
      <div className="flex-1">
        <div className="call-view">
          <div className="card-interviewer">
            <div className="avatar">
              <Image
                src="/ai-avatar.png"
                alt="profile-image"
                width={65}
                height={54}
                className="object-cover"
              />
              {isSpeaking && <span className="animate-speak" />}
            </div>
            <h3>Nora AI</h3>
          </div>

          <div className="card-border">
            <div className="card-content">
              <Image
                src="/user-avatar.png"
                alt="profile-image"
                width={539}
                height={539}
                className="rounded-full object-cover size-[120px]"
              />
              <h3>{userName}</h3>
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center mt-6">
          {callStatus !== "ACTIVE" ? (
            <button className="relative btn-call" onClick={handleCall}>
              <span
                className={cn(
                  "absolute animate-ping rounded-full opacity-75",
                  callStatus !== "CONNECTING" && "hidden"
                )}
              />
              <span className="relative">
                {callStatus === "INACTIVE" || callStatus === "FINISHED"
                  ? "Call"
                  : ". . ."}
              </span>
            </button>
          ) : (
            <button className="btn-disconnect" onClick={handleDisconnect}>
              End
            </button>
          )}
        </div>
      </div>

      {/* Right: Chat Window */}
      <div className="w-[400px] h-[600px] flex flex-col bg-white dark:bg-neutral-900 border rounded-xl shadow-md p-4">
        <h3 className="text-xl font-semibold mb-4 text-center text-indigo-600 dark:text-indigo-400">
          🧠 Live Transcript
        </h3>

        <div className="flex flex-col gap-4 overflow-y-auto pr-2">
          {(() => {
            const groupedMessages: SavedMessage[] = [];

            messages.forEach((msg) => {
              const last = groupedMessages[groupedMessages.length - 1];
              if (last && last.role === msg.role) {
                last.content += " " + msg.content;
              } else {
                groupedMessages.push({ ...msg });
              }
            });

            return groupedMessages.map((msg, idx) => {
              const isUser = msg.role === "user";

              return (
                <div
                  key={idx}
                  className={cn(
                    "max-w-[80%] p-4 rounded-xl text-sm whitespace-pre-wrap leading-relaxed",
                    isUser
                      ? "bg-indigo-600 text-white self-end rounded-br-none"
                      : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white self-start rounded-bl-none"
                  )}
                >
                  {msg.content.trim()}
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
};

export default Agent;

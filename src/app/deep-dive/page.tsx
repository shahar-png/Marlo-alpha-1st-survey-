"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SurveyTwoStory from "@/components/survey-two-story";
function DeepDive() {
  const p = useSearchParams().get("p") || "";
  return <SurveyTwoStory key={p} participantId={p} />;
}
export default function Page() {
  return (
    <Suspense fallback={null}>
      <DeepDive />
    </Suspense>
  );
}

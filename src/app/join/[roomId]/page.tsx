"use client";

import JoinScreen from "@/components/Join-screen";
import useUsername from "@/hooks/use-username";
import { useParams, useRouter } from "next/navigation";

const JoinPage = () => {
  const { username } = useUsername();
  const params = useParams();
  const roomId = params.roomId as string;
  const router = useRouter();

  return (
    <JoinScreen
      username={username}
      roomId={roomId}
      onJoin={() => router.push(`/room/${roomId}`)}
      onDecline={() => router.push("/")}
    />
  );
};

export default JoinPage;
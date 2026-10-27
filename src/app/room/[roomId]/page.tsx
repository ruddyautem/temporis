import { headers } from "next/headers";
import { redirect } from "next/navigation";
import RoomRealtimeProvider from "@/components/room/RoomRealtimeProvider";
import RoomPage from "@/components/room/RoomPage";
import { CONNECTION_HEADER } from "@/lib/room-presence-config";

export default async function Page() {
  const connectionId = (await headers()).get(CONNECTION_HEADER);
  if (!connectionId) redirect("/");
  return (
    <RoomRealtimeProvider key={connectionId} connectionId={connectionId}>
      <RoomPage connectionId={connectionId} />
    </RoomRealtimeProvider>
  );
}

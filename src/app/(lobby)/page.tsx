import { Suspense } from "react";
import Lobby from "@/components/lobby/Lobby";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className='flex h-screen items-center justify-center text-emerald-500 text-sm tracking-widest uppercase animate-pulse'>
          Chargement...
        </div>
      }
    >
      <Lobby />
    </Suspense>
  );
}

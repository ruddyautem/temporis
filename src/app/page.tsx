import Lobby from "@/components/Lobby";
import { Suspense } from "react";

const Page = () => {
  return (
    <Suspense>
      <Lobby />
    </Suspense>
  );
};

export default Page;

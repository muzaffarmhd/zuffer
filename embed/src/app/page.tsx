// page.tsx
import Image from "next/image";
import { Suspense } from "react";
import TerrainBackground from "@/components/HeroBackground";
import { Hero } from "./Hero";
import Loading from "@/components/Loading"; // Import the Loading component

async function Main() {
  return (
    <div>
      <div className="-z-10 absolute">
        <TerrainBackground />
      </div>
      <Hero />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <Main />
    </Suspense>
  );
}
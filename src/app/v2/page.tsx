import { Nav } from "@/components/castez/Nav";
import { Hero } from "@/components/castez/Hero";
import { Audiences } from "@/components/castez/Audiences";
import { Flow } from "@/components/castez/Flow";
import { Footer } from "@/components/castez/Footer";

export default function CastEZLandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Audiences />
        <Flow />
      </main>
      <Footer />
    </>
  );
}

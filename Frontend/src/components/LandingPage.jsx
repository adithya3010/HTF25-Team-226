import React from "react";
import { Link } from "react-router-dom";
import Beams from "./Beams";
import RotatingText from "./RotatingText";

const LandingPage = () => {
  return (
    <section className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden bg-gradient-to-b from-slate-950 via-black to-black">
      {/* Animated beams background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-60 mix-blend-screen">
          <Beams
            beamNumber={10}
            beamHeight={18}
            speed={1.4}
            noiseIntensity={1.4}
            lightColor="#3F51B5"
          />
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-6xl flex-col justify-center px-6 py-16 text-white md:px-12">
        <div className="max-w-3xl space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10  px-4 py-2 text-sm uppercase tracking-[0.35em] text-white/70">
            CORE-
            <RotatingText
              texts={["Connect", "Organise", "Resource", "Educate"]}
              mainClassName="px-2 sm:px-2 md:px-3 bg-indigo-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
              staggerFrom={"last"}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2000}
            />
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Your modern space to talk, share, and stay connected
          </h1>
          <p className="text-lg text-white/80 sm:text-xl">
            Drop into real-time conversations, swap ideas, and collaborate with
            your teams. Streamlined moderation tools, rich media support, and a
            beautifully responsive experience await.
          </p>

          <div className="flex flex-col items-center gap-4 pt-4 sm:flex-row sm:justify-start">
            <Link
              to="/"
              className="inline-flex w-full items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:translate-y-[-1px] hover:bg-indigo-400 sm:w-auto"
            >
              Enter a room
            </Link>
            <Link
              to="/chat"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white/90 backdrop-blur hover:border-white/60 hover:text-white sm:w-auto"
            >
              Explore the chat
            </Link>
          </div>

          <dl className="grid gap-6 pt-8 text-left sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <dt className="text-sm uppercase tracking-wide text-white/60">
                Realtime
              </dt>
              <dd className="text-xl font-semibold">
                Sockets powered messaging
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <dt className="text-sm uppercase tracking-wide text-white/60">
                Media Ready
              </dt>
              <dd className="text-xl font-semibold">
                Images, video & PDF support
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <dt className="text-sm uppercase tracking-wide text-white/60">
                Moderation
              </dt>
              <dd className="text-xl font-semibold">
                Pin, mute & manage rooms
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
};

export default LandingPage;

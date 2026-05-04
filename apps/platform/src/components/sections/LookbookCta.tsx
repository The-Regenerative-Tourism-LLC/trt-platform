import Image from "next/image";

interface LookbookCtaProps {
  eyebrow?: string;
  heading: React.ReactNode;
  children: React.ReactNode;
}

export function LookbookCta({ eyebrow, heading, children }: LookbookCtaProps) {
  return (
    <section className="section-lg section-muted relative overflow-hidden">
      {/* Floating images — fixed positions, subtle rotations */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute left-[2%] md:left-[6%] top-[8%] w-[42vw] md:w-[22vw] overflow-hidden media-bordered"
          style={{ transform: "rotate(-5deg)" }}
        >
          <Image
            src="/assets/lookbook-friends.jpg"
            alt="Travelers at the beach"
            width={400}
            height={300}
            className="w-full aspect-[4/3] object-cover"
          />
        </div>
        <div
          className="absolute right-[2%] md:right-[5%] top-[5%] w-[36vw] md:w-[18vw] overflow-hidden media-bordered"
          style={{ transform: "rotate(3deg)" }}
        >
          <Image
            src="/assets/lookbook-hiker.jpg"
            alt="Hiker on a trail"
            width={300}
            height={225}
            className="w-full aspect-[4/3] object-cover"
          />
        </div>
        <div
          className="absolute left-[6%] md:left-[12%] bottom-[6%] w-[40vw] md:w-[20vw] overflow-hidden media-bordered"
          style={{ transform: "rotate(2deg)" }}
        >
          <Image
            src="/assets/lookbook-market.jpg"
            alt="Local food experience"
            width={350}
            height={263}
            className="w-full aspect-[4/3] object-cover"
          />
        </div>
        <div
          className="absolute right-[3%] md:right-[7%] bottom-[10%] w-[34vw] md:w-[16vw] overflow-hidden media-bordered"
          style={{ transform: "rotate(-3deg)" }}
        >
          <Image
            src="/assets/lookbook-scan.jpg"
            alt="Scanning a QR code"
            width={280}
            height={210}
            className="w-full aspect-[4/3] object-cover"
          />
        </div>
      </div>

      {/* Centered heading + CTA */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-[60vh] md:min-h-[70vh] container-text text-center">
        {eyebrow && (
          <p className="type-label text-black italic mb-4">{eyebrow}</p>
        )}
        <h2 className="type-h1 text-foreground mb-10">{heading}</h2>
        {children}
      </div>
    </section>
  );
}

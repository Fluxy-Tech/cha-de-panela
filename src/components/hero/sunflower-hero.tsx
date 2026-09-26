"use client";

import { useEffect, useRef } from "react";
import { getImageProps } from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { buttonVariants } from "@/components/ui/button";
import campoGirassois from "@/app/assets/GirassolParaCapa.png";
import girassolMobile from "@/app/assets/GirassolParaCapaParaMobile.png";

gsap.registerPlugin(SplitText);

// Capa com imagem diferente no mobile (vertical, girassol embaixo) e a partir
// de 640px (horizontal). O <picture> faz o navegador baixar só a versão usada.
const coverImageProps = {
  alt: "Campo de girassóis ao entardecer",
  fill: true,
  sizes: "100vw",
  loading: "eager",
  fetchPriority: "high",
} as const;
const {
  props: { srcSet: desktopSrcSet },
} = getImageProps({ ...coverImageProps, src: campoGirassois });
const { props: mobileImageProps } = getImageProps({
  ...coverImageProps,
  src: girassolMobile,
});

export function SunflowerHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        imageWrapRef.current,
        { scale: 1.15 },
        { scale: 1, duration: 14, ease: "power1.out" },
      );

      const split = new SplitText(titleRef.current, {
        type: "words,chars",
        wordsClass: "split-word",
        charsClass: "split-char",
      });

      gsap.set(titleRef.current, { visibility: "visible" });
      gsap.set(split.chars, { opacity: 0, yPercent: 120, rotate: 6 });

      gsap
        .timeline({ delay: 0.3 })
        .to(split.chars, {
          opacity: 1,
          yPercent: 0,
          rotate: 0,
          duration: 0.9,
          stagger: 0.02,
          ease: "back.out(1.7)",
        })
        .to(
          subRef.current,
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
          "-=0.4",
        )
        .to(
          ctaRef.current,
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
          "-=0.3",
        );

      return () => split.revert();
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-dvh w-full items-center justify-end overflow-hidden bg-black"
    >
      <div ref={imageWrapRef} className="absolute inset-0">
        <picture>
          <source media="(min-width: 640px)" srcSet={desktopSrcSet} />
          {/* eslint-disable-next-line jsx-a11y/alt-text -- alt vem de mobileImageProps */}
          <img
            {...mobileImageProps}
            className="object-cover object-bottom blur-[3px] saturate-[1.15] brightness-105 sm:object-center sm:blur-none"
          />
        </picture>
      </div>

      {/* Mobile: camada preta sobre a capa para destacar o texto. */}
      <div className="absolute inset-0 bg-black/70 sm:hidden" />
      <div className="absolute inset-0 hidden bg-gradient-to-t from-black/70 via-black/5 to-transparent sm:block" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-4 px-6 text-center sm:items-end sm:px-16 sm:text-right">
        <h1
          ref={titleRef}
          className="invisible font-heading text-4xl font-semibold leading-[1.1] text-yellow-50 drop-shadow-[0_4px_16px_rgba(0,0,0,0.65)] sm:text-6xl md:text-7xl"
        >
          Logo, logo nosso amor floresce em mais uma celebração: o nosso chá
          de panela!
        </h1>
        <p
          ref={subRef}
          className="max-w-lg translate-y-3 font-heading text-base font-medium text-white opacity-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] sm:text-lg sm:text-yellow-100/80"
        >
          Para confirmar sua presença e de sua família, clique no botão abaixo
        </p>
        <Link
          ref={ctaRef}
          href="/invitations"
          className={buttonVariants({
            size: "lg",
            className:
              "mt-2 h-auto translate-y-3 rounded-full bg-yellow-400 px-6 py-3 text-base font-semibold text-yellow-950 opacity-0 shadow-lg hover:bg-yellow-300",
          })}
        >
          Confirmar presença
        </Link>
      </div>
    </div>
  );
}

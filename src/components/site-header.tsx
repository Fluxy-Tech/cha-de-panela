"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import iconeGirassol from "@/app/assets/IconeBotaoDeAberturaDoEnvelope.png";

// "hero": transparente sobre a foto da tela inicial; ao rolar para fora dela,
// fica com o mesmo fundo marrom do "solid".
// "solid": fundo marrom fixo, para telas sem imagem de fundo (ex.: /invitations).
export function SiteHeader({
  variant = "hero",
  actions,
}: {
  variant?: "hero" | "solid";
  // Conteúdo opcional alinhado à direita (ex.: e-mail e "Sair" no dashboard).
  actions?: React.ReactNode;
}) {
  const headerRef = useRef<HTMLElement>(null);
  const nameARef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLImageElement>(null);
  const nameBRef = useRef<HTMLSpanElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const isSolid = variant === "solid" || isScrolled;

  useEffect(() => {
    if (variant === "solid") return;
    const threshold = () => window.innerHeight - 96;
    const onScroll = () => setIsScrolled(window.scrollY > threshold());
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set([nameARef.current, iconRef.current, nameBRef.current], {
        opacity: 0,
        y: -16,
      });

      gsap
        .timeline({ delay: 0.2 })
        .to(nameARef.current, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
        })
        .to(
          iconRef.current,
          {
            opacity: 1,
            y: 0,
            rotate: 360,
            duration: 0.8,
            ease: "back.out(1.7)",
          },
          "-=0.5",
        )
        .to(
          nameBRef.current,
          { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
          "-=0.5",
        );
    }, headerRef);

    return () => ctx.revert();
  }, []);

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 flex items-center gap-3 px-6 py-5 transition-colors duration-500 sm:gap-5 sm:py-6 ${
        actions ? "justify-start sm:justify-center" : "justify-center"
      } ${
        isSolid ? "bg-[#4A3F35]" : "bg-transparent"
      }`}
    >
      <span
        ref={nameARef}
        className={`font-signature text-3xl leading-none transition-colors duration-500 sm:text-4xl ${
          isSolid
            ? "text-yellow-50"
            : "text-yellow-50 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
        }`}
      >
        Gabriel
      </span>
      <Link
        href="/"
        aria-label="Ir para a página inicial"
        className="inline-flex shrink-0 transition-transform hover:scale-110"
      >
        <Image
          ref={iconRef}
          src={iconeGirassol}
          alt="Girassol"
          className={`size-6 transition-[filter] duration-500 sm:size-8 ${
            isSolid ? "" : "drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
          }`}
        />
      </Link>
      <span
        ref={nameBRef}
        className={`font-signature text-3xl leading-none transition-colors duration-500 sm:text-4xl ${
          isSolid
            ? "text-yellow-50"
            : "text-yellow-50 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
        }`}
      >
        Gabrielle
      </span>
      {actions && (
        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-3 sm:right-6">
          {actions}
        </div>
      )}
    </header>
  );
}

"use client";

/**
 * @author: @dorian_baffier
 * @description: Beams Background
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface AnimatedGradientBackgroundProps {
    className?: string;
    children?: React.ReactNode;
    intensity?: "subtle" | "medium" | "strong";
}

interface Beam {
    x: number;
    y: number;
    width: number;
    length: number;
    angle: number;
    speed: number;
    opacity: number;
    hue: number;
    pulse: number;
    pulseSpeed: number;
}

function createBeam(width: number, height: number, isDarkMode: boolean): Beam {
    const angle = -24 + Math.random() * 4;
    const accentHue = 271;
    const hueBase = accentHue + (isDarkMode ? 4 : -4);
    const hueRange = 8;

    return {
        x: Math.random() * width * 1.5 - width * 0.25,
        y: -Math.random() * height * 0.4 - height * 0.2,
        width: 40 + Math.random() * 70,
        length: height * 2.75,
        angle: angle,
        speed: 0.06 + Math.random() * 0.12,
        opacity: 0.16 + Math.random() * 0.1,
        hue: hueBase + Math.random() * hueRange,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.002 + Math.random() * 0.004,
    };
}

export default function BeamsBackground({
    className,
    children,
    intensity = "strong",
}: AnimatedGradientBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const beamsRef = useRef<Beam[]>([]);
    const animationFrameRef = useRef<number>(0);
    const MINIMUM_BEAMS = 20;
    const isDarkModeRef = useRef<boolean>(false);

    const opacityMap = {
        subtle: 0.7,
        medium: 0.85,
        strong: 1,
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Check for dark mode
        const updateDarkMode = () => {
            isDarkModeRef.current =
                document.documentElement.classList.contains("dark");
        };

        const observer = new MutationObserver(updateDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        updateDarkMode();

        const updateCanvasSize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);

            const totalBeams = MINIMUM_BEAMS * 1.5;
            beamsRef.current = Array.from({ length: totalBeams }, () =>
                createBeam(canvas.width, canvas.height, isDarkModeRef.current)
            );
        };

        updateCanvasSize();
        window.addEventListener("resize", updateCanvasSize);

        function resetBeam(beam: Beam, index: number, totalBeams: number) {
            if (!canvas) return beam;

            const column = index % 3;
            const spacing = canvas.width / 3;

            const accentHue = 271;
            const hueBase = accentHue + (isDarkModeRef.current ? 4 : -4);
            const hueRange = 8;

            beam.y = -100 - Math.random() * 200;
            beam.x =
                column * spacing +
                spacing / 2 +
                (Math.random() - 0.5) * spacing * 0.5;
            beam.width = 120 + Math.random() * 70;
            beam.speed = 0.06 + Math.random() * 0.1;
            beam.hue = hueBase + (index * hueRange) / totalBeams;
            beam.opacity = 0.18 + Math.random() * 0.12;
            return beam;
        }

        function drawBeam(ctx: CanvasRenderingContext2D, beam: Beam) {
            ctx.save();
            ctx.translate(beam.x, beam.y);
            ctx.rotate((beam.angle * Math.PI) / 180);

            const pulsingOpacity =
                beam.opacity *
                (0.8 + Math.sin(beam.pulse) * 0.2) *
                opacityMap[intensity];

            const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);

            const saturation = isDarkModeRef.current ? "62%" : "56%";
            const lightness = isDarkModeRef.current ? "60%" : "56%";

            gradient.addColorStop(
                0,
                `hsla(${beam.hue}, ${saturation}, ${lightness}, 0)`
            );
            gradient.addColorStop(
                0,
                `hsla(${beam.hue}, ${saturation}, ${lightness}, ${
                    pulsingOpacity
                })`
            );
            gradient.addColorStop(
                0.35,
                `hsla(${beam.hue}, ${saturation}, ${lightness}, ${
                    pulsingOpacity * 0.72
                })`
            );
            gradient.addColorStop(
                0.7,
                `hsla(${beam.hue}, ${saturation}, ${lightness}, ${
                    pulsingOpacity * 0.25
                })`
            );
            gradient.addColorStop(
                1,
                `hsla(${beam.hue}, ${saturation}, ${lightness}, 0)`
            );

            ctx.fillStyle = gradient;
            ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
            ctx.restore();
        }

        function animate() {
            if (!canvas || !ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.filter = "blur(35px)";

            const totalBeams = beamsRef.current.length;
            beamsRef.current.forEach((beam, index) => {
                beam.y += beam.speed;
                beam.pulse += beam.pulseSpeed;

                // Reset beam when it goes off screen
                if (beam.y - beam.length > canvas.height + 200) {
                    resetBeam(beam, index, totalBeams);
                }

                drawBeam(ctx, beam);
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        }

        animate();

        return () => {
            window.removeEventListener("resize", updateCanvasSize);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            observer.disconnect();
        };
    }, [intensity]);

    return (
        <div
            className={cn(
                "relative min-h-screen w-full overflow-hidden bg-neutral-100 dark:bg-neutral-950",
                className
            )}
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0"
                style={{ filter: "blur(15px)" }}
            />

            <motion.div
                className="absolute inset-0 bg-neutral-900/5 dark:bg-neutral-950/5"
                animate={{
                    opacity: [0.05, 0.15, 0.05],
                }}
                transition={{
                    duration: 24,
                    ease: "easeInOut",
                    repeat: Number.POSITIVE_INFINITY,
                }}
                style={{
                    backdropFilter: "blur(50px)",
                }}
            />

            <div className="relative z-10 flex min-h-screen w-full flex-col">
                {children ? (
                    <div className="flex-1">
                        {children}
                    </div>
                ) : (
                    <div className="flex flex-1 items-center justify-center px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-6">
                            <motion.h1
                                className="text-6xl md:text-7xl lg:text-8xl font-semibold text-neutral-900 dark:text-white tracking-tighter"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                Beams
                                <br />
                                Background
                            </motion.h1>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

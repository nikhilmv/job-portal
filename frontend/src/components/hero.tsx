"use client";
import {
  ArrowRight,
  Briefcase,
  MapPin,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "./ui/button";

const floatingCards = [
  {
    title: "Frontend Developer",
    company: "Google",
    salary: "₹18–25 LPA",
    tag: "Remote",
    tagColor: "bg-emerald-500",
    delay: "0s",
    top: "10%",
    right: "-5%",
  },
  {
    title: "Product Designer",
    company: "Figma",
    salary: "₹14–20 LPA",
    tag: "Hybrid",
    tagColor: "bg-violet-500",
    delay: "0.6s",
    top: "42%",
    right: "-8%",
  },
  {
    title: "Data Scientist",
    company: "Microsoft",
    salary: "₹22–35 LPA",
    tag: "On-site",
    tagColor: "bg-blue-500",
    delay: "1.2s",
    top: "72%",
    right: "-3%",
  },
];

const stats = [
  { value: "10K+", label: "Active Jobs", icon: Briefcase },
  { value: "5K+", label: "Companies", icon: Sparkles },
  { value: "50K+", label: "Job Seekers", icon: Users },
  { value: "98%", label: "Success Rate", icon: Star },
];

const Hero = () => {
  const [query, setQuery] = useState("");

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#080c14]">
      {/* Animated grid background */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 py-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT CONTENT */}
          <div className="flex flex-col gap-8">
            {/* Badge */}
            <div className="hero-animate-1 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 w-fit">
              <Zap size={14} className="text-indigo-400" />
              <span className="text-sm font-medium">
                #1 Job Platform in India
              </span>
              <TrendingUp size={14} />
            </div>

            {/* Headline */}
            <div className="hero-animate-2">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-white">
                Your Next{" "}
                <span
                  className="relative"
                  style={{
                    background:
                      "linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #38bdf8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Dream Job
                </span>{" "}
                <br />
                Starts Here.
              </h1>
              <p className="mt-5 text-lg text-slate-400 leading-relaxed max-w-lg">
                Connect with India's top employers. Discover roles that match
                your skills, values, and career goals — powered by AI.
              </p>
            </div>

            {/* Search bar */}
            <div
              className="hero-animate-3 flex items-center gap-2 p-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md max-w-lg"
              style={{
                boxShadow: "0 0 40px rgba(99,102,241,0.15)",
              }}
            >
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search size={18} className="text-slate-400 shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search jobs, companies, skills..."
                  className="flex-1 bg-transparent text-white placeholder:text-slate-500 text-sm outline-none py-2"
                />
              </div>
              <Link href={`/jobs${query ? `?q=${query}` : ""}`}>
                <Button className="h-10 px-5 gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold">
                  Search
                  <ArrowRight size={15} />
                </Button>
              </Link>
            </div>

            {/* Suggestion pills */}
            <div className="hero-animate-4 flex flex-wrap gap-2">
              <span className="text-xs text-slate-500">Popular:</span>
              {["React", "Python", "UI/UX", "DevOps", "Marketing"].map((t) => (
                <button
                  key={t}
                  onClick={() => setQuery(t)}
                  className="text-xs px-3 py-1 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:border-indigo-500/50 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="hero-animate-5 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              {stats.map(({ value, label, icon: Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center sm:items-start gap-1 p-3 rounded-xl border border-white/5 bg-white/[0.03] hover:border-indigo-500/30 transition-colors"
                >
                  <Icon size={16} className="text-indigo-400" />
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div className="hero-animate-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/jobs">
                <Button
                  size="lg"
                  className="h-12 px-8 text-sm font-semibold gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white group"
                >
                  <Briefcase size={17} />
                  Browse All Jobs
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Button>
              </Link>
              <div className="flex items-center gap-3 text-slate-500 text-sm">
                <div className="flex -space-x-2">
                  {[
                    "bg-indigo-500",
                    "bg-violet-500",
                    "bg-blue-500",
                    "bg-sky-500",
                  ].map((c, i) => (
                    <div
                      key={i}
                      className={`w-7 h-7 rounded-full border-2 border-[#080c14] ${c}`}
                    />
                  ))}
                </div>
                <span>
                  Join <span className="text-white font-medium">50,000+</span>{" "}
                  job seekers
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT — Floating Job Cards */}
          <div className="relative hidden lg:flex justify-center items-center h-[560px]">
            {/* Center glow */}
            <div className="absolute w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl" />

            {/* Decorative ring */}
            <div
              className="absolute w-80 h-80 rounded-full border border-indigo-500/10"
              style={{ animation: "spin 20s linear infinite" }}
            />
            <div
              className="absolute w-[420px] h-[420px] rounded-full border border-violet-500/10"
              style={{ animation: "spin 30s linear infinite reverse" }}
            />

            {/* Floating cards */}
            {floatingCards.map((card, i) => (
              <div
                key={i}
                className="absolute left-1/2 w-64 p-4 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md shadow-xl"
                style={{
                  top: card.top,
                  transform: "translateX(-50%)",
                  animation: `float 4s ease-in-out ${card.delay} infinite`,
                  marginLeft: i === 0 ? "80px" : i === 2 ? "60px" : "100px",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {card.title}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-slate-500" />
                      <p className="text-slate-400 text-xs">{card.company}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${card.tagColor}`}
                  >
                    {card.tag}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-indigo-300 text-xs font-semibold">
                    {card.salary}
                  </p>
                  <button className="text-xs px-3 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white transition-colors">
                    Apply
                  </button>
                </div>
              </div>
            ))}

            {/* Center badge */}
            <div className="relative z-10 flex flex-col items-center gap-2 p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md text-center">
              <Sparkles size={28} className="text-indigo-400" />
              <p className="text-white font-bold text-lg">job portal</p>
              <p className="text-indigo-300 text-xs">AI-Powered Hiring</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

"use client";
import CareerGuide from "@/components/career-guide";
import Hero from "@/components/hero";
import Loading from "@/components/loading";
import ResumeAnalyzer from "@/components/resume-analyser";
import { Button } from "@/components/ui/button";
import { userAppData } from "@/context/AppContext";
import React from "react";

const Home = () => {
  const { loading } = userAppData();
  if (loading) {
    return <Loading />;
  }
  return (
    <div>
      <Hero />
      <CareerGuide />
      <ResumeAnalyzer />
    </div>
  );
};

export default Home;

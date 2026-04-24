"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Loader2,
  ArrowRight,
  FileCheck,
  Zap,
} from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import { ResumeAnalysisResponse } from "@/type";
import { utils_service } from "@/context/AppContext";
import axios from "axios";

const ResumeAnalyzer = () => {
  const [open, setOpen] = useState(false);
  const [response, setResponse] = useState<ResumeAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const analyzeResume = async () => {
    if (!file) {
      toast.error("Please select a resume file first");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${utils_service}/api/utils/resume-analyser`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      setResponse(response.data);
      toast.success("Resume analyzed successfully");
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message || "Failed to analyze resume";

      toast.error(message);
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/30";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "high")
      return "bg-red-100 dark:bg-red-900/30 text-red-600 border-red-200 dark:border-red-800";
    if (priority === "medium")
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 border-yellow-200 dark:border-yellow-800";
    return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 border-blue-200 dark:border-blue-800";
  };

  const resetDialog = () => {
    setFile(null);
    setResponse(null);
    setOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <section className="relative py-24 overflow-hidden bg-[#080c14]">
      {/* Animated grid background */}
      <div
        className="absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-red-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[5%] w-[300px] h-[300px] rounded-full bg-blue-600/10 blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="hero-animate-1 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-300 mb-8">
            <Zap size={14} className="text-red-400" />
            <span className="text-sm font-medium">AI-Powered ATS Analysis</span>
            <FileCheck size={14} />
          </div>

          {/* Heading */}
          <div className="hero-animate-2 space-y-4 mb-10">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Optimize Your{" "}
              <span
                className="relative"
                style={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #f87171 50%, #b91c1c 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Resume for ATS
              </span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Get instant feedback on your resume's compatibility with Applicant
              Tracking Systems (ATS) and outshine the competition with
              AI-driven insights.
            </p>
          </div>

          {/* CTA / Dialog */}
          <div className="hero-animate-3">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="h-14 px-10 text-base font-semibold gap-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all group"
                >
                  <FileText size={20} />
                  Analyze My Resume
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0c121d] border-white/10 text-white">
                {!response ? (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white">
                        <div className="p-2 rounded-lg bg-red-500/10">
                          <Upload className="text-red-500" size={24} />
                        </div>
                        Upload Your Resume
                      </DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Upload your resume in PDF format to get an instant ATS
                        compatibility analysis.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-6">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative border-2 border-dashed border-white/10 rounded-2xl p-12 text-center cursor-pointer hover:border-red-500/50 hover:bg-red-500/2 transition-all"
                      >
                        <div className="flex flex-col items-center gap-4">
                          <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload size={32} className="text-red-500" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-white mb-1">
                              {file ? file.name : "Click to select resume"}
                            </p>
                            <p className="text-sm text-slate-500 uppercase tracking-wider font-medium">
                              PDF format only (Max 5MB)
                            </p>
                          </div>
                          {file && (
                            <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-1.5 rounded-full border border-green-400/20">
                              <CheckCircle2 size={16} />
                              <span className="text-sm font-semibold">
                                Ready to Analyze
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      <Button
                        onClick={analyzeResume}
                        disabled={loading || !file}
                        className="w-full h-12 text-base font-bold bg-white text-black hover:bg-slate-200 transition-colors rounded-xl gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            Processing Resume...
                          </>
                        ) : (
                          <>
                            <Zap size={20} className="fill-current" />
                            Run AI Analysis
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <FileCheck className="text-green-500" size={24} />
                        </div>
                        Analysis Result
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-8 py-6">
                      {/* Overall Score */}
                      <div className="relative overflow-hidden p-8 rounded-2xl border border-white/10 bg-white/3 backdrop-blur-sm text-center">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <TrendingUp size={120} />
                        </div>
                        <p className="text-slate-400 font-medium mb-2 uppercase tracking-widest text-xs">
                          ATS Score
                      </p>
                        <div
                          className={`text-7xl font-black ${getScoreColor(
                            response.atsScore,
                          )}`}
                        >
                          {response.atsScore}
                          <span className="text-2xl opacity-50 ml-1">/100</span>
                        </div>
                        <p className="text-slate-400 mt-4 max-w-md mx-auto leading-relaxed">
                          {response.summary}
                        </p>
                      </div>

                      {/* Score Breakdown */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {Object.entries(response.scoreBreakdown).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="p-5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <p className="font-bold capitalize text-white">
                                  {key}
                                </p>
                                <span
                                  className={`text-xl font-bold ${getScoreColor(
                                    value.score,
                                  )}`}
                                >
                                  {value.score}%
                                </span>
                              </div>
                              <p className="text-sm text-slate-400 leading-relaxed">
                                {value.feedback}
                              </p>
                            </div>
                          ),
                        )}
                      </div>

                      {/* Strengths & Suggestions */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl border border-green-500/10 bg-green-500/5">
                          <h3 className="font-bold text-green-400 mb-4 flex items-center gap-2">
                            <CheckCircle2 size={18} />
                            Key Strengths
                          </h3>
                          <ul className="space-y-3">
                            {response.strengths.map((strength, index) => (
                              <li
                                key={index}
                                className="text-sm text-slate-300 flex items-start gap-2"
                              >
                                <span className="text-green-500 mt-1 shrink-0">
                                  ●
                                </span>
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-6 rounded-2xl border border-orange-500/10 bg-orange-500/5">
                          <h3 className="font-bold text-orange-400 mb-4 flex items-center gap-2">
                            <AlertTriangle size={18} />
                            Critical Improvements
                          </h3>
                          <div className="space-y-4">
                            {response.suggestions.map((suggestion, index) => (
                              <div key={index} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold uppercase transition-transform">
                                    {suggestion.priority}
                                  </span>
                                  <p className="text-white font-bold text-xs">
                                    {suggestion.category}
                                  </p>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                  {suggestion.recommendation}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={resetDialog}
                        variant="ghost"
                        className="w-full text-slate-400 hover:text-white hover:bg-white/5 h-12 rounded-xl"
                      >
                        Analyze Another Resume
                      </Button>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResumeAnalyzer;

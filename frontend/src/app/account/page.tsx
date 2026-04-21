"use client";
import Loading from "@/components/loading";
import { userAppData } from "@/context/AppContext";
import { redirect, useRouter } from "next/navigation";
import React from "react";
import Info from "./components/info";
import Skills from "./components/skills";
import AppliedJobs from "./components/appliedJobs";
import Company from "./components/company";

function AccountPage() {
  const { isAuth, user, loading, applications } = userAppData();
  const router = useRouter();

  if (loading) return <Loading />;
  if (!isAuth) return redirect("/login");

  return (
    <>
      {user && (
        <div className="w-[90%] md:w-[60%] m-auto">
          <Info user={user} isYourAccount={true} />
          {user.role === "jobseeker" && (
            <Skills user={user} isYourAccount={true} />
          )}
          {user.role === "jobseeker" && (
            <AppliedJobs applications={applications} />
          )}
          {user.role === "recruiter" && <Company />}
        </div>
      )}
    </>
  );
}

export default AccountPage;

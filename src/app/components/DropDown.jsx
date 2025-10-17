"use client";
import React, { useEffect, useMemo, useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { countries } from "countries-list";
import Select from "./ReactSelectNoSSR";
import { savePhone } from "../phoneBridge";
import { useRouter } from "next/navigation";

const options = Object.entries(countries)
  .map(([code, c]) => ({ value: c.phone, code, name: c.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

export default function CountryPhoneInput() {
  const router = useRouter();
  const [dial, setDial] = useState("");
  const [selected, setSelected] = useState({
    value: "91",
    code: "IN",
    name: "India",
  });
  const [phone, setPhone] = useState("");

  const onCountryChange = (opt) => {
    setSelected(opt);
    savePhone({ cc: opt.value, phone }); // update bridge
  };

  const onPhoneChange = (e) => {
    const v = e.target.value;
    setPhone(v);
    savePhone({ cc: selected.value, phone: v }); // update bridge
  };


  async function onSubmit(e) {
    e.preventDefault();
    const phoneNumber = `${dial}${phone}`.replace(/\s+/g, "");
    const r = await fetch("/api/telegram/phone/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    }).then((r) => r.json());
    // if (r.ok) router.push(`/login?phone=${encodeURIComponent(phoneNumber)}`);
    // else alert(r.error || "Failed to send code");
  }

  // Touch device detection
  const isTouch =
    typeof window !== "undefined" &&
    (navigator.maxTouchPoints > 0 || "ontouchstart" in window);

  // Track visual viewport height so menu height adapts with keyboard
  const [vvh, setVvh] = useState(
    typeof window !== "undefined"
      ? (window.visualViewport?.height ?? window.innerHeight)
      : 0
  );

  useEffect(() => {
    if (!isTouch || typeof window === "undefined" || !window.visualViewport) return;
    const handler = () => setVvh(window.visualViewport.height);
    window.visualViewport.addEventListener("resize", handler);
    window.visualViewport.addEventListener("scroll", handler);
    return () => {
      window.visualViewport.removeEventListener("resize", handler);
      window.visualViewport.removeEventListener("scroll", handler);
    };
  }, [isTouch]);

  const MAX_MENU_HEIGHT = useMemo(() => {
    if (!isTouch) return 260;
    const h = vvh || (typeof window !== "undefined" ? window.innerHeight : 640);
    return Math.max(200, Math.min(360, Math.floor(h * 0.6)));
  }, [isTouch, vvh]);

  // 🔴 Control menu open state so it opens when focused/typed on phones
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={
      {overflow:"auto",
      touchAction:"pan-y",
      height:"auto"
    }
    }>
    <form onSubmit={onSubmit} className="flex gap-2">
      <div style={{ width: 320, fontFamily: "sans-serif" }}>
        {/* Country select */}
        <div className="pt-3" style={{ position: "relative", marginBottom: 24 }}>
          <label
            style={{
              position: "absolute",
              top: 4,
              left: 14,
              background: "white",
              fontSize: 12,
              color: "#777",
              padding: "0 4px",
              zIndex: 999,
            }}
          >
            Country
          </label>
          <Select
            options={options}
            value={options.find((o) => o.code === selected.code)}
            onChange={onCountryChange}
            getOptionLabel={(option) => option.name}
            getOptionValue={(option) => option.code}
            formatOptionLabel={(option, { context }) => (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {context === "menu" && (
                  <ReactCountryFlag countryCode={option.code} svg />
                )}
                <span>
                  {option.name}
                  {context === "menu" && ` (+${option.value})`}
                </span>
              </div>
            )}
            menuPortalTarget={
              typeof document !== "undefined" ? document.body : null
            } // portal to body
            menuPosition="absolute" // better for Android scroll
            menuPlacement="auto" // open above or below depending on space
            maxMenuHeight={250} // keeps menu scrollable on small screens
            styles={{
              control: (base, state) => ({
                ...base,
                borderRadius: 8,
                borderColor: state.isFocused ? "#3390EC" : "#ccc",
                boxShadow: "none",
                minHeight: 44,
                fontSize: 15,
                background: "#fff",
                padding: 5,
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: "#fff",
                borderRadius: 8,
                zIndex: 9999,
              }),
              menuList: (base) => ({
                ...base,
                WebkitOverflowScrolling: "touch", // smooth scroll on iOS
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected
                  ? "#E9F3FE"
                  : state.isFocused
                  ? "#F5FAFF"
                  : "#fff",
                color: "#111827",
                cursor: "pointer",
              }),
            }}
            components={{ IndicatorSeparator: null }}
          />
        </div>

        {/* Phone input */}
        <div style={{ position: "relative" }}>
          <label
            style={{
              position: "absolute",
              top: -8,
              left: 14,
              background: "white",
              fontSize: 12,
              color: "#777",
              padding: "0 4px",
              zIndex: 1,
            }}
          >
            Your phone number
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 15,
            }}
          >
            <span style={{ marginRight: 6, color: "#333" }}>
              +{selected.value}
            </span>
            <input
              className="phninput"
              type="tel"
              value={phone}
              onChange={onPhoneChange}
              placeholder=""
              style={{
                border: "none",
                outline: "none",
                flex: 1,
                fontSize: 15,
                color: "#333",
                background: "transparent",
              }}
            />
          </div>
        </div>
      </div>

    </form>
      </div>
  );
}

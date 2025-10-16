"use client";
import React, { useState } from "react";
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
  const [selected, setSelected] = useState({ value: "91", code: "IN", name: "India" });
  const [phone, setPhone] = useState("");

  const onCountryChange = (opt) => {
    setSelected(opt);
    console.log("This is selected option: "+selected);
    
    savePhone({ cc: opt.value, phone });            // update bridge
  };

  const onPhoneChange = (e) => {
    const v = e.target.value;
    setPhone(v);
    savePhone({ cc: selected.value, phone: v });    // update bridge
    // console.log("The phone len is "+v.length);
    
  };

  
  async function onSubmit(e) {
    e.preventDefault();
    const phoneNumber = `${dial}${phone}`.replace(/\s+/g, "");
    const r = await fetch("/api/telegram/phone/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    }).then(r => r.json());
    
    console.log("ye wala ho rha hai bhai ");
    
  
  }




  return (
    <form onSubmit={onSubmit} className="flex gap-2">
    <div style={{ width: 320, fontFamily: "sans-serif" }}>
      {/* Country select */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <label style={{ position: "absolute", top: -8, left: 14, background: "white", fontSize: 12, color: "#777", padding: "0 4px", zIndex: 10 }}>
          Country
        </label>
        <Select
        menuPosition="fixed"
        menuPlacement="auto"
        menuShouldBlockScroll={false}
        closeMenuOnScroll={false}
        maxMenuHeight={320}

          options={options}
          value={options.find((o) => o.code === selected.code)}
          onChange={onCountryChange}
          placeholder=""
          getOptionLabel={(option) => option.name}
          getOptionValue={(option) => option.code}
          formatOptionLabel={(option, { context }) => (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {context === "menu" && <ReactCountryFlag countryCode={option.code} svg />}
              <span>
                {option.name}
                {context === "menu" && ` (+${option.value})`}
              </span>
            </div>
          )}

          /* NEW: force light theme so it doesn't go dull in dark mode */
          theme={(theme) => ({
            ...theme,
            colors: {
              ...theme.colors,
              primary: "#3390EC",
              primary25: "#E9F3FE",
              primary50: "#D6E9FD",
              neutral0:  "#FFFFFF",   // control & menu bg
              neutral20: "#D1D5DB",   // border
              neutral30: "#C7C9CF",
              neutral60: "#6B7280",   // indicators
              neutral80: "#111827",   // text
              neutral90: "#111827",
            },
          })}

          styles={{
            control: (base, state) => ({
              ...base,
              borderRadius: 8,
              borderColor: state.isFocused ? "#3390EC" : "#ccc",
              boxShadow: "none",
              minHeight: 44,
              fontSize: 15,
              background: "#fff",     // ← keep light in dark mode
              zIndex: 5,
              padding: 5,
            }),
            singleValue: (base) => ({ ...base, color: "#111827" }),
            input: (base) => ({ ...base, color: "#111827" }),
            placeholder: (base) => ({ ...base, color: "#6B7280" }),
            dropdownIndicator: (base, s) => ({ ...base, color: s.isFocused ? "#3390EC" : "#6B7280" }),
            indicatorSeparator: () => ({ display: "none" }),

            /* NEW: keep the menu bright regardless of dark mode */
            menu: (base) => ({
              ...base,
              backgroundColor: "#fff",
              color: "#111827",
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              zIndex: 9999,
            }),
            menuList: (base) => ({
              ...base,
              backgroundColor: "#fff",
              padding: 6,
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

          menuPortalTarget={typeof document !== "undefined" ? document.body : null}
          components={{ IndicatorSeparator: null }}
        />

      </div>

      {/* Phone input */}
      <div style={{ position: "relative" }}>
        <label style={{ position: "absolute", top: -8, left: 14, background: "white", fontSize: 12, color: "#777", padding: "0 4px", zIndex: 1 }}>
          Your phone number
        </label>
        <div style={{ display: "flex", alignItems: "center", border: "1px solid #ccc", borderRadius: 8, padding: "10px 12px", fontSize: 15 }}>
          <span style={{ marginRight: 6, color: "#333" }}>+{selected.value}</span>
          <input
            className="phninput"
            type="tel"
            value={phone}
            onChange={onPhoneChange}
            placeholder=""
            style={{ border: "none", outline: "none", flex: 1, fontSize: 15, color: "#333", background: "transparent" }}
          />
        </div>
      </div>
    </div>
</form>
  );
}

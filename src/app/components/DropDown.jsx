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
  const [selected, setSelected] = useState({
    value: "91",
    code: "IN",
    name: "India",
  });
  const [phone, setPhone] = useState("");

  const onCountryChange = (opt) => {
    setSelected(opt);
    console.log("This is selected option: " + selected);

    savePhone({ cc: opt.value, phone }); // update bridge
  };

  const onPhoneChange = (e) => {
    const v = e.target.value;
    setPhone(v);
    savePhone({ cc: selected.value, phone: v }); // update bridge
    // console.log("The phone len is "+v.length);
  };

  async function onSubmit(e) {
    e.preventDefault();
    const phoneNumber = `${dial}${phone}`.replace(/\s+/g, "");
    const r = await fetch("/api/telegram/phone/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    }).then((r) => r.json());

    console.log("ye wala ho rha hai bhai ");
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <div style={{ width: 320, fontFamily: "sans-serif" }}>
        {/* Country select */}
        <div style={{ position: "relative", marginBottom: 24 }}>
          <label
            style={{
              position: "absolute",
              top: -8,
              left: 14,
              background: "white",
              fontSize: 12,
              color: "#777",
              padding: "0 4px",
              zIndex: 10,
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
  );
}

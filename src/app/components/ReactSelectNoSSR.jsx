"use client";

import dynamic from "next/dynamic";

// dynamically import react-select with SSR disabled
const Select = dynamic(() => import("react-select"), { ssr: false });

export default Select;

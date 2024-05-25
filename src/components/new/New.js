import React from "react";
import useEffect from "react";

export default function New() {
  function Name() {
    console.log("Yash");
  }
  useEffect(() => {
    Name();
  });
}

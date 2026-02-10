import React from "react";
import AppContext from "../context/AppContext.js";

export default function useApp(): { exit: (error?: Error) => void } {
  const { exit } = React.useContext(AppContext);
  return { exit };
}

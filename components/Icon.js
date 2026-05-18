import React from "react";
import { Feather } from "@expo/vector-icons";
import { ICONS } from "../constants/icons";

export default function Icon({ name, ...props }) {
  const resolvedName = ICONS[name] || name;

  return <Feather name={resolvedName} {...props} />;
}

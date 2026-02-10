/*
  docs/javascripts/mermaid-init.js — Mermaid initialization for MkDocs Material.
*/

/* global mermaid */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof mermaid === "undefined") return;
  mermaid.initialize({ startOnLoad: true });
});

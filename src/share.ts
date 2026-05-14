const SEP = "\u001f";
const MAX_NAME = 50;
const MAX_MSG = 240;

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(token: string): Uint8Array {
  const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodePayload(a: string, b: string, msg?: string): string {
  const parts = [a.trim(), b.trim()];
  const m = (msg ?? "").trim();
  if (m) parts.push(m.slice(0, MAX_MSG));
  return toBase64Url(new TextEncoder().encode(parts.join(SEP)));
}

export interface DecodedPayload {
  name1: string;
  name2: string;
  message: string | null;
}

export function decodePayload(token: string): DecodedPayload | null {
  try {
    const text = new TextDecoder().decode(fromBase64Url(token));
    const parts = text.split(SEP);
    if (parts.length < 2 || parts.length > 3) return null;
    const [a, b, m] = parts;
    if (!a.trim() || !b.trim()) return null;
    if (a.length > MAX_NAME || b.length > MAX_NAME) return null;
    if (m && m.length > MAX_MSG) return null;
    return {
      name1: a,
      name2: b,
      message: m ? m.trim() : null,
    };
  } catch {
    return null;
  }
}

export interface ShareUrlOptions {
  fast?: boolean;
  message?: string;
}

export function buildShareUrl(
  a: string,
  b: string,
  opts: ShareUrlOptions = {}
): string {
  const token = encodePayload(a, b, opts.message);
  const params = new URLSearchParams();
  params.set("l", token);
  if (opts.fast) params.set("f", "1");
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#${params.toString()}`;
}

export interface ShareLoad {
  token: string;
  fast: boolean;
}

export function readShareFromHash(): ShareLoad | null {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const token = params.get("l");
  if (!token) return null;
  return { token, fast: params.get("f") === "1" };
}

export function clearHash() {
  history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`
  );
}

export const MESSAGE_LIMIT = MAX_MSG;

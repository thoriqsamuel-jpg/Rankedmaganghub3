import { getStore } from "@netlify/blobs";
import { timingSafeEqual } from "node:crypto";

const NAMES = ["Thoriq","Dwiko","Fathur","Fata","Jajang","Bahtera","Nanda","Argya","Adzra","Rere","Rahma","Stania","Gitya"];
const num = (v) => Math.max(0, Math.min(999, Math.floor(Number(v) || 0)));
const json = (obj, status = 200) =>
  Response.json(obj, { status, headers: { "cache-control": "no-store" } });

function samePassword(input, secret) {
  const a = Buffer.from(String(input ?? ""));
  const b = Buffer.from(String(secret));
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async (req) => {
  const store = getStore("absensi");

  if (req.method === "GET") {
    return json((await store.get("data", { type: "json" })) || {});
  }

  if (req.method === "POST") {
    const secret = process.env.ADMIN_PASSWORD;
    if (!secret) return json({ error: "ADMIN_PASSWORD belum diatur di Netlify." }, 500);

    let body;
    try { body = await req.json(); } catch { return json({ error: "Format data salah." }, 400); }

    if (!samePassword(body.password, secret)) return json({ error: "Kata sandi salah." }, 401);
    if (body.check) return json({ ok: true });

    const period = Number(body.period);
    if (!Number.isInteger(period) || period < 0 || period > 5) return json({ error: "Periode tidak valid." }, 400);

    const clean = {};
    for (const n of NAMES) {
      const r = (body.c && body.c[n]) || {};
      const i = num(r.i), b = num(r.b), l = num(r.l);
      if (i || b || l) clean[n] = { i, b, l };
    }

    const data = (await store.get("data", { type: "json" })) || {};
    data[period] = clean;
    await store.setJSON("data", data);
    return json({ ok: true });
  }

  return json({ error: "Metode tidak didukung." }, 405);
};

export const config = { path: "/api/absensi" };

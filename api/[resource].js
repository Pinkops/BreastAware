// Single entry point for every API route. The Vercel Hobby plan allows a
// maximum of 12 serverless functions per deployment, so instead of one
// function per resource, this ONE dynamic function dispatches to the
// underscore-prefixed modules next to it (those are private files and are
// never deployed as endpoints). Public URLs are unchanged: /api/profile,
// /api/observations, /api/upload, etc.
import appointments from './_appointments.js';
import bodyMap from './_body-map.js';
import checkIns from './_check-ins.js';
import doctorPrep from './_doctor-prep.js';
import education from './_education.js';
import exportData from './_export.js';
import normalBaseline from './_normal-baseline.js';
import observations from './_observations.js';
import profile from './_profile.js';
import riskNotes from './_risk-notes.js';
import screenings from './_screenings.js';
import summary from './_summary.js';
import upload from './_upload.js';
import vault from './_vault.js';
import { rateLimit } from './_util.js';

const routes = {
  appointments,
  'body-map': bodyMap,
  'check-ins': checkIns,
  'doctor-prep': doctorPrep,
  education,
  export: exportData,
  'normal-baseline': normalBaseline,
  observations,
  profile,
  'risk-notes': riskNotes,
  screenings,
  summary,
  upload,
  vault,
};

export default async function handler(req, res) {
  const resource = req.query?.resource;
  const route = routes[resource];
  if (!route) {
    // No CORS header here either (BA-010): the API is same-origin only.
    return res.status(404).json({ error: 'Not found' });
  }

  // BA-011 / BA-062: rate limiting (free, in-memory, per-instance)
  // Stricter for mutations, looser for reads. Education is public and low-risk but still limited.
  const isMutation = req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE';
  const isSensitive = resource === 'upload' || resource === 'export';
  
  let limit = 100; // default: 100 req/min per IP for reads
  if (isSensitive) limit = 20; // uploads/exports are heavier
  else if (isMutation) limit = 40; // mutations: 40/min per IP
  else if (resource === 'education') limit = 120; // education list is cheap and public

  const ok = rateLimit(req, res, { limit, windowMs: 60 * 1000, keyPrefix: `rl:${resource}:${req.method}` });
  if (!ok) return; // 429 already sent

  return route(req, res);
}

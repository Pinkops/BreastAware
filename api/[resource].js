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
import vaultUploadUrl from './_vault-upload-url.js';
import visitReadiness from './_visit-readiness.js';
import leads from './_leads.js';
import redeem from './_redeem.js';
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
  'vault-upload-url': vaultUploadUrl,
  leads,
  'visit-readiness': visitReadiness,
  redeem,
};

export default async function handler(req, res) {
  const resource = req.query?.resource;
  const route = routes[resource];
  if (!route) {
    return res.status(404).json({ error: 'Not found' });
  }

  const isMutation = req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE';
  const isSensitive = resource === 'upload' || resource === 'export';
  
  let limit = 100;
  if (isSensitive) limit = 20;
  else if (isMutation) limit = 40;
  else if (resource === 'education') limit = 120;

  const ok = rateLimit(req, res, { limit, windowMs: 60 * 1000, keyPrefix: `rl:${resource}:${req.method}` });
  if (!ok) return;

  return route(req, res);
}

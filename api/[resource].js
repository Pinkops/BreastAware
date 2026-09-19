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
  const route = routes[req.query?.resource];
  if (!route) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(404).json({ error: 'Not found' });
  }
  return route(req, res);
}

// Isolated repository-layer doubles exercise the real Express routes without live database writes.
import express from 'express';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createApp } from '../backend/app.js';
import Admin from '../backend/models/admin.js';
import Notice from '../backend/models/notice.js';
import Timetable from '../backend/models/timetable.js';
import { defaultTimetable } from '../shared/timetable.js';

const baselineCommit = '884362d2a4fb13755e3637c1245d90ed1fe3d955';
let notices;
let entries;
let admins;
function reset() {
  notices = [{ _id: '507f1f77bcf86cd799439011', title: 'Community lunch', content: 'Join us for lunch.\nEveryone is welcome.', postedAt: new Date('2026-10-20T00:00:00Z') }];
  entries = structuredClone(defaultTimetable);
  admins = [{ _id: '507f191e810c19729de860ea', username: 'test-admin', validatePassword: async value => value === 'test-password' }];
}
reset();
Admin.findOne = async ({ username }) => admins.find(admin => admin.username === username);
Admin.prototype.save = async function () { admins.push({ username: this.username, validatePassword: async value => value === this.password }); return this; };
Notice.find = () => ({ sort: async () => [...notices].reverse() });
Notice.prototype.save = async function () { notices.push(this.toObject()); return this; };
Notice.findByIdAndDelete = async id => { notices = notices.filter(notice => String(notice._id) !== id); };
Notice.findByIdAndUpdate = async (id, update) => {
  const notice = notices.find(item => String(item._id) === id);
  if (notice) Object.assign(notice, update);
  return notice;
};
Timetable.getCurrent = async () => entries;
Timetable.findOneAndUpdate = async (_query, update) => { entries = update.entries; return { entries }; };

const app = express();
app.post('/__test/reset', (_req, res) => { reset(); res.json({ success: true }); });
const server = createServer(app);
const webApp = await createApp({ sessionSecret: 'isolated-test-secret', development: process.argv.includes('--dev'), httpServer: server });
app.use(webApp);
server.listen(5099, '127.0.0.1');

const baseline = express();
baseline.use('/static', express.static('frontend/static'));
baseline.get('/notices', (_req, res) => res.json(notices));
baseline.get('/timetable', (_req, res) => res.json(entries));
for (const [route, file] of [['/', 'index.html'], ['/admin/login', 'admin-login.html'], ['/admin/dashboard', 'admin-dashboard.html'], ['/js/index.js', 'js/index.js'], ['/js/admin-dashboard.js', 'js/admin-dashboard.js']]) {
  const source = execFileSync('git', ['show', `${baselineCommit}:frontend/${file}`], { encoding: 'utf8' });
  baseline.get(route, (_req, res) => res.type(file.endsWith('.js') ? 'js' : 'html').send(source));
}
const referenceServer = baseline.listen(5100, '127.0.0.1');
process.on('SIGTERM', async () => {
  await webApp.locals.close();
  server.close();
  referenceServer.close();
});

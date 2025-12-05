require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const usersRoutes = require('./routes/users');
const storesRoutes = require('./routes/stores');
const auditRoutes = require('./routes/audit');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);
app.use('/users', usersRoutes);
app.use('/stores', storesRoutes);
app.use('/audit', auditRoutes);

app.get('/', (req, res) => res.json({ ok: true, msg: 'API Notafacil rodando' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));

// Note: routes already registered above

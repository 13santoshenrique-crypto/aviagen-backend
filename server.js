import express from 'express'
import cors from 'cors'
import pkg from 'pg'
import jwt from 'jsonwebtoken'

const { Pool } = pkg
const app = express()
app.use(cors())
app.use(express.json())

// Conexão com PostgreSQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// Inicializa banco automaticamente
async function initDatabase() {
  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS service_orders (
    id SERIAL PRIMARY KEY,
    requester TEXT,
    sector TEXT,
    technician TEXT,
    priority TEXT,
    deadline DATE,
    status TEXT,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  `
  await pool.query(createTableQuery)
  console.log('Banco verificado/criado com sucesso')
}

initDatabase().catch(err => console.error('Erro ao inicializar DB:', err))

const SECRET = 'aviagen-secret'

// Middleware de autenticação
function auth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.sendStatus(401)

  const token = authHeader.split(' ')[1]
  try {
    req.user = jwt.verify(token, SECRET)
    next()
  } catch {
    res.sendStatus(403)
  }
}

// Login simples
app.post('/login', (req, res) => {
  const users = {
    admin: { role: 'admin' },
    gestor: { role: 'gestor' },
    tecnico: { role: 'tecnico' }
  }
  const user = users[req.body.user]
  if (!user) return res.sendStatus(401)
  const token = jwt.sign({ role: user.role }, SECRET)
  res.json({ token, role: user.role })
})

// Criar OS
app.post('/os', auth, async (req, res) => {
  try {
    const { requester, sector, technician, priority, deadline, status, description, notes } = req.body
    await pool.query(
      `INSERT INTO service_orders
       (requester, sector, technician, priority, deadline, status, description, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [requester, sector, technician, priority, deadline, status, description, notes]
    )
    res.sendStatus(201)
  } catch (err) {
    console.error('Erro ao criar OS:', err)
    res.sendStatus(500)
  }
})

// Dashboard
app.get('/dashboard', auth, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status != 'Finalizada') AS abertas,
        COUNT(*) FILTER (WHERE status = 'Finalizada') AS finalizadas
      FROM service_orders
    `)
    res.json(r.rows[0])
  } catch (err) {
    console.error('Erro dashboard:', err)
    res.sendStatus(500)
  }
})

// IA executiva (apenas admin)
app.get('/ia/resumo', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403)
  try {
    const r = await pool.query(`
      SELECT COUNT(*) AS total
      FROM service_orders
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    `)
    const texto = `Resumo Executivo\n\nTotal de ordens de serviço no mês atual: ${r.rows[0].total}.`
    res.json({ texto })
  } catch (err) {
    console.error('Erro IA resumo:', err)
    res.sendStatus(500)
  }
})

app.listen(3000, () => console.log('Backend rodando na porta 3000'))

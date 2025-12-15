import express from 'express'
updated_at timestamp default now()
);
`)
console.log('Banco verificado')
}


initDatabase()


const SECRET = 'aviagen-secret'


// middleware de autenticação
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


// login simples
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


// criar OS
app.post('/os', auth, async (req, res) => {
const { requester, sector, technician, priority, deadline, status, description, notes } = req.body
await pool.query(
`insert into service_orders
(requester, sector, technician, priority, deadline, status, description, notes)
values ($1,$2,$3,$4,$5,$6,$7,$8)`,
[requester, sector, technician, priority, deadline, status, description, notes]
)
res.sendStatus(201)
})


// dashboard simples
app.get('/dashboard', auth, async (req, res) => {
const r = await pool.query(`
select
count(*) filter (where status != 'Finalizada') as abertas,
count(*) filter (where status = 'Finalizada') as finalizadas
from service_orders
`)
res.json(r.rows[0])
})


// IA executiva (admin)
app.get('/ia/resumo', auth, async (req, res) => {
if (req.user.role !== 'admin') return res.sendStatus(403)
const r = await pool.query(`
select count(*) as total
from service_orders
where date_trunc('month', created_at) = date_trunc('month', now())
`)
const texto = `Resumo Executivo\n\nTotal de ordens de serviço no mês atual: ${r.rows[0].total}.\nRecomenda-se acompanhamento contínuo dos indicadores.`
res.json({ texto })
})


app.listen(3000, () => console.log('Backend rodando'))

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURAÇÕES ---
app.use(cors());
app.use(express.json());

// --- DADOS EM MEMÓRIA (TEMPORÁRIO) ---
// Usuários do Sistema
const usuarios = [
    { email: 'admin@aviagen.com', password: '123', name: 'Diretoria', role: 'admin' },
    { email: 'tecnico@aviagen.com', password: '123', name: 'Técnico João', role: 'user' }
];

// Ordens de Serviço Iniciais
let ordensDeServico = [
    {
        id: "1",
        description: "Manutenção Preventiva Estufa A",
        sector: "Incubatório 1",
        technician: "Técnico João",
        priority: "Média",
        status: "Finalizada",
        type: "Preventiva",
        duration: 60,
        executionDate: "2023-10-25",
        notes: "Filtros trocados.",
        createdAt: new Date()
    },
    {
        id: "2",
        description: "Motor travado na Esteira 2",
        sector: "Expedição",
        technician: "Técnico João",
        priority: "Alta",
        status: "Aberta",
        type: "Corretiva",
        duration: 0,
        notes: "",
        createdAt: new Date()
    }
];

// --- MIDDLEWARE DE SEGURANÇA ---
const checkAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: "Token necessário" });
    next();
};

// --- ROTAS ---

// 1. Rota de Teste
app.get('/', (req, res) => res.send('✅ Backend Aviagen Online!'));

// 2. ROTA DE LOGIN (A QUE FALTAVA)
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    // Procura usuário na lista
    const user = usuarios.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ message: "E-mail ou senha inválidos" });
    }

    // Retorna um token falso e os dados do usuário
    res.json({
        token: "token-de-acesso-simulado-123",
        name: user.name,
        role: user.role
    });
});

// 3. Listar OS
app.get('/os', checkAuth, (req, res) => {
    res.json(ordensDeServico);
});

// 4. Criar OS
app.post('/os', checkAuth, (req, res) => {
    const { description, sector, technician, priority, deadline, status, type, notes } = req.body;
    const novaOS = {
        id: uuidv4(),
        description, sector, technician, priority, deadline,
        status: status || 'Aberta',
        type: type || 'Corretiva',
        notes: notes || '',
        duration: 0,
        executionDate: null,
        createdAt: new Date()
    };
    ordensDeServico.push(novaOS);
    res.status(201).json(novaOS);
});

// 5. Atualizar OS (Dar Baixa)
app.put('/os/:id', checkAuth, (req, res) => {
    const { id } = req.params;
    const index = ordensDeServico.findIndex(os => os.id === id || os._id === id);

    if (index === -1) return res.status(404).json({ message: "OS não encontrada" });

    // Atualiza os dados mantendo os antigos se não vier nada novo
    const atual = ordensDeServico[index];
    ordensDeServico[index] = {
        ...atual,
        ...req.body, // Sobrescreve com o que veio do frontend
        duration: req.body.duration ? Number(req.body.duration) : atual.duration
    };

    res.json(ordensDeServico[index]);
});

// 6. Dashboard
app.get('/dashboard', checkAuth, (req, res) => {
    const abertas = ordensDeServico.filter(os => os.status !== 'Finalizada').length;
    const finalizadas = ordensDeServico.filter(os => os.status === 'Finalizada').length;
    res.json({ abertas, finalizadas, total: ordensDeServico.length });
});

// 7. IA Resumo
app.get('/ia/resumo', checkAuth, (req, res) => {
    const abertas = ordensDeServico.filter(os => os.status !== 'Finalizada').length;
    if (abertas > 5) return res.json({ texto: `Alerta: ${abertas} ordens acumuladas. Priorize a equipe técnica.` });
    res.json({ texto: "Operação estável. Fluxo de manutenção sob controle." });
});

// --- START ---
app.listen(PORT, () => {
    console.log(`🔥 Servidor rodando na porta ${PORT}`);
});

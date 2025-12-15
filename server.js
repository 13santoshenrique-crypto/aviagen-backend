const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURAÇÕES DE SEGURANÇA E ACESSO ---
app.use(cors()); // Permite que o Dashboard acesse o servidor
app.use(express.json()); // Permite ler JSON enviado pelo formulário

// --- BANCO DE DADOS TEMPORÁRIO (Memória) ---
// Nota: Em produção real, substituiríamos isso por MongoDB.
let ordensDeServico = [
    {
        id: "1",
        description: "Manutenção Preventiva Estufa A",
        sector: "Incubatório 1",
        technician: "Carlos Silva",
        priority: "Média",
        status: "Finalizada",
        type: "Preventiva",
        duration: 60,
        executionDate: "2023-10-25",
        notes: "Troca de filtros realizada com sucesso.",
        createdAt: new Date()
    },
    {
        id: "2",
        description: "Falha no Motor da Esteira",
        sector: "Expedição",
        technician: "João Santos",
        priority: "Alta",
        status: "Aberta",
        type: "Corretiva",
        duration: 0,
        notes: "",
        createdAt: new Date()
    }
];

// --- MIDDLEWARE DE AUTENTICAÇÃO SIMPLES ---
// Verifica se o Frontend mandou o Token (Simulação)
const checkAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: "Acesso negado. Faça login." });
    }
    next();
};

// --- ROTAS DA API ---

// 1. Rota de Teste (Para saber se o servidor está vivo)
app.get('/', (req, res) => {
    res.send('✅ Servidor Aviagen Tech Operante!');
});

// 2. Buscar todas as OS (GET /os)
app.get('/os', checkAuth, (req, res) => {
    // Retorna a lista completa
    res.json(ordensDeServico);
});

// 3. Criar Nova OS (POST /os)
app.post('/os', checkAuth, (req, res) => {
    const { description, sector, technician, priority, deadline, status, type, notes } = req.body;

    const novaOS = {
        id: uuidv4(), // Gera ID único
        description,
        sector,
        technician,
        priority,
        deadline,
        status: status || 'Aberta',
        type: type || 'Corretiva', // Padrão se não vier
        notes: notes || '',
        duration: 0, // Começa zerado
        executionDate: null,
        createdAt: new Date()
    };

    ordensDeServico.push(novaOS);
    console.log(`[NOVA OS] Criada: ${description} - ID: ${novaOS.id}`);
    
    res.status(201).json({ message: "OS Criada com sucesso", os: novaOS });
});

// 4. Atualizar/Dar Baixa na OS (PUT /os/:id)
app.put('/os/:id', checkAuth, (req, res) => {
    const { id } = req.params;
    const { status, notes, duration, executionDate, priority } = req.body;

    const index = ordensDeServico.findIndex(os => os.id === id || os._id === id);

    if (index === -1) {
        return res.status(404).json({ message: "OS não encontrada" });
    }

    // Atualiza apenas os campos enviados
    const osAtual = ordensDeServico[index];
    ordensDeServico[index] = {
        ...osAtual,
        status: status || osAtual.status,
        notes: notes || osAtual.notes,
        priority: priority || osAtual.priority,
        duration: duration ? Number(duration) : osAtual.duration,
        executionDate: executionDate || osAtual.executionDate
    };

    console.log(`[ATUALIZAÇÃO] OS ${id} atualizada para status: ${status}`);
    res.json({ message: "Atualizado com sucesso", os: ordensDeServico[index] });
});

// 5. Dashboard Resumo (GET /dashboard)
app.get('/dashboard', checkAuth, (req, res) => {
    const abertas = ordensDeServico.filter(os => os.status !== 'Finalizada').length;
    const finalizadas = ordensDeServico.filter(os => os.status === 'Finalizada').length;
    
    res.json({
        abertas,
        finalizadas,
        total: ordensDeServico.length
    });
});

// 6. IA Executiva (GET /ia/resumo)
// Gera uma análise inteligente baseada nos dados atuais
app.get('/ia/resumo', checkAuth, (req, res) => {
    const total = ordensDeServico.length;
    const abertas = ordensDeServico.filter(os => os.status !== 'Finalizada').length;
    const corretivas = ordensDeServico.filter(os => os.type === 'Corretiva').length;

    let analise = "";

    if (total === 0) {
        analise = "O sistema ainda não possui dados suficientes para gerar insights estratégicos. Inicie registrando as primeiras manutenções.";
    } else if (abertas > 5) {
        analise = `Atenção: Identificamos um acúmulo de ${abertas} ordens pendentes. Isso representa ${(abertas/total*100).toFixed(0)}% da demanda. Sugiro alocar força-tarefa para evitar gargalos na produção.`;
    } else if (corretivas > total * 0.5) {
        analise = "Alerta de Eficiência: Mais de 50% das suas manutenções são Corretivas (Apagar Incêndio). Recomendamos revisar o plano de Manutenção Preventiva para reduzir paradas não programadas.";
    } else {
        analise = "Excelente desempenho operacional. O fluxo de manutenção está controlado e a equipe apresenta alta taxa de resolução. Mantenha o monitoramento.";
    }

    res.json({ texto: analise });
});

// --- INICIALIZAÇÃO ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 Rota de OS: http://localhost:${PORT}/os`);
});

import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const USUARIOS_SERVICE_URL = process.env.USUARIOS_SERVICE_URL || 'http://localhost:3002';
const CATALOGO_SERVICE_URL = process.env.CATALOGO_SERVICE_URL || 'http://localhost:3001';

async function initDatabase() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS usuario_jogo (
        id SERIAL PRIMARY KEY,
        usuario_id INT NOT NULL,
        jogo_id INT NOT NULL,
        UNIQUE(usuario_id, jogo_id)
      );
    `);

        const result = await pool.query('SELECT COUNT(*) FROM usuario_jogo');
        const count = parseInt(result.rows[0].count, 10);
        if (count === 0) {
            await pool.query(`
        INSERT INTO usuario_jogo (usuario_id, jogo_id) VALUES 
        (1, 1),
        (1, 2);
      `);
            console.log('✓ Banco de dados populado com vínculos iniciais (Ana possui Hollow Knight e Hades).');
        }

        console.log('✓ Tabela de biblioteca verificada/criada com sucesso.');
    } catch (error) {
        console.error('Erro ao inicializar o banco de dados da biblioteca:', error);
    }
}

app.post('/biblioteca', async (req: Request, res: Response) => {
    try {
        const { usuarioId, jogoId } = req.body;

        if (!usuarioId || !jogoId) {
            res.status(400).json({ error: 'Os campos usuarioId e jogoId são obrigatórios.' });
            return;
        }

        try {
            await axios.get(`${USUARIOS_SERVICE_URL}/usuarios/${usuarioId}`);
            await axios.get(`${CATALOGO_SERVICE_URL}/jogos/${jogoId}`);
        } catch (apiError: any) {
            if (apiError.code === 'ECONNREFUSED') {
                res.status(503).json({ error: 'Serviço de Catálogo ou Usuários está indisponível momentaneamente.' });
                return;
            }
            res.status(400).json({ error: 'Não foi possível vincular. Verifique se o usuário e o jogo existem.' });
            return;
        }

        await pool.query(
            'INSERT INTO usuario_jogo (usuario_id, jogo_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [usuarioId, jogoId]
        );

        res.status(201).json({ message: 'Jogo adicionado com sucesso à biblioteca do usuário!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno ao adicionar jogo à biblioteca.' });
    }
});

app.get('/biblioteca/:usuarioId', async (req: Request, res: Response) => {
    try {
        const { usuarioId } = req.params;

        let usuarioDados;
        try {
            const userResponse = await axios.get(`${USUARIOS_SERVICE_URL}/usuarios/${usuarioId}`);
            usuarioDados = userResponse.data;
        } catch (error: any) {
            if (error.code === 'ECONNREFUSED') {
                res.status(503).json({ error: 'Serviço de Usuários (usuarios-service) fora do ar.' });
                return;
            }
            if (error.response && error.response.status === 404) {
                res.status(404).json({ error: 'Usuário não encontrado no sistema.' });
                return;
            }
            res.status(500).json({ error: 'Erro ao obter dados do usuário.' });
            return;
        }

        const bibliotecaResult = await pool.query(
            'SELECT jogo_id FROM usuario_jogo WHERE usuario_id = $1',
            [usuarioId]
        );
        const jogoIds: number[] = bibliotecaResult.rows.map(row => row.jogo_id);

        const jogosCompletos: any[] = [];

        if (jogoIds.length > 0) {
            try {
                const promessasDeRequisicao = jogoIds.map(id =>
                    axios.get(`${CATALOGO_SERVICE_URL}/jogos/${id}`).then(res => res.data)
                );

                const resultadosJogos = await Promise.all(promessasDeRequisicao);
                jogosCompletos.push(...resultadosJogos);
            } catch (error: any) {
                if (error.code === 'ECONNREFUSED') {
                    res.status(503).json({ error: 'Serviço de Catálogo (catalogo-service) fora do ar.' });
                    return;
                }
                console.error('Erro ao buscar dados de algum jogo específico:', error.message);
            }
        }

        const respostaFinal = {
            id: usuarioDados.id,
            nome: usuarioDados.nome,
            email: usuarioDados.email,
            jogos: jogosCompletos
        };

        res.json(respostaFinal);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno ao processar a biblioteca.' });
    }
});

app.listen(port, async () => {
    await initDatabase();
    console.log(`[biblioteca-service] rodando na porta ${port}`);
});
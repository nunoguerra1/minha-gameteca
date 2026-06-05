import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function initDatabase() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL
      );
    `);

        const result = await pool.query('SELECT COUNT(*) FROM usuarios');
        const count = parseInt(result.rows[0].count, 10);

        if (count === 0) {
            await pool.query(`
        INSERT INTO usuarios (nome, email) VALUES
        ('Ana', 'ana@email.com'),
        ('Carlos', 'carlos@email.com'),
        ('Beatriz', 'beatriz@email.com');
      `);
            console.log('✓ Banco de dados populado com usuários iniciais de teste.');
        }
        console.log('✓ Tabela de usuários verificada/criada com sucesso.');
    } catch (error) {
        console.error('Erro ao inicializar o banco de dados de usuários:', error);
    }
}

app.get('/usuarios', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM usuarios ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno ao buscar usuários.' });
    }
});

app.get('/usuarios/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Usuário não encontrado.' });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno ao buscar usuário.' });
    }
});

app.post('/usuarios', async (req: Request, res: Response) => {
    try {
        const { nome, email } = req.body;

        if (!nome || !email) {
            res.status(400).json({ error: 'Os campos nome e email são obrigatórios.' });
            return;
        }

        const userExists = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
            return;
        }

        const result = await pool.query(
            'INSERT INTO usuarios (nome, email) VALUES ($1, $2) RETURNING *',
            [nome, email]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
    }
});

app.listen(port, async () => {
    await initDatabase();
    console.log(`[usuarios-service] rodando na porta ${port}`);
});
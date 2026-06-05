import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function initDatabase() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS jogos (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        plataforma VARCHAR(100) NOT NULL,
        genero VARCHAR(100) NOT NULL
      );
    `);

        const result = await pool.query('SELECT COUNT(*) FROM jogos');
        const count = parseInt(result.rows[0].count, 10);

        if (count === 0) {
            await pool.query(`
        INSERT INTO jogos (titulo, plataforma, genero) VALUES
        ('Hollow Knight', 'PC', 'Metroidvania'),
        ('Hades', 'Switch', 'Roguelike'),
        ('The Witcher 3', 'PC', 'RPG'),
        ('Elden Ring', 'PS5', 'Soulslike');
      `);
            console.log('✓ Banco de dados populado com jogos iniciais de teste.');
        }
        console.log('✓ Tabela de jogos verificada/criada com sucesso.');
    } catch (error) {
        console.error('Erro ao inicializar o banco de dados:', error);
    }
}

app.get('/jogos', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM jogos ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno ao buscar jogos.' });
    }
});

app.get('/jogos/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM jogos WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Jogo não encontrado.' });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno ao buscar jogo.' });
    }
});

app.post('/jogos', async (req: Request, res: Response) => {
    try {
        const { titulo, plataforma, genero } = req.body;

        if (!titulo || !plataforma || !genero) {
            res.status(400).json({ error: 'Os campos titulo, plataforma e genero são obrigatórios.' });
            return;
        }

        const result = await pool.query(
            'INSERT INTO jogos (titulo, plataforma, genero) VALUES ($1, $2, $3) RETURNING *',
            [titulo, plataforma, genero]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno ao cadastrar jogo.' });
    }
});

app.delete('/jogos/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM jogos WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Jogo não encontrado para remoção.' });
            return;
        }

        res.json({ message: 'Jogo removido com sucesso!', jogo: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno ao remover jogo.' });
    }
});

app.listen(port, async () => {
    await initDatabase();
    console.log(`[catalogo-service] rodando na porta ${port}`);
});
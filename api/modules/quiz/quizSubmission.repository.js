import { getPostgresPool } from '../../infrastructure/persistence/postgresql/postgres.client.js';

let quizSubmissionSchemaReady = false;

const ensureQuizSubmissionSchema = async (pool) => {
    if (quizSubmissionSchemaReady) {
        return;
    }

    await pool.query(`
        CREATE TABLE IF NOT EXISTS quiz_submissions (
            id BIGSERIAL PRIMARY KEY,
            quiz_id TEXT NOT NULL,
            user_id TEXT,
            score INTEGER NOT NULL,
            total_questions INTEGER NOT NULL,
            answers JSONB NOT NULL,
            results JSONB NOT NULL,
            message TEXT,
            submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await pool.query('CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz_id ON quiz_submissions (quiz_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_id ON quiz_submissions (user_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_quiz_submissions_submitted_at ON quiz_submissions (submitted_at DESC);');

    quizSubmissionSchemaReady = true;
};

export const saveQuizSubmission = async ({
    quizId,
    userId,
    score,
    totalQuestions,
    answers,
    results,
    message,
}) => {
    const pool = getPostgresPool();

    if (!pool) {
        return null;
    }

    await ensureQuizSubmissionSchema(pool);

    const { rows } = await pool.query(
        `
            INSERT INTO quiz_submissions (
                quiz_id,
                user_id,
                score,
                total_questions,
                answers,
                results,
                message
            ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)
            RETURNING id, quiz_id, user_id, score, total_questions, submitted_at;
        `,
        [
            quizId,
            userId || null,
            score,
            totalQuestions,
            JSON.stringify(Array.isArray(answers) ? answers : []),
            JSON.stringify(Array.isArray(results) ? results : []),
            message || null,
        ]
    );

    return rows[0] || null;
};

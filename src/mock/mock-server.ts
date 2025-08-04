import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat/v1/completion', (req, res) => {
    res.json({
        role: 'assistant',
        message: 'Hello from the mock server!',
        timestamp: Date.now(),
    });
});

app.listen(8081, () => console.log('Mock server listening on port 8081'));
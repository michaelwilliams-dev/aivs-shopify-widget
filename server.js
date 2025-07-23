// 🕒 Timestamp: 2025-07-23T09:15Z – Initial blog route added
import express from 'express';
import bodyParser from 'body-parser';
import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🔧 Middleware
app.use(bodyParser.json());

// 🔐 OpenAI setup
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

// 🔍 Simulated FAISS query (replace with your real logic)
async function queryFaissIndex(topic) {
  return [
    `Our Colombian blend offers a rich, full-bodied profile ideal for espresso lovers.`,
    `Wholesale customers enjoy discounts starting at 5kg monthly orders.`,
    `All our beans are small-batch roasted to order and shipped within 48 hours.`
  ];
}

// 📮 Blog generation route
app.post('/api/blog-draft', async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Missing topic' });

  try {
    const context = (await queryFaissIndex(topic)).join('\n');

    const prompt = `
Write a professional blog post on the topic: "${topic}".
Use only the content below. Do not make anything up.

Reference:
${context}

Include a headline, short intro, key points, and a wrap-up. Keep it concise and relevant to a coffee business audience.
`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const blogText = completion.data.choices[0].message.content;
    res.json({ topic, blogText });
  } catch (error) {
    console.error('Blog generation failed:', error.message);
    res.status(500).json({ error: 'Blog generation failed' });
  }
});

// 🔄 Health check (optional)
app.get('/', (req, res) => {
  res.send('Coffee backend is live.');
});

// ▶️ Start server
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
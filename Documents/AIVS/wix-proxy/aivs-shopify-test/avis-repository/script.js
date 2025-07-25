// 🕒 Version: 2025-07-24T18:30:00Z
// 📦 Updated to use aivs-coffee-backend.onrender.com
//test 123 
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';

app.post('/ask', async (req, res) => {
  const question = req.body.question || req.body.query;
  const email = req.body.email?.trim();

  if (!question) {
    return res.status(400).json({ error: 'Missing question' });
  }

  try {
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: question
    });

    const queryEmbedding = embeddingRes.data[0].embedding;
    const topChunks = await searchIndex(queryEmbedding, 3);

    const contextText = topChunks
      .map(c => c.text?.trim())
      .filter(t => t && t.length > 50)
      .join('\n\n');

    let indexAnswer = '';
    let openaiAnswer = '';

    if (contextText && contextText.length > 50) {
      const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'Answer using only the following source material:\n\n' + contextText },
            { role: 'user', content: question }
          ],
          temperature: 0.3
        })
      });

      const gptData = await gptRes.json();
      indexAnswer = gptData.choices?.[0]?.message?.content || '';
    }

    const fallbackPrompt = `
You are a UK-based specialty coffee business advisor and sustainability consultant.
Answer based only on:
- Coffee shop operations
- Coffee roasting and grinder use
- Sustainability practices in retail and foodservice
- Packaging, waste, sourcing, and energy efficiency for coffee

Avoid all legal or tax-related advice.
If the question is about unrelated topics (e.g. law, personal finance, or unrelated business sectors), respond with:
"This question falls outside the scope of coffee operations, roasting, or sustainability."

Question: "${question}"
`;

    const fallbackData = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a knowledgeable advisor in the coffee industry.' },
        { role: 'user', content: fallbackPrompt }
      ],
      temperature: 0.2
    });

    openaiAnswer = fallbackData.choices?.[0]?.message?.content || 'No additional answer.';

    const combinedAnswer = `🟤 Coffee Assistant Reply\n\n` +
      `📘 *From indexed documents:*\n${indexAnswer || 'No indexed response.'}\n\n` +
      `🧠 *OpenAI fallback response:*\n${openaiAnswer}`;

    // ✉️ Send email if address provided
    if (email && email.includes('@')) {
      try {
        // Generate PDF
        const pdfDoc = new PDFDocument();
        let pdfBuffer = Buffer.alloc(0);
        pdfDoc.on('data', chunk => pdfBuffer = Buffer.concat([pdfBuffer, chunk]));
        pdfDoc.text(combinedAnswer);
        pdfDoc.end();

        // Generate DOCX
        const doc = new Document({
          sections: [
            { children: [new Paragraph({ children: [new TextRun(combinedAnswer)] })] }
          ]
        });
        const docBuffer = await Packer.toBuffer(doc);

        // Send Mailjet email
        const mailjetRes = await fetch("https://api.mailjet.com/v3.1/send", {
          method: "POST",
          headers: {
            "Authorization": "Basic " + Buffer.from(`${process.env.MJ_APIKEY_PUBLIC}:${process.env.MJ_APIKEY_PRIVATE}`).toString("base64"),
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            Messages: [
              {
                From: { Email: "noreply@securemaildrop.uk", Name: "Secure Maildrop" },
                To: [{ Email: email }],
                Subject: "Your Coffee Assistant Answer",
                TextPart: combinedAnswer,
                HTMLPart: combinedAnswer.split('\n').map(l => `<p>${l}</p>`).join(''),
                Attachments: [
                  {
                    ContentType: "application/pdf",
                    Filename: "response.pdf",
                    Base64Content: pdfBuffer.toString('base64')
                  },
                  {
                    ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    Filename: "response.docx",
                    Base64Content: docBuffer.toString('base64')
                  }
                ]
              }
            ]
          })
        });

        const mailResult = await mailjetRes.json();
        console.log("📨 Mailjet status:", mailjetRes.status, mailResult);
      } catch (emailErr) {
        console.error("❌ Mailjet send failed:", emailErr.message);
      }
    }

    res.json({
      answer: combinedAnswer,
      fromIndex: !!indexAnswer,
      sources: topChunks
    });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});
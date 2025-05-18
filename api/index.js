import Fastify from 'fastify'
import cors from '@fastify/cors'

const app = Fastify({
  logger: true,
})

app.register(cors, {
  origin: '*',
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
});

app.post('/decompose', async (req, reply) => {
  const tasks = req.body;
  const prompt = `
    Zadanie: "${tasks}"
    Podziel poszczegółne zadania na kilka mniejszych zadań (pod warunkiem, że są to zadania bardziej złożone, skomplikowane i trudniejsze). 
    Dla każdego zadania dodaj:
    - priorytet: (1-3), gdzie 1 = niski, 3 = wysoki
    - trudność (1-10), gdzie 1 = łatwe, 10 = trudne
    - orientacyjny czas na zadanie w minutach

    Zwróć jako czysty JSON:
    [
      { "title": "Zadanie A", "priority": 2, "difficulty": 3, "timeConsumption": 25  },
      ...
    ] jeśli użytkownik wpisze rzeczy niezwiązane z planowaniem dnia zwróć jako czysty JSON: []
    `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system', content: 'Jesteś pomocnym planerem dnia dla osób z ADHD.'
        },
        {
          role: 'user', content: prompt
        }
        
      ],
      temperature: 0.7
    })
  });
  const openApiResponse = await response.json();

  const rawContent = openApiResponse.choices[0].message.content;
  const cleanedContent = rawContent.replace("```json", '').replace("```", '').trim();
  console.log(cleanedContent);
  const data = JSON.parse(cleanedContent);

  return data;
})

export default async function handler(req, reply) {
  await app.ready()

  app.server.emit('request', req, reply)
}

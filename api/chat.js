export default async function handler(req, res) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    var body = req.body;
    var messages = body.messages || [];

    // Limitar historial para controlar costos
    var recentMessages = messages.slice(-10);

    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: 'Eres un asistente legal especializado en el derecho guatemalteco. Tu trabajo es responder preguntas sobre leyes, jurisprudencia y procedimientos legales de Guatemala de manera clara y accesible.\n\nReglas importantes:\n1. Siempre cita las fuentes específicas (artículos de ley, números de decreto, sentencias) cuando sea posible.\n2. Usa lenguaje simple que cualquier persona pueda entender.\n3. Al final de cada respuesta, incluye un aviso breve: "Nota: Esta información es orientativa. Para tu caso específico, consulta a un abogado."\n4. Si no estás seguro de algo, dilo claramente. No inventes artículos o leyes.\n5. Responde en español.\n6. Mantén las respuestas concisas (máximo 3-4 párrafos).',
        messages: recentMessages
      })
    });

    if (!response.ok) {
      var errorData = await response.text();
      console.error('Anthropic API error:', errorData);
      return res.status(response.status).json({ error: 'Error al consultar la IA' });
    }

    var data = await response.json();
    var textContent = '';
    if (data.content && data.content.length > 0) {
      for (var i = 0; i < data.content.length; i++) {
        if (data.content[i].type === 'text') {
          textContent += data.content[i].text;
        }
      }
    }

    return res.status(200).json({ response: textContent });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

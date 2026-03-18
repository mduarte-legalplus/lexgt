import { useState, useRef, useEffect } from 'react'

var SUGGESTIONS = [
  '¿Qué dice la ley sobre despido injustificado?',
  '¿Cuáles son mis derechos como inquilino?',
  'Explícame el principio de legalidad penal',
]

export default function ChatPanel() {
  var [isOpen, setIsOpen] = useState(false)
  var [messages, setMessages] = useState([])
  var [input, setInput] = useState('')
  var [isLoading, setIsLoading] = useState(false)
  var messagesEndRef = useRef(null)

  useEffect(function () {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  function handleSend(text) {
    var question = text || input.trim()
    if (!question || isLoading) return

    var newMessages = messages.concat([{ role: 'user', content: question }])
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    // Call serverless function
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: newMessages.map(function (m) {
          return { role: m.role, content: m.content }
        })
      })
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.error) {
          setMessages(newMessages.concat([{
            role: 'assistant',
            content: 'Lo siento, hubo un error al procesar tu consulta. Intenta de nuevo.'
          }]))
        } else {
          setMessages(newMessages.concat([{
            role: 'assistant',
            content: data.response
          }]))
        }
        setIsLoading(false)
      })
      .catch(function () {
        setMessages(newMessages.concat([{
          role: 'assistant',
          content: 'No se pudo conectar con el asistente. Verifica tu conexión e intenta de nuevo.'
        }]))
        setIsLoading(false)
      })
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div>
      {/* Chat Toggle Button */}
      <button
        className="chat-toggle"
        onClick={function () { setIsOpen(!isOpen) }}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir asistente legal'}
        title="Pregúntale a la ley"
      >
        {isOpen ? '\u2715' : '\u2696'}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <div>
              <div className="chat-header-title">Asistente Legal</div>
              <div className="chat-header-subtitle">Respuestas basadas en leyes de Guatemala</div>
            </div>
            <button className="chat-close" onClick={function () { setIsOpen(false) }}>
              \u2715
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <div className="chat-welcome-title">Hola, ¿en qué te puedo ayudar?</div>
                <p style={{ marginBottom: '12px' }}>
                  Pregúntame sobre leyes, jurisprudencia o procedimientos legales de Guatemala.
                </p>
                <div>
                  {SUGGESTIONS.map(function (s, i) {
                    return (
                      <button
                        key={i}
                        className="chat-suggestion"
                        onClick={function () { handleSend(s) }}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {messages.map(function (msg, i) {
              return (
                <div key={i} className={'chat-message ' + msg.role}>
                  {msg.content}
                </div>
              )
            })}

            {isLoading && (
              <div className="chat-message thinking">
                Buscando en la legislación...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-row">
            <input
              type="text"
              className="chat-input"
              placeholder="Escribe tu pregunta legal..."
              value={input}
              onChange={function (e) { setInput(e.target.value) }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              className="chat-send"
              onClick={function () { handleSend() }}
              disabled={isLoading || !input.trim()}
            >
              Enviar
            </button>
          </div>

          <div style={{ padding: '0 16px 8px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-ink-muted)', opacity: 0.6 }}>
              Las respuestas no constituyen asesoría legal.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

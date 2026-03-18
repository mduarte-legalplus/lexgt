import { useState, useRef, useEffect } from 'react'
import { searchDocuments, getDocument, getStats } from './lib/api'
import './styles/global.css'

/* ===================================
   SIMPLE MARKDOWN RENDERER
   =================================== */
function renderMarkdown(text) {
  if (!text) return ''
  // Bold
  var result = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Line breaks
  result = result.replace(/\n/g, '<br/>')
  return result
}

/* ===================================
   SIDEBAR
   =================================== */
function Sidebar({ currentView, onNavigate, stats }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">L</div>
          <span>Lex<span className="logo-gt">GT</span></span>
        </div>
      </div>

      <div className="sidebar-nav">
        <div className="nav-section-label">Principal</div>
        <button
          className={'nav-item' + (currentView === 'chat' ? ' active' : '')}
          onClick={function () { onNavigate('chat') }}
        >
          <span className="nav-icon">{'\u2696'}</span>
          Asistente Legal
        </button>
        <button
          className={'nav-item' + (currentView === 'search' ? ' active' : '')}
          onClick={function () { onNavigate('search') }}
        >
          <span className="nav-icon">{'\uD83D\uDD0D'}</span>
          Buscar Documentos
        </button>

        <div className="nav-section-label">Base de Datos</div>
        <div className="nav-item" style={{ cursor: 'default' }}>
          <span className="nav-icon">{'\uD83D\uDCC4'}</span>
          <span>{stats.total} documentos</span>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="nav-item" style={{ cursor: 'default', fontSize: '11px', color: 'var(--text-muted)' }}>
          No constituye asesor\u00eda legal
        </div>
      </div>
    </div>
  )
}

/* ===================================
   CHAT VIEW
   =================================== */
var SUGGESTIONS = [
  '\u00bfQu\u00e9 dice la ley sobre despido injustificado?',
  '\u00bfC\u00f3mo funciona el amparo en Guatemala?',
  'Derechos del inquilino en arrendamiento',
  'Principio de legalidad penal',
]

function ChatView() {
  var [messages, setMessages] = useState([])
  var [input, setInput] = useState('')
  var [isLoading, setIsLoading] = useState(false)
  var messagesEndRef = useRef(null)
  var textareaRef = useRef(null)

  useEffect(function () {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  function autoResize() {
    var el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
  }

  function handleSend(text) {
    var question = text || input.trim()
    if (!question || isLoading) return

    var newMessages = messages.concat([{ role: 'user', content: question }])
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

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
        var response = data.error
          ? 'Lo siento, hubo un error. Intenta de nuevo.'
          : data.response
        setMessages(newMessages.concat([{ role: 'assistant', content: response }]))
        setIsLoading(false)
      })
      .catch(function () {
        setMessages(newMessages.concat([{
          role: 'assistant',
          content: 'No se pudo conectar con el asistente. Verifica tu conexi\u00f3n.'
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

  var hasMessages = messages.length > 0

  return (
    <div className="chat-view">
      {!hasMessages && (
        <div className="chat-welcome">
          <div className="chat-welcome-icon">{'\u2696'}</div>
          <h1>Asistente Legal de Guatemala</h1>
          <p>Pregunta sobre leyes, jurisprudencia o procedimientos legales.</p>
          <div className="welcome-suggestions">
            {SUGGESTIONS.map(function (s, i) {
              return (
                <button
                  key={i}
                  className="suggestion-btn"
                  onClick={function () { handleSend(s) }}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {hasMessages && (
        <div className="chat-messages">
          {messages.map(function (msg, i) {
            var isUser = msg.role === 'user'
            return (
              <div key={i} className={'msg ' + (isUser ? 'msg-user' : 'msg-assistant')}>
                <div className="msg-avatar">
                  {isUser ? 'M' : '\u2696'}
                </div>
                <div className="msg-content">
                  <div className="msg-sender">{isUser ? 'T\u00fa' : 'LexGT'}</div>
                  <div
                    className="msg-text"
                    dangerouslySetInnerHTML={{ __html: isUser ? msg.content : renderMarkdown(msg.content) }}
                  />
                </div>
              </div>
            )
          })}

          {isLoading && (
            <div className="msg-thinking">
              <div className="msg-avatar">{'\u2696'}</div>
              <div className="thinking-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="chat-input-area">
        <div className="chat-input-box">
          <textarea
            ref={textareaRef}
            rows="1"
            placeholder="Escribe tu pregunta legal..."
            value={input}
            onChange={function (e) { setInput(e.target.value); autoResize() }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className="send-btn"
            onClick={function () { handleSend() }}
            disabled={isLoading || !input.trim()}
          >
            {'\u2191'}
          </button>
        </div>
        <div className="chat-disclaimer">
          Las respuestas son informativas. No constituyen asesor\u00eda legal profesional.
        </div>
      </div>
    </div>
  )
}

/* ===================================
   SEARCH VIEW
   =================================== */
var DOC_TYPES = [
  { value: '', label: 'Todos los tipos' },
  { value: 'sentencia', label: 'Sentencias' },
  { value: 'ley', label: 'Leyes' },
  { value: 'decreto', label: 'Decretos' },
  { value: 'amparo', label: 'Amparos' },
]

var LEGAL_AREAS = [
  { value: '', label: 'Todas las \u00e1reas' },
  { value: 'constitucional', label: 'Constitucional' },
  { value: 'penal', label: 'Penal' },
  { value: 'civil', label: 'Civil' },
  { value: 'laboral', label: 'Laboral' },
  { value: 'tributario', label: 'Tributario' },
]

function SearchView({ onViewDoc }) {
  var [query, setQuery] = useState('')
  var [docType, setDocType] = useState('')
  var [legalArea, setLegalArea] = useState('')
  var [results, setResults] = useState([])
  var [isLoading, setIsLoading] = useState(false)
  var [hasSearched, setHasSearched] = useState(false)

  function handleSearch(e) {
    if (e) e.preventDefault()
    setIsLoading(true)
    setHasSearched(true)

    searchDocuments({
      query: query,
      docType: docType || null,
      legalArea: legalArea || null,
    })
      .then(function (data) {
        setResults(data)
        setIsLoading(false)
      })
      .catch(function () {
        setIsLoading(false)
      })
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    try {
      var d = new Date(dateStr + 'T00:00:00')
      return d.toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch (e) { return dateStr }
  }

  return (
    <div className="search-view">
      <div className="search-header">
        <h2>Buscar Documentos Legales</h2>
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Buscar jurisprudencia, leyes, decretos..."
            value={query}
            onChange={function (e) { setQuery(e.target.value) }}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
        <div className="search-filters">
          <select value={docType} onChange={function (e) { setDocType(e.target.value) }}>
            {DOC_TYPES.map(function (o) {
              return <option key={o.value} value={o.value}>{o.label}</option>
            })}
          </select>
          <select value={legalArea} onChange={function (e) { setLegalArea(e.target.value) }}>
            {LEGAL_AREAS.map(function (o) {
              return <option key={o.value} value={o.value}>{o.label}</option>
            })}
          </select>
        </div>
      </div>

      <div className="search-results">
        {isLoading && (
          <div className="loading-state">
            <p>Buscando documentos...</p>
          </div>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <div className="empty-search">
            <div className="empty-icon">{'\uD83D\uDD0D'}</div>
            <p>No se encontraron resultados. Intenta con otros t\u00e9rminos.</p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div>
            <div className="search-results-count">
              {results.length} resultado{results.length !== 1 ? 's' : ''}
            </div>
            {results.map(function (r) {
              return (
                <div
                  key={r.id}
                  className="result-item"
                  onClick={function () { onViewDoc(r.id) }}
                >
                  <div className="result-item-header">
                    <span className={'result-type-badge type-' + (r.doc_type || 'otro')}>
                      {r.doc_type}
                    </span>
                    <span className="result-item-title">{r.title}</span>
                  </div>
                  <div className="result-item-meta">
                    {r.issuing_body && <span>{r.issuing_body}</span>}
                    {r.document_date && <span>{formatDate(r.document_date)}</span>}
                    {r.case_number && <span>Exp. {r.case_number}</span>}
                  </div>
                  {r.summary && <div className="result-item-summary">{r.summary}</div>}
                </div>
              )
            })}
          </div>
        )}

        {!hasSearched && (
          <div className="empty-search">
            <div className="empty-icon">{'\u2696'}</div>
            <p>Escribe un t\u00e9rmino para buscar en la base de datos legal.</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ===================================
   DOCUMENT VIEW
   =================================== */
function DocumentView({ docId, onBack }) {
  var [doc, setDoc] = useState(null)
  var [isLoading, setIsLoading] = useState(true)

  useEffect(function () {
    setIsLoading(true)
    getDocument(docId)
      .then(function (data) { setDoc(data); setIsLoading(false) })
      .catch(function () { setIsLoading(false) })
  }, [docId])

  if (isLoading) {
    return <div className="doc-view"><div className="loading-state">Cargando documento...</div></div>
  }

  if (!doc) {
    return <div className="doc-view"><p>No se pudo cargar el documento.</p></div>
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    try {
      var d = new Date(dateStr + 'T00:00:00')
      return d.toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch (e) { return dateStr }
  }

  return (
    <div className="doc-view">
      <button className="doc-back" onClick={onBack}>
        {'\u2190'} Volver a resultados
      </button>
      <div className="doc-card">
        <h1 className="doc-title">{doc.title}</h1>
        <div className="doc-meta">
          <span className={'result-type-badge type-' + (doc.doc_type || 'otro')}>
            {doc.doc_type}
          </span>
          {doc.issuing_body && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{doc.issuing_body}</span>
          )}
          {doc.document_date && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(doc.document_date)}</span>
          )}
          {doc.case_number && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Exp. {doc.case_number}</span>
          )}
        </div>
        {doc.summary && <div className="doc-summary"><strong>Resumen: </strong>{doc.summary}</div>}
        <div className="doc-body">{doc.body}</div>
        {doc.source_url && (
          <div className="doc-source">
            <strong>Fuente: </strong>
            <a href={doc.source_url} target="_blank" rel="noopener noreferrer">
              Ver documento original ({doc.source})
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

/* ===================================
   MAIN APP
   =================================== */
export default function App() {
  var [currentView, setCurrentView] = useState('chat')
  var [currentDoc, setCurrentDoc] = useState(null)
  var [stats, setStats] = useState({ total: 0, byType: {} })
  var [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(function () {
    getStats()
      .then(function (data) { setStats(data) })
      .catch(function () {})
  }, [])

  function handleNavigate(view) {
    setCurrentView(view)
    setCurrentDoc(null)
    setMobileMenuOpen(false)
  }

  function handleViewDoc(id) {
    setCurrentDoc(id)
    setCurrentView('document')
  }

  function handleBackFromDoc() {
    setCurrentDoc(null)
    setCurrentView('search')
  }

  return (
    <div className="app">
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        stats={stats}
      />

      <div className="main">
        {/* Mobile header */}
        <div className="mobile-header">
          <div className="sidebar-logo">
            <div className="logo-icon">L</div>
            <span>Lex<span className="logo-gt">GT</span></span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="nav-item"
              style={{ padding: '6px 10px', width: 'auto' }}
              onClick={function () { handleNavigate('chat') }}
            >
              {'\u2696'}
            </button>
            <button
              className="nav-item"
              style={{ padding: '6px 10px', width: 'auto' }}
              onClick={function () { handleNavigate('search') }}
            >
              {'\uD83D\uDD0D'}
            </button>
          </div>
        </div>

        {currentView === 'chat' && <ChatView />}
        {currentView === 'search' && <SearchView onViewDoc={handleViewDoc} />}
        {currentView === 'document' && currentDoc && (
          <DocumentView docId={currentDoc} onBack={handleBackFromDoc} />
        )}
      </div>
    </div>
  )
}

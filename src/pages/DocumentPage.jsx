import { useState, useEffect } from 'react'
import { getDocument } from '../lib/api'

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    var date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch (e) {
    return dateStr
  }
}

export default function DocumentPage({ documentId, onBack }) {
  var [doc, setDoc] = useState(null)
  var [isLoading, setIsLoading] = useState(true)
  var [error, setError] = useState(null)

  useEffect(function () {
    if (!documentId) return

    setIsLoading(true)
    getDocument(documentId)
      .then(function (data) {
        setDoc(data)
        setIsLoading(false)
      })
      .catch(function (err) {
        setError(err.message)
        setIsLoading(false)
      })
  }, [documentId])

  if (isLoading) {
    return (
      <div className="doc-detail main-content">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Cargando documento...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="doc-detail main-content">
        <button className="doc-detail-back" onClick={onBack}>
          &#8592; Volver a resultados
        </button>
        <div className="error-message">{error}</div>
      </div>
    )
  }

  if (!doc) return null

  return (
    <div className="doc-detail main-content">
      <button className="doc-detail-back" onClick={onBack}>
        &#8592; Volver a resultados
      </button>

      <div className="doc-detail-card">
        <h1 className="doc-detail-title">{doc.title}</h1>

        <div className="doc-detail-meta">
          {doc.doc_type && (
            <span className={'result-badge badge-' + doc.doc_type} style={{ textTransform: 'capitalize' }}>
              {doc.doc_type}
            </span>
          )}
          {doc.issuing_body && (
            <span className="result-meta-item">{doc.issuing_body}</span>
          )}
          {doc.document_date && (
            <span className="result-meta-item">{formatDate(doc.document_date)}</span>
          )}
          {doc.case_number && (
            <span className="result-meta-item">Expediente: {doc.case_number}</span>
          )}
          {doc.decree_number && (
            <span className="result-meta-item">{doc.decree_number}</span>
          )}
          {doc.legal_area && (
            <span className="result-meta-item" style={{ textTransform: 'capitalize' }}>
              {doc.legal_area}
            </span>
          )}
        </div>

        {doc.summary && (
          <div className="doc-detail-summary">
            <strong>Resumen: </strong>{doc.summary}
          </div>
        )}

        <div className="doc-detail-body">
          {doc.body}
        </div>

        {doc.source_url && (
          <div className="doc-detail-source">
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

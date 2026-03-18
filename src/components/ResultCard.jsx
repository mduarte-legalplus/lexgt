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

function getBadgeClass(docType) {
  return 'result-badge badge-' + (docType || 'otro')
}

function getDocTypeLabel(docType) {
  var labels = {
    sentencia: 'Sentencia',
    ley: 'Ley',
    decreto: 'Decreto',
    acuerdo: 'Acuerdo',
    amparo: 'Amparo',
    inconstitucionalidad: 'Inconstitucionalidad',
    opinion_consultiva: 'Opinión Consultiva',
    otro: 'Otro',
  }
  return labels[docType] || docType
}

export default function ResultCard({ result, onClick }) {
  return (
    <div className="result-card" onClick={function () { onClick(result.id) }}>
      <div className="result-card-header">
        <span className={getBadgeClass(result.doc_type)}>
          {getDocTypeLabel(result.doc_type)}
        </span>
        <span className="result-title">{result.title}</span>
      </div>

      <div className="result-meta">
        {result.issuing_body && (
          <span className="result-meta-item">
            {result.issuing_body}
          </span>
        )}
        {result.document_date && (
          <span className="result-meta-item">
            {formatDate(result.document_date)}
          </span>
        )}
        {result.case_number && (
          <span className="result-meta-item">
            Exp. {result.case_number}
          </span>
        )}
        {result.legal_area && (
          <span className="result-meta-item" style={{ textTransform: 'capitalize' }}>
            {result.legal_area}
          </span>
        )}
      </div>

      {result.summary && (
        <p className="result-summary">{result.summary}</p>
      )}

      {!result.summary && result.body_preview && (
        <p className="result-body-preview">{result.body_preview}...</p>
      )}
    </div>
  )
}

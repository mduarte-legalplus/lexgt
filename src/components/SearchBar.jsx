import { useState } from 'react'

const DOC_TYPES = [
  { value: '', label: 'Todos los tipos' },
  { value: 'sentencia', label: 'Sentencias' },
  { value: 'ley', label: 'Leyes' },
  { value: 'decreto', label: 'Decretos' },
  { value: 'acuerdo', label: 'Acuerdos' },
  { value: 'amparo', label: 'Amparos' },
  { value: 'inconstitucionalidad', label: 'Inconstitucionalidades' },
]

const LEGAL_AREAS = [
  { value: '', label: 'Todas las áreas' },
  { value: 'constitucional', label: 'Constitucional' },
  { value: 'penal', label: 'Penal' },
  { value: 'civil', label: 'Civil' },
  { value: 'laboral', label: 'Laboral' },
  { value: 'tributario', label: 'Tributario' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'mercantil', label: 'Mercantil' },
  { value: 'familiar', label: 'Familiar' },
]

const SOURCES = [
  { value: '', label: 'Todas las fuentes' },
  { value: 'cenadoj', label: 'CENADOJ' },
  { value: 'cc', label: 'Corte de Constitucionalidad' },
  { value: 'congreso', label: 'Congreso' },
  { value: 'diario_ca', label: 'Diario de Centro América' },
]

export default function SearchBar({ onSearch, isLoading }) {
  var [query, setQuery] = useState('')
  var [docType, setDocType] = useState('')
  var [legalArea, setLegalArea] = useState('')
  var [source, setSource] = useState('')
  var [showFilters, setShowFilters] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    onSearch({
      query: query,
      docType: docType || null,
      legalArea: legalArea || null,
      source: source || null,
    })
  }

  function handleClear() {
    setQuery('')
    setDocType('')
    setLegalArea('')
    setSource('')
    onSearch({ query: '', docType: null, legalArea: null, source: null })
  }

  var hasFilters = docType || legalArea || source

  return (
    <div className="search-box">
      <form onSubmit={handleSubmit}>
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar jurisprudencia, leyes, decretos..."
            value={query}
            onChange={function (e) { setQuery(e.target.value) }}
            aria-label="Búsqueda legal"
          />
          <button
            type="submit"
            className="search-button"
            disabled={isLoading}
          >
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </form>

      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <button
          type="button"
          className="filter-clear"
          onClick={function () { setShowFilters(!showFilters) }}
          style={{ fontSize: '13px' }}
        >
          {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          {hasFilters ? ' (activos)' : ''}
        </button>
      </div>

      {showFilters && (
        <div className="filters">
          <select
            className="filter-select"
            value={docType}
            onChange={function (e) { setDocType(e.target.value) }}
            aria-label="Filtrar por tipo de documento"
          >
            {DOC_TYPES.map(function (opt) {
              return <option key={opt.value} value={opt.value}>{opt.label}</option>
            })}
          </select>

          <select
            className="filter-select"
            value={legalArea}
            onChange={function (e) { setLegalArea(e.target.value) }}
            aria-label="Filtrar por área legal"
          >
            {LEGAL_AREAS.map(function (opt) {
              return <option key={opt.value} value={opt.value}>{opt.label}</option>
            })}
          </select>

          <select
            className="filter-select"
            value={source}
            onChange={function (e) { setSource(e.target.value) }}
            aria-label="Filtrar por fuente"
          >
            {SOURCES.map(function (opt) {
              return <option key={opt.value} value={opt.value}>{opt.label}</option>
            })}
          </select>

          {hasFilters && (
            <button
              type="button"
              className="filter-clear"
              onClick={handleClear}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}

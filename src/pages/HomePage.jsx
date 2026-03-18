import { useState, useEffect } from 'react'
import SearchBar from '../components/SearchBar'
import ResultCard from '../components/ResultCard'
import { searchDocuments, getStats } from '../lib/api'

export default function HomePage({ onViewDocument }) {
  var [results, setResults] = useState([])
  var [isLoading, setIsLoading] = useState(false)
  var [error, setError] = useState(null)
  var [hasSearched, setHasSearched] = useState(false)
  var [stats, setStats] = useState({ total: 0, byType: {} })

  // Cargar estadísticas al iniciar
  useEffect(function () {
    getStats()
      .then(function (data) { setStats(data) })
      .catch(function () { /* silencioso */ })
  }, [])

  function handleSearch(params) {
    setIsLoading(true)
    setError(null)
    setHasSearched(true)

    searchDocuments(params)
      .then(function (data) {
        setResults(data)
        setIsLoading(false)
      })
      .catch(function (err) {
        setError(err.message)
        setIsLoading(false)
      })
  }

  return (
    <div>
      <section className="hero">
        <h1>Buscar en la Ley Guatemalteca</h1>
        <p>Jurisprudencia, leyes, decretos y más. Todo en un solo lugar.</p>

        {stats.total > 0 && (
          <div className="stats-bar">
            <div className="stat-item">
              <div className="stat-number">{stats.total.toLocaleString()}</div>
              <div className="stat-label">Documentos</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                {Object.keys(stats.byType).length}
              </div>
              <div className="stat-label">Tipos</div>
            </div>
          </div>
        )}

        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      </section>

      <section className="results-section main-content">
        {error && (
          <div className="error-message">{error}</div>
        )}

        {isLoading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Buscando documentos...</p>
          </div>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">&#128269;</div>
            <p>No se encontraron resultados. Intenta con otros términos o filtros.</p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div>
            <div className="results-header">
              <span className="results-count">
                {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
              </span>
            </div>
            {results.map(function (result) {
              return (
                <ResultCard
                  key={result.id}
                  result={result}
                  onClick={onViewDocument}
                />
              )
            })}
          </div>
        )}

        {!hasSearched && (
          <div className="empty-state">
            <div className="empty-state-icon">&#9878;</div>
            <p>Escribe un término de búsqueda o usa los filtros para explorar la base de datos legal.</p>
          </div>
        )}
      </section>
    </div>
  )
}

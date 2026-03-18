import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <Link to="/" className="header-logo">
            Lex<span>GT</span>
          </Link>
          <span className="header-subtitle">
            Jurisprudencia y Leyes de Guatemala
          </span>
        </div>
        <nav className="header-nav">
          <Link to="/">Buscar</Link>
          <Link to="/about">Acerca de</Link>
        </nav>
      </div>
    </header>
  )
}

export default function Footer() {
  return (
    <footer className="footer">
      <p>LexGT &copy; {new Date().getFullYear()} - Plataforma de Búsqueda Legal para Guatemala</p>
      <p className="footer-disclaimer">
        Esta plataforma es una herramienta de búsqueda informativa. 
        No constituye asesoría legal. Consulte a un abogado para su caso específico.
      </p>
    </footer>
  )
}

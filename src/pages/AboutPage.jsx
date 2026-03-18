export default function AboutPage() {
  return (
    <div className="main-content" style={{ padding: '40px 20px 60px' }}>
      <h1 style={{ color: 'var(--color-primary)', marginBottom: '16px' }}>
        Acerca de LexGT
      </h1>

      <p style={{ marginBottom: '16px', lineHeight: '1.7' }}>
        LexGT es una plataforma de búsqueda legal para Guatemala. Nuestro objetivo
        es hacer accesible la jurisprudencia y legislación guatemalteca para todos:
        abogados, estudiantes, organizaciones y público en general.
      </p>

      <h2 style={{ color: 'var(--color-primary-light)', marginTop: '24px', marginBottom: '12px' }}>
        Fuentes de información
      </h2>
      <p style={{ marginBottom: '16px', lineHeight: '1.7' }}>
        Recopilamos información de fuentes oficiales públicas: el Centro Nacional de
        Análisis y Documentación Judicial (CENADOJ), la Corte de Constitucionalidad,
        el Congreso de la República, y el Diario de Centro América.
      </p>

      <h2 style={{ color: 'var(--color-primary-light)', marginTop: '24px', marginBottom: '12px' }}>
        Aviso legal importante
      </h2>
      <p style={{ marginBottom: '16px', lineHeight: '1.7', padding: '16px', background: '#FEF9E7', borderRadius: '8px', borderLeft: '3px solid var(--color-accent)' }}>
        LexGT es una herramienta de búsqueda e información. Los resultados y cualquier
        interpretación proporcionada por inteligencia artificial NO constituyen asesoría
        legal. Para su caso específico, siempre consulte a un abogado colegiado activo
        en Guatemala.
      </p>

      <h2 style={{ color: 'var(--color-primary-light)', marginTop: '24px', marginBottom: '12px' }}>
        Contacto
      </h2>
      <p style={{ lineHeight: '1.7' }}>
        LexGT es un proyecto de A2J Tech. Para más información, comentarios o
        sugerencias, puede contactarnos a través de nuestro sitio web.
      </p>
    </div>
  )
}

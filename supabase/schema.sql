-- ============================================================
-- LexGT - Esquema de Base de Datos
-- Ejecutar este archivo en Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query > pegar > Run)
-- ============================================================

-- ============================================================
-- 1. TABLAS PRINCIPALES
-- ============================================================

-- Tabla de documentos legales (sentencias, leyes, decretos, etc.)
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Clasificación
  doc_type TEXT NOT NULL CHECK (doc_type IN (
    'sentencia',       -- Sentencias judiciales
    'ley',             -- Leyes y códigos
    'decreto',         -- Decretos legislativos y gubernativos
    'acuerdo',         -- Acuerdos gubernativos y ministeriales
    'amparo',          -- Resoluciones de amparo (CC)
    'inconstitucionalidad', -- Resoluciones de inconstitucionalidad
    'opinion_consultiva',   -- Opiniones consultivas (CC)
    'otro'
  )),
  
  -- Metadatos principales
  title TEXT NOT NULL,                    -- Título o número del documento
  summary TEXT,                           -- Resumen corto (generado o manual)
  body TEXT NOT NULL,                     -- Texto completo del documento
  
  -- Identificadores oficiales
  case_number TEXT,                       -- Número de expediente (ej: "1234-2023")
  decree_number TEXT,                     -- Número de decreto (ej: "Decreto 17-73")
  
  -- Origen
  source TEXT NOT NULL CHECK (source IN (
    'cenadoj',
    'cc',
    'congreso',
    'diario_ca',
    'otro'
  )),
  source_url TEXT,                        -- URL original del documento
  issuing_body TEXT,                      -- Tribunal o entidad emisora
  
  -- Fechas
  document_date DATE,                     -- Fecha del documento
  publication_date DATE,                  -- Fecha de publicación oficial
  
  -- Materia / área del derecho
  legal_area TEXT,                        -- Ej: "penal", "civil", "constitucional", "laboral"
  
  -- Búsqueda full-text (se llena automáticamente con el trigger)
  search_vector TSVECTOR,
  
  -- Embeddings para búsqueda semántica (se llena en Fase 3)
  embedding VECTOR(1536),
  
  -- Control
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Tabla de etiquetas/tags para clasificación flexible
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT                           -- Ej: "materia", "tribunal", "tema"
);

-- Relación muchos-a-muchos: documentos <-> tags
CREATE TABLE document_tags (
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, tag_id)
);

-- Tabla para tracking de scraping (saber qué ya se descargó)
CREATE TABLE scraping_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,        -- URL del documento ya procesado
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'pending')),
  error_message TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. ÍNDICES PARA BÚSQUEDA RÁPIDA
-- ============================================================

-- Índice Full-Text Search con configuración en español
CREATE INDEX idx_documents_search ON documents USING GIN (search_vector);

-- Índice para búsqueda por tipo de documento
CREATE INDEX idx_documents_type ON documents (doc_type);

-- Índice para búsqueda por fecha
CREATE INDEX idx_documents_date ON documents (document_date DESC);

-- Índice para búsqueda por fuente
CREATE INDEX idx_documents_source ON documents (source);

-- Índice para búsqueda por área legal
CREATE INDEX idx_documents_legal_area ON documents (legal_area);

-- Índice para búsqueda por número de expediente
CREATE INDEX idx_documents_case_number ON documents (case_number);

-- Índice para embeddings vectoriales (se usa en Fase 3)
CREATE INDEX idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================
-- 3. FUNCIONES Y TRIGGERS
-- ============================================================

-- Función para generar el vector de búsqueda automáticamente
-- Usa la configuración 'spanish' de PostgreSQL
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.case_number, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.decree_number, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.issuing_body, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.body, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: actualizar vector de búsqueda cada vez que se inserta o actualiza
CREATE TRIGGER trigger_update_search_vector
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_search_vector();

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_timestamp
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. FUNCIÓN DE BÚSQUEDA (la que llama el frontend)
-- ============================================================

-- Búsqueda full-text con filtros opcionales
CREATE OR REPLACE FUNCTION search_documents(
  search_query TEXT,
  filter_doc_type TEXT DEFAULT NULL,
  filter_legal_area TEXT DEFAULT NULL,
  filter_source TEXT DEFAULT NULL,
  filter_date_from DATE DEFAULT NULL,
  filter_date_to DATE DEFAULT NULL,
  result_limit INTEGER DEFAULT 20,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  doc_type TEXT,
  title TEXT,
  summary TEXT,
  body_preview TEXT,
  case_number TEXT,
  decree_number TEXT,
  source TEXT,
  source_url TEXT,
  issuing_body TEXT,
  document_date DATE,
  legal_area TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.doc_type,
    d.title,
    d.summary,
    LEFT(d.body, 300) AS body_preview,
    d.case_number,
    d.decree_number,
    d.source,
    d.source_url,
    d.issuing_body,
    d.document_date,
    d.legal_area,
    ts_rank(d.search_vector, websearch_to_tsquery('spanish', search_query)) AS rank
  FROM documents d
  WHERE
    d.is_active = TRUE
    AND (search_query IS NULL OR search_query = '' 
         OR d.search_vector @@ websearch_to_tsquery('spanish', search_query))
    AND (filter_doc_type IS NULL OR d.doc_type = filter_doc_type)
    AND (filter_legal_area IS NULL OR d.legal_area = filter_legal_area)
    AND (filter_source IS NULL OR d.source = filter_source)
    AND (filter_date_from IS NULL OR d.document_date >= filter_date_from)
    AND (filter_date_to IS NULL OR d.document_date <= filter_date_to)
  ORDER BY rank DESC, d.document_date DESC NULLS LAST
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. DATOS DE PRUEBA
-- ============================================================

-- Insertar datos de ejemplo para poder probar el frontend
INSERT INTO documents (doc_type, title, body, case_number, source, source_url, issuing_body, document_date, legal_area, summary) VALUES

('sentencia', 
 'Expediente 1822-2011 - Derecho de Propiedad', 
 'La Corte de Constitucionalidad resuelve que el derecho de propiedad privada está garantizado por la Constitución Política de la República de Guatemala en su artículo 39. Sin embargo, este derecho no es absoluto y debe ejercerse en armonía con el interés social. En el presente caso, el recurrente alega que la municipalidad ha invadido su propiedad sin la debida expropiación conforme al artículo 40 constitucional. La Corte determina que toda expropiación debe seguir el procedimiento establecido en la Ley de Expropiación, Decreto 529, y que debe existir previa indemnización. Se declara con lugar el amparo solicitado.',
 '1822-2011',
 'cc',
 'https://cc.gob.gt',
 'Corte de Constitucionalidad',
 '2012-03-15',
 'constitucional',
 'Amparo sobre derecho de propiedad. La CC establece que toda expropiación debe seguir el procedimiento legal con previa indemnización.'),

('ley',
 'Código Penal - Decreto 17-73 del Congreso de la República',
 'El Código Penal de Guatemala establece los delitos y las penas aplicables en la República. En su Libro Primero, Parte General, Título I, establece que solo los hechos descritos por la ley como delitos pueden ser objeto de sanción penal. El artículo 1 establece el principio de legalidad: nadie podrá ser penado por hechos que no estén expresamente calificados como delitos o faltas por ley anterior a su perpetración. El artículo 2 establece que toda persona es inocente mientras no se le haya declarado responsable judicialmente en sentencia debidamente ejecutoriada. El artículo 10 establece que son delitos todos aquellos que conllevan pena de prisión.',
 NULL,
 'congreso',
 'https://congreso.gob.gt',
 'Congreso de la República de Guatemala',
 '1973-07-27',
 'penal',
 'Código Penal de Guatemala. Establece los delitos, las penas, y los principios fundamentales del derecho penal guatemalteco.'),

('sentencia',
 'Expediente 3340-2018 - Despido Injustificado',
 'La Sala Segunda de la Corte de Apelaciones de Trabajo y Previsión Social confirma la sentencia de primera instancia que declara con lugar la demanda por despido injustificado. El trabajador laboró durante 8 años para la empresa demandada sin contrato escrito. La Sala establece que conforme al artículo 26 del Código de Trabajo, la falta de contrato escrito es imputable al patrono y no perjudica al trabajador. Se condena al pago de indemnización, aguinaldo proporcional, bonificación anual proporcional, vacaciones no gozadas, y salarios dejados de percibir conforme los artículos 82, 90 y 102 del Código de Trabajo.',
 '3340-2018',
 'cenadoj',
 'https://oj.gob.gt',
 'Sala Segunda de la Corte de Apelaciones de Trabajo',
 '2019-06-20',
 'laboral',
 'Despido injustificado confirmado. Trabajador sin contrato escrito tiene derecho a indemnización completa conforme el Código de Trabajo.'),

('decreto',
 'Decreto 10-2012 - Ley de Actualización Tributaria',
 'El Congreso de la República de Guatemala decreta la Ley de Actualización Tributaria. Esta ley reforma el Impuesto Sobre la Renta estableciendo dos regímenes: el Régimen Sobre las Utilidades de Actividades Lucrativas con tasa del 25% sobre la renta imponible, y el Régimen Opcional Simplificado Sobre Ingresos de Actividades Lucrativas con tasas del 5% y 7% según tramos de ingresos. La ley también establece normas sobre rentas de capital, ganancias de capital, y rentas de no residentes. Entró en vigencia el 1 de enero de 2013.',
 NULL,
 'congreso',
 'https://congreso.gob.gt',
 'Congreso de la República de Guatemala',
 '2012-02-16',
 'tributario',
 'Ley de Actualización Tributaria. Establece el ISR con régimen sobre utilidades (25%) y régimen simplificado (5%/7%).'),

('sentencia',
 'Expediente 4783-2020 - Derecho a la Salud',
 'La Corte de Constitucionalidad otorga amparo provisional a favor del paciente que requiere tratamiento médico especializado que el IGSS se negó a proporcionar. La Corte razona que el derecho a la salud, reconocido en los artículos 93 y 94 de la Constitución, es un derecho fundamental que el Estado debe garantizar. El IGSS, como institución autónoma encargada de la seguridad social según el artículo 100 constitucional, tiene la obligación de prestar los servicios médicos necesarios a sus afiliados. Se ordena al IGSS proporcionar el tratamiento requerido de manera inmediata.',
 '4783-2020',
 'cc',
 'https://cc.gob.gt',
 'Corte de Constitucionalidad',
 '2020-11-10',
 'constitucional',
 'Amparo a favor de paciente del IGSS. La CC ordena proporcionar tratamiento médico como parte del derecho constitucional a la salud.'),

('ley',
 'Código de Trabajo - Decreto 1441 del Congreso de la República',
 'El Código de Trabajo de Guatemala regula los derechos y obligaciones de patronos y trabajadores con ocasión del trabajo. El artículo 18 define la relación laboral como el vínculo económico-jurídico entre patrono y trabajador. El artículo 22 establece que todo contrato individual de trabajo debe ser por escrito. El artículo 76 establece que hay terminación de los contratos de trabajo cuando se da alguna de las causas establecidas en la ley. El artículo 78 define el despido directo. El artículo 82 establece que el patrono que despida sin causa justificada debe pagar indemnización equivalente a un mes de salario por cada año de servicios continuos.',
 NULL,
 'congreso',
 'https://congreso.gob.gt',
 'Congreso de la República de Guatemala',
 '1961-05-05',
 'laboral',
 'Código de Trabajo. Regula relaciones laborales, contratos, despidos, indemnizaciones y derechos de los trabajadores.'),

('amparo',
 'Expediente 5901-2019 - Libertad de Expresión',
 'La Corte de Constitucionalidad analiza un amparo relacionado con la libertad de expresión en medios digitales. El peticionario, un periodista, alega que se le ordenó eliminar publicaciones de sus redes sociales bajo amenaza de sanción judicial. La Corte establece que la libertad de expresión, garantizada por el artículo 35 de la Constitución, se extiende a los medios digitales y redes sociales. La censura previa está prohibida conforme la Constitución y la Convención Americana sobre Derechos Humanos (artículo 13). Se otorga el amparo y se deja sin efecto la orden de eliminar las publicaciones.',
 '5901-2019',
 'cc',
 'https://cc.gob.gt',
 'Corte de Constitucionalidad',
 '2020-02-14',
 'constitucional',
 'Amparo sobre libertad de expresión en medios digitales. La CC confirma que la censura previa está prohibida, incluso en redes sociales.'),

('sentencia',
 'Expediente 2156-2017 - Contrato de Arrendamiento',
 'El Juzgado Primero Civil de Guatemala resuelve demanda por incumplimiento de contrato de arrendamiento. El arrendatario dejó de pagar la renta durante 6 meses consecutivos. Conforme al artículo 1880 del Código Civil, el arrendador tiene derecho a pedir la rescisión del contrato cuando el arrendatario incumple con el pago de la renta. El tribunal ordena la desocupación del inmueble y el pago de las rentas atrasadas más los daños y perjuicios conforme el artículo 1645 del Código Civil.',
 '2156-2017',
 'cenadoj',
 'https://oj.gob.gt',
 'Juzgado Primero Civil de Guatemala',
 '2018-04-22',
 'civil',
 'Incumplimiento de contrato de arrendamiento. Se ordena desocupación y pago de rentas atrasadas conforme el Código Civil.');

-- Insertar tags de ejemplo
INSERT INTO tags (name, category) VALUES
('derecho constitucional', 'materia'),
('derecho laboral', 'materia'),
('derecho penal', 'materia'),
('derecho civil', 'materia'),
('derecho tributario', 'materia'),
('amparo', 'tipo_recurso'),
('inconstitucionalidad', 'tipo_recurso'),
('casación', 'tipo_recurso'),
('derechos humanos', 'tema'),
('propiedad privada', 'tema'),
('despido', 'tema'),
('libertad de expresión', 'tema'),
('seguridad social', 'tema'),
('arrendamiento', 'tema');

-- Asignar tags a documentos de ejemplo
INSERT INTO document_tags (document_id, tag_id)
SELECT d.id, t.id FROM documents d, tags t 
WHERE d.case_number = '1822-2011' AND t.name IN ('derecho constitucional', 'amparo', 'propiedad privada');

INSERT INTO document_tags (document_id, tag_id)
SELECT d.id, t.id FROM documents d, tags t 
WHERE d.title LIKE '%Código Penal%' AND t.name IN ('derecho penal');

INSERT INTO document_tags (document_id, tag_id)
SELECT d.id, t.id FROM documents d, tags t 
WHERE d.case_number = '3340-2018' AND t.name IN ('derecho laboral', 'despido');

INSERT INTO document_tags (document_id, tag_id)
SELECT d.id, t.id FROM documents d, tags t 
WHERE d.case_number = '4783-2020' AND t.name IN ('derecho constitucional', 'amparo', 'seguridad social', 'derechos humanos');

INSERT INTO document_tags (document_id, tag_id)
SELECT d.id, t.id FROM documents d, tags t 
WHERE d.case_number = '5901-2019' AND t.name IN ('derecho constitucional', 'amparo', 'libertad de expresión', 'derechos humanos');

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_log ENABLE ROW LEVEL SECURITY;

-- Política: cualquiera puede leer documentos activos (lectura pública)
CREATE POLICY "Documents are publicly readable"
  ON documents FOR SELECT
  USING (is_active = TRUE);

-- Política: tags son públicos
CREATE POLICY "Tags are publicly readable"
  ON tags FOR SELECT
  USING (TRUE);

-- Política: document_tags son públicos
CREATE POLICY "Document tags are publicly readable"
  ON document_tags FOR SELECT
  USING (TRUE);

-- Nota: Para INSERT/UPDATE/DELETE se necesitará autenticación (se agrega en Fase 4)

-- ============================================================
-- FIN DEL ESQUEMA
-- ============================================================

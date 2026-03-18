import { supabase } from './supabase'

/**
 * Buscar documentos legales en la base de datos.
 * Usa la función search_documents definida en PostgreSQL.
 */
export async function searchDocuments({
  query = '',
  docType = null,
  legalArea = null,
  source = null,
  dateFrom = null,
  dateTo = null,
  limit = 20,
  offset = 0,
}) {
  const { data, error } = await supabase.rpc('search_documents', {
    search_query: query || '',
    filter_doc_type: docType,
    filter_legal_area: legalArea,
    filter_source: source,
    filter_date_from: dateFrom,
    filter_date_to: dateTo,
    result_limit: limit,
    result_offset: offset,
  })

  if (error) {
    console.error('Error en búsqueda:', error)
    throw new Error('No se pudo completar la búsqueda. Intenta de nuevo.')
  }

  return data || []
}

/**
 * Obtener un documento completo por ID.
 */
export async function getDocument(id) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error al obtener documento:', error)
    throw new Error('No se pudo cargar el documento.')
  }

  return data
}

/**
 * Obtener estadísticas generales de la base de datos.
 */
export async function getStats() {
  const { count: totalDocs } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { data: typeCounts } = await supabase
    .from('documents')
    .select('doc_type')
    .eq('is_active', true)

  const byType = {}
  if (typeCounts) {
    typeCounts.forEach(function (doc) {
      byType[doc.doc_type] = (byType[doc.doc_type] || 0) + 1
    })
  }

  return {
    total: totalDocs || 0,
    byType: byType,
  }
}

export default function TestePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#111', color: '#eee', minHeight: '100vh' }}>
      <h1>Diagnóstico de Variáveis</h1>
      <pre>
        SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NÃO DEFINIDA'}
        {'\n'}
        ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
          ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 40) + '...' 
          : 'NÃO DEFINIDA'}
      </pre>
    </div>
  )
}

'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Check, Image as ImageIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ConfiguracoesClient({ config }: { config: any }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [logoUrl, setLogoUrl] = useState(config?.logo_url || '')
  const [preview, setPreview] = useState(config?.logo_url || '')
  const [uploading, setUploading] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setErro('')
    setSucesso('')

    // Preview local
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `logo/logo-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('sistema')
      .upload(path, file, { upsert: true })

    if (uploadError) { setErro(uploadError.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('sistema').getPublicUrl(path)

    const { error: updateError } = await supabase
      .from('configuracoes')
      .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', 'default')

    if (updateError) { setErro(updateError.message); setUploading(false); return }

    setLogoUrl(publicUrl)
    setSucesso('Logo atualizada! Recarregue a página para ver em todo o sistema.')
    setUploading(false)
    router.refresh()
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: '600', color: 'hsl(45 20% 92%)' }}>Configurações</h1>
        <p style={{ color: 'hsl(45 8% 45%)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Personalização do sistema</p>
      </div>

      <div className="card-base" style={{ padding: '1.75rem', borderColor: 'hsl(43 30% 22%)' }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'hsl(45 20% 88%)', marginBottom: '1.25rem' }}>Logo do Sistema</h2>

        {/* Preview */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'hsl(43 30% 15%)', border: '1px solid hsl(43 40% 25%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {preview ? (
              <img src={preview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
            ) : (
              <ImageIcon size={28} color="hsl(43 72% 58%)" />
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'hsl(45 15% 75%)', marginBottom: '0.25rem', fontWeight: '500' }}>
              {preview ? 'Logo atual' : 'Nenhuma logo configurada'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(45 8% 45%)' }}>
              PNG, JPG ou SVG — máx. 5MB
            </div>
          </div>
        </div>

        {/* Upload */}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-gold"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: uploading ? 0.7 : 1 }}
        >
          <Upload size={15} />
          {uploading ? 'Enviando...' : 'Trocar Logo'}
        </button>

        {sucesso && (
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'hsl(142 60% 45% / 0.1)', border: '1px solid hsl(142 60% 45% / 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(142 60% 55%)' }}>
            <Check size={14} /> {sucesso}
          </div>
        )}
        {erro && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.3)', borderRadius: '6px', fontSize: '0.8rem', color: 'hsl(0 72% 65%)' }}>
            {erro}
          </div>
        )}
      </div>
    </div>
  )
}

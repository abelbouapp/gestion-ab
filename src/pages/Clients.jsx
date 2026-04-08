import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Building2, User } from 'lucide-react'
import { useClients } from '../hooks/useData'
import { useInvoices } from '../hooks/useInvoices'
import { Avatar, Btn, Empty, Spinner } from '../components/UI'
import { formatCurrency, getColor } from '../utils/helpers'
import ClientModal from '../components/ClientModal'
import s from './Clients.module.css'

export default function Clients() {
  const navigate = useNavigate()
  const { clients, loading, addClient } = useClients()
  const { invoices } = useInvoices()
  const [search, setSearch] = useState('')
  const [modal,  setModal]  = useState(false)

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleSave(data) {
    const color = getColor(clients.length)
    await addClient({ ...data, color })
    setModal(false)
  }

  if (loading) return <div className={s.page}><Spinner /></div>

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Clientes</h1>
          <p className={s.sub}>{clients.length} clientes</p>
        </div>
        <Btn onClick={() => setModal(true)} icon={<Plus size={15}/>}>Nuevo cliente</Btn>
      </div>

      <div className={s.searchWrap}>
        <Search size={14} className={s.searchIcon} />
        <input className={s.search} placeholder="Buscar cliente..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0
        ? <Empty message={clients.length === 0 ? 'Sin clientes aún. ¡Crea el primero!' : 'Sin resultados'} />
        : (
          <div className={s.list}>
            {filtered.map((c, i) => {
              const billed = invoices.filter(inv => inv.client_id === c.id)
                .reduce((sum, inv) => sum + (inv.total || 0), 0)
              return (
                <div key={c.id} className={s.row} onClick={() => navigate(`/clientes/${c.id}`)}>
                  <div className={s.stripe} style={{ background: c.color || getColor(i) }} />
                  <Avatar name={c.name} color={c.color || getColor(i)} size={42} />
                  <div className={s.info}>
                    <div className={s.name}>
                      {c.name}
                      {c.is_company
                        ? <span className={s.typeTag}><Building2 size={11}/> Empresa/Autónomo</span>
                        : <span className={s.typeTag}><User size={11}/> Particular</span>
                      }
                    </div>
                    <div className={s.meta}>{c.email}{c.phone ? ` · ${c.phone}` : ''}</div>
                  </div>
                  <div className={s.chips}>
                    {c.nif && <span className={s.chip}>{c.nif}</span>}
                    <span className={`${s.chip} ${s.chipGreen}`}>{formatCurrency(billed)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      }

      {modal && <ClientModal onSave={handleSave} onClose={() => setModal(false)} />}
    </div>
  )
}

import React, { useState } from 'react'

export default function GeneratePdfButton({ payload }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await window.electron?.generatePdf(payload)
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Gerando...' : 'Gerar PDF'}
    </button>
  )
}


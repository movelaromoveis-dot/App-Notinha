import { useEffect, useState } from 'react'
import { ipcRenderer } from 'electron'

export function UpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)

  useEffect(() => {
    if (!window.electron) return

    const handleUpdateAvailable = () => {
      console.log('Update available notification received')
      setUpdateAvailable(true)
    }

    const handleUpdateDownloaded = () => {
      console.log('Update downloaded, ready to install')
      setUpdateDownloaded(true)
      setUpdateAvailable(false)
    }

    ipcRenderer?.on('update-available', handleUpdateAvailable)
    ipcRenderer?.on('update-downloaded', handleUpdateDownloaded)

    return () => {
      ipcRenderer?.removeListener('update-available', handleUpdateAvailable)
      ipcRenderer?.removeListener('update-downloaded', handleUpdateDownloaded)
    }
  }, [])

  const handleInstallUpdate = async () => {
    try {
      await ipcRenderer?.invoke('install-update')
    } catch (err) {
      console.error('Failed to install update:', err)
    }
  }

  const handleDismiss = () => {
    setUpdateAvailable(false)
    setUpdateDownloaded(false)
  }

  if (!updateAvailable && !updateDownloaded) return null

  return (
    <div style={styles.container}>
      <div style={styles.notification}>
        <h3 style={styles.title}>
          {updateDownloaded ? '✓ Atualização Pronta' : '⬇ Atualização Disponível'}
        </h3>
        <p style={styles.message}>
          {updateDownloaded
            ? 'A atualização foi baixada. Clique em "Instalar Agora" para reiniciar e aplicar.'
            : 'Uma nova versão do Notafacil está disponível. Será baixada em background.'}
        </p>
        <div style={styles.actions}>
          {updateDownloaded && (
            <button onClick={handleInstallUpdate} style={{ ...styles.button, ...styles.primaryButton }}>
              Instalar Agora
            </button>
          )}
          <button onClick={handleDismiss} style={{ ...styles.button, ...styles.secondaryButton }}>
            {updateDownloaded ? 'Depois' : 'Fechar'}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
  },
  notification: {
    backgroundColor: '#f0f8ff',
    border: '1px solid #0066cc',
    borderRadius: '8px',
    padding: '16px',
    maxWidth: '400px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 8px 0',
    color: '#0066cc',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  message: {
    margin: '0 0 12px 0',
    color: '#333',
    fontSize: '14px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  button: {
    padding: '8px 16px',
    fontSize: '13px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  primaryButton: {
    backgroundColor: '#0066cc',
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    color: '#333',
  },
}

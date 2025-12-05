const BASE_URL = process.env.BACKEND_URL || 'http://localhost:4000'

export async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  return res.json()
}

export async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return res.json()
}


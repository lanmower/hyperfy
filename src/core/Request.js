
export class Request {
  constructor(type, payload = {}, options = {}) {
    this.type = type
    this.payload = payload
    this.id = options.id || crypto.randomUUID()
    this.src = options.src || null
    this.dst = options.dst || null
    this.timeout = options.timeout || 5000
    this.created = Date.now()
  }

  static async send(net, type, payload, options = {}) {
    const req = new Request(type, payload, options)
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Request timeout: ${type}`))
      }, req.timeout)

      net.once(`response:${req.id}`, (res) => {
        clearTimeout(timer)
        if (res.error) reject(new Error(res.error))
        else resolve(res.data)
      })

      net.send(`request`, req)
    })
  }

  static handle(net, type, fn) {
    net.on(`request`, async (req) => {
      if (req.type !== type) return
      try {
        const data = await fn(req.payload, req)
        net.send(`response`, { id: req.id, data })
      } catch (err) {
        net.send(`response`, { id: req.id, error: err.message })
      }
    })
  }

  serialize() {
    return {
      type: this.type,
      payload: this.payload,
      id: this.id,
      src: this.src,
      dst: this.dst
    }
  }

  static deserialize(data) {
    return new Request(data.type, data.payload, { id: data.id, src: data.src, dst: data.dst })
  }
}

export class Response {
  constructor(id, data = null, error = null) {
    this.id = id
    this.data = data
    this.error = error
  }

  serialize() {
    return { id: this.id, data: this.data, error: this.error }
  }

  static deserialize(data) {
    return new Response(data.id, data.data, data.error)
  }
}
